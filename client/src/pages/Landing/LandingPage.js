import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Container,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Grid,
  Link,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header/Navigation */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          backgroundColor: '#fff', 
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', py: 1, px: { xs: 2, sm: 3 } }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              component="img"
              src="/images/Icon.svg"
              alt="Betika Logo"
              sx={{
                width: { xs: 32, sm: 40 },
                height: { xs: 30, sm: 37 },
                mr: 1.5,
              }}
            />
            {/* Mobile: Show "Supplier Onboarding" in two lines */}
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.2 }}>
                Supplier
              </Typography>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.2 }}>
                Onboarding
              </Typography>
            </Box>
            
            {/* Desktop: Show "Supplier Onboarding Portal" in one line */}
            <Typography 
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                fontSize: '16px', 
                fontWeight: 600, 
                color: theme.palette.text.primary, 
                whiteSpace: 'nowrap'
              }}
            >
              Supplier Onboarding Portal
            </Typography>
          </Box>

          {/* Navigation Links */}
          <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'center' }}>
            <Button
              onClick={() => navigate('/login')}
              sx={{
                color: theme.palette.text.secondary,
                textTransform: 'none',
                fontSize: { xs: '14px', sm: '15px' },
                fontWeight: 500,
                minWidth: 'auto',
                px: { xs: 1.5, sm: 2 },
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: theme.palette.primary.main,
                },
              }}
            >
              Login
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/register')}
              sx={{
                backgroundColor: theme.palette.green.main,
                color: '#fff',
                textTransform: 'none',
                fontSize: { xs: '14px', sm: '15px' },
                fontWeight: 500,
                px: { xs: 2, sm: 3 },
                py: { xs: 0.75, sm: 1 },
                borderRadius: '6px',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: theme.palette.green.hover,
                  boxShadow: 'none',
                },
              }}
            >
              Register
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          flex: 1,
          backgroundColor: '#fff',
          py: { xs: 3, sm: 4, md: 6 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
            {/* Content - Comes first on mobile, left on desktop */}
            <Grid item xs={12} md={6} sx={{ order: { xs: 1, md: 1 } }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 'bold',
                  mb: { xs: 2, md: 3 },
                  fontSize: { xs: '28px', sm: '36px', md: '48px' },
                  lineHeight: 1.2,
                  color: '#000',
                }}
              >
                Streamline Your Supplier Onboarding Process
              </Typography>

              <Typography
                sx={{
                  fontSize: { xs: '15px', sm: '16px', md: '18px' },
                  color: '#666',
                  mb: { xs: 3, md: 4 },
                  lineHeight: 1.6,
                }}
              >
                Transform your supplier management with our digital onboarding
                solution. Fast, efficient, and compliant.
              </Typography>

              {/* Steps */}
              <Box sx={{ mb: { xs: 3, md: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: { xs: 1.5, md: 2 } }}>
                  <Typography sx={{ fontWeight: 'bold', mr: 1, color: '#000', fontSize: { xs: '15px', md: '16px' } }}>1.</Typography>
                  <Typography sx={{ color: '#333', fontSize: { xs: '15px', md: '16px' } }}>
                    Register - Create your supplier account
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: { xs: 1.5, md: 2 } }}>
                  <Typography sx={{ fontWeight: 'bold', mr: 1, color: '#000', fontSize: { xs: '15px', md: '16px' } }}>2.</Typography>
                  <Typography sx={{ color: '#333', fontSize: { xs: '15px', md: '16px' } }}>
                    Fill form and submit documents
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Typography sx={{ fontWeight: 'bold', mr: 1, color: '#000', fontSize: { xs: '15px', md: '16px' } }}>3.</Typography>
                  <Typography sx={{ color: '#333', fontSize: { xs: '15px', md: '16px' } }}>
                    Get approved and onboarded
                  </Typography>
                </Box>
              </Box>

              {/* CTA Button */}
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  backgroundColor: theme.palette.green.main,
                  color: '#fff',
                  textTransform: 'none',
                  fontSize: { xs: '15px', md: '16px' },
                  fontWeight: 600,
                  px: { xs: 3, md: 4 },
                  py: { xs: 1.5, md: 1.75 },
                  borderRadius: '8px',
                  boxShadow: 'none',
                  maxWidth: { xs: '100%', md: '250px' },
                  '&:hover': {
                    backgroundColor: theme.palette.green.hover,
                    boxShadow: 'none',
                  },
                }}
              >
                Get Started
              </Button>
            </Grid>

            {/* Illustration - Comes after content on mobile, right on desktop */}
            <Grid item xs={12} md={6} sx={{ order: { xs: 2, md: 2 } }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: { xs: 'center', md: 'flex-end' },
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                {/* Handshake Illustration */}
                <Box
                  component="img"
                  src="/images/handshake.png"
                  alt="Handshake illustration"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                  sx={{
                    width: { xs: '90%', sm: '450px', md: '550px' },
                    maxWidth: '550px',
                    height: 'auto',
                    objectFit: 'contain',
                  }}
                />
                {/* Fallback placeholder if image not found */}
                <Box
                  sx={{
                    display: 'none',
                    width: { xs: '90%', sm: '450px', md: '550px' },
                    maxWidth: '550px',
                    height: { xs: '250px', sm: '400px', md: '500px' },
                    backgroundColor: '#f0f0f0',
                    borderRadius: '12px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2,
                    border: '2px dashed #d1d5db',
                  }}
                >
                  <Typography sx={{ fontSize: '48px' }}>🤝</Typography>
                  <Typography sx={{ color: '#666', fontSize: '14px', textAlign: 'center', px: 2 }}>
                    Save handshake.png to<br />client/public/images/
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          backgroundColor: '#f3f4f6',
          py: { xs: 4, md: 6 },
          borderTop: '1px solid #e0e0e0',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 3, md: 4 }}>
            {/* Support Column */}
            <Grid item xs={12} sm={4}>
              <Typography
                sx={{
                  fontWeight: 600,
                  mb: { xs: 1.5, md: 2 },
                  color: '#000',
                  fontSize: { xs: '15px', md: '16px' },
                }}
              >
                Support
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.75, md: 1 } }}>
                <Link
                  href="#"
                  sx={{
                    color: '#666',
                    textDecoration: 'none',
                    fontSize: { xs: '13px', md: '14px' },
                    '&:hover': { color: '#1976d2' },
                  }}
                >
                  Help Center
                </Link>
                <Link
                  href="#"
                  sx={{
                    color: '#666',
                    textDecoration: 'none',
                    fontSize: { xs: '13px', md: '14px' },
                    '&:hover': { color: '#1976d2' },
                  }}
                >
                  Documentation
                </Link>
                <Link
                  href="#"
                  sx={{
                    color: '#666',
                    textDecoration: 'none',
                    fontSize: { xs: '13px', md: '14px' },
                    '&:hover': { color: '#1976d2' },
                  }}
                >
                  FAQ
                </Link>
              </Box>
            </Grid>

            {/* Account Column */}
            <Grid item xs={12} sm={4}>
              <Typography
                sx={{
                  fontWeight: 600,
                  mb: { xs: 1.5, md: 2 },
                  color: '#000',
                  fontSize: { xs: '15px', md: '16px' },
                }}
              >
                Account
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.75, md: 1 } }}>
                <Link
                  href="#"
                  sx={{
                    color: '#666',
                    textDecoration: 'none',
                    fontSize: { xs: '13px', md: '14px' },
                    '&:hover': { color: '#1976d2' },
                  }}
                >
                  Privacy Policy
                </Link>
                <Link
                  href="#"
                  sx={{
                    color: '#666',
                    textDecoration: 'none',
                    fontSize: { xs: '13px', md: '14px' },
                    '&:hover': { color: '#1976d2' },
                  }}
                >
                  Terms of Service
                </Link>
                <Link
                  href="#"
                  sx={{
                    color: '#666',
                    textDecoration: 'none',
                    fontSize: { xs: '13px', md: '14px' },
                    '&:hover': { color: '#1976d2' },
                  }}
                >
                  Cookies Settings
                </Link>
              </Box>
            </Grid>

            {/* Contact Column */}
            <Grid item xs={12} sm={4}>
              <Typography
                sx={{
                  fontWeight: 600,
                  mb: { xs: 1.5, md: 2 },
                  color: '#000',
                  fontSize: { xs: '15px', md: '16px' },
                }}
              >
                Contact
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, md: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ fontSize: { xs: 16, md: 18 }, color: '#666' }} />
                  <Typography sx={{ color: '#666', fontSize: { xs: '13px', md: '14px' } }}>
                    support@betika.com
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: { xs: 16, md: 18 }, color: '#666' }} />
                  <Typography sx={{ color: '#666', fontSize: { xs: '13px', md: '14px' } }}>
                    072345678
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* Copyright */}
          <Box
            sx={{
              mt: { xs: 4, md: 6 },
              pt: { xs: 3, md: 3 },
              borderTop: '1px solid #e0e0e0',
              textAlign: 'center',
            }}
          >
            <Typography sx={{ color: '#999', fontSize: { xs: '12px', md: '14px' } }}>
              Copyright 2025 © www.betika.com
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;

