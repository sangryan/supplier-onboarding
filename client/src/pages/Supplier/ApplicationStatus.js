import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  IconButton,
  Chip,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  ExpandMore,
  Check,
  Close,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { format, parse, isValid } from 'date-fns';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const ApplicationStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedAccordion, setExpandedAccordion] = useState('basicInformation');
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [fileViewerUrl, setFileViewerUrl] = useState(null);
  const [fileViewerName, setFileViewerName] = useState('');
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSupplierApplication();
    }
  }, [id]);

  const fetchSupplierApplication = async () => {
    try {
      const response = await api.get(`/suppliers/${id}`);
      setSupplier(response.data.data);
    } catch (error) {
      toast.error('Failed to load application');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isValid(date)) {
        return format(date, 'do MMMM, yyyy');
      }
      return dateString;
    } catch (e) {
      return dateString;
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      draft: 'Draft',
      submitted: 'Pending Procurement Approval',
      pending_procurement: 'Pending Procurement Approval',
      pending_legal: 'Pending Legal Approval',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      more_info_required: 'Requested More Info'
    };
    return statusMap[status] || status;
  };

  const getApprovalStep = () => {
    if (!supplier) return 0;
    const statusMap = {
      draft: 0,
      submitted: 1,
      pending_procurement: 1,
      pending_legal: 2,
      under_review: 2,
      approved: 3,
      rejected: 0,
      more_info_required: 1,
    };
    return statusMap[supplier.status] || 0;
  };

  const approvalSteps = [
    { number: 1, title: 'Application Created', description: 'Your application has been submitted' },
    { number: 2, title: 'Procurement Review', description: 'Under review by procurement team' },
    { number: 3, title: 'Legal Review', description: 'Under review by legal team' },
    { number: 4, title: 'Approved', description: 'Application has been approved' },
  ];

  const activeStep = getApprovalStep();

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!supplier) {
    return (
      <Container maxWidth="lg">
        <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            No Application Found
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Application not found.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  // Map supplier data to formData-like structure for display
  const formData = {
    supplierName: supplier.supplierName || '',
    legalNature: supplier.legalNature || '',
    entityType: supplier.entityType || '',
    companyRegistrationNumber: supplier.companyRegistrationNumber || '',
    companyEmail: supplier.companyEmail || '',
    companyWebsite: supplier.companyWebsite || '',
    registeredCountry: supplier.registeredCountry || '',
    physicalAddress: supplier.physicalAddress || '',
    companyPhysicalAddress: supplier.companyPhysicalAddress || {},
    contactFullName: supplier.authorizedPerson?.name || '',
    contactRelationship: supplier.authorizedPerson?.relationship || '',
    contactIdPassport: supplier.authorizedPerson?.idPassportNumber || '',
    contactPhone: supplier.authorizedPerson?.phone || '',
    contactEmail: supplier.authorizedPerson?.email || '',
    bankName: supplier.bankName || '',
    accountNumber: supplier.accountNumber || supplier.bankAccountNumber || '',
    branch: supplier.branch || supplier.bankBranch || '',
    creditPeriod: supplier.creditPeriod || '',
    serviceTypes: supplier.serviceTypes || [],
    certificateOfIncorporation: supplier.certificateOfIncorporation || null,
    kraPinCertificate: supplier.kraPinCertificate || null,
    etimsProof: supplier.etimsProof || null,
    financialStatements: supplier.financialStatements || null,
    cr12: supplier.cr12 || null,
    companyProfile: supplier.companyProfile || null,
    bankReferenceLetter: supplier.bankReferenceLetter || null,
    directorsIds: supplier.directorsIds || [],
    practicingCertificates: supplier.practicingCertificates || [],
    keyMembersResumes: supplier.keyMembersResumes || [],
    sourceOfWealth: supplier.sourceOfWealth || '',
    declarantFullName: supplier.declarantFullName || '',
    declarantCapacity: supplier.declarantCapacity || '',
    declarantIdPassport: supplier.declarantIdPassport || '',
    declarationDate: supplier.declarationDate || '',
    declarationSignatureFile: supplier.declarationSignatureFile || null,
  };

  const handleViewFile = (file, fileName = '') => {
    if (!file) return;

    let fileUrl = null;
    let displayName = fileName || 'File';

    // If it's a File object (newly uploaded), create object URL
    if (file instanceof File) {
      fileUrl = URL.createObjectURL(file);
      displayName = file.name;
    } else if (typeof file === 'string') {
      // Check if it's already a full URL
      if (file.startsWith('http://') || file.startsWith('https://')) {
        fileUrl = file;
      } else {
        // Files are stored in uploads/supplierId/filename format
        // If the path already includes 'uploads/', use it directly
        if (file.startsWith('uploads/')) {
          fileUrl = `/${file}`;
        } else if (file.startsWith('./uploads/')) {
          fileUrl = file.replace('./uploads/', '/uploads/');
        } else {
          // If it's just a filename, construct the path with supplier ID
          // Files are stored in uploads/supplierId/filename format
          const supplierId = supplier?._id || id;
          if (supplierId) {
            fileUrl = `/uploads/${supplierId}/${file}`;
          } else {
            // Fallback: try without supplier ID (might work for some files)
            fileUrl = `/uploads/${file}`;
          }
        }
      }
      displayName = fileName || file.split('/').pop() || 'File';
    }

    if (fileUrl) {
      setFileViewerUrl(fileUrl);
      setFileViewerName(displayName);
      setImageLoadError(false);
      setFileViewerOpen(true);
    }
  };

  const handleCloseFileViewer = () => {
    // Clean up object URL if it was created from a File object
    if (fileViewerUrl && fileViewerUrl.startsWith('blob:')) {
      URL.revokeObjectURL(fileViewerUrl);
    }
    setFileViewerOpen(false);
    setFileViewerUrl(null);
    setFileViewerName('');
    setImageLoadError(false);
  };

  const renderDocumentCard = (fileName, documentName) => {
    if (!fileName) return null;
    const displayName = typeof fileName === 'string' ? fileName : 'File selected';
    const fileExtension = displayName.split('.').pop()?.toUpperCase() || 'PDF';

    return (
      <Box
        key={documentName}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          mb: 1,
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          backgroundColor: '#fff',
          '&:hover': {
            borderColor: '#d1d5db',
            backgroundColor: '#f9fafb'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
          <Box
            component="img"
            src="/images/File.svg"
            alt="File icon"
            sx={{ width: 24, height: 24, color: '#6b7280' }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '14px', color: '#374151', fontWeight: 500, mb: 0.25 }}>
              {documentName}
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#9ca3af' }}>
              {fileExtension} • 2.3 MB
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={() => handleViewFile(fileName, documentName)}
          sx={{
            color: '#6b7280',
            '&:hover': {
              backgroundColor: 'transparent',
              color: '#374151'
            }
          }}
        >
          <Box
            component="img"
            src="/images/eye.svg"
            alt="View icon"
            sx={{ width: 20, height: 20 }}
          />
        </IconButton>
      </Box>
    );
  };

  const renderMultipleDocumentCards = (files, documentName) => {
    if (!files || files.length === 0) return null;
    return files.map((file, index) => {
      const displayName = files.length > 1
        ? `${documentName} ${index + 1}`
        : (typeof file === 'string' ? file : documentName);
      const fileExtension = (typeof file === 'string' ? file : '').split('.').pop()?.toUpperCase() || 'PDF';

      return (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            mb: 1,
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            backgroundColor: '#fff',
            '&:hover': {
              borderColor: '#d1d5db',
              backgroundColor: '#f9fafb'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
            <Box
              component="img"
              src="/images/File.svg"
              alt="File icon"
              sx={{ width: 24, height: 24, color: '#6b7280' }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '14px', color: '#374151', fontWeight: 500, mb: 0.25 }}>
                {displayName}
              </Typography>
              <Typography sx={{ fontSize: '12px', color: '#9ca3af' }}>
                {fileExtension} • 2.3 MB
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => handleViewFile(file, displayName)}
            sx={{
              color: '#6b7280',
              '&:hover': {
                backgroundColor: 'transparent',
                color: '#374151'
              }
            }}
          >
            <Box
              component="img"
              src="/images/eye.svg"
              alt="View icon"
              sx={{ width: 20, height: 20 }}
            />
          </IconButton>
        </Box>
      );
    });
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
          Back to Dashboard
        </Button>

        {/* Approval Workflow Steps */}
        <Box sx={{ mb: 4 }}>
          {/* Mobile View */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', alignItems: 'center', mb: 3 }}>
            {approvalSteps.map((step, index) => (
              <Box key={step.number} sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: index <= activeStep ? theme.palette.green.main : 'transparent',
                    color: index <= activeStep ? '#fff' : theme.palette.green.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '16px',
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  {index < activeStep ? <Check sx={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }} /> : step.number}
                </Box>
                {index < approvalSteps.length - 1 && (
                  <Box
                    sx={{
                      width: 40,
                      height: '1px',
                      backgroundColor: '#e5e7eb',
                      mx: 2
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>

          {/* Desktop View */}
          <Grid container spacing={2} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {approvalSteps.map((step, index) => (
              <Grid item xs={3} key={step.number}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: index <= activeStep ? theme.palette.green.main : 'transparent',
                      color: index <= activeStep ? '#fff' : theme.palette.green.main,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '18px',
                      margin: '0 auto 8px',
                    }}
                  >
                    {index < activeStep ? <Check sx={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }} /> : step.number}
                  </Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#111827', mb: 0.5 }}>
                    {step.title}
                  </Typography>
                  <Typography sx={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.4 }}>
                    {step.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Application Details - Similar to Step 4 */}
        <Paper
          elevation={0}
          sx={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          {/* Basic Information Accordion */}
          <Accordion
            expanded={expandedAccordion === 'basicInformation'}
            onChange={(event, isExpanded) => {
              setExpandedAccordion(isExpanded ? 'basicInformation' : '');
            }}
            sx={{
              boxShadow: 'none',
              border: 'none',
              borderBottom: '1px solid #e5e7eb',
              borderRadius: 0,
              '&:before': { display: 'none' },
              '&.Mui-expanded': {
                margin: 0
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore sx={{ color: '#6b7280' }} />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  my: 2
                }
              }}
            >
              <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#111827' }}>
                Basic Information
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Supplier Name
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.supplierName || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Legal Nature
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.legalNature || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Entity Type
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.entityType || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Company Registration Number
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.companyRegistrationNumber || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Company Email
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.companyEmail || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Company Website
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.companyWebsite || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Registered Country
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.registeredCountry || '-'}
                  </Typography>
                </Grid>
                {/* Physical Address */}
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Physical Address
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.companyPhysicalAddress?.street || formData.physicalAddress || '-'}
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Contact Details Accordion */}
          <Accordion
            expanded={expandedAccordion === 'contactDetails'}
            onChange={(event, isExpanded) => {
              setExpandedAccordion(isExpanded ? 'contactDetails' : '');
            }}
            sx={{
              boxShadow: 'none',
              border: 'none',
              borderBottom: '1px solid #e5e7eb',
              borderRadius: 0,
              '&:before': { display: 'none' },
              '&.Mui-expanded': {
                margin: 0
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore sx={{ color: '#6b7280' }} />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  my: 2
                }
              }}
            >
              <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#111827' }}>
                Contact Details
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Full Name
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.contactFullName || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Relationship
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.contactRelationship || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    ID/Passport Number
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.contactIdPassport || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Phone
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.contactPhone || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Email
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.contactEmail || '-'}
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Payment Details Accordion */}
          <Accordion
            expanded={expandedAccordion === 'paymentDetails'}
            onChange={(event, isExpanded) => {
              setExpandedAccordion(isExpanded ? 'paymentDetails' : '');
            }}
            sx={{
              boxShadow: 'none',
              border: 'none',
              borderBottom: '1px solid #e5e7eb',
              borderRadius: 0,
              '&:before': { display: 'none' },
              '&.Mui-expanded': {
                margin: 0
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore sx={{ color: '#6b7280' }} />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  my: 2
                }
              }}
            >
              <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#111827' }}>
                Payment Details
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Bank Name
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.bankName || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Account Number
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.accountNumber || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Branch
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.branch || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Applicable Credit Period
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.creditPeriod ? `${formData.creditPeriod} Days` : '-'}
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Entity Details Accordion */}
          <Accordion
            expanded={expandedAccordion === 'entityDetails'}
            onChange={(event, isExpanded) => {
              setExpandedAccordion(isExpanded ? 'entityDetails' : '');
            }}
            sx={{
              boxShadow: 'none',
              border: 'none',
              borderBottom: '1px solid #e5e7eb',
              borderRadius: 0,
              '&:before': { display: 'none' },
              '&.Mui-expanded': {
                margin: 0
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore sx={{ color: '#6b7280' }} />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  my: 2
                }
              }}
            >
              <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#111827' }}>
                Entity Details
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                {renderDocumentCard(formData.certificateOfIncorporation, 'Certificate of Incorporation')}
                {renderDocumentCard(formData.kraPinCertificate, 'KRA PIN Certificate')}
                {renderDocumentCard(formData.etimsProof, 'Proof of registration on e-TIMS')}
                {renderDocumentCard(formData.financialStatements, 'Financial Statements')}
                {renderDocumentCard(formData.cr12, 'Valid CR12')}
                {renderDocumentCard(formData.companyProfile, 'Firm Company Profile')}
                {renderDocumentCard(formData.bankReferenceLetter, 'Bank reference letter')}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Service Details Accordion */}
          <Accordion
            expanded={expandedAccordion === 'serviceDetails'}
            onChange={(event, isExpanded) => {
              setExpandedAccordion(isExpanded ? 'serviceDetails' : '');
            }}
            sx={{
              boxShadow: 'none',
              border: 'none',
              borderBottom: '1px solid #e5e7eb',
              borderRadius: 0,
              '&:before': { display: 'none' },
              '&.Mui-expanded': {
                margin: 0
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore sx={{ color: '#6b7280' }} />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  my: 2
                }
              }}
            >
              <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#111827' }}>
                Service Details
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                {renderMultipleDocumentCards(formData.practicingCertificates, 'Practicing Certificate')}
                {renderMultipleDocumentCards(formData.keyMembersResumes, 'Resume')}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Source of Funds Declaration Accordion */}
          <Accordion
            expanded={expandedAccordion === 'sourceOfFunds'}
            onChange={(event, isExpanded) => {
              setExpandedAccordion(isExpanded ? 'sourceOfFunds' : '');
            }}
            sx={{
              boxShadow: 'none',
              border: 'none',
              borderBottom: '1px solid #e5e7eb',
              borderRadius: 0,
              '&:before': { display: 'none' },
              '&.Mui-expanded': {
                margin: 0
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore sx={{ color: '#6b7280' }} />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  my: 2
                }
              }}
            >
              <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#111827' }}>
                Source of Funds Declaration
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Source of wealth/Funds
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.sourceOfWealth || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Full Name of Declarant
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.declarantFullName || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Capacity
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.declarantCapacity || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    ID/Passport Number
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.declarantIdPassport || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Date
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formatDate(formData.declarationDate)}
                  </Typography>
                </Grid>
                {formData.declarationSignatureFile && (
                  <Grid item xs={12}>
                    {renderDocumentCard(formData.declarationSignatureFile, 'Signature File')}
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Personal Information Processing Consent Accordion */}
          <Accordion
            expanded={expandedAccordion === 'consent'}
            onChange={(event, isExpanded) => {
              setExpandedAccordion(isExpanded ? 'consent' : '');
            }}
            sx={{
              boxShadow: 'none',
              border: 'none',
              borderBottom: '1px solid #e5e7eb',
              borderRadius: 0,
              '&:before': { display: 'none' },
              '&.Mui-expanded': {
                margin: 0
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore sx={{ color: '#6b7280' }} />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  my: 2
                }
              }}
            >
              <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#111827' }}>
                Personal Information Processing Consent
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Full Name of Declarant
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formData.declarantFullName || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                    Date
                  </Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                    {formatDate(formData.declarationDate)}
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Signed Contract Accordion */}
          {supplier.status === 'completed' && supplier.contract && supplier.contract.signedContract && (
            <Accordion
              expanded={expandedAccordion === 'contract'}
              onChange={(event, isExpanded) => {
                setExpandedAccordion(isExpanded ? 'contract' : '');
              }}
              sx={{
                boxShadow: 'none',
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                borderRadius: 0,
                '&:before': { display: 'none' },
                '&.Mui-expanded': {
                  margin: 0
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: '#6b7280' }} />}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    my: 2
                  }
                }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#111827' }}>
                  Signed Contract
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Grid container spacing={2.5} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                        Contract Number
                      </Typography>
                      <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                        {supplier.contract.contractNumber || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                        Start Date
                      </Typography>
                      <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                        {formatDate(supplier.contract.startDate)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                        Expiry Date
                      </Typography>
                      <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                        {formatDate(supplier.contract.endDate)}
                      </Typography>
                    </Grid>
                  </Grid>
                  {renderDocumentCard(
                    supplier.contract.signedContract.filePath || supplier.contract.signedContract.fileName,
                    'Signed Contract - ' + (supplier.contract.contractNumber || '')
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Approval History Accordion */}
          <Accordion
            expanded={expandedAccordion === 'approvalHistory'}
            onChange={(event, isExpanded) => {
              setExpandedAccordion(isExpanded ? 'approvalHistory' : '');
            }}
            sx={{
              boxShadow: 'none',
              border: 'none',
              borderRadius: 0,
              '&:before': { display: 'none' },
              '&.Mui-expanded': {
                margin: 0
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore sx={{ color: '#6b7280' }} />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  my: 2
                }
              }}
            >
              <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#111827' }}>
                Approval History
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {supplier.approvalHistory && supplier.approvalHistory.length > 0 ? (
                <Box>
                  {supplier.approvalHistory.map((history, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        mb: 2,
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        backgroundColor: '#fff'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>
                          {history.action || 'Status Update'}
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: '#6b7280' }}>
                          {formatDate(history.timestamp || history.date)}
                        </Typography>
                      </Box>
                      {history.approver && (
                        <Typography sx={{ fontSize: '13px', color: '#6b7280', mb: 1 }}>
                          By: {history.approver?.firstName || ''} {history.approver?.lastName || ''} ({history.approver?.role || ''})
                        </Typography>
                      )}
                      {history.comments && (
                        <Typography sx={{ fontSize: '13px', color: '#374151', mt: 1 }}>
                          {history.comments}
                        </Typography>
                      )}
                      {history.status && (
                        <Chip
                          label={getStatusLabel(history.status)}
                          size="small"
                          sx={{
                            mt: 1,
                            backgroundColor: '#f3f4f6',
                            color: '#6b7280',
                            fontSize: '12px',
                            height: '24px'
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography sx={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', py: 2 }}>
                  No approval history available yet
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Paper>
      </Container>

      {/* File Viewer Modal */}
      <Dialog
        open={fileViewerOpen}
        onClose={handleCloseFileViewer}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            borderRadius: '8px',
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{fileViewerName}</Typography>
          <IconButton onClick={handleCloseFileViewer} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', backgroundColor: '#f5f5f5' }}>
          {fileViewerUrl && (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
              {fileViewerUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                imageLoadError ? (
                  <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Image could not be loaded</Typography>
                    <Button
                      variant="contained"
                      onClick={() => window.open(fileViewerUrl, '_blank')}
                      sx={{ mt: 2 }}
                    >
                      Open in New Tab
                    </Button>
                  </Box>
                ) : (
                  <img
                    src={fileViewerUrl}
                    alt={fileViewerName}
                    style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                    onError={() => setImageLoadError(true)}
                  />
                )
              ) : fileViewerUrl.match(/\.(pdf)$/i) ? (
                <iframe
                  src={fileViewerUrl}
                  title={fileViewerName}
                  style={{ width: '100%', height: '70vh', border: 'none' }}
                />
              ) : (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>File Preview Not Available</Typography>
                  <Button
                    variant="contained"
                    onClick={() => window.open(fileViewerUrl, '_blank')}
                    sx={{ mt: 2 }}
                  >
                    Open in New Tab
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFileViewer}>Close</Button>
          {fileViewerUrl && (
            <Button
              variant="contained"
              onClick={() => window.open(fileViewerUrl, '_blank')}
            >
              Open in New Tab
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationStatus;
