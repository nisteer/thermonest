const express = require('express');
const { InfluxDB } = require('@influxdata/influxdb-client');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const config = require('./config');

const app = express();
const port = process.env.PORT || 5000;
const { url, token, org, bucket } = config.influxDB;
const influxDB = new InfluxDB({ url, token });

app.use(express.json());

const allowedOrigins = [
  'http://localhost:3000',
  'https://thermonest.vercel.app',
  'https://thermonest-server.onrender.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  },
});

// In-memory active users (not persistent)
const activeUsers = new Map();

// API endpoint to save location
app.post('/api/location', (req, res) => {
  const { latitude, longitude, name, picture } = req.body;

  activeUsers.set(name, {
    name,
    picture,
    latitude,
    longitude,
    timestamp: Date.now(),
  });

  res.sendStatus(200);
});

// API endpoint to get active users
app.get('/api/active-users', (req, res) => {
  const now = Date.now();
  const active = [];

  for (const [_, user] of activeUsers.entries()) {
    if (now - user.timestamp < 60000) {
      active.push(user);
    }
  }

  res.json(active);
});

// Periodically clean up inactive users
setInterval(() => {
  const now = Date.now();
  for (const [key, user] of activeUsers.entries()) {
    if (now - user.timestamp >= 60000) {
      activeUsers.delete(key);
    }
  }
}, 30000);

// Set up Socket.io to emit sensor data every 5 seconds
let intervalId;
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('setTimeRange', (range) => {
    if (intervalId) clearInterval(intervalId);
    if (range === '1h') {
      intervalId = setInterval(() => {
        // Emit sensor data to the client
        emitSensorData('humidity', 'humidity');
        emitSensorData('temperature', 'temperature');
      }, 5000);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (intervalId) clearInterval(intervalId);
  });
});

const emitSensorData = async (measurement, eventName) => {
  try {
    const queryApi = influxDB.getQueryApi(org);
    const query = `from(bucket: "${bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => r._field == "value")`;

    const data = [];
    await queryApi.queryRows(query, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        data.push(o);
      },
      error(error) {
        console.error(`Error querying ${measurement}:`, error);
      },
      complete() {
        io.emit(eventName, data);
      }
    });
  } catch (error) {
    console.error(`Error fetching ${measurement}:`, error);
  }
};

server.listen(port, () => {
  console.log(`HTTP server running at http://localhost:${port}`);
});
