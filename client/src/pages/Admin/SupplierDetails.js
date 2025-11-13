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
  Card,
  CardContent,
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
  Tab,
  Tabs,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Info,
  Download,
  Description,
} from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const SupplierDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '' });
  const [comments, setComments] = useState('');
  const [vendorNumber, setVendorNumber] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchSupplier();
  }, [id]);

  const fetchSupplier = async () => {
    try {
      const response = await api.get(`/suppliers/${id}`);
      setSupplier(response.data.data);
    } catch (error) {
      toast.error('Failed to load supplier details');
      console.error(error);
    } finally {
      setLoading(false);
    }
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

  const handleAssignVendorNumber = async () => {
    if (!vendorNumber.trim()) {
      toast.error('Please enter a vendor number');
      return;
    }
    try {
      await api.post(`/approvals/${id}/assign-vendor-number`, { vendorNumber });
      toast.success('Vendor number assigned successfully');
      setActionDialog({ open: false, type: '' });
      setVendorNumber('');
      fetchSupplier();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign vendor number');
    }
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

  const canApprove = () => {
    if (user.role === 'procurement') {
      return ['submitted', 'pending_procurement', 'more_info_required'].includes(supplier?.status);
    }
    if (user.role === 'legal') {
      return supplier?.status === 'pending_legal';
    }
    return false;
  };

  const canAssignVendorNumber = () => {
    return user.role === 'procurement' && supplier?.status === 'approved' && !supplier?.vendorNumber;
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
      <Container>
        <Alert severity="error">Supplier not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {supplier.supplierName}
          </Typography>
          <Chip 
            label={supplier.status.replace('_', ' ').toUpperCase()} 
            color={getStatusColor(supplier.status)}
            sx={{ mr: 1 }}
          />
          {supplier.vendorNumber && (
            <Chip label={`Vendor #: ${supplier.vendorNumber}`} color="success" />
          )}
        </Box>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>

      {canApprove() && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.light' }}>
          <Typography variant="h6" gutterBottom>
            Action Required
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => setActionDialog({ open: true, type: 'approve' })}
            >
              Approve
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Cancel />}
              onClick={() => setActionDialog({ open: true, type: 'reject' })}
            >
              Reject
            </Button>
            <Button
              variant="outlined"
              startIcon={<Info />}
              onClick={() => setActionDialog({ open: true, type: 'request_info' })}
            >
              Request More Info
            </Button>
          </Box>
        </Paper>
      )}

      {canAssignVendorNumber() && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.light' }}>
          <Typography variant="h6" gutterBottom>
            Application Approved - Assign Vendor Number
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setActionDialog({ open: true, type: 'assign_vendor' })}
            sx={{ mt: 1 }}
          >
            Assign Vendor Number
          </Button>
        </Paper>
      )}

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="Details" />
        <Tab label="Documents" />
        <Tab label="Approval History" />
      </Tabs>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Legal Nature</Typography>
                  <Typography variant="body1">{supplier.legalNature}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Service Type</Typography>
                  <Typography variant="body1">{supplier.serviceType}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Company Email</Typography>
                  <Typography variant="body1">{supplier.companyEmail}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">Credit Period</Typography>
                  <Typography variant="body1">{supplier.creditPeriod} days</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Authorized Person
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Name</Typography>
                  <Typography variant="body1">{supplier.authorizedPerson?.name}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Relationship</Typography>
                  <Typography variant="body1">{supplier.authorizedPerson?.relationship}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Email</Typography>
                  <Typography variant="body1">{supplier.authorizedPerson?.email}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">Phone</Typography>
                  <Typography variant="body1">{supplier.authorizedPerson?.phone}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Physical Address
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1">
                  {supplier.companyPhysicalAddress?.street}<br />
                  {supplier.companyPhysicalAddress?.city}, {supplier.companyPhysicalAddress?.country}<br />
                  {supplier.companyPhysicalAddress?.postalCode}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Documents
          </Typography>
          {supplier.documents && supplier.documents.length > 0 ? (
            <List>
              {supplier.documents.map((doc) => (
                <ListItem key={doc._id}>
                  <Description sx={{ mr: 2 }} color="primary" />
                  <ListItemText
                    primary={doc.originalName}
                    secondary={`Type: ${doc.documentType.replace('_', ' ')} • Uploaded: ${new Date(doc.uploadedAt).toLocaleDateString()}`}
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
            <Typography color="textSecondary">No documents uploaded yet</Typography>
          )}
        </Paper>
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Approval History
          </Typography>
          {supplier.approvalHistory && supplier.approvalHistory.length > 0 ? (
            <List>
              {supplier.approvalHistory.map((history, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`${history.action.toUpperCase()} by ${history.approver?.firstName} ${history.approver?.lastName} (${history.approver?.role})`}
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          {new Date(history.timestamp).toLocaleString()}
                        </Typography>
                        {history.comments && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            Comments: {history.comments}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="textSecondary">No approval history yet</Typography>
          )}
        </Paper>
      )}

      {/* Action Dialogs */}
      <Dialog 
        open={actionDialog.open} 
        onClose={() => setActionDialog({ open: false, type: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionDialog.type === 'approve' && 'Approve Application'}
          {actionDialog.type === 'reject' && 'Reject Application'}
          {actionDialog.type === 'request_info' && 'Request More Information'}
          {actionDialog.type === 'assign_vendor' && 'Assign Vendor Number'}
        </DialogTitle>
        <DialogContent>
          {actionDialog.type === 'assign_vendor' ? (
            <TextField
              fullWidth
              label="Vendor Number"
              value={vendorNumber}
              onChange={(e) => setVendorNumber(e.target.value)}
              placeholder="VEN-2024-0001"
              sx={{ mt: 2 }}
            />
          ) : (
            <TextField
              fullWidth
              multiline
              rows={4}
              label={actionDialog.type === 'reject' || actionDialog.type === 'request_info' ? 'Comments (Required)' : 'Comments (Optional)'}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                actionDialog.type === 'approve' 
                  ? 'Add any comments about the approval...'
                  : actionDialog.type === 'reject'
                  ? 'Please explain why the application is being rejected...'
                  : 'Specify what additional information is needed...'
              }
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog({ open: false, type: '' })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={actionDialog.type === 'reject' ? 'error' : 'primary'}
            onClick={() => {
              if (actionDialog.type === 'approve') handleApprove();
              else if (actionDialog.type === 'reject') handleReject();
              else if (actionDialog.type === 'request_info') handleRequestInfo();
              else if (actionDialog.type === 'assign_vendor') handleAssignVendorNumber();
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SupplierDetails;
