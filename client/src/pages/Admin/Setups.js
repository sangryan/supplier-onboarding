import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Description as DocIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Footer from '../../components/Footer/Footer';

const CATEGORIES = [
  { key: 'roles',         label: 'Roles',                    nameLabel: 'Role Name',          descLabel: 'Role Description' },
  { key: 'entity_types',  label: 'Entity Types',             nameLabel: 'Entity Type Name',   descLabel: 'Description' },
  { key: 'currencies',    label: 'Currencies',               nameLabel: 'Currency Code',      descLabel: 'Currency Name' },
  { key: 'wealth_sources',label: 'Sources of wealth/funds',  nameLabel: 'Source Name',        descLabel: 'Description' },
  { key: 'service_types', label: 'Supplier Service Types',   nameLabel: 'Service Type Name',  descLabel: 'Description' },
  { key: 'bank_names', label: 'Bank Names', nameLabel: 'Bank Name', descLabel: 'Description' },
];

// All document fields available for entity type configuration
const AVAILABLE_DOCS = [
  { field: 'businessPermit',             label: 'Business Permit / Trading Licence',              defaultType: 'single' },
  { field: 'certificateOfIncorporation', label: 'Certificate of Incorporation or Registration',   defaultType: 'single' },
  { field: 'kraPinCertificate',          label: 'PIN Certificate',                                defaultType: 'single' },
  { field: 'etimsProof',                 label: 'Proof of Registration on e-TIMS',                defaultType: 'single' },
  { field: 'financialStatements',        label: 'Annual Audited Financial Statements',            defaultType: 'single' },
  { field: 'cr12',                       label: 'CR12 (not more than 30 days old)',               defaultType: 'single' },
  { field: 'companyProfile',             label: 'Company Profile',                                defaultType: 'single' },
  { field: 'bankReferenceLetter',        label: 'Bank Reference Letter',                          defaultType: 'single' },
  { field: 'directorsIds',               label: "Directors' IDs / Copies of Passports",           defaultType: 'multiple' },
  { field: 'partnershipDeed',            label: 'Partnership Deed',                               defaultType: 'single' },
  { field: 'partnersPinCertificate',     label: "Partners' PIN Certificate",                      defaultType: 'single' },
  { field: 'partnersTaxCompliance',      label: "Partners' Tax Compliance Certificate",           defaultType: 'single' },
  { field: 'partnerIds',                 label: "Partners' IDs / Copies of Passports",            defaultType: 'multiple' },
  { field: 'shareCertificate',           label: 'Valid Share Certificate',                        defaultType: 'single' },
  { field: 'registryExtract',            label: 'Valid Registry Extract',                         defaultType: 'single' },
  { field: 'taxComplianceCertificate',   label: 'Tax Compliance Certificate',                     defaultType: 'single' },
  { field: 'directorsNationalIds',       label: "Directors' National Identification Documents",   defaultType: 'multiple' },
  { field: 'directorsPassports',         label: "Directors' Passports",                           defaultType: 'multiple' },
  { field: 'nationalId',                 label: 'National Identification Card',                   defaultType: 'single' },
  { field: 'passportDocument',           label: 'Passport',                                       defaultType: 'single' },
  { field: 'workPermit',                 label: 'Work Permit (for foreigners)',                   defaultType: 'single' },
  { field: 'policeClearance',            label: 'Police Clearance Certificate',                   defaultType: 'single' },
  { field: 'resume',                     label: 'Resume (Curriculum Vitae)',                      defaultType: 'single' },
  { field: 'trustDeed',                  label: 'Trust Deed',                                     defaultType: 'single' },
  { field: 'founderPin',                 label: "Founders' PIN Certificate",                      defaultType: 'single' },
  { field: 'foundersIds',                label: "Founders' IDs / Copies of Passports",            defaultType: 'multiple' },
  { field: 'beneficiariesIds',           label: "Beneficiaries' IDs / Copies of Passports",      defaultType: 'multiple' },
];

