import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Maintenance from '../pages/Maintenance';

const MaintenanceGuard = ({ children }) => {
  const { user } = useAuth();
  const [maintenance, setMaintenance] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const check = async () => {
      try {
        const res = await api.get('/settings/maintenance');
        setMaintenance(res.data.data?.maintenanceMode || false);
        setMessage(res.data.data?.maintenanceMessage || '');
      } catch {
        // On error, don't block access
      }
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  if (maintenance && user?.role !== 'super_admin') {
    return <Maintenance message={message} />;
  }

  return children;
};

export default MaintenanceGuard;
