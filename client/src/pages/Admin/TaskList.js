import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  Tabs,
  Tab,
  TableHead,
  TableRow,
  Box,
  Button,
  TextField,
  InputAdornment,
  Grid,
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
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Visibility as VisibilityIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { keyframes } from '@mui/system';
import DottedArrowIcon from '../../components/DottedArrowIcon';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Footer from '../../components/Footer/Footer';
import { toast } from 'react-toastify';

const bounceRight = keyframes`
  0%, 100% { transform: translateX(0px); }
  50% { transform: translateX(5px); }
`;

const TaskList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [counts, setCounts] = useState({
    allTasks: 0,
    myTasks: 0,
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
  const [view, setView] = useState('all');

  useEffect(() => {
    fetchTasks();
  }, [page, search, statusFilter, sortOrder, view]);

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
          view,
        }
      });

      if (response.data.success) {
        setTasks(response.data.data || []);
        const c = response.data.counts || {};
        setCounts({
          allTasks: c.allTasks ?? 0,
          myTasks: c.myTasks ?? 0,
          pendingApplications: c.pendingApplications ?? 0,
          pendingVendorAssignment: c.pendingVendorAssignment ?? 0,
          pendingProfileUpdate: c.pendingProfileUpdate ?? 0,
          pendingContactUpdate: c.pendingContactUpdate ?? 0,
        });
        setPagination(response.data.pagination || { total: 0, pages: 1, limit: 10 });
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePickUp = async (taskId, e) => {
    e.stopPropagation();
    try {
      await api.post(`/suppliers/${taskId}/assign`);
      toast.success('Task picked up — moved to My Tasks');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to pick up task');
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

  const getStatusLabel = (status) => {
    const statusMap = {
      pending_legal: 'Pending Legal Approval',
      pending_contract_upload: 'Pending Contract Upload',
      pending_procurement: 'Pending Procurement',
      approved: 'Approved',
      completed: 'Completed',
      rejected: 'Rejected',
      submitted: 'Submitted',
      under_review: 'Under Review',
      more_info_required: 'Requested More Info',
    };
    return statusMap[status] || status;
  };

  const getStatusChip = (status) => {
    return (
      <Chip
        label={getStatusLabel(status)}
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
    navigate('/vendors/new');
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSelectRow = (taskId, checked) => {
    if (checked) {
      setSelectedRows(prev => [...prev, taskId]);
    } else {
      setSelectedRows(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(tasks.map(task => task._id));
    } else {
      setSelectedRows([]);
    }
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
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
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
                bgcolor: theme.palette.green.main,
                color: '#fff',
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 500,
                px: 2.5,
                py: 1,
                borderRadius: '6px',
                boxShadow: 'none',
                whiteSpace: 'nowrap',
                '&:hover': {
                  bgcolor: theme.palette.green.hover,
                  boxShadow: 'none'
                }
              }}
            >
              Add New On-Demand Vendor
            </Button>
          </Box>

          {/* All Tasks / My Tasks tabs */}
          <Box sx={{ borderBottom: '1px solid #e5e7eb', mb: 3 }}>
            <Tabs
              value={view}
              onChange={(_, val) => { setView(val); setPage(1); }}
              sx={{
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '14px', minWidth: 120 },
                '& .Mui-selected': { color: '#578A18' },
                '& .MuiTabs-indicator': { backgroundColor: '#578A18' },
              }}
            >
              <Tab label={`All Tasks${counts.allTasks > 0 ? ` (${counts.allTasks})` : ''}`} value="all" />
              <Tab label={`My Tasks${counts.myTasks > 0 ? ` (${counts.myTasks})` : ''}`} value="mine" />
            </Tabs>
          </Box>

          {/* Summary Cards */}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={6} sm={3}>
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
            <Grid item xs={6} sm={3}>
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
            <Grid item xs={6} sm={3}>
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
            <Grid item xs={6} sm={3}>
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
        </Box>

        {/* Tasks Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              overflow: 'hidden',
              backgroundColor: '#fff'
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                  <TableCell padding="checkbox" sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5 }}>
                    <Checkbox
                      size="small"
                      checked={tasks.length > 0 && selectedRows.length === tasks.length}
                      indeterminate={selectedRows.length > 0 && selectedRows.length < tasks.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      sx={{ p: 0 }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5 }}>ID</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5 }}>Company Name</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5 }}>Request Type</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5 }}>Submission Date</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
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
                      onClick={() => handleRowClick(task)}
                      sx={{
                        cursor: 'pointer',
                        '&:last-child td, &:last-child th': { border: 0 },
                        '&:hover': {
                          backgroundColor: '#f9fafb'
                        }
                      }}
                    >
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          size="small"
                          checked={selectedRows.includes(task._id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectRow(task._id, e.target.checked);
                          }}
                          sx={{ p: 0 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5 }}>
                        {formatTaskId(task)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5 }}>
                        {task.supplierName}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5 }}>
                        {task.requestType}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5 }}>
                        {formatDate(task.submissionDate)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5 }}>
                        {getStatusChip(task.status)}
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.5 }} onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                          {view === 'all' && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={(e) => handlePickUp(task._id, e)}
                              sx={{
                                textTransform: 'none',
                                fontSize: '12px',
                                fontWeight: 600,
                                borderColor: '#578A18',
                                color: '#578A18',
                                px: 1.5,
                                py: 0.5,
                                minWidth: 0,
                                '&:hover': { backgroundColor: '#f0fdf4', borderColor: '#467014' },
                              }}
                            >
                              Pick Up
                            </Button>
                          )}
                          {view === 'mine' && task.assignedTo?.toString() === user?.id?.toString() && (
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
      </Container>
      <Footer />
    </Box>
  );
};

export default TaskList;
