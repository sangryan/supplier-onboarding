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
        const userData = response.data.user;
        // Only set user if email is verified (for 2FA flow)
        // Note: isEmailVerified might not be in the response, so we check for it
        if (userData && (userData.isEmailVerified !== false)) {
          setUser(userData);
        } else {
          // If email not verified, clear token to allow 2FA flow
          console.log('🟡 [AUTH] User email not verified, clearing token for 2FA flow');
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        setUser(null);
      }
    } else {
      // Ensure user is null if no token
      setUser(null);
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      console.log('🔵 [LOGIN] Starting login for:', email);
      console.log('API baseURL:', api.defaults.baseURL);
      
      const response = await api.post('/auth/login', { email, password });
      console.log('🔵 [LOGIN] Response status:', response.status);
      console.log('🔵 [LOGIN] Response data:', JSON.stringify(response.data, null, 2));
      
      // Check if email verification is required (can be in success: false or success: true response)
      if (response.data && response.data.requiresVerification) {
        console.log('🟡 [LOGIN] Email verification required - NOT setting user or token');
        // Return success: true to indicate the login attempt was valid, just needs verification
        return { 
          success: true, 
          requiresVerification: true,
          email: response.data.email || email,
          message: response.data.message || 'Please verify your email'
        };
      }
      
      // Only proceed if we have token and user (normal successful login)
      const { token, user } = response.data || {};
      
      if (!token || !user) {
        console.error('🔴 [LOGIN] Invalid response format - missing token or user:', response.data);
        throw new Error('Invalid response from server');
      }
      
      console.log('🟢 [LOGIN] Setting token and user');
      localStorage.setItem('token', token);
      setUser(user);
      toast.success('Login successful!');
      
      return { success: true, user };
    } catch (error) {
      console.error('🔴 [LOGIN] Error caught:', error);
      console.error('🔴 [LOGIN] Error response:', error.response?.data);
      console.error('🔴 [LOGIN] Error status:', error.response?.status);
      
      // Check if it's a verification requirement in error response
      if (error.response?.data?.requiresVerification) {
        console.log('🟡 [LOGIN] Email verification required (from error response)');
        return { 
          success: true, 
          requiresVerification: true,
          email: error.response.data.email || email,
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
      console.log('🔵 [REGISTER] Starting registration for:', userData.email);
      const response = await api.post('/auth/register', userData);
      console.log('🔵 [REGISTER] Response status:', response.status);
      console.log('🔵 [REGISTER] Response data:', JSON.stringify(response.data, null, 2));
      
      // Check if email verification is required
      if (response.data && response.data.requiresVerification) {
        console.log('🟡 [REGISTER] Email verification required - NOT setting user or token');
        console.log('🟡 [REGISTER] Returning requiresVerification flag');
        // IMPORTANT: Do NOT set user or token - user must verify email first
        return { 
          success: true, 
          requiresVerification: true,
          email: response.data.email || userData.email,
          message: response.data.message || 'Please verify your email'
        };
      }
      
      // Only set token and user if verification is NOT required
      const { token, user } = response.data || {};
      
      if (!token || !user) {
        console.error('🔴 [REGISTER] Missing token or user in response');
        throw new Error('Invalid response from server');
      }
      
      console.log('🟢 [REGISTER] Setting token and user');
      localStorage.setItem('token', token);
      setUser(user);
      toast.success('Registration successful!');
      
      return { success: true, user };
    } catch (error) {
      console.error('🔴 [REGISTER] Error caught:', error);
      console.error('🔴 [REGISTER] Error response:', error.response?.data);
      console.error('🔴 [REGISTER] Error status:', error.response?.status);
      
      // Check if it's a verification requirement in error response
      if (error.response?.data?.requiresVerification) {
        console.log('🟡 [REGISTER] Email verification required (from error response)');
        return { 
          success: true, 
          requiresVerification: true,
          email: error.response.data.email || userData.email,
          message: error.response.data.message || 'Please verify your email'
        };
      }
      
      const message = error.response?.data?.message || error.message || 'Registration failed';
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

