import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, TextField, Button } from '@mui/material';
import AuthLayout from '../../components/Auth/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { checkSupplierProfileComplete } from '../../utils/profileCheck';

const TOTPVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { verifyTOTP } = useAuth();

  const email = location.state?.email || '';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isBackup, setIsBackup] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) navigate('/login', { replace: true });
  }, [email, navigate]);

  const handleChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = pasted.split('');
    while (next.length < 6) next.push('');
    setCode(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const totpCode = isBackup ? backupCode.trim().toUpperCase() : code.join('');
    if (!isBackup && totpCode.length < 6) { setError('Enter all 6 digits'); return; }
    if (isBackup && !totpCode) { setError('Enter your backup code'); return; }
    setLoading(true);
    const result = await verifyTOTP(email, totpCode);
    setLoading(false);
    if (result.success) {
      const user = result.user;
      if (user.role === 'supplier') {
        const profileComplete = await checkSupplierProfileComplete(user);
        navigate(profileComplete ? '/dashboard' : '/profile');
      } else if (user.mustChangePassword) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.message || 'Invalid code');
    }
  };

  const otpInputSx = {
    width: { xs: '40px', sm: '48px', md: '56px' },
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#fff',
      '& fieldset': { borderColor: '#d1d5db', borderRadius: '8px' },
      '&:hover fieldset': { borderColor: '#9ca3af' },
      '&.Mui-focused fieldset': { borderColor: '#578A18', borderWidth: '1px' },
    },
    '& .MuiOutlinedInput-input': {
      padding: { xs: '12px 0', sm: '14px 0', md: '16px 0' },
      fontSize: { xs: '18px', sm: '20px' },
      fontWeight: 600,
      color: '#000',
      textAlign: 'center',
    },
  };

  return (
    <AuthLayout>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: '#000', textAlign: 'center', fontSize: { xs: '22px', sm: '28px' } }}>
        Two-Factor Authentication
      </Typography>
      <Typography sx={{ color: '#666', mb: 4, textAlign: 'center', fontSize: '14px', lineHeight: 1.6 }}>
        {isBackup
          ? 'Enter one of your backup codes.'
          : 'Open your authenticator app and enter the 6-digit code.'}
      </Typography>

      {error && (
        <Box sx={{ mb: 3, p: 1.5, backgroundColor: '#ffebee', borderRadius: 1, color: '#c62828', fontSize: '14px', textAlign: 'center' }}>
          {error}
        </Box>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        {isBackup ? (
          <TextField
            fullWidth
            label="Backup code"
            value={backupCode}
            onChange={e => setBackupCode(e.target.value)}
            inputProps={{ style: { fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase' } }}
            sx={{ mb: 3 }}
          />
        ) : (
          <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, justifyContent: 'center', mb: 3 }}>
            {code.map((digit, i) => (
              <TextField
                key={i}
                inputRef={ref => (inputRefs.current[i] = ref)}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                inputProps={{ maxLength: 1, style: { textAlign: 'center' } }}
                sx={otpInputSx}
              />
            ))}
          </Box>
        )}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{ backgroundColor: theme.palette.green.main, color: '#fff', textTransform: 'none', fontSize: '15px', fontWeight: 600, height: '48px', borderRadius: '8px', boxShadow: 'none', mb: 2, '&:hover': { backgroundColor: theme.palette.green.hover, boxShadow: 'none' }, '&:disabled': { backgroundColor: '#d1d5db' } }}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </Button>

        <Typography sx={{ textAlign: 'center', fontSize: '13px', color: '#666' }}>
          <Box
            component="span"
            onClick={() => { setIsBackup(b => !b); setError(''); setCode(['', '', '', '', '', '']); setBackupCode(''); }}
            sx={{ color: '#578A18', cursor: 'pointer', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}
          >
            {isBackup ? 'Use authenticator app instead' : 'Use a backup code instead'}
          </Box>
        </Typography>
      </Box>
    </AuthLayout>
  );
};

export default TOTPVerify;
