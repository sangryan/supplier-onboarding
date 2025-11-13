import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  FormHelperText,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const steps = ['Basic Information', 'Company Details', 'Authorized Person', 'Documents', 'Review & Submit'];

// Required documents based on entity type
const getRequiredDocuments = (entityType) => {
  const docs = {
    private_company: [
      'Certificate of incorporation',
      'Valid CR12 (not more than 30 days old)',
      'PIN Certificate of entity',
      'Directors IDs/Passports',
      'Company Profile',
      'Bank reference letter',
      'Audited financial statements',
      'Proof of e-TIMS registration'
    ],
    partnership: [
      'Partnership Deed',
      'PIN Certificate of partners',
      'Tax compliance certificate',
      'Partners IDs/Passports',
      'Company Profile',
      'Bank reference letter',
      'Audited financial statements',
      'Proof of e-TIMS registration'
    ],
    individual: [
      'National ID/Passport',
      'Police clearance certificate',
      'PIN Certificate',
      'Resume (CV)',
      'Bank reference letter',
      'Proof of e-TIMS registration'
    ],
    foreign_company: [
      'Certificate of incorporation',
      'Share certificate/registry extract',
      'Tax compliance certificate',
      'Directors identification documents',
      'Company Profile',
      'Audited financial statements',
      'Bank reference letter'
    ],
    trust: [
      'Trust Deed',
      'PIN Certificate of Founders',
      'Founders IDs/Passports',
      'Beneficiaries IDs/Passports',
      'Bank reference letter',
      'Audited financial statements'
    ]
  };
  return docs[entityType] || [];
};

