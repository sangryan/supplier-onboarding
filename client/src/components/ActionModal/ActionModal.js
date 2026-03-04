import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const ActionModal = ({
  open,
  onClose,
  type, // 'approve', 'reject', 'request_info'
  title,
  instruction,
  placeholder,
  comment,
  onCommentChange,
  onSubmit,
  submitButtonText,
  submitButtonColor = 'primary',
  requireComment = false,
}) => {
  const theme = useTheme();
  
  const isCommentRequired = requireComment || type === 'reject' || type === 'request_info';
  const isSubmitDisabled = isCommentRequired && !comment?.trim();

  const getButtonColor = () => {
    if (type === 'approve') {
      return theme.palette.green?.main || '#10b981';
    }
    if (type === 'reject') {
      return '#ef4444';
    }
    return '#6b7280';
  };

  const getButtonHoverColor = () => {
    if (type === 'approve') {
      return theme.palette.green?.hover || '#059669';
    }
    if (type === 'reject') {
      return '#dc2626';
    }
    return '#4b5563';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
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
        {title}
        <IconButton
          onClick={onClose}
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
        {instruction && (
          <Typography
            sx={{
              fontSize: '14px',
              color: '#6b7280',
              mb: 2,
              lineHeight: 1.5,
            }}
          >
            {instruction}
          </Typography>
        )}
        <TextField
          fullWidth
          multiline
          rows={6}
          value={comment || ''}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder={placeholder || 'Write a comment here'}
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
                borderColor: getButtonColor(),
              },
            },
            '& .MuiInputBase-input': {
              fontSize: '14px',
              color: '#111827',
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            textTransform: 'none',
            color: '#6b7280',
            fontSize: '14px',
            fontWeight: 500,
            px: 2,
            py: 0.75,
            borderRadius: '6px',
            '&:hover': {
              bgcolor: '#f3f4f6',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          sx={{
            backgroundColor: getButtonColor(),
            color: '#fff',
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 500,
            px: 3,
            py: 0.75,
            borderRadius: '6px',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: getButtonHoverColor(),
              boxShadow: 'none',
            },
            '&:disabled': {
              backgroundColor: '#d1d5db',
              color: '#9ca3af',
            },
          }}
        >
          {submitButtonText || (type === 'approve' ? 'Submit Approval' : type === 'reject' ? 'Submit Rejection' : 'Submit Request')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActionModal;




