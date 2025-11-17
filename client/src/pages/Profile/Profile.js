import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility,
  VisibilityOff,
  Help as HelpIcon,
  Close as CloseIcon,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import Footer from '../../components/Footer/Footer';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [additionalContacts, setAdditionalContacts] = useState([]);
  
  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  // Dialog states
  const [editContactDialog, setEditContactDialog] = useState(false);
  const [addContactDialog, setAddContactDialog] = useState(false);
  const [editProfileDialog, setEditProfileDialog] = useState(false);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', idPassport: '', relationship: '' });
  const [editingContactIndex, setEditingContactIndex] = useState(null);

  useEffect(() => {
    fetchSupplierData();
  }, [user]);

  const fetchSupplierData = async () => {
    if (user?.role === 'supplier') {
      try {
        const response = await api.get('/suppliers');
        const suppliers = response.data.data || [];
        if (suppliers.length > 0) {
          setSupplier(suppliers[0]);
          // Initialize additional contacts if they exist
          if (suppliers[0].additionalContacts) {
            setAdditionalContacts(suppliers[0].additionalContacts);
          }
        }
      } catch (error) {
        console.error('Error fetching supplier data:', error);
      }
    }
    setLoading(false);
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    }
  };

  const handleAddContact = () => {
    setNewContact({ name: '', email: '', phone: '', idPassport: '', relationship: '' });
    setAddContactDialog(true);
  };

  const handleSaveContact = async () => {
    if (!newContact.name || !newContact.email || !newContact.phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      let updatedContacts;
      if (editingContactIndex !== null) {
        updatedContacts = [...additionalContacts];
        updatedContacts[editingContactIndex] = newContact;
        setAdditionalContacts(updatedContacts);
      } else {
        updatedContacts = [...additionalContacts, newContact];
        setAdditionalContacts(updatedContacts);
      }
      
      // Save to database if supplier exists
      if (supplier?._id) {
        await api.put(`/suppliers/${supplier._id}`, {
          additionalContacts: updatedContacts
        });
        // Refresh supplier data
        await fetchSupplierData();
      }
      
      toast.success(editingContactIndex !== null ? 'Contact updated successfully' : 'Contact added successfully');
      setAddContactDialog(false);
      setEditContactDialog(false);
      setEditingContactIndex(null);
      setNewContact({ name: '', email: '', phone: '', idPassport: '', relationship: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save contact');
      console.error('Error saving contact:', error);
    }
  };

  const handleDeleteContact = async (index) => {
    try {
      if (index < 0 || index >= additionalContacts.length) {
        toast.error('Invalid contact index');
        return;
      }

      const updated = additionalContacts.filter((_, i) => i !== index);
      
      // Save to database if supplier exists
      if (supplier?._id) {
        try {
          const response = await api.put(`/suppliers/${supplier._id}`, {
            additionalContacts: updated
          });
          
          // Update local state after successful API call
          setAdditionalContacts(updated);
          // Refresh supplier data
          await fetchSupplierData();
          toast.success('Contact deleted successfully');
        } catch (apiError) {
          console.error('API Error deleting contact:', {
            error: apiError,
            response: apiError.response,
            status: apiError.response?.status,
            data: apiError.response?.data,
            message: apiError.message
          });
          
          // Extract error message from response
          let errorMessage = 'Failed to delete contact. Please try again.';
          if (apiError.response?.data) {
            errorMessage = apiError.response.data.message || 
                          apiError.response.data.error || 
                          errorMessage;
          } else if (apiError.message) {
            errorMessage = apiError.message;
          }
          
          toast.error(errorMessage);
          throw apiError; // Re-throw to prevent state update
        }
      } else {
        // If no supplier ID, just update local state
        setAdditionalContacts(updated);
        toast.success('Contact deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting contact:', {
        error,
        errorType: typeof error,
        errorMessage: error?.message,
        errorResponse: error?.response,
        errorStack: error?.stack
      });
      
      // Only show error if it wasn't already shown
      if (error?.response) {
        // Error was already handled in the inner try-catch
        return;
      }
      
      const errorMessage = error?.message || 'Failed to delete contact. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleEditContact = (contact, index) => {
    setNewContact(contact);
    setEditingContactIndex(index);
    setEditContactDialog(true);
  };

  const handleDeleteAccount = async () => {
    // Account deletion feature not yet implemented
    toast.info('Account deletion feature is not yet available. Please contact support for assistance.');
    setDeleteAccountDialog(false);
  };

  // Get primary contact info
  // Full name should always match the registered user's name
  const getPrimaryContact = () => {
    const registeredFullName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}`.trim()
      : (user?.firstName || user?.lastName || '');
    
    if (supplier?.authorizedPerson) {
      return {
        fullName: registeredFullName,
        relationship: supplier.authorizedPerson.relationship || '',
        idPassport: supplier.authorizedPerson.idPassportNumber || '',
        phone: supplier.authorizedPerson.phone || '',
        email: supplier.authorizedPerson.email || user?.email || '',
      };
    }
    return {
      fullName: registeredFullName,
      relationship: '',
      idPassport: '',
      phone: '',
      email: user?.email || '',
    };
  };

  // Get company info
  const getCompanyInfo = () => {
    if (supplier) {
      const address = supplier.companyPhysicalAddress;
      const fullAddress = address
        ? `${address.street || ''}, ${address.city || ''}, ${address.country || ''}${address.postalCode ? `, ${address.postalCode}` : ''}`.replace(/^,\s*|,\s*$/g, '')
        : supplier.physicalAddress || '';
      
      return {
        supplierName: supplier.supplierName || '',
        registeredCountry: supplier.registeredCountry || address?.country || '',
        companyRegistrationNumber: supplier.companyRegistrationNumber || '',
        companyEmail: supplier.companyEmail || '',
        companyWebsite: supplier.companyWebsite || '',
        legalNature: supplier.legalNature || '',
        physicalAddress: fullAddress,
      };
    }
    return {
      supplierName: '',
      registeredCountry: '',
      companyRegistrationNumber: '',
      companyEmail: '',
      companyWebsite: '',
      legalNature: '',
      physicalAddress: '',
    };
  };

  const primaryContact = getPrimaryContact();
  const companyInfo = getCompanyInfo();

  // Check if all required information is filled
  const isAllInfoFilled = () => {
    // Check contact information (excluding additional contacts as per requirement)
    const contactFilled = 
      primaryContact.fullName && 
      primaryContact.relationship && 
      primaryContact.idPassport && 
      primaryContact.phone && 
      primaryContact.email;

    // Check company information (only for suppliers)
    if (user?.role === 'supplier') {
      const companyFilled = 
        companyInfo.supplierName && 
        companyInfo.registeredCountry && 
        companyInfo.companyRegistrationNumber && 
        companyInfo.companyEmail && 
        companyInfo.legalNature && 
        companyInfo.physicalAddress;

      return contactFilled && companyFilled;
    }

    // For non-suppliers, only check contact information
    return contactFilled;
  };

  const allInfoFilled = isAllInfoFilled();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: { xs: 3, md: 4 } }}>
          {allInfoFilled && (
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/dashboard')}
              sx={{
                color: '#6b7280',
                textTransform: 'none',
                fontSize: '14px',
                mb: 2,
                pl: 0,
                justifyContent: 'flex-start',
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: '#374151'
                }
              }}
            >
              Back to Dashboard
            </Button>
          )}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: { xs: '16px', md: '18px' },
              color: '#111827',
              mb: 0.5,
            }}
          >
            Profile & Settings
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#6b7280',
              fontSize: { xs: '13px', md: '14px' },
            }}
          >
            Seamless, Smart, and Secure Supplier Onboarding for a Future-Ready Business.
          </Typography>
        </Box>

        {/* Contact Information Section */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            mb: { xs: 2, md: 3 },
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            backgroundColor: '#fff',
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', md: 'flex-start' }, 
            mb: { xs: 2, md: 3 },
            gap: { xs: 2, md: 0 }
          }}>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 0.5,
                  fontSize: { xs: '16px', md: '18px' },
                  color: '#111827'
                }}
              >
                Contact Information
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#6b7280',
                  fontSize: { xs: '13px', md: '14px' },
                  mb: { xs: 0, md: 3 }
                }}
              >
                Changes to contact information require approval and supporting documentation
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={
                <Box
                  component="img"
                  src="/images/Pencil.svg"
                  alt="Edit icon"
                  sx={{ width: 20, height: 20 }}
                />
              }
              sx={{
                borderColor: '#d1d5db',
                color: '#374151',
                textTransform: 'none',
                fontSize: { xs: '13px', md: '14px' },
                width: { xs: '100%', md: 'auto' },
                '&:hover': {
                  borderColor: '#9ca3af',
                  bgcolor: '#f9fafb',
                },
              }}
              onClick={() => navigate('/profile/edit-contact')}
            >
              Edit Profile
            </Button>
          </Box>

          <Grid container spacing={{ xs: 2, md: 2.5 }}>
            <Grid item xs={12} md={4}>
              <Typography 
                variant="body2" 
                sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
              >
                Full Name
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 400, fontSize: '14px', color: '#111827' }}>
                {primaryContact.fullName}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography 
                variant="body2" 
                sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
              >
                Relationship to Entity
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 400, fontSize: '14px', color: '#111827' }}>
                {primaryContact.relationship || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography 
                variant="body2" 
                sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
              >
                ID/Passport Number
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 400, fontSize: '14px', color: '#111827' }}>
                {primaryContact.idPassport || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography 
                variant="body2" 
                sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
              >
                Phone Number
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 400, fontSize: '14px', color: '#111827' }}>
                {primaryContact.phone || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography 
                variant="body2" 
                sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
              >
                Email Address
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 400, fontSize: '14px', color: '#111827' }}>
                {primaryContact.email}
              </Typography>
            </Grid>
          </Grid>

          {/* Additional Contacts */}
          <Box sx={{ mt: { xs: 3, md: 4 } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                mb: 2,
                fontSize: { xs: '16px', md: '18px' }
              }}
            >
              Additional Contacts
            </Typography>
            {additionalContacts.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                No additional contacts added yet.
              </Typography>
            ) : (
              additionalContacts.map((contact, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    mb: 2,
                    bgcolor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                      {contact.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                      {contact.email}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {contact.phone}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleEditContact(contact, index)}
                      sx={{ mr: 1 }}
                    >
                      <Box
                        component="img"
                        src="/images/Pencil.svg"
                        alt="Edit icon"
                        sx={{ width: 20, height: 20 }}
                      />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteContact(index)}
                      sx={{ color: '#c62828' }}
                    >
                      <Box
                        component="img"
                        src="/images/Trash2.svg"
                        alt="Delete icon"
                        sx={{ width: 20, height: 20 }}
                      />
                    </IconButton>
                  </Box>
                </Box>
              ))
            )}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddContact}
              sx={{
                borderColor: '#d1d5db',
                color: '#374151',
                textTransform: 'none',
                fontSize: { xs: '13px', md: '14px' },
                width: { xs: '100%', md: 'auto' },
                mt: 1,
                '&:hover': {
                  borderColor: '#9ca3af',
                  bgcolor: '#f9fafb',
                },
              }}
            >
              Add New Contact
            </Button>
          </Box>
        </Paper>

        {/* Company Profile Section */}
        {user?.role === 'supplier' && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              mb: { xs: 2, md: 3 },
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              backgroundColor: '#fff',
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'flex-start', md: 'flex-start' }, 
              mb: { xs: 2, md: 3 },
              gap: { xs: 2, md: 0 }
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 0.5,
                    fontSize: { xs: '16px', md: '18px' },
                    color: '#111827'
                  }}
                >
                  Company Profile
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#6b7280',
                    fontSize: { xs: '13px', md: '14px' },
                    mb: { xs: 0, md: 3 }
                  }}
                >
                  Changes to your company profile require approval and supporting documentation
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={
                  <Box
                    component="img"
                    src="/images/Pencil.svg"
                    alt="Edit icon"
                    sx={{ width: 20, height: 20 }}
                  />
                }
                sx={{
                  borderColor: '#d1d5db',
                  color: '#374151',
                  textTransform: 'none',
                  fontSize: { xs: '13px', md: '14px' },
                  width: { xs: '100%', md: 'auto' },
                  '&:hover': {
                    borderColor: '#9ca3af',
                    bgcolor: '#f9fafb',
                  },
                }}
                onClick={() => navigate('/profile/edit-company')}
              >
                Edit Profile
              </Button>
            </Box>

            <Grid container spacing={{ xs: 2, md: 2.5 }}>
              <Grid item xs={12} md={4}>
                <Typography 
                  variant="body2" 
                  sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                >
                  Supplier Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 400, fontSize: '14px', color: '#111827' }}>
                  {companyInfo.supplierName || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography 
                  variant="body2" 
                  sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                >
                  Registered Country
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 400, fontSize: '14px', color: '#111827' }}>
                  {companyInfo.registeredCountry || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography 
                  variant="body2" 
                  sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                >
                  Company Registration Number
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 400, fontSize: '14px', color: '#111827' }}>
                  {companyInfo.companyRegistrationNumber || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography 
                  variant="body2" 
                  sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                >
                  Company Email Address
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 400, fontSize: '14px', color: '#111827' }}>
                  {companyInfo.companyEmail || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography 
                  variant="body2" 
                  sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                >
                  Company Website
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 400, fontSize: '14px', color: '#111827' }}>
                  {companyInfo.companyWebsite || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography 
                  variant="body2" 
                  sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                >
                  Legal Nature of Entity
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 400, fontSize: '14px', color: '#111827' }}>
                  {companyInfo.legalNature
                    ? companyInfo.legalNature
                        .split('_')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')
                    : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography 
                  variant="body2" 
                  sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                >
                  Physical Address
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 400, fontSize: '14px', color: '#111827' }}>
                  {companyInfo.physicalAddress || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Security Section */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            mb: { xs: 2, md: 3 },
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            backgroundColor: '#fff',
          }}
        >
          <Box sx={{ mb: { xs: 2, md: 3 } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                mb: 0.5,
                fontSize: { xs: '16px', md: '18px' },
                color: '#111827'
              }}
            >
              Security
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#6b7280',
                fontSize: { xs: '13px', md: '14px' },
                mb: { xs: 2, md: 3 }
              }}
            >
              Update your password to keep your account secure
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2, md: 2.5 }}>
            <Grid item xs={12}>
              <Typography 
                variant="body2" 
                sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
              >
                Verify current password
              </Typography>
              <TextField
                fullWidth
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        edge="end"
                        size="small"
                      >
                        {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography 
                variant="body2" 
                sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
              >
                New password
              </Typography>
              <TextField
                fullWidth
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        edge="end"
                        size="small"
                      >
                        {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography 
                variant="body2" 
                sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
              >
                Confirm password
              </Typography>
              <TextField
                fullWidth
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        edge="end"
                        size="small"
                      >
                        {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleUpdatePassword}
                sx={{
                  bgcolor: '#578A18',
                  textTransform: 'none',
                  px: 4,
                  width: { xs: '100%', md: 'auto' },
                  mt: 1,
                  '&:hover': {
                    bgcolor: '#467014',
                  },
                }}
              >
                Update Password
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Delete Account Section */}
        <Paper
          elevation={0}
          sx={{
            pt: { xs: 2, md: 3 },
            px: { xs: 2, md: 3 },
            pb: 0,
            border: '1px solid #d32f2f',
            borderRadius: 2,
            backgroundColor: '#fff',
            overflow: 'hidden',
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              mb: 0.5,
              fontSize: { xs: '16px', md: '18px' },
              color: '#111827'
            }}
          >
            Delete account
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#6b7280',
              fontSize: { xs: '13px', md: '14px' },
              mb: { xs: 2, md: 3 }
            }}
          >
            This will permanently delete your Personal Account. Please note that this action is
            irreversible, so proceed with caution.
          </Typography>
          <Box
            sx={{
              bgcolor: '#ffebee',
              borderTop: '1px solid #d32f2f',
              borderBottom: '1px solid #d32f2f',
              borderLeft: 'none',
              borderRight: 'none',
              pt: 2,
              pb: 2,
              px: { xs: 2, md: 3 },
              mt: { xs: 2, md: 3 },
              mx: { xs: -2, md: -3 },
              mb: 0,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 400,
                fontSize: { xs: '13px', md: '14px' },
                color: '#c62828',
                flex: 1,
              }}
            >
              This action cannot be undone!
            </Typography>
            <Button
              variant="contained"
              onClick={() => setDeleteAccountDialog(true)}
              sx={{
                textTransform: 'none',
                fontWeight: 400,
                bgcolor: '#d32f2f',
                color: '#fff',
                px: 3,
                fontSize: { xs: '13px', md: '14px' },
                borderRadius: '6px',
                flexShrink: 0,
                '&:hover': {
                  bgcolor: '#b71c1c',
                },
              }}
            >
              Delete account
            </Button>
          </Box>
        </Paper>

        {/* Add/Edit Contact Dialog */}
        <Dialog 
          open={addContactDialog || editContactDialog} 
          onClose={() => {
            setAddContactDialog(false);
            setEditContactDialog(false);
            setEditingContactIndex(null);
            setNewContact({ name: '', email: '', phone: '', idPassport: '', relationship: '' });
          }} 
          maxWidth="sm" 
          fullWidth
          fullScreen={false}
          PaperProps={{
            sx: {
              borderRadius: { xs: '16px 16px 0 0', md: 2 },
              margin: { xs: 0, md: 'auto' },
              maxHeight: { xs: '90vh', md: 'auto' },
              position: { xs: 'fixed', md: 'relative' },
              bottom: { xs: 0, md: 'auto' },
              top: { xs: 'auto', md: 'auto' },
              width: { xs: '100%', md: '550px' },
            }
          }}
          sx={{
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }
          }}
        >
          <DialogTitle sx={{ 
            pb: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 1, md: 0 }
          }}>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '16px', md: '18px' },
                  color: '#111827',
                  mb: 0.5
                }}
              >
                {editingContactIndex !== null ? 'Edit Additional Contact Information' : 'Add Additional Contact Information'}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#6b7280',
                  fontSize: { xs: '13px', md: '14px' }
                }}
              >
                {editingContactIndex !== null ? 'Update additional contact details.' : 'Add additional contact details.'}
              </Typography>
            </Box>
            <IconButton
              onClick={() => {
                setAddContactDialog(false);
                setEditContactDialog(false);
                setEditingContactIndex(null);
                setNewContact({ name: '', email: '', phone: '', idPassport: '', relationship: '' });
              }}
              sx={{ 
                color: '#6b7280',
                position: { xs: 'absolute', md: 'relative' },
                top: { xs: 16, md: 'auto' },
                right: { xs: 16, md: 'auto' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: { xs: 2, md: 2 }, pb: { xs: 2, md: 2 } }}>
            <Grid container spacing={{ xs: 2, md: 2.5 }}>
              <Grid item xs={12} md={6}>
                <Typography 
                  variant="body2" 
                  sx={{ mb: 1, fontWeight: 500, fontSize: { xs: '13px', md: '14px' }, color: '#374151' }}
                >
                  Full name
                </Typography>
                <TextField
                  fullWidth
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fff',
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography 
                  variant="body2" 
                  sx={{ mb: 1, fontWeight: 500, fontSize: { xs: '13px', md: '14px' }, color: '#374151' }}
                >
                  Relationship to Entity
                </Typography>
                <TextField
                  fullWidth
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fff',
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography 
                  variant="body2" 
                  sx={{ mb: 1, fontWeight: 500, fontSize: { xs: '13px', md: '14px' }, color: '#374151' }}
                >
                  ID/Passport Number
                </Typography>
                <TextField
                  fullWidth
                  value={newContact.idPassport}
                  onChange={(e) => setNewContact({ ...newContact, idPassport: e.target.value })}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fff',
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography 
                  variant="body2" 
                  sx={{ mb: 1, fontWeight: 500, fontSize: { xs: '13px', md: '14px' }, color: '#374151' }}
                >
                  Phone number
                </Typography>
                <TextField
                  fullWidth
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fff',
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography 
                  variant="body2" 
                  sx={{ mb: 1, fontWeight: 500, fontSize: { xs: '13px', md: '14px' }, color: '#374151' }}
                >
                  Email Address
                </Typography>
                <TextField
                  fullWidth
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fff',
                    }
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ 
            p: { xs: 2, md: 3 }, 
            pt: { xs: 1, md: 2 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 2 },
            justifyContent: { xs: 'stretch', sm: editingContactIndex !== null ? 'space-between' : 'flex-end' }
          }}>
            {editingContactIndex !== null && (
              <Button 
                onClick={async () => {
                  try {
                    await handleDeleteContact(editingContactIndex);
                    setEditContactDialog(false);
                    setEditingContactIndex(null);
                    setNewContact({ name: '', email: '', phone: '', idPassport: '', relationship: '' });
                  } catch (error) {
                    console.error('Error deleting contact:', error);
                  }
                }}
                variant="contained"
                sx={{ 
                  bgcolor: '#c62828',
                  textTransform: 'none',
                  fontSize: { xs: '14px', md: '14px' },
                  py: { xs: 1.5, md: 1 },
                  px: 3,
                  width: { xs: '100%', sm: 'auto' },
                  order: { xs: 1, sm: 1 },
                  '&:hover': {
                    bgcolor: '#b71c1c',
                  },
                }}
              >
                Delete Additional Contact
              </Button>
            )}
            <Button 
              onClick={handleSaveContact} 
              variant="contained" 
              sx={{ 
                bgcolor: '#578A18',
                textTransform: 'none',
                fontSize: { xs: '14px', md: '14px' },
                py: { xs: 1.5, md: 1 },
                px: 3,
                width: { xs: '100%', sm: 'auto' },
                order: { xs: 2, sm: 2 },
                '&:hover': {
                  bgcolor: '#467014',
                },
              }}
            >
              Save Additional Contact
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Account Confirmation Dialog */}
        <Dialog open={deleteAccountDialog} onClose={() => setDeleteAccountDialog(false)}>
          <DialogTitle>Confirm Account Deletion</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete your account? This action cannot be undone and all
              your data will be permanently deleted.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteAccountDialog(false)}>Cancel</Button>
            <Button onClick={handleDeleteAccount} color="error" variant="contained">
              Delete Account
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
      <Footer />
    </Box>
  );
};

export default Profile;
