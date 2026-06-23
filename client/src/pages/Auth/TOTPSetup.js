import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, TextField, Button, Divider, Chip } from '@mui/material';
import AuthLayout from '../../components/Auth/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { checkSupplierProfileComplete } from '../../utils/profileCheck';

const TOTPSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { setupTOTP } = useAuth();

  const email = location.state?.email || '';
  const qrCode = location.state?.qrCode || '';
  const secret = location.state?.secret || '';

  const [step, setStep] = useState('scan'); // 'scan' | 'backup'
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [backupCodes, setBackupCodes] = useState([]);
  const [completedUser, setCompletedUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email || !qrCode) navigate('/login', { replace: true });
  }, [email, qrCode, navigate]);

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

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    const totpCode = code.join('');
    if (totpCode.length < 6) { setError('Enter all 6 digits'); return; }
    setLoading(true);
    const result = await setupTOTP(email, totpCode);
    setLoading(false);
    if (result.success) {
      setBackupCodes(result.backupCodes);
      setCompletedUser(result.user);
      setStep('backup');
    } else {
      setError(result.message || 'Invalid code');
    }
  };

  const handleDone = async () => {
    if (!completedUser) return;
    if (completedUser.role === 'supplier') {
      const profileComplete = await checkSupplierProfileComplete(completedUser);
      navigate(profileComplete ? '/dashboard' : '/profile');
    } else if (completedUser.mustChangePassword) {
      navigate('/change-password');
    } else {
      navigate('/dashboard');
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

  if (step === 'backup') {
    return (
      <AuthLayout>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: '#000', textAlign: 'center', fontSize: { xs: '22px', sm: '26px' } }}>
          Save Your Backup Codes
        </Typography>
        <Typography sx={{ color: '#666', mb: 3, textAlign: 'center', fontSize: '14px', lineHeight: 1.6 }}>
          Store these codes somewhere safe. Each can be used <strong>once</strong> if you lose access to your authenticator app.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 3 }}>
          {backupCodes.map((c, i) => (
            <Box key={i} sx={{ background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '8px', p: 1.5, textAlign: 'center' }}>
              <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '15px', letterSpacing: '2px', color: '#111' }}>
                {c}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', p: 1.5, mb: 3 }}>
          <Typography sx={{ fontSize: '13px', color: '#7a5c00' }}>
            These codes will not be shown again. If you lose both your phone and backup codes, you will be locked out.
          </Typography>
        </Box>

        <Button
          fullWidth
          variant="contained"
          onClick={handleDone}
          sx={{ backgroundColor: theme.palette.green.main, color: '#fff', textTransform: 'none', fontSize: '15px', fontWeight: 600, height: '48px', borderRadius: '8px', boxShadow: 'none', '&:hover': { backgroundColor: theme.palette.green.hover, boxShadow: 'none' } }}
        >
          I've saved my backup codes
        </Button>
      </AuthLayout>
    );
  }

  const steps = [
    {
      number: '1',
      title: 'Download an authenticator app',
      body: (
        <>
          Install <strong>Google Authenticator</strong> or <strong>Authy</strong> on your phone.{' '}
          Available on the App Store (iPhone) and Google Play (Android).
        </>
      ),
    },
    {
      number: '2',
      title: 'Add a new account',
      body: 'Open the app, tap the "+" button (or "Add account"), then choose "Scan a QR code".',
    },
    {
      number: '3',
      title: 'Scan the QR code',
      body: 'Point your camera at the QR code below. The app will add your account automatically.',
    },
    {
      number: '4',
      title: 'Enter the code to confirm',
      body: 'Type the 6-digit code shown in the app into the box at the bottom of this page.',
    },
  ];

  return (
    <AuthLayout>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5, color: '#000', textAlign: 'center', fontSize: { xs: '22px', sm: '26px' } }}>
        Set Up Two-Factor Authentication
      </Typography>
      <Typography sx={{ color: '#666', mb: 3, textAlign: 'center', fontSize: '13px', lineHeight: 1.6 }}>
        This keeps your account secure by requiring a code from your phone on every login.
      </Typography>

      {/* Step-by-step instructions */}
      <Box sx={{ mb: 3 }}>
        {steps.map(s => (
          <Box key={s.number} sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'flex-start' }}>
            <Box sx={{ minWidth: 28, height: 28, borderRadius: '50%', backgroundColor: '#578A18', display: 'flex', alignItems: 'center', justifyContent: 'center', mt: '1px' }}>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>{s.number}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: '13px', color: '#111', mb: 0.25 }}>{s.title}</Typography>
              <Typography sx={{ fontSize: '13px', color: '#555', lineHeight: 1.5 }}>{s.body}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* QR Code */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Box component="img" src={qrCode} alt="QR Code" sx={{ width: 180, height: 180, border: '1px solid #e0e0e0', borderRadius: '12px', p: 1, background: '#fff' }} />
      </Box>

      {/* Manual entry */}
      <Divider sx={{ mb: 2 }}><Chip label="can't scan? enter this key manually" size="small" sx={{ fontSize: '11px' }} /></Divider>
      <Box sx={{ background: '#f5f5f5', borderRadius: '8px', p: 1.5, mb: 3, textAlign: 'center' }}>
        <Typography sx={{ fontFamily: 'monospace', fontSize: '13px', letterSpacing: '1px', color: '#333', wordBreak: 'break-all' }}>
          {secret}
        </Typography>
      </Box>

      {/* Code entry */}
      <Typography sx={{ fontWeight: 600, mb: 1.5, fontSize: '14px', color: '#333', textAlign: 'center' }}>
        Step 4 — Enter the 6-digit code from your app:
      </Typography>

      {error && (
        <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#ffebee', borderRadius: 1, color: '#c62828', fontSize: '14px', textAlign: 'center' }}>
          {error}
        </Box>
      )}

      <Box component="form" onSubmit={handleVerify}>
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

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{ backgroundColor: theme.palette.green.main, color: '#fff', textTransform: 'none', fontSize: '15px', fontWeight: 600, height: '48px', borderRadius: '8px', boxShadow: 'none', '&:hover': { backgroundColor: theme.palette.green.hover, boxShadow: 'none' }, '&:disabled': { backgroundColor: '#d1d5db' } }}
        >
          {loading ? 'Verifying...' : 'Confirm & Activate'}
        </Button>
      </Box>
    </AuthLayout>
  );
};

export default TOTPSetup;
