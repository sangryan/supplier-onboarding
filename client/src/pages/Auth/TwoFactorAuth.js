import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, TextField, Button } from '@mui/material';
import AuthLayout from '../../components/Auth/AuthLayout';
import { useAuth } from '../../context/AuthContext';

const TwoFactorAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { login } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const inputRefs = useRef([]);

  // Get email from location state (passed from login)
  const email = location.state?.email || '';

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
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
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
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

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

    // Check if all fields are filled
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);

    // TODO: Implement 2FA verification API call
    // const result = await verify2FA(email, otpCode);
    // if (result.success) {
    //   navigate('/dashboard');
    // } else {
    //   setError(result.message);
    // }

    // Temporary: Just navigate to dashboard for now
    setTimeout(() => {
      navigate('/dashboard');
      setLoading(false);
    }, 1000);
  };

  const handleResendCode = async () => {
    if (countdown > 0) return; // Don't allow resend if countdown is active
    
    setError('');
    setCountdown(300); // Reset countdown to 5 minutes
    setOtp(['', '', '', '', '', '']); // Clear OTP inputs
    
    // TODO: Implement resend code API call
    // await resend2FACode(email);
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
          textAlign: 'center', 
          fontSize: { xs: '13px', sm: '14px' }, 
          lineHeight: 1.6,
          px: { xs: 2, sm: 0 }
        }}
      >
        We've sent a verification code to your phone number. Enter the code below to confirm your identity.
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
                  '& fieldset': {
                    borderColor: '#d1d5db',
                    borderRadius: '8px',
                  },
                  '&:hover fieldset': {
                    borderColor: '#9ca3af',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1976d2',
                    borderWidth: '2px',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  padding: { xs: '12px 0', sm: '14px 0', md: '16px 0' },
                  fontSize: { xs: '16px', sm: '18px', md: '20px' },
                  fontWeight: 600,
                  color: '#000',
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
            fontSize: '14px',
            color: '#666',
          }}
        >
          Didn't receive a code ?{' '}
          <Box
            component="span"
            onClick={handleResendCode}
            sx={{
              color: countdown > 0 ? '#999' : '#1976d2',
              cursor: countdown > 0 ? 'default' : 'pointer',
              fontWeight: 500,
              '&:hover': countdown === 0 ? {
                textDecoration: 'underline',
              } : {},
            }}
          >
            Resend in {formatTime(countdown)}
          </Box>
        </Typography>
      </Box>
    </AuthLayout>
  );
};

export default TwoFactorAuth;

