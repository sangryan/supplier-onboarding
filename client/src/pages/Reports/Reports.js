import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const Reports = () => {
  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Reports & Analytics
        </Typography>
        <Typography>
          View SLA performance, supplier statistics, and other reports.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Reports;

