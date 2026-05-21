import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  CircularProgress,
  Grid,
  InputAdornment,
  Checkbox,
  Switch,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Build as BuildIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { FormControl, Select } from '@mui/material';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const UserManagement = () => {
  const navigate = useNavigate();
  const { user: adminUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('The system is currently under maintenance. Please check back later.');
  const [maintenanceEndTime, setMaintenanceEndTime] = useState('');
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    department: '',
    employeeNumber: '',
    isActive: true,
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchMaintenance();
  }, []);

  const fetchMaintenance = async () => {
    try {
      const res = await api.get('/settings/maintenance');
      setMaintenance(res.data.data?.maintenanceMode || false);
      setMaintenanceMessage(res.data.data?.maintenanceMessage || '');
      const et = res.data.data?.maintenanceEndTime;
      setMaintenanceEndTime(et ? new Date(et).toISOString().slice(0, 16) : '');
    } catch {}
  };

  const handleToggleMaintenance = async () => {
    setMaintenanceLoading(true);
    try {
      const newState = !maintenance;
      await api.put('/settings/maintenance', {
        maintenanceMode: newState,
        maintenanceMessage,
        maintenanceEndTime: maintenanceEndTime || null,
      });
      setMaintenance(newState);
      toast.success(`Maintenance mode ${newState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update maintenance mode');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users', { params: { limit: 1000 } });
      const normalizedUsers = (response.data.data || []).map((user) => ({
        ...user,
        id: user.id || user._id,
      }));
      setUsers(normalizedUsers);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/users/departments');
      if (response.data?.success) {
        setDepartments(response.data.data || []);
      }
    } catch {
      setDepartments([]);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditMode(true);
      setCurrentUser(user);
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department || '',
        employeeNumber: user.employeeNumber || '',
        isActive: user.isActive !== false,
      });
    } else {
      setEditMode(false);
      setCurrentUser(null);
      setFormData({ firstName: '', lastName: '', email: '', role: '', department: '', employeeNumber: '', isActive: true });
    }
    setRoleSearch('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setCurrentUser(null);
    setFormData({ firstName: '', lastName: '', email: '', role: '', department: '', employeeNumber: '', isActive: true });
    setRoleSearch('');
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.role === 'management' && !formData.department?.trim()) {
      toast.error('Department is required for management users');
      return;
    }
    try {
      if (editMode) {
        const userId = currentUser?.id || currentUser?._id;
        if (!userId) { toast.error('Unable to update user: missing user id'); return; }
        await api.put(`/users/${userId}`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          department: formData.department,
          employeeNumber: formData.employeeNumber,
          isActive: formData.isActive,
        });
        toast.success('User updated successfully');
      } else {
        await api.post('/users', {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          department: formData.department,
          employeeNumber: formData.employeeNumber,
        });
        toast.success('User created successfully. Temporary password sent by email.');
      }
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${editMode ? 'update' : 'create'} user`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted successfully');
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleToggleActive = async (user) => {
    const userId = user.id || user._id;
    const action = user.isActive ? 'suspend' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await api.put(`/users/${userId}`, {
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department || '',
        phone: user.phone || '',
        isActive: !user.isActive,
      });
      toast.success(`User ${action}d successfully`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} user`);
    }
  };

  const getStatusChip = (user) => {
    if (user.role === 'supplier' && user.isEmailVerified === false) {
      return (
        <Chip label="Pending Verification" size="small" sx={{ backgroundColor: '#f3f4f6', color: '#111827', fontWeight: 500, fontSize: '13px', height: '24px', borderRadius: '12px', '& .MuiChip-label': { px: 1.25 } }} />
      );
    }
    return (
      <Chip
        label={user.isActive ? 'Active' : 'Suspended'}
        size="small"
        sx={{ backgroundColor: user.isActive ? '#65a30d' : '#dc2626', color: '#fff', fontWeight: 600, fontSize: '12px', height: '24px', borderRadius: '12px', '& .MuiChip-label': { px: 1.25 } }}
      />
    );
  };

  const getDisplayPhone = (user) => {
    return user.phone || user.supplier?.authorizedPerson?.phone || user.supplierContactPhone || '-';
  };

  const getSupplierName = (user) => {
    return user.supplier?.supplierName || '-';
  };

  const roleOptions = [
    { value: 'super_admin', label: 'Super admin' },
    { value: 'procurement', label: 'Procurement' },
    { value: 'legal', label: 'Legal' },
    { value: 'management', label: 'Management' },
  ];

  const filteredRoleOptions = roleOptions.filter((r) =>
    r.label.toLowerCase().includes(roleSearch.toLowerCase())
  );

  const applyFilters = (list) =>
    list
      .filter((u) => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        const phone = (getDisplayPhone(u) || '').toLowerCase();
        const term = search.toLowerCase();
        const matchesSearch = fullName.includes(term) || email.includes(term) || phone.includes(term);
        if (!matchesSearch) return false;
        if (statusFilter === 'active') return u.isActive !== false && !(u.role === 'supplier' && u.isEmailVerified === false);
        if (statusFilter === 'inactive') return u.isActive === false;
        if (statusFilter === 'pending_verification') return u.role === 'supplier' && u.isEmailVerified === false;
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });

  const internalUsers = applyFilters(users.filter((u) => u.role !== 'supplier'));
  const supplierUsers = applyFilters(users.filter((u) => u.role === 'supplier'));

  const filterBar = (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
      <TextField
        placeholder="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#9ca3af', fontSize: 20 }} /></InputAdornment> }}
        sx={{ flex: 1, minWidth: { xs: '100%', sm: '180px' }, maxWidth: { xs: '100%', sm: '280px' }, '& .MuiOutlinedInput-root': { backgroundColor: '#fff', borderRadius: '8px', '& fieldset': { borderColor: '#e0e0e0' }, '&:hover fieldset': { borderColor: '#9ca3af' }, '&.Mui-focused fieldset': { borderColor: '#1976d2', borderWidth: '1px' } } }}
      />
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} displayEmpty sx={{ borderRadius: '8px', fontSize: '14px', backgroundColor: '#fff' }}>
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Suspended</MenuItem>
          {activeTab === 1 && <MenuItem value="pending_verification">Pending Verification</MenuItem>}
        </Select>
      </FormControl>
      <Tooltip title={sortOrder === 'asc' ? 'Oldest first — click for newest first' : 'Newest first — click for oldest first'}>
        <Button variant="outlined" size="small" onClick={() => setSortOrder((s) => (s === 'asc' ? 'desc' : 'asc'))} startIcon={sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />} sx={{ borderColor: '#d1d5db', color: '#374151', textTransform: 'none', fontSize: '14px', px: 2, py: 1, borderRadius: '8px', whiteSpace: 'nowrap', '&:hover': { borderColor: '#9ca3af', bgcolor: '#f9fafb' } }}>
          {sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}
        </Button>
      </Tooltip>
      <Button variant="outlined" startIcon={<DownloadIcon />} sx={{ borderColor: '#d1d5db', color: '#374151', textTransform: 'none', fontSize: { xs: '13px', sm: '14px' }, px: { xs: 1.75, sm: 2 }, py: 1, borderRadius: '8px', whiteSpace: 'nowrap', '&:hover': { borderColor: '#9ca3af', bgcolor: '#f9fafb' } }}>
        Download all
      </Button>
    </Box>
  );

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', pb: 0 }}>
      <Container maxWidth="lg" sx={{ pt: { xs: 3, sm: 5 }, pb: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 }, flex: 1 }}>
        <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5, color: '#111827', fontSize: { xs: '28px', sm: '28px' }, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            Users
          </Typography>
          <Typography sx={{ color: '#6b7280', fontSize: { xs: '15px', sm: '14px' }, lineHeight: 1.5 }}>
            Manage and configure users of the platform
          </Typography>
        </Box>

        {/* Maintenance Mode Toggle */}
        {adminUser?.role === 'super_admin' && (
          <Paper
            elevation={0}
            sx={{
              border: `1px solid ${maintenance ? '#fca5a5' : '#e5e7eb'}`,
              borderRadius: '10px',
              p: 2,
              mb: 3,
              backgroundColor: maintenance ? '#fff7f7' : '#fff',
              display: 'flex',
              alignItems: { xs: 'flex-start', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '8px', backgroundColor: maintenance ? '#fee2e2' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BuildIcon sx={{ fontSize: 20, color: maintenance ? '#dc2626' : '#6b7280' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                  Maintenance Mode
                  {maintenance && (
                    <Chip label="ON" size="small" sx={{ ml: 1, backgroundColor: '#dc2626', color: '#fff', fontSize: '11px', height: '20px', fontWeight: 700 }} />
                  )}
                </Typography>
                <Typography sx={{ fontSize: '13px', color: '#6b7280' }}>
                  {maintenance ? 'All non-admin users see a maintenance page' : 'Platform is fully operational'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: { xs: '100%', sm: 'auto' }, flexWrap: 'wrap', flex: 1 }}>
              <TextField
                size="small"
                placeholder="Maintenance message (optional)"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                sx={{ flex: 1, minWidth: { xs: 0, sm: 380 }, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '13px' } }}
              />
              <Button
                variant={maintenance ? 'outlined' : 'contained'}
                onClick={handleToggleMaintenance}
                disabled={maintenanceLoading}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  px: 2,
                  py: 1,
                  borderRadius: '8px',
                  boxShadow: 'none',
                  whiteSpace: 'nowrap',
                  ...(maintenance
                    ? { borderColor: '#16a34a', color: '#16a34a', '&:hover': { borderColor: '#15803d', backgroundColor: '#f0fdf4' } }
                    : { backgroundColor: '#dc2626', '&:hover': { backgroundColor: '#b91c1c', boxShadow: 'none' } }
                  ),
                }}
              >
                {maintenanceLoading ? 'Saving...' : maintenance ? 'Disable Maintenance' : 'Enable Maintenance'}
              </Button>
            </Box>
          </Paper>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: '1px solid #e5e7eb', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => { setActiveTab(v); setStatusFilter(''); setSearch(''); }}
            sx={{
              '& .MuiTab-root': { textTransform: 'none', fontSize: '14px', fontWeight: 500, color: '#6b7280', minWidth: 0, px: 0, mr: 3 },
              '& .Mui-selected': { color: '#111827', fontWeight: 600 },
              '& .MuiTabs-indicator': { backgroundColor: '#578A18' },
            }}
          >
            <Tab label={`Internal Users (${users.filter((u) => u.role !== 'supplier').length})`} />
            <Tab label={`Suppliers (${users.filter((u) => u.role === 'supplier').length})`} />
          </Tabs>
        </Box>

        {/* Add User button — only for internal tab */}
        {activeTab === 0 && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ bgcolor: '#578A18', color: '#fff', textTransform: 'none', fontSize: '14px', fontWeight: 600, px: 2.5, py: 1, borderRadius: '8px', width: { xs: '100%', sm: 'auto' }, alignSelf: 'flex-start', boxShadow: 'none', mb: 2, '&:hover': { bgcolor: '#467014', boxShadow: 'none' } }}
          >
            Add New User
          </Button>
        )}

        {filterBar}

        {/* Internal Users Table */}
        {activeTab === 0 && (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden', backgroundColor: '#fff' }}>
            <Table sx={{ minWidth: { xs: 540, md: 920 } }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5 }}>Full Name</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>Email Address</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>SN Number</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>Role</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {internalUsers.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><Typography sx={{ color: '#6b7280', fontSize: '13px' }}>No internal users found</Typography></TableCell></TableRow>
                ) : (
                  internalUsers.map((user) => (
                    <TableRow key={user.id || user._id} hover sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}>
                      <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5 }}>
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>{user.email}</TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>{user.employeeNumber || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>
                        {user.role?.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>{getStatusChip(user)}</TableCell>
                      <TableCell align="right" sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title={user.isActive ? 'Suspend' : 'Activate'}>
                            <IconButton size="small" onClick={() => handleToggleActive(user)} sx={{ color: user.isActive ? '#dc2626' : '#65a30d' }}>
                              {user.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleOpenDialog(user)} sx={{ color: '#111827' }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>{internalUsers.length} user(s)</Typography>
            </Box>
          </TableContainer>
        )}

        {/* Suppliers Table */}
        {activeTab === 1 && (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden', backgroundColor: '#fff' }}>
            <Table sx={{ minWidth: { xs: 540, md: 960 } }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5 }}>Contact Name</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5, display: { xs: 'none', sm: 'table-cell' } }}>Company</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>Email Address</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>SN Number</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {supplierUsers.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><Typography sx={{ color: '#6b7280', fontSize: '13px' }}>No suppliers found</Typography></TableCell></TableRow>
                ) : (
                  supplierUsers.map((user) => {
                    const supplierId = user.supplier?._id || user.supplier;
                    return (
                      <TableRow key={user.id || user._id} hover sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}>
                        <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5 }}>
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5, display: { xs: 'none', sm: 'table-cell' } }}>
                          {getSupplierName(user)}
                        </TableCell>
                        <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>{user.email}</TableCell>
                        <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>{getDisplayPhone(user)}</TableCell>
                        <TableCell sx={{ py: 1.5 }}>{getStatusChip(user)}</TableCell>
                        <TableCell align="right" sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            {supplierId && (
                              <Tooltip title="View Profile">
                                <IconButton size="small" onClick={() => navigate(`/suppliers/${supplierId}`)} sx={{ color: '#111827' }}>
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title={user.isActive ? 'Suspend' : 'Activate'}>
                              <IconButton size="small" onClick={() => handleToggleActive(user)} sx={{ color: user.isActive ? '#dc2626' : '#65a30d' }}>
                                {user.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => handleDeleteUser(user.id || user._id)} sx={{ color: '#6b7280', '&:hover': { color: '#dc2626' } }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>{supplierUsers.length} supplier(s)</Typography>
            </Box>
          </TableContainer>
        )}
      </Container>

      {/* Add/Edit Internal User Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: { xs: '18px 18px 0 0', sm: '10px' }, p: 0, m: { xs: 0, sm: 2 }, position: { xs: 'fixed', sm: 'relative' }, bottom: { xs: 0, sm: 'auto' }, width: { xs: '100%', sm: 'auto' } } }}>
        <DialogTitle sx={{ pb: 1, pt: 2.5, px: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography sx={{ fontSize: { xs: '28px', sm: '28px' }, fontWeight: 700, color: '#111827', lineHeight: 1.15 }}>
                {editMode ? 'Edit User' : 'Create User'}
              </Typography>
              <Typography sx={{ color: '#6b7280', fontSize: '14px', mt: 0.75 }}>
                {editMode ? 'Update user details' : 'Add user details to invite them to the platform'}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDialog} sx={{ color: '#111827', mt: -0.5, mr: -0.5 }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 2.5, pb: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: '14px', color: '#111827', mb: 0.75 }}>First name</Typography>
              <TextField fullWidth value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', '& input': { fontSize: '14px' } } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: '14px', color: '#111827', mb: 0.75 }}>Last name</Typography>
              <TextField fullWidth value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', '& input': { fontSize: '14px' } } }} />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: '14px', color: '#111827', mb: 0.75 }}>Work email address</Typography>
              <TextField fullWidth type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} disabled={editMode} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', '& input': { fontSize: '14px' } } }} />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: '14px', color: '#111827', mb: 0.75 }}>SN Number</Typography>
              <TextField fullWidth value={formData.employeeNumber} onChange={(e) => handleChange('employeeNumber', e.target.value)} placeholder="e.g. EMP-001" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', '& input': { fontSize: '14px' } } }} />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: '14px', color: '#111827', mb: 0.75 }}>Department{formData.role === 'management' ? ' *' : ''}</Typography>
              <TextField fullWidth select value={formData.department} onChange={(e) => handleChange('department', e.target.value)} SelectProps={{ displayEmpty: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}>
                <MenuItem value="" disabled>Select Department</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept} sx={{ fontSize: '14px' }}>{dept}</MenuItem>
                ))}
                {formData.department && !departments.includes(formData.department) && (
                  <MenuItem value={formData.department} sx={{ fontSize: '14px' }}>{formData.department}</MenuItem>
                )}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                value={roleOptions.find((r) => r.value === formData.role)?.label || ''}
                placeholder="Select role"
                InputProps={{ readOnly: true, endAdornment: <InputAdornment position="end"><KeyboardArrowDownIcon sx={{ color: '#9ca3af' }} /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', '& input::placeholder': { opacity: 1, color: '#9ca3af', fontSize: '14px' }, '& input': { fontSize: '14px' } } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth placeholder="Search role" size="small" value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#9ca3af', fontSize: 18 }} /></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', '& input': { fontSize: '14px' } } }} />
              <Box sx={{ border: '1px solid #e5e7eb', borderRadius: '0 0 10px 10px', borderTop: 'none', py: 1 }}>
                {filteredRoleOptions.map((roleOption) => (
                  <Box key={roleOption.value} sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.5, cursor: 'pointer' }} onClick={() => handleChange('role', roleOption.value)}>
                    <Checkbox checked={formData.role === roleOption.value} size="small" sx={{ color: '#a3a3a3', '&.Mui-checked': { color: '#578A18' } }} />
                    <Typography sx={{ fontSize: '14px', color: '#111827' }}>{roleOption.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
            {editMode && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Switch checked={!!formData.isActive} onChange={(e) => handleChange('isActive', e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#fff' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#65a30d' } }} />
                  <Typography sx={{ fontSize: '14px', color: '#111827' }}>Active User</Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 1.5, flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
          {editMode && currentUser?.role !== 'super_admin' && (
            <Button fullWidth variant="outlined" color="error" onClick={() => handleDeleteUser(currentUser?.id || currentUser?._id)} sx={{ textTransform: 'none', borderRadius: '8px' }}>
              Delete User
            </Button>
          )}
          <Button fullWidth variant="contained" onClick={handleSubmit} sx={{ textTransform: 'none', borderRadius: '8px', boxShadow: 'none', bgcolor: '#578A18', '&:hover': { bgcolor: '#467014', boxShadow: 'none' } }}>
            {editMode ? 'Save User' : 'Invite User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
