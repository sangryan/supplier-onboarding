import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkSupplierProfileComplete } from '../utils/profileCheck';

/**
 * Component that redirects suppliers to profile page if their profile is incomplete
 */
const SupplierProfileGuard = ({ children }) => {
  const { user, loading } = useAuth();
  const [profileComplete, setProfileComplete] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      if (loading) {
        return;
      }

      if (!user) {
        setChecking(false);
        return;
      }

      if (user.role === 'supplier') {
        const complete = await checkSupplierProfileComplete(user);
        setProfileComplete(complete);
      } else {
        setProfileComplete(true); // Non-suppliers don't need profile check
      }
      
      setChecking(false);
    };

    checkProfile();
  }, [user, loading]);

  if (loading || checking) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // If supplier profile is incomplete, redirect to profile page
  if (user.role === 'supplier' && profileComplete === false) {
    return <Navigate to="/profile" />;
  }

  return children;
};

export default SupplierProfileGuard;

