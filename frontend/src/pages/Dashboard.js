import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  useTheme,
  SpeedDial,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  Thermostat as TempIcon,
  Opacity as HumidityIcon,
  Add as AddIcon,
  ShowChart as MaxWidgetIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import io from 'socket.io-client';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

const socket = io('https://thermonest-server.onrender.com');

const Dashboard = () => {
  const theme = useTheme();

  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [tempHistory, setTempHistory] = useState([]);
  const [humidityHistory, setHumidityHistory] = useState([]);
  const [maxTemp, setMaxTemp] = useState(null);
  const [maxHumidity, setMaxHumidity] = useState(null);
  const [showMaxWidget, setShowMaxWidget] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const lastHumidityAlertTime = useRef(null);
  const lastTemperatureAlertTime = useRef(null);
  const [detailsType, setDetailsType] = useState(null);

  const handleShowDetails = (type) => {
    setDetailsType(type);
    setDetailsDialogOpen(true);
  };

  useEffect(() => {
    socket.emit('setTimeRange', '1h');

    socket.on('temperature', (data) => {
      if (data.length > 0) {
        const values = data.map((d) => d._value);
        setTemperature(values[values.length - 1]);
        setTempHistory(values);
        setMaxTemp(Math.max(...values));
      }
    });

    socket.on('humidity', (data) => {
      if (data.length > 0) {
        const values = data.map((d) => d._value);
        setHumidity(values[values.length - 1]);
        setHumidityHistory(values);
        setMaxHumidity(Math.max(...values));
      }
    });

    return () => {
      socket.off('temperature');
      socket.off('humidity');
    };
  }, []);

  useEffect(() => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (
      humidity !== null &&
      (humidity < 30 || humidity > 50) &&
      (!lastHumidityAlertTime.current || now - lastHumidityAlertTime.current >= oneHour)
    ) {
      lastHumidityAlertTime.current = now;

      toast.warn(
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ mr: 2 }}>
            Humidity Alert: The ideal humidity is between 30% and 50%.
          </Typography>
          <Button
            onClick={() => handleShowDetails('humidity')}
            color="inherit"
            size="small"
            variant="outlined"
            sx={{ textTransform: 'none' }}
          >
            Details
          </Button>
        </Box>,
        {
          position: 'top-right',
          autoClose: false,
          closeOnClick: false,
          closeButton: true,
        }
      );
    }
  }, [humidity]);

  useEffect(() => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
  
    if (
      temperature !== null &&
      (temperature < 18 || temperature > 26) && // Adjust the range as needed
      (!lastTemperatureAlertTime.current || now - lastTemperatureAlertTime.current >= oneHour)
    ) {
      lastTemperatureAlertTime.current = now;
  
      toast.warn(
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ mr: 2 }}>
            Temperature Alert: Recommended indoor temperature is between 18°C and 26°C.
          </Typography>
          <Button
            onClick={() => handleShowDetails('temperature')}
            color="inherit"
            size="small"
            variant="outlined"
            sx={{ textTransform: 'none' }}
          >
            Details
          </Button>
        </Box>,
        {
          position: 'top-right',
          autoClose: false,
          closeOnClick: false,
          closeButton: true,
        }
      );
    }
  }, [temperature]);

  const miniChartOptions = {
    responsive: true,
    elements: {
      line: { tension: 0.3, borderWidth: 2 },
      point: { radius: 0 },
    },
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
  };

  const renderMiniChart = (data, color) => (
    <Box
      sx={{
        width: '100%',
        height: '50px',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1,
        backgroundColor: theme.palette.background.paper,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        px: 1,
        pt: 0.5,
      }}
    >
      <Line
        data={{
          labels: data.map((_, i) => i),
          datasets: [
            {
              data,
              borderColor: color,
              backgroundColor: 'transparent',
            },
          ],
        }}
        options={miniChartOptions}
      />
    </Box>
  );

  const renderCard = (type, icon, label, value, unit, history, color) => (
    <Paper
      elevation={3}
      onMouseEnter={() => setHoveredCard(type)}
      onMouseLeave={() => setHoveredCard(null)}
      sx={{
        p: 3,
        pt: hoveredCard === type && history.length > 5 ? '60px' : 3,
        borderRadius: 3,
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '195px',
        minHeight: '195px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {hoveredCard === type && history.length > 5 && renderMiniChart(history.slice(-50), color)}
      <Box sx={{ mb: 2, color, zIndex: 2 }}>{icon}</Box>
      <Typography variant="h6" fontWeight="medium" sx={{ zIndex: 2 }}>
        {label}
      </Typography>
      <Typography variant="h3" fontWeight="bold" sx={{ zIndex: 2 }}>
        {value !== null ? `${value.toFixed(1)}${unit}` : '--'}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ zIndex: 2 }}>
        Last updated: {new Date().toLocaleTimeString()}
      </Typography>
    </Paper>
  );

  const renderMaxWidget = () => (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '195px',
        minHeight: '195px',
        position: 'relative',
      }}
    >
      <IconButton
        size="small"
        onClick={() => setShowMaxWidget(false)}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          color: theme.palette.grey[500],
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      <Box sx={{ mb: 2, color: theme.palette.secondary.main }}>
        <MaxWidgetIcon fontSize="large" />
      </Box>
      <Typography variant="h6" fontWeight="medium">
        Max Values (Last Hour)
      </Typography>
      <Typography variant="body1" sx={{ mt: 1 }}>
        <strong>Temp:</strong> {maxTemp !== null ? `${maxTemp.toFixed(1)}°C` : '--'}
      </Typography>
      <Typography variant="body1" sx={{ mt: 1 }}>
        <strong>Humidity:</strong> {maxHumidity !== null ? `${maxHumidity.toFixed(1)}%` : '--'}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        Updated: {new Date().toLocaleTimeString()}
      </Typography>
    </Paper>
  );

  const handleWidgetSelect = (widget) => {
    if (widget === 'max') setShowMaxWidget(true);
    setDialogOpen(false);
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh',
      }}
    >
      <Typography variant="h4" fontWeight="bold" mb={4} color="text.primary">
        Real-Time Environment Monitoring
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} sm={6} md={4}>
          {renderCard('temp', <TempIcon fontSize="large" />, 'Temperature', temperature, '°C', tempHistory, theme.palette.primary.main)}
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          {renderCard('humidity', <HumidityIcon fontSize="large" />, 'Humidity', humidity, '%', humidityHistory, theme.palette.secondary.main)}
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          {showMaxWidget && renderMaxWidget()}
        </Grid>
      </Grid>

      <SpeedDial
        ariaLabel="Open widget dialog"
        icon={<AddIcon />}
        onClick={() => setDialogOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Select Widget</DialogTitle>
        <DialogContent>
          <List>
            <ListItemButton onClick={() => handleWidgetSelect('max')}>
              <ListItemIcon>
                <MaxWidgetIcon />
              </ListItemIcon>
              <ListItemText primary="Max Temp & Humidity" />
            </ListItemButton>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)}>
        <DialogTitle>{detailsType} Details</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            More details about {detailsType} will go here...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </Box>
  );
};

export default Dashboard;
