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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { ArrowBack } from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';

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
  'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Burundi', 'South Sudan',
  'Ethiopia', 'Somalia', 'Egypt', 'South Africa', 'Nigeria', 'Ghana',
  'Other'
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
  });
  const [loading, setLoading] = useState(false);

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

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            {/* Basic Information Section */}
            <Box sx={{ mb: 4 }}>
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
                  <FormControl fullWidth size="small">
                    <Select
                      value={formData.registeredCountry}
                      onChange={(e) => handleChange('registeredCountry', e.target.value)}
                      displayEmpty
                      sx={{ backgroundColor: '#fff' }}
                    >
                      <MenuItem value="" disabled>
                        <em>Select country</em>
                      </MenuItem>
                      {countries.map((country) => (
                        <MenuItem key={country} value={country}>
                          {country}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
                        <em>Select</em>
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
            </Box>

            {/* Contact Person Details Section */}
            <Box sx={{ mb: 4 }}>
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
            </Box>

            {/* Payment Details Section */}
            <Box sx={{ mb: 4 }}>
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
                        <em>Select</em>
                      </MenuItem>
                      {currencies.map((curr) => (
                        <MenuItem key={curr} value={curr}>
                          {curr}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
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
                        <em>Select</em>
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
            </Box>
          </Box>
        );
      
      case 1:
        return (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" gutterBottom>
              Entity Details
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Document upload and certifications section coming soon
            </Typography>
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
    <Box sx={{ backgroundColor: '#fff', minHeight: '100vh', pb: 4 }}>
      <Container maxWidth="lg" sx={{ pt: 3 }}>
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
          <Grid container spacing={3} justifyContent="center">
            {steps.map((step, index) => (
              <Grid item xs={12} sm={6} md={3} key={step.number}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: index === activeStep ? theme.palette.green.main : '#e5e7eb',
                      color: index === activeStep ? '#fff' : '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      mb: 1.5,
                      fontWeight: 600,
                      fontSize: '18px'
                    }}
                  >
                    {step.number}
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: index === activeStep ? 600 : 500,
                      fontSize: '15px',
                      color: index === activeStep ? '#111827' : '#6b7280',
                      mb: 0.5
                    }}
                  >
                    {step.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '13px',
                      color: '#9ca3af'
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
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            mb: 3
          }}
        >
          {renderStepContent(activeStep)}
        </Paper>

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
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
      </Container>
    </Box>
  );
};

export default SupplierApplication;
