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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import { Add, Visibility, Warning } from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const ContractList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    supplier: '',
    title: '',
    contractType: '',
    description: '',
    amount: '',
    currency: 'KES',
    startDate: '',
    endDate: '',
    creditPeriod: 30,
    paymentSchedule: 'monthly',
  });

  useEffect(() => {
    fetchContracts();
    fetchApprovedSuppliers();
  }, [page, rowsPerPage, statusFilter]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const response = await api.get('/contracts', { params });
      setContracts(response.data.data);
      setTotal(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedSuppliers = async () => {
    try {
      const response = await api.get('/suppliers', { params: { status: 'approved' } });
      setSuppliers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchContracts();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateContract = async () => {
    // Validation
    if (!formData.supplier || !formData.title || !formData.contractType || 
        !formData.amount || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      const contractData = {
        ...formData,
        value: {
          amount: parseFloat(formData.amount),
          currency: formData.currency,
        },
        paymentTerms: {
          creditPeriod: parseInt(formData.creditPeriod),
          paymentSchedule: formData.paymentSchedule,
        },
      };

      await api.post('/contracts', contractData);
      toast.success('Contract created successfully');
      setCreateDialogOpen(false);
      resetForm();
      fetchContracts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create contract');
    }
  };

  const resetForm = () => {
    setFormData({
      supplier: '',
      title: '',
      contractType: '',
      description: '',
      amount: '',
      currency: 'KES',
      startDate: '',
      endDate: '',
      creditPeriod: 30,
      paymentSchedule: 'monthly',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      active: 'success',
      expired: 'error',
      terminated: 'error',
      renewed: 'info',
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

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'KES',
    }).format(amount);
  };

  const isExpiringSoon = (endDate) => {
    const daysUntilExpiry = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const canCreateContract = ['legal', 'procurement', 'super_admin'].includes(user.role);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Contracts
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage supplier contracts and agreements
          </Typography>
        </Box>
        {canCreateContract && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Contract
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Search"
            placeholder="Search by contract number, title..."
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
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
              <MenuItem value="terminated">Terminated</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleSearch}>
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
                  <TableCell>Contract #</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="textSecondary">
                        No contracts found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  contracts.map((contract) => (
                    <TableRow key={contract._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {contract.contractNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {contract.supplier?.supplierName || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{contract.title}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" textTransform="capitalize">
                          {contract.contractType?.replace('_', ' ')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatCurrency(contract.value?.amount, contract.value?.currency)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(contract.startDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {formatDate(contract.endDate)}
                          </Typography>
                          {isExpiringSoon(contract.endDate) && (
                            <Warning fontSize="small" color="warning" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={contract.status.toUpperCase()}
                          color={getStatusColor(contract.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => navigate(`/contracts/${contract._id}`)}
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

      {/* Create Contract Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Contract</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Supplier</InputLabel>
                  <Select
                    value={formData.supplier}
                    onChange={(e) => handleChange('supplier', e.target.value)}
                    label="Supplier"
                  >
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier._id} value={supplier._id}>
                        {supplier.supplierName} {supplier.vendorNumber && `(${supplier.vendorNumber})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contract Title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Contract Type</InputLabel>
                  <Select
                    value={formData.contractType}
                    onChange={(e) => handleChange('contractType', e.target.value)}
                    label="Contract Type"
                  >
                    <MenuItem value="services">Services</MenuItem>
                    <MenuItem value="goods">Goods</MenuItem>
                    <MenuItem value="consultancy">Consultancy</MenuItem>
                    <MenuItem value="subscription">Subscription</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Contract Value"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={formData.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    label="Currency"
                  >
                    <MenuItem value="KES">KES</MenuItem>
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Credit Period (days)"
                  type="number"
                  value={formData.creditPeriod}
                  onChange={(e) => handleChange('creditPeriod', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Schedule</InputLabel>
                  <Select
                    value={formData.paymentSchedule}
                    onChange={(e) => handleChange('paymentSchedule', e.target.value)}
                    label="Payment Schedule"
                  >
                    <MenuItem value="one_time">One Time</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="quarterly">Quarterly</MenuItem>
                    <MenuItem value="annually">Annually</MenuItem>
                    <MenuItem value="milestone_based">Milestone Based</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCreateDialogOpen(false); resetForm(); }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateContract}>
            Create Contract
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ContractList;
