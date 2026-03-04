import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Paper,
    Grid,
    Select,
    MenuItem,
    FormControl,
    FormHelperText,
    InputLabel,
    Divider,
    IconButton,
    CircularProgress,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const DEPARTMENTS = [
    'Finance',
    'Operations',
    'Marketing',
    'Human Resources',
    'IT',
    'Legal',
    'Procurement',
    'Sales',
    'Administration',
    'Other',
];

const CREDIT_PERIODS = [
    { value: '14_days', label: '14 Days' },
    { value: '30_days', label: '30 Days' },
    { value: '45_days', label: '45 Days' },
    { value: '60_days', label: '60 Days' },
    { value: '90_days', label: '90 Days' },
];

const FileField = ({ label, name, optional, value, onChange }) => {
    const inputId = `file-${name}`;
    return (
        <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.75, fontWeight: 500 }}>
                {label}
                {optional && (
                    <Box component="span" sx={{ fontWeight: 400, color: '#9ca3af', ml: 0.5 }}>
                        (Optional)
                    </Box>
                )}
            </Typography>
            <Box
                component="label"
                htmlFor={inputId}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    px: 2,
                    py: 1.2,
                    cursor: 'pointer',
                    backgroundColor: '#fff',
                    '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
                    width: '100%',
                }}
            >
                <Button
                    component="span"
                    size="small"
                    variant="outlined"
                    sx={{
                        textTransform: 'none',
                        fontSize: '13px',
                        color: '#374151',
                        borderColor: '#d1d5db',
                        px: 1.5,
                        py: 0.5,
                        minWidth: 'auto',
                        whiteSpace: 'nowrap',
                        '&:hover': { borderColor: '#9ca3af' },
                    }}
                >
                    Choose file
                </Button>
                <Typography sx={{ fontSize: '13px', color: value ? '#111827' : '#9ca3af' }}>
                    {value ? value.name : 'No file chosen'}
                </Typography>
                <input
                    id={inputId}
                    type="file"
                    name={name}
                    hidden
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={onChange}
                />
            </Box>
        </Box>
    );
};

const SectionCard = ({ title, children }) => (
    <Paper
        elevation={0}
        sx={{
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            p: 3,
            mb: 3,
            backgroundColor: '#fff',
        }}
    >
        <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#111827', mb: 2.5 }}>
            {title}
        </Typography>
        {children}
    </Paper>
);

const AdHocVendorForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        supplierName: '',
        mobileNumber: '',
        department: '',
        servicesProvided: '',
        bankName: '',
        accountNumber: '',
        branch: '',
        creditPeriod: '',
    });
    const [files, setFiles] = useState({
        nationalIdDocument: null,
        kraPinDocument: null,
        eTimsDocument: null,
        lpoDocument: null,
    });

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileChange = (e) => {
        const { name, files: f } = e.target;
        setFiles(prev => ({ ...prev, [name]: f[0] || null }));
    };

    const buildFormData = (submitForApproval) => {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        fd.append('submitForApproval', submitForApproval ? 'true' : 'false');
        Object.entries(files).forEach(([k, v]) => {
            if (v) fd.append(k, v);
        });
        return fd;
    };

    const handleSaveDraft = async () => {
        if (!form.supplierName.trim()) {
            toast.error('Supplier name is required');
            return;
        }
        setLoading(true);
        try {
            await api.post('/adhoc-vendors', buildFormData(false), {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Ad-hoc vendor saved as draft');
            navigate('/tasks');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save draft');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!form.supplierName.trim()) {
            toast.error('Supplier name is required');
            return;
        }
        setLoading(true);
        try {
            await api.post('/adhoc-vendors', buildFormData(true), {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Ad-hoc vendor submitted for approval');
            navigate('/tasks');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit vendor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            <Container maxWidth="md" sx={{ pt: 4, pb: 10, px: { xs: 2, sm: 3 } }}>
                {/* Back */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mb: 3,
                        cursor: 'pointer',
                        color: '#6b7280',
                        '&:hover': { color: '#111827' },
                        width: 'fit-content',
                    }}
                    onClick={() => navigate(-1)}
                >
                    <ArrowBackIcon sx={{ fontSize: 16 }} />
                    <Typography sx={{ fontSize: '14px' }}>Home</Typography>
                </Box>

                {/* Page Title */}
                <Box sx={{ mb: 3 }}>
                    <Typography sx={{ fontSize: '22px', fontWeight: 700, color: '#111827', mb: 0.5 }}>
                        Create Ad-Hoc Vendor Profile
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: '#6b7280' }}>
                        Add details of short-term or one-time service provider
                    </Typography>
                </Box>

                {/* Section 1: Basic Vendor Information */}
                <SectionCard title="Basic Vendor Information">
                    <Grid container spacing={2.5} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6}>
                            <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.75, fontWeight: 500 }}>
                                Supplier name
                            </Typography>
                            <TextField
                                name="supplierName"
                                value={form.supplierName}
                                onChange={handleChange}
                                fullWidth
                                size="small"
                                placeholder=""
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '14px' } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.75, fontWeight: 500 }}>
                                Mobile Number
                            </Typography>
                            <TextField
                                name="mobileNumber"
                                value={form.mobileNumber}
                                onChange={handleChange}
                                fullWidth
                                size="small"
                                placeholder=""
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '14px' } }}
                            />
                        </Grid>
                    </Grid>

                    <FileField
                        label="National ID"
                        name="nationalIdDocument"
                        value={files.nationalIdDocument}
                        onChange={handleFileChange}
                    />
                    <FileField
                        label="KRA Pin"
                        name="kraPinDocument"
                        value={files.kraPinDocument}
                        onChange={handleFileChange}
                    />
                    <FileField
                        label="Proof of registration on e-TIMS"
                        name="eTimsDocument"
                        optional
                        value={files.eTimsDocument}
                        onChange={handleFileChange}
                    />
                </SectionCard>

                {/* Section 2: Service Details */}
                <SectionCard title="Service Details">
                    <FileField
                        label="LPO (Local Purchase Order)"
                        name="lpoDocument"
                        value={files.lpoDocument}
                        onChange={handleFileChange}
                    />

                    <Box sx={{ mb: 2.5 }}>
                        <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.75, fontWeight: 500 }}>
                            Department
                        </Typography>
                        <Select
                            name="department"
                            value={form.department}
                            onChange={handleChange}
                            displayEmpty
                            fullWidth
                            size="small"
                            sx={{ borderRadius: '8px', fontSize: '14px' }}
                            renderValue={(v) => v || <span style={{ color: '#9ca3af' }}>Select Department</span>}
                        >
                            {DEPARTMENTS.map(d => (
                                <MenuItem key={d} value={d} sx={{ fontSize: '14px' }}>{d}</MenuItem>
                            ))}
                        </Select>
                        <FormHelperText sx={{ color: '#f97316', mt: 0.5, fontSize: '12px' }}>
                            The department in which the contract will be executed
                        </FormHelperText>
                    </Box>

                    <Box>
                        <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.75, fontWeight: 500 }}>
                            Services Provided
                        </Typography>
                        <TextField
                            name="servicesProvided"
                            value={form.servicesProvided}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={4}
                            placeholder="Describe services provided here"
                            sx={{
                                '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '14px' },
                            }}
                        />
                    </Box>
                </SectionCard>

                {/* Section 3: Payment Details */}
                <SectionCard title="Payment Details">
                    <Grid container spacing={2.5}>
                        <Grid item xs={12} sm={6}>
                            <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.75, fontWeight: 500 }}>
                                Bank name
                            </Typography>
                            <TextField
                                name="bankName"
                                value={form.bankName}
                                onChange={handleChange}
                                fullWidth
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '14px' } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.75, fontWeight: 500 }}>
                                Account Number
                            </Typography>
                            <TextField
                                name="accountNumber"
                                value={form.accountNumber}
                                onChange={handleChange}
                                fullWidth
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '14px' } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.75, fontWeight: 500 }}>
                                Branch
                            </Typography>
                            <TextField
                                name="branch"
                                value={form.branch}
                                onChange={handleChange}
                                fullWidth
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '14px' } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography sx={{ fontSize: '13px', color: '#374151', mb: 0.75, fontWeight: 500 }}>
                                Applicable Credit Period
                            </Typography>
                            <Select
                                name="creditPeriod"
                                value={form.creditPeriod}
                                onChange={handleChange}
                                displayEmpty
                                fullWidth
                                size="small"
                                sx={{ borderRadius: '8px', fontSize: '14px' }}
                                renderValue={(v) => {
                                    const match = CREDIT_PERIODS.find(p => p.value === v);
                                    return match ? match.label : <span style={{ color: '#9ca3af' }}>Select</span>;
                                }}
                            >
                                {CREDIT_PERIODS.map(p => (
                                    <MenuItem key={p.value} value={p.value} sx={{ fontSize: '14px' }}>{p.label}</MenuItem>
                                ))}
                            </Select>
                        </Grid>
                    </Grid>
                </SectionCard>
            </Container>

            {/* Sticky Bottom Action Bar */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: '#fff',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 2,
                    px: 4,
                    py: 2,
                    zIndex: 100,
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
                        borderColor: '#d1d5db',
                        color: '#374151',
                        px: 3,
                        py: 1,
                        borderRadius: '8px',
                        '&:hover': { borderColor: '#9ca3af', bgcolor: '#f9fafb' },
                    }}
                >
                    Save Draft
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    sx={{
                        textTransform: 'none',
                        fontSize: '14px',
                        fontWeight: 500,
                        bgcolor: '#578A18',
                        color: '#fff',
                        px: 3,
                        py: 1,
                        borderRadius: '8px',
                        boxShadow: 'none',
                        '&:hover': { bgcolor: '#467014', boxShadow: 'none' },
                    }}
                >
                    {loading ? <CircularProgress size={20} color="inherit" /> : 'Submit for Approval'}
                </Button>
            </Box>
        </Box>
    );
};

export default AdHocVendorForm;
