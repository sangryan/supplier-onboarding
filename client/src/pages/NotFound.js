import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <Container maxWidth="sm">
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h1" color="primary">
          404
        </Typography>
        <Typography variant="h5" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          The page you're looking for doesn't exist.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;

