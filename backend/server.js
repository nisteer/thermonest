const express = require('express');
const { InfluxDB } = require('@influxdata/influxdb-client');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const config = require('./config');  // Importa la configurazione

const app = express();
const port = 5000;

// Configurazione InfluxDB dalla configurazione esterna
const { url, token, org, bucket } = config.influxDB;

const influxDB = new InfluxDB({ url, token });

// Configurazione CORS per consentire le richieste dal frontend
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

// Avvia il server WebSocket
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", 
        methods: ["GET", "POST"],
    }
});

// Funzione per inviare i dati di umidità
const sendHumidityData = async () => {
    try {
        const queryApi = influxDB.getQueryApi(org);
        const query = `from(bucket: "${bucket}")
            |> range(start: -24h)
            |> filter(fn: (r) => r._measurement == "humidity")
            |> filter(fn: (r) => r._field == "value")`;

        const data = [];
        await queryApi.queryRows(query, {
            next(row, tableMeta) {
                const o = tableMeta.toObject(row);
                data.push(o);
            },
            error(error) {
                console.error('Errore durante la query di umidità:', error);
            },
            complete() {
                console.log('Dati di umidità inviati:', data); 
                io.emit('humidity', data); // Invia i dati tramite WebSocket
            }
        });
    } catch (error) {
        console.error('Errore durante il recupero dei dati di umidità:', error);
    }
};

// Funzione per inviare i dati di temperatura
const sendTemperatureData = async () => {
    try {
        const queryApi = influxDB.getQueryApi(org);
        const query = `from(bucket: "${bucket}")
            |> range(start: -24h)
            |> filter(fn: (r) => r._measurement == "temperature")
            |> filter(fn: (r) => r._field == "value")`;

        const data = [];
        await queryApi.queryRows(query, {
            next(row, tableMeta) {
                const o = tableMeta.toObject(row);
                data.push(o);
            },
            error(error) {
                console.error('Errore durante la query della temperatura:', error);
            },
            complete() {
                console.log('Dati di temperatura inviati:', data); 
                io.emit('temperature', data); // Invia i dati tramite WebSocket
            }
        });
    } catch (error) {
        console.error('Errore durante il recupero dei dati di temperatura:', error);
    }
};

// Funzione per inviare i dati ogni 5 secondi
const sendDataPeriodically = () => {
    setInterval(() => {
        sendHumidityData();
        sendTemperatureData();
    }, 5000); // Invia ogni 5 secondi
};

// Gestisce la connessione di un client
io.on('connection', (socket) => {
    console.log('Utente connesso');
    sendDataPeriodically(); // Invia dati periodicamente
});

// Avvia il server su http://localhost:5000
server.listen(port, () => {
    console.log(`Server WebSocket avviato su http://localhost:${port}`);
});
