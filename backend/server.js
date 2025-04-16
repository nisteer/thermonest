const express = require('express');
const { InfluxDB } = require('@influxdata/influxdb-client');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const config = require('./config');

const app = express();
const port = process.env.PORT || 5000;

// InfluxDB config
const { url, token, org, bucket } = config.influxDB;
const influxDB = new InfluxDB({ url, token });

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://thermonest.vercel.app',
  'https://thermonest-server.onrender.com'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const msg = `The CORS policy for this site does not allow access from ${origin}`;
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Emit real-time sensor data
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
    if (intervalId) clearInterval(intervalId);
  });
});

// REST API endpoint
app.get('/api/sensors', async (req, res) => {
  const { from } = req.query;
  const allowedRanges = ['-1h', '-6h', '-12h', '-24h', '-168h', '-336h', '-720h'];
  
  if (!allowedRanges.includes(from)) {
    return res.status(400).json({ error: 'Invalid "from" query parameter' });
  }

  try {
    const queryApi = influxDB.getQueryApi(org);
    const query = `from(bucket: "${bucket}")
      |> range(start: ${from})
      |> filter(fn: (r) => r._measurement == "temperature" or r._measurement == "humidity")
      |> filter(fn: (r) => r._field == "value")
      |> pivot(rowKey:["_time"], columnKey: ["_measurement"], valueColumn: "_value")
      |> keep(columns: ["_time", "temperature", "humidity"])
      |> sort(columns: ["_time"])`;

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

// Error handling
app.use((err, req, res, next) => {
  if (err.message.includes('CORS')) {
    return res.status(403).json({ error: err.message });
  }
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});