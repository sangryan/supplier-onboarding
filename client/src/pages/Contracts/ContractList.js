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
  InputAdornment,
  CircularProgress,
  Grid,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  ChevronRight as ChevronRightIcon,
  Description as DescriptionIcon,
  Warning as WarningIcon,
  ErrorOutline as ErrorOutlineIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import api from '../../utils/api';
import Footer from '../../components/Footer/Footer';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '@mui/material/styles';

const ContractList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Stats
  const [stats, setStats] = useState({
    active: 25,
    expiringSoon: 10,
    expired: 5,
    adHoc: 20
  });

  useEffect(() => {
    fetchContracts();
    fetchStats();
  }, [page, search, activeTab]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/contracts/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search,
      };

      if (activeTab === 'Registered Suppliers') params.supplierType = 'registered';
      if (activeTab === 'Ad-hoc Vendors') params.supplierType = 'adhoc';

      const response = await api.get('/contracts', { params });

      if (response.data.success) {
        setContracts(response.data.data || []);
        setPagination(response.data.pagination || { total: 0, pages: 1 });
      } else {
        setContracts([]);
        setPagination({ total: 0, pages: 1 });
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      toast.error('Failed to fetch contracts');
      setContracts([]);
      setPagination({ total: 0, pages: 1 });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getContractStatusChip = (contract) => {
    let status = contract.status;

    // Calculate if expiring soon or expired dynamically based on endDate if active
    if (status === 'active' && contract.endDate) {
      const daysUntilExpiry = Math.ceil((new Date(contract.endDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 0) {
        status = 'expired';
      } else if (daysUntilExpiry <= 30) {
        status = 'expiring_soon';
      }
    }

    let label = status.charAt(0).toUpperCase() + status.slice(1);
    let bgColor = '#f3f4f6';
    let textColor = '#374151';

    if (status === 'active') {
      label = 'Active';
      bgColor = '#4d8c2e'; // Dark green from image
      textColor = '#ffffff';
    } else if (status === 'expiring_soon') {
      label = 'Expiring Soon';
      bgColor = '#f3f4f6'; // Light grey
      textColor = '#111827';
    } else if (status === 'expired') {
      label = 'Expired';
      bgColor = '#dc2626'; // Red from image
      textColor = '#ffffff';
    } else if (status === 'pending_upload' || (status === 'draft' && !contract.signedContract)) {
      label = 'Pending Upload';
      bgColor = '#fef3c7'; // Light yellow/amber
      textColor = '#92400e';
    } else if (status === 'draft') {
      label = 'Draft';
      bgColor = '#f3f4f6';
      textColor = '#374151';
    }

    return (
      <Chip
        label={label}
        size="small"
        sx={{
          backgroundColor: bgColor,
          color: textColor,
          fontWeight: 600,
          fontSize: '12px',
          height: '24px',
          borderRadius: '4px', // The design has slightly rounded rect chips
          '& .MuiChip-label': {
            padding: '0 8px'
          }
        }}
      />
    );
  };

  const tabs = ['All', 'Registered Suppliers', 'Ad-hoc Vendors'];

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
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              mb: 0.5,
              color: '#111827',
              fontSize: { xs: '22px', sm: '28px' },
              letterSpacing: '-0.01em',
            }}
          >
            Supplier Contract Management
          </Typography>
          <Typography
            sx={{
              color: '#6b7280',
              fontSize: { xs: '13px', sm: '14px' },
              lineHeight: 1.6,
              mb: 3
            }}
          >
            Manage your onboarded supplier contracts effortlessly.
          </Typography>

          {/* Tabs */}
          <Box sx={{ display: 'flex', gap: 1, p: 0.5, bgcolor: '#f9fafb', borderRadius: '8px', width: 'fit-content' }}>
            {tabs.map((tab) => (
              <Button
                key={tab}
                onClick={() => { setActiveTab(tab); setPage(0); }}
                sx={{
                  textTransform: 'none',
                  color: activeTab === tab ? '#111827' : '#6b7280',
                  fontWeight: activeTab === tab ? 600 : 500,
                  fontSize: '14px',
                  bgcolor: activeTab === tab ? '#fff' : 'transparent',
                  px: 2,
                  py: 0.75,
                  borderRadius: '6px',
                  boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  '&:hover': {
                    bgcolor: activeTab === tab ? '#fff' : '#f3f4f6',
                  }
                }}
              >
                {tab}
              </Button>
            ))}
          </Box>
        </Box>

        {/* 4 Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 5 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#fff',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography sx={{ color: '#111827', fontSize: '14px', fontWeight: 500 }}>
                  Active Contracts
                </Typography>
                <DescriptionIcon sx={{ color: '#4d8c2e', fontSize: 20 }} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '28px', color: '#111827' }}>
                {stats.active}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#fff',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography sx={{ color: '#111827', fontSize: '14px', fontWeight: 500 }}>
                  Expiring Soon Contracts
                </Typography>
                <DescriptionIcon sx={{ color: '#9ca3af', fontSize: 20 }} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '28px', color: '#111827' }}>
                {stats.expiringSoon}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#fff',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography sx={{ color: '#111827', fontSize: '14px', fontWeight: 500 }}>
                  Expired Contracts
                </Typography>
                <DescriptionIcon sx={{ color: '#dc2626', fontSize: 20 }} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '28px', color: '#111827' }}>
                {stats.expired}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#fff',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography sx={{ color: '#111827', fontSize: '14px', fontWeight: 500 }}>
                  Ad-hoc Vendors
                </Typography>
                <AssignmentIcon sx={{ color: '#6b7280', fontSize: 20 }} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '28px', color: '#111827' }}>
                {stats.adHoc}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Supplier List Section Header */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 0.5,
              color: '#111827',
              fontSize: '18px',
            }}
          >
            Supplier List
          </Typography>
          <Typography
            sx={{
              color: '#6b7280',
              fontSize: '14px',
            }}
          >
            View and manage your onboarded suppliers here
          </Typography>
        </Box>

        {/* Search and Download */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
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
              maxWidth: '300px',
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#fff',
                borderRadius: '6px',
                '& fieldset': {
                  borderColor: '#e5e7eb'
                },
                '&:hover fieldset': {
                  borderColor: '#d1d5db'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#9ca3af',
                  borderWidth: '1px'
                }
              }
            }}
          />
          <Button
            variant="outlined"
            startIcon={<DownloadIcon fontSize="small" />}
            sx={{
              borderColor: '#e5e7eb',
              color: '#374151',
              textTransform: 'none',
              fontSize: '13px',
              fontWeight: 500,
              px: 2,
              py: 0.75,
              borderRadius: '6px',
              '&:hover': {
                borderColor: '#d1d5db',
                bgcolor: '#f9fafb'
              }
            }}
          >
            Download all
          </Button>
        </Box>

        {/* Table */}
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#fff',
            overflow: 'hidden'
          }}
        >
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#fff' }}>
                <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', py: 2, borderBottom: '1px solid #e5e7eb' }}>Vendor Number</TableCell>
                <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', py: 2, borderBottom: '1px solid #e5e7eb' }}>Supplier Name</TableCell>
                <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', py: 2, borderBottom: '1px solid #e5e7eb' }}>Supplier Type</TableCell>
                <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', py: 2, borderBottom: '1px solid #e5e7eb' }}>Last Updated</TableCell>
                <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', py: 2, borderBottom: '1px solid #e5e7eb' }}>Contract Status</TableCell>
                <TableCell align="right" sx={{ py: 2, borderBottom: '1px solid #e5e7eb', width: 50 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, borderBottom: 0 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, borderBottom: 0 }}>
                    <Typography sx={{ color: '#6b7280', fontSize: '14px' }}>
                      No contracts found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((contract) => {
                  const vendorNumber = contract.supplier?.vendorNumber || contract.vendorNumber || '-';
                  const supplierName = contract.supplier?.supplierName || contract.supplierName || '-';
                  const isAdhoc = contract.isAdhoc || vendorNumber.startsWith('AD-');
                  const supplierType = isAdhoc ? 'Ad-hoc Vendor' : 'Registered Supplier';

                  return (
                    <TableRow
                      key={contract._id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f9fafb' }
                      }}
                      onClick={() => {
                        if (contract.isPlaceholder && contract.supplier?._id) {
                          navigate(`/suppliers/${contract.supplier._id}`);
                        } else {
                          navigate(`/contracts/${contract._id}`);
                        }
                      }}
                    >
                      <TableCell sx={{ fontSize: '14px', color: '#111827', py: 2, borderBottom: '1px solid #f3f4f6' }}>
                        {vendorNumber}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#111827', py: 2, borderBottom: '1px solid #f3f4f6' }}>
                        {supplierName}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#111827', py: 2, borderBottom: '1px solid #f3f4f6' }}>
                        {supplierType}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#111827', py: 2, borderBottom: '1px solid #f3f4f6' }}>
                        {formatDate(contract.updatedAt || contract.createdAt)}
                      </TableCell>
                      <TableCell sx={{ py: 2, borderBottom: '1px solid #f3f4f6' }}>
                        {getContractStatusChip(contract)}
                      </TableCell>
                      <TableCell align="right" sx={{ py: 2, borderBottom: '1px solid #f3f4f6' }}>
                        <IconButton size="small" sx={{ color: '#9ca3af' }}>
                          <ChevronRightIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Table Footer / Pagination */}
          {!loading && contracts.length > 0 && (
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
            }}>
              <Typography sx={{ color: '#6b7280', fontSize: '13px' }}>
                0 of {pagination.total || contracts.length} row(s) selected.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(e) => { e.stopPropagation(); setPage(Math.max(0, page - 1)); }}
                  disabled={page === 0}
                  sx={{
                    textTransform: 'none',
                    color: '#374151',
                    fontSize: '13px',
                    borderColor: '#e5e7eb',
                    bgcolor: '#fff',
                    '&:hover': {
                      borderColor: '#d1d5db',
                      bgcolor: '#f9fafb'
                    },
                    '&:disabled': {
                      color: '#9ca3af',
                      borderColor: '#f3f4f6',
                    }
                  }}
                >
                  Previous
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(e) => { e.stopPropagation(); setPage(page + 1); }}
                  // Roughly disabled if not needed, mock logic here
                  disabled={contracts.length < rowsPerPage}
                  sx={{
                    textTransform: 'none',
                    color: '#374151',
                    fontSize: '13px',
                    borderColor: '#e5e7eb',
                    bgcolor: '#fff',
                    '&:hover': {
                      borderColor: '#d1d5db',
                      bgcolor: '#f9fafb'
                    },
                    '&:disabled': {
                      color: '#9ca3af',
                      borderColor: '#f3f4f6',
                    }
                  }}
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}
        </TableContainer>
      </Container>
      <Footer />
    </Box>
  );
};

export default ContractList;
