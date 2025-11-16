import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  CircularProgress,
  Checkbox,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const ProcurementDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [tasks, setTasks] = useState([]);
  const [counts, setCounts] = useState({
    pendingApplications: 0,
    pendingVendorAssignment: 0,
    pendingProfileUpdate: 0,
    pendingContactUpdate: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 10 });
 const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, [page, search]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/tasks', {
        params: {
          page,
          limit: 10,
          search
        }
      });
      
      if (response.data.success) {
        setTasks(response.data.data || []);
        setCounts(response.data.counts || {
          pendingApplications: 0,
          pendingVendorAssignment: 0,
          pendingProfileUpdate: 0,
          pendingContactUpdate: 0
        });
        setPagination(response.data.pagination || { total: 0, pages: 1, limit: 10 });
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTaskId = (task) => {
    return task.taskId || `APP-${new Date().getFullYear()}-000`;
  };

  const getStatusChip = (status) => {
    return (
      <Chip
        label={status}
        size="small"
        sx={{
          backgroundColor: '#f3f4f6',
          color: '#374151',
          fontWeight: 400,
          fontSize: '13px',
          height: '24px',
          borderRadius: '12px',
          '& .MuiChip-label': {
            padding: '0 8px'
          }
        }}
      />
    );
  };

  const handleRowClick = (task) => {
    if (task.supplier?._id) {
      navigate(`/suppliers/${task.supplier._id}`);
    }
  };

  const handleDownload = () => {
    console.log('Download all tasks');
  };

  const handleAddVendor = () => {
    console.log('Add new on-demand vendor');
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleRowSelect = (taskId) => {
    setSelectedRows(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

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
        <Box sx={{ 
          mb: { xs: 3, sm: 4 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'flex-start' },
          gap: { xs: 2, sm: 3 }
        }}>
          <Box sx={{ flex: 1 }}>
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
              My tasks
            </Typography>
            <Typography 
              sx={{ 
                color: '#6b7280',
                fontSize: { xs: '13px', sm: '14px' },
                lineHeight: 1.6,
              }}
            >
              Manage your approvals and vendor number assignment effortlessly.
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddVendor}
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
              flexShrink: 0,
              alignSelf: { xs: 'stretch', sm: 'flex-start' },
              mt: { xs: 0, sm: 0 },
              '&:hover': {
                backgroundColor: theme.palette.green.hover,
                boxShadow: 'none',
              },
            }}
          >
            Add New On-Demand Vendor
          </Button>
        </Box>

        {/* Summary Cards Section */}
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>

          {/* Summary Cards */}
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  backgroundColor: '#fff'
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: '#6b7280',
                    fontSize: '13px',
                    mb: 1,
                    fontWeight: 400
                  }}
                >
                  Pending Applications Approval
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    fontSize: '24px',
                    color: '#111827'
                  }}
                >
                  {counts.pendingApplications}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  backgroundColor: '#fff'
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: '#6b7280',
                    fontSize: '13px',
                    mb: 1,
                    fontWeight: 400
                  }}
                >
                  Pending Vendor No. Assignment
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    fontSize: '24px',
                    color: '#111827'
                  }}
                >
                  {counts.pendingVendorAssignment}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  backgroundColor: '#fff'
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: '#6b7280',
                    fontSize: '13px',
                    mb: 1,
                    fontWeight: 400
                  }}
                >
                  Pending Profile Update Approval
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    fontSize: '24px',
                    color: '#111827'
                  }}
                >
                  {counts.pendingProfileUpdate}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  backgroundColor: '#fff'
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: '#6b7280',
                    fontSize: '13px',
                    mb: 1,
                    fontWeight: 400
                  }}
                >
                  Pending Contact Info Update Approval
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    fontSize: '24px',
                    color: '#111827'
                  }}
                >
                  {counts.pendingContactUpdate}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Tasks Table Section */}
        <Box 
          sx={{ 
            mb: { xs: 3, sm: 4 }
          }}
        >
          {/* Search and Download */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'center' }, 
            mb: 3, 
            gap: 2 
          }}>
            <TextField
              placeholder="Search"
              value={search}
              onChange={handleSearchChange}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#9ca3af', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: 1,
                maxWidth: { xs: '100%', sm: '400px' },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  '& fieldset': {
                    borderColor: '#e0e0e0'
                  },
                  '&:hover fieldset': {
                    borderColor: '#9ca3af'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1976d2',
                    borderWidth: '1px'
                  }
                }
              }}
            />
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{
                borderColor: '#d1d5db',
                color: '#374151',
                textTransform: 'none',
                fontSize: '14px',
                px: 2,
                py: 1,
                borderRadius: '8px',
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  borderColor: '#9ca3af',
                  bgcolor: '#f9fafb'
                }
              }}
            >
              Download all
            </Button>
          </Box>

          {/* Tasks Table */}
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer 
              elevation={0} 
              sx={{ 
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                overflow: 'hidden',
                backgroundColor: '#fff'
              }}
            >
              <Table sx={{ borderCollapse: 'collapse' }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                    <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5, borderBottom: '1px solid #e0e0e0' }}>ID</TableCell>
                    <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5, borderBottom: '1px solid #e0e0e0' }}>Supplier Name</TableCell>
                    <TableCell 
                      sx={{ 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: '#4b5563', 
                        py: 1.5, 
                        borderBottom: '1px solid #e0e0e0',
                        display: { xs: 'none', md: 'table-cell' }
                      }}
                    >
                      Request Type
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: '#4b5563', 
                        py: 1.5, 
                        borderBottom: '1px solid #e0e0e0',
                        display: { xs: 'none', md: 'table-cell' }
                      }}
                    >
                      Submission Date
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: '#4b5563', 
                        py: 1.5, 
                        borderBottom: '1px solid #e0e0e0',
                        display: { xs: 'none', md: 'table-cell' }
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5, borderBottom: '1px solid #e0e0e0' }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4, borderBottom: '1px solid #e0e0e0' }}>
                        <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                          No pending tasks
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => (
                      <TableRow
                        key={task._id}
                        hover
                        onClick={() => handleRowSelect(task._id)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: selectedRows.includes(task._id) ? '#f0fdf4' : 'transparent',
                          '&:hover': {
                            backgroundColor: selectedRows.includes(task._id) ? '#dcfce7' : '#f9fafb'
                          }
                        }}
                      >
                        <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5, borderBottom: '1px solid #e0e0e0' }}>
                          {formatTaskId(task)}
                        </TableCell>
                        <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5, borderBottom: '1px solid #e0e0e0' }}>
                          {task.supplierName}
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontSize: '14px', 
                            color: '#111827', 
                            py: 1.5, 
                            borderBottom: '1px solid #e0e0e0',
                            display: { xs: 'none', md: 'table-cell' }
                          }}
                        >
                          {task.requestType}
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontSize: '14px', 
                            color: '#111827', 
                            py: 1.5, 
                            borderBottom: '1px solid #e0e0e0',
                            display: { xs: 'none', md: 'table-cell' }
                          }}
                        >
                          {formatDate(task.submissionDate)}
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontSize: '14px', 
                            color: '#111827', 
                            py: 1.5, 
                            borderBottom: '1px solid #e0e0e0',
                            display: { xs: 'none', md: 'table-cell' }
                          }}
                        >
                          {getStatusChip(task.status)}
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1.5, borderBottom: '1px solid #e0e0e0' }} onClick={(e) => e.stopPropagation()}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(task);
                            }}
                            sx={{ color: '#6b7280' }}
                          >
                            {task.requestType === 'Ad-hoc Vendor Application' ? (
                              <VisibilityIcon fontSize="small" />
                            ) : (
                              <ArrowForwardIcon fontSize="small" />
                            )}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Table Footer */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                p: 2,
                borderTop: '1px solid #e0e0e0'
              }}>
                <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                  {selectedRows.length} of {pagination.total} row(s) selected.
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    sx={{ 
                      textTransform: 'none', 
                      color: '#374151', 
                      fontSize: '13px',
                      '&:disabled': {
                        color: '#9ca3af'
                      }
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.pages}
                    sx={{ 
                      textTransform: 'none', 
                      color: '#374151', 
                      fontSize: '13px',
                      '&:disabled': {
                        color: '#9ca3af'
                      }
                    }}
                  >
                    Next
                  </Button>
                </Box>
              </Box>
            </TableContainer>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default ProcurementDashboard;

