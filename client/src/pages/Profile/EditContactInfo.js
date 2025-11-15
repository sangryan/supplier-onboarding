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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import Footer from '../../components/Footer/Footer';

const EditContactInfo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [additionalContacts, setAdditionalContacts] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    relationship: '',
    idPassport: '',
    phone: '',
    email: '',
    comment: '',
  });
  
  // Dialog states
  const [editContactDialog, setEditContactDialog] = useState(false);
  const [addContactDialog, setAddContactDialog] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', idPassport: '', relationship: '' });
  const [editingContactIndex, setEditingContactIndex] = useState(null);

  useEffect(() => {
    fetchSupplierData();
  }, [user]);

  const fetchSupplierData = async () => {
    // Full name should always match the registered user's name
    const registeredFullName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}`.trim()
      : (user?.firstName || user?.lastName || '');
    
    if (user?.role === 'supplier') {
      try {
        const response = await api.get('/suppliers');
        const suppliers = response.data.data || [];
        if (suppliers.length > 0) {
          const supplierData = suppliers[0];
          setSupplier(supplierData);
          
          // Populate form with existing data
          if (supplierData.authorizedPerson) {
            setFormData({
              fullName: registeredFullName,
              relationship: supplierData.authorizedPerson.relationship || '',
              idPassport: supplierData.authorizedPerson.idPassportNumber || '',
              phone: supplierData.authorizedPerson.phone || '',
              email: supplierData.authorizedPerson.email || user?.email || '',
              comment: '',
            });
          } else {
            // If no authorizedPerson data, populate with user's registered name
            setFormData({
              fullName: registeredFullName,
              relationship: '',
              idPassport: '',
              phone: '',
              email: user?.email || '',
              comment: '',
            });
          }
          
          // Initialize additional contacts
          if (supplierData.additionalContacts) {
            setAdditionalContacts(supplierData.additionalContacts);
          }
        } else {
          // No supplier data exists yet, populate with user's registered name
          setFormData({
            fullName: registeredFullName,
            relationship: '',
            idPassport: '',
            phone: '',
            email: user?.email || '',
            comment: '',
          });
        }
      } catch (error) {
        console.error('Error fetching supplier data:', error);
        // On error, still populate with user's registered name
        setFormData({
          fullName: registeredFullName,
          relationship: '',
          idPassport: '',
          phone: '',
          email: user?.email || '',
          comment: '',
        });
      }
    } else {
      // Not a supplier, but still populate with user's registered name
      setFormData({
        fullName: registeredFullName,
        relationship: '',
        idPassport: '',
        phone: '',
        email: user?.email || '',
        comment: '',
      });
    }
    setLoading(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      
      setAddContactDialog(false);
      setEditContactDialog(false);
      setEditingContactIndex(null);
      setNewContact({ name: '', email: '', phone: '', idPassport: '', relationship: '' });
      toast.success(editingContactIndex !== null ? 'Contact updated successfully' : 'Contact added successfully');
    } catch (error) {
      toast.error('Failed to save contact');
    }
  };

  const handleDeleteContact = (index) => {
    const updated = additionalContacts.filter((_, i) => i !== index);
    setAdditionalContacts(updated);
    toast.success('Contact deleted successfully');
  };

  const handleEditContact = (contact, index) => {
    setNewContact(contact);
    setEditingContactIndex(index);
    setEditContactDialog(true);
  };

  const handleSubmit = async () => {
    try {
      // Create profile update request
      const updateData = {
        authorizedPerson: {
          name: formData.fullName,
          relationship: formData.relationship,
          idPassportNumber: formData.idPassport,
          phone: formData.phone,
          email: formData.email,
        },
        additionalContacts: additionalContacts,
        profileUpdateComment: formData.comment,
      };

      if (supplier?._id) {
        await api.put(`/suppliers/${supplier._id}`, updateData);
        toast.success('Contact information update submitted for approval');
        navigate('/profile');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit update request');
    }
  };

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
        {/* Back Button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/profile')}
          sx={{
            color: '#6b7280',
            textTransform: 'none',
            fontSize: '14px',
            mb: 3,
            '&:hover': {
              backgroundColor: 'transparent',
              color: '#374151'
            }
          }}
        >
          Profile & Settings
        </Button>

        {/* Edit Contact Information Form */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            backgroundColor: '#fff',
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
            Edit Contact Information
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#6b7280',
              fontSize: { xs: '13px', md: '14px' },
              mb: 3
            }}
          >
            Changes to contact information require approval
          </Typography>

          {/* Primary Contact Fields */}
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
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
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
                value={formData.relationship}
                onChange={(e) => handleChange('relationship', e.target.value)}
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
                value={formData.idPassport}
                onChange={(e) => handleChange('idPassport', e.target.value)}
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
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
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
                Email address
              </Typography>
              <TextField
                fullWidth
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                  }
                }}
              />
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
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteContact(index)}
                      sx={{ color: '#c62828' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))
            )}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                setNewContact({ name: '', email: '', phone: '', idPassport: '', relationship: '' });
                setAddContactDialog(true);
              }}
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

          {/* Comment Section */}
          <Box sx={{ mt: { xs: 3, md: 4 } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                mb: 2,
                fontSize: { xs: '16px', md: '18px' }
              }}
            >
              Comment
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={formData.comment}
              onChange={(e) => handleChange('comment', e.target.value)}
              placeholder="Describe reasons for changes in contact information"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                }
              }}
            />
          </Box>

          {/* Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 2, 
            mt: { xs: 3, md: 4 },
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <Button
              onClick={() => navigate('/profile')}
              sx={{
                textTransform: 'none',
                color: '#6b7280',
                borderColor: '#d1d5db',
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  bgcolor: '#f9fafb',
                  borderColor: '#9ca3af',
                },
              }}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                bgcolor: '#578A18',
                textTransform: 'none',
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  bgcolor: '#467014',
                },
              }}
            >
              Submit for Approval
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
          maxWidth="xs" 
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
                    handleDeleteContact(editingContactIndex);
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
      </Container>
      <Footer />
    </Box>
  );
};

export default EditContactInfo;

