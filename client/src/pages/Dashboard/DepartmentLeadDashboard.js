import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  ChevronRight as ChevronRightIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { keyframes } from '@mui/system';
import DottedArrowIcon from '../../components/DottedArrowIcon';
import api from '../../utils/api';
import Footer from '../../components/Footer/Footer';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
};

const getContractStatusChip = (contract) => {
  let status = contract.status;
  if (status === 'active' && contract.endDate) {
    const daysUntilExpiry = Math.ceil((new Date(contract.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 0) status = 'expired';
    else if (daysUntilExpiry <= 30) status = 'expiring_soon';
  }

  if (status === 'active') {
    return <Chip label="Active" size="small" sx={{ bgcolor: '#4d8c2e', color: '#fff', fontWeight: 600, fontSize: '11px', height: 22 }} />;
  }
  if (status === 'expiring_soon') {
    return <Chip label="Expiring Soon" size="small" sx={{ bgcolor: '#f3f4f6', color: '#111827', fontWeight: 600, fontSize: '11px', height: 22 }} />;
  }
  if (status === 'expired') {
    return <Chip label="Expired" size="small" sx={{ bgcolor: '#dc2626', color: '#fff', fontWeight: 600, fontSize: '11px', height: 22 }} />;
  }
  if (status === 'terminated') {
    return <Chip label="Terminated" size="small" sx={{ bgcolor: '#f3f4f6', color: '#111827', fontWeight: 600, fontSize: '11px', height: 22 }} />;
  }
  return <Chip label={String(status || '-').replace(/_/g, ' ')} size="small" sx={{ bgcolor: '#f3f4f6', color: '#111827', fontWeight: 600, fontSize: '11px', height: 22 }} />;
};

const bounceRight = keyframes`
  0%, 100% { transform: translateX(0px); }
  50% { transform: translateX(5px); }
`;

const DepartmentLeadDashboard = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const [pagination, setPagination] = useState({ total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchContracts();
  }, [search, page, statusFilter, sortOrder]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search,
        sortOrder,
      };
      if (statusFilter) params.status = statusFilter;
      const response = await api.get('/contracts', { params });

      if (response.data.success) {
        setContracts(response.data.data || []);
        setPagination(response.data.pagination || { total: 0 });
      } else {
        setContracts([]);
        setPagination({ total: 0 });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch department contracts');
      setContracts([]);
      setPagination({ total: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth="lg" sx={{ pt: { xs: 3, sm: 5 }, pb: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 }, flex: 1 }}>
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: { xs: '34px', sm: '32px' }, lineHeight: 1.15 }}>
            Supplier List
          </Typography>
          <Typography sx={{ color: '#6b7280', fontSize: '14px' }}>
            View your department suppliers and their contract status
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, mb: 2, gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search"
            size="small"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#9ca3af', fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              minWidth: { xs: '100%', sm: '180px' },
              maxWidth: { xs: '100%', sm: '280px' },
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                '& input': { fontSize: '14px' },
                '& fieldset': { borderColor: '#e5e7eb' },
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              displayEmpty
              sx={{ borderRadius: '8px', fontSize: '14px', backgroundColor: '#fff' }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="expiring_soon">Expiring Soon</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
              <MenuItem value="pending_upload">Pending Upload</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title={sortOrder === 'asc' ? 'Oldest first — click for newest first' : 'Newest first — click for oldest first'}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => { setSortOrder(s => s === 'asc' ? 'desc' : 'asc'); setPage(0); }}
              startIcon={sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
              sx={{
                borderColor: '#e5e7eb',
                color: '#111827',
                textTransform: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                '&:hover': { borderColor: '#d1d5db', bgcolor: '#f9fafb' }
              }}
            >
              {sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}
            </Button>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon fontSize="small" />}
            sx={{
              borderColor: '#e5e7eb',
              color: '#111827',
              textTransform: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Export
          </Button>
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          <Table sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#fff' }}>
                <TableCell sx={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Vendor Number</TableCell>
                <TableCell sx={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Supplier Name</TableCell>
                <TableCell sx={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Contract Expiry Date</TableCell>
                <TableCell sx={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Last Updated</TableCell>
                <TableCell sx={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Contract Status</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell>
                </TableRow>
              ) : contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <Typography sx={{ color: '#6b7280', fontSize: '14px' }}>No contracts found for your department</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((contract) => (
                  <TableRow
                    key={contract._id}
                    hover
                    sx={{ '&:hover': { backgroundColor: '#f9fafb' }, cursor: 'pointer' }}
                    onClick={() => {
                      if (contract.isPlaceholder && contract.supplier?._id) navigate(`/suppliers/${contract.supplier._id}`);
                      else navigate(`/contracts/${contract._id}`);
                    }}
                  >
                    <TableCell sx={{ fontSize: '14px', color: '#111827' }}>{contract.supplier?.vendorNumber || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '14px', color: '#111827' }}>{contract.supplier?.supplierName || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '14px', color: '#111827' }}>{formatDate(contract.endDate)}</TableCell>
                    <TableCell sx={{ fontSize: '14px', color: '#111827' }}>{formatDate(contract.updatedAt || contract.createdAt)}</TableCell>
                    <TableCell>{getContractStatusChip(contract)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!loading && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
              <Typography sx={{ color: '#6b7280', fontSize: '13px' }}>
                0 of {pagination.total || contracts.length} row(s) selected.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={page === 0}
                  onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                  sx={{ textTransform: 'none', borderColor: '#e5e7eb', color: '#374151', fontSize: '13px' }}
                >
                  Previous
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={contracts.length < rowsPerPage}
                  onClick={() => setPage((prev) => prev + 1)}
                  sx={{ textTransform: 'none', borderColor: '#e5e7eb', color: '#374151', fontSize: '13px' }}
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

export default DepartmentLeadDashboard;
