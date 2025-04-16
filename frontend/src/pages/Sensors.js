import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Paper,
  Typography,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
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
      } else {
        labels = data.map(item => format(parseISO(item._time), 'HH:mm:ss'));
        humidityData = data.map(item => item.humidity ?? item._value ?? null);
        temperatureData = data.map(item => item.temperature ?? item._value ?? null);
      }

      setHumidityChartData({
        labels,
        datasets: [
          {
            label: isLongTerm || isMidTerm ? 'Avg Humidity (%)' : 'Humidity (%)',
            data: humidityData,
            borderColor: 'rgba(76, 208, 225, 1)',
            backgroundColor: 'rgba(76, 208, 225, 0.3)',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: 'rgba(76, 208, 225, 1)',
          },
        ],
      });

      setTemperatureChartData({
        labels,
        datasets: [
          {
            label: isLongTerm || isMidTerm ? 'Avg Temperature (°C)' : 'Temperature (°C)',
            data: temperatureData,
            borderColor: 'rgba(239, 83, 80, 1)',
            backgroundColor: 'rgba(239, 83, 80, 0.3)',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: 'rgba(239, 83, 80, 1)',
          },
        ],
      });
    } catch (error) {
      console.error('Fetch data error:', error);
    }
  }, [filter, isLongTerm, isMidTerm]);

  useEffect(() => {
    setHumidityChartData({ labels: [], datasets: [] });
    setTemperatureChartData({ labels: [], datasets: [] });
    fetchData();
  }, [filter, fetchData]);

  return (
    <Box sx={{ p: 3 }}>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="time-range-label">Select Time Range</InputLabel>
        <Select
          labelId="time-range-label"
          value={filter}
          label="Select Time Range"
          onChange={(e) => setFilter(e.target.value)}
        >
          {filterOptions.map(option => (
            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
          Humidity Chart
        </Typography>
        <div className="chart-container">
          <Line data={humidityChartData} options={chartOptions} />
        </div>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
          Temperature Chart
        </Typography>
        <div className="chart-container">
          <Line data={temperatureChartData} options={chartOptions} />
        </div>
      </Paper>
    </Box>
  );
};

export default Sensors;
