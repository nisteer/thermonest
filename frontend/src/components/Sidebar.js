import React from 'react';
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
  useTheme,
} from '@mui/material';
import { Link } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import { useMediaQuery } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';

const drawerWidth = 240;
const collapsedWidth = 72;

const Sidebar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const open = !isMobile;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : collapsedWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        overflowX: 'hidden',
        [`& .MuiDrawer-paper`]: {
          width: open ? drawerWidth : collapsedWidth,
          overflowX: 'hidden',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          '&::-webkit-scrollbar': {
            display: 'none',
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
          overflow: 'hidden',
        }}
      />
      
      <Divider />
      
      <Box 
        sx={{ 
          overflowY: 'auto',
          overflowX: 'hidden',
          height: 'calc(100vh - 64px)',
          '&::-webkit-scrollbar': {
            display: 'none',
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

          <ListItem disablePadding sx={{ display: 'block', overflow: 'hidden' }}>
            <ListItemButton
              component={Link}
              to="/map"
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
                <MapIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Map" 
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
