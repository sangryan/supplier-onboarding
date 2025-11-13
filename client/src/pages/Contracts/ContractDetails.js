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
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Edit,
  CheckCircle,
  Upload,
  Download,
  Description,
} from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const ContractDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [activateDialog, setActivateDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

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

  const handleUploadSignedContract = async () => {
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('contract', uploadFile);

    setUploading(true);
    try {
      await api.post(`/contracts/${id}/upload-signed`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Signed contract uploaded successfully');
      setUploadDialog(false);
      setUploadFile(null);
      fetchContract();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload contract');
    } finally {
      setUploading(false);
    }
  };

  const handleActivateContract = async () => {
    try {
      await api.post(`/contracts/${id}/activate`);
      toast.success('Contract activated successfully');
      setActivateDialog(false);
      fetchContract();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to activate contract');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      active: 'success',
      expired: 'error',
      terminated: 'error',
      renewed: 'info',
    };
    return colors[status] || 'default';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'KES',
    }).format(amount);
  };

  const getDaysUntilExpiry = () => {
    if (!contract?.endDate) return null;
    const days = Math.ceil((new Date(contract.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const canManageContract = ['legal', 'super_admin'].includes(user.role);

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!contract) {
    return (
      <Container>
        <Alert severity="error">Contract not found</Alert>
      </Container>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {contract.contractNumber}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={contract.status.toUpperCase()}
              color={getStatusColor(contract.status)}
            />
            {daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
              <Chip
                label={`Expires in ${daysUntilExpiry} days`}
                color="warning"
                size="small"
              />
            )}
            {daysUntilExpiry !== null && daysUntilExpiry <= 0 && (
              <Chip
                label="EXPIRED"
                color="error"
                size="small"
              />
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/contracts')}>
            Back
          </Button>
          {canManageContract && contract.status === 'draft' && contract.signedContract && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => setActivateDialog(true)}
            >
              Activate Contract
            </Button>
          )}
        </Box>
      </Box>

      {contract.status === 'draft' && !contract.signedContract && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="bold">
            Signed Contract Required
          </Typography>
          <Typography variant="body2">
            Please upload the signed contract document before activating this contract.
          </Typography>
          {canManageContract && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Upload />}
              onClick={() => setUploadDialog(true)}
              sx={{ mt: 1 }}
            >
              Upload Signed Contract
            </Button>
          )}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Contract Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Title</Typography>
                  <Typography variant="h6">{contract.title}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Supplier</Typography>
                  <Typography variant="body1">{contract.supplier?.supplierName}</Typography>
                  {contract.supplier?.vendorNumber && (
                    <Typography variant="caption" color="textSecondary">
                      Vendor #: {contract.supplier.vendorNumber}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Contract Type</Typography>
                  <Typography variant="body1" textTransform="capitalize">
                    {contract.contractType?.replace('_', ' ')}
                  </Typography>
                </Grid>

                {contract.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Description</Typography>
                    <Typography variant="body1">{contract.description}</Typography>
                  </Grid>
                )}

                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">Contract Value</Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(contract.value?.amount, contract.value?.currency)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">Start Date</Typography>
                  <Typography variant="body1">{formatDate(contract.startDate)}</Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">End Date</Typography>
                  <Typography variant="body1">{formatDate(contract.endDate)}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Payment Terms
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Credit Period</Typography>
                  <Typography variant="body1">
                    {contract.paymentTerms?.creditPeriod} days
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Payment Schedule</Typography>
                  <Typography variant="body1" textTransform="capitalize">
                    {contract.paymentTerms?.paymentSchedule?.replace('_', ' ')}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Documents
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {contract.signedContract ? (
                <List>
                  <ListItem>
                    <Description sx={{ mr: 2 }} color="primary" />
                    <ListItemText
                      primary="Signed Contract"
                      secondary="Official signed document"
                    />
                    <Button
                      size="small"
                      startIcon={<Download />}
                      onClick={() => window.open(`http://localhost:8000/api/documents/${contract.signedContract}/download`, '_blank')}
                    >
                      Download
                    </Button>
                  </ListItem>
                </List>
              ) : (
                <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                  No signed contract uploaded yet
                </Typography>
              )}

              {canManageContract && (
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Upload />}
                  onClick={() => setUploadDialog(true)}
                  sx={{ mt: 2 }}
                >
                  {contract.signedContract ? 'Replace Contract' : 'Upload Contract'}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Contract History
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Created By</Typography>
                <Typography variant="body1">
                  {contract.uploadedBy?.firstName} {contract.uploadedBy?.lastName}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {formatDate(contract.uploadedAt || contract.createdAt)}
                </Typography>
              </Box>

              {contract.approvedBy && (
                <Box>
                  <Typography variant="body2" color="textSecondary">Approved By</Typography>
                  <Typography variant="body1">
                    {contract.approvedBy?.firstName} {contract.approvedBy?.lastName}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {formatDate(contract.approvedAt)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {contract.amendments && contract.amendments.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Amendments
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {contract.amendments.map((amendment, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={amendment.amendmentNumber}
                        secondary={
                          <>
                            <Typography variant="body2">{amendment.description}</Typography>
                            <Typography variant="caption">
                              Effective: {formatDate(amendment.effectiveDate)}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Signed Contract</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setUploadFile(e.target.files[0])}
            />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
              Accepted formats: PDF, DOC, DOCX (Max 10MB)
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUploadSignedContract}
            disabled={uploading || !uploadFile}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activate Dialog */}
      <Dialog open={activateDialog} onClose={() => setActivateDialog(false)}>
        <DialogTitle>Activate Contract</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to activate this contract? This will make it officially active.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivateDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleActivateContract}>
            Activate
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ContractDetails;
