import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const InternalPasswordGuard = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isInternalRole = user?.role === 'legal' || user?.role === 'procurement';
  const isProfileRoute = location.pathname.startsWith('/profile');

  if (isInternalRole && user?.mustChangePassword && !isProfileRoute) {
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export default InternalPasswordGuard;
