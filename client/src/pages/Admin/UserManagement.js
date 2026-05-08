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
  MenuItem,
  IconButton,
  CircularProgress,
  Grid,
  InputAdornment,
  Checkbox,
  Switch,
} from '@mui/material';
import {
  Add,
  Edit,
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    department: '',
    phone: '',
    isActive: true,
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      const normalizedUsers = (response.data.data || []).map((user) => ({
        ...user,
        id: user.id || user._id
      }));
      setUsers(normalizedUsers);
    } catch (error) {
      toast.error('Failed to load users');
      console.error(error);
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
    } catch (error) {
      console.error('Failed to load departments:', error);
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
        phone: user.phone || '',
        isActive: user.isActive !== false,
      });
    } else {
      setEditMode(false);
      setCurrentUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: '',
        department: '',
        phone: '',
        isActive: true,
      });
    }
    setRoleSearch('');
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
      role: '',
      department: '',
      phone: '',
      isActive: true,
    });
    setRoleSearch('');
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

    if (formData.role === 'management' && !formData.department?.trim()) {
      toast.error('Department is required for management users');
      return;
    }

    try {
      if (editMode) {
        const userId = currentUser?.id || currentUser?._id;
        if (!userId) {
          toast.error('Unable to update user: missing user id');
          return;
        }

        // Update user
        const updateData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          department: formData.department,
          phone: formData.phone,
          isActive: formData.isActive,
        };
        await api.put(`/users/${userId}`, updateData);
        toast.success('User updated successfully');
      } else {
        // Create user
        await api.post('/users', {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          department: formData.department,
          phone: formData.phone,
        });
        toast.success('User created successfully. Temporary password sent by email.');
      }
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${editMode ? 'update' : 'create'} user`);
    }
  };

  const getStatusChip = (user) => {
    const isPendingVerification = user.role === 'supplier' && user.isEmailVerified === false;

    if (isPendingVerification) {
      return (
        <Chip
          label="Pending Verification"
          size="small"
          sx={{
            backgroundColor: '#f3f4f6',
            color: '#111827',
            fontWeight: 500,
            fontSize: '13px',
            height: '24px',
            borderRadius: '12px',
            '& .MuiChip-label': { px: 1.25 }
          }}
        />
      );
    }

    return (
      <Chip
        label={user.isActive ? 'Active' : 'Inactive'}
        size="small"
        sx={{
          backgroundColor: user.isActive ? '#65a30d' : '#dc2626',
          color: '#fff',
          fontWeight: 600,
          fontSize: '12px',
          height: '24px',
          borderRadius: '12px',
          '& .MuiChip-label': { px: 1.25 }
        }}
      />
    );
  };

  const getDisplayPhone = (user) => {
    return user.phone || user.supplier?.authorizedPerson?.phone || user.supplierContactPhone || '-';
  };

  const roleOptions = [
    { value: 'super_admin', label: 'Super admin' },
    { value: 'procurement', label: 'Procurement' },
    { value: 'legal', label: 'Legal' },
    { value: 'management', label: 'Management' },
  ];

  const filteredRoleOptions = roleOptions.filter((roleOption) =>
    roleOption.label.toLowerCase().includes(roleSearch.toLowerCase())
  );

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) {
      return;
    }
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deactivated successfully');
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to deactivate user');
    }
  };

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const phone = (getDisplayPhone(u) || '').toLowerCase();
    const term = search.toLowerCase();
    return fullName.includes(term) || email.includes(term) || phone.includes(term);
  }).sort((a, b) => {
    const aSupplier = a.role === 'supplier';
    const bSupplier = b.role === 'supplier';
    if (aSupplier && !bSupplier) return 1;
    if (!aSupplier && bSupplier) return -1;
    return 0;
  });

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
      <Container
        maxWidth="lg"
        sx={{
          pt: { xs: 3, sm: 5 },
          pb: { xs: 3, sm: 4 },
          px: { xs: 2, sm: 3 },
          flex: 1,
        }}
      >
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              mb: 0.5,
              color: '#111827',
              fontSize: { xs: '40px', sm: '28px' },
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}
          >
            Users
          </Typography>
          <Typography
            sx={{
              color: '#6b7280',
              fontSize: { xs: '15px', sm: '14px' },
              lineHeight: 1.5,
            }}
          >
            Manage and configure users of the platform
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{
            bgcolor: '#578A18',
            color: '#fff',
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 600,
            px: 2.5,
            py: 1,
            borderRadius: '8px',
            width: { xs: '100%', sm: 'auto' },
            alignSelf: 'flex-start',
            boxShadow: 'none',
            mb: 2,
            '&:hover': {
              bgcolor: '#467014',
              boxShadow: 'none'
            }
          }}
        >
          Add New User
        </Button>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'row', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1.5,
            mb: 3
          }}
        >
          <TextField
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                '& fieldset': { borderColor: '#e0e0e0' },
                '&:hover fieldset': { borderColor: '#9ca3af' },
                '&.Mui-focused fieldset': { borderColor: '#1976d2', borderWidth: '1px' }
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
        <Table sx={{ minWidth: { xs: 540, md: 920 } }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f9fafb' }}>
              <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5 }}>Full Name</TableCell>
              <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>Email Address</TableCell>
              <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>Phone Number</TableCell>
              <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>Roles</TableCell>
              <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', py: 1.5 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography sx={{ color: '#6b7280', fontSize: '13px' }}>No users found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const isPendingVerification = user.role === 'supplier' && user.isEmailVerified === false;
                const isSupplier = user.role === 'supplier';
                return (
                <TableRow
                  key={user.id || user._id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: '#f9fafb' }
                  }}
                >
                  <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5 }}>
                    <Typography variant="body1" sx={{ fontSize: '14px', fontWeight: 400, color: '#111827', lineHeight: 1.2 }}>
                      {user.firstName} {user.lastName}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>
                    <Typography variant="body2" sx={{ fontSize: '14px', color: '#111827' }}>{user.email}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>
                    <Typography variant="body2" sx={{ fontSize: '14px', color: '#111827' }}>{getDisplayPhone(user)}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>
                    <Typography variant="body2" sx={{ fontSize: '14px', color: '#111827' }}>
                      {user.role?.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    {getStatusChip(user)}
                  </TableCell>
                  <TableCell align="right" sx={{ py: 1.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => (!isSupplier && !isPendingVerification ? handleOpenDialog(user) : undefined)}
                      title={isSupplier || isPendingVerification ? 'View' : 'Edit'}
                      sx={{ color: '#111827' }}
                    >
                      {isSupplier || isPendingVerification ? <VisibilityIcon fontSize="small" /> : <Edit fontSize="small" />}
                    </IconButton>
                  </TableCell>
                </TableRow>
              )})
            )}
          </TableBody>
        </Table>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderTop: '1px solid #e0e0e0'
          }}
        >
          <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
            0 of {filteredUsers.length} row(s) selected.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              disabled
              sx={{
                textTransform: 'none',
                color: '#9ca3af',
                fontSize: '13px',
              }}
            >
              Previous
            </Button>
            <Button
              size="small"
              disabled
              sx={{
                textTransform: 'none',
                color: '#9ca3af',
                fontSize: '13px',
              }}
            >
              Next
            </Button>
          </Box>
        </Box>
      </TableContainer>
      </Container>

      {/* Add/Edit User Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: '18px 18px 0 0', sm: '10px' },
            p: 0,
            m: { xs: 0, sm: 2 },
            position: { xs: 'fixed', sm: 'relative' },
            bottom: { xs: 0, sm: 'auto' },
            width: { xs: '100%', sm: 'auto' }
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 2.5, px: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography sx={{ fontSize: { xs: '40px', sm: '36px' }, fontWeight: 700, color: '#111827', lineHeight: 1.15 }}>
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
              <TextField
                fullWidth
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', '& input': { fontSize: '14px' } } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: '14px', color: '#111827', mb: 0.75 }}>Last name</Typography>
              <TextField
                fullWidth
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', '& input': { fontSize: '14px' } } }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: '14px', color: '#111827', mb: 0.75 }}>Work email address</Typography>
              <TextField
                fullWidth
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={editMode}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', '& input': { fontSize: '14px' } } }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: '14px', color: '#111827', mb: 0.75 }}>Work phone number</Typography>
              <TextField
                fullWidth
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', '& input': { fontSize: '14px' } } }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: '14px', color: '#111827', mb: 0.75 }}>
                Department{formData.role === 'management' ? ' *' : ''}
              </Typography>
              <TextField
                fullWidth
                select
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                SelectProps={{ displayEmpty: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              >
                <MenuItem value="" disabled>
                  Select Department
                </MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept} sx={{ fontSize: '14px' }}>
                    {dept}
                  </MenuItem>
                ))}
                {formData.department && !departments.includes(formData.department) && (
                  <MenuItem value={formData.department} sx={{ fontSize: '14px' }}>
                    {formData.department}
                  </MenuItem>
                )}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                value={roleOptions.find((r) => r.value === formData.role)?.label || ''}
                placeholder="Select role"
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <KeyboardArrowDownIcon sx={{ color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    '& input::placeholder': { opacity: 1, color: '#9ca3af', fontSize: '14px' },
                    '& input': { fontSize: '14px' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                placeholder="Search role"
                size="small"
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#9ca3af', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', '& input': { fontSize: '14px' } } }}
              />
              <Box sx={{ border: '1px solid #e5e7eb', borderRadius: '0 0 10px 10px', borderTop: 'none', py: 1 }}>
                {filteredRoleOptions.map((roleOption) => (
                  <Box
                    key={roleOption.value}
                    sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.5, cursor: 'pointer' }}
                    onClick={() => handleChange('role', roleOption.value)}
                  >
                    <Checkbox
                      checked={formData.role === roleOption.value}
                      size="small"
                      sx={{
                        color: '#a3a3a3',
                        '&.Mui-checked': { color: '#578A18' }
                      }}
                    />
                    <Typography sx={{ fontSize: '14px', color: '#111827' }}>{roleOption.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
            {editMode && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Switch
                    checked={!!formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#fff' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#65a30d' }
                    }}
                  />
                  <Typography sx={{ fontSize: '14px', color: '#111827' }}>Active User</Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 1.5, flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
          {editMode && currentUser?.role !== 'super_admin' && (
            <Button
              fullWidth
              variant="contained"
              color="error"
              onClick={() => handleDeleteUser(currentUser?.id || currentUser?._id)}
              sx={{ textTransform: 'none', borderRadius: '8px', boxShadow: 'none' }}
            >
              Delete User
            </Button>
          )}
          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmit}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              boxShadow: 'none',
              bgcolor: '#578A18',
              '&:hover': { bgcolor: '#467014', boxShadow: 'none' }
            }}
          >
            {editMode ? 'Save User' : 'Invite User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