const EMPTY_FORM = { name: '', description: '' };
const EMPTY_DOC  = { field: '', label: '', uploadType: 'single', required: true };

// Mandatory for every entity type — shown as locked rows, always prepended on save
const PREDEFINED_DOCS = [
  { field: 'businessPermit',      label: 'Business Permit / Trading Licence', uploadType: 'single', required: true },
  { field: 'bankReferenceLetter', label: 'Bank Reference Letter',              uploadType: 'single', required: true },
];
const PREDEFINED_FIELDS = new Set(PREDEFINED_DOCS.map((d) => d.field));

// ─── Document management dialog ───────────────────────────────────────────────
const EntityTypeDocsDialog = ({ item, onClose, onSaved }) => {
  const [docs, setDocs]     = useState(
    (item?.documents || []).filter((d) => !PREDEFINED_FIELDS.has(d.field))
  );
  const [newDoc, setNewDoc] = useState(EMPTY_DOC);
  const [saving, setSaving] = useState(false);

  const handleFieldSelect = (field) => {
    const meta = AVAILABLE_DOCS.find((d) => d.field === field);
    setNewDoc((p) => ({
      ...p,
      field,
      label:      meta?.label       || '',
      uploadType: meta?.defaultType  || 'single',
    }));
  };

  const handleAddDoc = () => {
    if (!newDoc.field) { toast.error('Select a document type'); return; }
    if (docs.some((d) => d.field === newDoc.field)) {
      toast.error('This document is already in the list'); return;
    }
    setDocs((prev) => [...prev, { ...newDoc }]);
    setNewDoc(EMPTY_DOC);
  };

  const handleRemoveDoc = (field) =>
    setDocs((prev) => prev.filter((d) => d.field !== field));

  const handleToggleRequired = (field) =>
    setDocs((prev) =>
      prev.map((d) => d.field === field ? { ...d, required: !d.required } : d)
    );

  const handleToggleUploadType = (field) =>
    setDocs((prev) =>
      prev.map((d) =>
        d.field === field
          ? { ...d, uploadType: d.uploadType === 'single' ? 'multiple' : 'single' }
          : d
      )
    );

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/setup-config/${item._id}`, {
        name: item.name,
        description: item.description || '',
        documents: [...PREDEFINED_DOCS, ...docs],
      });
      toast.success('Documents updated');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Fields not yet in the editable list, excluding predefined ones
  const availableToAdd = AVAILABLE_DOCS.filter(
    (d) => !PREDEFINED_FIELDS.has(d.field) && !docs.some((existing) => existing.field === d.field)
  );

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '16px', color: '#111827' }}>
            Documents — {item.name}
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
            Define which documents suppliers must upload for this entity type
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Predefined mandatory documents — always required, cannot be modified */}
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#6b7280', fontSize: '12px' }}>Document</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#6b7280', fontSize: '12px' }}>Upload</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#6b7280', fontSize: '12px' }}>Required</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {PREDEFINED_DOCS.map((doc) => (
              <TableRow key={doc.field} sx={{ bgcolor: '#f9fafb', '&:last-child td': { border: 0 } }}>
                <TableCell>
                  <Typography sx={{ fontWeight: 500, fontSize: '13px', color: '#374151' }}>{doc.label}</Typography>
                  <Typography sx={{ fontSize: '11px', color: '#9ca3af' }}>{doc.field}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label="Single" size="small" sx={{ fontSize: '11px', bgcolor: '#e0f2fe', color: '#0369a1' }} />
                </TableCell>
                <TableCell>
                  <Checkbox checked disabled size="small" sx={{ '&.Mui-checked': { color: '#578A18' } }} />
                </TableCell>
                <TableCell align="right">
                  <Chip label="Predefined" size="small" sx={{ fontSize: '11px', bgcolor: '#f3f4f6', color: '#6b7280' }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Divider sx={{ mb: 2 }} />

        {/* Configurable documents */}
        {docs.length === 0 ? (
          <Typography variant="body2" sx={{ color: '#9ca3af', mb: 2 }}>
            No additional documents configured yet.
          </Typography>
        ) : (
          <Table size="small" sx={{ mb: 3 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#6b7280', fontSize: '12px' }}>Document</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6b7280', fontSize: '12px' }}>Upload</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6b7280', fontSize: '12px' }}>Required</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {docs.map((doc) => (
                <TableRow key={doc.field} sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 500, fontSize: '13px', color: '#111827' }}>{doc.label}</Typography>
                    <Typography sx={{ fontSize: '11px', color: '#9ca3af' }}>{doc.field}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={doc.uploadType === 'single' ? 'Single' : 'Multiple'}
                      size="small"
                      onClick={() => handleToggleUploadType(doc.field)}
                      sx={{
                        cursor: 'pointer',
                        fontSize: '11px',
                        bgcolor: doc.uploadType === 'single' ? '#e0f2fe' : '#fef3c7',
                        color:   doc.uploadType === 'single' ? '#0369a1' : '#92400e',
                        '&:hover': { opacity: 0.85 },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={doc.required}
                          onChange={() => handleToggleRequired(doc.field)}
                          size="small"
                          sx={{ color: '#578A18', '&.Mui-checked': { color: '#578A18' } }}
                        />
                      }
                      label=""
                      sx={{ m: 0 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleRemoveDoc(doc.field)} sx={{ color: '#c62828' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Add new document row */}
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mb: 1.5, fontSize: '13px' }}>
          Add Document
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <Select
              value={newDoc.field}
              onChange={(e) => handleFieldSelect(e.target.value)}
              displayEmpty
            >
              <MenuItem value="" disabled>Select document type</MenuItem>
              {availableToAdd.map((d) => (
                <MenuItem key={d.field} value={d.field}>{d.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={newDoc.uploadType}
              onChange={(e) => setNewDoc((p) => ({ ...p, uploadType: e.target.value }))}
            >
              <MenuItem value="single">Single file</MenuItem>
              <MenuItem value="multiple">Multiple files</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={newDoc.required}
                onChange={(e) => setNewDoc((p) => ({ ...p, required: e.target.checked }))}
                size="small"
                sx={{ color: '#578A18', '&.Mui-checked': { color: '#578A18' } }}
              />
            }
            label={<Typography sx={{ fontSize: '13px', color: '#374151' }}>Required</Typography>}
            sx={{ m: 0 }}
          />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddDoc}
            disabled={!newDoc.field}
            sx={{ textTransform: 'none', borderColor: '#d1d5db', color: '#374151', height: 40 }}
          >
            Add
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#6b7280' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{ bgcolor: '#578A18', textTransform: 'none', '&:hover': { bgcolor: '#467014' } }}
        >
          {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main Setups page ─────────────────────────────────────────────────────────
const Setups = () => {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].key);
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [editingId, setEditingId]   = useState(null);
  const [docsItem, setDocsItem]     = useState(null); // entity type being configured

  const activeCategoryMeta = CATEGORIES.find((c) => c.key === activeCategory);
  const isEntityTypes = activeCategory === 'entity_types';

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/setup-config/${activeCategory}`);
      setItems(res.data.data || []);
    } catch {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    fetchItems();
  }, [fetchItems]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error(`${activeCategoryMeta.nameLabel} is required`);
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/setup-config/${editingId}`, { name: form.name, description: form.description });
        toast.success('Item updated successfully');
      } else {
        await api.post('/setup-config', { category: activeCategory, name: form.name, description: form.description });
        toast.success('Item saved successfully');
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({ name: item.name, description: item.description || '' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/setup-config/${id}`);
      toast.success('Item deleted');
      fetchItems();
    } catch {
      toast.error('Failed to delete item');
    }
  };

  return (
    <Box sx={{ bgcolor: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
          Setups
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280', mb: 3 }}>
          View and manage dynamic form items
        </Typography>

        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          {/* Sidebar */}
          <Paper elevation={0} sx={{ width: 220, flexShrink: 0, border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
            {CATEGORIES.map((cat) => (
              <Box
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                sx={{
                  px: 2.5, py: 1.5, cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeCategory === cat.key ? 600 : 400,
                  color:   activeCategory === cat.key ? '#111827' : '#374151',
                  bgcolor: activeCategory === cat.key ? '#f3f4f6' : 'transparent',
                  borderLeft: activeCategory === cat.key ? '3px solid #578A18' : '3px solid transparent',
                  '&:hover': { bgcolor: '#f9fafb' },
                  transition: 'all 0.15s',
                }}
              >
                {cat.label}
              </Box>
            ))}
          </Paper>

          {/* Main content */}
          <Paper elevation={0} sx={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 2, p: { xs: 2, md: 3 } }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 3 }}>
              {activeCategoryMeta.label}
            </Typography>

            {/* Add / Edit form */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', mb: 0.75, fontSize: '14px' }}>
                  {activeCategoryMeta.nameLabel}
                </Typography>
                <TextField
                  fullWidth size="small"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff' } }}
                />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', mb: 0.75, fontSize: '14px' }}>
                  {activeCategoryMeta.descLabel}
                </Typography>
                <TextField
                  fullWidth multiline rows={3} size="small"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff' } }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, mb: 4 }}>
              <Button
                variant="contained" onClick={handleSave} disabled={saving}
                sx={{ bgcolor: '#578A18', textTransform: 'none', fontWeight: 500, '&:hover': { bgcolor: '#467014' } }}
              >
                {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : editingId ? 'Update' : 'Save'}
              </Button>
              {editingId && (
                <Button
                  variant="outlined" startIcon={<CloseIcon />} onClick={handleCancelEdit}
                  sx={{ textTransform: 'none', borderColor: '#d1d5db', color: '#374151' }}
                >
                  Cancel
                </Button>
              )}
            </Box>

            {/* Table */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} sx={{ color: '#578A18' }} />
              </Box>
            ) : items.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#9ca3af', py: 2 }}>No items added yet.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#6b7280', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>
                      {activeCategoryMeta.nameLabel}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#6b7280', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>
                      {activeCategoryMeta.descLabel}
                    </TableCell>
                    {isEntityTypes && (
                      <TableCell sx={{ fontWeight: 600, color: '#6b7280', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>
                        Documents
                      </TableCell>
                    )}
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#6b7280', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item._id}
                      sx={{ bgcolor: editingId === item._id ? '#f0f7e6' : 'transparent', '&:last-child td': { border: 0 } }}
                    >
                      <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>{item.name}</TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#374151' }}>{item.description || '—'}</TableCell>
                      {isEntityTypes && (
                        <TableCell>
                          <Chip
                            label={`${(item.documents || []).length} doc${(item.documents || []).length !== 1 ? 's' : ''}`}
                            size="small"
                            sx={{ fontSize: '11px', bgcolor: '#f0f7e6', color: '#467014', fontWeight: 600 }}
                          />
                        </TableCell>
                      )}
                      <TableCell align="right">
                        {isEntityTypes && (
                          <IconButton
                            size="small"
                            onClick={() => setDocsItem(item)}
                            title="Manage documents"
                            sx={{ color: '#578A18', mr: 0.5 }}
                          >
                            <DocIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton size="small" onClick={() => handleEdit(item)} sx={{ color: '#6b7280' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(item._id)} sx={{ color: '#c62828' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Box>
      </Container>

      {/* Document management dialog */}
      {docsItem && (
        <EntityTypeDocsDialog
          item={docsItem}
          onClose={() => setDocsItem(null)}
          onSaved={fetchItems}
        />
      )}

      <Footer />
    </Box>
  );
};

export default Setups;
