import React, { useEffect, useState } from 'react';
import {
    Container,
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    InputAdornment,
    IconButton,
    Chip,
    CircularProgress,
} from '@mui/material';
import {
    Search as SearchIcon,
    Download as DownloadIcon,
    ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const LegalDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 10 });
    const [selectedRows, setSelectedRows] = useState([]);
    const [activeTab, setActiveTab] = useState('My tasks');

    useEffect(() => {
        fetchTasks();
    }, [page, search, activeTab]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            let endpoint = '/dashboard/tasks';

            if (activeTab === 'All Applications') {
                endpoint = '/dashboard/all-tasks';
            } else if (activeTab === 'Ad-hoc Vendors') {
                endpoint = '/adhoc-vendors';
            }

            const response = await api.get(endpoint, {
                params: { page, limit: 10, search }
            });

            if (response.data.success) {
                setTasks(response.data.data || []);
                setPagination(response.data.pagination || { total: 0, pages: 1, limit: 10 });
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTaskId = (task) => {
        return task.taskId || `APP-${new Date().getFullYear()}-000`;
    };

    const getEntityType = (task) => {
        const typeMap = {
            company: 'Public/Foreign Company',
            sole_proprietorship: 'Sole Proprietor',
            trust: 'Trust',
            foreign_company: 'Foreign Company',
            individual: 'Individual',
            partnership: 'Partnership',
        };
        return typeMap[task.entityType] || task.entityType || '-';
    };

    const getStatusLabel = (status) => {
        const statusMap = {
            pending_legal: 'Pending Approval',
            pending_contract_upload: 'Pending Contract Upload',
            pending_procurement: 'Pending Procurement',
            approved: 'Approved',
            completed: 'Completed',
            rejected: 'Rejected',
            submitted: 'Submitted',
            under_review: 'Under Review',
            more_info_required: 'Requested More Info',
        };
        return statusMap[status] || status;
    };

    const getStatusChip = (status) => {
        const label = getStatusLabel(status);
        const isGreen = ['approved', 'completed'].includes(status);
        const isRed = status === 'rejected';

        let bgColor = '#f3f4f6';
        let textColor = '#374151';
        if (isGreen) { bgColor = '#dcfce7'; textColor = '#166534'; }
        if (isRed) { bgColor = '#fee2e2'; textColor = '#991b1b'; }

        return (
            <Chip
                label={label}
                size="small"
                sx={{
                    backgroundColor: bgColor,
                    color: textColor,
                    fontWeight: 500,
                    fontSize: '12px',
                    height: '24px',
                    borderRadius: '12px',
                    '& .MuiChip-label': {
                        padding: '0 10px'
                    }
                }}
            />
        );
    };

    const handleRowClick = (task) => {
        if (activeTab === 'Ad-hoc Vendors') {
            // No detail page yet for Ad-hoc Vendors built, but we can direct to a generic view or do nothing
            // navigate(`/adhoc-vendors/${task._id}`);
        } else if (task.supplier?._id) {
            navigate(`/suppliers/${task.supplier._id}`);
        } else if (task._id) {
            // in all-tasks the task itself is the supplier
            navigate(`/suppliers/${task._id}`);
        }
    };

    const handleDownload = () => {
        console.log('Download all tasks');
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const tabs = ['My tasks', 'All Applications', 'Ad-hoc Vendors'];

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', pb: 0 }}>
            <Container
                maxWidth="lg"
                sx={{
                    pt: { xs: 3, sm: 5 },
                    pb: { xs: 3, sm: 4 },
                    px: { xs: 2, sm: 3 },
                    flex: 1,
                }}
            >
                {/* Page Header */}
                <Box sx={{ mb: { xs: 3, sm: 4 } }}>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 'bold',
                            mb: 1,
                            color: '#111827',
                            fontSize: { xs: '22px', sm: '28px' },
                            letterSpacing: '-0.01em',
                        }}
                    >
                        Legal Dashboard
                    </Typography>
                    <Typography
                        sx={{
                            color: '#6b7280',
                            fontSize: { xs: '13px', sm: '14px' },
                            lineHeight: 1.6,
                        }}
                    >
                        Manage your supplier application approvals and contract uploads effortlessly.
                    </Typography>

                    {/* Tabs */}
                    <Box sx={{ mt: 3, display: 'flex', gap: 1, p: 0.5, bgcolor: '#f9fafb', borderRadius: '8px', width: 'fit-content' }}>
                        {tabs.map((tab) => (
                            <Button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setPage(1); }}
                                sx={{
                                    textTransform: 'none',
                                    color: activeTab === tab ? '#111827' : '#6b7280',
                                    fontWeight: activeTab === tab ? 600 : 500,
                                    fontSize: '14px',
                                    bgcolor: activeTab === tab ? '#fff' : 'transparent',
                                    px: 2,
                                    py: 0.75,
                                    borderRadius: '6px',
                                    boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    '&:hover': {
                                        bgcolor: activeTab === tab ? '#fff' : '#f3f4f6',
                                    }
                                }}
                            >
                                {tab}
                            </Button>
                        ))}
                    </Box>
                </Box>

                {/* Search and Download */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', sm: 'center' },
                    mb: 3,
                    gap: 2
                }}>
                    <TextField
                        placeholder="Search"
                        value={search}
                        onChange={handleSearchChange}
                        size="small"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#9ca3af', fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            flex: 1,
                            maxWidth: { xs: '100%', sm: '400px' },
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: '#fff',
                                borderRadius: '8px',
                                '& fieldset': {
                                    borderColor: '#e0e0e0'
                                },
                                '&:hover fieldset': {
                                    borderColor: '#9ca3af'
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#1976d2',
                                    borderWidth: '1px'
                                }
                            }
                        }}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownload}
                        sx={{
                            borderColor: '#d1d5db',
                            color: '#374151',
                            textTransform: 'none',
                            fontSize: '14px',
                            px: 2,
                            py: 1,
                            borderRadius: '8px',
                            width: { xs: '100%', sm: 'auto' },
                            '&:hover': {
                                borderColor: '#9ca3af',
                                bgcolor: '#f9fafb'
                            }
                        }}
                    >
                        Download all
                    </Button>
                </Box>

                {/* Tasks Table */}
                {loading ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer
                        elevation={0}
                        sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            overflow: 'hidden',
                            backgroundColor: '#fff'
                        }}
                    >
                        <Table sx={{ borderCollapse: 'collapse' }}>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                                    <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5, borderBottom: '1px solid #e0e0e0' }}>ID</TableCell>
                                    <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5, borderBottom: '1px solid #e0e0e0', display: { xs: 'none', md: 'table-cell' } }}>Supplier Name</TableCell>
                                    <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5, borderBottom: '1px solid #e0e0e0', display: { xs: 'none', md: 'table-cell' } }}>{activeTab === 'Ad-hoc Vendors' ? 'Department' : 'Entity Type'}</TableCell>
                                    <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5, borderBottom: '1px solid #e0e0e0', display: { xs: 'none', md: 'table-cell' } }}>{activeTab === 'Ad-hoc Vendors' ? 'Services Provided' : 'Submission Date'}</TableCell>
                                    <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5, borderBottom: '1px solid #e0e0e0' }}>Status</TableCell>
                                    <TableCell align="right" sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5, borderBottom: '1px solid #e0e0e0', width: 50 }}></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tasks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4, borderBottom: '1px solid #e0e0e0' }}>
                                            <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                                                No pending tasks
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    tasks.map((task) => (
                                        <TableRow
                                            key={task._id}
                                            hover
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': { backgroundColor: '#f9fafb' }
                                            }}
                                            onClick={() => handleRowClick(task)}
                                        >
                                            <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5, borderBottom: '1px solid #e0e0e0' }}>
                                                {activeTab === 'Ad-hoc Vendors' ? `ADHOC-${task._id.toString().slice(-4).toUpperCase()}` : formatTaskId(task)}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5, borderBottom: '1px solid #e0e0e0', display: { xs: 'none', md: 'table-cell' } }}>
                                                {task.supplierName}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5, borderBottom: '1px solid #e0e0e0', display: { xs: 'none', md: 'table-cell' } }}>
                                                {activeTab === 'Ad-hoc Vendors' ? (task.department || '-') : getEntityType(task)}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5, borderBottom: '1px solid #e0e0e0', display: { xs: 'none', md: 'table-cell' } }}>
                                                {activeTab === 'Ad-hoc Vendors' ? (task.servicesProvided || '-') : formatDate(task.submissionDate || task.createdAt || task.updatedAt)}
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5, borderBottom: '1px solid #e0e0e0' }}>
                                                {getStatusChip(task.rawStatus || task.status)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 1.5, borderBottom: '1px solid #e0e0e0' }}>
                                                <IconButton size="small" sx={{ color: '#9ca3af' }}>
                                                    <ChevronRightIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* Table Footer */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 2,
                            borderTop: '1px solid #e0e0e0'
                        }}>
                            <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                                {selectedRows.length} of {pagination.total} row(s) selected.
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Button
                                    size="small"
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                    sx={{
                                        textTransform: 'none',
                                        color: '#374151',
                                        fontSize: '13px',
                                        '&:disabled': { color: '#9ca3af' }
                                    }}
                                >
                                    Previous
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => setPage(page + 1)}
                                    disabled={page >= pagination.pages}
                                    sx={{
                                        textTransform: 'none',
                                        color: '#374151',
                                        fontSize: '13px',
                                        '&:disabled': { color: '#9ca3af' }
                                    }}
                                >
                                    Next
                                </Button>
                            </Box>
                        </Box>
                    </TableContainer>
                )}
            </Container>
        </Box>
    );
};

export default LegalDashboard;
