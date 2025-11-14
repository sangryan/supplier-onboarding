import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
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
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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

  // Menu items based on role
  const getMenuItems = () => {
    const items = [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['all'] },
    ];

    if (user.role === 'supplier') {
      items.push(
        { text: 'My Application', icon: <AssignmentIcon />, path: '/application/status', roles: ['supplier'] },
        { text: 'New Application', icon: <BusinessIcon />, path: '/application/new', roles: ['supplier'] },
      );
    } else {
      items.push(
        { text: 'Suppliers', icon: <BusinessIcon />, path: '/suppliers', roles: ['procurement', 'legal', 'management', 'super_admin'] },
        { text: 'Tasks', icon: <AssignmentIcon />, path: '/tasks', roles: ['procurement', 'legal', 'super_admin'] },
        { text: 'Contracts', icon: <DescriptionIcon />, path: '/contracts', roles: ['legal', 'procurement', 'management', 'super_admin'] },
        { text: 'Reports', icon: <AssessmentIcon />, path: '/reports', roles: ['management', 'super_admin'] },
      );
    }

    if (user.role === 'super_admin') {
      items.push(
        { text: 'User Management', icon: <PeopleIcon />, path: '/users', roles: ['super_admin'] },
      );
    }

    return items.filter(item => 
      item.roles.includes('all') || item.roles.includes(user.role)
    );
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Supplier Portal
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {getMenuItems().map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          ...(isSupplier && {
            backgroundColor: '#fff',
            color: '#000',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          })
        }}
      >
        <Toolbar>
          {!isSupplier && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2, 
                display: { xs: 'block', sm: 'none' }
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {isSupplier ? (
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Box
                component="img"
                src="/images/Icon.svg"
                alt="Betika Logo"
                sx={{
                  width: { xs: 32, sm: 40 },
                  height: { xs: 30, sm: 38 },
                  mr: 1.5,
                }}
              />
              {/* Mobile - Two lines */}
              <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                <Typography 
                  sx={{
                    color: '#000',
                    fontWeight: 600,
                    fontSize: '15px',
                    lineHeight: 1.2,
                  }}
                >
                  Supplier
                </Typography>
                <Typography 
                  sx={{
                    color: '#000',
                    fontWeight: 600,
                    fontSize: '15px',
                    lineHeight: 1.2,
                  }}
                >
                  Onboarding
                </Typography>
              </Box>
              {/* Desktop - One line */}
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
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              Supplier Onboarding System
            </Typography>
          )}

          <IconButton sx={{ mr: 1, color: isSupplier ? '#6b7280' : 'inherit' }}>
            <Badge badgeContent={0} color="error">
              {isSupplier ? (
                <NotificationsOutlinedIcon sx={{ fontWeight: 'normal' }} />
              ) : (
                <NotificationsIcon />
              )}
            </Badge>
          </IconButton>

          <div>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              sx={{ color: isSupplier ? '#000' : 'inherit' }}
            >
              <Avatar sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: isSupplier ? '#fff' : '#263d8e',
                color: isSupplier ? '#374151' : '#fff',
                fontSize: '11px',
                fontWeight: 400,
                border: isSupplier ? '1px solid #d1d5db' : 'none',
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
          </div>
        </Toolbar>
      </AppBar>

      {/* Sidebar - Hidden for suppliers */}
      {!isSupplier && (
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isSupplier ? 0 : 3,
          width: isSupplier ? '100%' : { sm: `calc(100% - ${drawerWidth}px)` },
          mt: isSupplier ? 8 : 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;

