import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth0 } from '@auth0/auth0-react';

// Funzione per creare un'icona personalizzata
const createAvatarIcon = (imageUrl) =>
  new L.Icon({
    iconUrl: imageUrl,
    iconSize: [40, 40],
    className: 'rounded-avatar-marker',
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

const Map = () => {
  const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0();
  const [userLocation, setUserLocation] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Se non autenticato, richiedi l'autenticazione
  useEffect(() => {
    if (!isAuthenticated) {
      loginWithRedirect(); // Redirige l'utente alla pagina di login Auth0
    }
  }, [isAuthenticated, loginWithRedirect]);

  // Prendere la posizione dell'utente quando autenticato
  useEffect(() => {
    if (isAuthenticated && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);

        // Invia la posizione dell'utente al backend
        fetch('/api/location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: coords.lat,
            longitude: coords.lng,
            name: user.name,
            picture: user.picture, // Usa la foto del profilo di Auth0
          }),
        });
      });
    }
  }, [isAuthenticated, user]);

  // Recuperare gli utenti attivi dal backend
  useEffect(() => {
    const fetchActiveUsers = async () => {
      const res = await fetch('/api/active-users');
      const data = await res.json();
      setActiveUsers(data);
    };

    fetchActiveUsers();
    const interval = setInterval(fetchActiveUsers, 15000); // aggiorna ogni 15 secondi
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ marginTop: '70px' }}>
      {loading && <div>Loading...</div>}
      {userLocation && isAuthenticated && (
        <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} style={{ height: '500px', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[userLocation.lat, userLocation.lng]} icon={createAvatarIcon(user.picture)}>
            <Popup>Tu sei qui, {user.name}</Popup>
          </Marker>

          {activeUsers.map((user, index) => (
            <Marker
              key={index}
              position={[user.latitude, user.longitude]}
              icon={createAvatarIcon(user.picture)}
            >
              <Popup>{user.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
};

export default Map;
