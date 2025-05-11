const express = require('express');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const expressJwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const config = require('./config');

const app = express();
const port = process.env.PORT || 5000;

const { url, token, org, bucket } = config.influxDB;
const influxDB = new InfluxDB({ url, token });

// Configurazione Auth0
const auth0Domain = 'nisteer.eu.auth0.com';
const audience = 'https://nisteer.eu.auth0.com/api/v2/';

app.use(express.json());

const allowedOrigins = [
  'https://thermonest.vercel.app',
  'https://thermonest-server.onrender.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
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

// Configurazione middleware JWT per proteggere le rotte
const jwtMiddleware = expressJwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
  }),
  audience,
  issuer: `https://${auth0Domain}/`,
  algorithms: ['RS256'],
}).unless({ path: ['/api/sensors', '/api/locations'] }); // escludi rotte che non richiedono autenticazione

app.use(jwtMiddleware);

// --- Sensor data (WebSocket streaming) ---
const emitSensorData = async (measurement, eventName) => {
  try {
    const queryApi = influxDB.getQueryApi(org);
    const query = `
      from(bucket: "${bucket}")
        |> range(start: -1h)
        |> filter(fn: (r) => r._measurement == "${measurement}")
        |> filter(fn: (r) => r._field == "value")
    `;
    const data = [];
    await queryApi.queryRows(query, {
      next(row, tableMeta) {
        data.push(tableMeta.toObject(row));
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

// --- REST endpoint: Fetch historical sensor data ---
app.get('/api/sensors', async (req, res) => {
  const { from } = req.query;
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
        data.push(tableMeta.toObject(row));
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

// --- REST endpoint: Save user location ---
app.post('/api/location', async (req, res) => {
  const { latitude, longitude, name, picture, userId } = req.body;

  if (!latitude || !longitude || !userId) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    const writeApi = influxDB.getWriteApi(org, bucket, 'ns');

    const point = new Point('user_location')
      .tag('userId', userId)
      .tag('name', name || '')
      .tag('picture', picture || '')
      .floatField('latitude', latitude)
      .floatField('longitude', longitude);

    writeApi.writePoint(point);
    await writeApi.close();

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- REST endpoint: Get latest user locations ---
app.get('/api/locations', async (req, res) => {
  try {
    const queryApi = influxDB.getQueryApi(org);
    const query = `
      from(bucket: "${bucket}")
        |> range(start: -5m)
        |> filter(fn: (r) => r._measurement == "user_location")
        |> last()
    `;

    const results = {};
    await queryApi.queryRows(query, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        const uid = o.userId;
        if (!results[uid]) {
          results[uid] = {
            userId: o.userId,
            name: o.name,
            picture: o.picture,
            latitude: null,
            longitude: null,
          };
        }
        if (o._field === 'latitude') results[uid].latitude = o._value;
        if (o._field === 'longitude') results[uid].longitude = o._value;
      },
      error(error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ error: 'Internal server error' });
      },
      complete() {
        res.json(Object.values(results).filter(u => u.latitude && u.longitude));
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
