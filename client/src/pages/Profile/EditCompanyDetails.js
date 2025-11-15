import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  FormControl,
  Select,
  MenuItem,
  ClickAwayListener,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack,
  KeyboardArrowDown,
  Search,
  Check,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import Footer from '../../components/Footer/Footer';

const legalNatures = [
  'Private Limited Company',
  'Public Limited Company',
  'Partnership',
  'Sole Proprietorship',
  'Trust',
  'NGO',
  'Other'
];

const countries = [
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
];

// Reverse mapping: Convert database enum values to display values
const mapLegalNatureToDisplay = (dbValue) => {
  const mapping = {
    'company': 'Private Limited Company', // Default to Private Limited Company
    'partnership': 'Partnership',
    'individual': 'Sole Proprietorship',
    'state_owned': 'Private Limited Company', // Map to closest match
    'ngo': 'NGO',
    'foundation': 'Private Limited Company', // Map to closest match
    'association': 'Private Limited Company', // Map to closest match
    'foreign_company': 'Private Limited Company', // Map to closest match
    'trust': 'Trust',
    'other': 'Other'
  };
  return mapping[dbValue] || '';
};

const EditCompanyDetails = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    supplierName: '',
    registeredCountry: '',
    companyRegistrationNumber: '',
    companyEmail: '',
    companyWebsite: '',
    legalNature: '',
    physicalAddress: '',
    comment: '',
  });

  // Country selector state
  const [countrySearchOpen, setCountrySearchOpen] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [countryAnchorEl, setCountryAnchorEl] = useState(null);

  useEffect(() => {
    fetchSupplierData();
  }, [user]);

  const fetchSupplierData = async () => {
    if (user?.role === 'supplier') {
      try {
        const response = await api.get('/suppliers');
        const suppliers = response.data.data || [];
        if (suppliers.length > 0) {
          const supplierData = suppliers[0];
          setSupplier(supplierData);
          
          const address = supplierData.companyPhysicalAddress;
          const fullAddress = address
            ? `${address.street || ''}, ${address.city || ''}, ${address.country || ''}${address.postalCode ? `, ${address.postalCode}` : ''}`.replace(/^,\s*|,\s*$/g, '')
            : supplierData.physicalAddress || '';
          
          // Map legalNature from database enum to display value
          const legalNatureDisplay = supplierData.legalNature 
            ? mapLegalNatureToDisplay(supplierData.legalNature)
            : '';
          
          setFormData({
            supplierName: supplierData.supplierName || '',
            registeredCountry: supplierData.registeredCountry || address?.country || '',
            companyRegistrationNumber: supplierData.companyRegistrationNumber || '',
            companyEmail: supplierData.companyEmail || '',
            companyWebsite: supplierData.companyWebsite || '',
            legalNature: legalNatureDisplay,
            physicalAddress: fullAddress,
            comment: '',
          });
        }
      } catch (error) {
        console.error('Error fetching supplier data:', error);
      }
    }
    setLoading(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearchTerm.toLowerCase())
  );

  const handleSubmit = async () => {
    try {
      const updateData = {
        supplierName: formData.supplierName,
        registeredCountry: formData.registeredCountry,
        companyRegistrationNumber: formData.companyRegistrationNumber,
        companyEmail: formData.companyEmail,
        companyWebsite: formData.companyWebsite,
        legalNature: formData.legalNature,
        physicalAddress: formData.physicalAddress,
        companyUpdateComment: formData.comment,
      };

      if (supplier?._id) {
        await api.put(`/suppliers/${supplier._id}`, updateData);
        toast.success('Company details update submitted for approval');
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

        {/* Edit Company Details Form */}
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
            Edit Company Details
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#6b7280',
              fontSize: { xs: '13px', md: '14px' },
              mb: 3
            }}
          >
            Changes to company details require approval
          </Typography>

          {/* Company Fields */}
          <Grid container spacing={{ xs: 2, md: 2.5 }}>
            <Grid item xs={12} md={6}>
              <Typography 
                variant="body2" 
                sx={{ mb: 1, fontWeight: 500, fontSize: { xs: '13px', md: '14px' }, color: '#374151' }}
              >
                Supplier name
              </Typography>
              <TextField
                fullWidth
                value={formData.supplierName}
                onChange={(e) => handleChange('supplierName', e.target.value)}
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
                Registered Country
              </Typography>
              <ClickAwayListener onClickAway={() => setCountrySearchOpen(false)}>
                <Box>
                  <TextField
                    fullWidth
                    size="small"
                    value={formData.registeredCountry}
                    placeholder="Select country"
                    onClick={(e) => {
                      setCountryAnchorEl(e.currentTarget);
                      setCountrySearchOpen(!countrySearchOpen);
                      setCountrySearchTerm('');
                    }}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <KeyboardArrowDown sx={{ color: '#6b7280' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                      }
                    }}
                  />
                  
                  {countrySearchOpen && (
                    <Paper
                      sx={{
                        mt: 0.5,
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        position: 'absolute',
                        zIndex: 1300,
                        width: countryAnchorEl ? countryAnchorEl.offsetWidth : 'auto',
                      }}
                    >
                      <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Search country..."
                          value={countrySearchTerm}
                          onChange={(e) => setCountrySearchTerm(e.target.value)}
                          autoFocus
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Search sx={{ color: '#9ca3af', fontSize: 20 }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: 'transparent',
                              '& fieldset': {
                                border: 'none',
                              },
                              '&:hover fieldset': {
                                border: 'none',
                              },
                              '&.Mui-focused fieldset': {
                                border: 'none',
                              },
                              padding: 0,
                            }
                          }}
                        />
                      </Box>
                      
                      <Box
                        sx={{
                          maxHeight: '200px',
                          overflowY: 'auto',
                          px: 1.5,
                          pb: 1,
                          '&::-webkit-scrollbar': {
                            width: '6px',
                          },
                          '&::-webkit-scrollbar-track': {
                            backgroundColor: '#f1f1f1',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            backgroundColor: '#d1d5db',
                            borderRadius: '3px',
                          },
                        }}
                      >
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((country) => (
                            <Box
                              key={country.code}
                              onClick={() => {
                                handleChange('registeredCountry', country.name);
                                setCountrySearchOpen(false);
                                setCountrySearchTerm('');
                              }}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                px: 1.5,
                                py: 1.25,
                                cursor: 'pointer',
                                borderRadius: '4px',
                                '&:hover': {
                                  backgroundColor: '#f9fafb'
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography sx={{ fontSize: '20px' }}>{country.flag}</Typography>
                                <Typography sx={{ fontSize: '14px', color: '#374151' }}>
                                  {country.name}
                                </Typography>
                              </Box>
                              {formData.registeredCountry === country.name && (
                                <Check sx={{ color: '#578A18', fontSize: 20 }} />
                              )}
                            </Box>
                          ))
                        ) : (
                          <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography sx={{ fontSize: '14px', color: '#9ca3af' }}>
                              No countries found
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  )}
                </Box>
              </ClickAwayListener>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography 
                variant="body2" 
                sx={{ mb: 1, fontWeight: 500, fontSize: { xs: '13px', md: '14px' }, color: '#374151' }}
              >
                Company Registration Number
              </Typography>
              <TextField
                fullWidth
                value={formData.companyRegistrationNumber}
                onChange={(e) => handleChange('companyRegistrationNumber', e.target.value)}
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
                Company Email Address
              </Typography>
              <TextField
                fullWidth
                type="email"
                value={formData.companyEmail}
                onChange={(e) => handleChange('companyEmail', e.target.value)}
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
                Company Website
              </Typography>
              <TextField
                fullWidth
                value={formData.companyWebsite}
                onChange={(e) => handleChange('companyWebsite', e.target.value)}
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
                Legal Nature of Entity
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={formData.legalNature}
                  onChange={(e) => handleChange('legalNature', e.target.value)}
                  displayEmpty
                  IconComponent={KeyboardArrowDown}
                  sx={{ 
                    backgroundColor: '#fff',
                    '& .MuiSelect-icon': {
                      color: '#6b7280'
                    }
                  }}
                >
                  <MenuItem value="" disabled>
                    Select
                  </MenuItem>
                  {legalNatures.map((nature) => (
                    <MenuItem key={nature} value={nature}>
                      {nature}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography 
                variant="body2" 
                sx={{ mb: 1, fontWeight: 500, fontSize: { xs: '13px', md: '14px' }, color: '#374151' }}
              >
                Physical Address
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={formData.physicalAddress}
                onChange={(e) => handleChange('physicalAddress', e.target.value)}
                placeholder="Type your physical address here. Be as detailed as possible"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                  }
                }}
              />
            </Grid>
          </Grid>

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
              placeholder="Describe reasons for changes in company details"
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
      </Container>
      <Footer />
    </Box>
  );
};

export default EditCompanyDetails;

