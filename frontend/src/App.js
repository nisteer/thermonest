import React, { useState } from 'react';
import { CssBaseline, ThemeProvider, Box, createTheme } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Sensors from './pages/Sensors';
import Phone from './pages/Phone';  // Import the Phone component

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
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

  const toggleTheme = () => setUseDarkTheme(!useDarkTheme);

  return (
    <ThemeProvider theme={useDarkTheme ? darkTheme : lightTheme}>
      <CssBaseline />
      <Router>
        <Navbar useDarkTheme={useDarkTheme} toggleTheme={toggleTheme} />
        <Box sx={{ display: 'flex' }}>
          <Sidebar />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Routes>
              {/* Set the default route to Dashboard */}
              <Route path="/" element={<Dashboard />} />
              {/* Pass the current theme to Sensors */}
              <Route path="/sensors" element={<Sensors theme={useDarkTheme ? darkTheme : lightTheme} />} />
              {/* Add route for the Phone component */}
              <Route path="/phone" element={<Phone />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;
