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
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Footer from '../../components/Footer/Footer';

const CATEGORIES = [
  { key: 'roles', label: 'Roles', nameLabel: 'Role Name', descLabel: 'Role Description' },
  { key: 'entity_types', label: 'Entity Types', nameLabel: 'Entity Type Name', descLabel: 'Description' },
  { key: 'currencies', label: 'Currencies', nameLabel: 'Currency Code', descLabel: 'Currency Name' },
  { key: 'wealth_sources', label: 'Sources of wealth/funds', nameLabel: 'Source Name', descLabel: 'Description' },
  { key: 'service_types', label: 'Supplier Service Types', nameLabel: 'Service Type Name', descLabel: 'Description' },
];

const EMPTY_FORM = { name: '', description: '' };

const Setups = () => {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].key);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const activeCategoryMeta = CATEGORIES.find((c) => c.key === activeCategory);

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
          {/* Left sidebar */}
          <Paper
            elevation={0}
            sx={{
              width: 220,
              flexShrink: 0,
              border: '1px solid #e5e7eb',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            {CATEGORIES.map((cat) => (
              <Box
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                sx={{
                  px: 2.5,
                  py: 1.5,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeCategory === cat.key ? 600 : 400,
                  color: activeCategory === cat.key ? '#111827' : '#374151',
                  bgcolor: activeCategory === cat.key ? '#f3f4f6' : 'transparent',
                  borderLeft: activeCategory === cat.key ? '3px solid #578A18' : '3px solid transparent',
                  '&:hover': {
                    bgcolor: '#f9fafb',
                  },
                  transition: 'all 0.15s',
                }}
              >
                {cat.label}
              </Box>
            ))}
          </Paper>

          {/* Main content */}
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              border: '1px solid #e5e7eb',
              borderRadius: 2,
              p: { xs: 2, md: 3 },
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 3 }}>
              {activeCategoryMeta.label}
            </Typography>

            {/* Form */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', mb: 0.75, fontSize: '14px' }}>
                  {activeCategoryMeta.nameLabel}
                </Typography>
                <TextField
                  fullWidth
                  size="small"
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
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff' } }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, mb: 4 }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                sx={{
                  bgcolor: '#578A18',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': { bgcolor: '#467014' },
                }}
              >
                {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : editingId ? 'Update' : 'Save'}
              </Button>
              {editingId && (
                <Button
                  variant="outlined"
                  startIcon={<CloseIcon />}
                  onClick={handleCancelEdit}
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
              <Typography variant="body2" sx={{ color: '#9ca3af', py: 2 }}>
                No items added yet.
              </Typography>
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
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#6b7280', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item._id}
                      sx={{
                        bgcolor: editingId === item._id ? '#f0f7e6' : 'transparent',
                        '&:last-child td': { border: 0 },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>
                        {item.name}
                      </TableCell>
                      <TableCell sx={{ fontSize: '14px', color: '#374151' }}>
                        {item.description || '—'}
                      </TableCell>
                      <TableCell align="right">
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
      <Footer />
    </Box>
  );
};

export default Setups;
