import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Typography,
  Paper,
  Box,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default icon issue in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const IPhoneSensors = () => {
  const [sensors, setSensors] = useState({
    acceleration: { x: 0, y: 0, z: 0 },
    rotation: { alpha: 0, beta: 0, gamma: 0 },
    orientation: { absolute: false, alpha: 0, beta: 0, gamma: 0 },
  });

  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [locationError, setLocationError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent));
    setIsSafari(/^((?!chrome|android).)*safari/i.test(userAgent));
  }, []);

  const handlePermissionRequest = async () => {
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function'
    ) {
      try {
        const permission = await DeviceMotionEvent.requestPermission();
        setPermissionStatus(permission);
        if (permission === 'granted') {
          setupListeners();
        }
      } catch (error) {
        console.error('Permission error:', error);
        setPermissionStatus('denied');
      }
    } else {
      setPermissionStatus('granted');
      setupListeners();
    }
  };

  const setupListeners = () => {
    window.addEventListener('devicemotion', handleMotion);
    window.addEventListener('deviceorientation', handleOrientation);
  };

  const handleMotion = (event) => {
    setSensors((prev) => ({
      ...prev,
      acceleration: {
        x: event.accelerationIncludingGravity?.x || 0,
        y: event.accelerationIncludingGravity?.y || 0,
        z: event.accelerationIncludingGravity?.z || 0,
      },
      rotation: {
        alpha: event.rotationRate?.alpha || 0,
        beta: event.rotationRate?.beta || 0,
        gamma: event.rotationRate?.gamma || 0,
      },
    }));
  };

  const handleOrientation = (event) => {
    setSensors((prev) => ({
      ...prev,
      orientation: {
        absolute: event.absolute || false,
        alpha: event.alpha || 0,
        beta: event.beta || 0,
        gamma: event.gamma || 0,
      },
    }));
  };

  const SensorCard = ({ title, values, unit = '' }) => (
    <Paper elevation={3} sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {Object.entries(values).map(([key, value]) => (
        <Typography key={key} variant="body1">
          {key}: {typeof value === 'number' ? value.toFixed(6) : value}
          {unit}
        </Typography>
      ))}
    </Paper>
  );

  const updateLocation = () => {
    setIsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationError(error.message);
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
      setIsLoading(false);
    }
  };

  if (isIOS && isSafari && permissionStatus !== 'granted') {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Motion Permission Required
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Tap the button below to enable motion and orientation sensors.
        </Typography>
        <Button variant="contained" onClick={handlePermissionRequest}>
          Enable Sensors
        </Button>
        {permissionStatus === 'denied' && (
          <Alert severity="error" sx={{ mt: 3 }}>
            Permission denied. Enable it from Settings → Safari → Motion & Orientation Access.
          </Alert>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh',
      }}
    >
      <Typography variant="h4" gutterBottom align="center">
        iPhone Sensor Data
      </Typography>

      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <SensorCard
          title="Acceleration (including gravity)"
          values={sensors.acceleration}
          unit=" m/s²"
        />

        <SensorCard title="Rotation Rate" values={sensors.rotation} unit=" °/s" />

        <SensorCard
          title="Orientation"
          values={{
            alpha: sensors.orientation.alpha,
            beta: sensors.orientation.beta,
            gamma: sensors.orientation.gamma,
            absolute: sensors.orientation.absolute ? 'true' : 'false',
          }}
          unit="°"
        />

        <SensorCard
          title="Location (GPS)"
          values={{
            latitude:
              location.latitude !== null ? location.latitude : 'Unavailable',
            longitude:
              location.longitude !== null ? location.longitude : 'Unavailable',
          }}
        />

        {location.latitude === null && !locationError && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button variant="outlined" onClick={updateLocation}>
              Update my location
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
              Location is used to display your current GPS coordinates.
            </Typography>
          </Box>
        )}

        {locationError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Location Error: {locationError}
          </Alert>
        )}

        {location.latitude && location.longitude && (
          <Box sx={{ mt: 4 }}>
            <MapContainer
              center={[location.latitude, location.longitude]}
              zoom={15}
              scrollWheelZoom={false}
              style={{ height: '400px', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[location.latitude, location.longitude]}>
                <Popup>Your current location</Popup>
              </Marker>
            </MapContainer>
          </Box>
        )}

        {isLoading && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Loading map...
            </Typography>
          </Box>
        )}

        <Typography
          variant="caption"
          display="block"
          sx={{ mt: 2, color: 'text.secondary' }}
        >
          Note: Magnetic field and ambient light sensors are not available via Safari.
        </Typography>
      </Box>
    </Box>
  );
};

export default IPhoneSensors;
