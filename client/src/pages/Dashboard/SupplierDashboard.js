import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
} from '@mui/material';
import {
  FolderOpen as FolderIcon,
  HelpOutline as HelpIcon,
  Email as EmailIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const SupplierDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get('/applications/my-applications');
      setApplications(response.data.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const hasApplications = applications.length > 0;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f9fafb', pb: 8 }}>
      <Container maxWidth="lg" sx={{ pt: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 'bold', 
              mb: 1,
              color: '#000',
              fontSize: { xs: '24px', sm: '32px' }
            }}
          >
            Welcome {user.firstName}
          </Typography>
          <Typography 
            sx={{ 
              color: '#6b7280',
              fontSize: { xs: '14px', sm: '16px' }
            }}
          >
            Seamless, Smart, and Secure Supplier Onboarding for a Future-Ready Business.
          </Typography>
        </Box>

        {/* Your Applications Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            mb: 4, 
            p: 3,
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}
        >
          {/* Header with New Application Button */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 3,
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                color: '#000',
                fontSize: { xs: '18px', sm: '20px' }
              }}
            >
              Your applications
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/application/new')}
              sx={{
                backgroundColor: theme.palette.green.main,
                color: '#fff',
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 500,
                px: 2.5,
                py: 1,
                borderRadius: '6px',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: theme.palette.green.hover,
                  boxShadow: 'none',
                },
              }}
            >
              New Application
            </Button>
          </Box>

          {/* Applications Content */}
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="textSecondary">Loading...</Typography>
            </Box>
          ) : !hasApplications ? (
            // Empty State
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 6,
                border: '2px dashed #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#fafafa'
              }}
            >
              <FolderIcon 
                sx={{ 
                  fontSize: 64, 
                  color: '#9ca3af', 
                  mb: 2 
                }} 
              />
              <Typography 
                sx={{ 
                  mb: 3,
                  color: '#374151',
                  fontSize: '16px',
                  fontWeight: 500
                }}
              >
                No applications added
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/application/new')}
                sx={{
                  backgroundColor: theme.palette.green.main,
                  color: '#fff',
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  px: 3,
                  py: 1.25,
                  borderRadius: '6px',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: theme.palette.green.hover,
                    boxShadow: 'none',
                  },
                }}
              >
                Start New Application
              </Button>
            </Box>
          ) : (
            // Applications List
            <Box>
              {applications.map((app) => (
                <Paper
                  key={app._id}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    mb: 2,
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: '#d1d5db',
                      backgroundColor: '#f9fafb'
                    }
                  }}
                  onClick={() => navigate('/application/status')}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                        {app.companyName || 'Application'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Status: {app.status}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/application/status');
                      }}
                      sx={{ textTransform: 'none' }}
                    >
                      View Details
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Paper>

        {/* Need Help Section */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              mb: 3,
              color: '#000',
              fontSize: { xs: '18px', sm: '20px' }
            }}
          >
            Need Help ?
          </Typography>
          
          <Grid container spacing={3}>
            {/* FAQs Card */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3,
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#d1d5db',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }
                }}
                onClick={() => {
                  // Navigate to FAQs page (create if needed)
                  console.log('Navigate to FAQs');
                }}
              >
                <HelpIcon sx={{ fontSize: 40, color: '#374151', mb: 2 }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 1,
                    color: '#000',
                    fontSize: '18px'
                  }}
                >
                  FAQs
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#6b7280',
                    fontSize: '14px'
                  }}
                >
                  Find answers to common questions
                </Typography>
              </Paper>
            </Grid>

            {/* Contact Support Card */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3,
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#d1d5db',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }
                }}
                onClick={() => {
                  // Navigate to contact support page
                  window.location.href = 'mailto:support@betika.com';
                }}
              >
                <EmailIcon sx={{ fontSize: 40, color: '#374151', mb: 2 }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 1,
                    color: '#000',
                    fontSize: '18px'
                  }}
                >
                  Contact Support
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#6b7280',
                    fontSize: '14px'
                  }}
                >
                  Get help from our team
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* Footer */}
      <Box 
        component="footer"
        sx={{ 
          backgroundColor: '#1f2937',
          color: '#fff',
          py: 3,
          mt: 6
        }}
      >
        <Container maxWidth="lg">
          <Typography 
            variant="body2" 
            sx={{ 
              textAlign: 'center',
              fontSize: '14px',
              color: '#9ca3af'
            }}
          >
            © 2025 Supplier Onboarding Portal. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default SupplierDashboard;

