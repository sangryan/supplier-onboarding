import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from '@mui/material';
import {
  ExpandMore,
  Download as DownloadIcon,
  Upload as UploadIcon,
  ArrowBack as ArrowBackIcon,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import UploadContractModal from '../../components/Contracts/UploadContractModal';

const ContractDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [terminateDialog, setTerminateDialog] = useState(false);
  const [terminating, setTerminating] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [fileViewerUrl, setFileViewerUrl] = useState(null);
  const [fileViewerName, setFileViewerName] = useState('');
  const [expanded, setExpanded] = useState(['basicInformation', 'contactDetails', 'contractInformation']);

  useEffect(() => {
    fetchContract();
  }, [id]);

  const fetchContract = async () => {
    try {
      const response = await api.get(`/contracts/${id}`);
      setContract(response.data.data);
    } catch (error) {
      toast.error('Failed to load contract details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded((prevExpanded) => {
      if (isExpanded) {
        return prevExpanded.includes(panel) ? prevExpanded : [...prevExpanded, panel];
      } else {
        return prevExpanded.filter((p) => p !== panel);
      }
    });
  };

  const handleTerminateContract = async () => {
    setTerminating(true);
    try {
      await api.post(`/contracts/${id}/terminate`);
      toast.success('Contract terminated successfully');
      setTerminateDialog(false);
      fetchContract();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to terminate contract');
    } finally {
      setTerminating(false);
    }
  };

  const handleDownloadContract = async () => {
    if (!contract.signedContract?._id) return;
    try {
      const response = await api.get(`/documents/${contract.signedContract._id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', contract.signedContract.originalName || 'contract.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download contract');
    }
  };

  const handleSaveContract = async (data) => {
    const formData = new FormData();
    formData.append('contract', data.file);
    if (data.startDate) formData.append('startDate', data.startDate);
    if (data.validityMonths) formData.append('validityMonths', data.validityMonths);
    if (data.noticePeriodMonths) formData.append('noticePeriodMonths', data.noticePeriodMonths);
    if (data.department) formData.append('department', data.department);
    if (data.comment) formData.append('comment', data.comment);

    setUploading(true);
    try {
      await api.post(`/contracts/${id}/upload-signed`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Contract updated successfully');
      setUploadModalOpen(false);
      fetchContract();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload contract');
    } finally {
      setUploading(false);
    }
  };

  const handleViewFile = (document) => {
    let url;
    let fileName = document.originalName || document.fileName || 'Document';

    if (document._id && typeof document._id === 'string' && (document._id.startsWith('doc-') || document._id.startsWith('practicing-') || document._id.startsWith('resume-'))) {
      const filePath = document.fileName || document.originalName;
      if (filePath.startsWith('http')) {
        url = filePath;
      } else if (filePath.startsWith('uploads/')) {
        url = `/${filePath}`;
      } else {
        url = `/uploads/${supplier._id}/${filePath}`;
      }
    } else {
      url = `/api/documents/${document._id}/download`;
    }

    setFileViewerUrl(url);
    setFileViewerName(fileName);
    setFileViewerOpen(true);
  };

  const handleDownloadFile = (document) => {
    let url;
    if (document._id && typeof document._id === 'string' && (document._id.startsWith('doc-') || document._id.startsWith('practicing-') || document._id.startsWith('resume-'))) {
      const filePath = document.fileName || document.originalName;
      if (filePath.startsWith('http')) {
        url = filePath;
      } else if (filePath.startsWith('uploads/')) {
        url = `/${filePath}`;
      } else {
        url = `/uploads/${supplier._id}/${filePath}`;
      }
      window.open(url, '_blank');
    } else {
      url = `/api/documents/${document._id}/download`;
      window.open(url, '_blank');
    }
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

  const getEntityDocuments = () => {
    if (!supplier) return [];
    const entityDocs = [];
    if (supplier.documents && Array.isArray(supplier.documents)) {
      const apiDocs = supplier.documents.filter(doc =>
        ['certificate_of_incorporation', 'cr12', 'pin_certificate', 'company_profile', 'bank_reference', 'etims_registration', 'directors_id', 'audited_financials'].includes(doc.documentType)
      );
      if (apiDocs.length > 0) return apiDocs;
    }

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
        entityDocs.push({
          _id: `doc-${key}`,
          documentType: docMap[key].type,
          originalName: docMap[key].name,
          fileSize: 2400000,
          fileName: supplier[key],
        });
      }
    });
    return entityDocs;
  };

  const getServiceDocuments = () => {
    if (!supplier) return [];
    const serviceDocs = [];
    if (supplier.documents && Array.isArray(supplier.documents)) {
      const apiDocs = supplier.documents.filter(doc =>
        ['practicing_certificate', 'member_resume'].includes(doc.documentType)
      );
      if (apiDocs.length > 0) return apiDocs;
    }

    if (supplier.practicingCertificates && Array.isArray(supplier.practicingCertificates)) {
      supplier.practicingCertificates.forEach((file, index) => {
        serviceDocs.push({
          _id: `practicing-${index}`,
          documentType: 'practicing_certificate',
          originalName: 'Practicing Certificate',
          fileSize: 2400000,
          fileName: file,
        });
      });
    }

    if (supplier.keyMembersResumes && Array.isArray(supplier.keyMembersResumes)) {
      supplier.keyMembersResumes.forEach((file, index) => {
        serviceDocs.push({
          _id: `resume-${index}`,
          documentType: 'member_resume',
          originalName: `Resume ${index + 1}`,
          fileSize: 2400000,
          fileName: file,
        });
      });
    }
    return serviceDocs;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    const day = d.getDate();
    const year = d.getFullYear();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[d.getMonth()];

    // Add ordinal suffix
    const suffix = (day) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
      }
    };

    return `${day}${suffix(day)} ${month}, ${year}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!contract) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">Contract not found</Alert>
      </Container>
    );
  }

  const supplier = contract.supplier || {};

  const accordionStyle = {
    boxShadow: 'none',
    border: 'none',
    borderRadius: '0 !important',
    mb: 0,
    '&:before': { display: 'none' },
    '&.Mui-expanded': {
      margin: 0,
    },
  };

  const summaryStyle = (panel) => ({
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
  });

  const labelStyle = {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: 500,
    mb: 0.5,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const valueStyle = {
    fontSize: '14px',
    color: '#111827',
    fontWeight: 400,
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fff', p: { xs: 0, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 3, px: { xs: 2, sm: 0 }, pt: { xs: 2, sm: 0 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => navigate('/contracts')} sx={{ color: '#111827', display: { sm: 'none' } }}>
                <ChevronLeft />
              </IconButton>
              <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '20px', color: '#111827' }}>
                {contract.contractNumber}
              </Typography>
            </Box>
            <Chip
              label={contract.status?.toUpperCase() || 'DRAFT'}
              sx={{
                bgcolor: '#f3f4f6',
                color: '#374151',
                fontSize: '12px',
                fontWeight: 500,
                height: '24px',
                borderRadius: '12px',
                '& .MuiChip-label': { px: 1.5 }
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{
                textTransform: 'none',
                borderColor: '#d1d5db',
                color: '#374151',
                fontSize: '14px',
                fontWeight: 500,
                px: 3,
                py: 1,
                borderRadius: '6px',
                bgcolor: '#fff',
                '&:hover': { borderColor: '#9ca3af', bgcolor: '#f9fafb' }
              }}
              onClick={handleDownloadContract}
              disabled={!contract.signedContract}
            >
              Download Contract
            </Button>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              sx={{
                bgcolor: '#578A18',
                color: '#fff',
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 500,
                px: 3,
                py: 1,
                borderRadius: '6px',
                boxShadow: 'none',
                '&:hover': { bgcolor: '#467014', boxShadow: 'none' }
              }}
              onClick={() => setUploadModalOpen(true)}
            >
              Upload New Contract
            </Button>
          </Box>
        </Box>

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
            '& .MuiChip-label': { px: 1.5 }
          }}
        />
      </Box>

      {/* Main Content Accordions */}
      <Box sx={{ border: '1px solid #e5e7eb', borderRadius: { xs: 0, sm: '8px' }, overflow: 'hidden', maxWidth: '1400px', mx: 'auto' }}>
        {/* Basic Information */}
        <Accordion expanded={expanded.includes('basicInformation')} onChange={handleAccordionChange('basicInformation')} sx={accordionStyle}>
          <AccordionSummary expandIcon={expanded.includes('basicInformation') ? <ExpandMore /> : <ChevronRight />} sx={summaryStyle('basicInformation')}>
            <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>Basic Information</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Supplier Name</Typography>
                <Typography sx={valueStyle}>{supplier.supplierName || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Registered Country</Typography>
                <Typography sx={valueStyle}>{supplier.country || supplier.companyPhysicalAddress?.country || 'Kenya'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Company Registration Number</Typography>
                <Typography sx={valueStyle}>{supplier.companyRegistrationNumber || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Company Email Address</Typography>
                <Typography sx={valueStyle}>{supplier.companyEmail || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Company Website</Typography>
                <Typography sx={valueStyle}>{supplier.companyWebsite || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Legal Nature of Entity</Typography>
                <Typography sx={{ ...valueStyle, textTransform: 'capitalize' }}>{supplier.legalNature?.replace('_', ' ') || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography sx={labelStyle}>Physical Address</Typography>
                <Typography sx={valueStyle}>
                  {supplier.companyPhysicalAddress ?
                    `${supplier.companyPhysicalAddress.street || ''}, ${supplier.companyPhysicalAddress.city || ''}, ${supplier.companyPhysicalAddress.country || ''}` :
                    '-'}
                </Typography>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Contact Details */}
        <Accordion expanded={expanded.includes('contactDetails')} onChange={handleAccordionChange('contactDetails')} sx={accordionStyle}>
          <AccordionSummary expandIcon={expanded.includes('contactDetails') ? <ExpandMore /> : <ChevronRight />} sx={summaryStyle('contactDetails')}>
            <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>Contact Details</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Full Name</Typography>
                <Typography sx={valueStyle}>{supplier.authorizedPerson?.name || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Relationship</Typography>
                <Typography sx={{ ...valueStyle, textTransform: 'capitalize' }}>{supplier.authorizedPerson?.relationship || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Email</Typography>
                <Typography sx={valueStyle}>{supplier.authorizedPerson?.email || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Phone</Typography>
                <Typography sx={valueStyle}>{supplier.authorizedPerson?.phone || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>ID/Passport Number</Typography>
                <Typography sx={valueStyle}>{supplier.authorizedPerson?.idPassportNumber || '-'}</Typography>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Entity Details */}
        <Accordion expanded={expanded.includes('entityDetails')} onChange={handleAccordionChange('entityDetails')} sx={accordionStyle}>
          <AccordionSummary expandIcon={expanded.includes('entityDetails') ? <ExpandMore /> : <ChevronRight />} sx={summaryStyle('entityDetails')}>
            <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>Entity Details</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Entity Type</Typography>
                <Typography sx={{ ...valueStyle, textTransform: 'capitalize', mb: 3 }}>{supplier.entityType?.replace('_', ' ') || '-'}</Typography>
              </Grid>
            </Grid>

            {/* Attached Documents */}
            {[...getEntityDocuments(), ...getServiceDocuments()].length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography sx={labelStyle}>Attached Documents</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {[...getEntityDocuments(), ...getServiceDocuments()].map((doc) => (
                    <Box key={doc._id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: '1px solid #e5e7eb', borderRadius: '8px', bgcolor: '#fff' }}>
                      <Box component="img" src="/images/File.svg" alt="File" sx={{ width: 24, height: 24 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '14px', color: '#111827', fontWeight: 400, mb: 0.5 }}>
                          {formatDocumentType(doc.documentType)}
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: '#6b7280' }}>
                          PDF • {formatFileSize(doc.fileSize)}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => handleViewFile(doc)} sx={{ color: '#6b7280' }}>
                        <Box component="img" src="/images/eye.svg" alt="View" sx={{ width: 20, height: 20 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDownloadFile(doc)} sx={{ color: '#6b7280' }}>
                        <Box component="img" src="/images/Download.svg" alt="Download" sx={{ width: 20, height: 20 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <Box sx={{ mt: 4 }}>
              <Typography sx={labelStyle}>Service Type</Typography>
              <Typography sx={{ ...valueStyle, textTransform: 'capitalize', mb: 3 }}>{supplier.serviceType?.replace('_', ' ') || '-'}</Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography sx={labelStyle}>Credit Period</Typography>
              <Typography sx={valueStyle}>{supplier.creditPeriod ? `${supplier.creditPeriod} Days` : '-'}</Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Source of Funds Declaration */}
        <Accordion expanded={expanded.includes('sourceOfFunds')} onChange={handleAccordionChange('sourceOfFunds')} sx={accordionStyle}>
          <AccordionSummary expandIcon={expanded.includes('sourceOfFunds') ? <ExpandMore /> : <ChevronRight />} sx={summaryStyle('sourceOfFunds')}>
            <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>Source of Funds Declaration</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Source of Wealth</Typography>
                <Typography sx={{ ...valueStyle, textTransform: 'capitalize' }}>
                  {supplier.sourceOfFunds?.source ? supplier.sourceOfFunds.source.replace('_', ' ') : (supplier.sourceOfWealth || '-')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Declarant Full Name</Typography>
                <Typography sx={valueStyle}>{supplier.sourceOfFunds?.declarantName || supplier.declarantFullName || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Declarant Capacity</Typography>
                <Typography sx={valueStyle}>{supplier.sourceOfFunds?.declarantCapacity || supplier.declarantCapacity || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>ID/Passport Number</Typography>
                <Typography sx={valueStyle}>{supplier.sourceOfFunds?.declarantIdPassport || supplier.declarantIdPassport || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Declaration Date</Typography>
                <Typography sx={valueStyle}>{formatDate(supplier.sourceOfFunds?.declarationDate)}</Typography>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Personal Information Processing Consent */}
        <Accordion expanded={expanded.includes('consent')} onChange={handleAccordionChange('consent')} sx={accordionStyle}>
          <AccordionSummary expandIcon={expanded.includes('consent') ? <ExpandMore /> : <ChevronRight />} sx={summaryStyle('consent')}>
            <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>Personal Information Processing Consent</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Full Name of Declarant</Typography>
                <Typography sx={valueStyle}>{supplier.declarantFullName || supplier.dataProcessingConsent?.consentorName || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Date</Typography>
                <Typography sx={valueStyle}>{formatDate(supplier.declarationDate || supplier.dataProcessingConsent?.consentDate)}</Typography>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Contract Information */}
        <Accordion expanded={expanded.includes('contractInformation')} onChange={handleAccordionChange('contractInformation')} sx={accordionStyle}>
          <AccordionSummary expandIcon={expanded.includes('contractInformation') ? <ExpandMore /> : <ChevronRight />} sx={summaryStyle('contractInformation')}>
            <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>Contract Information</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Contract Type</Typography>
                <Typography sx={valueStyle}>{contract.contractType === 'services' ? 'Service Agreement' : 'Other Agreement'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Contract Status</Typography>
                <Chip
                  label={contract.status?.toUpperCase() || 'DRAFT'}
                  size="small"
                  sx={{
                    bgcolor: contract.status === 'active' ? '#E9F5E1' : '#F3F4F6',
                    color: contract.status === 'active' ? '#2E7D32' : '#6B7280',
                    fontWeight: 600,
                    fontSize: '0.65rem'
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Department</Typography>
                <Typography sx={valueStyle}>{contract.department || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Contract Validity</Typography>
                <Typography sx={valueStyle}>{contract.validityMonths ? `${contract.validityMonths} Months` : '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Notice Period</Typography>
                <Typography sx={valueStyle}>{contract.noticePeriodMonths ? `${contract.noticePeriodMonths} Months` : '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Start Date</Typography>
                <Typography sx={valueStyle}>{formatDate(contract.startDate)}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={labelStyle}>Expiry Date</Typography>
                <Typography sx={valueStyle}>{formatDate(contract.endDate)}</Typography>
              </Grid>
              {contract.notes && (
                <Grid item xs={12}>
                  <Typography sx={labelStyle}>Comments</Typography>
                  <Typography sx={valueStyle}>{contract.notes}</Typography>
                </Grid>
              )}
            </Grid>

            {/* Termination Flow (Styled like SupplierDetails action panels) */}
            {contract.status === 'active' && (
              <Box sx={{ mt: 4, p: 3, border: '1px solid #fca5a5', borderRadius: '8px', bgcolor: '#fff' }}>
                <Typography sx={{ fontWeight: 600, mb: 1, color: '#111827' }}>Terminate Contract</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  This will send a notification of termination to the supplier. Please note that this action is irreversible.
                </Typography>
                <Box sx={{ bgcolor: '#fee2e2', p: 2, borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="#b91c1c" sx={{ fontWeight: 500 }}>This action cannot be undone!</Typography>
                  <Button
                    variant="contained"
                    color="error"
                    sx={{ textTransform: 'none', bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
                    onClick={() => setTerminateDialog(true)}
                  >
                    Terminate Contract
                  </Button>
                </Box>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Modals & Dialogs */}
      <UploadContractModal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} onSave={handleSaveContract} uploading={uploading} />

      <Dialog open={terminateDialog} onClose={() => setTerminateDialog(false)}>
        <DialogTitle>Confirm Termination</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to terminate this contract? This action is irreversible.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTerminateDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleTerminateContract} disabled={terminating}>
            {terminating ? 'Terminating...' : 'Terminate'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={fileViewerOpen} onClose={() => setFileViewerOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: '8px', maxHeight: '90vh' } }}>
        <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>{fileViewerName}</DialogTitle>
        <DialogContent>
          {fileViewerUrl && (
            <Box sx={{ width: '100%', height: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <iframe src={fileViewerUrl} style={{ width: '100%', height: '100%', border: 'none' }} title={fileViewerName} />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ContractDetails;
