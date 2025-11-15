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
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { ArrowBack, ArrowForward, Search, Check, KeyboardArrowDown, CloudUpload, CalendarToday, NavigateBefore, NavigateNext, ExpandMore, Description, Visibility } from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import Footer from '../../components/Footer/Footer';
import { useAuth } from '../../context/AuthContext';
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
  'Public/Private Company',
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
  const params = useParams();
  const id = params.id; // Works for both /application/:id/edit and /application/:id
  const theme = useTheme();
  const { user } = useAuth();
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
    // File uploads
    certificateOfIncorporation: null,
    kraPinCertificate: null,
    etimsProof: null,
    financialStatements: null,
    cr12: null,
    companyProfile: null,
    bankReferenceLetter: null,
    directorsIds: [],
    practicingCertificates: [],
    keyMembersResumes: [],
    
    // Declarations
    sourceOfWealth: '',
    declarantFullName: '',
    declarantCapacity: '',
    declarantIdPassport: '',
    declarationDate: '',
    signature: '',
    declarationSignatureFile: null,
    consentToProcessing: false,
    confirmInformationAccurate: false,
  });
  const [loading, setLoading] = useState(false);
  const [countrySearchOpen, setCountrySearchOpen] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [countryAnchorEl, setCountryAnchorEl] = useState(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerAnchorEl, setDatePickerAnchorEl] = useState(null);

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
              declarationSignatureFile: app.declarationSignatureFile,
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
              legalNature: app.legalNature || '',
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
              entityType: app.entityType || '',
              serviceTypes: app.serviceTypes || app.serviceType || '',
              servicesDescription: app.servicesDescription || '',
              
              // Declarations (map from sourceOfFunds if direct fields don't exist)
              sourceOfWealth: app.sourceOfWealth || app.sourceOfFunds?.source || '',
              declarantFullName: app.declarantFullName || app.sourceOfFunds?.declarantName || '',
              declarantCapacity: app.declarantCapacity || app.sourceOfFunds?.declarantCapacity || '',
              declarantIdPassport: app.declarantIdPassport || app.sourceOfFunds?.declarantIdPassport || '',
              declarationDate: app.declarationDate || (app.sourceOfFunds?.declarationDate ? new Date(app.sourceOfFunds.declarationDate).toISOString().split('T')[0] : ''),
              signature: app.signature || '',
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
              directorsIds: Array.isArray(app.directorsIds) && app.directorsIds.length > 0 ? app.directorsIds.filter(f => f && typeof f === 'string' && f.trim() !== '') : [],
              practicingCertificates: Array.isArray(app.practicingCertificates) && app.practicingCertificates.length > 0 ? app.practicingCertificates.filter(f => f && typeof f === 'string' && f.trim() !== '') : [],
              keyMembersResumes: Array.isArray(app.keyMembersResumes) && app.keyMembersResumes.length > 0 ? app.keyMembersResumes.filter(f => f && typeof f === 'string' && f.trim() !== '') : [],
              declarationSignatureFile: (app.declarationSignatureFile && typeof app.declarationSignatureFile === 'string' && app.declarationSignatureFile.trim() !== '') ? app.declarationSignatureFile : null,
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
                declarationSignatureFile: updated.declarationSignatureFile,
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
              
              // Map legalNature from database enum to display value
              const mapLegalNatureToDisplay = (dbValue) => {
                const mapping = {
                  'company': 'Private Limited Company',
                  'partnership': 'Partnership',
                  'individual': 'Sole Proprietorship',
                  'state_owned': 'Private Limited Company',
                  'ngo': 'NGO',
                  'foundation': 'Private Limited Company',
                  'association': 'Private Limited Company',
                  'foreign_company': 'Private Limited Company',
                  'trust': 'Trust',
                  'other': 'Other'
                };
                return mapping[dbValue] || '';
              };
              
              const legalNatureDisplay = supplierData.legalNature 
                ? mapLegalNatureToDisplay(supplierData.legalNature)
                : '';
              
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
                legalNature: legalNatureDisplay,
                physicalAddress: fullAddress,
              }));
            } else {
              // No supplier data, just prefill contact info
              setFormData(prev => ({
                ...prev,
                contactFullName: registeredFullName,
                contactEmail: user.email || '',
              }));
            }
          } catch (error) {
            // On error, just prefill contact info
            setFormData(prev => ({
              ...prev,
              contactFullName: registeredFullName,
              contactEmail: user.email || '',
            }));
          }
        };
        
        fetchSupplierForPrefill();
      }
    }
  }, [id, user]);

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      // Create payload with all form data, ensuring all fields are included
      const payload = { 
        ...formData, 
        status: 'draft',
        currentStep: activeStep,
        lastModified: new Date().toISOString()
      };
      
      // Handle file objects - extract filenames for storage
      // File objects can't be serialized to JSON, so we store filenames instead
      const fileFields = [
        'certificateOfIncorporation', 'kraPinCertificate', 'etimsProof', 
        'financialStatements', 'cr12', 'companyProfile', 'bankReferenceLetter',
        'declarationSignatureFile'
      ];
      
      fileFields.forEach(field => {
        if (payload[field] instanceof File) {
          // Store filename and keep File object in formData for potential upload
          payload[field] = payload[field].name;
        } else if (payload[field] === undefined || payload[field] === null) {
          // Preserve existing filename if it's a non-empty string, otherwise keep null
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
      const arrayFileFields = ['directorsIds', 'practicingCertificates', 'keyMembersResumes'];
      arrayFileFields.forEach(field => {
        if (Array.isArray(payload[field]) && payload[field].length > 0) {
          // If array contains File objects, extract filenames
          if (payload[field][0] instanceof File) {
            payload[field] = payload[field].map(file => file.name);
          }
          // If it's already an array of strings, keep it
        } else if (payload[field] === undefined) {
          // Preserve existing array if it has valid filenames
          if (Array.isArray(formData[field]) && formData[field].length > 0) {
            payload[field] = formData[field].filter(f => f && typeof f === 'string' && f.trim() !== '');
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
      
      let response;
      if (applicationId) {
        // Update existing application
        response = await api.put(`/suppliers/${applicationId}`, payload);
      } else {
        // Create new application
        response = await api.post('/suppliers/draft', payload);
        if (response.data.data?._id) {
          setApplicationId(response.data.data._id);
        }
      }
      toast.success('Draft saved successfully!');
    } catch (error) {
      console.error('Save draft error:', error);
      toast.error(error.response?.data?.message || 'Error saving draft');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndContinue = async () => {
    setLoading(true);
    try {
      // Create payload with ALL form data from all steps
      // This ensures all fields are saved before moving to the next step
      const payload = { 
        ...formData, 
        status: activeStep === steps.length - 1 ? 'submitted' : 'draft',
        currentStep: activeStep, // Save the current step the user is on
        lastModified: new Date().toISOString()
      };
      
      // Handle file objects - extract filenames for storage
      // File objects can't be serialized to JSON, so we store filenames instead
      const fileFields = [
        'certificateOfIncorporation', 'kraPinCertificate', 'etimsProof', 
        'financialStatements', 'cr12', 'companyProfile', 'bankReferenceLetter',
        'declarationSignatureFile'
      ];
      
      fileFields.forEach(field => {
        if (payload[field] instanceof File) {
          // Store filename and keep File object in formData for potential upload
          payload[field] = payload[field].name;
        } else if (payload[field] === undefined || payload[field] === null) {
          // Preserve existing filename if it's a non-empty string, otherwise keep null
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
      const arrayFileFields = ['directorsIds', 'practicingCertificates', 'keyMembersResumes'];
      arrayFileFields.forEach(field => {
        if (Array.isArray(payload[field]) && payload[field].length > 0) {
          // If array contains File objects, extract filenames
          if (payload[field][0] instanceof File) {
            payload[field] = payload[field].map(file => file.name);
          }
          // If it's already an array of strings, keep it
        } else if (payload[field] === undefined) {
          // Preserve existing array if it has valid filenames
          if (Array.isArray(formData[field]) && formData[field].length > 0) {
            payload[field] = formData[field].filter(f => f && typeof f === 'string' && f.trim() !== '');
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
        declarationSignatureFile: payload.declarationSignatureFile,
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
        hasSignature: !!payload.declarationSignatureFile,
        directorsCount: Array.isArray(payload.directorsIds) ? payload.directorsIds.length : 0
      });
      
      // Check if this is the last step (submission)
      if (activeStep === steps.length - 1) {
        // Submit application - save data and submit in one call
        if (applicationId) {
          // Prepare payload with all form data (convert File objects to filenames)
          const submitPayload = { ...formData };
          
          // Convert File objects to filenames
          const fileFields = [
            'certificateOfIncorporation', 'kraPinCertificate', 'etimsProof', 
            'financialStatements', 'cr12', 'companyProfile', 'bankReferenceLetter',
            'declarationSignatureFile'
          ];
          
          fileFields.forEach(field => {
            if (submitPayload[field] instanceof File) {
              submitPayload[field] = submitPayload[field].name;
            } else if (submitPayload[field] === undefined || submitPayload[field] === null) {
              if (typeof formData[field] === 'string' && formData[field].trim() !== '') {
                submitPayload[field] = formData[field];
              } else {
                submitPayload[field] = null;
              }
            }
          });
          
          // Handle array file fields
          const arrayFileFields = ['directorsIds', 'practicingCertificates', 'keyMembersResumes'];
          arrayFileFields.forEach(field => {
            if (Array.isArray(submitPayload[field]) && submitPayload[field].length > 0) {
              if (submitPayload[field][0] instanceof File) {
                submitPayload[field] = submitPayload[field].map(file => file.name);
              }
            } else if (submitPayload[field] === undefined) {
              if (Array.isArray(formData[field]) && formData[field].length > 0) {
                submitPayload[field] = formData[field].filter(f => f && typeof f === 'string' && f.trim() !== '');
              } else {
                submitPayload[field] = [];
              }
            }
          });
          
          submitPayload.currentStep = activeStep;
          submitPayload.lastModified = new Date().toISOString();
          
          // Submit the application - the submit endpoint will save the form data and change status to 'pending_procurement'
          await api.post(`/suppliers/${applicationId}/submit`, submitPayload);
        } else {
          // Create new application first, then submit
          // Prepare submit payload (same as above)
          const submitPayload = { ...formData };
          
          // Convert File objects to filenames
          const fileFields = [
            'certificateOfIncorporation', 'kraPinCertificate', 'etimsProof', 
            'financialStatements', 'cr12', 'companyProfile', 'bankReferenceLetter',
            'declarationSignatureFile'
          ];
          
          fileFields.forEach(field => {
            if (submitPayload[field] instanceof File) {
              submitPayload[field] = submitPayload[field].name;
            } else if (submitPayload[field] === undefined || submitPayload[field] === null) {
              if (typeof formData[field] === 'string' && formData[field].trim() !== '') {
                submitPayload[field] = formData[field];
              } else {
                submitPayload[field] = null;
              }
            }
          });
          
          // Handle array file fields
          const arrayFileFields = ['directorsIds', 'practicingCertificates', 'keyMembersResumes'];
          arrayFileFields.forEach(field => {
            if (Array.isArray(submitPayload[field]) && submitPayload[field].length > 0) {
              if (submitPayload[field][0] instanceof File) {
                submitPayload[field] = submitPayload[field].map(file => file.name);
              }
            } else if (submitPayload[field] === undefined) {
              if (Array.isArray(formData[field]) && formData[field].length > 0) {
                submitPayload[field] = formData[field].filter(f => f && typeof f === 'string' && f.trim() !== '');
              } else {
                submitPayload[field] = [];
              }
            }
          });
          
          submitPayload.currentStep = activeStep;
          submitPayload.lastModified = new Date().toISOString();
          
          const createResponse = await api.post('/suppliers/draft', payload);
          if (createResponse.data.data?._id) {
            setApplicationId(createResponse.data.data._id);
            // Now submit the newly created application
            await api.post(`/suppliers/${createResponse.data.data._id}/submit`, submitPayload);
          }
        }
        toast.success('Application submitted successfully!');
        navigate('/dashboard');
      } else {
        // Not the last step - save and continue
        let response;
        if (applicationId) {
          // Update existing application with ALL form data
          response = await api.put(`/suppliers/${applicationId}`, payload);
        } else {
          // Create new application with ALL form data
          response = await api.post('/suppliers/draft', payload);
          if (response.data.data?._id) {
            setApplicationId(response.data.data._id);
          }
        }

        // Move to next step and update currentStep
        const nextStep = activeStep + 1;
        setActiveStep(nextStep);
        
        // Update currentStep after moving to next step (with all form data again to ensure nothing is lost)
        if (applicationId) {
          // Create a payload with formData, converting File objects to filenames
          const stepUpdatePayload = { ...formData };
          
          // Convert File objects to filenames
          const fileFields = [
            'certificateOfIncorporation', 'kraPinCertificate', 'etimsProof', 
            'financialStatements', 'cr12', 'companyProfile', 'bankReferenceLetter',
            'declarationSignatureFile'
          ];
          
          fileFields.forEach(field => {
            if (stepUpdatePayload[field] instanceof File) {
              stepUpdatePayload[field] = stepUpdatePayload[field].name;
            } else if (stepUpdatePayload[field] === undefined || stepUpdatePayload[field] === null) {
              if (typeof formData[field] === 'string' && formData[field].trim() !== '') {
                stepUpdatePayload[field] = formData[field];
              } else {
                stepUpdatePayload[field] = null;
              }
            }
          });
          
          // Handle array file fields
          const arrayFileFields = ['directorsIds', 'practicingCertificates', 'keyMembersResumes'];
          arrayFileFields.forEach(field => {
            if (Array.isArray(stepUpdatePayload[field]) && stepUpdatePayload[field].length > 0) {
              if (stepUpdatePayload[field][0] instanceof File) {
                stepUpdatePayload[field] = stepUpdatePayload[field].map(file => file.name);
              }
            } else if (stepUpdatePayload[field] === undefined) {
              if (Array.isArray(formData[field]) && formData[field].length > 0) {
                stepUpdatePayload[field] = formData[field].filter(f => f && typeof f === 'string' && f.trim() !== '');
              } else {
                stepUpdatePayload[field] = [];
              }
            }
          });
          
          stepUpdatePayload.currentStep = nextStep;
          stepUpdatePayload.lastModified = new Date().toISOString();
          
          await api.put(`/suppliers/${applicationId}`, stepUpdatePayload);
        }
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
            'declarationSignatureFile'
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
          const arrayFileFields = ['directorsIds', 'practicingCertificates', 'keyMembersResumes'];
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

                {/* Required Documents - Two Columns */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                    >
                      Certificate of Incorporation or Registration
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
                      {formData.certificateOfIncorporation 
                        ? (formData.certificateOfIncorporation instanceof File 
                          ? formData.certificateOfIncorporation.name 
                          : typeof formData.certificateOfIncorporation === 'string' 
                          ? formData.certificateOfIncorporation 
                          : 'File selected')
                        : 'Choose file'}
                      <input
                        type="file"
                        hidden
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleChange('certificateOfIncorporation', e.target.files[0]);
                          }
                        }}
                        onClick={(e) => {
                          // Reset value to allow selecting the same file again
                          e.target.value = '';
                        }}
                      />
                    </Button>
                    {!formData.certificateOfIncorporation && (
                      <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '12px', mt: 0.5, display: 'block' }}>
                        No file chosen
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ mb: 2.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                    >
                      KRA PIN Certificate
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
                      {formData.kraPinCertificate 
                        ? (formData.kraPinCertificate instanceof File 
                          ? formData.kraPinCertificate.name 
                          : typeof formData.kraPinCertificate === 'string' 
                          ? formData.kraPinCertificate 
                          : 'File selected')
                        : 'Choose file'}
                      <input
                        type="file"
                        hidden
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleChange('kraPinCertificate', e.target.files[0]);
                          }
                        }}
                        onClick={(e) => {
                          e.target.value = '';
                        }}
                      />
                    </Button>
                    {!formData.kraPinCertificate && (
                      <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '12px', mt: 0.5, display: 'block' }}>
                        No file chosen
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ mb: 2.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                    >
                      Proof of registration on e-TIMS
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
                      {formData.etimsProof 
                        ? (formData.etimsProof instanceof File 
                          ? formData.etimsProof.name 
                          : typeof formData.etimsProof === 'string' 
                          ? formData.etimsProof 
                          : 'File selected')
                        : 'Choose file'}
                      <input
                        type="file"
                        hidden
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleChange('etimsProof', e.target.files[0]);
                          }
                        }}
                        onClick={(e) => {
                          e.target.value = '';
                        }}
                      />
                    </Button>
                    {!formData.etimsProof && (
                      <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '12px', mt: 0.5, display: 'block' }}>
                        No file chosen
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ mb: 2.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                    >
                      Current annual audited financial statements
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
                      {formData.financialStatements 
                        ? (formData.financialStatements instanceof File 
                          ? formData.financialStatements.name 
                          : typeof formData.financialStatements === 'string' 
                          ? formData.financialStatements 
                          : 'File selected')
                        : 'Choose file'}
                      <input
                        type="file"
                        hidden
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleChange('financialStatements', e.target.files[0]);
                          }
                        }}
                        onClick={(e) => {
                          e.target.value = '';
                        }}
                      />
                    </Button>
                    {!formData.financialStatements && (
                      <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '12px', mt: 0.5, display: 'block' }}>
                        No file chosen
                      </Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                    >
                      Valid CR12 (not more than 30 days old)
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
                      {formData.cr12 
                        ? (formData.cr12 instanceof File 
                          ? formData.cr12.name 
                          : typeof formData.cr12 === 'string' 
                          ? formData.cr12 
                          : 'File selected')
                        : 'Choose file'}
                      <input
                        type="file"
                        hidden
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleChange('cr12', e.target.files[0]);
                          }
                        }}
                        onClick={(e) => {
                          e.target.value = '';
                        }}
                      />
                    </Button>
                    {!formData.cr12 && (
                      <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '12px', mt: 0.5, display: 'block' }}>
                        No file chosen
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ mb: 2.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                    >
                      Firm Company Profile
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
                      {formData.companyProfile 
                        ? (formData.companyProfile instanceof File 
                          ? formData.companyProfile.name 
                          : typeof formData.companyProfile === 'string' 
                          ? formData.companyProfile 
                          : 'File selected')
                        : 'Choose file'}
                      <input
                        type="file"
                        hidden
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleChange('companyProfile', e.target.files[0]);
                          }
                        }}
                        onClick={(e) => {
                          e.target.value = '';
                        }}
                      />
                    </Button>
                    {!formData.companyProfile && (
                      <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '12px', mt: 0.5, display: 'block' }}>
                        No file chosen
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ mb: 2.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                    >
                      Bank reference letter
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
                      {formData.bankReferenceLetter 
                        ? (formData.bankReferenceLetter instanceof File 
                          ? formData.bankReferenceLetter.name 
                          : typeof formData.bankReferenceLetter === 'string' 
                          ? formData.bankReferenceLetter 
                          : 'File selected')
                        : 'Choose file'}
                      <input
                        type="file"
                        hidden
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleChange('bankReferenceLetter', e.target.files[0]);
                          }
                        }}
                        onClick={(e) => {
                          e.target.value = '';
                        }}
                      />
                    </Button>
                    {!formData.bankReferenceLetter && (
                      <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '12px', mt: 0.5, display: 'block' }}>
                        No file chosen
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Director's IDs/Passports Upload Area */}
                <Grid item xs={12}>
                  <Typography 
                    variant="body2" 
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    Director's IDs/Passports
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
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const files = Array.from(e.target.files).slice(0, 10); // Limit to 10 files
                          if (files.length < e.target.files.length) {
                            toast.warning(`Only the first 10 files will be uploaded. ${e.target.files.length - files.length} file(s) ignored.`);
                          }
                          handleChange('directorsIds', files);
                        }
                      }}
                      onClick={(e) => {
                        e.target.value = '';
                      }}
                    />
                    <CloudUpload sx={{ fontSize: 40, color: '#000', mb: 1.5 }} />
                    <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151', mb: 0.5 }}>
                      Upload files
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#6b7280' }}>
                      Click here or drag and drop to upload
                    </Typography>
                    {formData.directorsIds && formData.directorsIds.length > 0 && (
                      <Typography sx={{ fontSize: '12px', color: theme.palette.green.main, mt: 1, fontWeight: 500 }}>
                        {formData.directorsIds.length} file(s) selected
                        {formData.directorsIds[0] instanceof File === false && formData.directorsIds[0] && (
                          <span> ({typeof formData.directorsIds[0] === 'string' ? 'Previously saved' : ''})</span>
                        )}
                      </Typography>
                    )}
                  </Box>
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
                    <CloudUpload sx={{ fontSize: 40, color: '#000', mb: 1.5 }} />
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
                    <CloudUpload sx={{ fontSize: 40, color: '#000', mb: 1.5 }} />
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
          </Box>
        );
      
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
                                    color: isSelected ? '#fff' : isCurrentMonth ? '#374151' : '#d1d5db',
                                    fontWeight: isToday ? 600 : isSelected ? 600 : 400,
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

                {/* Signature Upload Area */}
                <Grid item xs={12}>
                  <Typography 
                    variant="body2" 
                    sx={{ mb: 1, fontWeight: 500, fontSize: '14px', color: '#374151' }}
                  >
                    Signature
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
                      hidden
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleChange('declarationSignatureFile', e.target.files[0]);
                        }
                      }}
                      onClick={(e) => {
                        // Reset value to allow selecting the same file again
                        e.target.value = '';
                      }}
                    />
                    <CloudUpload sx={{ fontSize: 40, color: '#000', mb: 1.5 }} />
                    <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151', mb: 0.5 }}>
                      Upload file
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#6b7280' }}>
                      Click here or drag and drop to upload
                    </Typography>
                    {formData.declarationSignatureFile && (
                      <Typography sx={{ fontSize: '12px', color: theme.palette.green.main, mt: 1, fontWeight: 500 }}>
                        {formData.declarationSignatureFile instanceof File 
                          ? formData.declarationSignatureFile.name 
                          : typeof formData.declarationSignatureFile === 'string' 
                          ? formData.declarationSignatureFile 
                          : 'File selected'}
                      </Typography>
                    )}
                  </Box>
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
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" sx={{ mb: 0.5, color: '#6b7280', fontSize: '12px' }}>
                        Legal Nature of Entity
                      </Typography>
                      <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#374151' }}>
                        {formData.legalNature || '-'}
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
                              <Description sx={{ fontSize: 24, color: '#6b7280' }} />
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
                              sx={{
                                color: '#6b7280',
                                '&:hover': {
                                  backgroundColor: 'transparent',
                                  color: '#374151'
                                }
                              }}
                            >
                              <Visibility sx={{ fontSize: 20 }} />
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
                                <Description sx={{ fontSize: 24, color: '#6b7280' }} />
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
                                <Visibility sx={{ fontSize: 20 }} />
                              </IconButton>
                            </Box>
                          );
                        });
                      };

                      return (
                        <Grid item xs={12}>
                          {/* Certificate of Incorporation - show all instances */}
                          {formData.certificateOfIncorporation && renderDocumentCard(formData.certificateOfIncorporation, 'Certificate of Incorporation')}
                          {formData.directorsIds && formData.directorsIds.length > 0 && renderMultipleDocumentCards(formData.directorsIds, 'Certificate of Incorporation')}
                        </Grid>
                      );
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
                              <Description sx={{ fontSize: 24, color: '#6b7280' }} />
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
                              sx={{
                                color: '#6b7280',
                                '&:hover': {
                                  backgroundColor: 'transparent',
                                  color: '#374151'
                                }
                              }}
                            >
                              <Visibility sx={{ fontSize: 20 }} />
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
                                <Description sx={{ fontSize: 24, color: '#6b7280' }} />
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
                                <Visibility sx={{ fontSize: 20 }} />
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
                    {formData.declarationSignatureFile && (
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ mb: 1, color: '#6b7280', fontSize: '12px' }}>
                          Signature File
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 1.5,
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
                            <Description sx={{ fontSize: 24, color: '#6b7280' }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography sx={{ fontSize: '14px', color: '#374151', fontWeight: 500, mb: 0.25 }}>
                                {formData.declarationSignatureFile instanceof File 
                                  ? formData.declarationSignatureFile.name 
                                  : typeof formData.declarationSignatureFile === 'string' 
                                  ? formData.declarationSignatureFile 
                                  : 'Signature File'}
                              </Typography>
                              <Typography sx={{ fontSize: '12px', color: '#9ca3af' }}>
                                {(() => {
                                  const fileName = formData.declarationSignatureFile instanceof File 
                                    ? formData.declarationSignatureFile.name 
                                    : typeof formData.declarationSignatureFile === 'string' 
                                    ? formData.declarationSignatureFile 
                                    : '';
                                  const fileExtension = fileName.split('.').pop()?.toUpperCase() || 'PDF';
                                  const fileSize = formData.declarationSignatureFile instanceof File && formData.declarationSignatureFile.size 
                                    ? `${(formData.declarationSignatureFile.size / (1024 * 1024)).toFixed(1)} MB` 
                                    : '2.3 MB';
                                  return `${fileExtension} • ${fileSize}`;
                                })()}
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
                            <Visibility sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Box>
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

      <Footer />
    </Box>
  );
};

export default SupplierApplication;
