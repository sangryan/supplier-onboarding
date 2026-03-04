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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Grid,
  InputAdornment,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import api from '../../utils/api';
import Footer from '../../components/Footer/Footer';


const SupplierList = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchSuppliers();
    fetchStats();
  }, [page, rowsPerPage, statusFilter]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (statusFilter) params.status = statusFilter;
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
      const approved = allSuppliers.filter(s => s.status === 'approved' || s.status === 'completed').length;
      const rejected = allSuppliers.filter(s => s.status === 'rejected').length;
      const pendingLegal = allSuppliers.filter(s => s.status === 'pending_legal').length;
      const pendingContract = allSuppliers.filter(s => s.status === 'pending_contract_upload').length;
      const notApproved = allSuppliers.filter(s => s.status === 'not_approved').length;
      setStats({
        total: allSuppliers.length,
        approved,
        pending: pendingLegal + pendingContract + notApproved,
        rejected,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchSuppliers();
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      approved: 'Approved',
      pending_legal: 'Pending Legal Approval',
      pending_contract_upload: 'Pending Contract Upload',
      completed: 'Completed',
      rejected: 'Rejected',
      not_approved: 'Not Approved',
      more_info_required: 'Requested More Info'
    };
    return statusMap[status] || status;
  };

  const getStatusChip = (status, vendorNumber) => {
    const isApproved = status === 'approved' || status === 'completed';
    const isRejected = status === 'rejected';
    const isPendingLegal = status === 'pending_legal';
    const isPendingContract = status === 'pending_contract_upload';
    return (
      <Chip
        label={getStatusLabel(status)}
        size="small"
        sx={{
          backgroundColor: isApproved ? '#dcfce7' : isRejected ? '#fef2f2' : isPendingLegal ? '#dbeafe' : '#fef9c3',
          color: isApproved ? '#166534' : isRejected ? '#991b1b' : isPendingLegal ? '#1e40af' : '#854d0e',
          fontWeight: 500,
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

  const formatTaskId = (supplier) => {
    if (!supplier || !supplier._id) return `APP-${new Date().getFullYear()}-000`;
    const year = supplier.createdAt ? new Date(supplier.createdAt).getFullYear() : new Date().getFullYear();
    const shortId = supplier._id.toString().slice(-3).toUpperCase();
    return `APP-${year}-${shortId}`;
  };

  const formatDate = (date) => {


    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
                All Suppliers
              </Typography>
              <Typography
                sx={{
                  color: '#6b7280',
                  fontSize: { xs: '13px', sm: '14px' },
                  lineHeight: 1.6,
                }}
              >
                View and manage supplier applications and their onboarding status.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/vendors/new')}
              sx={{
                bgcolor: theme.palette.green?.main || '#2e7d32',
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
                  bgcolor: theme.palette.green?.hover || '#1b5e20',
                  boxShadow: 'none'
                }
              }}
            >
              Add New On-Demand Vendor
            </Button>
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
                  Total Suppliers
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    fontSize: '24px',
                    color: '#111827'
                  }}
                >
                  {stats.total}
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
                  Not Approved
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    fontSize: '24px',
                    color: '#111827'
                  }}
                >
                  {stats.pending}
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
                  Approved
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    fontSize: '24px',
                    color: '#111827'
                  }}
                >
                  {stats.approved}
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
                  Rejected
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    fontSize: '24px',
                    color: '#111827'
                  }}
                >
                  {stats.rejected}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Search and Download */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
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
                maxWidth: '400px',
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
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel sx={{ fontSize: '14px' }}>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status Filter"
                  sx={{ borderRadius: '8px', fontSize: '14px' }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="pending_legal">Pending Legal Approval</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="not_approved">Not Approved</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                sx={{
                  borderColor: '#d1d5db',
                  color: '#374151',
                  textTransform: 'none',
                  fontSize: '14px',
                  px: 2,
                  py: 1,
                  borderRadius: '8px',
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
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5 }}>Vendor #</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5 }}>Supplier Name</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5 }}>Reg #</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5 }}>Contact</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5 }}>Service Type</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
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
                          // For users with no application, maybe show user profile or toast
                          console.log('No application for this user');
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
                      <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5 }}>
                        {supplier.vendorNumber ? (
                          <Chip
                            label={supplier.vendorNumber}
                            size="small"
                            sx={{
                              bgcolor: '#e8f5e9',
                              color: '#2e7d32',
                              fontWeight: 600,
                              borderRadius: '4px'
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="textSecondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5, fontWeight: 500 }}>
                        {supplier.supplierName}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5 }}>
                        {supplier.companyRegistrationNumber || '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5 }}>
                        {supplier.authorizedPerson?.name || '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5, textTransform: 'capitalize' }}>
                        {supplier.serviceType ? supplier.serviceType.replace('_', ' ') : '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5 }}>
                        {getStatusChip(supplier.status, supplier.vendorNumber)}
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.5 }}>
                        <VisibilityIcon sx={{ color: '#6b7280', fontSize: 20 }} />
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
                Showing {suppliers.length} of {total} suppliers
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
