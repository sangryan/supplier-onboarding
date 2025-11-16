import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, TextField, Button } from '@mui/material';
import AuthLayout from '../../components/Auth/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { checkSupplierProfileComplete } from '../../utils/profileCheck';

const TwoFactorAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { verifyOTP, resendOTP } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds
  const inputRefs = useRef([]);

  // Get email and source from location state
  const email = location.state?.email || '';
  const from = location.state?.from || 'register'; // 'register' or 'login'

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      console.log('🟡 [2FA] No email provided, redirecting to', from === 'login' ? '/login' : '/register');
      navigate(from === 'login' ? '/login' : '/register');
    } else {
      console.log('🟢 [2FA] Email provided:', email, 'from:', from);
    }
  }, [email, from, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Format countdown as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    // Allow alphanumeric characters (numbers and uppercase letters)
    if (value && !/^[0-9A-Z]$/i.test(value)) return;

    // Convert to uppercase
    const upperValue = value.toUpperCase();

    const newOtp = [...otp];
    newOtp[index] = upperValue;
    setOtp(newOtp);

    // Auto-focus next input
    if (upperValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').toUpperCase().slice(0, 6);
    if (!/^[0-9A-Z]+$/.test(pastedData)) return;

    const newOtp = pastedData.split('');
    while (newOtp.length < 6) newOtp.push('');
    setOtp(newOtp);

    // Focus last filled input or first empty
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    // Check if all fields are filled
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter all 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await verifyOTP(email, otpCode);
      
      if (result.success) {
        // Check if supplier profile is complete
        if (result.user?.role === 'supplier') {
          const profileComplete = await checkSupplierProfileComplete(result.user);
          if (profileComplete) {
            navigate('/dashboard');
          } else {
            navigate('/profile');
          }
        } else if (result.user?.role === 'procurement' || result.user?.role === 'legal') {
          // Procurement and Legal users go to dashboard (ProcurementDashboard)
          navigate('/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.message || 'Invalid OTP code');
        setLoading(false);
      }
    } catch (error) {
      setError(error.message || 'Failed to verify OTP');
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || resending) return; // Don't allow resend if countdown is active or already resending
    
    if (!email) {
      setError('Email is required');
      return;
    }
    
    setError('');
    setResending(true);
    
    try {
      const result = await resendOTP(email);
      if (result.success) {
        setCountdown(600); // Reset countdown to 10 minutes
        setOtp(['', '', '', '', '', '']); // Clear OTP inputs
      }
    } catch (error) {
      setError('Failed to resend OTP code');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout>
      <Typography 
        variant="h4" 
        sx={{ 
          fontWeight: 'bold', 
          mb: 1, 
          color: '#000', 
          textAlign: 'center',
          fontSize: { xs: '24px', sm: '28px', md: '34px' }
        }}
      >
        Enter OTP Code
      </Typography>
      <Typography 
        sx={{ 
          color: '#666', 
          mb: 4, 
          textAlign: { xs: 'center', sm: 'left' }, 
          fontSize: { xs: '14px', sm: '16px' }, 
          lineHeight: 1.6
        }}
      >
        {email ? (
          <>We've sent a 6-character verification code to <strong>{email}</strong>. Enter the code below to verify your email address.</>
        ) : (
          <>We've sent a 6-character verification code to your email. Enter the code below to verify your email address.</>
        )}
      </Typography>

      {/* Error Message */}
      {error && (
        <Box
          sx={{
            mb: 3,
            p: 1.5,
            backgroundColor: '#ffebee',
            borderRadius: 1,
            color: '#c62828',
            fontSize: '14px',
            textAlign: 'center',
          }}
        >
          {error}
        </Box>
      )}

      {/* OTP Form */}
      <Box component="form" onSubmit={handleSubmit}>
        {/* OTP Input Boxes */}
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 1, sm: 1.5 },
            justifyContent: 'center',
            mb: 3,
          }}
        >
          {otp.map((digit, index) => (
            <TextField
              key={index}
              inputRef={(ref) => (inputRefs.current[index] = ref)}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              inputProps={{
                maxLength: 1,
                style: { textAlign: 'center' },
              }}
              sx={{
                width: { xs: '40px', sm: '48px', md: '56px' },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  '& fieldset': {
                    borderColor: '#d1d5db',
                    borderRadius: '8px',
                  },
                  '&:hover fieldset': {
                    borderColor: '#9ca3af',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1976d2',
                    borderWidth: '1px',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  padding: { xs: '12px 0', sm: '14px 0', md: '16px 0' },
                  fontSize: { xs: '16px', sm: '18px', md: '20px' },
                  fontWeight: 600,
                  color: '#000',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                },
              }}
            />
          ))}
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{
            backgroundColor: theme.palette.green.main,
            color: '#fff',
            textTransform: 'none',
            fontSize: '15px',
            fontWeight: 600,
            height: '48px',
            borderRadius: '8px',
            boxShadow: 'none',
            mb: 3,
            '&:hover': {
              backgroundColor: theme.palette.green.hover,
              boxShadow: 'none',
            },
            '&:disabled': {
              backgroundColor: theme.palette.neutral.gray[300],
              color: theme.palette.text.disabled,
            },
          }}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </Button>

        {/* Resend Link with Countdown */}
        <Typography
          sx={{
            textAlign: 'center',
            fontSize: '13px',
            color: '#666',
            mt: 2,
          }}
        >
          Didn't receive a code?{' '}
          <Box
            component="span"
            onClick={handleResendCode}
            sx={{
              color: (countdown > 0 || resending) ? '#999' : '#578A18',
              cursor: (countdown > 0 || resending) ? 'default' : 'pointer',
              fontWeight: 500,
              '&:hover': (countdown === 0 && !resending) ? {
                color: '#467014',
                textDecoration: 'underline',
              } : {},
            }}
          >
            {resending ? 'Sending...' : countdown > 0 ? `Resend in ${formatTime(countdown)}` : 'Resend Code'}
          </Box>
        </Typography>
      </Box>
    </AuthLayout>
  );
};

export default TwoFactorAuth;

