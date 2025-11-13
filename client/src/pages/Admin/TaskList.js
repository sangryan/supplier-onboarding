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
  Chip,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const TaskList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/dashboard/tasks');
      setTasks(response.data.data);
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'primary',
      pending_procurement: 'warning',
      pending_legal: 'info',
      more_info_required: 'error',
    };
    return colors[status] || 'default';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Tasks
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {user.role === 'procurement' 
            ? 'Applications awaiting procurement review'
            : 'Applications awaiting legal review'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {tasks.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No pending tasks
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            All applications have been processed
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Supplier Name</TableCell>
                <TableCell>Service Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task._id} hover>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {task.supplierName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" textTransform="capitalize">
                      {task.serviceType?.replace('_', ' ')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={task.status.replace('_', ' ').toUpperCase()} 
                      color={getStatusColor(task.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(task.submittedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {task.authorizedPerson?.email}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => navigate(`/suppliers/${task._id}`)}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          Total pending tasks: {tasks.length}
        </Typography>
      </Box>
    </Container>
  );
};

export default TaskList;
