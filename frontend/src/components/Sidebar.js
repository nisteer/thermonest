import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
  Typography,
  IconButton,
  useTheme,
} from '@mui/material';
import { Link } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useMediaQuery } from '@mui/material';

const drawerWidth = 240;
const collapsedWidth = 72;

const Sidebar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(!isMobile);

  const handleToggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : collapsedWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        overflowX: 'hidden', // Hide horizontal overflow
        [`& .MuiDrawer-paper`]: {
          width: open ? drawerWidth : collapsedWidth,
          overflowX: 'hidden', // Hide horizontal overflow in paper
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          '&::-webkit-scrollbar': {
            display: 'none', // Hide scrollbar (optional)
          },
        },
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: [2],
          overflow: 'hidden', // Ensure no overflow in toolbar
        }}
      >
        {open ? (
          <Typography 
            variant="h6" 
            noWrap 
            component="div"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 'calc(100% - 40px)' // Ensure text doesn't overflow toggle button
            }}
          >
            ThermoNest
          </Typography>
        ) : null}
        <IconButton onClick={handleToggleDrawer}>
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Toolbar>
      
      <Divider />
      
      <Box 
        sx={{ 
          overflowY: 'auto',
          overflowX: 'hidden', // Hide horizontal overflow
          height: 'calc(100vh - 64px)', // Adjust height considering toolbar
          '&::-webkit-scrollbar': {
            display: 'none', // Hide scrollbar (optional)
          },
        }}
      >
        <List sx={{ overflowX: 'hidden' }}>
          <ListItem disablePadding sx={{ display: 'block', overflow: 'hidden' }}>
            <ListItemButton
              component={Link}
              to="/"
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                overflow: 'hidden',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Dashboard" 
                sx={{ 
                  opacity: open ? 1 : 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }} 
              />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ display: 'block', overflow: 'hidden' }}>
            <ListItemButton
              component={Link}
              to="/sensors"
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                overflow: 'hidden',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                <DeviceThermostatIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Sensors" 
                sx={{ 
                  opacity: open ? 1 : 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }} 
              />
            </ListItemButton>
          </ListItem>
        </List>
        <Divider />
      </Box>
    </Drawer>
  );
};

export default Sidebar;