import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Chip,
  Alert,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Upload,
  Download,
  Description,
  CheckCircle,
} from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const ApplicationStatus = () => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSupplierApplication();
  }, []);

  const fetchSupplierApplication = async () => {
    try {
      // If no ID in params, get supplier's own application
      const response = await api.get('/suppliers');
      const myApplications = response.data.data;
      
      if (myApplications.length > 0) {
        const appId = paramId || myApplications[0]._id;
        const detailResponse = await api.get(`/suppliers/${appId}`);
        setSupplier(detailResponse.data.data);
      }
    } catch (error) {
      toast.error('Failed to load application');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !documentType) {
      toast.error('Please select a file and document type');
      return;
    }

    const formData = new FormData();
    formData.append('document', uploadFile);
    formData.append('supplierId', supplier._id);
    formData.append('documentType', documentType);

    setUploading(true);
    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document uploaded successfully');
      setUploadDialog(false);
      setUploadFile(null);
      setDocumentType('');
      fetchSupplierApplication();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!supplier.documents || supplier.documents.length === 0) {
      toast.error('Please upload at least one document before submitting');
      return;
    }

    try {
      await api.post(`/suppliers/${supplier._id}/submit`);
      toast.success('Application submitted successfully!');
      fetchSupplierApplication();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    }
  };

  const getStepStatus = () => {
    const statusMap = {
      draft: 0,
      submitted: 1,
      pending_procurement: 1,
      pending_legal: 2,
      approved: 3,
      rejected: 1,
      more_info_required: 1,
    };
    return statusMap[supplier?.status] || 0;
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      submitted: 'primary',
      pending_procurement: 'warning',
      pending_legal: 'info',
      approved: 'success',
      rejected: 'error',
      more_info_required: 'warning',
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!supplier) {
    return (
      <Container maxWidth="md">
        <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            No Application Found
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            You haven't started an application yet.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/application/new')}
          >
            Start New Application
          </Button>
        </Paper>
      </Container>
    );
  }

  const steps = ['Application Created', 'Procurement Review', 'Legal Review', 'Approved'];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Application Status
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" color="textSecondary">
            {supplier.supplierName}
          </Typography>
          <Chip 
            label={supplier.status.replace('_', ' ').toUpperCase()} 
            color={getStatusColor(supplier.status)}
          />
          {supplier.vendorNumber && (
            <Chip 
              label={`Vendor #: ${supplier.vendorNumber}`} 
              color="success"
              icon={<CheckCircle />}
            />
          )}
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={getStepStatus()} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {supplier.status === 'rejected' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="bold">Application Rejected</Typography>
          <Typography variant="body2">
            Reason: {supplier.rejectionReason}
          </Typography>
        </Alert>
      )}

      {supplier.status === 'more_info_required' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="bold">Additional Information Required</Typography>
          <Typography variant="body2">
            Please review the comments and provide the requested information.
          </Typography>
        </Alert>
      )}

      {supplier.status === 'approved' && !supplier.vendorNumber && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="bold">Application Approved!</Typography>
          <Typography variant="body2">
            Your vendor number will be assigned shortly by the procurement team.
          </Typography>
        </Alert>
      )}

      {supplier.vendorNumber && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="bold">Onboarding Complete!</Typography>
          <Typography variant="body2">
            Congratulations! You are now fully onboarded. Your vendor number is: {supplier.vendorNumber}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Documents
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {supplier.canSubmit && supplier.canSubmit() && (
                <Button
                  variant="contained"
                  startIcon={<Upload />}
                  onClick={() => setUploadDialog(true)}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Upload Document
                </Button>
              )}

              {supplier.documents && supplier.documents.length > 0 ? (
                <List>
                  {supplier.documents.map((doc) => (
                    <ListItem key={doc._id}>
                      <Description sx={{ mr: 2 }} color="primary" />
                      <ListItemText
                        primary={doc.originalName}
                        secondary={`Uploaded: ${new Date(doc.uploadedAt).toLocaleDateString()}`}
                      />
                      <Button
                        size="small"
                        startIcon={<Download />}
                        onClick={() => window.open(`http://localhost:8000/api/documents/${doc._id}/download`, '_blank')}
                      >
                        Download
                      </Button>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                  No documents uploaded yet
                </Typography>
              )}

              {supplier.status === 'draft' && (
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={handleSubmitApplication}
                  disabled={!supplier.documents || supplier.documents.length === 0}
                >
                  Submit Application
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Approval History
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {supplier.approvalHistory && supplier.approvalHistory.length > 0 ? (
                <List>
                  {supplier.approvalHistory.map((history, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${history.action.toUpperCase()}`}
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {new Date(history.timestamp).toLocaleString()}
                            </Typography>
                            {history.comments && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {history.comments}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                  No activity yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
              onChange={(e) => setUploadFile(e.target.files[0])}
              style={{ marginBottom: 16 }}
            />
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              style={{ width: '100%', padding: 8, marginTop: 16 }}
            >
              <option value="">Select Document Type</option>
              <option value="certificate_of_incorporation">Certificate of Incorporation</option>
              <option value="cr12">CR12</option>
              <option value="pin_certificate">PIN Certificate</option>
              <option value="directors_id">Directors ID</option>
              <option value="company_profile">Company Profile</option>
              <option value="bank_reference">Bank Reference</option>
              <option value="audited_financials">Audited Financials</option>
              <option value="etims_registration">e-TIMS Registration</option>
              <option value="other">Other</option>
            </select>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading || !uploadFile || !documentType}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ApplicationStatus;
