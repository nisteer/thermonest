import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Typography,
  Paper,
  Box,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth0 } from '@auth0/auth0-react';

// Rimuove i marker default di Leaflet
delete L.Icon.Default.prototype._getIconUrl;

// Funzione per creare un'icona personalizzata da un'immagine (profilo)
const createAvatarIcon = (imageUrl) =>
  new L.Icon({
    iconUrl: imageUrl,
    iconSize: [40, 40],
    className: 'rounded-avatar-marker',
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

const MapPage = () => {
  const theme = useTheme();
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareLocation, setShareLocation] = useState(false);

  const { user, isAuthenticated, getAccessTokenSilently, loginWithRedirect } = useAuth0();

  useEffect(() => {
    if (!isAuthenticated) return;

    if (shareLocation) {
      setLoading(true);

      if (!navigator.geolocation) {
        setError('Geolocalizzazione non supportata dal browser.');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(coords);
          setLoading(false);

          try {
            const token = await getAccessTokenSilently();

            await fetch('/api/location', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                latitude: coords.lat,
                longitude: coords.lng,
              }),
            });
          } catch (err) {
            console.error('Errore durante invio posizione:', err);
          }
        },
        () => {
          setError('Impossibile ottenere la posizione.');
          setLoading(false);
        }
      );
    } else {
      setUserLocation(null);
    }
  }, [shareLocation, isAuthenticated]);

  const handleToggleShare = (event) => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }
    setShareLocation(event.target.checked);
  };

  return (
    <Paper sx={{ padding: 2, mt: 7 }}>
      <Typography variant="h5" gutterBottom>
        Mappa Utente
      </Typography>

      <FormControlLabel
        control={
          <Switch checked={shareLocation} onChange={handleToggleShare} />
        }
        label="Condividi la mia posizione"
        sx={{ mb: 2 }}
      />

      {error && <Alert severity="error">{error}</Alert>}

      {loading && (
        <Box display="flex" justifyContent="center" mt={3}>
          <CircularProgress />
        </Box>
      )}

      {!loading && shareLocation && userLocation && user && (
        <MapContainer
          center={[userLocation.lat, userLocation.lng]}
          zoom={13}
          style={{ height: '500px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={createAvatarIcon(user.picture)}
          >
            <Popup>
              <strong>{user.name}</strong><br />
              Tu sei qui.
            </Popup>
          </Marker>
        </MapContainer>
      )}
    </Paper>
  );
};

export default MapPage;
