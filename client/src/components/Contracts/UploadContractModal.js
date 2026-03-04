import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    TextField,
    MenuItem,
    Button,
    IconButton,
    InputAdornment,
    styled,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const DEPARTMENTS = [
    'Procurement',
    'Legal',
    'Finance',
    'Operations',
    'IT',
    'Human Resources',
    'Marketing'
];

const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        borderRadius: '12px',
        padding: theme.spacing(1),
    },
}));

const FileInputWrapper = styled(Box)({
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    '& input': {
        fontSize: '14px',
        cursor: 'pointer',
        width: '100%',
    },
});

const Label = styled(Typography)({
    fontWeight: 600,
    fontSize: '14px',
    marginBottom: '8px',
    color: '#374151',
});

const SuffixText = styled(Typography)({
    fontSize: '12px',
    color: '#6b7280',
});

const HelperText = styled(Typography)({
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
});

const UploadContractModal = ({ open, onClose, onSave, uploading }) => {
    const [file, setFile] = useState(null);
    const [validity, setValidity] = useState('');
    const [noticePeriod, setNoticePeriod] = useState('');
    const [department, setDepartment] = useState('');
    const [comment, setComment] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSave = () => {
        onSave({
            file,
            validityMonths: validity,
            noticePeriodMonths: noticePeriod,
            department,
            comment
        });
    };

    return (
        <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <Box sx={{ p: 1 }}>
                <DialogTitle sx={{ m: 0, p: 2, pb: 1, position: 'relative' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
                        Upload New Contract
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Add new contract details
                    </Typography>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            right: 16,
                            top: 16,
                            color: '#374151'
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ border: 'none', py: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* New Contract File Upload */}
                        <Box>
                            <Label>New Contract</Label>
                            <FileInputWrapper>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                />
                            </FileInputWrapper>
                        </Box>

                        {/* Contract Validity */}
                        <Box>
                            <Label>Contract Validity</Label>
                            <TextField
                                fullWidth
                                size="small"
                                value={validity}
                                onChange={(e) => setValidity(e.target.value)}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end"><SuffixText>Months</SuffixText></InputAdornment>,
                                    sx: { borderRadius: '8px' }
                                }}
                            />
                            <HelperText>How long is the contract valid for ?</HelperText>
                        </Box>

                        {/* Notice Period */}
                        <Box>
                            <Label>Notice Period</Label>
                            <TextField
                                fullWidth
                                size="small"
                                value={noticePeriod}
                                onChange={(e) => setNoticePeriod(e.target.value)}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end"><SuffixText>Months</SuffixText></InputAdornment>,
                                    sx: { borderRadius: '8px' }
                                }}
                            />
                            <HelperText>Period to send notification warning of contract expiry</HelperText>
                        </Box>

                        {/* Department */}
                        <Box>
                            <Label>Department</Label>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                InputProps={{ sx: { borderRadius: '8px' } }}
                            >
                                <MenuItem value="" disabled>Select Department</MenuItem>
                                {DEPARTMENTS.map((dept) => (
                                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                                ))}
                            </TextField>
                            <HelperText>The department in which the contract will be executed</HelperText>
                        </Box>

                        {/* Comment */}
                        <Box>
                            <Label>Comment</Label>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add comment here"
                                InputProps={{ sx: { borderRadius: '8px' } }}
                            />
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleSave}
                        disabled={uploading || !file}
                        sx={{
                            bgcolor: '#578A18',
                            '&:hover': { bgcolor: '#467014' },
                            textTransform: 'none',
                            py: 1.5,
                            fontWeight: 700,
                            fontSize: '1rem',
                            borderRadius: '8px',
                            boxShadow: 'none',
                            '&.Mui-disabled': {
                                bgcolor: '#a3be8c',
                                color: 'rgba(255, 255, 255, 0.7)'
                            }
                        }}
                    >
                        {uploading ? 'Saving...' : 'Save Contract'}
                    </Button>
                </DialogActions>
            </Box>
        </StyledDialog>
    );
};

export default UploadContractModal;
