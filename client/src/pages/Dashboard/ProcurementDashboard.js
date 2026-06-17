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
  Select,
  MenuItem,
  FormControl,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  ArrowForward as ArrowForwardIcon,
  Visibility as VisibilityIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { keyframes } from '@mui/system';
import DottedArrowIcon from '../../components/DottedArrowIcon';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const bounceRight = keyframes`
  0%, 100% { transform: translateX(0px); }
  50% { transform: translateX(5px); }
`;

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
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchTasks();
  }, [page, search, statusFilter, sortOrder]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/tasks', {
        params: {
          page,
          limit: 10,
          search,
          status: statusFilter,
          sortOrder,
          view: 'mine',
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
    const lowerStatus = (status || '').toLowerCase();
    const isGreen = lowerStatus.includes('approved') || lowerStatus.includes('completed');
    const isRed = lowerStatus.includes('rejected');

    let bgColor = '#f3f4f6';
    let textColor = '#374151';
    if (isGreen) { bgColor = '#dcfce7'; textColor = '#166534'; }
    if (isRed) { bgColor = '#fee2e2'; textColor = '#991b1b'; }

    return (
      <Chip
        label={status}
        size="small"
        sx={{
          backgroundColor: bgColor,
          color: textColor,
          fontWeight: 500,
          fontSize: '12px',
          height: '24px',
          borderRadius: '12px',
          '& .MuiChip-label': {
            padding: '0 10px'
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

  const handleRelease = async (taskId, e) => {
    e.stopPropagation();
    try {
      await api.post(`/suppliers/${taskId}/unassign`);
      toast.success('Task released back to All Tasks');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release task');
    }
  };

  const handleDownload = () => {
    console.log('Download all tasks');
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
          {/* Search, Filter and Download */}
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            mb: 3,
            gap: 2,
            flexWrap: 'wrap',
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
                minWidth: { xs: '100%', sm: '180px' },
                maxWidth: { xs: '100%', sm: '280px' },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  '& fieldset': { borderColor: '#e0e0e0' },
                  '&:hover fieldset': { borderColor: '#9ca3af' },
                  '&.Mui-focused fieldset': { borderColor: '#1976d2', borderWidth: '1px' }
                }
              }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <Select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                displayEmpty
                sx={{ borderRadius: '8px', fontSize: '14px', backgroundColor: '#fff' }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="pending_procurement">Pending Procurement</MenuItem>
                <MenuItem value="more_info_required">More Info Required</MenuItem>
                <MenuItem value="pending_legal">Pending Legal</MenuItem>
                <MenuItem value="pending_contract_upload">Pending Contract Upload</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title={sortOrder === 'asc' ? 'Oldest first — click for newest first' : 'Newest first — click for oldest first'}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => { setSortOrder(s => s === 'asc' ? 'desc' : 'asc'); setPage(1); }}
                startIcon={sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                sx={{
                  borderColor: '#d1d5db',
                  color: '#374151',
                  textTransform: 'none',
                  fontSize: '14px',
                  px: 2,
                  py: 1,
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                  '&:hover': { borderColor: '#9ca3af', bgcolor: '#f9fafb' }
                }}
              >
                {sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}
              </Button>
            </Tooltip>
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
                '&:hover': { borderColor: '#9ca3af', bgcolor: '#f9fafb' }
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
                    <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5, borderBottom: '1px solid #e0e0e0' }}>Company Name</TableCell>
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
                      <TableCell colSpan={6} align="center" sx={{ py: 4, borderBottom: '1px solid #e0e0e0' }}>
                        <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                          No tasks assigned to you yet. Pick up tasks from All Tasks.
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
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                          {task.assignedTo?.toString() === user?.id?.toString() && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={(e) => handleRelease(task._id, e)}
                              sx={{
                                textTransform: 'none',
                                fontSize: '12px',
                                fontWeight: 600,
                                borderColor: '#d1d5db',
                                color: '#6b7280',
                                px: 1.5,
                                py: 0.5,
                                minWidth: 0,
                                '&:hover': { backgroundColor: '#f9fafb', borderColor: '#9ca3af' },
                              }}
                            >
                              Release
                            </Button>
                          )}
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(task);
                            }}
                            sx={{
                              color: '#578A18',
                              animation: `${bounceRight} 1.2s ease-in-out infinite`,
                              '&:hover': {
                                color: '#467014',
                                backgroundColor: 'transparent',
                                animationDuration: '0.5s',
                              },
                            }}
                          >
                            <DottedArrowIcon size={18} />
                          </IconButton>
                          </Box>
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

