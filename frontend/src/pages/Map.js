import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Box,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createCustomIcon = (imgUrl) =>
  new L.Icon({
    iconUrl: imgUrl,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: 'leaflet-div-icon',
  });

export default function UserMap() {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const [position, setPosition] = useState(null);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [error, setError] = useState(null);
  const [sharing, setSharing] = useState(false);

  const shareLocationToBackend = async (user, coords) => {
    await fetch('https://thermonest-server.onrender.com/api/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: user.name,
        email: user.email,
        picture: user.picture,
        coords,
      }),
    });
  };

  const fetchSharedUsers = async () => {
    const res = await fetch('https://thermonest-server.onrender.com/api/location');
    const data = await res.json();
    setSharedUsers(data);
  };

  const getLocation = () => {
    setSharing(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
        await shareLocationToBackend(user, coords);
        fetchSharedUsers();
        setError(null);
        setSharing(false);
      },
      (err) => {
        setError(err.message);
        setSharing(false);
      }
    );
  };

  useEffect(() => {
    fetchSharedUsers();
    const interval = setInterval(fetchSharedUsers, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <CircularProgress />;
  if (!isAuthenticated) return <Alert severity="info">Please log in to use the map.</Alert>;

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Share Your Location</Typography>
        <Button onClick={getLocation} variant="contained" sx={{ mt: 1 }}>
          Share My Location
        </Button>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>

      {sharing && (
        <Box display="flex" justifyContent="center" mt={2}>
          <CircularProgress />
        </Box>
      )}

      {sharedUsers.length > 0 && (
        <MapContainer
          center={sharedUsers[0]?.coords || [0, 0]}
          zoom={2}
          style={{ height: '500px', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {sharedUsers.map((u) => (
            <Marker key={u.email} position={u.coords} icon={createCustomIcon(u.picture)}>
              <Popup>
                <Typography variant="subtitle1">{u.name}</Typography>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </Box>
  );
}
