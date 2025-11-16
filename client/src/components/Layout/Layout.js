import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Badge,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  NotificationsOutlined as NotificationsOutlinedIcon,
  AccountCircle,
  Logout,
  HeadsetMic as HeadsetIcon,
  History as HistoryIcon,
  ExitToApp as ExitIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 280;

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  // Suppliers don't need sidebar
  const isSupplier = user?.role === 'supplier';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  // Menu items based on role - matching the design
  const getMenuItems = () => {
    if (user.role === 'supplier') {
      return [
        { text: 'My Application', icon: <AssignmentIcon />, path: '/application/status' },
        { text: 'New Application', icon: <BusinessIcon />, path: '/application/new' },
      ];
    } else if (user.role === 'procurement' || user.role === 'legal') {
      return [
        { text: 'My tasks', icon: <HomeIcon />, path: '/dashboard' },
        { text: 'All tasks', icon: <AssignmentIcon />, path: '/tasks/all' },
        { text: 'Supplier List', icon: <BusinessIcon />, path: '/suppliers' },
      ];
    } else {
      return [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Suppliers', icon: <BusinessIcon />, path: '/suppliers' },
        { text: 'Tasks', icon: <AssignmentIcon />, path: '/tasks' },
        { text: 'Contracts', icon: <DescriptionIcon />, path: '/contracts' },
        { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
      ];
    }
  };

  const menuItems = getMenuItems();
  const isActive = (path) => {
    // For procurement/legal users, "My tasks" should be active on /dashboard
    if (path === '/dashboard' && (user?.role === 'procurement' || user?.role === 'legal') && location.pathname === '/dashboard') return true;
    if (path === '/tasks' && location.pathname === '/tasks') return true;
    if (path === '/tasks/all' && location.pathname === '/tasks/all') return true;
    return location.pathname === path;
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f3f4f6' }}>
      {/* Header with Logo */}
      <Toolbar sx={{ minHeight: '64px !important', px: 2, py: 1.5, backgroundColor: '#f3f4f6' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Box
            component="img"
            src="/images/Icon.svg"
            alt="Betika Logo"
            sx={{
              width: 32,
              height: 32,
              flexShrink: 0
            }}
          />
          <Typography 
            variant="h6" 
            component="div"
            sx={{
              fontWeight: 600,
              fontSize: '16px',
              color: '#000',
              lineHeight: 1.2,
              whiteSpace: 'nowrap'
            }}
          >
            Supplier Onboarding Portal
          </Typography>
        </Box>
      </Toolbar>

      {/* Platform Section */}
      <Box sx={{ flexGrow: 1, py: 1, overflow: 'auto', backgroundColor: '#f3f4f6' }}>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography 
            sx={{ 
              fontSize: '12px', 
              fontWeight: 600, 
              color: '#6b7280', 
              letterSpacing: '0.5px',
              mb: 1
            }}
          >
            Platform
          </Typography>
        </Box>
        <List sx={{ px: 1 }}>
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: '8px',
                    backgroundColor: active ? '#d1d5db' : 'transparent',
                    color: active ? '#111827' : '#374151',
                    '&:hover': {
                      backgroundColor: active ? '#d1d5db' : '#d1d5db',
                    },
                    py: 1.5,
                    px: 2,
                    minHeight: '44px'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: active ? '#111827' : '#6b7280' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '14px',
                      fontWeight: active ? 600 : 400
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* Other Section */}
        <Box sx={{ mt: 2, px: 1 }}>
          <Box sx={{ px: 2, py: 1 }}>
            <Typography 
              sx={{ 
                fontSize: '12px', 
                fontWeight: 600, 
                color: '#6b7280', 
                letterSpacing: '0.5px',
                mb: 1
              }}
            >
              Other
            </Typography>
          </Box>
          <List>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                sx={{
                  borderRadius: '8px',
                  color: '#374151',
                              '&:hover': {
                                backgroundColor: '#d1d5db',
                              },
                  py: 1.5,
                  px: 2,
                  minHeight: '44px'
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: '#6b7280' }}>
                  <HeadsetIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Help and Support"
                  primaryTypographyProps={{
                    fontSize: '14px',
                    fontWeight: 400
                  }}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                sx={{
                  borderRadius: '8px',
                  color: '#374151',
                              '&:hover': {
                                backgroundColor: '#d1d5db',
                              },
                  py: 1.5,
                  px: 2,
                  minHeight: '44px'
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: '#6b7280' }}>
                  <HistoryIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Feedback"
                  primaryTypographyProps={{
                    fontSize: '14px',
                    fontWeight: 400
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ borderTop: '1px solid #e0e0e0', p: 2, backgroundColor: '#f3f4f6' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ 
            width: 32, 
            height: 32, 
            bgcolor: '#fff',
            color: '#6b7280',
            fontSize: '12px',
            fontWeight: 500,
            flexShrink: 0,
            border: '1px solid #e0e0e0'
          }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '14px', color: '#111827', lineHeight: 1.2 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '12px', textTransform: 'capitalize', lineHeight: 1.2 }}>
              {user?.role}
            </Typography>
          </Box>
          <IconButton
            onClick={handleLogout}
            sx={{
              color: '#dc2626',
              borderRadius: '8px',
              p: 0.75,
              flexShrink: 0,
              '&:hover': {
                backgroundColor: '#fee2e2',
              }
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '4px',
                backgroundColor: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <ExitIcon sx={{ fontSize: 16, color: '#fff' }} />
            </Box>
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#fff',
          color: '#000',
          boxShadow: 'none',
          borderBottom: '1px solid #e0e0e0',
          width: isSupplier ? '100%' : { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
          left: isSupplier ? 0 : { xs: 0, sm: `${drawerWidth}px` },
          right: 0,
          transition: 'left 0.3s ease, width 0.3s ease'
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important', px: { xs: 2, sm: 3 }, justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
            {!isSupplier && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ 
                  mr: { xs: 0, sm: 2 },
                  display: { xs: 'block', sm: 'none' },
                  color: '#000',
                  p: 1
                }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            {isSupplier ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  component="img"
                  src="/images/Icon.svg"
                  alt="Betika Logo"
                  sx={{
                    width: { xs: 32, sm: 40 },
                    height: { xs: 32, sm: 40 },
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                  <Typography 
                    sx={{
                      color: '#000',
                      fontWeight: 600,
                      fontSize: '14px',
                      lineHeight: 1.2,
                      mb: 0,
                    }}
                  >
                    Supplier
                  </Typography>
                  <Typography 
                    sx={{
                      color: '#000',
                      fontWeight: 600,
                      fontSize: '14px',
                      lineHeight: 1.2,
                      mt: 0,
                    }}
                  >
                    Onboarding
                  </Typography>
                </Box>
                <Typography 
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    color: '#000',
                    fontWeight: 600,
                    fontSize: '18px',
                  }}
                >
                  Supplier Onboarding Portal
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 1 }}>
                <Box
                  component="img"
                  src="/images/Icon.svg"
                  alt="Betika Logo"
                  sx={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                  }}
                />
                <Box>
                  <Typography 
                    sx={{
                      color: '#000',
                      fontWeight: 600,
                      fontSize: '14px',
                      lineHeight: 1.2,
                      mb: 0,
                    }}
                  >
                    Supplier
                  </Typography>
                  <Typography 
                    sx={{
                      color: '#000',
                      fontWeight: 600,
                      fontSize: '14px',
                      lineHeight: 1.2,
                      mt: 0,
                    }}
                  >
                    Onboarding
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton sx={{ color: '#6b7280', p: 1 }}>
              <Badge badgeContent={0} color="error">
                <NotificationsOutlinedIcon sx={{ color: '#6b7280' }} />
              </Badge>
            </IconButton>

            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              sx={{ 
                color: '#000',
                p: 0,
                '&:hover': {
                  backgroundColor: 'transparent'
                }
              }}
            >
              <Avatar sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: '#fff',
                color: '#6b7280',
                fontSize: '11px',
                fontWeight: 500,
                border: '1px solid #e0e0e0',
              }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
            </IconButton>

            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                <Typography variant="body2">
                  {user?.firstName} {user?.lastName}
                </Typography>
              </MenuItem>
              <MenuItem disabled>
                <Typography variant="caption" color="textSecondary">
                  {user?.role}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleProfile}>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar - Hidden for suppliers */}
      {!isSupplier && (
        <>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                borderRight: '1px solid #e0e0e0',
                backgroundColor: '#f3f4f6',
                height: '100vh',
                top: 0
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: `${drawerWidth}px`,
                borderRight: '1px solid #e0e0e0',
                backgroundColor: '#f3f4f6',
                height: '100vh',
                top: 0,
                position: 'fixed',
                left: 0
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: isSupplier ? '100%' : { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
          ml: isSupplier ? 0 : { xs: 0, sm: `${drawerWidth}px` },
          mt: isSupplier ? 8 : 8,
          backgroundColor: '#fff',
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease, width 0.3s ease',
          position: 'relative'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
