import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
} from '@mui/material';
import {
  Check,
  Close,
  ChatBubbleOutline,
  ExpandMore,
  ChevronRight,
  ChevronLeft,
  History,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import api, { API_BASE_URL } from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import ActionModal from '../../components/ActionModal/ActionModal';

const SupplierDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '' });
  const [comments, setComments] = useState('');
  const [expanded, setExpanded] = useState(['basicInformation']);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [fileViewerUrl, setFileViewerUrl] = useState(null);
  const [fileViewerName, setFileViewerName] = useState('');


  useEffect(() => {
    fetchSupplier();
  }, [id]);

  const fetchSupplier = async () => {
    try {
      const response = await api.get(`/suppliers/${id}`);
      const supplierData = response.data.data;
      setSupplier(supplierData);
    } catch (error) {
      toast.error('Failed to load supplier details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatApplicationId = (id, createdAt) => {
    if (!id) return 'APP-2025-001';
    const year = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
    // Extract last 3 digits or use a sequential number
    const shortId = id.toString().slice(-3).padStart(3, '0');
    return `APP-${year}-${shortId}`;
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      draft: 'Draft',
      submitted: 'Pending Approval',
      pending_procurement: 'Pending Approval',
      pending_legal: 'Pending Legal Approval',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      more_info_required: 'Requested More Info',
    };
    return statusMap[status] || status;
  };


  const formatLegalNature = (legalNature) => {
    const map = {
      'state_owned': 'State-Owned',
      'ngo': 'NGO',
      'foundation': 'Foundation',
      'association': 'Association',
      'company': 'Company',
      'partnership': 'Partnership',
      'foreign_company': 'Foreign Company',
      'individual': 'Individual',
      'trust': 'Trust',
      'other': 'Other',
    };
    return map[legalNature] || legalNature;
  };

  const formatServiceType = (serviceType) => {
    if (!serviceType) return '-';

    // Handle array (if serviceTypes is an array)
    if (Array.isArray(serviceType) && serviceType.length > 0) {
      return serviceType[0]; // Return first item if it's an array
    }

    // Map enum values to display names
    const map = {
      'professional_services': 'Professional Services',
      'digital_services': 'Digital Services',
      'physical_goods': 'Physical Goods',
      'other': 'Other',
      // Also handle direct string values from serviceTypes field
      'Professional Services': 'Professional Services',
      'Goods Supply': 'Goods Supply',
      'Services': 'Services',
      'Consultancy': 'Consultancy',
      'Construction': 'Construction',
      'IT Services': 'IT Services',
      'Maintenance & Repair': 'Maintenance & Repair',
    };

    if (map[serviceType]) {
      return map[serviceType];
    }

    // If it's already a formatted string (doesn't contain underscore)
    if (typeof serviceType === 'string' && !serviceType.includes('_')) {
      return serviceType;
    }

    // Fallback: format the enum value
    return serviceType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatAddress = (address) => {
    if (!address) return '-';
    if (typeof address === 'string') return address;
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.country) parts.push(address.country);
    if (address.postalCode) parts.push(address.postalCode);
    return parts.length > 0 ? parts.join(', ') : '-';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDocumentType = (type) => {
    const map = {
      'certificate_of_incorporation': 'Certificate of Incorporation',
      'cr12': 'CR12',
      'pin_certificate': 'KRA Pin Certificate',
      'company_profile': 'Company Profile',
      'bank_reference': 'Bank Reference Letter',
      'etims_registration': 'Proof of registration on E-tims',
      'practicing_certificate': 'Practicing Certificate',
      'member_resume': 'Resume',
      'directors_id': 'Directors ID',
      'audited_financials': 'Audited Financial Statements',
    };
    return map[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleViewFile = (document) => {
    let url;
    let fileName = document.originalName || document.fileName || 'Document';

    // If document has _id and starts with 'doc-', it's a fallback document (filename string)
    if (document._id && (document._id.startsWith('doc-') || document._id.startsWith('practicing-') || document._id.startsWith('resume-'))) {
      // It's a filename string, construct URL
      const filePath = document.fileName || document.originalName;
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        url = filePath;
      } else if (filePath.startsWith('uploads/')) {
        url = `${API_BASE_URL}/${filePath}`;
      } else {
        url = `${API_BASE_URL}/uploads/${id}/${filePath}`;
      }
    } else {
      // It's a proper document object from API
      url = `${API_BASE_URL}/api/documents/${document._id}/download`;
    }

    setFileViewerUrl(url);
    setFileViewerName(fileName);
    setFileViewerOpen(true);
  };

  const handleDownloadFile = (document) => {
    let url;

    // If document has _id and starts with 'doc-', it's a fallback document (filename string)
    if (document._id && (document._id.startsWith('doc-') || document._id.startsWith('practicing-') || document._id.startsWith('resume-'))) {
      // It's a filename string, construct URL
      const filePath = document.fileName || document.originalName;
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        url = filePath;
      } else if (filePath.startsWith('uploads/')) {
        url = `${API_BASE_URL}/${filePath}`;
      } else {
        url = `${API_BASE_URL}/uploads/${id}/${filePath}`;
      }
    } else {
      // It's a proper document object from API
      url = `${API_BASE_URL}/api/documents/${document._id}/download`;
    }

    window.open(url, '_blank');
  };

  const getEntityDocuments = () => {
    if (!supplier) return [];

    const entityDocs = [];

    // First try documents array (from API)
    if (supplier.documents && Array.isArray(supplier.documents) && supplier.documents.length > 0) {
      const apiDocs = supplier.documents.filter(doc =>
        ['certificate_of_incorporation', 'cr12', 'pin_certificate', 'company_profile', 'bank_reference', 'etims_registration', 'directors_id', 'audited_financials'].includes(doc.documentType)
      );
      if (apiDocs.length > 0) {
        return apiDocs;
      }
    }

    // Fallback: check for filename fields directly on supplier object
    const docMap = {
      certificateOfIncorporation: { type: 'certificate_of_incorporation', name: 'Certificate of Incorporation' },
      cr12: { type: 'cr12', name: 'CR12' },
      kraPinCertificate: { type: 'pin_certificate', name: 'KRA Pin Certificate' },
      companyProfile: { type: 'company_profile', name: 'Company Profile' },
      bankReferenceLetter: { type: 'bank_reference', name: 'Bank Reference Letter' },
      etimsProof: { type: 'etims_registration', name: 'Proof of registration on E-tims' },
      financialStatements: { type: 'audited_financials', name: 'Audited Financial Statements' },
    };

    Object.keys(docMap).forEach(key => {
      if (supplier[key]) {
        const fileName = typeof supplier[key] === 'string' ? supplier[key] : '';
        if (fileName) {
          entityDocs.push({
            _id: `doc-${key}`,
            documentType: docMap[key].type,
            originalName: docMap[key].name,
            fileSize: 2400000, // Default 2.3 MB
            fileName: fileName,
          });
        }
      }
    });

    return entityDocs;
  };

  const getServiceDocuments = () => {
    if (!supplier) return [];

    const serviceDocs = [];

    // First try documents array (from API)
    if (supplier.documents && Array.isArray(supplier.documents) && supplier.documents.length > 0) {
      const apiDocs = supplier.documents.filter(doc =>
        ['practicing_certificate', 'member_resume'].includes(doc.documentType)
      );
      if (apiDocs.length > 0) {
        return apiDocs;
      }
    }

    // Fallback: check for filename arrays directly on supplier object
    // Practicing certificates
    if (supplier.practicingCertificates && Array.isArray(supplier.practicingCertificates)) {
      supplier.practicingCertificates.forEach((file, index) => {
        const fileName = typeof file === 'string' ? file : '';
        if (fileName) {
          serviceDocs.push({
            _id: `practicing-${index}`,
            documentType: 'practicing_certificate',
            originalName: 'Practicing Certificate',
            fileSize: 2400000, // Default 2.3 MB
            fileName: fileName,
          });
        }
      });
    }

    // Resumes
    if (supplier.keyMembersResumes && Array.isArray(supplier.keyMembersResumes)) {
      supplier.keyMembersResumes.forEach((file, index) => {
        const fileName = typeof file === 'string' ? file : '';
        if (fileName) {
          serviceDocs.push({
            _id: `resume-${index}`,
            documentType: 'member_resume',
            originalName: `Resume ${index + 1}`,
            fileSize: 2400000, // Default 2.3 MB
            fileName: fileName,
          });
        }
      });
    }

    return serviceDocs;
  };

  const handleApprove = async () => {
    try {
      await api.post(`/approvals/${id}/approve`, { comments });
      toast.success('Application approved successfully');
      setActionDialog({ open: false, type: '' });
      setComments('');
      fetchSupplier();
      navigate('/tasks');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!comments.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    try {
      await api.post(`/approvals/${id}/reject`, { comments });
      toast.success('Application rejected');
      setActionDialog({ open: false, type: '' });
      setComments('');
      fetchSupplier();
      navigate('/tasks');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject');
    }
  };

  const handleRequestInfo = async () => {
    if (!comments.trim()) {
      toast.error('Please specify what information is needed');
      return;
    }
    try {
      await api.post(`/approvals/${id}/request-info`, { comments });
      toast.success('Information request sent');
      setActionDialog({ open: false, type: '' });
      setComments('');
      fetchSupplier();
      navigate('/tasks');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request info');
    }
  };



  const canApprove = () => {
    if (!supplier) return false;
    if (user.role === 'procurement') {
      return ['submitted', 'pending_procurement', 'more_info_required'].includes(supplier.status);
    }
    if (user.role === 'legal') {
      return supplier.status === 'pending_legal';
    }
    return false;
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded((prevExpanded) => {
      if (isExpanded) {
        // Add panel to expanded array if not already present
        return prevExpanded.includes(panel) ? prevExpanded : [...prevExpanded, panel];
      } else {
        // Remove panel from expanded array
        return prevExpanded.filter((p) => p !== panel);
      }
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!supplier) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">Supplier not found</Typography>
      </Box>
    );
  }

  const applicationId = formatApplicationId(supplier._id, supplier.createdAt);
  const statusLabel = getStatusLabel(supplier.status);
  const showActions = canApprove();


  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#fff',
      p: { xs: 0, sm: 3, md: 4 },
    }}>
      {/* Application Header */}
      <Box sx={{
        mb: 3,
        px: { xs: 2, sm: 0 },
        pt: { xs: 2, sm: 0 },
      }}>
        {/* Mobile: Back button and header */}
        <Box sx={{
          display: { xs: 'flex', sm: 'none' },
          alignItems: 'center',
          gap: 1,
          mb: 2,
        }}>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              color: '#111827',
              p: 1,
            }}
          >
            <ChevronLeft />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '18px',
              color: '#111827',
              flex: 1,
            }}
          >
            {applicationId}
          </Typography>
          <Chip
            label={statusLabel}
            sx={{
              bgcolor: '#f3f4f6',
              color: '#374151',
              fontSize: '12px',
              fontWeight: 500,
              height: '24px',
              borderRadius: '12px',
              '& .MuiChip-label': {
                px: 1.5,
              },
            }}
          />
        </Box>

        {/* Desktop: Application ID and Status */}
        <Box sx={{
          display: { xs: 'none', sm: 'flex' },
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 2,
          flexWrap: 'wrap',
          gap: 2
        }}>
          {/* Left side - Application ID and Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                fontSize: '20px',
                color: '#111827',
              }}
            >
              {applicationId}
            </Typography>
            <Chip
              label={statusLabel}
              sx={{
                bgcolor: '#f3f4f6',
                color: '#374151',
                fontSize: '12px',
                fontWeight: 500,
                height: '24px',
                borderRadius: '12px',
                '& .MuiChip-label': {
                  px: 1.5,
                },
              }}
            />
          </Box>

          {/* Right side - Action Buttons (Desktop only) */}
          {showActions && (
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<Check sx={{ color: '#fff' }} />}
                onClick={() => setActionDialog({ open: true, type: 'approve' })}
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
                  '& .MuiSvgIcon-root': {
                    color: '#fff',
                  },
                }}
              >
                Approve Application
              </Button>
              <Button
                variant="contained"
                startIcon={<Close />}
                onClick={() => setActionDialog({ open: true, type: 'reject' })}
                sx={{
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  px: 3,
                  py: 1,
                  borderRadius: '6px',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#dc2626',
                    boxShadow: 'none',
                  },
                }}
              >
                Reject Application
              </Button>
              <Button
                variant="outlined"
                startIcon={<ChatBubbleOutline />}
                onClick={() => setActionDialog({ open: true, type: 'request_info' })}
                sx={{
                  borderColor: '#d1d5db',
                  color: '#374151',
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  px: 3,
                  py: 1,
                  borderRadius: '6px',
                  bgcolor: '#fff',
                  '&:hover': {
                    borderColor: '#9ca3af',
                    bgcolor: '#f9fafb',
                  },
                }}
              >
                Request More Information
              </Button>
            </Box>
          )}
        </Box>

        {/* New Application Tag - Hidden on mobile (shown in Basic Information) */}
        <Chip
          label="New Application"
          sx={{
            display: { xs: 'none', sm: 'inline-flex' },
            bgcolor: '#f3f4f6',
            color: '#374151',
            fontSize: '12px',
            fontWeight: 400,
            height: '24px',
            borderRadius: '12px',
            '& .MuiChip-label': {
              px: 1.5,
            },
          }}
        />
      </Box>

      {/* Main Content Grid */}
      <Grid container spacing={3} sx={{ maxWidth: '1400px', mx: 'auto' }}>
        {/* Left Side - Application Details */}
        <Grid item xs={12} md={12}>
          <Box sx={{
            border: '1px solid #e5e7eb',
            borderRadius: { xs: 0, sm: '8px' },
            overflow: 'hidden',
          }}>
            {/* Basic Information */}
            <Accordion
              expanded={expanded.includes('basicInformation')}
              onChange={handleAccordionChange('basicInformation')}
              sx={{
                boxShadow: 'none',
                border: 'none',
                borderRadius: '0 !important',
                mb: 0,
                '&:before': { display: 'none' },
                '&.Mui-expanded': {
                  margin: 0,
                },
              }}
            >
              <AccordionSummary
                expandIcon={
                  expanded.includes('basicInformation') ? (
                    <ExpandMore sx={{ color: '#6b7280' }} />
                  ) : (
                    <ChevronRight sx={{ color: '#6b7280' }} />
                  )
                }
                sx={{
                  px: { xs: 2, sm: 3 },
                  py: 2,
                  minHeight: '56px',
                  '&.Mui-expanded': {
                    minHeight: '56px',
                    borderBottom: 'none',
                    pb: 2,
                  },
                  '& .MuiAccordionSummary-content': {
                    my: 0,
                  },
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: { xs: '16px', sm: '24px' },
                    right: { xs: '16px', sm: '24px' },
                    height: '1px',
                    backgroundColor: '#e5e7eb',
                    zIndex: 1,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#111827',
                  }}
                >
                  Basic Information
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
                {/* Request Type - Mobile only */}
                <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 3 }}>
                  <Typography
                    sx={{
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: 500,
                      mb: 0.5,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Request Type
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      color: '#111827',
                      fontWeight: 400,
                    }}
                  >
                    New Application
                  </Typography>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Supplier Name
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#111827',
                        fontWeight: 400,
                      }}
                    >
                      {supplier.supplierName || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Registered Country
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#111827',
                        fontWeight: 400,
                      }}
                    >
                      {supplier.companyPhysicalAddress?.country || supplier.registeredCountry || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Company Registration Number
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#111827',
                        fontWeight: 400,
                      }}
                    >
                      {supplier.companyRegistrationNumber || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Company Email Address
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#111827',
                        fontWeight: 400,
                      }}
                    >
                      {supplier.companyEmail || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Company Website
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#111827',
                        fontWeight: 400,
                      }}
                    >
                      {supplier.companyWebsite || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Legal Nature of Entity
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#111827',
                        fontWeight: 400,
                      }}
                    >
                      {formatLegalNature(supplier.legalNature) || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Physical Address
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#111827',
                        fontWeight: 400,
                      }}
                    >
                      {formatAddress(supplier.companyPhysicalAddress) || supplier.physicalAddress || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>


            {/* Contact Details */}
            <Accordion
              expanded={expanded.includes('contactDetails')}
              onChange={handleAccordionChange('contactDetails')}
              sx={{
                boxShadow: 'none',
                border: 'none',
                borderRadius: '0 !important',
                mb: 0,
                '&:before': { display: 'none' },
                '&.Mui-expanded': {
                  margin: 0,
                },
              }}
            >
              <AccordionSummary
                expandIcon={
                  expanded.includes('contactDetails') ? (
                    <ExpandMore sx={{ color: '#6b7280' }} />
                  ) : (
                    <ChevronRight sx={{ color: '#6b7280' }} />
                  )
                }
                sx={{
                  px: { xs: 2, sm: 3 },
                  py: 2,
                  minHeight: '56px',
                  '&.Mui-expanded': {
                    minHeight: '56px',
                    borderBottom: 'none',
                    pb: 2,
                  },
                  '& .MuiAccordionSummary-content': {
                    my: 0,
                  },
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: { xs: '16px', sm: '24px' },
                    right: { xs: '16px', sm: '24px' },
                    height: '1px',
                    backgroundColor: '#e5e7eb',
                    zIndex: 1,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#111827',
                  }}
                >
                  Contact Details
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Full Name
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#111827',
                        fontWeight: 400,
                      }}
                    >
                      {supplier.authorizedPerson?.name || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Relationship
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#111827',
                        fontWeight: 400,
                      }}
                    >
                      {supplier.authorizedPerson?.relationship || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Email
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#111827',
                        fontWeight: 400,
                      }}
                    >
                      {supplier.authorizedPerson?.email || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Phone
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#111827',
                        fontWeight: 400,
                      }}
                    >
                      {supplier.authorizedPerson?.phone || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      ID/Passport Number
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#111827',
                        fontWeight: 400,
                      }}
                    >
                      {supplier.authorizedPerson?.idPassportNumber || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Entity Details */}
            <Accordion
              expanded={expanded.includes('entityDetails')}
              onChange={handleAccordionChange('entityDetails')}
              sx={{
                boxShadow: 'none',
                border: 'none',
                borderRadius: '0 !important',
                mb: 0,
                '&:before': { display: 'none' },
                '&.Mui-expanded': {
                  margin: 0,
                },
              }}
            >
              <AccordionSummary
                expandIcon={
                  expanded.includes('entityDetails') ? (
                    <ExpandMore sx={{ color: '#6b7280' }} />
                  ) : (
                    <ChevronRight sx={{ color: '#6b7280' }} />
                  )
                }
                sx={{
                  px: { xs: 2, sm: 3 },
                  py: 2,
                  minHeight: '56px',
                  '&.Mui-expanded': {
                    minHeight: '56px',
                    borderBottom: 'none',
                    pb: 2,
                  },
                  '& .MuiAccordionSummary-content': {
                    my: 0,
                  },
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: { xs: '16px', sm: '24px' },
                    right: { xs: '16px', sm: '24px' },
                    height: '1px',
                    backgroundColor: '#e5e7eb',
                    zIndex: 1,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#111827',
                  }}
                >
                  Entity Details
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Entity Type
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#111827',
                        fontWeight: 400,
                        mb: 3,
                      }}
                    >
                      {supplier.entityType ? supplier.entityType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Entity Documents Section */}
                {getEntityDocuments().length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 2,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Attached Documents
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {getEntityDocuments().map((doc) => (
                        <Box
                          key={doc._id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            p: 1.5,
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            bgcolor: '#fff',
                          }}
                        >
                          <Box
                            component="img"
                            src="/images/File.svg"
                            alt="File icon"
                            sx={{ width: 24, height: 24 }}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontSize: '14px',
                                color: '#111827',
                                fontWeight: 400,
                                mb: 0.5,
                              }}
                            >
                              {formatDocumentType(doc.documentType)}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: '12px',
                                color: '#6b7280',
                                fontWeight: 400,
                              }}
                            >
                              PDF • {formatFileSize(doc.fileSize)}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handleViewFile(doc)}
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
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadFile(doc)}
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
                              src="/images/Download.svg"
                              alt="Download icon"
                              sx={{ width: 20, height: 20 }}
                            />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Types of Services Being Offered Section */}
                <Box sx={{ mt: 4 }}>
                  <Typography
                    sx={{
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: 500,
                      mb: 0.5,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Types of Services Being Offered
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      color: '#111827',
                      fontWeight: 400,
                      mb: 3,
                    }}
                  >
                    {formatServiceType(supplier.serviceTypes || supplier.serviceType)}
                  </Typography>
                </Box>

                {/* Service Documents Section */}
                {getServiceDocuments().length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 2,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Attached Documents
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {getServiceDocuments().map((doc, index) => (
                        <Box
                          key={doc._id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            p: 1.5,
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            bgcolor: '#fff',
                          }}
                        >
                          <Box
                            component="img"
                            src="/images/File.svg"
                            alt="File icon"
                            sx={{ width: 24, height: 24 }}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontSize: '14px',
                                color: '#111827',
                                fontWeight: 400,
                                mb: 0.5,
                              }}
                            >
                              {doc.documentType === 'member_resume'
                                ? `Resume ${getServiceDocuments().filter(d => d.documentType === 'member_resume').indexOf(doc) + 1}`
                                : formatDocumentType(doc.documentType)}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: '12px',
                                color: '#6b7280',
                                fontWeight: 400,
                              }}
                            >
                              PDF • {formatFileSize(doc.fileSize)}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handleViewFile(doc)}
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
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadFile(doc)}
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
                              src="/images/Download.svg"
                              alt="Download icon"
                              sx={{ width: 20, height: 20 }}
                            />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Source of Funds Declaration */}
            <Accordion
              expanded={expanded.includes('sourceOfFunds')}
              onChange={handleAccordionChange('sourceOfFunds')}
              sx={{
                boxShadow: 'none',
                border: 'none',
                borderRadius: '0 !important',
                mb: 0,
                '&:before': { display: 'none' },
                '&.Mui-expanded': {
                  margin: 0,
                },
              }}
            >
              <AccordionSummary
                expandIcon={
                  expanded.includes('sourceOfFunds') ? (
                    <ExpandMore sx={{ color: '#6b7280' }} />
                  ) : (
                    <ChevronRight sx={{ color: '#6b7280' }} />
                  )
                }
                sx={{
                  px: { xs: 2, sm: 3 },
                  py: 2,
                  minHeight: '56px',
                  '&.Mui-expanded': {
                    minHeight: '56px',
                    borderBottom: 'none',
                    pb: 2,
                  },
                  '& .MuiAccordionSummary-content': {
                    my: 0,
                  },
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: { xs: '16px', sm: '24px' },
                    right: { xs: '16px', sm: '24px' },
                    height: '1px',
                    backgroundColor: '#e5e7eb',
                    zIndex: 1,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#111827',
                  }}
                >
                  Source of Funds Declaration
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Source of Wealth
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#111827',
                        fontWeight: 400,
                      }}
                    >
                      {supplier.sourceOfFunds?.source ? supplier.sourceOfFunds.source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : supplier.sourceOfWealth || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Declarant Full Name
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#111827',
                        fontWeight: 400,
                      }}
                    >
                      {supplier.sourceOfFunds?.declarantName || supplier.declarantFullName || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Declarant Capacity
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#111827',
                        fontWeight: 400,
                      }}
                    >
                      {supplier.sourceOfFunds?.declarantCapacity || supplier.declarantCapacity || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      ID/Passport Number
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#111827',
                        fontWeight: 400,
                      }}
                    >
                      {supplier.sourceOfFunds?.declarantIdPassport || supplier.declarantIdPassport || '-'}
                    </Typography>
                  </Grid>
                  {supplier.sourceOfFunds?.declarationDate && (
                    <Grid item xs={12} sm={4}>
                      <Typography
                        sx={{
                          fontSize: '12px',
                          color: '#6b7280',
                          fontWeight: 500,
                          mb: 0.5,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Declaration Date
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          color: '#111827',
                          fontWeight: 400,
                        }}
                      >
                        {new Date(supplier.sourceOfFunds.declarationDate).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Personal Information Processing Consent */}
            <Accordion
              expanded={expanded.includes('dataConsent')}
              onChange={handleAccordionChange('dataConsent')}
              sx={{
                boxShadow: 'none',
                border: 'none',
                borderRadius: '0 !important',
                mb: 0,
                '&:before': { display: 'none' },
                '&.Mui-expanded': {
                  margin: 0,
                },
              }}
            >
              <AccordionSummary
                expandIcon={
                  expanded.includes('dataConsent') ? (
                    <ExpandMore sx={{ color: '#6b7280' }} />
                  ) : (
                    <ChevronRight sx={{ color: '#6b7280' }} />
                  )
                }
                sx={{
                  px: { xs: 2, sm: 3 },
                  py: 2,
                  minHeight: '56px',
                  '&.Mui-expanded': {
                    minHeight: '56px',
                    borderBottom: 'none',
                    pb: 2,
                  },
                  '& .MuiAccordionSummary-content': {
                    my: 0,
                  },
                  position: 'relative',
                  '&.Mui-expanded::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: { xs: '16px', sm: '24px' },
                    right: { xs: '16px', sm: '24px' },
                    height: '1px',
                    backgroundColor: '#e5e7eb',
                    zIndex: 1,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#111827',
                  }}
                >
                  Personal Information Processing Consent
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Full Name of Declarant
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#111827',
                        fontWeight: 400,
                      }}
                    >
                      {supplier.declarantFullName || supplier.dataProcessingConsent?.consentorName || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Date
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: '#111827',
                        fontWeight: 400,
                      }}
                    >
                      {supplier.declarationDate
                        ? (() => {
                          const date = new Date(supplier.declarationDate);
                          const day = date.getDate();
                          const month = date.toLocaleDateString('en-GB', { month: 'long' });
                          const year = date.getFullYear();
                          const daySuffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
                          return `${day}${daySuffix} ${month}, ${year}`;
                        })()
                        : (supplier.dataProcessingConsent?.consentDate
                          ? (() => {
                            const date = new Date(supplier.dataProcessingConsent.consentDate);
                            const day = date.getDate();
                            const month = date.toLocaleDateString('en-GB', { month: 'long' });
                            const year = date.getFullYear();
                            const daySuffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
                            return `${day}${daySuffix} ${month}, ${year}`;
                          })()
                          : '-')}
                    </Typography>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Approval History */}
            {supplier.approvalHistory && supplier.approvalHistory.length > 0 && (
              <Accordion
                expanded={expanded.includes('approvalHistory')}
                onChange={handleAccordionChange('approvalHistory')}
                sx={{
                  boxShadow: 'none',
                  border: 'none',
                  borderRadius: '0 !important',
                  mb: 0,
                  '&:before': { display: 'none' },
                  '&.Mui-expanded': {
                    margin: 0,
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={
                    expanded.includes('approvalHistory') ? (
                      <ExpandMore sx={{ color: '#6b7280' }} />
                    ) : (
                      <ChevronRight sx={{ color: '#6b7280' }} />
                    )
                  }
                  sx={{
                    px: { xs: 2, sm: 3 },
                    py: 2,
                    minHeight: '56px',
                    '&.Mui-expanded': {
                      minHeight: '56px',
                      borderBottom: 'none',
                      pb: 2,
                    },
                    '& .MuiAccordionSummary-content': {
                      my: 0,
                    },
                    position: 'relative',
                    '&.Mui-expanded::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: { xs: '16px', sm: '24px' },
                      right: { xs: '16px', sm: '24px' },
                      height: '1px',
                      backgroundColor: '#e5e7eb',
                      zIndex: 1,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <History sx={{ color: '#6b7280', fontSize: '20px' }} />
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#111827',
                      }}
                    >
                      Approval History
                    </Typography>
                    <Chip
                      label={supplier.approvalHistory.filter(h => h.comments).length}
                      size="small"
                      sx={{
                        bgcolor: '#f3f4f6',
                        color: '#374151',
                        fontSize: '12px',
                        fontWeight: 500,
                        height: '20px',
                        minWidth: '20px',
                        '& .MuiChip-label': {
                          px: 0.75,
                        },
                      }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[...supplier.approvalHistory]
                      .filter(entry => entry.comments)
                      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                      .map((entry, index) => {
                        const actionConfig = {
                          approved: { label: 'Approved', color: '#10b981', bgColor: '#ecfdf5' },
                          rejected: { label: 'Rejected', color: '#ef4444', bgColor: '#fef2f2' },
                          requested_info: { label: 'Requested Info', color: '#6b7280', bgColor: '#f3f4f6' },
                          assigned_vendor_number: { label: 'Vendor Number Assigned', color: '#3b82f6', bgColor: '#eff6ff' },
                          contract_uploaded: { label: 'Contract Uploaded', color: '#8b5cf6', bgColor: '#f5f3ff' },
                        };
                        const config = actionConfig[entry.action] || { label: entry.action, color: '#6b7280', bgColor: '#f3f4f6' };
                        const approverName = entry.approver
                          ? `${entry.approver.firstName || ''} ${entry.approver.lastName || ''}`.trim()
                          : 'System';
                        const approverRole = entry.approver?.role
                          ? entry.approver.role.charAt(0).toUpperCase() + entry.approver.role.slice(1)
                          : '';
                        const timestamp = entry.timestamp
                          ? new Date(entry.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                          : '';

                        return (
                          <Box
                            key={index}
                            sx={{
                              p: 2,
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                              backgroundColor: '#fafafa',
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                                  {approverName}
                                </Typography>
                                {approverRole && (
                                  <Chip
                                    label={approverRole}
                                    size="small"
                                    sx={{
                                      bgcolor: '#f3f4f6',
                                      color: '#374151',
                                      fontSize: '11px',
                                      fontWeight: 500,
                                      height: '20px',
                                      '& .MuiChip-label': { px: 0.75 },
                                    }}
                                  />
                                )}
                                <Chip
                                  label={config.label}
                                  size="small"
                                  sx={{
                                    bgcolor: config.bgColor,
                                    color: config.color,
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    height: '20px',
                                    '& .MuiChip-label': { px: 0.75 },
                                  }}
                                />
                              </Box>
                              <Typography sx={{ fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                                {timestamp}
                              </Typography>
                            </Box>
                            {entry.comments && (
                              <Typography
                                sx={{
                                  fontSize: '14px',
                                  color: '#374151',
                                  lineHeight: 1.6,
                                  mt: 0.5,
                                  whiteSpace: 'pre-wrap',
                                }}
                              >
                                {entry.comments}
                              </Typography>
                            )}
                          </Box>
                        );
                      })}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        </Grid>

      </Grid>


      {/* Mobile Action Buttons - Part of form layout */}
      {showActions && (
        <Box
          sx={{
            display: { xs: 'flex', sm: 'none' },
            flexDirection: 'column',
            gap: 1.5,
            px: 2,
            pt: 3,
            pb: 3,
            bgcolor: '#fff',
          }}
        >
          <Button
            variant="contained"
            startIcon={<Check sx={{ color: '#fff' }} />}
            onClick={() => setActionDialog({ open: true, type: 'approve' })}
            fullWidth
            sx={{
              backgroundColor: theme.palette.green.main,
              color: '#fff',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              py: 1.5,
              borderRadius: '6px',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: theme.palette.green.hover,
                boxShadow: 'none',
              },
              '& .MuiSvgIcon-root': {
                color: '#fff',
              },
            }}
          >
            Approve Application
          </Button>
          <Button
            variant="contained"
            startIcon={<Close sx={{ color: '#fff' }} />}
            onClick={() => setActionDialog({ open: true, type: 'reject' })}
            fullWidth
            sx={{
              backgroundColor: '#ef4444',
              color: '#fff',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              py: 1.5,
              borderRadius: '6px',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#dc2626',
                boxShadow: 'none',
              },
              '& .MuiSvgIcon-root': {
                color: '#fff',
              },
            }}
          >
            Reject Application
          </Button>
          <Button
            variant="outlined"
            startIcon={<ChatBubbleOutline />}
            onClick={() => setActionDialog({ open: true, type: 'request_info' })}
            fullWidth
            sx={{
              borderColor: '#d1d5db',
              color: '#374151',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              py: 1.5,
              borderRadius: '6px',
              bgcolor: '#fff',
              '&:hover': {
                borderColor: '#9ca3af',
                bgcolor: '#f9fafb',
              },
            }}
          >
            Request More Information
          </Button>
        </Box>
      )}

      {/* File Viewer Dialog */}
      <Dialog
        open={fileViewerOpen}
        onClose={() => setFileViewerOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
          {fileViewerName}
        </DialogTitle>
        <DialogContent>
          {fileViewerUrl && (
            <Box sx={{ width: '100%', height: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <iframe
                src={fileViewerUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={fileViewerName}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setFileViewerOpen(false)}
            sx={{
              textTransform: 'none',
              color: '#6b7280',
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialogs */}
      <Dialog
        open={actionDialog.open}
        onClose={() => {
          setActionDialog({ open: false, type: '' });
          setComments('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: '16px 16px 0 0', sm: '8px' },
            margin: { xs: 0, sm: 'auto' },
            maxHeight: { xs: '90vh', sm: 'auto' },
            position: { xs: 'fixed', sm: 'relative' },
            bottom: { xs: 0, sm: 'auto' },
            top: { xs: 'auto', sm: 'auto' },
            width: { xs: '100%', sm: '500px' },
            maxWidth: { xs: '100%', sm: '500px' },
          },
        }}
        sx={{
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2,
          }}
        >
          <span>
            {actionDialog.type === 'approve' && 'Approve Application'}
            {actionDialog.type === 'reject' && 'Reject Application'}
            {actionDialog.type === 'request_info' && 'Request More Information'}
          </span>
          <IconButton
            onClick={() => {
              setActionDialog({ open: false, type: '' });
              setComments('');
            }}
            size="small"
            sx={{
              color: '#6b7280',
              '&:hover': {
                backgroundColor: '#f3f4f6',
              },
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 2 }}>
          <Typography
            sx={{
              fontSize: '14px',
              color: '#6b7280',
              mb: 2,
              lineHeight: 1.5,
            }}
          >
            {actionDialog.type === 'approve'
              ? 'Add comment to complete approval. Click submit when you\'re done.'
              : actionDialog.type === 'reject'
                ? 'Add comment to complete rejection. Click submit when you\'re done.'
                : 'Add comment to describe what additional information is required. Click submit when you\'re done.'}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Write a comment here"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                '& fieldset': {
                  borderColor: '#d1d5db',
                },
                '&:hover fieldset': {
                  borderColor: '#9ca3af',
                },
                '&.Mui-focused fieldset': {
                  borderColor:
                    actionDialog.type === 'approve'
                      ? theme.palette.green.main
                      : actionDialog.type === 'reject'
                        ? '#ef4444'
                        : '#6b7280',
                },
              },
              '& .MuiInputBase-input': {
                fontSize: '14px',
                color: '#111827',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: { xs: 4, sm: 3 }, pt: 2 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              if (actionDialog.type === 'approve') handleApprove();
              else if (actionDialog.type === 'reject') handleReject();
              else if (actionDialog.type === 'request_info') handleRequestInfo();
            }}
            disabled={!comments.trim()}
            sx={{
              backgroundColor:
                actionDialog.type === 'approve'
                  ? theme.palette.green.main
                  : actionDialog.type === 'reject'
                    ? '#ef4444'
                    : '#6b7280',
              color: '#fff',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              py: 1.5,
              borderRadius: '6px',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor:
                  actionDialog.type === 'approve'
                    ? theme.palette.green.hover
                    : actionDialog.type === 'reject'
                      ? '#dc2626'
                      : '#4b5563',
                boxShadow: 'none',
              },
              '&:disabled': {
                backgroundColor:
                  actionDialog.type === 'approve'
                    ? '#a8b89a' // Green with grey shade
                    : actionDialog.type === 'reject'
                      ? '#fca5a5' // Red with grey shade
                      : '#d1d5db', // Grey
                color: '#fff',
              },
            }}
          >
            {actionDialog.type === 'approve'
              ? 'Submit Approval'
              : actionDialog.type === 'reject'
                ? 'Submit Rejection'
                : 'Submit Request for More Information'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupplierDetails;
