const express = require('express');
const { InfluxDB } = require('@influxdata/influxdb-client');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const config = require('./config');

const app = express();

// Use PORT environment variable for OnRender or default to 5000 in development
const port = process.env.PORT || 5000;

// InfluxDB config (make sure these values are set in your OnRender environment variables)
const { url, token, org, bucket } = config.influxDB;
const influxDB = new InfluxDB({ url, token });

// CORS configuration for production (OnRender) and development (localhost)
const allowedOrigins = [
  'http://localhost:3000/',
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

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true, // Allow cookies to be sent with requests if needed
  },
});

// Store users' locations and names
let users = {};

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

let intervalId;
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Listen for location and name from the user
  socket.on('sendLocation', (data) => {
    const { name, position } = data;

    // Store user's name and location
    users[socket.id] = { name, position };

    // Broadcast this user's location and name to all other clients
    socket.broadcast.emit('receiveLocation', { name, position });
  });

  // Listen for "setTimeRange" event and emit data accordingly
  socket.on('setTimeRange', (range) => {
    if (intervalId) clearInterval(intervalId);
    if (range === '1h') {
      intervalId = setInterval(() => {
        emitSensorData('humidity', 'humidity');
        emitSensorData('temperature', 'temperature');
      }, 5000);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    delete users[socket.id]; // Remove user from the list when they disconnect
    if (intervalId) clearInterval(intervalId);
  });
});

// REST API: Fetch historical data
app.get('/api/sensors', async (req, res) => {
  const { from } = req.query;

  // Sanitize 'from' to prevent query injection
  const allowedRanges = ['-1h', '-6h', '-12h', '-24h', '-168h', '-336h', '-720h'];
  if (!allowedRanges.includes(from)) {
    return res.status(400).json({ error: 'Invalid "from" query parameter' });
  }

  try {
    const queryApi = influxDB.getQueryApi(org);
    const query = `
      from(bucket: "${bucket}")
        |> range(start: ${from}) 
        |> filter(fn: (r) => r._measurement == "temperature" or r._measurement == "humidity")
        |> filter(fn: (r) => r._field == "value")
        |> pivot(rowKey:["_time"], columnKey: ["_measurement"], valueColumn: "_value")
        |> keep(columns: ["_time", "temperature", "humidity"])
        |> sort(columns: ["_time"])
    `;

    const data = [];
    await queryApi.queryRows(query, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        data.push(o);
      },
      error(error) {
        console.error('Query error:', error);
        res.status(500).json({ error: error.toString() });
      },
      complete() {
        res.json(data);
      }
    });
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

server.listen(port, () => {
  console.log(`HTTP server running at http://localhost:${port}`);
});
