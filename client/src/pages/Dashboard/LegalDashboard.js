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
    Select,
    MenuItem,
    FormControl,
    Tooltip,
} from '@mui/material';
import {
    Search as SearchIcon,
    Download as DownloadIcon,
    ChevronRight as ChevronRightIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { keyframes } from '@mui/system';
import DottedArrowIcon from '../../components/DottedArrowIcon';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const DEPT_COLORS = [
    { bg: '#dbeafe', color: '#1d4ed8' },
    { bg: '#dcfce7', color: '#15803d' },
    { bg: '#fef9c3', color: '#a16207' },
    { bg: '#fce7f3', color: '#be185d' },
    { bg: '#ede9fe', color: '#6d28d9' },
    { bg: '#ffedd5', color: '#c2410c' },
    { bg: '#e0f2fe', color: '#0369a1' },
    { bg: '#fef2f2', color: '#b91c1c' },
];

const getDeptChipColors = (dept) => {
    let hash = 0;
    for (let i = 0; i < dept.length; i++) hash = dept.charCodeAt(i) + ((hash << 5) - hash);
    return DEPT_COLORS[Math.abs(hash) % DEPT_COLORS.length];
};

const bounceRight = keyframes`
  0%, 100% { transform: translateX(0px); }
  50% { transform: translateX(5px); }
`;

const LegalDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 10 });
    const [selectedRows, setSelectedRows] = useState([]);
    const [activeTab, setActiveTab] = useState('All Tasks');
    const [allTasksCount, setAllTasksCount] = useState(0);
    const [myTasksCount, setMyTasksCount] = useState(0);

    useEffect(() => {
        fetchTasks();
    }, [page, search, activeTab, statusFilter, sortOrder]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            let endpoint = '/dashboard/tasks';
            let params = { page, limit: 10, search, status: statusFilter, sortOrder };

            if (activeTab === 'All Tasks') {
                params.view = 'all';
            } else if (activeTab === 'My Tasks') {
                params.view = 'mine';
            } else if (activeTab === 'All Applications') {
                endpoint = '/dashboard/all-tasks';
            }

            const response = await api.get(endpoint, { params });

            if (response.data.success) {
                setTasks(response.data.data || []);
                setPagination(response.data.pagination || { total: 0, pages: 1, limit: 10 });
                if (activeTab === 'All Tasks' || activeTab === 'My Tasks') {
                    const c = response.data.counts || {};
                    setAllTasksCount(c.allTasks ?? 0);
                    setMyTasksCount(c.myTasks ?? 0);
                }
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePickUp = async (taskId, e) => {
        e.stopPropagation();
        try {
            await api.post(`/suppliers/${taskId}/assign`);
            toast.success('Task picked up — moved to My Tasks');
            fetchTasks();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to pick up task');
        }
    };

    const handleRelease = async (taskId, e) => {
        e.stopPropagation();
        try {
            await api.post(`/suppliers/${taskId}/unassign`);
            toast.success('Task released back to All Tasks');
            fetchTasks();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to release task');
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
        if ((task.rawStatus || task.status) === 'pending_contract_upload') {
            const contractId = task.contractId || task.supplier?.contract;
            if (contractId) {
                navigate(`/contracts/${contractId}?upload=1`);
            } else {
                navigate('/contracts');
            }
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

    const tabs = ['All Tasks', 'My Tasks', 'All Applications'];

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
                                {tab === 'All Tasks' && allTasksCount > 0 ? `All Tasks (${allTasksCount})` :
                                 tab === 'My Tasks' && myTasksCount > 0 ? `My Tasks (${myTasksCount})` : tab}
                            </Button>
                        ))}
                    </Box>
                </Box>

                {/* Search, Filter, Sort */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3, alignItems: 'center' }}>
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
                            flex: '1 1 200px',
                            maxWidth: '320px',
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: '#fff',
                                borderRadius: '8px',
                                '& fieldset': { borderColor: '#e0e0e0' },
                                '&:hover fieldset': { borderColor: '#9ca3af' },
                            }
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <Select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            displayEmpty
                            sx={{ borderRadius: '8px', fontSize: '14px', bgcolor: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0' } }}
                        >
                            <MenuItem value="">All Statuses</MenuItem>
                            <MenuItem value="pending_legal">Pending Approval</MenuItem>
                            <MenuItem value="pending_contract_upload">Pending Contract Upload</MenuItem>
                            <MenuItem value="approved">Approved</MenuItem>
                            <MenuItem value="rejected">Rejected</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                        </Select>
                    </FormControl>
                    <Tooltip title={sortOrder === 'asc' ? 'Oldest first — click for newest first' : 'Newest first — click for oldest first'}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => { setSortOrder(s => s === 'asc' ? 'desc' : 'asc'); setPage(1); }}
                            startIcon={sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                            sx={{ borderColor: '#e0e0e0', color: '#374151', textTransform: 'none', borderRadius: '8px', fontSize: '13px', whiteSpace: 'nowrap' }}
                        >
                            {sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}
                        </Button>
                    </Tooltip>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownload}
                        sx={{ borderColor: '#d1d5db', color: '#374151', textTransform: 'none', fontSize: '14px', borderRadius: '8px', ml: 'auto' }}
                    >
                        Download
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
                                    <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5, borderBottom: '1px solid #e0e0e0', display: { xs: 'none', md: 'table-cell' } }}>Company Name</TableCell>
                                    <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5, borderBottom: '1px solid #e0e0e0', display: { xs: 'none', md: 'table-cell' } }}>Last Approver</TableCell>
                                    <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5, borderBottom: '1px solid #e0e0e0', display: { xs: 'none', md: 'table-cell' } }}>Submission Date</TableCell>
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
                                                {formatTaskId(task)}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5, borderBottom: '1px solid #e0e0e0', display: { xs: 'none', md: 'table-cell' } }}>
                                                {task.supplierName}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5, borderBottom: '1px solid #e0e0e0', display: { xs: 'none', md: 'table-cell' } }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <span>{task.lastApprover || '-'}</span>
                                                    {task.lastApproverDepartment && task.lastApproverDepartment !== '-' && (() => {
                                                        const { bg, color } = getDeptChipColors(task.lastApproverDepartment);
                                                        return (
                                                            <Chip
                                                                label={task.lastApproverDepartment}
                                                                size="small"
                                                                sx={{ fontSize: '11px', height: '20px', backgroundColor: bg, color, fontWeight: 500 }}
                                                            />
                                                        );
                                                    })()}
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5, borderBottom: '1px solid #e0e0e0', display: { xs: 'none', md: 'table-cell' } }}>
                                                {formatDate(task.submissionDate || task.createdAt || task.updatedAt)}
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5, borderBottom: '1px solid #e0e0e0' }}>
                                                {getStatusChip(task.rawStatus || task.status)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 1.5, borderBottom: '1px solid #e0e0e0' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                    {activeTab === 'My Tasks' && task.assignedTo?.toString() === user?.id?.toString() && (
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={(e) => handleRelease(task._id, e)}
                                                            sx={{
                                                                textTransform: 'none',
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                borderColor: '#d1d5db',
                                                                color: '#6b7280',
                                                                px: 1.5,
                                                                py: 0.5,
                                                                minWidth: 0,
                                                                '&:hover': { backgroundColor: '#f9fafb', borderColor: '#9ca3af' },
                                                            }}
                                                        >
                                                            Release
                                                        </Button>
                                                    )}
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            color: '#578A18',
                                                            animation: `${bounceRight} 1.2s ease-in-out infinite`,
                                                            '&:hover': {
                                                                color: '#467014',
                                                                backgroundColor: 'transparent',
                                                                animationDuration: '0.5s',
                                                            },
                                                        }}
                                                    >
                                                        <DottedArrowIcon size={18} />
                                                    </IconButton>
                                                </Box>
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
