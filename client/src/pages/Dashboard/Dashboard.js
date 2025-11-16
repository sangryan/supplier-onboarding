import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Business,
  HourglassEmpty,
  CheckCircle,
  Description,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import SupplierDashboard from './SupplierDashboard';
import ProcurementDashboard from './ProcurementDashboard';
import { checkSupplierProfileComplete } from '../../utils/profileCheck';
import Footer from '../../components/Footer/Footer';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (user?.role === 'supplier') {
        const profileComplete = await checkSupplierProfileComplete(user);
        if (!profileComplete) {
          navigate('/profile');
          return;
        }
      }
      setProfileChecked(true);
      fetchDashboardData();
    };

    if (user) {
      checkProfile();
    }
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profileChecked) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Supplier Dashboard
  if (user.role === 'supplier') {
    return <SupplierDashboard />;
  }

  // Procurement and Legal Dashboard
  if (user.role === 'procurement' || user.role === 'legal') {
    return <ProcurementDashboard />;
  }

  // Admin/Internal User Dashboard
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', pb: 0 }}>
      <Container 
        maxWidth="lg"
        sx={{ 
          pt: { xs: 3, sm: 5 },
          pb: { xs: 3, sm: 4 },
          px: { xs: 2, sm: 3 },
          flex: 1,
        }}
      >
        {/* Page Header */}
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              mb: 1,
              color: '#111827',
              fontSize: { xs: '22px', sm: '28px' },
              letterSpacing: '-0.01em',
            }}
          >
            Dashboard
          </Typography>
          <Typography
            sx={{
              color: '#6b7280',
              fontSize: { xs: '13px', sm: '14px' },
              lineHeight: 1.6,
            }}
          >
            Overview of supplier onboarding activities
          </Typography>
        </Box>

        {/* Key Metrics Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#fff',
                height: '100%'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#6b7280',
                      fontSize: '13px',
                      mb: 1,
                      fontWeight: 400
                    }}
                  >
                    Total Suppliers
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 600,
                      fontSize: '24px',
                      color: '#111827'
                    }}
                  >
                    {stats?.totalSuppliers || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: '#3b82f6',
                    borderRadius: '8px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px'
                  }}
                >
                  <Business sx={{ color: '#fff', fontSize: '24px' }} />
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#fff',
                height: '100%'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#6b7280',
                      fontSize: '13px',
                      mb: 1,
                      fontWeight: 400
                    }}
                  >
                    Pending Applications
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 600,
                      fontSize: '24px',
                      color: '#111827'
                    }}
                  >
                    {stats?.pendingApplications || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: '#f97316',
                    borderRadius: '50%',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px'
                  }}
                >
                  <HourglassEmpty sx={{ color: '#fff', fontSize: '24px' }} />
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#fff',
                height: '100%'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#6b7280',
                      fontSize: '13px',
                      mb: 1,
                      fontWeight: 400
                    }}
                  >
                    Approved Suppliers
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 600,
                      fontSize: '24px',
                      color: '#111827'
                    }}
                  >
                    {stats?.approvedSuppliers || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: '#10b981',
                    borderRadius: '50%',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px'
                  }}
                >
                  <CheckCircle sx={{ color: '#fff', fontSize: '24px' }} />
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#fff',
                height: '100%'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#6b7280',
                      fontSize: '13px',
                      mb: 1,
                      fontWeight: 400
                    }}
                  >
                    Active Contracts
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 600,
                      fontSize: '24px',
                      color: '#111827'
                    }}
                  >
                    {stats?.activeContracts || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: '#3b82f6',
                    borderRadius: '50%',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px'
                  }}
                >
                  <Description sx={{ color: '#fff', fontSize: '24px' }} />
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* My Tasks Section */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 3 },
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#fff'
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: { xs: '18px', sm: '19px' },
              color: '#111827',
              mb: 1
            }}
          >
            My Tasks
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 600,
              fontSize: { xs: '32px', md: '40px' },
              color: '#3b82f6',
              mb: 1
            }}
          >
            {stats?.myTasks || 0}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#6b7280',
              fontSize: '13px',
              mb: 3
            }}
          >
            Applications awaiting your review
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/tasks')}
            sx={{
              bgcolor: '#578A18',
              color: '#fff',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              px: 2.5,
              py: 1,
              borderRadius: '6px',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#467014',
                boxShadow: 'none'
              }
            }}
          >
            View Tasks
          </Button>
        </Paper>
      </Container>
      <Footer />
    </Box>
  );
};

export default Dashboard;
