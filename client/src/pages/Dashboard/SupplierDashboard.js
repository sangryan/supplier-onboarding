import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  LinearProgress,
  IconButton,
} from '@mui/material';
import {
  FolderOpenOutlined as FolderIcon,
  HelpOutlineOutlined as HelpIcon,
  MailOutline as EmailIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Footer from '../../components/Footer/Footer';
import { toast } from 'react-toastify';

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
      const response = await api.get('/suppliers/my-applications');
      setApplications(response.data.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      // Fallback to empty array if endpoint doesn't exist
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const formatApplicationId = (id, createdAt) => {
    if (!id) return 'APP-2025-000';
    const year = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
    const shortId = id.toString().slice(-3).toUpperCase();
    return `APP-${year}-${shortId}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
    return `${month} ${day}${suffix}, ${year}`;
  };

  const getProgress = (app) => {
    // If currentStep is set, use it; otherwise calculate from status
    // currentStep represents the step index the user is currently on (0-3)
    // If on step 1, they've completed step 0, so show 1 of 4 steps completed = 25%
    if (app.currentStep !== undefined && app.currentStep !== null) {
      // Steps completed = currentStep (if on step 1, completed step 0 = 1 step)
      // Progress should match the steps completed display
      const stepsCompleted = Math.max(1, app.currentStep);
      return (stepsCompleted / 4) * 100;
    }
    // Fallback logic based on status
    const statusMap = {
      draft: 25,
      submitted: 50,
      pending_procurement: 50,
      pending_legal: 75,
      approved: 100,
    };
    return statusMap[app.status] || 0;
  };

  const getStepsCompleted = (app) => {
    // currentStep is 0-based (0, 1, 2, 3) representing the step the user is currently on
    // If on step 0, they're on the 1st step, show "1 of 4"
    // If on step 1, they've completed step 0 (1 step completed), show "1 of 4"
    // So if on step 1, they've completed 1 step (step 0), so show "1 of 4"
    if (app.currentStep !== undefined && app.currentStep !== null) {
      // If on step 0, show "1 of 4" (they're on the 1st step)
      // If on step 1, show "1 of 4" (they've completed step 0, 1 step completed)
      // So steps completed = currentStep, but ensure minimum of 1
      return Math.max(1, app.currentStep);
    }
    const statusMap = {
      draft: 1,
      submitted: 2,
      pending_procurement: 2,
      pending_legal: 3,
      approved: 4,
    };
    return statusMap[app.status] || 0;
  };

  const handleView = (app, e) => {
    e.stopPropagation();
    // Navigate to view application status/details
    navigate(`/application/${app._id}`);
  };

  const handleEdit = (app, e) => {
    e.stopPropagation();
    navigate(`/application/${app._id}/edit`);
  };

  const handleDelete = async (app, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        await api.delete(`/suppliers/${app._id}`);
        toast.success('Application deleted successfully');
        fetchApplications();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error deleting application');
      }
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      draft: 'Draft',
      submitted: 'Pending Procurement Approval',
      pending_procurement: 'Pending Procurement Approval',
      pending_legal: 'Pending Legal Approval',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      more_info_required: 'More Info Required'
    };
    return statusMap[status] || status;
  };

  const isCompleted = (app) => {
    // An application is "completed" (submitted) if it's been submitted for review
    // Active applications are: draft (can still edit) and more_info_required (needs more info, can still edit)
    // Completed applications are: pending_procurement, pending_legal, under_review, submitted, approved, rejected
    return app.status !== 'draft' && app.status !== 'more_info_required';
  };

  const activeApplications = applications.filter(app => !isCompleted(app));
  const completedApplications = applications.filter(app => isCompleted(app));

  const hasApplications = applications.length > 0;
  const hasActiveApplications = activeApplications.length > 0;
  
  // Create complete application function
  const createCompleteApplication = async () => {
    try {
      await api.post('/suppliers/create-complete');
      toast.success('Complete application created successfully!');
      fetchApplications();
    } catch (error) {
      console.error('Error creating complete application:', error);
      // Don't show error toast on auto-create, only on manual
    }
  };
  
  // Auto-create complete application if no applications exist (for demo)
  useEffect(() => {
    if (!loading && !hasApplications) {
      createCompleteApplication();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasApplications]);

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
        {/* Welcome Section */}
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
            Welcome {user.firstName}
          </Typography>
          <Typography 
            sx={{ 
              color: '#6b7280',
              fontSize: { xs: '13px', sm: '14px' },
              lineHeight: 1.6,
            }}
          >
            Seamless, Smart, and Secure Supplier Onboarding for a Future-Ready Business.
          </Typography>
        </Box>

        {/* Your Applications Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            mb: { xs: 3, sm: 4 }, 
            p: { xs: 1.5, sm: 3 },
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#fff',
          }}
        >
          {/* Header with New Application Button */}
          <Box 
            sx={{ 
              display: { xs: 'block', sm: 'flex' },
              justifyContent: { sm: 'space-between' },
              alignItems: { sm: 'center' },
              mb: 3,
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                color: '#111827',
                fontSize: { xs: '18px', sm: '19px' },
                mb: { xs: 2, sm: 0 }
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
                width: { xs: '100%', sm: 'auto' },
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
            // Empty State - No applications at all
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 4,
                px: 3,
                border: '2px dashed #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#fafafa'
              }}
            >
              <FolderIcon 
                sx={{ 
                  fontSize: 40, 
                  color: '#9ca3af',
                  fontWeight: 'normal',
                  mb: 1.5,
                }} 
              />
              <Typography 
                sx={{ 
                  color: '#111827',
                  fontSize: '15px',
                  fontWeight: 500
                }}
              >
                No completed applications yet
              </Typography>
            </Box>
          ) : (
            // Applications List
            <Box>
              {/* Active Applications - Previous Design with Progress Bar */}
              {activeApplications.map((app) => (
                <Paper
                  key={app._id}
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, sm: 2.5 },
                    mb: 2,
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    '&:hover': {
                      borderColor: '#d1d5db',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 600, mb: 0.5, fontSize: '16px', color: '#111827' }}>
                        {formatApplicationId(app._id, app.createdAt)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                        Last modified: {formatDate(app.lastModified || app.updatedAt || app.createdAt)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleEdit(app, e)}
                        sx={{
                          color: '#000',
                          padding: '4px',
                          '&:hover': {
                            backgroundColor: 'transparent',
                            color: '#000'
                          }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => handleDelete(app, e)}
                        sx={{
                          color: '#8B4513', // Reddish-brown/dark red color
                          padding: '4px',
                          '&:hover': {
                            backgroundColor: 'transparent',
                            color: '#8B4513'
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  {/* Progress Bar */}
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontSize: '12px', color: '#6b7280' }}>
                        {getStepsCompleted(app)} of 4 steps
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={getProgress(app)}
                      sx={{
                        height: 8,
                        borderRadius: '4px',
                        backgroundColor: '#e5e7eb',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: '4px',
                          backgroundColor: theme.palette.green.main,
                        }
                      }}
                    />
                  </Box>
                </Paper>
              ))}
              
              {/* Completed Applications Section */}
              {completedApplications.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: '18px', 
                      color: '#111827',
                      mb: 2
                    }}
                  >
                    Completed Applications
                  </Typography>
                  {completedApplications.map((app) => (
                    <Paper
                      key={app._id}
                      elevation={0}
                      sx={{
                        p: { xs: 1.5, sm: 2.5 },
                        mb: 2,
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        '&:hover': {
                          borderColor: '#d1d5db',
                        }
                      }}
                    >
                      {/* First Row: Application ID and View Button */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '18px', color: '#111827', flex: 1, minWidth: 0 }}>
                          {formatApplicationId(app._id, app.createdAt)}
                        </Typography>
                        {/* View Button - White with light gray border */}
                        <Button
                          variant="outlined"
                          startIcon={<ViewIcon />}
                          onClick={(e) => handleView(app, e)}
                          sx={{
                            textTransform: 'none',
                            fontSize: '14px',
                            fontWeight: 500,
                            px: 2,
                            py: 0.75,
                            borderRadius: '6px',
                            borderColor: '#e5e7eb',
                            backgroundColor: '#fff',
                            color: '#374151',
                            ml: 1.5,
                            flexShrink: 0,
                            '&:hover': {
                              borderColor: '#d1d5db',
                              backgroundColor: '#fff'
                            }
                          }}
                        >
                          View
                        </Button>
                      </Box>
                      
                      {/* Second Row: Last Modified Date */}
                      <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px', mb: 1.5 }}>
                        Last modified: {formatDate(app.lastModified || app.updatedAt || app.createdAt)}
                      </Typography>
                      
                      {/* Third Row: Status with "Status:" label */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography 
                          sx={{ 
                            color: '#9ca3af', 
                            fontSize: '13px',
                            fontWeight: 400
                          }}
                        >
                          Status:
                        </Typography>
                        <Chip
                          label={getStatusLabel(app.status)}
                          size="small"
                          sx={{
                            backgroundColor: '#f3f4f6',
                            color: '#111827',
                            fontSize: '12px',
                            height: '24px',
                            fontWeight: 600,
                            border: 'none',
                            '& .MuiChip-label': {
                              px: 1.5
                            }
                          }}
                        />
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
              
            </Box>
          )}
        </Paper>

        {/* Need Help Section */}
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              mb: { xs: 2.5, sm: 3 },
              color: '#111827',
              fontSize: { xs: '18px', sm: '19px' }
            }}
          >
            Need Help ?
          </Typography>
          
          <Grid container spacing={{ xs: 2, sm: 2 }}>
            {/* FAQs Card */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: { xs: 1.5, sm: 3 },
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  height: '100%',
                  backgroundColor: '#fff',
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
                <HelpIcon 
                  sx={{ 
                    fontSize: 32, 
                    color: '#374151',
                    fontWeight: 'normal',
                    mb: 2,
                  }} 
                />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 0.75,
                    color: '#111827',
                    fontSize: '16px'
                  }}
                >
                  FAQs
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#6b7280',
                    fontSize: '13px',
                    lineHeight: 1.5,
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
                  p: { xs: 1.5, sm: 3 },
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  height: '100%',
                  backgroundColor: '#fff',
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
                <EmailIcon 
                  sx={{ 
                    fontSize: 32, 
                    color: '#374151',
                    fontWeight: 'normal',
                    mb: 2,
                  }} 
                />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 0.75,
                    color: '#111827',
                    fontSize: '16px'
                  }}
                >
                  Contact Support
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#6b7280',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}
                >
                  Get help from our team
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default SupplierDashboard;

