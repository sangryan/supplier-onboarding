import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { ArrowBack, Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import AuthLayout from '../../components/Auth/AuthLayout';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError('Invalid reset token');
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.password) {
      setError('Password is required');
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

    try {
      const response = await api.post(`/auth/reset-password/${token}`, {
        password: formData.password,
      });

      if (response.data.success) {
        setSuccess(true);
        toast.success('Password reset successfully');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to reset password');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.[0]?.msg ||
                          'Failed to reset password. The link may have expired.';
      setError(errorMessage);
      setTokenValid(false);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid && !success) {
    return (
      <AuthLayout>
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
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Invalid or Expired Link
          </Typography>
          <Typography variant="body2">
            This password reset link is invalid or has expired. Please request a new password reset link.
          </Typography>
        </Box>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/forgot-password')}
              sx={{
                backgroundColor: '#578A18',
                color: '#fff',
                textTransform: 'none',
                fontSize: '15px',
                fontWeight: 600,
                height: '48px',
                borderRadius: '8px',
                mb: 2,
                '&:hover': {
                  backgroundColor: '#467014',
                },
              }}
            >
              Request New Reset Link
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/login')}
              sx={{
                textTransform: 'none',
                fontSize: '15px',
                fontWeight: 500,
                height: '48px',
                borderRadius: '8px',
                borderColor: '#d1d5db',
                color: '#374151',
                '&:hover': {
                  borderColor: '#9ca3af',
                  backgroundColor: '#f9fafb',
                },
              }}
            >
              Back to Sign In
            </Button>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout>
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            backgroundColor: '#e8f5e9',
            borderRadius: 1,
            color: '#2e7d32',
            fontSize: '14px',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Password Reset Successful
          </Typography>
          <Typography variant="body2">
            Your password has been reset successfully. Redirecting to sign in...
          </Typography>
        </Box>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{
                backgroundColor: '#578A18',
                color: '#fff',
                textTransform: 'none',
                fontSize: '15px',
                fontWeight: 600,
                height: '48px',
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: '#467014',
                },
              }}
            >
              Go to Sign In
            </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Back Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/login')}
          sx={{
            color: '#6b7280',
            textTransform: 'none',
            fontSize: '14px',
            pl: 0,
            '&:hover': {
              backgroundColor: 'transparent',
              color: '#374151'
            }
          }}
        >
          Back to Sign In
        </Button>
      </Box>

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
        Reset Your Password
      </Typography>
      <Typography 
        sx={{ 
          color: '#666', 
          mb: 4,
          fontSize: { xs: '14px', sm: '16px' },
          textAlign: { xs: 'center', sm: 'left' }
        }}
      >
        Enter your new password below.
      </Typography>

          <Box component="form" onSubmit={handleSubmit}>
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

            <Box sx={{ mb: 2.5 }}>
              <Typography sx={{ mb: 0.75, fontSize: '15px', fontWeight: 600, color: '#000' }}>
                New Password
              </Typography>
              <TextField
                required
                fullWidth
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter new password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
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
                Confirm New Password
              </Typography>
              <TextField
                required
                fullWidth
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        size="small"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
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
                backgroundColor: '#578A18',
                color: '#fff',
                textTransform: 'none',
                fontSize: '15px',
                fontWeight: 600,
                height: '48px',
                borderRadius: '8px',
                boxShadow: 'none',
                mb: 2,
                '&:hover': {
                  backgroundColor: '#467014',
                  boxShadow: 'none',
                },
                '&:disabled': {
                  backgroundColor: '#d1d5db',
                  color: '#9ca3af',
                },
              }}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>

            <Typography sx={{ textAlign: 'center', mt: 3, fontSize: '13px', color: '#666' }}>
              Remember your password?{' '}
              <Box
                component="span"
                onClick={() => navigate('/login')}
                sx={{
                  color: '#578A18',
                  cursor: 'pointer',
                  '&:hover': {
                    color: '#467014',
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign In
              </Box>
            </Typography>
          </Box>
    </AuthLayout>
  );
};

export default ResetPassword;

