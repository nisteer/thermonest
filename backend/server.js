const express = require('express');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const config = require('./config');
const { expressjwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const app = express();

// Use PORT environment variable for OnRender or default to 5000 in development
const port = process.env.PORT || 5000;

// InfluxDB config (make sure these values are set in your OnRender environment variables)
const { url, token, org, bucket } = config.influxDB;
const influxDB = new InfluxDB({ url, token });

// JWT authentication middleware for verifying Auth0 JWT tokens
const jwtCheck = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    jwksUri: `https://${config.auth0.domain}/.well-known/jwks.json`
  }),
  audience: config.auth0.audience,
  issuer: `https://${config.auth0.domain}/`,
  algorithms: ['RS256']
});

// CORS configuration for production (OnRender) and development (localhost)
const allowedOrigins = [
  'https://thermonest.vercel.app',  // Frontend URL
  'https://thermonest-server.onrender.com', // Backend URL
];

app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true); // Allow requests from allowed origins
    } else {
      callback(new Error('Not allowed by CORS')); // Reject requests from other origins
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Middleware to parse JSON body
app.use(express.json());

// REST API: Receive location data and send to InfluxDB
app.post('/api/location', jwtCheck, async (req, res) => {
  const { latitude, longitude } = req.body;
  const { sub: userId, name: userName } = req.user; // Getting user details from the JWT token

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Posizione non valida' });
  }

  try {
    const writeApi = influxDB.getWriteApi(org, bucket);
    const point = new Point('location')
      .tag('user_id', userId)  // Include user ID in the tags
      .tag('username', userName) // Include username in the tags
      .floatField('latitude', latitude)
      .floatField('longitude', longitude);

    writeApi.writePoint(point);
    await writeApi.flush();

    res.status(200).json({ success: 'Posizione registrata correttamente' });
  } catch (error) {
    console.error('Errore durante l\'invio della posizione:', error);
    res.status(500).json({ error: 'Errore durante l\'invio della posizione' });
  }
});

// Start the server
server.listen(port, () => {
  console.log(`HTTP server running at http://localhost:${port}`);
});