const SupplierApplication = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Basic Information
    supplierName: '',
    legalNature: '',
    legalNatureOther: '',
    entityType: '',
    serviceType: '',
    serviceTypeOther: '',
    
    // Company Details
    companyRegistrationNumber: '',
    companyEmail: '',
    companyPhysicalAddress: {
      street: '',
      city: '',
      country: 'Kenya',
      postalCode: ''
    },
    creditPeriod: 30,
    
    // Authorized Person
    authorizedPerson: {
      name: '',
      relationship: '',
      idPassportNumber: '',
      phone: '',
      email: ''
    },
    
    // Source of Funds
    sourceOfFunds: {
      source: '',
      declarantName: '',
      declarantIdPassport: '',
      declarantCapacity: '',
      declarationDate: new Date().toISOString().split('T')[0]
    },
    
    // Data Processing Consent
    dataProcessingConsent: {
      granted: false,
      consentorName: '',
      consentorIdPassport: '',
      consentorCapacity: '',
      consentDate: new Date().toISOString().split('T')[0]
    }
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Basic Information
        if (!formData.supplierName) newErrors.supplierName = 'Required';
        if (!formData.legalNature) newErrors.legalNature = 'Required';
        if (formData.legalNature === 'other' && !formData.legalNatureOther) {
          newErrors.legalNatureOther = 'Required';
        }
        if (!formData.serviceType) newErrors.serviceType = 'Required';
        break;
        
      case 1: // Company Details
        if (!formData.companyEmail) newErrors.companyEmail = 'Required';
        if (!formData.companyPhysicalAddress.street) newErrors['companyPhysicalAddress.street'] = 'Required';
        if (!formData.companyPhysicalAddress.city) newErrors['companyPhysicalAddress.city'] = 'Required';
        break;
        
      case 2: // Authorized Person
        if (!formData.authorizedPerson.name) newErrors['authorizedPerson.name'] = 'Required';
        if (!formData.authorizedPerson.email) newErrors['authorizedPerson.email'] = 'Required';
        if (!formData.authorizedPerson.phone) newErrors['authorizedPerson.phone'] = 'Required';
        if (!formData.authorizedPerson.idPassportNumber) newErrors['authorizedPerson.idPassportNumber'] = 'Required';
        if (!formData.authorizedPerson.relationship) newErrors['authorizedPerson.relationship'] = 'Required';
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await api.post('/suppliers', formData);
      toast.success('Application saved successfully!');
      navigate(`/application/${response.data.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving application');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Supplier/Company Name"
                value={formData.supplierName}
                onChange={(e) => handleChange('supplierName', e.target.value)}
                error={!!errors.supplierName}
                helperText={errors.supplierName}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.legalNature}>
                <InputLabel>Legal Nature of Entity</InputLabel>
                <Select
                  value={formData.legalNature}
                  onChange={(e) => handleChange('legalNature', e.target.value)}
                  required
                >
                  <MenuItem value="company">Private/Public Company</MenuItem>
                  <MenuItem value="partnership">Partnership</MenuItem>
                  <MenuItem value="individual">Individual/Sole Proprietor</MenuItem>
                  <MenuItem value="foreign_company">Foreign Company</MenuItem>
                  <MenuItem value="trust">Trust</MenuItem>
                  <MenuItem value="state_owned">State-owned Entity</MenuItem>
                  <MenuItem value="ngo">NGO</MenuItem>
                  <MenuItem value="foundation">Foundation</MenuItem>
                  <MenuItem value="association">Association</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
                {errors.legalNature && <FormHelperText>{errors.legalNature}</FormHelperText>}
              </FormControl>
            </Grid>
            
            {formData.legalNature === 'other' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Please specify"
                  value={formData.legalNatureOther}
                  onChange={(e) => handleChange('legalNatureOther', e.target.value)}
                  error={!!errors.legalNatureOther}
                  helperText={errors.legalNatureOther}
                  required
                />
              </Grid>
            )}
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.serviceType}>
                <InputLabel>Type of Services</InputLabel>
                <Select
                  value={formData.serviceType}
                  onChange={(e) => handleChange('serviceType', e.target.value)}
                  required
                >
                  <MenuItem value="professional_services">Professional Services</MenuItem>
                  <MenuItem value="digital_services">Digital Services</MenuItem>
                  <MenuItem value="physical_goods">Physical Goods</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
                {errors.serviceType && <FormHelperText>{errors.serviceType}</FormHelperText>}
              </FormControl>
            </Grid>
            
            {formData.serviceType === 'other' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Please specify service type"
                  value={formData.serviceTypeOther}
                  onChange={(e) => handleChange('serviceTypeOther', e.target.value)}
                />
              </Grid>
            )}
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Applicable Credit Period (days)"
                value={formData.creditPeriod}
                onChange={(e) => handleChange('creditPeriod', e.target.value)}
                helperText="Payment terms in days"
              />
            </Grid>
          </Grid>
        );
        
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Registration Number"
                value={formData.companyRegistrationNumber}
                onChange={(e) => handleChange('companyRegistrationNumber', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Email"
                type="email"
                value={formData.companyEmail}
                onChange={(e) => handleChange('companyEmail', e.target.value)}
                error={!!errors.companyEmail}
                helperText={errors.companyEmail}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>Physical Address</Divider>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={formData.companyPhysicalAddress.street}
                onChange={(e) => handleChange('companyPhysicalAddress.street', e.target.value)}
                error={!!errors['companyPhysicalAddress.street']}
                helperText={errors['companyPhysicalAddress.street']}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                value={formData.companyPhysicalAddress.city}
                onChange={(e) => handleChange('companyPhysicalAddress.city', e.target.value)}
                error={!!errors['companyPhysicalAddress.city']}
                helperText={errors['companyPhysicalAddress.city']}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Country"
                value={formData.companyPhysicalAddress.country}
                onChange={(e) => handleChange('companyPhysicalAddress.country', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Postal Code"
                value={formData.companyPhysicalAddress.postalCode}
                onChange={(e) => handleChange('companyPhysicalAddress.postalCode', e.target.value)}
              />
            </Grid>
          </Grid>
        );
        
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Authorized Person Details
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Person authorized to act on behalf of the entity
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.authorizedPerson.name}
                onChange={(e) => handleChange('authorizedPerson.name', e.target.value)}
                error={!!errors['authorizedPerson.name']}
                helperText={errors['authorizedPerson.name']}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Relationship to Entity"
                value={formData.authorizedPerson.relationship}
                onChange={(e) => handleChange('authorizedPerson.relationship', e.target.value)}
                error={!!errors['authorizedPerson.relationship']}
                helperText={errors['authorizedPerson.relationship']}
                placeholder="e.g., Director, CEO, Partner"
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ID/Passport Number"
                value={formData.authorizedPerson.idPassportNumber}
                onChange={(e) => handleChange('authorizedPerson.idPassportNumber', e.target.value)}
                error={!!errors['authorizedPerson.idPassportNumber']}
                helperText={errors['authorizedPerson.idPassportNumber']}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.authorizedPerson.phone}
                onChange={(e) => handleChange('authorizedPerson.phone', e.target.value)}
                error={!!errors['authorizedPerson.phone']}
                helperText={errors['authorizedPerson.phone']}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.authorizedPerson.email}
                onChange={(e) => handleChange('authorizedPerson.email', e.target.value)}
                error={!!errors['authorizedPerson.email']}
                helperText={errors['authorizedPerson.email']}
                required
              />
            </Grid>
          </Grid>
        );
        
      case 3:
        const requiredDocs = getRequiredDocuments(formData.entityType || formData.legalNature);
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Documents will be uploaded after saving the application. Please complete all previous steps first.
            </Alert>
            
            <Typography variant="h6" gutterBottom>
              Required Documents
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 2 }}>
              Based on your entity type, you will need to upload the following documents:
            </Typography>
            
            <Box component="ul" sx={{ pl: 2 }}>
              {requiredDocs.map((doc, index) => (
                <Typography component="li" key={index} variant="body2" sx={{ mb: 1 }}>
                  {doc}
                </Typography>
              ))}
            </Box>
          </Box>
        );
        
      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Application
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 3 }}>
              Please review your information before submitting
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary">Basic Information</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Supplier Name</Typography>
                <Typography variant="body1">{formData.supplierName}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Legal Nature</Typography>
                <Typography variant="body1">{formData.legalNature}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Service Type</Typography>
                <Typography variant="body1">{formData.serviceType}</Typography>
              </Grid>
              
              <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary">Company Details</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Company Email</Typography>
                <Typography variant="body1">{formData.companyEmail}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">Physical Address</Typography>
                <Typography variant="body1">
                  {formData.companyPhysicalAddress.street}, {formData.companyPhysicalAddress.city}, {formData.companyPhysicalAddress.country}
                </Typography>
              </Grid>
              
              <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary">Authorized Person</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Name</Typography>
                <Typography variant="body1">{formData.authorizedPerson.name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Email</Typography>
                <Typography variant="body1">{formData.authorizedPerson.email}</Typography>
              </Grid>
            </Grid>
            
            <Alert severity="warning" sx={{ mt: 3 }}>
              After saving, you will need to upload required documents before submitting your application for review.
            </Alert>
          </Box>
        );
        
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Supplier Onboarding Application
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 4 }}>
          Complete all steps to submit your application
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: '400px' }}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
          <Button
            color="inherit"
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          {activeStep === steps.length - 1 ? (
            <Button onClick={handleSubmit} variant="contained" disabled={loading}>
              {loading ? 'Saving...' : 'Save Application'}
            </Button>
          ) : (
            <Button onClick={handleNext} variant="contained">
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default SupplierApplication;

