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
  TablePagination,
  Grid,
} from '@mui/material';
import { Visibility, Search } from '@mui/icons-material';
import api from '../../utils/api';

const SupplierList = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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
      const response = await api.get('/dashboard/stats');
      const data = response.data.data;
      setStats({
        total: data.totalSuppliers || 0,
        approved: data.approvedSuppliers || 0,
        pending: data.pendingApplications || 0,
        rejected: data.rejectedSuppliers || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchSuppliers();
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      submitted: 'primary',
      pending_procurement: 'warning',
      pending_legal: 'info',
      approved: 'success',
      rejected: 'error',
      more_info_required: 'warning',
    };
    return colors[status] || 'default';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          All Suppliers
        </Typography>
        <Typography variant="body1" color="textSecondary">
          View and manage supplier applications
        </Typography>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
              <Typography variant="h4">{stats.total}</Typography>
              <Typography variant="body2">Total Suppliers</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
              <Typography variant="h4">{stats.pending}</Typography>
              <Typography variant="body2">Pending Review</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
              <Typography variant="h4">{stats.approved}</Typography>
              <Typography variant="body2">Approved</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
              <Typography variant="h4">{stats.rejected}</Typography>
              <Typography variant="body2">Rejected</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Search"
            placeholder="Search by name, email, vendor number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ flexGrow: 1 }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status Filter"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="pending_procurement">Pending Procurement</MenuItem>
              <MenuItem value="pending_legal">Pending Legal</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="more_info_required">More Info Required</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={handleSearch}
          >
            Search
          </Button>
        </Box>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Supplier Name</TableCell>
                  <TableCell>Vendor #</TableCell>
                  <TableCell>Service Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary">
                        No suppliers found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  suppliers.map((supplier) => (
                    <TableRow key={supplier._id} hover>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {supplier.supplierName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {supplier.vendorNumber ? (
                          <Chip label={supplier.vendorNumber} size="small" color="success" />
                        ) : (
                          <Typography variant="body2" color="textSecondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" textTransform="capitalize">
                          {supplier.serviceType?.replace('_', ' ')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={supplier.status.replace('_', ' ').toUpperCase()} 
                          color={getStatusColor(supplier.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {supplier.submittedAt ? formatDate(supplier.submittedAt) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {supplier.authorizedPerson?.email || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => navigate(`/suppliers/${supplier._id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </>
      )}
    </Container>
  );
};

export default SupplierList;
