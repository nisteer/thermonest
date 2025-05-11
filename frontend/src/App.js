// App.js
import React, { useState, useEffect } from 'react';
import { CssBaseline, ThemeProvider, Box, createTheme } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Sensors from './pages/Sensors';
import Map from './pages/Map';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    secondary: { main: '#f48fb1' },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    text: {
      primary: '#ffffff',
      secondary: '#94a3b8',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h4: { fontWeight: 600 },
    h6: { fontWeight: 500 },
    subtitle1: { fontWeight: 400, color: '#90caf9' },
  },
});

const App = () => {
  const [useDarkTheme, setUseDarkTheme] = useState(true);
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect();
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  if (isLoading || !isAuthenticated) {
    return <div>Loading authentication...</div>;
  }

  return (
    <ThemeProvider theme={useDarkTheme ? darkTheme : lightTheme}>
      <CssBaseline />
      <Router>
        <Navbar useDarkTheme={useDarkTheme} toggleTheme={() => setUseDarkTheme(!useDarkTheme)} />
        <Box sx={{ display: 'flex' }}>
          <Sidebar />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sensors" element={<Sensors theme={useDarkTheme ? darkTheme : lightTheme} />} />
              <Route path="/map" element={<Map theme={useDarkTheme ? darkTheme : lightTheme} />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;
