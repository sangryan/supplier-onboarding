import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Popper,
  ClickAwayListener,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { ArrowBack, Search, Check, KeyboardArrowDown } from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import Footer from '../../components/Footer/Footer';

const steps = [
  {
    number: 1,
    title: 'Basic Information',
    description: 'Company and contact details'
  },
  {
    number: 2,
    title: 'Entity Details',
    description: 'Documents and Certifications'
  },
  {
    number: 3,
    title: 'Declarations',
    description: 'Funds and Info Processing'
  },
  {
    number: 4,
    title: 'Review Application',
    description: 'Confirm your application is okay'
  }
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

const legalNatures = [
  'Private Limited Company',
  'Public Limited Company',
  'Partnership',
  'Sole Proprietorship',
  'Trust',
  'NGO',
  'Other'
];

const currencies = ['KES', 'USD', 'EUR', 'GBP'];

const creditPeriods = ['7 Days', '14 Days', '30 Days', '60 Days', '90 Days'];

const entityTypes = [
  'Limited Company',
  'Public Limited Company', 
  'Partnership',
  'Sole Proprietorship',
  'Trust',
  'NGO',
  'Government Entity',
  'Other'
];

const serviceTypes = [
  'Goods Supply',
  'Services',
  'Consultancy',
  'Construction',
  'IT Services',
  'Professional Services',
  'Maintenance & Repair',
  'Other'
];

const SupplierApplication = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Basic Information
    supplierName: '',
    registeredCountry: '',
    companyRegistrationNumber: '',
    companyEmail: '',
    companyWebsite: '',
    legalNature: '',
    physicalAddress: '',
    
    // Contact Person
    contactFullName: '',
    contactRelationship: '',
    contactIdPassport: '',
    contactPhone: '',
    contactEmail: '',
    
    // Payment Details
    bankName: '',
    accountNumber: '',
    branch: '',
    currency: '',
    creditPeriod: '',
    
    // Entity Details
    entityType: '',
    serviceTypes: '',
    servicesDescription: '',
  });
  const [loading, setLoading] = useState(false);
  const [countrySearchOpen, setCountrySearchOpen] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [countryAnchorEl, setCountryAnchorEl] = useState(null);

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearchTerm.toLowerCase())
  );

  const selectedCountry = countries.find(c => c.name === formData.registeredCountry);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      await api.post('/suppliers/draft', { ...formData, status: 'draft' });
      toast.success('Draft saved successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving draft');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndContinue = async () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      setLoading(true);
      try {
        const response = await api.post('/suppliers', formData);
        toast.success('Application submitted successfully!');
        navigate(`/application/${response.data.data._id}`);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error submitting application');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrevious = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            {/* Basic Information Section */}
            <Paper
              elevation={0}
              sx={{
                mb: 4,
                p: 3,
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#fff',
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 0.5,
                  fontSize: '18px',
                  color: '#111827'
                }}
              >
                Basic Information
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#6b7280',
                  fontSize: '14px',
                  mb: 3
                }}
              >
                Summary of your company
              </Typography>

              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <Typography 
                    variant="body2" 
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
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
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    Registered Country
                  </Typography>
                  <ClickAwayListener onClickAway={() => setCountrySearchOpen(false)}>
                    <Box>
                      <TextField
                        fullWidth
                        size="small"
                        value={selectedCountry ? selectedCountry.name : ''}
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
                          }}
                        >
                          {/* Search Input Inside Dropdown */}
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
                          
                          {/* Country List - Show exactly 4 items */}
                          <Box
                            sx={{
                              maxHeight: '200px', // Exactly 4 items × 50px per item
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
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
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
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
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
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
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
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    Legal Nature of Entity
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={formData.legalNature}
                      onChange={(e) => handleChange('legalNature', e.target.value)}
                      displayEmpty
                      sx={{ backgroundColor: '#fff' }}
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
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
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
            </Paper>

            {/* Contact Person Details Section */}
            <Paper
              elevation={0}
              sx={{
                mb: 4,
                p: 3,
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#fff',
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 0.5,
                  fontSize: '18px',
                  color: '#111827'
                }}
              >
                Contact Person Details
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#6b7280',
                  fontSize: '14px',
                  mb: 3
                }}
              >
                Details of person authorised to act on behalf of the entity
              </Typography>

              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <Typography 
                    variant="body2" 
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    Full name
                  </Typography>
                  <TextField
                    fullWidth
                    value={formData.contactFullName}
                    onChange={(e) => handleChange('contactFullName', e.target.value)}
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
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    Relationship to Entity
                  </Typography>
                  <TextField
                    fullWidth
                    value={formData.contactRelationship}
                    onChange={(e) => handleChange('contactRelationship', e.target.value)}
                    placeholder="e.g. CEO, CFO"
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
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    ID/Passport Number
                  </Typography>
                  <TextField
                    fullWidth
                    value={formData.contactIdPassport}
                    onChange={(e) => handleChange('contactIdPassport', e.target.value)}
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
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    Phone number
                  </Typography>
                  <TextField
                    fullWidth
                    value={formData.contactPhone}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                    placeholder="e.g +254712345678"
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
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    Email address
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#fff',
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Payment Details Section */}
            <Paper
              elevation={0}
              sx={{
                mb: 4,
                p: 3,
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#fff',
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 0.5,
                  fontSize: '18px',
                  color: '#111827'
                }}
              >
                Payment Details
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#6b7280',
                  fontSize: '14px',
                  mb: 3
                }}
              >
                Payment method and terms
              </Typography>

              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <Typography 
                    variant="body2" 
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    Bank name
                  </Typography>
                  <TextField
                    fullWidth
                    value={formData.bankName}
                    onChange={(e) => handleChange('bankName', e.target.value)}
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
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    Account Number
                  </Typography>
                  <TextField
                    fullWidth
                    value={formData.accountNumber}
                    onChange={(e) => handleChange('accountNumber', e.target.value)}
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
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    Branch
                  </Typography>
                  <TextField
                    fullWidth
                    value={formData.branch}
                    onChange={(e) => handleChange('branch', e.target.value)}
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
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    Currency
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={formData.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      displayEmpty
                      sx={{ backgroundColor: '#fff' }}
                    >
                      <MenuItem value="" disabled>
                        Select
                      </MenuItem>
                      {currencies.map((curr) => (
                        <MenuItem key={curr} value={curr}>
                          {curr}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Typography 
                    variant="body2" 
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    Applicable Credit Period
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={formData.creditPeriod}
                      onChange={(e) => handleChange('creditPeriod', e.target.value)}
                      displayEmpty
                      sx={{ backgroundColor: '#fff' }}
                    >
                      <MenuItem value="" disabled>
                        Select
                      </MenuItem>
                      {creditPeriods.map((period) => (
                        <MenuItem key={period} value={period}>
                          {period}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );
      
      case 1:
        return (
          <Box>
            {/* Entity Details Section */}
            <Paper
              elevation={0}
              sx={{
                mb: 4,
                p: 3,
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#fff',
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 0.5,
                  fontSize: '18px',
                  color: '#111827'
                }}
              >
                Entity Details
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#6b7280',
                  fontSize: '14px',
                  mb: 3
                }}
              >
                Entity type and required documents
              </Typography>

              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Typography 
                    variant="body2" 
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    Entity type
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={formData.entityType}
                      onChange={(e) => handleChange('entityType', e.target.value)}
                      displayEmpty
                      sx={{ backgroundColor: '#fff' }}
                    >
                      <MenuItem value="" disabled>
                        Select
                      </MenuItem>
                      {entityTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* Service Details Section */}
            <Paper
              elevation={0}
              sx={{
                mb: 4,
                p: 3,
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#fff',
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 0.5,
                  fontSize: '18px',
                  color: '#111827'
                }}
              >
                Service Details
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#6b7280',
                  fontSize: '14px',
                  mb: 3
                }}
              >
                Details of services being offered
              </Typography>

              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Typography 
                    variant="body2" 
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    Types of Services Being Offered
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={formData.serviceTypes}
                      onChange={(e) => handleChange('serviceTypes', e.target.value)}
                      displayEmpty
                      sx={{ backgroundColor: '#fff' }}
                    >
                      <MenuItem value="" disabled>
                        Select service type
                      </MenuItem>
                      {serviceTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Typography 
                    variant="body2" 
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    Services Description
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    value={formData.servicesDescription}
                    onChange={(e) => handleChange('servicesDescription', e.target.value)}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#fff',
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );
      
      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" gutterBottom>
              Declarations
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Funds and information processing declarations coming soon
            </Typography>
          </Box>
        );
      
      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" gutterBottom>
              Review Application
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Review and confirm your application details
            </Typography>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box sx={{ backgroundColor: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', pb: 0 }}>
      <Container maxWidth="lg" sx={{ pt: 3, pb: 4, flex: 1 }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
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
          Home
        </Button>

        {/* Custom Stepper */}
        <Box sx={{ mb: 4 }}>
          {/* Mobile View - Just Numbers */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', gap: 4, mb: 3 }}>
            {steps.map((step, index) => (
              <Box
                key={step.number}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: index < activeStep ? theme.palette.green.main : index === activeStep ? theme.palette.green.main : 'transparent',
                  color: index === activeStep || index < activeStep ? '#fff' : theme.palette.green.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '16px'
                }}
              >
                {index < activeStep ? <Check sx={{ fontSize: '16px', fontWeight: 'bold' }} /> : step.number}
              </Box>
            ))}
          </Box>

          {/* Desktop View - Full Details */}
          <Grid 
            container 
            spacing={0} 
            justifyContent="center" 
            alignItems="flex-start"
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            {steps.map((step, index) => (
              <Grid 
                item 
                xs={12} 
                sm={6} 
                md={3} 
                key={step.number}
                sx={{
                  position: 'relative',
                  px: { xs: 2, md: 2 },
                  ...(index < steps.length - 1 && {
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      right: 0,
                      top: '80px',
                      height: '1px',
                      width: '100%',
                      maxWidth: '50px',
                      backgroundColor: '#e5e7eb',
                      display: { xs: 'none', md: 'block' }
                    }
                  })
                }}
              >
                <Box sx={{ textAlign: 'center', px: { xs: 1, md: 1 } }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: index < activeStep ? theme.palette.green.main : index === activeStep ? theme.palette.green.main : 'transparent',
                      border: index === activeStep || index < activeStep ? 'none' : 'none',
                      color: index === activeStep || index < activeStep ? '#fff' : theme.palette.green.main,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      mb: 1.5,
                      fontWeight: 600,
                      fontSize: '20px',
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    {index < activeStep ? <Check sx={{ fontSize: '20px', fontWeight: 'bold', strokeWidth: 2 }} /> : step.number}
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: '16px',
                      color: '#000',
                      mb: 0.5
                    }}
                  >
                    {step.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '14px',
                      color: '#9ca3af',
                      fontWeight: 400,
                      lineHeight: 1.5
                    }}
                  >
                    {step.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Form Content */}
        <Box sx={{ mb: 3 }}>
          {renderStepContent(activeStep)}
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          {/* Left side buttons */}
          <Box>
            {activeStep > 0 && (
              <Button
                variant="outlined"
                onClick={handlePrevious}
                startIcon={<ArrowBack />}
                sx={{
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  px: 3,
                  py: 1,
                  borderRadius: '6px',
                  borderColor: '#d1d5db',
                  color: '#374151',
                  '&:hover': {
                    borderColor: '#9ca3af',
                    backgroundColor: '#f9fafb'
                  }
                }}
              >
                Previous
              </Button>
            )}
          </Box>

          {/* Right side buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeStep === 0 && (
              <Button
                variant="outlined"
                onClick={handleSaveDraft}
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  px: 3,
                  py: 1,
                  borderRadius: '6px',
                  borderColor: '#d1d5db',
                  color: '#374151',
                  '&:hover': {
                    borderColor: '#9ca3af',
                    backgroundColor: '#f9fafb'
                  }
                }}
              >
                Save Draft
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleSaveAndContinue}
              disabled={loading}
              sx={{
                backgroundColor: theme.palette.green.main,
                color: '#fff',
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 500,
                px: 3,
                py: 1,
                borderRadius: '6px',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: theme.palette.green.hover,
                  boxShadow: 'none',
                },
              }}
            >
              {loading ? 'Saving...' : 'Save and Continue'}
            </Button>
          </Box>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default SupplierApplication;
