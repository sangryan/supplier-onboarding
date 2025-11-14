import React from 'react';
import { Box, Container, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box 
      component="footer"
      sx={{ 
        backgroundColor: '#1a1d29',
        color: '#fff',
        py: 3.5,
        mt: 'auto',
        width: '100%'
      }}
    >
      <Container maxWidth="lg">
        <Typography 
          variant="body2" 
          sx={{ 
            textAlign: 'center',
            fontSize: '13px',
            color: '#9ca3af'
          }}
        >
          © 2025 Supplier Onboarding Portal. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;

