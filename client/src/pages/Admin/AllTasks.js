import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Box,
    Button,
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
import api from '../../utils/api';
import Footer from '../../components/Footer/Footer';

const AllTasks = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 10 });
    const [selectedRows, setSelectedRows] = useState([]);

    useEffect(() => {
        fetchTasks();
    }, [page, search]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await api.get('/dashboard/all-tasks', {
                params: { page, limit: 10, search }
            });

            if (response.data.success) {
                setTasks(response.data.data || []);
                setPagination(response.data.pagination || { total: 0, pages: 1, limit: 10 });
            }
        } catch (err) {
            console.error('Error fetching all tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusChip = (status, rawStatus) => {
        const isCompleted = rawStatus === 'completed';
        const isRejected = rawStatus === 'rejected';
        return (
            <Chip
                label={status}
                size="small"
                sx={{
                    backgroundColor: isCompleted ? '#dcfce7' : isRejected ? '#fef2f2' : '#f3f4f6',
                    color: isCompleted ? '#166534' : isRejected ? '#991b1b' : '#374151',
                    fontWeight: isCompleted || isRejected ? 600 : 400,
                    fontSize: '13px',
                    height: '24px',
                    borderRadius: '12px',
                    '& .MuiChip-label': {
                        padding: '0 8px'
                    }
                }}
            />
        );
    };

    const handleRowClick = (task) => {
        if (task._id) {
            navigate(`/suppliers/${task._id}`);
        }
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

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
                    <Box sx={{ mb: 3 }}>
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
                            All tasks
                        </Typography>
                        <Typography
                            sx={{
                                color: '#6b7280',
                                fontSize: { xs: '13px', sm: '14px' },
                                lineHeight: 1.6,
                            }}
                        >
                            View and management all supplier onboarding tasks here
                        </Typography>
                    </Box>

                    {/* Search and Download */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
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
                                maxWidth: '400px',
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
                            sx={{
                                borderColor: '#d1d5db',
                                color: '#374151',
                                textTransform: 'none',
                                fontSize: '14px',
                                px: 2,
                                py: 1,
                                borderRadius: '8px',
                                '&:hover': {
                                    borderColor: '#9ca3af',
                                    bgcolor: '#f9fafb'
                                }
                            }}
                        >
                            Download all
                        </Button>
                    </Box>
                </Box>

                {/* Tasks Table */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer
                        component={Paper}
                        elevation={0}
                        sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            overflow: 'hidden',
                            backgroundColor: '#fff'
                        }}
                    >
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                                    <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5 }}>ID</TableCell>
                                    <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5 }}>Supplier Name</TableCell>
                                    <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5 }}>Entity Type</TableCell>
                                    <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5 }}>Submission Date</TableCell>
                                    <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5 }}>Status</TableCell>
                                    <TableCell align="right" sx={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', py: 1.5 }}></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tasks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
                                                No tasks found
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    tasks.map((task) => (
                                        <TableRow
                                            key={task._id}
                                            hover
                                            onClick={() => handleRowClick(task)}
                                            sx={{
                                                cursor: 'pointer',
                                                '&:last-child td, &:last-child th': { border: 0 },
                                                '&:hover': {
                                                    backgroundColor: '#f9fafb'
                                                }
                                            }}
                                        >
                                            <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5 }}>
                                                {task.taskId}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5 }}>
                                                {task.supplierName}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5 }}>
                                                {task.entityType}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5 }}>
                                                {formatDate(task.submissionDate)}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '14px', color: '#111827', py: 1.5 }}>
                                                {getStatusChip(task.status, task.rawStatus)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 1.5 }}>
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: '#6b7280' }}
                                                >
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
                                        '&:disabled': {
                                            color: '#9ca3af'
                                        }
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
                                        '&:disabled': {
                                            color: '#9ca3af'
                                        }
                                    }}
                                >
                                    Next
                                </Button>
                            </Box>
                        </Box>
                    </TableContainer>
                )}
            </Container>
            <Footer />
        </Box>
    );
};

export default AllTasks;
