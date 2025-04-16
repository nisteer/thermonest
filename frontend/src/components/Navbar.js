import React from 'react';
import { AppBar, Toolbar, Typography, FormControlLabel, Switch, Box, IconButton } from '@mui/material';
import { WbSunny, NightsStay } from '@mui/icons-material';

const Navbar = ({ useDarkTheme, toggleTheme }) => {
  return (
    <AppBar position="sticky" color="primary">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left side - App title/logo */}
        <Typography variant="h6" component="div">
          
        </Typography>

        {/* Right side - Theme toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton color="inherit" size="small" sx={{ mr: -1 }}>
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

          <IconButton color="inherit" size="small" sx={{ ml: -1 }}>
            <NightsStay fontSize="small" />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;