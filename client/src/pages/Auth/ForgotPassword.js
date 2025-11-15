import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import AuthLayout from '../../components/Auth/AuthLayout';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        setSuccess(true);
        toast.success('Password reset link sent to your email');
      } else {
        setError(response.data.message || 'Failed to send reset link');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.[0]?.msg ||
                          'Failed to send reset link. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
        Forgot Password?
      </Typography>
      <Typography 
        sx={{ 
          color: '#666', 
          mb: 4,
          fontSize: { xs: '14px', sm: '16px' },
          textAlign: { xs: 'center', sm: 'left' }
        }}
      >
        No worries! Enter your email address and we'll send you a link to reset your password.
      </Typography>

          {success ? (
            <Box>
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
                  Check your email
                </Typography>
                <Typography variant="body2">
                  We've sent a password reset link to <strong>{email}</strong>. 
                  Please check your inbox and click the link to reset your password.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontSize: '13px', color: '#666' }}>
                  The link will expire in 1 hour.
                </Typography>
              </Box>
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
            </Box>
          ) : (
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

              <Box sx={{ mb: 3 }}>
                <Typography sx={{ mb: 0.75, fontSize: '15px', fontWeight: 600, color: '#000' }}>
                  Email
                </Typography>
                <TextField
                  required
                  fullWidth
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
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
                {loading ? 'Sending...' : 'Send Reset Link'}
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
          )}
    </AuthLayout>
  );
};

export default ForgotPassword;

