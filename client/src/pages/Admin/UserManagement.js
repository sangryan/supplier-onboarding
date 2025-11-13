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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PersonOff,
  PersonAdd,
} from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '',
    department: '',
    phone: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.data);
    } catch (error) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setLoading(false);
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
        password: '',
        role: user.role,
        department: user.department || '',
        phone: user.phone || '',
      });
    } else {
      setEditMode(false);
      setCurrentUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: '',
        department: '',
        phone: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setCurrentUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: '',
      department: '',
      phone: '',
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!editMode && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }

    if (!editMode && formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      if (editMode) {
        // Update user
        const updateData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          department: formData.department,
          phone: formData.phone,
        };
        await api.put(`/users/${currentUser.id}`, updateData);
        toast.success('User updated successfully');
      } else {
        // Create user
        await api.post('/users', formData);
        toast.success('User created successfully');
      }
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${editMode ? 'update' : 'create'} user`);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await api.put(`/users/${userId}`, { isActive: !currentStatus });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deactivated successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to deactivate user');
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      super_admin: 'error',
      procurement: 'primary',
      legal: 'secondary',
      management: 'info',
      supplier: 'success',
    };
    return colors[role] || 'default';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            User Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage internal users and their roles
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add User
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
              <Typography variant="h4">{users.length}</Typography>
              <Typography variant="body2">Total Users</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
              <Typography variant="h4">{users.filter(u => u.isActive).length}</Typography>
              <Typography variant="body2">Active Users</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
              <Typography variant="h4">{users.filter(u => !u.isActive).length}</Typography>
              <Typography variant="body2">Inactive Users</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
              <Typography variant="h4">{users.filter(u => u.role !== 'supplier').length}</Typography>
              <Typography variant="body2">Internal Users</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary">No users found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {user.firstName} {user.lastName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role.replace('_', ' ').toUpperCase()}
                      color={getRoleBadgeColor(user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.department || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      color={user.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(user.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(user)}
                      title="Edit"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleActive(user.id, user.isActive)}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                      color={user.isActive ? 'warning' : 'success'}
                    >
                      {user.isActive ? <PersonOff fontSize="small" /> : <PersonAdd fontSize="small" />}
                    </IconButton>
                    {user.role !== 'super_admin' && (
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete"
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={editMode}
                  required
                />
              </Grid>
              {!editMode && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    helperText="Minimum 8 characters"
                    required
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    label="Role"
                  >
                    <MenuItem value="super_admin">Super Admin</MenuItem>
                    <MenuItem value="procurement">Procurement</MenuItem>
                    <MenuItem value="legal">Legal</MenuItem>
                    <MenuItem value="management">Management</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;
