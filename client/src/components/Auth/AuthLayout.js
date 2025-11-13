import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';

const AuthLayout = ({ children }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' }, // Stack on mobile, side-by-side on desktop
        backgroundColor: '#ffffff',
      }}
    >
      {/* Left/Top Side - Illustration Placeholder */}
      <Box
        sx={{
          width: { xs: '100%', md: '50%' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: { xs: 2, sm: 3, md: 4 },
          minHeight: { xs: '200px', sm: '250px', md: 'auto' },
        }}
      >
        {/* Handshake Illustration */}
        <Box
          sx={{
            width: { xs: '240px', sm: '340px', md: '480px' },
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            component="img"
            src="/images/handshake.png"
            alt="Handshake illustration"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
            sx={{
              width: '100%',
              height: 'auto',
              objectFit: 'contain',
            }}
          />
          {/* Fallback placeholder if image not found */}
          <Box
            sx={{
              display: 'none',
              width: '100%',
              height: { xs: '200px', sm: '300px', md: '450px' },
              backgroundColor: '#f0f0f0',
              borderRadius: '12px',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
              border: '2px dashed #d1d5db',
            }}
          >
            <Typography sx={{ fontSize: '48px' }}>🤝</Typography>
            <Typography sx={{ color: '#666', fontSize: '12px', textAlign: 'center', px: 2 }}>
              Save handshake.png to<br />client/public/images/
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Right/Bottom Side - Form */}
      <Box
        sx={{
          width: { xs: '100%', md: '50%' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: { xs: 3, sm: 3, md: 4 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: '500px' } }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                backgroundColor: theme.palette.primary.main,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1.5,
              }}
            >
              <Typography sx={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                B
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.text.secondary }}>
              Supplier Onboarding Portal
            </Typography>
          </Box>

          {/* Content */}
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AuthLayout;

