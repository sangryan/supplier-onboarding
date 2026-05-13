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
  TableHead,
  TableRow,
  Chip,
  Button,
  Box,
  TextField,
  CircularProgress,
  Grid,
  InputAdornment,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Groups2 as Groups2Icon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  LockOpen as LockOpenIcon,
  LockClock as LockClockIcon,
} from '@mui/icons-material';
import api from '../../utils/api';
import Footer from '../../components/Footer/Footer';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';


const SupplierList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    totalOnboarded: 0,
    totalApplications: 0,
    activeContracts: 0,
    expiredContracts: 0,
    totalOnboardedMoM: 0,
    totalApplicationsMoM: 0,
  });

  useEffect(() => {
    fetchSuppliers();
    fetchStats();
  }, [page, rowsPerPage]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (search) params.search = search;
      params.source = 'users';

      const response = await api.get('/suppliers', { params });
      setSuppliers(response.data.data);
      setTotal(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/suppliers', { params: { source: 'users', limit: 1000 } });
      const allSuppliers = response.data.data || [];

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const currentMonthSuppliers = allSuppliers.filter((s) => {
        const createdAt = s.createdAt ? new Date(s.createdAt) : null;
        return createdAt && createdAt >= currentMonthStart;
      }).length;

      const previousMonthSuppliers = allSuppliers.filter((s) => {
        const createdAt = s.createdAt ? new Date(s.createdAt) : null;
        return createdAt && createdAt >= previousMonthStart && createdAt < currentMonthStart;
      }).length;

      const calculateMoMPercent = (currentValue, previousValue) => {
        if (previousValue === 0) {
          return currentValue > 0 ? 100 : 0;
        }
        return Math.round(((currentValue - previousValue) / previousValue) * 100);
      };

      const totalOnboardedMoM = calculateMoMPercent(currentMonthSuppliers, previousMonthSuppliers);
      const totalApplicationsMoM = calculateMoMPercent(currentMonthSuppliers, previousMonthSuppliers);

      const activeContracts = allSuppliers.filter((s) => {
        const status = (s.status || '').toLowerCase();
        return status === 'approved' || status === 'completed';
      }).length;
      const expiredContracts = allSuppliers.filter((s) => {
        const status = (s.status || '').toLowerCase();
        return status === 'rejected' || status === 'not_approved';
      }).length;

      setStats({
        totalOnboarded: allSuppliers.length,
        totalApplications: allSuppliers.length,
        activeContracts,
        expiredContracts,
        totalOnboardedMoM,
        totalApplicationsMoM,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchSuppliers();
  };

  const handleSupplierRegistrationApproval = async (userId, status, event) => {
    event.stopPropagation();
    if (!userId) return;

    try {
      await api.put(`/users/${userId}/supplier-approval`, { status });
      toast.success(`Registration ${status} successfully`);
      await fetchSuppliers();
      await fetchStats();
    } catch (error) {
      console.error('Failed to update supplier registration approval:', error);
      toast.error(error.response?.data?.message || 'Failed to update registration approval');
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      approved: 'Approved',
      pending_legal: 'Pending Legal Approval',
      pending_contract_upload: 'Pending Contract Upload',
      completed: 'Completed',
      rejected: 'Rejected',
      pending_verification: 'Pending Verification',
      registration_profile_incomplete: 'Profile Incomplete',
      pending_registration_approval: 'Pending Registration Approval',
      registration_approved: 'Registration Approved',
      registration_rejected: 'Registration Rejected',
      not_approved: 'Not Approved',
      more_info_required: 'Requested More Info'
    };
    return statusMap[status] || status;
  };

  const getRegistrationStatusChip = (supplier) => {
    const regStatus = supplier.submittedBy?.supplierApprovalStatus || supplier.status;
    const isApproved = regStatus === 'approved' || regStatus === 'registration_approved';
    const isRejected = regStatus === 'rejected' || regStatus === 'registration_rejected';
    const isPending = regStatus === 'pending' || regStatus === 'pending_registration_approval';
    const isIncomplete = regStatus === 'profile_incomplete' || regStatus === 'registration_profile_incomplete' || regStatus === 'pending_verification';

    const label = isApproved ? 'Approved' : isRejected ? 'Rejected' : isPending ? 'Pending Approval' : isIncomplete ? 'Profile Incomplete' : regStatus;
    const bg = isApproved ? '#dcfce7' : isRejected ? '#fef2f2' : isIncomplete ? '#f3f4f6' : '#fef9c3';
    const color = isApproved ? '#166534' : isRejected ? '#991b1b' : isIncomplete ? '#6b7280' : '#854d0e';

    return (
      <Chip
        label={label}
        size="small"
        sx={{
          backgroundColor: bg,
          color,
          fontWeight: 500,
          fontSize: '13px',
          height: '24px',
          borderRadius: '12px',
          '& .MuiChip-label': { padding: '0 8px' }
        }}
      />
    );
  };

  const formatDate = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPercentChange = (value) => {
    if (value > 0) return `+${value}% from last month`;
    if (value < 0) return `${value}% from last month`;
    return '0% from last month';
  };

  const fontBase = {
    fontFamily: 'Roboto, Arial, sans-serif',
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
                  ...fontBase,
                  fontWeight: 'bold',
                  mb: 1,
                  color: '#111827',
                  fontSize: { xs: '22px', sm: '28px' },
                  letterSpacing: '-0.01em',
                }}
              >
                {isMobile ? 'Supplier Contract Management' : 'Supplier Management Dashboard'}
              </Typography>
              <Typography
                sx={{
                  ...fontBase,
                  color: '#6b7280',
                  fontSize: { xs: '13px', sm: '14px' },
                  lineHeight: 1.6,
                  fontWeight: 400,
                }}
              >
                {isMobile
                  ? 'Manage your onboarded supplier contracts effortlessly.'
                  : 'Seamless, Smart, and Secure Supplier Onboarding for a Future-Ready Business.'}
              </Typography>
            </Box>
          </Box>

          {/* Summary Cards */}
          <Grid container spacing={{ xs: 1.75, sm: 2.5 }} sx={{ mb: { xs: 3, sm: 4 } }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.25, sm: 2.5 },
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  backgroundColor: '#fff',
                  minHeight: { xs: 128, sm: 136 }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ ...fontBase, color: '#6b7280', fontSize: '13px', mb: 1, fontWeight: 400 }}>
                      Total Onboarded Suppliers
                    </Typography>
                    <Typography variant="h5" sx={{ ...fontBase, fontWeight: 600, fontSize: '24px', lineHeight: 1.2, color: '#111827', mb: 0.25 }}>
                      {stats.totalOnboarded}
                    </Typography>
                    <Typography variant="caption" sx={{ ...fontBase, color: '#6b7280', fontSize: '13px', fontWeight: 400 }}>
                      {formatPercentChange(stats.totalOnboardedMoM)}
                    </Typography>
                  </Box>
                  <Groups2Icon sx={{ fontSize: 20, color: '#111827' }} />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.25, sm: 2.5 },
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  backgroundColor: '#fff',
                  minHeight: { xs: 128, sm: 136 }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ ...fontBase, color: '#6b7280', fontSize: '13px', mb: 1, fontWeight: 400 }}>
                      Total Supplier Applications
                    </Typography>
                    <Typography variant="h5" sx={{ ...fontBase, fontWeight: 600, fontSize: '24px', lineHeight: 1.2, color: '#111827', mb: 0.25 }}>
                      {stats.totalApplications}
                    </Typography>
                    <Typography variant="caption" sx={{ ...fontBase, color: '#6b7280', fontSize: '13px', fontWeight: 400 }}>
                      {formatPercentChange(stats.totalApplicationsMoM)}
                    </Typography>
                  </Box>
                  <AssignmentTurnedInIcon sx={{ fontSize: 20, color: '#111827' }} />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.25, sm: 2.5 },
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  backgroundColor: '#fff',
                  minHeight: { xs: 128, sm: 136 }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ ...fontBase, color: '#6b7280', fontSize: '13px', mb: 1, fontWeight: 400 }}>
                      Active Contracts
                    </Typography>
                    <Typography variant="h5" sx={{ ...fontBase, fontWeight: 600, fontSize: '24px', lineHeight: 1.2, color: '#111827' }}>
                      {stats.activeContracts}
                    </Typography>
                  </Box>
                  <LockOpenIcon sx={{ fontSize: 20, color: '#578A18' }} />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.25, sm: 2.5 },
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  backgroundColor: '#fff',
                  minHeight: { xs: 128, sm: 136 }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ ...fontBase, color: '#6b7280', fontSize: '13px', mb: 1, fontWeight: 400 }}>
                      Expired Contracts
                    </Typography>
                    <Typography variant="h5" sx={{ ...fontBase, fontWeight: 600, fontSize: '24px', lineHeight: 1.2, color: '#111827' }}>
                      {stats.expiredContracts}
                    </Typography>
                  </Box>
                  <LockClockIcon sx={{ fontSize: 20, color: '#b91c1c' }} />
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h5"
              sx={{ ...fontBase, fontWeight: 'bold', mb: 0.5, color: '#111827', fontSize: { xs: '22px', sm: '28px' }, letterSpacing: '-0.01em' }}
            >
              Supplier List
            </Typography>
            <Typography sx={{ ...fontBase, color: '#6b7280', fontSize: { xs: '13px', sm: '14px' }, mb: 2, fontWeight: 400 }}>
              View and manage your onboarded suppliers here
            </Typography>
          </Box>

          {/* Search and Download */}
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 1.5 }}>
            <TextField
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
              sx={{
                borderColor: '#d1d5db',
                color: '#374151',
                textTransform: 'none',
                fontSize: { xs: '13px', sm: '14px' },
                fontWeight: 500,
                px: { xs: 1.75, sm: 2 },
                py: 1,
                borderRadius: '8px',
                whiteSpace: 'nowrap',
                '&:hover': {
                  borderColor: '#9ca3af',
                  bgcolor: '#f9fafb'
                }
              }}
            >
              Download all
            </Button>
          </Box>
        </Box>

        {/* Suppliers Table */}
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
            <Table sx={{ minWidth: { xs: 580, md: 900 } }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                  <TableCell sx={{ ...fontBase, fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5 }}>Company Name</TableCell>
                  <TableCell sx={{ ...fontBase, fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>Supplier Email</TableCell>
                  <TableCell sx={{ ...fontBase, fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>Requested Date</TableCell>
                  <TableCell sx={{ ...fontBase, fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>Approved Date</TableCell>
                  <TableCell sx={{ ...fontBase, fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5 }}>Status</TableCell>
                  <TableCell align="right" sx={{ ...fontBase, fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" sx={{ ...fontBase, color: '#6b7280', fontSize: '13px' }}>
                        No suppliers found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  suppliers.map((supplier) => (
                    <TableRow
                      key={supplier._id}
                      hover
                      onClick={() => {
                        if (supplier.isPlaceholder) {
                        } else {
                          navigate(`/suppliers/${supplier._id}`);
                        }
                      }}
                      sx={{
                        cursor: supplier.isPlaceholder ? 'default' : 'pointer',
                        '&:last-child td, &:last-child th': { border: 0 },
                        '&:hover': {
                          backgroundColor: '#f9fafb'
                        }
                      }}
                    >
                      <TableCell sx={{ ...fontBase, fontSize: '14px', color: '#111827', py: 1.5, fontWeight: 500 }}>
                        {supplier.supplierName || '-'}
                      </TableCell>
                      <TableCell sx={{ ...fontBase, fontSize: '14px', color: '#111827', py: 1.5, fontWeight: 400, display: { xs: 'none', md: 'table-cell' } }}>
                        {supplier.companyEmail || supplier.submittedBy?.email || '-'}
                      </TableCell>
                      <TableCell sx={{ ...fontBase, fontSize: '14px', color: '#111827', py: 1.5, fontWeight: 400, display: { xs: 'none', md: 'table-cell' } }}>
                        {formatDate(supplier.submittedAt || supplier.createdAt)}
                      </TableCell>
                      <TableCell sx={{ ...fontBase, fontSize: '14px', color: '#111827', py: 1.5, fontWeight: 400, display: { xs: 'none', md: 'table-cell' } }}>
                        {formatDate(supplier.registrationReviewedAt || supplier.submittedBy?.supplierApprovalReviewedAt)}
                      </TableCell>
                      <TableCell sx={{ ...fontBase, fontSize: '14px', color: '#111827', py: 1.5, fontWeight: 400 }}>
                        {getRegistrationStatusChip(supplier)}
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.5 }}>
                        {user?.role === 'procurement' &&
                          (supplier.submittedBy?.supplierApprovalStatus === 'pending' ||
                           supplier.status === 'pending_registration_approval') &&
                          (supplier.userId || supplier.submittedBy?._id) ? (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={(e) => handleSupplierRegistrationApproval(supplier.userId || supplier.submittedBy?._id, 'approved', e)}
                              sx={{
                                textTransform: 'none',
                                fontSize: '12px',
                                minWidth: '72px',
                                bgcolor: '#578A18',
                                '&:hover': { bgcolor: '#467014' }
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={(e) => handleSupplierRegistrationApproval(supplier.userId || supplier.submittedBy?._id, 'rejected', e)}
                              sx={{
                                textTransform: 'none',
                                fontSize: '12px',
                                minWidth: '62px',
                                borderColor: '#dc2626',
                                color: '#dc2626',
                                '&:hover': {
                                  borderColor: '#b91c1c',
                                  color: '#b91c1c',
                                  backgroundColor: '#fef2f2'
                                }
                              }}
                            >
                              Reject
                            </Button>
                          </Box>
                        ) : (
                          <VisibilityIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                        )}
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
              <Typography variant="body2" sx={{ ...fontBase, color: '#6b7280', fontSize: '13px' }}>
                0 of {total} row(s) selected.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  size="small"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
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
                  disabled={(page + 1) * rowsPerPage >= total}
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

export default SupplierList;
