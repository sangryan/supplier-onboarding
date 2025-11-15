import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import {
  Business,
  Assignment,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Description,
  TrendingUp,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import SupplierDashboard from './SupplierDashboard';
import { checkSupplierProfileComplete } from '../../utils/profileCheck';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: '50%',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

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
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  // Supplier Dashboard
  if (user.role === 'supplier') {
    return <SupplierDashboard />;
  }

  // Admin/Internal User Dashboard
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Overview of supplier onboarding activities
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Suppliers"
            value={stats?.totalSuppliers || 0}
            icon={<Business sx={{ color: 'primary.main' }} />}
            color="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Applications"
            value={stats?.pendingApplications || 0}
            icon={<HourglassEmpty sx={{ color: 'warning.main' }} />}
            color="warning"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Approved Suppliers"
            value={stats?.approvedSuppliers || 0}
            icon={<CheckCircle sx={{ color: 'success.main' }} />}
            color="success"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Contracts"
            value={stats?.activeContracts || 0}
            icon={<Description sx={{ color: 'info.main' }} />}
            color="info"
          />
        </Grid>

        {(user.role === 'procurement' || user.role === 'legal') && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  My Tasks
                </Typography>
                <Typography variant="h3" color="primary" sx={{ my: 2 }}>
                  {stats?.myTasks || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Applications awaiting your review
                </Typography>
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/tasks')}
                >
                  View Tasks
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {stats?.expiringContracts > 0 && (
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: 'warning.light' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Expiring Contracts
                </Typography>
                <Typography variant="h3" sx={{ my: 2 }}>
                  {stats.expiringContracts}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Contracts expiring in the next 30 days
                </Typography>
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/contracts')}
                >
                  View Contracts
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {stats?.overdueApplications > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: 'error.light', color: 'white' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Overdue Applications
                  </Typography>
                  <Typography variant="body1">
                    {stats.overdueApplications} applications have exceeded the SLA deadline
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => navigate('/suppliers?status=overdue')}
                >
                  View All
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Dashboard;

