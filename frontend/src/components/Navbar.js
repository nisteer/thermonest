import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  FormControlLabel,
  Switch,
  Box,
  IconButton,
  Button
} from '@mui/material';
import { WbSunny, NightsStay } from '@mui/icons-material';
import { useAuth0 } from '@auth0/auth0-react';

const Navbar = ({ useDarkTheme, toggleTheme }) => {
  const { loginWithRedirect, logout, isAuthenticated, user, isLoading } = useAuth0();

  return (
    <AppBar position="sticky" color="primary">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left side - App title or user */}
        <Typography variant="h6" component="div">
          {isAuthenticated && !isLoading ? `Welcome, ${user.name}` : 'Env Dashboard'}
        </Typography>

        {/* Right side - Theme toggle and auth buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" size="small">
            <WbSunny fontSize="small" />
          </IconButton>

          <FormControlLabel
            control={
              <Switch
                checked={useDarkTheme}
                onChange={toggleTheme}
                color="default"
              />
            }
            label=""
            sx={{ margin: 0 }}
          />

          <IconButton color="inherit" size="small">
            <NightsStay fontSize="small" />
          </IconButton>

          {!isLoading && (
            isAuthenticated ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => logout({ returnTo: window.location.origin })}
              >
                Log Out
              </Button>
            ) : (
              <Button
                color="inherit"
                size="small"
                onClick={() => loginWithRedirect()}
              >
                Log In
              </Button>
            )
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
