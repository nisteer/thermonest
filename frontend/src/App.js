import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { format } from 'date-fns'; // Importa la libreria date-fns per formattare le date

// Registriamo i componenti di Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Connessione al server WebSocket (indirizzo del backend)
const socket = io('http://localhost:5000');

const App = () => {
  const [humidityData, setHumidityData] = useState([]); // Stato per i dati di umidità
  const [temperatureData, setTemperatureData] = useState([]); // Stato per i dati di temperatura

  const [humidityChartData, setHumidityChartData] = useState({
    labels: [], // Etichette per l'asse X (timestamp)
    datasets: [
      {
        label: 'Umidità (%)',
        data: [],
        fill: false,
        borderColor: 'rgb(75, 192, 192)', // Colore della linea per umidità
        tension: 0.1,
      },
    ],
  });

  const [temperatureChartData, setTemperatureChartData] = useState({
    labels: [], // Etichette per l'asse X (timestamp)
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: [],
        fill: false,
        borderColor: 'rgb(255, 99, 132)', // Colore della linea per temperatura
        tension: 0.1,
      },
    ],
  });

  useEffect(() => {
    // Ascolta i dati di umidità
    socket.on('humidity', (data) => {
      console.log("Dati di umidità ricevuti:", data);

      if (data && data.length > 0) {
        setHumidityData(data);

        const labels = data.map(item => format(new Date(item._time), 'HH:mm:ss')); 
        const humidityValues = data.map(item => parseFloat(item._value));

        setHumidityChartData(prevData => ({
          labels,
          datasets: [
            {
              label: 'Umidità (%)',
              data: humidityValues,
              fill: false,
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1,
            },
          ],
        }));
      }
    });

    // Ascolta i dati di temperatura
    socket.on('temperature', (data) => {
      console.log("Dati di temperatura ricevuti:", data);

      if (data && data.length > 0) {
        setTemperatureData(data);

        const labels = data.map(item => format(new Date(item._time), 'HH:mm:ss')); // Estrai i timestamp
        const temperatureValues = data.map(item => parseFloat(item._value)); // Estrai i valori di temperatura

        setTemperatureChartData(prevData => ({
          labels, // Aggiorna le etichette per la temperatura
          datasets: [
            {
              label: 'Temperatura (°C)',
              data: temperatureValues, // Dati della temperatura
              fill: false,
              borderColor: 'rgb(255, 99, 132)',
              tension: 0.1,
            },
          ],
        }));
      }
    });

    // Cleanup
    return () => {
      socket.off('humidity');
      socket.off('temperature');
    };
  }, []);

  return (
    <div className="App">
      <h1>Grafico di Umidità e Temperatura</h1>

      <div>
        <h2>Grafico dell'Umidità</h2>
        <Line data={humidityChartData} />
      </div>

      <div>
        <h2>Grafico della Temperatura</h2>
        <Line data={temperatureChartData} />
      </div>

      <div>
        <h2>Dati recenti di umidità</h2>
        <ul>
          {humidityData.map((data, index) => (
            <li key={index}>
              {format(new Date(data._time), 'HH:mm:ss')}: {data._value} %
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2>Dati recenti di temperatura</h2>
        <ul>
          {temperatureData.map((data, index) => (
            <li key={index}>
              {format(new Date(data._time), 'HH:mm:ss')}: {data._value} °C
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
