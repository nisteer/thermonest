import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Box, Paper, Typography, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { format, parseISO } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import '../App.css';
import { io } from "socket.io-client";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Sensors = ({ theme }) => {
  const [filter, setFilter] = useState('6h');
  const [humidityChartData, setHumidityChartData] = useState({ labels: [], datasets: [] });
  const [temperatureChartData, setTemperatureChartData] = useState({ labels: [], datasets: [] });

  const filterOptions = [
    { label: 'Last 6 Hours', value: '6h' },
    { label: 'Last 24 Hours', value: '24h' },
    { label: 'Last 7 Days', value: '168h' },
    { label: 'Last 14 Days', value: '336h' },
    { label: 'Last 30 Days', value: '720h' },
  ];

  const socket = io('https://thermonest-server.onrender.com', {
    transports: ['websocket', 'polling'],
    withCredentials: true,
  });

  const isLongTerm = ['168h', '336h', '720h'].includes(filter);
  const isMidTerm = ['6h', '24h'].includes(filter);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 14, weight: 'bold' },
          color: theme.palette.text.primary,
        },
      },
      tooltip: {
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 12 },
        backgroundColor: theme.palette.mode === 'dark' ? '#333333' : '#ffffff',
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: theme.palette.text.primary,
        borderWidth: 1,
        caretSize: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        ticks: {
          font: { size: 12, weight: 'bold' },
          color: theme.palette.text.primary,
          maxRotation: 0,
          autoSkip: true,
        },
      },
      y: {
        ticks: {
          font: { size: 12, weight: 'bold' },
          color: theme.palette.text.primary,
        },
      },
    },
    elements: { point: { radius: 4 } },
    maintainAspectRatio: false,
  };

  const roundToInterval = (date, intervalMinutes) => {
    const d = new Date(date);
    d.setSeconds(0, 0);
    const minutes = d.getMinutes();
    d.setMinutes(Math.floor(minutes / intervalMinutes) * intervalMinutes);
    return format(d, 'HH:mm');
  };

  const fetchData = useCallback(async () => {
    try {
      const from = `-${filter}`;
      const res = await axios.get('https://thermonest-server.onrender.com/api/sensors', {
        params: { from },
      });

      const data = res.data || [];
      let labels = [], humidityData = [], temperatureData = [];

      if (isLongTerm) {
        const grouped = {};
        data.forEach(item => {
          const day = format(new Date(item._time), 'dd-MM');
          if (!grouped[day]) grouped[day] = { humidity: [], temperature: [] };

          const hum = item.humidity ?? null;
          const temp = item.temperature ?? null;

          if (hum !== null && !isNaN(hum)) grouped[day].humidity.push(hum);
          if (temp !== null && !isNaN(temp)) grouped[day].temperature.push(temp);
        });

        labels = Object.keys(grouped);
        humidityData = labels.map(day => {
          const values = grouped[day].humidity;
          return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
        });
        temperatureData = labels.map(day => {
          const values = grouped[day].temperature;
          return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
        });
      } else if (isMidTerm) {
        const interval = filter === '6h' ? 5 : 15;
        const grouped = {};

        data.forEach(item => {
          const time = roundToInterval(item._time, interval);
          if (!grouped[time]) grouped[time] = { humidity: [], temperature: [] };

          const hum = item.humidity ?? item._value;
          const temp = item.temperature ?? item._value;

          if (hum !== null && !isNaN(hum)) grouped[time].humidity.push(hum);
          if (temp !== null && !isNaN(temp)) grouped[time].temperature.push(temp);
        });

        labels = Object.keys(grouped);
        humidityData = labels.map(time => {
          const values = grouped[time].humidity;
          return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
        });
        temperatureData = labels.map(time => {
          const values = grouped[time].temperature;
          return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
        });
      }

      setHumidityChartData({
        labels,
        datasets: [{
          label: 'Humidity',
          data: humidityData,
          fill: false,
          borderColor: '#60a5fa',
          tension: 0.1,
        }],
      });

      setTemperatureChartData({
        labels,
        datasets: [{
          label: 'Temperature',
          data: temperatureData,
          fill: false,
          borderColor: '#f87171',
          tension: 0.1,
        }],
      });

      socket.emit('setTimeRange', filter);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [filter, isLongTerm, isMidTerm, socket]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    socket.on('humidity', data => {
      if (data.length) {
        setHumidityChartData(prev => ({
          ...prev,
          datasets: [{ ...prev.datasets[0], data: data }],
        }));
      }
    });

    socket.on('temperature', data => {
      if (data.length) {
        setTemperatureChartData(prev => ({
          ...prev,
          datasets: [{ ...prev.datasets[0], data: data }],
        }));
      }
    });

    return () => {
      socket.off('humidity');
      socket.off('temperature');
    };
  }, [socket]);

  return (
    <Box>
      <FormControl fullWidth>
        <InputLabel>Time Range</InputLabel>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          label="Time Range"
        >
          {filterOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Paper sx={{ mt: 3, padding: 2 }}>
        <Typography variant="h6" align="center">Humidity</Typography>
        <div style={{ height: '300px' }}>
          <Line data={humidityChartData} options={chartOptions} />
        </div>
      </Paper>

      <Paper sx={{ mt: 3, padding: 2 }}>
        <Typography variant="h6" align="center">Temperature</Typography>
        <div style={{ height: '300px' }}>
          <Line data={temperatureChartData} options={chartOptions} />
        </div>
      </Paper>
    </Box>
  );
};

export default Sensors;
