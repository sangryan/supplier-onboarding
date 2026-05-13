import React, { useState, useEffect } from 'react';
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
  Checkbox,
  FormControlLabel,
  Link,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { ArrowBack, ArrowForward, Search, Check, KeyboardArrowDown, CalendarToday, NavigateBefore, NavigateNext, ExpandMore, Close } from '@mui/icons-material';
import api, { API_BASE_URL } from '../../utils/api';
import { toast } from 'react-toastify';
import Footer from '../../components/Footer/Footer';
import { useAuth } from '../../context/AuthContext';
import { buildUploadUrl, fetchFileBlobUrl } from '../../utils/fileAccess';
import { processFileForUpload, processFilesForUpload } from '../../utils/compressImage';
import { format, parse, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

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

const currencies = ['KES', 'USD', 'EUR', 'GBP'];

const creditPeriods = ['7 Days', '14 Days', '30 Days', '60 Days', '90 Days'];

const entityTypes = [
  'Private/Public Company',
  'Partnerships',
  'Foreign Company',
  'Individual/Sole Proprietor',
  'Trust'
];

const mapEntityTypeToDisplay = (value) => {
  const mapping = {
    private_company: 'Private/Public Company',
    public_company: 'Private/Public Company',
    partnership: 'Partnerships',
    foreign_company: 'Foreign Company',
    individual: 'Individual/Sole Proprietor',
    trust: 'Trust',
    other: 'Private/Public Company',
    'Public/Private Company': 'Private/Public Company',
    'Limited Company': 'Private/Public Company',
    'Public Limited Company': 'Private/Public Company',
    'Partnership': 'Partnerships',
    'Sole Proprietorship': 'Individual/Sole Proprietor'
  };

  return mapping[value] || value || '';
};

const mapEntityTypeToLegalNature = (value) => {
  const displayValue = mapEntityTypeToDisplay(value);
  const mapping = {
    'Private/Public Company': 'company',
    'Partnerships': 'partnership',
    'Foreign Company': 'foreign_company',
    'Individual/Sole Proprietor': 'individual',
    'Trust': 'trust'
  };

  return mapping[displayValue] || 'company';
};

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
  const params = useParams();
  const id = params.id; // Works for both /application/:id/edit and /application/:id
  const theme = useTheme();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  // Track which fields are prefilled from profile (read-only for new applications)
  // Using array instead of Set for better React state detection
  const [prefilledFields, setPrefilledFields] = useState([]);
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
    // File uploads
    certificateOfIncorporation: null,
    kraPinCertificate: null,
    etimsProof: null,
    financialStatements: null,
    cr12: null,
    companyProfile: null,
    bankReferenceLetter: null,
    directorsIds: [],
    // Partnership
    partnershipDeed: null,
    partnersPinCertificate: null,
    partnersTaxCompliance: null,
    partnerIds: [],
    // Foreign Company
    shareCertificate: null,
    registryExtract: null,
    taxComplianceCertificate: null,
    directorsNationalIds: [],
    directorsPassports: [],
    // Individual / Sole Proprietor
    nationalId: null,
    passportDocument: null,
    workPermit: null,
    policeClearance: null,
    resume: null,
    // Trust
    trustDeed: null,
    founderPin: null,
    foundersIds: [],
    beneficiariesIds: [],
    practicingCertificates: [],
    keyMembersResumes: [],

    // Declarations
    sourceOfWealth: '',
    declarantFullName: '',
    declarantCapacity: '',
    declarantIdPassport: '',
    declarationDate: '',
    consentToProcessing: false,
    confirmInformationAccurate: false,
  });
  const [loading, setLoading] = useState(false);
  const [countrySearchOpen, setCountrySearchOpen] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [countryAnchorEl, setCountryAnchorEl] = useState(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerAnchorEl, setDatePickerAnchorEl] = useState(null);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [fileViewerUrl, setFileViewerUrl] = useState(null);
  const [fileViewerName, setFileViewerName] = useState('');
  const [imageLoadError, setImageLoadError] = useState(false);

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearchTerm.toLowerCase())
  );

  const selectedCountry = countries.find(c => c.name === formData.registeredCountry);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expandedAccordion, setExpandedAccordion] = useState('basicInformation');

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Debug file uploads
    if (value instanceof File || (Array.isArray(value) && value[0] instanceof File)) {
      console.log(`File uploaded for ${field}:`, value instanceof File ? value.name : value.map(f => f.name));
    }
  };

  const handleViewFile = async (file, fileName = '') => {
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
        try {
          const parsed = new URL(file);
          const frontendOrigin = window.location.origin;
          // If legacy data points to frontend host for uploads, rewrite to API host
          if (parsed.origin === frontendOrigin && parsed.pathname.startsWith('/uploads/')) {
            fileUrl = `${API_BASE_URL}${parsed.pathname}`;
          } else {
            fileUrl = file;
          }
        } catch {
          fileUrl = file;
        }
      } else {
        fileUrl = buildUploadUrl(file, applicationId || id);
      }
      displayName = fileName || file.split('/').pop() || 'File';
    }

    if (fileUrl) {
      if (!fileUrl.startsWith('blob:')) {
        try {
          fileUrl = await fetchFileBlobUrl(fileUrl);
        } catch (error) {
          toast.error(error.message || 'Failed to open file');
          return;
        }
      }
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

  // Map form field names to document types for upload
  const getDocumentType = (fieldName) => {
    const fieldToDocType = {
      'certificateOfIncorporation': 'certificate_of_incorporation',
      'kraPinCertificate': 'pin_certificate',
      'etimsProof': 'etims_registration',
      'financialStatements': 'audited_financials',
      'cr12': 'cr12',
      'companyProfile': 'company_profile',
      'bankReferenceLetter': 'bank_reference',
      'directorsIds': 'directors_id',
      'practicingCertificates': 'practicing_certificate',
      'keyMembersResumes': 'member_resume',

      // Partnership
      'partnershipDeed': 'partnership_deed',
      'partnersPinCertificate': 'partner_pin',
      'partnersTaxCompliance': 'partner_tax_compliance',
      'partnerIds': 'partner_id',

      // Foreign Company
      'shareCertificate': 'share_certificate',
      'registryExtract': 'registry_extract',
      'taxComplianceCertificate': 'tax_compliance',
      'directorsNationalIds': 'national_id',
      'directorsPassports': 'passport',

      // Individual / Sole Proprietor
      'nationalId': 'national_id',
      'passportDocument': 'passport',
      'workPermit': 'work_permit',
      'policeClearance': 'police_clearance',
      'resume': 'resume',

      // Trust
      'trustDeed': 'trust_deed',
      'founderPin': 'founder_pin',
      'foundersIds': 'founder_id',
      'beneficiariesIds': 'beneficiary_id'
    };
    return fieldToDocType[fieldName] || 'other';
  };

  const renderSingleFileUpload = (fieldKey, label, helperText = 'Accepted: PDF, Word, Excel, Images (Max 20MB — images auto-resized if larger)') => {
    const value = formData[fieldKey];
    const displayValue = value
      ? (value instanceof File
        ? value.name
        : typeof value === 'string'
          ? value
          : 'File selected')
      : 'Choose file';

    return (
      <Box sx={{ mb: 2.5 }}>
        <Typography
          variant="body2"
          sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
        >
          {label}
        </Typography>
        <Button
          component="label"
          variant="outlined"
          fullWidth
          sx={{
            justifyContent: 'flex-start',
            textTransform: 'none',
            borderColor: '#d1d5db',
            color: '#6b7280',
            fontSize: '14px',
            py: 0.75,
            '&:hover': {
              borderColor: '#9ca3af',
              backgroundColor: '#f9fafb'
            }
          }}
        >
          {displayValue}
          <input
            type="file"
            hidden
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
            onChange={async (e) => {
              if (e.target.files && e.target.files[0]) {
                try {
                  const file = await processFileForUpload(e.target.files[0]);
                  handleChange(fieldKey, file);
                } catch (err) {
                  toast.error(err.message);
                }
              }
            }}
            onClick={(e) => {
              e.target.value = '';
            }}
          />
        </Button>
        <Typography
          variant="caption"
          sx={{ color: '#9ca3af', fontSize: '11px', mt: 0.5, display: 'block' }}
        >
          {helperText}
        </Typography>
        {!formData[fieldKey] && (
          <Typography
            variant="caption"
            sx={{ color: '#9ca3af', fontSize: '12px', mt: 0.5, display: 'block' }}
          >
            No file chosen
          </Typography>
        )}
      </Box>
    );
  };

  const renderMultiFileUpload = (fieldKey, label, maxFiles = 10) => {
    const currentValue = formData[fieldKey];
    const count = Array.isArray(currentValue) ? currentValue.length : 0;
    const hasAny = count > 0;

    return (
      <Grid item xs={12}>
        <Typography
          variant="body2"
          sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
        >
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={{ mb: 1.5, fontSize: '12px', color: '#9ca3af', display: 'block' }}
        >
          Please select up to {maxFiles} files
        </Typography>
        <Box
          component="label"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #d1d5db',
            borderRadius: '8px',
            p: 4,
            cursor: 'pointer',
            backgroundColor: '#fafafa',
            '&:hover': {
              borderColor: '#9ca3af',
              backgroundColor: '#f9fafb'
            }
          }}
        >
          <input
            type="file"
            multiple
            hidden
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
            onChange={async (e) => {
              if (e.target.files && e.target.files.length > 0) {
                let selected = Array.from(e.target.files);
                if (selected.length > maxFiles) {
                  toast.warning(`Only the first ${maxFiles} files will be uploaded. ${selected.length - maxFiles} file(s) ignored.`);
                  selected = selected.slice(0, maxFiles);
                }
                const { processed, errors } = await processFilesForUpload(selected);
                errors.forEach(msg => toast.error(msg));
                if (processed.length > 0) handleChange(fieldKey, processed);
              }
            }}
            onClick={(e) => {
              e.target.value = '';
            }}
          />
          <Box
            component="img"
            src="/images/upload.svg"
            alt="Upload icon"
            sx={{ width: 40, height: 40, mb: 1.5 }}
          />
          <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151', mb: 0.5 }}>
            Upload files
          </Typography>
          <Typography sx={{ fontSize: '12px', color: '#6b7280' }}>
            Click here or drag and drop to upload
          </Typography>
          {hasAny && (
            <Typography sx={{ fontSize: '12px', color: theme.palette.green.main, mt: 1, fontWeight: 500 }}>
              {count} file(s) selected
              {currentValue[0] instanceof File === false && currentValue[0] && (
                <span> ({typeof currentValue[0] === 'string' ? 'Previously saved' : ''})</span>
              )}
            </Typography>
          )}
        </Box>
      </Grid>
    );
  };

  // Build dynamic documents list based on entity type
  const getRequiredDocuments = () => {
    const entityType = formData.entityType;
    const isCompanyLike = entityType === 'Private/Public Company';
    const isPartnership = entityType === 'Partnerships';
    const isForeignCompany = entityType === 'Foreign Company';
    const isIndividual = entityType === 'Individual/Sole Proprietor';
    const isTrust = entityType === 'Trust';
    const docs = [];
    
    // Add Certificate of Incorporation for company-like and foreign companies
    if (isCompanyLike || isForeignCompany) {
      docs.push({
        type: 'single',
        field: 'certificateOfIncorporation',
        label: 'Certificate of Incorporation or Registration'
      });
    }

    // Partnership documents
    if (isPartnership) {
      docs.push({
        type: 'single',
        field: 'partnershipDeed',
        label: 'Partnership Deed'
      });
      docs.push({
        type: 'single',
        field: 'partnersPinCertificate',
        label: 'PIN Certificate of partners'
      });
      docs.push({
        type: 'single',
        field: 'partnersTaxCompliance',
        label: 'Valid tax compliance certificate for each partner'
      });
      docs.push({
        type: 'multi',
        field: 'partnerIds',
        label: "Partners' IDs/Copies of Passports"
      });
    }

    // Foreign Company documents
    if (isForeignCompany) {
      docs.push({
        type: 'multi',
        field: 'directorsNationalIds',
        label: "Directors' National Identification documents"
      });
      docs.push({
        type: 'multi',
        field: 'directorsPassports',
        label: "Directors' Passports"
      });
      docs.push({
        type: 'single',
        field: 'shareCertificate',
        label: 'Valid share certificate'
      });
      docs.push({
        type: 'single',
        field: 'registryExtract',
        label: 'Valid registry extract (alternative to share certificate)'
      });
      docs.push({
        type: 'single',
        field: 'taxComplianceCertificate',
        label: 'Valid tax compliance certificate'
      });
    }

    // Individual documents
    if (isIndividual) {
      docs.push({
        type: 'single',
        field: 'nationalId',
        label: 'National Identification Card'
      });
      docs.push({
        type: 'single',
        field: 'passportDocument',
        label: 'Passport'
      });
      docs.push({
        type: 'single',
        field: 'workPermit',
        label: 'Work permit (for foreigners)'
      });
      docs.push({
        type: 'single',
        field: 'policeClearance',
        label: 'Police clearance certificate'
      });
      docs.push({
        type: 'single',
        field: 'resume',
        label: 'Resume (Curriculum vitae)'
      });
    }

    // Trust documents
    if (isTrust) {
      docs.push({
        type: 'multi',
        field: 'foundersIds',
        label: "Founders' IDs/Copies of Passports"
      });
      docs.push({
        type: 'multi',
        field: 'beneficiariesIds',
        label: 'Beneficaries IDs/Copies of Passport'
      });
      docs.push({
        type: 'single',
        field: 'trustDeed',
        label: 'Trust Deed'
      });
      docs.push({
        type: 'single',
        field: 'founderPin',
        label: 'PIN Certificate of Founders'
      });
    }

    // Company-like multi-file documents
    if (isCompanyLike) {
      docs.push({
        type: 'multi',
        field: 'directorsIds',
        label: "Directors' IDs/Copies of Passports"
      });
    }

    // Shared documents
    if (isCompanyLike || isPartnership || isForeignCompany) {
      docs.push({
        type: 'single',
        field: 'companyProfile',
        label: 'Firm Company Profile'
      });
    }

    if (isCompanyLike) {
      docs.push({
        type: 'single',
        field: 'cr12',
        label: 'Valid CR12 (not more than 30 days old)'
      });
    }

    // Universal documents
    docs.push({
      type: 'single',
      field: 'bankReferenceLetter',
      label: 'Bank reference letter'
    });

    if (isCompanyLike || isIndividual) {
      docs.push({
        type: 'single',
        field: 'kraPinCertificate',
        label: isCompanyLike ? 'PIN Certificate of entity' : 'PIN Certificate'
      });
    }

    if (isCompanyLike || isPartnership || isIndividual) {
      docs.push({
        type: 'single',
        field: 'etimsProof',
        label: 'Proof of registration on e-TIMS'
      });
    }

    if (isCompanyLike || isPartnership || isForeignCompany || isTrust) {
      docs.push({
        type: 'single',
        field: 'financialStatements',
        label: 'Current annual audited financial statements'
      });
    }

    return docs;
  };

  // Render dynamic document
  const renderDocument = (doc) => {
    if (doc.type === 'single') {
      return renderSingleFileUpload(doc.field, doc.label);
    } else if (doc.type === 'multi') {
      return renderMultiFileUpload(doc.field, doc.label);
    }
    return null;
  };

  // Upload a single file
  const uploadFile = async (file, fieldName, supplierId) => {
    if (!file || !(file instanceof File)) {
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('supplierId', supplierId);
      formData.append('documentType', getDocumentType(fieldName));
      formData.append('document', file);

      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.data) {
        // Return the filename from the uploaded document
        return response.data.data.fileName;
      }
      return null;
    } catch (error) {
      console.error(`Error uploading ${fieldName}:`, error);
      const serverMessage = error.response?.data?.message;
      toast.error(serverMessage || `Failed to upload ${fieldName}`);
      return null;
    }
  };

  // Upload all files in the form
  const uploadAllFiles = async (supplierId) => {
    const updatedFormData = { ...formData };

    // Upload single file fields
    const singleFileFields = [
      'certificateOfIncorporation', 'kraPinCertificate', 'etimsProof',
      'financialStatements', 'cr12', 'companyProfile', 'bankReferenceLetter',

      // Partnership
      'partnershipDeed', 'partnersPinCertificate', 'partnersTaxCompliance',

      // Foreign Company
      'shareCertificate', 'registryExtract', 'taxComplianceCertificate',

      // Individual / Sole Proprietor
      'nationalId', 'passportDocument', 'workPermit', 'policeClearance', 'resume',

      // Trust
      'trustDeed', 'founderPin'
    ];

    for (const field of singleFileFields) {
      if (formData[field] instanceof File) {
        const uploadedFileName = await uploadFile(formData[field], field, supplierId);
        if (uploadedFileName) {
          updatedFormData[field] = uploadedFileName;
        }
      }
    }

    // Upload array file fields
    const arrayFileFields = [
      'directorsIds',
      'partnerIds',
      'directorsNationalIds',
      'directorsPassports',
      'foundersIds',
      'beneficiariesIds',
      'practicingCertificates',
      'keyMembersResumes'
    ];
    for (const field of arrayFileFields) {
      if (Array.isArray(formData[field]) && formData[field].length > 0) {
        const uploadedFiles = [];
        for (const file of formData[field]) {
          if (file instanceof File) {
            const uploadedFileName = await uploadFile(file, field, supplierId);
            if (uploadedFileName) {
              uploadedFiles.push(uploadedFileName);
            }
          } else if (typeof file === 'string') {
            // Keep existing filenames
            uploadedFiles.push(file);
          }
        }
        updatedFormData[field] = uploadedFiles;
      }
    }

    return updatedFormData;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    try {
      const date = parse(dateString, 'yyyy-MM-dd', new Date());
      return format(date, 'dd / MM / yyyy');
    } catch {
      return dateString;
    }
  };

  const handleDateClick = (e) => {
    setDatePickerAnchorEl(e.currentTarget);
    setDatePickerOpen(true);
  };

  const handleDateSelect = (date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    handleChange('declarationDate', formattedDate);
    setCurrentMonth(date);
    setDatePickerOpen(false);
  };

  const calendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const [applicationId, setApplicationId] = useState(id || null);

  // Load existing application data if ID is provided
  useEffect(() => {
    if (id) {
      const loadApplication = async () => {
        try {
          const response = await api.get(`/suppliers/${id}`);
          const app = response.data.data;
          if (app) {
            // Debug: log the app data to see what fields are available
            console.log('Loaded application data:', app);
            console.log('Available fields:', Object.keys(app));
            console.log('File fields from backend (raw):', {
              certificateOfIncorporation: app.certificateOfIncorporation,
              kraPinCertificate: app.kraPinCertificate,
              etimsProof: app.etimsProof,
              financialStatements: app.financialStatements,
              cr12: app.cr12,
              companyProfile: app.companyProfile,
              bankReferenceLetter: app.bankReferenceLetter,
              entityType: app.entityType,
              directorsIds: app.directorsIds,
              practicingCertificates: app.practicingCertificates,
              keyMembersResumes: app.keyMembersResumes
            });
            setApplicationId(app._id);

            // Map backend data structure to frontend form structure
            // Start with all fields from app, then override with special mappings
            const mappedData = {
              // Basic Information - read directly from app or use defaults
              supplierName: app.supplierName || '',
              registeredCountry: app.registeredCountry || '',
              companyRegistrationNumber: app.companyRegistrationNumber || '',
              companyEmail: app.companyEmail || '',
              companyWebsite: app.companyWebsite || '',
              legalNature: mapEntityTypeToLegalNature(app.entityType),
              physicalAddress: app.physicalAddress || app.companyPhysicalAddress?.street || '',

              // Contact Person (map from authorizedPerson if direct fields don't exist)
              contactFullName: app.contactFullName || app.authorizedPerson?.name || '',
              contactRelationship: app.contactRelationship || app.authorizedPerson?.relationship || '',
              contactIdPassport: app.contactIdPassport || app.authorizedPerson?.idPassportNumber || '',
              contactPhone: app.contactPhone || app.authorizedPerson?.phone || '',
              contactEmail: app.contactEmail || app.authorizedPerson?.email || '',

              // Payment Details - read directly from app
              bankName: app.bankName || '',
              accountNumber: app.accountNumber || '',
              branch: app.branch || '',
              currency: app.currency || '',
              creditPeriod: app.creditPeriod ? (() => {
                // Map number to string format (e.g., 7 -> "7 Days", 30 -> "30 Days")
                const periodMap = {
                  7: '7 Days',
                  14: '14 Days',
                  30: '30 Days',
                  60: '60 Days',
                  90: '90 Days'
                };
                return periodMap[app.creditPeriod] || `${app.creditPeriod} Days`;
              })() : '',

              // Entity Details
              entityType: mapEntityTypeToDisplay(app.entityType),
              serviceTypes: app.serviceTypes || app.serviceType || '',
              servicesDescription: app.servicesDescription || '',

              // Declarations (map from sourceOfFunds if direct fields don't exist)
              sourceOfWealth: app.sourceOfWealth || app.sourceOfFunds?.source || '',
              declarantFullName: app.declarantFullName || app.sourceOfFunds?.declarantName || '',
              declarantCapacity: app.declarantCapacity || app.sourceOfFunds?.declarantCapacity || '',
              declarantIdPassport: app.declarantIdPassport || app.sourceOfFunds?.declarantIdPassport || '',
              declarationDate: app.declarationDate || (app.sourceOfFunds?.declarationDate ? new Date(app.sourceOfFunds.declarationDate).toISOString().split('T')[0] : ''),
              consentToProcessing: app.consentToProcessing !== undefined ? app.consentToProcessing : (app.dataProcessingConsent?.granted || false),
              confirmInformationAccurate: app.confirmInformationAccurate || false,

              // File uploads - stored as filenames (strings) in database
              // Keep as strings so UI can display them, but they won't be File objects
              // Preserve filenames if they exist (non-empty strings), otherwise use null
              certificateOfIncorporation: (app.certificateOfIncorporation && typeof app.certificateOfIncorporation === 'string' && app.certificateOfIncorporation.trim() !== '') ? app.certificateOfIncorporation : null,
              kraPinCertificate: (app.kraPinCertificate && typeof app.kraPinCertificate === 'string' && app.kraPinCertificate.trim() !== '') ? app.kraPinCertificate : null,
              etimsProof: (app.etimsProof && typeof app.etimsProof === 'string' && app.etimsProof.trim() !== '') ? app.etimsProof : null,
              financialStatements: (app.financialStatements && typeof app.financialStatements === 'string' && app.financialStatements.trim() !== '') ? app.financialStatements : null,
              cr12: (app.cr12 && typeof app.cr12 === 'string' && app.cr12.trim() !== '') ? app.cr12 : null,
              companyProfile: (app.companyProfile && typeof app.companyProfile === 'string' && app.companyProfile.trim() !== '') ? app.companyProfile : null,
              bankReferenceLetter: (app.bankReferenceLetter && typeof app.bankReferenceLetter === 'string' && app.bankReferenceLetter.trim() !== '') ? app.bankReferenceLetter : null,
              // Partnership
              partnershipDeed: (app.partnershipDeed && typeof app.partnershipDeed === 'string' && app.partnershipDeed.trim() !== '') ? app.partnershipDeed : null,
              partnersPinCertificate: (app.partnersPinCertificate && typeof app.partnersPinCertificate === 'string' && app.partnersPinCertificate.trim() !== '') ? app.partnersPinCertificate : null,
              partnersTaxCompliance: (app.partnersTaxCompliance && typeof app.partnersTaxCompliance === 'string' && app.partnersTaxCompliance.trim() !== '') ? app.partnersTaxCompliance : null,
              partnerIds: Array.isArray(app.partnerIds) && app.partnerIds.length > 0 ? app.partnerIds.filter(f => f && typeof f === 'string' && f.trim() !== '') : [],

              // Foreign Company
              shareCertificate: (app.shareCertificate && typeof app.shareCertificate === 'string' && app.shareCertificate.trim() !== '') ? app.shareCertificate : null,
              registryExtract: (app.registryExtract && typeof app.registryExtract === 'string' && app.registryExtract.trim() !== '') ? app.registryExtract : null,
              taxComplianceCertificate: (app.taxComplianceCertificate && typeof app.taxComplianceCertificate === 'string' && app.taxComplianceCertificate.trim() !== '') ? app.taxComplianceCertificate : null,
              directorsNationalIds: Array.isArray(app.directorsNationalIds) && app.directorsNationalIds.length > 0 ? app.directorsNationalIds.filter(f => f && typeof f === 'string' && f.trim() !== '') : [],
              directorsPassports: Array.isArray(app.directorsPassports) && app.directorsPassports.length > 0 ? app.directorsPassports.filter(f => f && typeof f === 'string' && f.trim() !== '') : [],

              // Individual / Sole Proprietor
              nationalId: (app.nationalId && typeof app.nationalId === 'string' && app.nationalId.trim() !== '') ? app.nationalId : null,
              passportDocument: (app.passportDocument && typeof app.passportDocument === 'string' && app.passportDocument.trim() !== '') ? app.passportDocument : null,
              workPermit: (app.workPermit && typeof app.workPermit === 'string' && app.workPermit.trim() !== '') ? app.workPermit : null,
              policeClearance: (app.policeClearance && typeof app.policeClearance === 'string' && app.policeClearance.trim() !== '') ? app.policeClearance : null,
              resume: (app.resume && typeof app.resume === 'string' && app.resume.trim() !== '') ? app.resume : null,

              // Trust
              trustDeed: (app.trustDeed && typeof app.trustDeed === 'string' && app.trustDeed.trim() !== '') ? app.trustDeed : null,
              founderPin: (app.founderPin && typeof app.founderPin === 'string' && app.founderPin.trim() !== '') ? app.founderPin : null,
              foundersIds: Array.isArray(app.foundersIds) && app.foundersIds.length > 0 ? app.foundersIds.filter(f => f && typeof f === 'string' && f.trim() !== '') : [],
              beneficiariesIds: Array.isArray(app.beneficiariesIds) && app.beneficiariesIds.length > 0 ? app.beneficiariesIds.filter(f => f && typeof f === 'string' && f.trim() !== '') : [],

              directorsIds: Array.isArray(app.directorsIds) && app.directorsIds.length > 0 ? app.directorsIds.filter(f => f && typeof f === 'string' && f.trim() !== '') : [],
              practicingCertificates: Array.isArray(app.practicingCertificates) && app.practicingCertificates.length > 0 ? app.practicingCertificates.filter(f => f && typeof f === 'string' && f.trim() !== '') : [],
              keyMembersResumes: Array.isArray(app.keyMembersResumes) && app.keyMembersResumes.length > 0 ? app.keyMembersResumes.filter(f => f && typeof f === 'string' && f.trim() !== '') : [],
            };

            // Set form data - update all mapped fields
            setFormData(prev => {
              const updated = {
                ...prev,
                ...mappedData
              };
              console.log('Setting formData with file fields:', {
                certificateOfIncorporation: updated.certificateOfIncorporation,
                kraPinCertificate: updated.kraPinCertificate,
                etimsProof: updated.etimsProof,
                financialStatements: updated.financialStatements,
                cr12: updated.cr12,
                companyProfile: updated.companyProfile,
                bankReferenceLetter: updated.bankReferenceLetter,
                entityType: updated.entityType,
                directorsIds: updated.directorsIds,
                practicingCertificates: updated.practicingCertificates,
                keyMembersResumes: updated.keyMembersResumes
              });
              console.log('File field types after setting:', {
                certificateType: typeof updated.certificateOfIncorporation,
                certificateIsFile: updated.certificateOfIncorporation instanceof File,
                certificateIsString: typeof updated.certificateOfIncorporation === 'string',
                certificateValue: updated.certificateOfIncorporation
              });
              return updated;
            });

            // Check which fields match profile data and mark as prefilled
            // Fetch supplier profile to compare
            const checkPrefilledFields = async () => {
              try {
                const profileResponse = await api.get('/suppliers');
                const suppliers = profileResponse.data.data || [];
                if (suppliers.length > 0) {
                  const supplierData = suppliers[0];
                  const registeredFullName = user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`.trim()
                    : (user?.firstName || user?.lastName || '');

                  const address = supplierData.companyPhysicalAddress;
                  const fullAddress = address
                    ? `${address.street || ''}, ${address.city || ''}, ${address.country || ''}${address.postalCode ? `, ${address.postalCode}` : ''}`.replace(/^,\s*|,\s*$/g, '')
                    : supplierData.physicalAddress || '';

                  // Compare application data with profile data
                  const prefilled = [];
                  if (mappedData.contactFullName === registeredFullName) prefilled.push('contactFullName');
                  if (mappedData.contactRelationship === (supplierData.authorizedPerson?.relationship || '')) prefilled.push('contactRelationship');
                  if (mappedData.contactIdPassport === (supplierData.authorizedPerson?.idPassportNumber || '')) prefilled.push('contactIdPassport');
                  if (mappedData.contactPhone === (supplierData.authorizedPerson?.phone || '')) prefilled.push('contactPhone');
                  if (mappedData.contactEmail === (supplierData.authorizedPerson?.email || user?.email || '')) prefilled.push('contactEmail');
                  if (mappedData.supplierName === (supplierData.supplierName || '')) prefilled.push('supplierName');
                  if (mappedData.registeredCountry === (supplierData.registeredCountry || address?.country || '')) prefilled.push('registeredCountry');
                  if (mappedData.companyRegistrationNumber === (supplierData.companyRegistrationNumber || '')) prefilled.push('companyRegistrationNumber');
                  if (mappedData.companyEmail === (supplierData.companyEmail || '')) prefilled.push('companyEmail');
                  if (mappedData.companyWebsite === (supplierData.companyWebsite || '')) prefilled.push('companyWebsite');
                  if (mappedData.physicalAddress === fullAddress) prefilled.push('physicalAddress');

                  console.log('🟡 [PREFILL] Existing application - marking matching fields as prefilled:', prefilled);
                  setPrefilledFields(prefilled);
                }
              } catch (error) {
                console.error('Error checking prefilled fields:', error);
              }
            };

            checkPrefilledFields();

            // Set current month for date picker if date exists
            if (mappedData.declarationDate) {
              try {
                const date = parse(mappedData.declarationDate, 'yyyy-MM-dd', new Date());
                if (!isNaN(date.getTime())) {
                  setCurrentMonth(date);
                }
              } catch (e) {
                console.error('Error parsing date:', e);
              }
            }

            if (app.currentStep !== undefined && app.currentStep !== null) {
              setActiveStep(app.currentStep);
            }
          }
        } catch (error) {
          console.error('Error loading application:', error);
          toast.error('Error loading application');
        }
      };
      loadApplication();
    } else {
      // Prefill contact and company information with registered user's details for new applications
      if (user) {
        const registeredFullName = user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`.trim()
          : (user.firstName || user.lastName || '');

        // Try to fetch existing supplier data to prefill company details
        const fetchSupplierForPrefill = async () => {
          try {
            const response = await api.get('/suppliers');
            const suppliers = response.data.data || [];
            if (suppliers.length > 0) {
              const supplierData = suppliers[0];
              const address = supplierData.companyPhysicalAddress;
              const fullAddress = address
                ? `${address.street || ''}, ${address.city || ''}, ${address.country || ''}${address.postalCode ? `, ${address.postalCode}` : ''}`.replace(/^,\s*|,\s*$/g, '')
                : supplierData.physicalAddress || '';

              // Mark fields as prefilled - mark ALL fields that come from profile
              const prefilled = [];
              // Always mark contactFullName and contactEmail as prefilled (from user registration)
              prefilled.push('contactFullName');
              if (supplierData.authorizedPerson?.relationship) prefilled.push('contactRelationship');
              if (supplierData.authorizedPerson?.idPassportNumber) prefilled.push('contactIdPassport');
              if (supplierData.authorizedPerson?.phone) prefilled.push('contactPhone');
              prefilled.push('contactEmail'); // Always from user.email
              if (supplierData.supplierName) prefilled.push('supplierName');
              if (supplierData.registeredCountry || address?.country) prefilled.push('registeredCountry');
              if (supplierData.companyRegistrationNumber) prefilled.push('companyRegistrationNumber');
              if (supplierData.companyEmail) prefilled.push('companyEmail');
              if (supplierData.companyWebsite) prefilled.push('companyWebsite');
              if (fullAddress) prefilled.push('physicalAddress');

              console.log('🟡 [PREFILL] Marking fields as prefilled:', prefilled);

              setFormData(prev => ({
                ...prev,
                // Contact information
                contactFullName: registeredFullName,
                contactRelationship: supplierData.authorizedPerson?.relationship || '',
                contactIdPassport: supplierData.authorizedPerson?.idPassportNumber || '',
                contactPhone: supplierData.authorizedPerson?.phone || '',
                contactEmail: supplierData.authorizedPerson?.email || user.email || '',
                // Company information
                supplierName: supplierData.supplierName || '',
                registeredCountry: supplierData.registeredCountry || address?.country || '',
                companyRegistrationNumber: supplierData.companyRegistrationNumber || '',
                companyEmail: supplierData.companyEmail || '',
                companyWebsite: supplierData.companyWebsite || '',
                physicalAddress: fullAddress,
              }));

              // Store prefilled fields for read-only check - use array for React state
              setPrefilledFields(prefilled);
              console.log('🟡 [PREFILL] Set prefilledFields state:', prefilled);
            } else {
              // No supplier data, just prefill contact info
              const prefilled = ['contactFullName', 'contactEmail'];

              console.log('🟡 [PREFILL] No supplier data, marking contact fields as prefilled:', prefilled);

              setFormData(prev => ({
                ...prev,
                contactFullName: registeredFullName,
                contactEmail: user.email || '',
              }));

              // Store prefilled fields for read-only check
              setPrefilledFields(prefilled);
              console.log('🟡 [PREFILL] Set prefilledFields state:', prefilled);
            }
          } catch (error) {
            // On error, just prefill contact info
            const prefilled = ['contactFullName', 'contactEmail'];

            console.log('🟡 [PREFILL] Error case, marking contact fields as prefilled:', prefilled);

            setFormData(prev => ({
              ...prev,
              contactFullName: registeredFullName,
              contactEmail: user.email || '',
            }));

            // Store prefilled fields for read-only check
            setPrefilledFields(prefilled);
            console.log('🟡 [PREFILL] Set prefilledFields state:', prefilled);
          }
        };

        fetchSupplierForPrefill();
      }
    }
  }, [id, user]);

  useEffect(() => {
    if (!id && user?.role === 'supplier' && user?.supplierApprovalStatus !== 'approved') {
      toast.error('Your registration is awaiting procurement approval before you can start a new application.');
      navigate('/dashboard');
    }
  }, [id, navigate, user]);

  // Debug: Log prefilledFields to verify it's working
  useEffect(() => {
    if (prefilledFields.length > 0) {
      console.log('🔵 [PREFILL DEBUG] Current prefilledFields:', prefilledFields);
      console.log('🔵 [PREFILL DEBUG] Is contactFullName prefilled?', prefilledFields.includes('contactFullName'));
      console.log('🔵 [PREFILL DEBUG] Is supplierName prefilled?', prefilledFields.includes('supplierName'));
    }
  }, [prefilledFields]);

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      // First, ensure we have a supplier ID (create draft if needed)
      let currentSupplierId = applicationId;
      if (!currentSupplierId) {
        // Create a minimal draft to get supplier ID
        const draftPayload = {
          supplierName: formData.supplierName || 'Draft Application',
          legalNature: mapEntityTypeToLegalNature(formData.entityType),
          serviceType: formData.serviceTypes || 'professional_services',
          currentStep: activeStep,
          lastModified: new Date().toISOString()
        };
        const createResponse = await api.post('/suppliers/draft', draftPayload);
        if (createResponse.data.data?._id) {
          currentSupplierId = createResponse.data.data._id;
          setApplicationId(currentSupplierId);
        } else {
          throw new Error('Failed to create supplier draft');
        }
      }

      // Upload all files first
      const updatedFormData = await uploadAllFiles(currentSupplierId);
      setFormData(updatedFormData);

      const payload = {
        ...updatedFormData,
        legalNature: mapEntityTypeToLegalNature(updatedFormData.entityType),
        status: 'draft',
        currentStep: activeStep,
        lastModified: new Date().toISOString()
      };

      // Ensure file fields are strings (filenames) or null, not File objects
      const fileFields = [
        'certificateOfIncorporation', 'kraPinCertificate', 'etimsProof',
        'financialStatements', 'cr12', 'companyProfile', 'bankReferenceLetter',

        // Partnership
        'partnershipDeed', 'partnersPinCertificate', 'partnersTaxCompliance',

        // Foreign Company
        'shareCertificate', 'registryExtract', 'taxComplianceCertificate',

        // Individual / Sole Proprietor
        'nationalId', 'passportDocument', 'workPermit', 'policeClearance', 'resume',

        // Trust
        'trustDeed', 'founderPin'
      ];

      fileFields.forEach(field => {
        if (payload[field] instanceof File) {
          payload[field] = payload[field].name;
        } else if (payload[field] === undefined || payload[field] === null) {
          if (typeof updatedFormData[field] === 'string' && updatedFormData[field].trim() !== '') {
            payload[field] = updatedFormData[field];
          } else {
            payload[field] = null;
          }
        }
      });

      // Handle array file fields
      const arrayFileFields = [
        'directorsIds',
        'partnerIds',
        'directorsNationalIds',
        'directorsPassports',
        'foundersIds',
        'beneficiariesIds',
        'practicingCertificates',
        'keyMembersResumes'
      ];
      arrayFileFields.forEach(field => {
        if (Array.isArray(payload[field]) && payload[field].length > 0) {
          payload[field] = payload[field].map(file => {
            if (file instanceof File) {
              return file.name;
            }
            return file;
          }).filter(f => f && typeof f === 'string' && f.trim() !== '');
        } else if (payload[field] === undefined) {
          if (Array.isArray(updatedFormData[field]) && updatedFormData[field].length > 0) {
            payload[field] = updatedFormData[field].filter(f => f && typeof f === 'string' && f.trim() !== '');
          } else {
            payload[field] = [];
          }
        }
      });

      // Remove any null/undefined values that might cause issues, but keep empty strings
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === undefined) {
          // Keep null for file uploads, but convert undefined to empty string for text fields
          if (!key.includes('File') && !key.includes('Ids') && !key.includes('Certificates') && !key.includes('Resumes')) {
            payload[key] = '';
          }
        }
      });

      await api.put(`/suppliers/${currentSupplierId}`, payload);
      toast.success('Draft saved successfully!');
    } catch (error) {
      console.error('Save draft error:', error);
      toast.error(error.response?.data?.message || 'Error saving draft');
    } finally {
      setLoading(false);
    }
  };

  const validateRequiredDocuments = () => {
    const entityType = formData.entityType;
    const isSinglePresent = (v) =>
      v instanceof File || (typeof v === 'string' && v.trim() !== '');
    const isArrayPresent = (v) => Array.isArray(v) && v.length > 0;

    if (!entityType) {
      toast.error('Please select an entity type');
      return false;
    }

    const isCompanyLike = entityType === 'Private/Public Company';
    const isPartnership = entityType === 'Partnerships';
    const isForeign = entityType === 'Foreign Company';
    const isIndividual = entityType === 'Individual/Sole Proprietor';
    const isTrust = entityType === 'Trust';

    const missing = [];

    // Helper for nicer UX
    const requireSingle = (presentValue, label) => {
      if (!presentValue) missing.push(label);
    };
    const requireArray = (presentValue, label) => {
      if (!presentValue) missing.push(label);
    };

    if (isCompanyLike) {
      requireSingle(isSinglePresent(formData.certificateOfIncorporation), 'Certificate of incorporation or registration');
      requireSingle(isSinglePresent(formData.kraPinCertificate), 'PIN Certificate of entity');
      requireSingle(isSinglePresent(formData.etimsProof), 'Proof of registration on e-TIMS');
      requireSingle(isSinglePresent(formData.financialStatements), 'Current annual audited financial statements');
      requireSingle(isSinglePresent(formData.cr12), 'Valid CR12 (not more than 30 days old)');
      requireSingle(isSinglePresent(formData.companyProfile), 'Firm Company Profile');
      requireSingle(isSinglePresent(formData.bankReferenceLetter), 'Bank reference letter');
      requireArray(isArrayPresent(formData.directorsIds), "Directors' IDs/Copies of Passports");
    } else if (isPartnership) {
      requireSingle(isSinglePresent(formData.partnershipDeed), 'Partnership Deed');
      requireSingle(isSinglePresent(formData.partnersPinCertificate), 'PIN Certificate of partners');
      requireSingle(isSinglePresent(formData.partnersTaxCompliance), 'Valid tax compliance certificate for each partner');
      requireArray(isArrayPresent(formData.partnerIds), "Partners' IDs/Copies of Passports");
      requireSingle(isSinglePresent(formData.companyProfile), 'Firm Company Profile');
      requireSingle(isSinglePresent(formData.bankReferenceLetter), 'Bank reference letter');
      requireSingle(isSinglePresent(formData.financialStatements), 'Current annual audited financial statements');
      requireSingle(isSinglePresent(formData.etimsProof), 'Proof of registration on e-TIMS');
    } else if (isForeign) {
      requireSingle(isSinglePresent(formData.certificateOfIncorporation), 'Certificate of incorporation or registration');

      // share certificate OR registry extract
      const hasShare = isSinglePresent(formData.shareCertificate);
      const hasRegistry = isSinglePresent(formData.registryExtract);
      if (!hasShare && !hasRegistry) {
        missing.push('Valid share certificate or registry extract');
      }

      requireSingle(isSinglePresent(formData.taxComplianceCertificate), 'Valid tax compliance certificate');

      // directorsNationalIds OR directorsPassports
      const hasNationalIds = isArrayPresent(formData.directorsNationalIds);
      const hasPassports = isArrayPresent(formData.directorsPassports);
      if (!hasNationalIds && !hasPassports) {
        missing.push("Directors' National Identification documents or passport");
      }

      requireSingle(isSinglePresent(formData.companyProfile), 'Firm profile');
      requireSingle(isSinglePresent(formData.financialStatements), 'Current annual audited financial statements');
      requireSingle(isSinglePresent(formData.bankReferenceLetter), 'Bank reference letter');
    } else if (isIndividual) {
      // nationalId OR passportDocument
      const hasNationalId = isSinglePresent(formData.nationalId);
      const hasPassport = isSinglePresent(formData.passportDocument);
      if (!hasNationalId && !hasPassport) {
        missing.push('National Identification Card/ Passport');
      }

      requireSingle(isSinglePresent(formData.workPermit), 'Work permit (for foreigners)');
      requireSingle(isSinglePresent(formData.policeClearance), 'Police clearance certificate');
      requireSingle(isSinglePresent(formData.kraPinCertificate), 'PIN Certificate');
      requireSingle(isSinglePresent(formData.resume), 'Resume (Curriculum vitae)');
      requireSingle(isSinglePresent(formData.bankReferenceLetter), 'Bank reference letter');
      requireSingle(isSinglePresent(formData.etimsProof), 'Proof of registration on e-TIMS');
    } else if (isTrust) {
      requireSingle(isSinglePresent(formData.trustDeed), 'Trust Deed');
      requireSingle(isSinglePresent(formData.founderPin), 'PIN Certificate of Founders');
      requireArray(isArrayPresent(formData.foundersIds), "Founders' IDs/Copies of Passports");
      requireArray(isArrayPresent(formData.beneficiariesIds), 'Beneficaries IDs/Copies of Passport');
      requireSingle(isSinglePresent(formData.bankReferenceLetter), 'Bank reference letter');
      requireSingle(isSinglePresent(formData.financialStatements), 'Current annual audited financial statements');
    }

    if (missing.length > 0) {
      toast.error(`Missing required documents: ${missing.join(', ')}`);
      return false;
    }

    return true;
  };

  const handleSaveAndContinue = async () => {
    setLoading(true);
    try {
      if (activeStep === 1 || activeStep === steps.length - 1) {
        const ok = validateRequiredDocuments();
        if (!ok) {
          setLoading(false);
          return;
        }
      }

      // First, ensure we have a supplier ID (create draft if needed)
      let currentSupplierId = applicationId;
      if (!currentSupplierId) {
        // Create a minimal draft to get supplier ID
        const draftPayload = {
          supplierName: formData.supplierName || 'Draft Application',
          legalNature: mapEntityTypeToLegalNature(formData.entityType),
          serviceType: formData.serviceTypes || 'professional_services',
          currentStep: activeStep,
          lastModified: new Date().toISOString()
        };
        const createResponse = await api.post('/suppliers/draft', draftPayload);
        if (createResponse.data.data?._id) {
          currentSupplierId = createResponse.data.data._id;
          setApplicationId(currentSupplierId);
        } else {
          throw new Error('Failed to create supplier draft');
        }
      }

      // Upload all files first
      const updatedFormData = await uploadAllFiles(currentSupplierId);
      setFormData(updatedFormData);

      // Create payload with ALL form data from all steps (now with uploaded filenames)
      const payload = {
        ...updatedFormData,
        legalNature: mapEntityTypeToLegalNature(updatedFormData.entityType),
        status: activeStep === steps.length - 1 ? 'submitted' : 'draft',
        currentStep: activeStep, // Save the current step the user is on
        lastModified: new Date().toISOString()
      };

      // Ensure file fields are strings (filenames) or null, not File objects
      const fileFields = [
        'certificateOfIncorporation', 'kraPinCertificate', 'etimsProof',
        'financialStatements', 'cr12', 'companyProfile', 'bankReferenceLetter',

        // Partnership
        'partnershipDeed', 'partnersPinCertificate', 'partnersTaxCompliance',

        // Foreign Company
        'shareCertificate', 'registryExtract', 'taxComplianceCertificate',

        // Individual / Sole Proprietor
        'nationalId', 'passportDocument', 'workPermit', 'policeClearance', 'resume',

        // Trust
        'trustDeed', 'founderPin'
      ];

      fileFields.forEach(field => {
        if (payload[field] instanceof File) {
          // This shouldn't happen after upload, but handle it just in case
          payload[field] = payload[field].name;
        } else if (payload[field] === undefined || payload[field] === null) {
          // Preserve existing filename if it's a non-empty string, otherwise keep null
          if (typeof updatedFormData[field] === 'string' && updatedFormData[field].trim() !== '') {
            payload[field] = updatedFormData[field];
          } else {
            payload[field] = null;
          }
        }
      });

      // Handle array file fields
      const arrayFileFields = [
        'directorsIds',
        'partnerIds',
        'directorsNationalIds',
        'directorsPassports',
        'foundersIds',
        'beneficiariesIds',
        'practicingCertificates',
        'keyMembersResumes'
      ];
      arrayFileFields.forEach(field => {
        if (Array.isArray(payload[field]) && payload[field].length > 0) {
          // Ensure all items are strings (filenames), not File objects
          payload[field] = payload[field].map(file => {
            if (file instanceof File) {
              return file.name;
            }
            return file;
          }).filter(f => f && typeof f === 'string' && f.trim() !== '');
        } else if (payload[field] === undefined) {
          // Preserve existing array if it has valid filenames
          if (Array.isArray(updatedFormData[field]) && updatedFormData[field].length > 0) {
            payload[field] = updatedFormData[field].filter(f => f && typeof f === 'string' && f.trim() !== '');
          } else {
            payload[field] = [];
          }
        }
      });

      // Ensure all fields are included, even if empty
      // Remove undefined values but keep empty strings, null for files, and false for booleans
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          // Convert undefined to empty string for text fields, keep null for file uploads
          if (!key.includes('File') && !key.includes('Ids') && !key.includes('Certificates') && !key.includes('Resumes')) {
            payload[key] = '';
          } else {
            payload[key] = null;
          }
        }
      });

      console.log('Saving payload with all fields:', Object.keys(payload));
      console.log('File fields being saved:', {
        certificateOfIncorporation: payload.certificateOfIncorporation,
        kraPinCertificate: payload.kraPinCertificate,
        etimsProof: payload.etimsProof,
        entityType: payload.entityType,
        directorsIds: payload.directorsIds,
        practicingCertificates: payload.practicingCertificates,
        keyMembersResumes: payload.keyMembersResumes
      });
      console.log('Full payload file fields check:', {
        hasCertificate: !!payload.certificateOfIncorporation,
        hasKraPin: !!payload.kraPinCertificate,
        hasEtims: !!payload.etimsProof,
        hasFinancial: !!payload.financialStatements,
        hasCr12: !!payload.cr12,
        hasProfile: !!payload.companyProfile,
        hasBankRef: !!payload.bankReferenceLetter,
        directorsCount: Array.isArray(payload.directorsIds) ? payload.directorsIds.length : 0
      });

      // Check if this is the last step (submission)
      if (activeStep === steps.length - 1) {
        // Submit application - save data and submit
        payload.status = 'submitted';
        await api.put(`/suppliers/${currentSupplierId}`, payload);
        await api.post(`/suppliers/${currentSupplierId}/submit`, payload);
        toast.success('Application submitted successfully!');
        navigate('/dashboard');
      } else {
        // Not the last step - save and continue
        await api.put(`/suppliers/${currentSupplierId}`, payload);

        // Move to next step
        const nextStep = activeStep + 1;
        setActiveStep(nextStep);
        toast.success('Progress saved!');
      }
    } catch (error) {
      console.error('Save and continue error:', error);
      toast.error(error.response?.data?.message || 'Error saving application');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = async () => {
    if (activeStep > 0) {
      // Save current form data before navigating back to ensure nothing is lost
      if (applicationId) {
        try {
          // Create payload with current form data
          const payload = {
            ...formData,
            currentStep: activeStep,
            lastModified: new Date().toISOString()
          };

          // Handle file objects - extract filenames for storage
          const fileFields = [
            'certificateOfIncorporation', 'kraPinCertificate', 'etimsProof',
            'financialStatements', 'cr12', 'companyProfile', 'bankReferenceLetter',

            // Partnership
            'partnershipDeed', 'partnersPinCertificate', 'partnersTaxCompliance',

            // Foreign Company
            'shareCertificate', 'registryExtract', 'taxComplianceCertificate',

            // Individual / Sole Proprietor
            'nationalId', 'passportDocument', 'workPermit', 'policeClearance', 'resume',

            // Trust
            'trustDeed', 'founderPin'
          ];

          fileFields.forEach(field => {
            if (payload[field] instanceof File) {
              // Convert File object to filename string
              payload[field] = payload[field].name;
            } else if (payload[field] === undefined || payload[field] === null) {
              // Preserve existing filename if it's a string, otherwise keep null
              // This ensures that when navigating, we don't lose previously saved filenames
              if (typeof formData[field] === 'string' && formData[field].trim() !== '') {
                payload[field] = formData[field];
              } else {
                payload[field] = null;
              }
            }
            // If payload[field] is already a string (from previous load), keep it as is
          });

          // Handle array file fields
          const arrayFileFields = [
            'directorsIds',
            'partnerIds',
            'directorsNationalIds',
            'directorsPassports',
            'foundersIds',
            'beneficiariesIds',
            'practicingCertificates',
            'keyMembersResumes'
          ];
          arrayFileFields.forEach(field => {
            if (Array.isArray(payload[field]) && payload[field].length > 0) {
              if (payload[field][0] instanceof File) {
                payload[field] = payload[field].map(file => file.name);
              }
            } else if (payload[field] === undefined) {
              payload[field] = Array.isArray(formData[field]) ? formData[field] : [];
            }
          });

          // Update currentStep to the previous step
          const previousStep = activeStep - 1;
          payload.currentStep = previousStep;

          // Save silently (no toast) to avoid interrupting navigation
          await api.put(`/suppliers/${applicationId}`, payload);
        } catch (error) {
          console.error('Error saving before navigating back:', error);
          // Continue with navigation even if save fails
        }
      }

      // Navigate to previous step - formData will remain intact
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
                    onChange={(e) => {
                      if (!prefilledFields.includes('supplierName')) {
                        handleChange('supplierName', e.target.value);
                      }
                    }}
                    disabled={prefilledFields.includes('supplierName')}
                    InputProps={{
                      readOnly: prefilledFields.includes('supplierName')
                    }}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#fff',
                        ...(prefilledFields.includes('supplierName') && {
                          cursor: 'not-allowed',
                          '& .MuiInputBase-input': {
                            cursor: 'not-allowed',
                          }
                        })
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
                        disabled={prefilledFields.includes('registeredCountry')}
                        onClick={(e) => {
                          if (!prefilledFields.includes('registeredCountry')) {
                            setCountryAnchorEl(e.currentTarget);
                            setCountrySearchOpen(!countrySearchOpen);
                            setCountrySearchTerm('');
                          }
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
                            cursor: prefilledFields.includes('registeredCountry') ? 'not-allowed' : 'pointer',
                            ...(prefilledFields.includes('registeredCountry') && {
                              '& .MuiInputBase-input': {
                                cursor: 'not-allowed',
                              }
                            })
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
                                    if (!prefilledFields.includes('registeredCountry')) {
                                      handleChange('registeredCountry', country.name);
                                      setCountrySearchOpen(false);
                                      setCountrySearchTerm('');
                                    }
                                  }}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    px: 1.5,
                                    py: 1.25,
                                    cursor: prefilledFields.includes('registeredCountry') ? 'not-allowed' : 'pointer',
                                    borderRadius: '4px',
                                    ...(prefilledFields.includes('registeredCountry') && {
                                      opacity: 0.6,
                                      pointerEvents: 'none'
                                    }),
                                    '&:hover': {
                                      backgroundColor: prefilledFields.includes('registeredCountry') ? 'transparent' : '#f9fafb'
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
                    onChange={(e) => {
                      if (!prefilledFields.includes('companyRegistrationNumber')) {
                        handleChange('companyRegistrationNumber', e.target.value);
                      }
                    }}
                    disabled={prefilledFields.includes('companyRegistrationNumber')}
                    InputProps={{
                      readOnly: prefilledFields.includes('companyRegistrationNumber')
                    }}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#fff',
                        ...(prefilledFields.includes('companyRegistrationNumber') && {
                          cursor: 'not-allowed',
                          '& .MuiInputBase-input': {
                            cursor: 'not-allowed',
                          }
                        })
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
                    onChange={(e) => {
                      if (!prefilledFields.includes('companyEmail')) {
                        handleChange('companyEmail', e.target.value);
                      }
                    }}
                    disabled={prefilledFields.includes('companyEmail')}
                    InputProps={{
                      readOnly: prefilledFields.includes('companyEmail')
                    }}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#fff',
                        ...(prefilledFields.includes('companyEmail') && {
                          cursor: 'not-allowed',
                          '& .MuiInputBase-input': {
                            cursor: 'not-allowed',
                          }
                        })
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
                    onChange={(e) => {
                      if (!prefilledFields.includes('companyWebsite')) {
                        handleChange('companyWebsite', e.target.value);
                      }
                    }}
                    disabled={prefilledFields.includes('companyWebsite')}
                    InputProps={{
                      readOnly: prefilledFields.includes('companyWebsite')
                    }}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#fff',
                        ...(prefilledFields.includes('companyWebsite') && {
                          cursor: 'not-allowed',
                          '& .MuiInputBase-input': {
                            cursor: 'not-allowed',
                          }
                        })
                      }
                    }}
                  />
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
                    onChange={(e) => {
                      if (!prefilledFields.includes('physicalAddress')) {
                        handleChange('physicalAddress', e.target.value);
                      }
                    }}
                    placeholder="Type your physical address here. Be as detailed as possible"
                    disabled={prefilledFields.includes('physicalAddress')}
                    InputProps={{
                      readOnly: prefilledFields.includes('physicalAddress')
                    }}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#fff',
                        ...(prefilledFields.includes('physicalAddress') && {
                          cursor: 'not-allowed',
                          '& .MuiInputBase-input': {
                            cursor: 'not-allowed',
                          }
                        })
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
                    onChange={(e) => {
                      if (!prefilledFields.includes('contactFullName')) {
                        handleChange('contactFullName', e.target.value);
                      }
                    }}
                    disabled={prefilledFields.includes('contactFullName')}
                    InputProps={{
                      readOnly: prefilledFields.includes('contactFullName')
                    }}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#fff',
                        ...(prefilledFields.includes('contactFullName') && {
                          cursor: 'not-allowed',
                          '& .MuiInputBase-input': {
                            cursor: 'not-allowed',
                          }
                        })
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
                    onChange={(e) => {
                      if (!prefilledFields.includes('contactRelationship')) {
                        handleChange('contactRelationship', e.target.value);
                      }
                    }}
                    placeholder="e.g. CEO, CFO"
                    disabled={prefilledFields.includes('contactRelationship')}
                    InputProps={{
                      readOnly: prefilledFields.includes('contactRelationship')
                    }}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#fff',
                        ...(prefilledFields.includes('contactRelationship') && {
                          cursor: 'not-allowed',
                          '& .MuiInputBase-input': {
                            cursor: 'not-allowed',
                          }
                        })
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
                    onChange={(e) => {
                      if (!prefilledFields.includes('contactIdPassport')) {
                        handleChange('contactIdPassport', e.target.value);
                      }
                    }}
                    disabled={prefilledFields.includes('contactIdPassport')}
                    InputProps={{
                      readOnly: prefilledFields.includes('contactIdPassport')
                    }}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#fff',
                        ...(prefilledFields.includes('contactIdPassport') && {
                          cursor: 'not-allowed',
                          '& .MuiInputBase-input': {
                            cursor: 'not-allowed',
                          }
                        })
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
                    onChange={(e) => {
                      if (!prefilledFields.includes('contactPhone')) {
                        handleChange('contactPhone', e.target.value);
                      }
                    }}
                    placeholder="e.g +254712345678"
                    disabled={prefilledFields.includes('contactPhone')}
                    InputProps={{
                      readOnly: prefilledFields.includes('contactPhone')
                    }}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#fff',
                        ...(prefilledFields.includes('contactPhone') && {
                          cursor: 'not-allowed',
                          '& .MuiInputBase-input': {
                            cursor: 'not-allowed',
                          }
                        })
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
                    onChange={(e) => {
                      if (!prefilledFields.includes('contactEmail')) {
                        handleChange('contactEmail', e.target.value);
                      }
                    }}
                    disabled={prefilledFields.includes('contactEmail')}
                    InputProps={{
                      readOnly: prefilledFields.includes('contactEmail')
                    }}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#fff',
                        ...(prefilledFields.includes('contactEmail') && {
                          cursor: 'not-allowed',
                          '& .MuiInputBase-input': {
                            cursor: 'not-allowed',
                          }
                        })
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

      case 1: {
        const entityType = formData.entityType;
        const isCompanyLike = entityType === 'Private/Public Company';
        const isPartnership = entityType === 'Partnerships';
        const isForeignCompany = entityType === 'Foreign Company';
        const isIndividual = entityType === 'Individual/Sole Proprietor';
        const isTrust = entityType === 'Trust';

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
                      {entityTypes.map((type) => (
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
                    sx={{
                      mb: 2,
                      fontWeight: 600,
                      fontSize: '16px',
                      color: '#111827',
                      mt: 3
                    }}
                  >
                    Required Documents
                  </Typography>
                </Grid>

                {/* Required Documents - Dynamically Balanced Two Columns */}
                {(() => {
                  const documents = getRequiredDocuments();
                  const midpoint = Math.ceil(documents.length / 2);
                  const leftDocs = documents.slice(0, midpoint);
                  const rightDocs = documents.slice(midpoint);

                  return (
                    <>
                      <Grid item xs={12} md={6}>
                        {leftDocs.map((doc, idx) => (
                          <div key={`left-${idx}`}>
                            {renderDocument(doc)}
                          </div>
                        ))}
                      </Grid>

                      {rightDocs.length > 0 && (
                        <Grid item xs={12} md={6}>
                          {rightDocs.map((doc, idx) => (
                            <div key={`right-${idx}`}>
                              {renderDocument(doc)}
                            </div>
                          ))}
                        </Grid>
                      )}
                    </>
                  );
                })()}

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
                      {serviceTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Practicing Certificates Upload Area */}
                <Grid item xs={12}>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    Practicing Certificates
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ mb: 1.5, fontSize: '12px', color: '#9ca3af', display: 'block' }}
                  >
                    Please select up to 10 files
                  </Typography>
                  <Box
                    component="label"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed #d1d5db',
                      borderRadius: '8px',
                      p: 4,
                      cursor: 'pointer',
                      backgroundColor: '#fafafa',
                      '&:hover': {
                        borderColor: '#9ca3af',
                        backgroundColor: '#f9fafb'
                      }
                    }}
                  >
                    <input
                      type="file"
                      multiple
                      hidden
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const files = Array.from(e.target.files).slice(0, 10); // Limit to 10 files
                          if (files.length < e.target.files.length) {
                            toast.warning(`Only the first 10 files will be uploaded. ${e.target.files.length - files.length} file(s) ignored.`);
                          }
                          handleChange('practicingCertificates', files);
                        }
                      }}
                      onClick={(e) => {
                        e.target.value = '';
                      }}
                    />
                    <Box
                      component="img"
                      src="/images/upload.svg"
                      alt="Upload icon"
                      sx={{ width: 40, height: 40, mb: 1.5 }}
                    />
                    <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151', mb: 0.5 }}>
                      Upload files
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#6b7280' }}>
                      Click here or drag and drop to upload
                    </Typography>
                    {formData.practicingCertificates && formData.practicingCertificates.length > 0 && (
                      <Typography sx={{ fontSize: '12px', color: theme.palette.green.main, mt: 1, fontWeight: 500 }}>
                        {formData.practicingCertificates.length} file(s) selected
                        {formData.practicingCertificates[0] instanceof File === false && formData.practicingCertificates[0] && (
                          <span> ({typeof formData.practicingCertificates[0] === 'string' ? 'Previously saved' : ''})</span>
                        )}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Key Member's Resumes Upload Area */}
                <Grid item xs={12}>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    Key Member's Resumes
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ mb: 1.5, fontSize: '12px', color: '#9ca3af', display: 'block' }}
                  >
                    Please select up to 10 files
                  </Typography>
                  <Box
                    component="label"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed #d1d5db',
                      borderRadius: '8px',
                      p: 4,
                      cursor: 'pointer',
                      backgroundColor: '#fafafa',
                      '&:hover': {
                        borderColor: '#9ca3af',
                        backgroundColor: '#f9fafb'
                      }
                    }}
                  >
                    <input
                      type="file"
                      multiple
                      hidden
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const files = Array.from(e.target.files).slice(0, 10); // Limit to 10 files
                          if (files.length < e.target.files.length) {
                            toast.warning(`Only the first 10 files will be uploaded. ${e.target.files.length - files.length} file(s) ignored.`);
                          }
                          handleChange('keyMembersResumes', files);
                        }
                      }}
                      onClick={(e) => {
                        e.target.value = '';
                      }}
                    />
                    <Box
                      component="img"
                      src="/images/upload.svg"
                      alt="Upload icon"
                      sx={{ width: 40, height: 40, mb: 1.5 }}
                    />
                    <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151', mb: 0.5 }}>
                      Upload files
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#6b7280' }}>
                      Click here or drag and drop to upload
                    </Typography>
                    {formData.keyMembersResumes && formData.keyMembersResumes.length > 0 && (
                      <Typography sx={{ fontSize: '12px', color: theme.palette.green.main, mt: 1, fontWeight: 500 }}>
                        {formData.keyMembersResumes.length} file(s) selected
                        {formData.keyMembersResumes[0] instanceof File === false && formData.keyMembersResumes[0] && (
                          <span> ({typeof formData.keyMembersResumes[0] === 'string' ? 'Previously saved' : ''})</span>
                        )}
                      </Typography>
                    )}
                  </Box>
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
                    placeholder="Describe the services your company provides. Be as detailed as possible"
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
      }

      case 2:
        return (
          <Box>
            {/* Source of Funds Declaration Section */}
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
                  mb: 2,
                  fontSize: '18px',
                  color: '#111827'
                }}
              >
                Source of Funds Declaration & Processing of Personal Information
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: '#374151',
                  fontSize: '14px',
                  mb: 3,
                  lineHeight: 1.6
                }}
              >
                I, in my personal capacity/representative capacity, hereby declare and confirm that the funds paid and/or to be paid, by the entity to offer goods/services with Shop and Deliver Limited have not been derived from any criminal activities of any nature whatsoever.
              </Typography>

              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    Source of wealth/Funds
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={formData.sourceOfWealth}
                      onChange={(e) => handleChange('sourceOfWealth', e.target.value)}
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
                      <MenuItem value="salary">Salary</MenuItem>
                      <MenuItem value="business_income">Business Income</MenuItem>
                      <MenuItem value="investment">Investment</MenuItem>
                      <MenuItem value="inheritance">Inheritance</MenuItem>
                      <MenuItem value="loan">Loan</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    Full Name of Declarant
                  </Typography>
                  <TextField
                    fullWidth
                    value={formData.declarantFullName}
                    onChange={(e) => handleChange('declarantFullName', e.target.value)}
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
                    Capacity
                  </Typography>
                  <TextField
                    fullWidth
                    value={formData.declarantCapacity}
                    onChange={(e) => handleChange('declarantCapacity', e.target.value)}
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
                    value={formData.declarantIdPassport}
                    onChange={(e) => handleChange('declarantIdPassport', e.target.value)}
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
                    Date
                  </Typography>
                  <ClickAwayListener onClickAway={() => setDatePickerOpen(false)}>
                    <Box sx={{ position: 'relative' }}>
                      <TextField
                        fullWidth
                        type="text"
                        value={formatDateForDisplay(formData.declarationDate)}
                        onClick={handleDateClick}
                        size="small"
                        readOnly
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarToday sx={{ color: '#6b7280' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            '& input': {
                              cursor: 'pointer',
                            }
                          }
                        }}
                      />

                      {datePickerOpen && (
                        <Paper
                          sx={{
                            mt: 0.5,
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            zIndex: 1300,
                            backgroundColor: '#fff',
                            minWidth: '300px',
                          }}
                        >
                          {/* Calendar Header */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid #e5e7eb' }}>
                            <IconButton
                              size="small"
                              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                              sx={{ color: '#6b7280' }}
                            >
                              <NavigateBefore />
                            </IconButton>
                            <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#111827' }}>
                              {format(currentMonth, 'MMMM yyyy')}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                              sx={{ color: '#6b7280' }}
                            >
                              <NavigateNext />
                            </IconButton>
                          </Box>

                          {/* Calendar Days Header */}
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, p: 1, backgroundColor: '#f9fafb' }}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                              <Typography
                                key={day}
                                sx={{
                                  textAlign: 'center',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: '#6b7280',
                                  py: 1
                                }}
                              >
                                {day}
                              </Typography>
                            ))}
                          </Box>

                          {/* Calendar Days */}
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, p: 1 }}>
                            {calendarDays().map((day, idx) => {
                              const isCurrentMonth = isSameMonth(day, currentMonth);
                              let isSelected = false;
                              if (formData.declarationDate) {
                                try {
                                  const selectedDate = parse(formData.declarationDate, 'yyyy-MM-dd', new Date());
                                  isSelected = isSameDay(day, selectedDate);
                                } catch (e) {
                                  // Invalid date format
                                }
                              }
                              const isToday = isSameDay(day, new Date());

                              return (
                                <Box
                                  key={idx}
                                  onClick={() => isCurrentMonth && handleDateSelect(day)}
                                  sx={{
                                    aspectRatio: '1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: isCurrentMonth ? 'pointer' : 'default',
                                    borderRadius: '4px',
                                    backgroundColor: isSelected ? theme.palette.green.main : 'transparent',
                                    color: isSelected ? '#fff' : isToday && isCurrentMonth ? theme.palette.green.main : isCurrentMonth ? '#374151' : '#d1d5db',
                                    fontWeight: isToday || isSelected ? 700 : 400,
                                    border: isToday && !isSelected ? `1.5px solid ${theme.palette.green.main}` : '1.5px solid transparent',
                                    fontSize: '14px',
                                    '&:hover': {
                                      backgroundColor: isCurrentMonth && !isSelected ? '#f3f4f6' : undefined,
                                    }
                                  }}
                                >
                                  {format(day, 'd')}
                                </Box>
                              );
                            })}
                          </Box>
                        </Paper>
                      )}
                    </Box>
                  </ClickAwayListener>
                </Grid>

                {/* Checkboxes */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.consentToProcessing}
                        onChange={(e) => handleChange('consentToProcessing', e.target.checked)}
                        sx={{
                          color: theme.palette.green.main,
                          '&.Mui-checked': {
                            color: theme.palette.green.main,
                          }
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '14px', color: '#374151' }}>
                        I consent to the processing of my personal information in accordance with the{' '}
                        <Link href="#" sx={{ color: theme.palette.green.main, textDecoration: 'underline' }}>
                          privacy policy
                        </Link>
                        {' '}and applicable data protection laws.
                      </Typography>
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.confirmInformationAccurate}
                        onChange={(e) => handleChange('confirmInformationAccurate', e.target.checked)}
                        sx={{
                          color: theme.palette.green.main,
                          '&.Mui-checked': {
                            color: theme.palette.green.main,
                          }
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '14px', color: '#374151' }}>
                        I confirm that all information provided is true and accurate to the best of my knowledge.
                      </Typography>
                    }
                  />
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );

      case 3:
        return (
          <Box>
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
                Review Application
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#6b7280',
                  fontSize: '14px',
                  mb: 3
                }}
              >
                Confirm your application is okay before submitting
              </Typography>

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
                        Registered Country
                      </Typography>
                      <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                        {formData.registeredCountry || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                        Company Email Address
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
                        Company Registration Number
                      </Typography>
                      <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                        {formData.companyRegistrationNumber || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                        Physical Address
                      </Typography>
                      <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                        {formData.physicalAddress || '-'}
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
                        Full name
                      </Typography>
                      <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                        {formData.contactFullName || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                        Relationship to Entity
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
                        Phone number
                      </Typography>
                      <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                        {formData.contactPhone || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                        Email address
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
                        Bank name
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
                        Currency
                      </Typography>
                      <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                        {formData.currency || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                        Applicable Credit Period
                      </Typography>
                      <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                        {formData.creditPeriod || '-'}
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
                  <Grid container spacing={2.5}>
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                        Entity type
                      </Typography>
                      <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151', mb: 2 }}>
                        {formData.entityType || '-'}
                      </Typography>
                    </Grid>

                    {/* Certificate of Incorporation Documents */}
                    {(() => {
                      const renderDocumentCard = (fileName, documentName) => {
                        if (!fileName) return null;
                        const fileExtension = (fileName instanceof File ? fileName.name : typeof fileName === 'string' ? fileName : '').split('.').pop()?.toUpperCase() || 'PDF';

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
                                  {fileExtension} • {fileName instanceof File && fileName.size ? `${(fileName.size / (1024 * 1024)).toFixed(1)} MB` : '2.3 MB'}
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
                            : documentName;
                          const fileExtension = (file instanceof File ? file.name : typeof file === 'string' ? file : '').split('.').pop()?.toUpperCase() || 'PDF';

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
                                    {fileExtension} • {file instanceof File && file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '2.3 MB'}
                                  </Typography>
                                </Box>
                              </Box>
                              <IconButton
                                size="small"
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

                      return (() => {
                        const entityType = formData.entityType;
                        const isCompanyLike = entityType === 'Private/Public Company';
                        const isPartnership = entityType === 'Partnerships';
                        const isForeignCompany = entityType === 'Foreign Company';
                        const isIndividual = entityType === 'Individual/Sole Proprietor';
                        const isTrust = entityType === 'Trust';

                        return (
                          <Grid item xs={12}>
                            {isCompanyLike && (
                              <>
                                {renderDocumentCard(formData.certificateOfIncorporation, 'Certificate of Incorporation')}
                                {renderDocumentCard(formData.kraPinCertificate, 'PIN Certificate of entity')}
                                {renderDocumentCard(formData.etimsProof, 'Proof of registration on e-TIMS')}
                                {renderDocumentCard(formData.financialStatements, 'Current annual audited financial statements')}
                                {renderDocumentCard(formData.cr12, 'Valid CR12 (not more than 30 days old)')}
                                {renderDocumentCard(formData.companyProfile, 'Firm Company Profile')}
                                {renderDocumentCard(formData.bankReferenceLetter, 'Bank reference letter')}
                                {formData.directorsIds?.length > 0 && renderMultipleDocumentCards(formData.directorsIds, "Directors' IDs/Passports")}
                              </>
                            )}

                            {isPartnership && (
                              <>
                                {renderDocumentCard(formData.partnershipDeed, 'Partnership Deed')}
                                {renderDocumentCard(formData.partnersPinCertificate, 'PIN Certificate of partners')}
                                {renderDocumentCard(formData.partnersTaxCompliance, 'Valid tax compliance certificate for each partner')}
                                {renderDocumentCard(formData.companyProfile, 'Firm Company Profile')}
                                {renderDocumentCard(formData.bankReferenceLetter, 'Bank reference letter')}
                                {renderDocumentCard(formData.financialStatements, 'Current annual audited financial statements')}
                                {renderDocumentCard(formData.etimsProof, 'Proof of registration on e-TIMS')}
                                {formData.partnerIds?.length > 0 && renderMultipleDocumentCards(formData.partnerIds, "Partners' IDs/Passports")}
                              </>
                            )}

                            {isForeignCompany && (
                              <>
                                {renderDocumentCard(formData.certificateOfIncorporation, 'Certificate of Incorporation')}
                                {renderDocumentCard(formData.shareCertificate, 'Valid share certificate')}
                                {renderDocumentCard(formData.registryExtract, 'Valid registry extract')}
                                {renderDocumentCard(formData.taxComplianceCertificate, 'Valid tax compliance certificate')}
                                {renderDocumentCard(formData.companyProfile, 'Firm profile')}
                                {renderDocumentCard(formData.financialStatements, 'Current annual audited financial statements')}
                                {renderDocumentCard(formData.bankReferenceLetter, 'Bank reference letter')}
                                {formData.directorsNationalIds?.length > 0 && renderMultipleDocumentCards(formData.directorsNationalIds, "Directors' National IDs")}
                                {formData.directorsPassports?.length > 0 && renderMultipleDocumentCards(formData.directorsPassports, "Directors' Passports")}
                              </>
                            )}

                            {isIndividual && (
                              <>
                                {renderDocumentCard(formData.nationalId, 'National Identification Card')}
                                {renderDocumentCard(formData.passportDocument, 'Passport')}
                                {renderDocumentCard(formData.workPermit, 'Work permit (for foreigners)')}
                                {renderDocumentCard(formData.policeClearance, 'Police clearance certificate')}
                                {renderDocumentCard(formData.kraPinCertificate, 'PIN Certificate')}
                                {renderDocumentCard(formData.resume, 'Resume (Curriculum vitae)')}
                                {renderDocumentCard(formData.bankReferenceLetter, 'Bank reference letter')}
                                {renderDocumentCard(formData.etimsProof, 'Proof of registration on e-TIMS')}
                              </>
                            )}

                            {isTrust && (
                              <>
                                {renderDocumentCard(formData.trustDeed, 'Trust Deed')}
                                {renderDocumentCard(formData.founderPin, 'PIN Certificate of Founders')}
                                {renderDocumentCard(formData.bankReferenceLetter, 'Bank reference letter')}
                                {renderDocumentCard(formData.financialStatements, 'Current annual audited financial statements')}
                                {formData.foundersIds?.length > 0 && renderMultipleDocumentCards(formData.foundersIds, "Founders' IDs/Passports")}
                                {formData.beneficiariesIds?.length > 0 && renderMultipleDocumentCards(formData.beneficiariesIds, 'Beneficaries IDs/Passport')}
                              </>
                            )}
                          </Grid>
                        );
                      })();
                    })()}
                  </Grid>
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
                  <Grid container spacing={2.5}>
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                        Types of Services Being Offered
                      </Typography>
                      <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151', mb: 2 }}>
                        {formData.serviceTypes || '-'}
                      </Typography>
                    </Grid>

                    {/* Service Documents */}
                    {(() => {
                      const renderDocumentCard = (fileName, documentName) => {
                        if (!fileName) return null;
                        const fileExtension = (fileName instanceof File ? fileName.name : typeof fileName === 'string' ? fileName : '').split('.').pop()?.toUpperCase() || 'PDF';

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
                                  {fileExtension} • {fileName instanceof File && fileName.size ? `${(fileName.size / (1024 * 1024)).toFixed(1)} MB` : '2.3 MB'}
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
                            : documentName;
                          const fileExtension = (file instanceof File ? file.name : typeof file === 'string' ? file : '').split('.').pop()?.toUpperCase() || 'PDF';

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
                                    {fileExtension} • {file instanceof File && file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '2.3 MB'}
                                  </Typography>
                                </Box>
                              </Box>
                              <IconButton
                                size="small"
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
                        <Grid item xs={12}>
                          {/* Practicing Certificates */}
                          {formData.practicingCertificates && formData.practicingCertificates.length > 0 && renderMultipleDocumentCards(formData.practicingCertificates, 'Practicing Certificate')}
                          {/* Key Member's Resumes */}
                          {formData.keyMembersResumes && formData.keyMembersResumes.length > 0 && renderMultipleDocumentCards(formData.keyMembersResumes, 'Resume')}
                        </Grid>
                      );
                    })()}
                  </Grid>
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
                        {formData.declarationDate ? (() => {
                          try {
                            const date = parse(formData.declarationDate, 'yyyy-MM-dd', new Date());
                            if (!isNaN(date.getTime())) {
                              return format(date, 'do MMMM, yyyy');
                            }
                            return formatDateForDisplay(formData.declarationDate);
                          } catch (e) {
                            return formatDateForDisplay(formData.declarationDate) || '-';
                          }
                        })() : '-'}
                      </Typography>
                    </Grid>
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
                        {formData.declarationDate ? (() => {
                          try {
                            const date = parse(formData.declarationDate, 'yyyy-MM-dd', new Date());
                            if (!isNaN(date.getTime())) {
                              return format(date, 'do MMMM, yyyy');
                            }
                            return formatDateForDisplay(formData.declarationDate);
                          } catch (e) {
                            return formatDateForDisplay(formData.declarationDate) || '-';
                          }
                        })() : '-'}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Paper>
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
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', alignItems: 'center', mb: 3 }}>
            {steps.map((step, index) => (
              <Box key={step.number} sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: index === activeStep ? theme.palette.green.main : 'transparent',
                    color: index === activeStep ? '#fff' : theme.palette.green.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '16px',
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  {index < activeStep ? <Check sx={{ fontSize: '16px', fontWeight: 'bold', color: theme.palette.green.main }} /> : step.number}
                </Box>
                {index < steps.length - 1 && (
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
                      backgroundColor: index === activeStep ? theme.palette.green.main : 'transparent',
                      border: 'none',
                      color: index === activeStep ? '#fff' : theme.palette.green.main,
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
                    {index < activeStep ? <Check sx={{ fontSize: '20px', fontWeight: 'bold', strokeWidth: 2, color: theme.palette.green.main }} /> : step.number}
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
            {activeStep < steps.length - 1 && (
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
              endIcon={activeStep === steps.length - 1 ? null : <ArrowForward />}
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
              {loading
                ? (activeStep === steps.length - 1 ? 'Submitting...' : 'Saving...')
                : (activeStep === steps.length - 1 ? 'Submit Application' : 'Save and Continue')}
            </Button>
          </Box>
        </Box>
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

      <Footer />
    </Box>
  );
};

export default SupplierApplication;
