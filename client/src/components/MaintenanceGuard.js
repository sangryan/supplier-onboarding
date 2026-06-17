import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Maintenance from '../pages/Maintenance';

const MaintenanceGuard = ({ children }) => {
  const { user } = useAuth();
  const [maintenance, setMaintenance] = useState(false);
  const [message, setMessage] = useState('');
  const [endTime, setEndTime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async (isFirst = false) => {
      try {
        const res = await api.get('/settings/maintenance');
        setMaintenance(res.data.data?.maintenanceMode || false);
        setMessage(res.data.data?.maintenanceMessage || '');
        setEndTime(res.data.data?.maintenanceEndTime || null);
      } catch {
        // On error, don't block access
      } finally {
        if (isFirst) setLoading(false);
      }
    };
    check(true);
    const interval = setInterval(() => check(false), 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  if (maintenance && user?.role !== 'super_admin') {
    return <Maintenance message={message} endTime={endTime} />;
  }

  return children;
};

export default MaintenanceGuard;
