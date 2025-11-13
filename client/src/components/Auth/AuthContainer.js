import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, TextField, Button } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from './AuthLayout';
import TabSwitcher from './TabSwitcher';

const AuthContainer = ({ mode = 'login' }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState(mode === 'register' ? 1 : 0);
  const [step, setStep] = useState('auth'); // 'auth' or '2fa'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    verificationCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegister = activeTab === 1;

  const tabs = [
    { label: 'Sign In' },
    { label: 'Create account' },
  ];

  const handleTabChange = (tabIndex) => {
    setActiveTab(tabIndex);
    setError('');
    // Navigate to the appropriate route
    if (tabIndex === 0) {
      navigate('/login');
    } else {
      navigate('/register');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (step === 'auth') {
      if (isRegister) {
        // Register
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters');
          return;
        }

        setLoading(true);

        // Split name into firstName and lastName
        const nameParts = formData.name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || nameParts[0] || 'User';

        const userData = {
          firstName,
          lastName,
          email: formData.email,
          password: formData.password,
        };

        const result = await register(userData);

        if (result.success) {
          navigate('/dashboard');
        } else {
          setError(result.message);
        }

        setLoading(false);
      } else {
        // Login
        setLoading(true);

        const result = await login(formData.email, formData.password);

        if (result.success) {
          // Check if 2FA is enabled (for future implementation)
          // if (result.requires2FA) {
          //   setStep('2fa');
          //   setLoading(false);
          //   return;
          // }
          navigate('/dashboard');
        } else {
          setError(result.message);
        }

        setLoading(false);
      }
    } else if (step === '2fa') {
      // Handle 2FA verification (future implementation)
      setLoading(true);
      // Verify 2FA code
      // const result = await verify2FA(formData.email, formData.verificationCode);
      // if (result.success) {
      //   navigate('/dashboard');
      // } else {
      //   setError(result.message);
      // }
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {step === 'auth' ? (
        <>
          {/* Title */}
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 'bold', 
              mb: 1, 
              color: '#000',
              fontSize: { xs: '24px', sm: '28px', md: '34px' },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            {isRegister ? 'Get started' : 'Welcome back'}
          </Typography>
          <Typography 
            sx={{ 
              color: '#666', 
              mb: 4,
              fontSize: { xs: '14px', sm: '16px' },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            {isRegister
              ? 'Set up your profile in a few seconds.'
              : 'Sign in to your account to continue.'}
          </Typography>

          {/* Tabs */}
          <TabSwitcher activeTab={activeTab} onTabChange={handleTabChange} tabs={tabs} />

          {/* Error Message */}
          {error && (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                backgroundColor: '#ffebee',
                borderRadius: 1,
                color: '#c62828',
                fontSize: '14px',
              }}
            >
              {error}
            </Box>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit}>
            {isRegister && (
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ mb: 0.75, fontSize: '15px', fontWeight: 600, color: '#000' }}>
                  Name
                </Typography>
                <TextField
                  required
                  fullWidth
                  name="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleChange}
                  sx={{
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
                      padding: '12px 14px',
                      fontSize: '15px',
                    },
                  }}
                />
              </Box>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ mb: 0.75, fontSize: '15px', fontWeight: 600, color: '#000' }}>
                Email
              </Typography>
              <TextField
                required
                fullWidth
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                sx={{
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
                    padding: '12px 14px',
                    fontSize: '15px',
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ mb: 0.75, fontSize: '15px', fontWeight: 600, color: '#000' }}>
                Password
              </Typography>
              <TextField
                required
                fullWidth
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                sx={{
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
                    padding: '12px 14px',
                    fontSize: '15px',
                  },
                }}
              />
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
                mb: 2.5,
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
              {loading
                ? isRegister
                  ? 'Creating account...'
                  : 'Signing in...'
                : isRegister
                ? 'Create account'
                : 'SIGN IN'}
            </Button>

            {/* OR Divider */}
            <Box sx={{ display: 'flex', alignItems: 'center', my: 2.5 }}>
              <Box sx={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }} />
              <Typography sx={{ px: 2, color: '#999', fontSize: '14px' }}>
                OR
              </Typography>
              <Box sx={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }} />
            </Box>

            {/* Google Sign In */}
            <Button
              fullWidth
              variant="outlined"
              sx={{
                backgroundColor: '#fff',
                color: '#666',
                textTransform: 'none',
                fontSize: '15px',
                fontWeight: 500,
                height: '48px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#f9fafb',
                  border: '1px solid #d1d5db',
                  boxShadow: 'none',
                },
              }}
            >
              <Box
                component="img"
                src="https://www.google.com/favicon.ico"
                alt="Google"
                sx={{ width: 18, height: 18, mr: 1.5 }}
              />
              Sign in with Google
            </Button>

            {/* Test 2FA Link - Remove in production */}
            <Typography sx={{ textAlign: 'center', mt: 3, fontSize: '13px' }}>
              <Box
                component="span"
                onClick={() => navigate('/2fa')}
                sx={{
                  color: '#999',
                  cursor: 'pointer',
                  '&:hover': {
                    color: '#1976d2',
                    textDecoration: 'underline',
                  },
                }}
              >
                Test 2FA Page →
              </Box>
            </Typography>
          </Box>
        </>
      ) : (
        <>
          {/* 2FA Step */}
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>
            Two-Factor Authentication
          </Typography>
          <Typography sx={{ color: '#666', mb: 4 }}>
            Enter the verification code sent to your email.
          </Typography>

          {/* Error Message */}
          {error && (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                backgroundColor: '#ffebee',
                borderRadius: 1,
                color: '#c62828',
                fontSize: '14px',
              }}
            >
              {error}
            </Box>
          )}

          {/* 2FA Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ mb: 0.75, fontSize: '15px', fontWeight: 600, color: '#000' }}>
                Verification Code
              </Typography>
              <TextField
                required
                fullWidth
                name="verificationCode"
                placeholder="Enter 6-digit code"
                value={formData.verificationCode}
                onChange={handleChange}
                inputProps={{ maxLength: 6 }}
                sx={{
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
                    padding: '12px 14px',
                    fontSize: '15px',
                    textAlign: 'center',
                    letterSpacing: '0.5em',
                  },
                }}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                backgroundColor: '#5A9F5E',
                color: '#fff',
                textTransform: 'none',
                fontSize: '15px',
                fontWeight: 600,
                height: '48px',
                borderRadius: '8px',
                boxShadow: 'none',
                mb: 2,
                '&:hover': {
                  backgroundColor: '#4a8f4e',
                  boxShadow: 'none',
                },
                '&:disabled': {
                  backgroundColor: '#e0e0e0',
                  color: '#9e9e9e',
                },
              }}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={() => setStep('auth')}
              sx={{
                color: '#666',
                textTransform: 'none',
                fontSize: '14px',
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: '#1976d2',
                },
              }}
            >
              Back to login
            </Button>
          </Box>
        </>
      )}
    </AuthLayout>
  );
};

export default AuthContainer;

