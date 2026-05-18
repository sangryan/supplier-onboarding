import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';

const Maintenance = ({ message }) => (
  <Box
    sx={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Container maxWidth="sm">
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <BuildIcon sx={{ fontSize: 40, color: '#d97706' }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1.5, fontSize: '28px' }}>
          Under Maintenance
        </Typography>
        <Typography sx={{ color: '#6b7280', fontSize: '15px', lineHeight: 1.7, maxWidth: 420, mx: 'auto' }}>
          {message || 'The system is currently under maintenance. Please check back later.'}
        </Typography>
        <Typography sx={{ color: '#9ca3af', fontSize: '13px', mt: 4 }}>
          If you need urgent assistance, please contact your administrator.
        </Typography>
      </Box>
    </Container>
  </Box>
);

export default Maintenance;
