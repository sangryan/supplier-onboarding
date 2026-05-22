import React, { useEffect, useState } from 'react';
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
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import api from '../../utils/api';
import Footer from '../../components/Footer/Footer';
import { toast } from 'react-toastify';

const fontBase = { fontFamily: 'Roboto, Arial, sans-serif' };

const RegistrationApprovals = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const rowsPerPage = 10;

  useEffect(() => {
    fetchRegistrations();
  }, [page]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, limit: rowsPerPage };
      if (search) params.search = search;
      const response = await api.get('/users/pending-registrations', { params });
      setRegistrations(response.data.data || []);
      setTotal(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchRegistrations();
  };

  const handleApproval = async (userId, status, event) => {
    event.stopPropagation();
    try {
      await api.put(`/users/${userId}/supplier-approval`, { status });
      toast.success(`Registration ${status} successfully`);
      fetchRegistrations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update registration');
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth="lg" sx={{ pt: { xs: 3, sm: 5 }, pb: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 }, flex: 1 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ ...fontBase, fontWeight: 'bold', mb: 1, color: '#111827', fontSize: { xs: '22px', sm: '28px' } }}>
            Registration Approvals
          </Typography>
          <Typography sx={{ ...fontBase, color: '#6b7280', fontSize: '14px', mb: 3 }}>
            Review and approve or reject new supplier registration requests.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search by name or email"
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
                minWidth: '200px',
                maxWidth: '320px',
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  '& fieldset': { borderColor: '#e0e0e0' },
                  '&:hover fieldset': { borderColor: '#9ca3af' },
                  '&.Mui-focused fieldset': { borderColor: '#1976d2', borderWidth: '1px' }
                }
              }}
            />
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                  <TableCell sx={{ ...fontBase, fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5 }}>Name</TableCell>
                  <TableCell sx={{ ...fontBase, fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5 }}>Company Name</TableCell>
                  <TableCell sx={{ ...fontBase, fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5, display: { xs: 'none', sm: 'table-cell' } }}>Email</TableCell>
                  <TableCell sx={{ ...fontBase, fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>Registered</TableCell>
                  <TableCell sx={{ ...fontBase, fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5 }}>Status</TableCell>
                  <TableCell align="right" sx={{ ...fontBase, fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {registrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" sx={{ ...fontBase, color: '#6b7280', fontSize: '13px' }}>
                        No pending registration requests
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  registrations.map((reg) => (
                    <TableRow key={reg._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ ...fontBase, fontSize: '14px', color: '#111827', py: 1.5, fontWeight: 500 }}>
                        {[reg.firstName, reg.lastName].filter(Boolean).join(' ') || '-'}
                      </TableCell>
                      <TableCell sx={{ ...fontBase, fontSize: '14px', color: '#111827', py: 1.5 }}>
                        {reg.companyName || <Typography component="span" sx={{ color: '#9ca3af', fontSize: '13px' }}>Not provided</Typography>}
                      </TableCell>
                      <TableCell sx={{ ...fontBase, fontSize: '14px', color: '#111827', py: 1.5, display: { xs: 'none', sm: 'table-cell' } }}>
                        {reg.email}
                      </TableCell>
                      <TableCell sx={{ ...fontBase, fontSize: '14px', color: '#111827', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>
                        {formatDate(reg.createdAt)}
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Chip
                          label="Pending Approval"
                          size="small"
                          sx={{ backgroundColor: '#fef9c3', color: '#854d0e', fontWeight: 500, fontSize: '13px', height: '24px', borderRadius: '12px', '& .MuiChip-label': { padding: '0 8px' } }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={(e) => handleApproval(reg._id, 'approved', e)}
                            sx={{ textTransform: 'none', fontSize: '12px', minWidth: '72px', bgcolor: '#578A18', '&:hover': { bgcolor: '#467014' } }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => handleApproval(reg._id, 'rejected', e)}
                            sx={{ textTransform: 'none', fontSize: '12px', minWidth: '62px', borderColor: '#dc2626', color: '#dc2626', '&:hover': { borderColor: '#b91c1c', color: '#b91c1c', backgroundColor: '#fef2f2' } }}
                          >
                            Reject
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="body2" sx={{ ...fontBase, color: '#6b7280', fontSize: '13px' }}>
                {total} pending request{total !== 1 ? 's' : ''}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button size="small" onClick={() => setPage(page - 1)} disabled={page === 0} sx={{ textTransform: 'none', color: '#374151', fontSize: '13px', '&:disabled': { color: '#9ca3af' } }}>
                  Previous
                </Button>
                <Button size="small" onClick={() => setPage(page + 1)} disabled={(page + 1) * rowsPerPage >= total} sx={{ textTransform: 'none', color: '#374151', fontSize: '13px', '&:disabled': { color: '#9ca3af' } }}>
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

export default RegistrationApprovals;
