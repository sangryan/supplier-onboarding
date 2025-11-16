import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, TextField, Button } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { checkSupplierProfileComplete } from '../../utils/profileCheck';
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
    confirmPassword: '',
    verificationCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasFailedLogin, setHasFailedLogin] = useState(false);

  const isRegister = activeTab === 1;

  const tabs = [
    { label: 'Sign In' },
    { label: 'Create account' },
  ];

  const handleTabChange = (tabIndex) => {
    setActiveTab(tabIndex);
    setError('');
    setHasFailedLogin(false); // Reset failed login flag when switching tabs
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
    e.stopPropagation();
    setError('');

    if (step === 'auth') {
      if (isRegister) {
        // Register - Validate
        if (!formData.name.trim()) {
          setError('Full name is required');
          return;
        }
        
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters');
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }

        setLoading(true);
        
        // Clear any existing token/user before registration to prevent conflicts
        console.log('🟡 [AUTH] Clearing any existing auth state before registration');
        localStorage.removeItem('token');
        // Note: We can't directly clear user from context here, but removing token
        // will prevent checkAuth from setting user on next check

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

        try {
          const result = await register(userData);
          console.log('🟢 [AUTH] Registration result:', JSON.stringify(result, null, 2));

          if (result && result.success) {
            // Check if email verification is required
            if (result.requiresVerification) {
              console.log('🟡 [AUTH] Email verification required - navigating to 2FA');
              console.log('🟡 [AUTH] Email:', formData.email);
              // Clear any existing error
              setError('');
              // IMPORTANT: Use setTimeout to ensure state updates complete before navigation
              setTimeout(() => {
                console.log('🟡 [AUTH] Executing navigation to /2fa');
                navigate('/2fa', { 
                  replace: true,
                  state: { email: formData.email || result.email, from: 'register' } 
                });
              }, 100);
              setLoading(false);
              return; // Exit early to prevent setLoading(false) from running again
            } else if (result.user?.role === 'supplier') {
              // New suppliers should be directed to the application form first
              console.log('🟢 [AUTH] Supplier registered, navigating to application form');
              navigate('/application/new');
            } else {
              console.log('🟢 [AUTH] User registered, navigating to dashboard');
              navigate('/dashboard');
            }
          } else {
            console.error('🔴 [AUTH] Registration failed:', result?.message);
            setError(result?.message || 'Registration failed');
          }
        } catch (error) {
          console.error('🔴 [AUTH] Registration error in handleSubmit:', error);
          setError(error.message || 'Registration failed. Please try again.');
        } finally {
          setLoading(false);
        }
      } else {
        // Login
        setLoading(true);

        try {
          const result = await login(formData.email, formData.password);
          console.log('🟢 [AUTH] Login result:', JSON.stringify(result, null, 2));

          // Check for email verification requirement FIRST (before checking success)
          if (result && result.requiresVerification) {
            // Email verification required - redirect to 2FA page
            console.log('🟡 [AUTH] Email verification required for login - navigating to 2FA');
            setHasFailedLogin(false);
            setError(''); // Clear any error messages
            // Use setTimeout to ensure state updates complete before navigation
            setTimeout(() => {
              console.log('🟡 [AUTH] Executing navigation to /2fa for login');
              navigate('/2fa', { 
                replace: true,
                state: { email: formData.email || result.email, from: 'login' } 
              });
            }, 100);
            setLoading(false);
            return; // Exit early to prevent further processing
          }

          if (result && result.success) {
            // Reset failed login flag on success
            setHasFailedLogin(false);
            
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
            console.error('🔴 [AUTH] Login failed:', result?.message);
            setError(result?.message || 'Login failed');
            setHasFailedLogin(true); // Mark that login has failed
          }
        } catch (error) {
          // Handle any unexpected errors
          console.error('Login error:', error);
          setError(error.message || 'An error occurred during login. Please try again.');
          setHasFailedLogin(true);
          setLoading(false);
        }
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
            {isRegister ? 'Supplier Registration' : 'Welcome back'}
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
              ? 'Register your company as a supplier to get started with onboarding.'
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

            <Box sx={{ mb: isRegister ? 2 : 3 }}>
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

            {/* Confirm Password - Only show for registration */}
            {isRegister && (
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ mb: 0.75, fontSize: '15px', fontWeight: 600, color: '#000' }}>
                  Confirm Password
                </Typography>
                <TextField
                  required
                  fullWidth
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
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
                mb: hasFailedLogin && !isRegister ? 1.5 : 2.5,
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

            {/* Forgot Password Link - Only show on login and after failed attempt */}
            {!isRegister && hasFailedLogin && (
              <Typography sx={{ textAlign: 'center', mb: 2.5, fontSize: '13px' }}>
                <Box
                  component="span"
                  onClick={() => navigate('/forgot-password')}
                  sx={{
                    color: theme.palette.green.main || '#578A18',
                    cursor: 'pointer',
                    '&:hover': {
                      color: theme.palette.green.hover || '#467014',
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Forgot Password?
                </Box>
              </Typography>
            )}

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

