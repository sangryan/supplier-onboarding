import React, { useEffect, useState } from 'react';
import {
  Container, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Box, Button, TextField,
  InputAdornment, Chip, CircularProgress, Select, MenuItem, FormControl,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import api from '../../utils/api';
import Footer from '../../components/Footer/Footer';

const ACTION_LABELS = {
  USER_LOGIN: { label: 'Login', color: '#3b82f6', bg: '#eff6ff' },
  USER_CREATED: { label: 'User Created', color: '#16a34a', bg: '#f0fdf4' },
  USER_UPDATED: { label: 'User Updated', color: '#ca8a04', bg: '#fefce8' },
  USER_DELETED: { label: 'User Deleted', color: '#dc2626', bg: '#fef2f2' },
  USER_SUSPENDED: { label: 'User Suspended', color: '#ea580c', bg: '#fff7ed' },
  USER_ACTIVATED: { label: 'User Activated', color: '#16a34a', bg: '#f0fdf4' },
  MAINTENANCE_ENABLED: { label: 'Maintenance ON', color: '#7c3aed', bg: '#f5f3ff' },
  MAINTENANCE_DISABLED: { label: 'Maintenance OFF', color: '#0891b2', bg: '#ecfeff' },
  APPLICATION_STATUS_CHANGED: { label: 'App Status Changed', color: '#ca8a04', bg: '#fefce8' },
  CONTRACT_TERMINATED: { label: 'Contract Terminated', color: '#dc2626', bg: '#fef2f2' },
  CONTRACT_COMPLETED: { label: 'Contract Completed', color: '#16a34a', bg: '#f0fdf4' },
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => {
    fetchLogs();
  }, [page, search, actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit-logs', {
        params: { page, limit: 20, search: search || undefined, action: actionFilter || undefined }
      });
      setLogs(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, pages: 1 });
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handleActionFilter = (val) => {
    setActionFilter(val);
    setPage(1);
  };

  const formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getActionChip = (action) => {
    const meta = ACTION_LABELS[action] || { label: action, color: '#6b7280', bg: '#f3f4f6' };
    return (
      <Chip
        label={meta.label}
        size="small"
        sx={{ backgroundColor: meta.bg, color: meta.color, fontWeight: 600, fontSize: '12px', height: '24px', borderRadius: '12px', '& .MuiChip-label': { px: 1.25 } }}
      />
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth="lg" sx={{ pt: { xs: 3, sm: 5 }, pb: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 }, flex: 1 }}>
        <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5, color: '#111827', fontSize: '28px', letterSpacing: '-0.01em' }}>
            Audit Logs
          </Typography>
          <Typography sx={{ color: '#6b7280', fontSize: '14px' }}>
            Track all actions performed on the platform
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#9ca3af', fontSize: 20 }} /></InputAdornment> }}
            sx={{ flex: 1, minWidth: 200, maxWidth: 320, '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#fff', '& fieldset': { borderColor: '#e0e0e0' } } }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select value={actionFilter} onChange={(e) => handleActionFilter(e.target.value)} displayEmpty sx={{ borderRadius: '8px', fontSize: '14px', backgroundColor: '#fff' }}>
              <MenuItem value="">All Actions</MenuItem>
              {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
            <Table sx={{ minWidth: { xs: 600, md: 800 } }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5 }}>Date & Time</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5 }}>Action</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5 }}>Performed By</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>Target</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5, display: { xs: 'none', lg: 'table-cell' } }}>IP Address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Typography sx={{ color: '#6b7280', fontSize: '13px' }}>No audit logs found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log._id} hover sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}>
                      <TableCell sx={{ fontSize: '13px', color: '#374151', py: 1.5, whiteSpace: 'nowrap' }}>
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>{getActionChip(log.action)}</TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>{log.performedByName || '-'}</Typography>
                        <Typography sx={{ fontSize: '12px', color: '#6b7280' }}>{log.performedByEmail || ''}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '13px', color: '#374151', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>
                        {log.targetName || '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '12px', color: '#9ca3af', py: 1.5, display: { xs: 'none', lg: 'table-cell' } }}>
                        {log.ipAddress || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                {pagination.total} total log(s)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={() => setPage(p => p - 1)} disabled={page === 1} sx={{ textTransform: 'none', fontSize: '13px', color: '#374151', '&:disabled': { color: '#9ca3af' } }}>
                  Previous
                </Button>
                <Typography sx={{ fontSize: '13px', color: '#6b7280', alignSelf: 'center' }}>
                  {page} / {pagination.pages || 1}
                </Typography>
                <Button size="small" onClick={() => setPage(p => p + 1)} disabled={page >= (pagination.pages || 1)} sx={{ textTransform: 'none', fontSize: '13px', color: '#374151', '&:disabled': { color: '#9ca3af' } }}>
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

export default AuditLogs;
