const express = require('express');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const config = require('./config');
const { expressjwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const app = express();

// Create HTTP server (NECESSARIO per socket.io)
const server = http.createServer(app);

// Socket.IO setup (puoi rimuoverlo se non usi websocket per ora)
const io = new Server(server, {
  cors: {
    origin: [
      'https://thermonest.vercel.app',
      'https://thermonest-server.onrender.com',
    ],
    methods: ['GET', 'POST'],
  },
});

// Use PORT environment variable for OnRender or default to 5000 in development
const port = process.env.PORT || 5000;

// InfluxDB config
const { url, token, org, bucket } = config.influxDB;
const influxDB = new InfluxDB({ url, token });

// Auth0 JWT check middleware
const jwtCheck = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${config.auth0.domain}/.well-known/jwks.json`,
  }),
  audience: config.auth0.audience,
  issuer: `https://${config.auth0.domain}/`,
  algorithms: ['RS256'],
});

// CORS setup
const allowedOrigins = [
  'https://thermonest.vercel.app',
  'https://thermonest-server.onrender.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON
app.use(express.json());

// Protected route to receive and store user location
app.post('/api/location', jwtCheck, async (req, res) => {
  const { latitude, longitude } = req.body;
  const { sub: userId, name: userName } = req.user;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Posizione non valida' });
  }

  try {
    const writeApi = influxDB.getWriteApi(org, bucket);
    const point = new Point('location')
      .tag('user_id', userId)
      .tag('username', userName || 'unknown')
      .floatField('latitude', latitude)
      .floatField('longitude', longitude);

    writeApi.writePoint(point);
    await writeApi.flush();

    res.status(200).json({ success: 'Posizione registrata correttamente' });
  } catch (error) {
    console.error('Errore InfluxDB:', error);
    res.status(500).json({ error: 'Errore durante l\'invio della posizione' });
  }
});

// Start server
server.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
