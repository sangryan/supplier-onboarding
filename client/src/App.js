import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { useAuth } from './context/AuthContext';

// Theme
import theme from './theme/theme';

// Components
import Layout from './components/Layout/Layout';
import PrivateRoute from './components/PrivateRoute';

// Pages
import LandingPage from './pages/Landing/LandingPage';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import TwoFactorAuth from './pages/Auth/TwoFactorAuth';
import Dashboard from './pages/Dashboard/Dashboard';
import SupplierApplication from './pages/Supplier/SupplierApplication';
import ApplicationStatus from './pages/Supplier/ApplicationStatus';
import SupplierList from './pages/Admin/SupplierList';
import SupplierDetails from './pages/Admin/SupplierDetails';
import TaskList from './pages/Admin/TaskList';
import ContractList from './pages/Contracts/ContractList';
import ContractDetails from './pages/Contracts/ContractDetails';
import UserManagement from './pages/Admin/UserManagement';
import Reports from './pages/Reports/Reports';
import Profile from './pages/Profile/Profile';
import NotFound from './pages/NotFound';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <Routes>
        {/* Landing Page */}
        <Route 
          path="/" 
          element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} 
        />

        {/* Public Routes */}
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/register" 
          element={!user ? <Register /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/2fa" 
          element={!user ? <TwoFactorAuth /> : <Navigate to="/dashboard" />} 
        />

        {/* Protected Routes */}
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Supplier Routes */}
          <Route path="/application/new" element={<SupplierApplication />} />
          <Route path="/application/:id" element={<ApplicationStatus />} />
          
          {/* Admin/Procurement/Legal Routes */}
          <Route path="/suppliers" element={<SupplierList />} />
          <Route path="/suppliers/:id" element={<SupplierDetails />} />
          <Route path="/tasks" element={<TaskList />} />
          
          {/* Contract Routes */}
          <Route path="/contracts" element={<ContractList />} />
          <Route path="/contracts/:id" element={<ContractDetails />} />
          
          {/* User Management */}
          <Route path="/users" element={<UserManagement />} />
          
          {/* Reports */}
          <Route path="/reports" element={<Reports />} />
        </Route>
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;

