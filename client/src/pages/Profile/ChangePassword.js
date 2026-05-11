import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [saving, setSaving] = useState(false);

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setSaving(true);
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      const updatedUser = await refreshUser();
      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

      if (
        (updatedUser?.role === 'legal' || updatedUser?.role === 'procurement') &&
        !updatedUser?.mustChangePassword
      ) {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#ffffff', minHeight: '100vh' }}>
      <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
        {!user?.mustChangePassword && (
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{
              color: '#6b7280',
              textTransform: 'none',
              fontSize: '14px',
              mb: 2,
              pl: 0,
              justifyContent: 'flex-start',
              '&:hover': {
                backgroundColor: 'transparent',
                color: '#374151',
              },
            }}
          >
            Back
          </Button>
        )}

        <Box sx={{ mb: { xs: 3, md: 4 } }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: { xs: '16px', md: '18px' },
              color: '#111827',
              mb: 0.5,
            }}
          >
            Change Password
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#6b7280',
              fontSize: { xs: '13px', md: '14px' },
            }}
          >
            Update your password to keep your account secure.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            backgroundColor: '#fff',
          }}
        >
          <Grid container spacing={{ xs: 2, md: 2.5 }}>
            <Grid item xs={12}>
              <Typography
                variant="body2"
                sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
              >
                Verify current password
              </Typography>
              <TextField
                fullWidth
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                size="small"
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                        edge="end"
                        size="small"
                      >
                        {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography
                variant="body2"
                sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
              >
                New password
              </Typography>
              <TextField
                fullWidth
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                size="small"
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                        edge="end"
                        size="small"
                      >
                        {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography
                variant="body2"
                sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
              >
                Confirm password
              </Typography>
              <TextField
                fullWidth
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                size="small"
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                        edge="end"
                        size="small"
                      >
                        {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleUpdatePassword}
                disabled={saving}
                sx={{
                  bgcolor: '#578A18',
                  textTransform: 'none',
                  px: 4,
                  width: { xs: '100%', md: 'auto' },
                  mt: 1,
                  '&:hover': {
                    bgcolor: '#467014',
                  },
                }}
              >
                {saving ? 'Updating...' : 'Update Password'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default ChangePassword;
