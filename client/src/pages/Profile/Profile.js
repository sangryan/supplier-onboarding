import React from 'react';
import { Container, Typography, Paper } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  
  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Profile
        </Typography>
        <Typography variant="body1" gutterBottom>
          Name: {user?.firstName} {user?.lastName}
        </Typography>
        <Typography variant="body1" gutterBottom>
          Email: {user?.email}
        </Typography>
        <Typography variant="body1" gutterBottom>
          Role: {user?.role}
        </Typography>
      </Paper>
    </Container>
  );
};

export default Profile;

