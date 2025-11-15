import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      console.log('Login attempt:', { email, password: password.substring(0, 3) + '***' });
      console.log('API baseURL:', api.defaults.baseURL);
      
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      // Check if email verification is required
      if (response.data.requiresVerification) {
        return { 
          success: false, 
          requiresVerification: true,
          email: response.data.email,
          message: response.data.message || 'Please verify your email'
        };
      }
      
      const { token, user } = response.data;
      
      if (!token || !user) {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response from server');
      }
      
      console.log('Storing token and user:', { token: token.substring(0, 20) + '...', user });
      localStorage.setItem('token', token);
      setUser(user);
      toast.success('Login successful!');
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error full:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Response headers:', error.response?.headers);
      
      // Check if it's a verification requirement
      if (error.response?.data?.requiresVerification) {
        return { 
          success: false, 
          requiresVerification: true,
          email: error.response.data.email,
          message: error.response.data.message || 'Please verify your email'
        };
      }
      
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      // Check if email verification is required
      if (response.data.requiresVerification) {
        return { 
          success: true, 
          requiresVerification: true,
          email: response.data.email,
          message: response.data.message || 'Please verify your email'
        };
      }
      
      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }
      
      localStorage.setItem('token', token);
      setUser(user);
      toast.success('Registration successful!');
      
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const verifyOTP = async (email, otpCode) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otpCode });
      
      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setUser(user);
        toast.success('Email verified successfully!');
        return { success: true, user };
      } else {
        throw new Error(response.data.message || 'OTP verification failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'OTP verification failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const resendOTP = async (email) => {
    try {
      const response = await api.post('/auth/resend-otp', { email });
      toast.success('OTP code has been resent to your email');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend OTP';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.info('Logged out successfully');
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    verifyOTP,
    resendOTP,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

