import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const InternalPasswordGuard = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isInternalRole = user?.role === 'legal' || user?.role === 'procurement';
  const isChangePasswordRoute = location.pathname === '/change-password';

  if (isInternalRole && user?.mustChangePassword && !isChangePasswordRoute) {
    return <Navigate to="/change-password" replace />;
  }

  return children;
};

export default InternalPasswordGuard;
