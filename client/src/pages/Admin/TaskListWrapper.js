import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TaskList from './TaskList';

/**
 * Wrapper component that redirects procurement/legal users to dashboard
 * since their dashboard (ProcurementDashboard) replaces the TaskList page
 */
const TaskListWrapper = () => {
  const { user } = useAuth();

  // Procurement and Legal users should use ProcurementDashboard (at /dashboard) instead
  if (user?.role === 'procurement' || user?.role === 'legal') {
    return <Navigate to="/dashboard" replace />;
  }

  // Other roles (admin, management, etc.) can use TaskList
  return <TaskList />;
};

export default TaskListWrapper;

