import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, Paper, Switch, Stack } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useBle } from '../ble/BleContext';

import { readSensorHistory } from '../utils/storage';

const useCaseMap = {
  'Digital-Temperature-Use-Case': {
    title: 'Digital Temperature Use Case',
    primaryKey: 'temperature',
    secondaryKey: 'irTemperature',
    primaryLabel: 'Ambient Temp',
    secondaryLabel: 'IR Temp'
  },
  'Digital-Presssure-Use-Case': {
    title: 'Digital Pressure Use Case',
    primaryKey: 'pressure',
    secondaryKey: 'irTemperature',
    primaryLabel: 'Pressure',
    secondaryLabel: 'IR Temp'
  }
};

const GraphPage = () => {
  const { sensorId } = useParams();
  const { latestData, isConnected } = useBle();
  const [historyData, setHistoryData] = useState([]);
  const [isRunning, setIsRunning] = useState(true);
  const [displayValue, setDisplayValue] = useState(0);
  const [displaySecondaryValue, setDisplaySecondaryValue] = useState(0);

  const config = useCaseMap[sensorId] || {
    title: `${sensorId?.charAt(0).toUpperCase() + sensorId?.slice(1)} Reading`,
    primaryKey: sensorId,
    secondaryKey: null,
    primaryLabel: 'Plot 1',
    secondaryLabel: 'Plot 2'
  };

  const latestDataRef = useRef(latestData);
  useEffect(() => {
    latestDataRef.current = latestData;
  }, [latestData]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      const updateData = () => {
        const hist1 = readSensorHistory(config.primaryKey, 50);
        let combined = [];

        // Update live value badges only while running using the latest ref
        const currentData = latestDataRef.current;
        const current = currentData[config.primaryKey] || 0;
        const secondary = config.secondaryKey ? (currentData[config.secondaryKey] || 0) : 0;
        setDisplayValue(current);
        setDisplaySecondaryValue(secondary);

        if (config.secondaryKey) {
          const hist2 = readSensorHistory(config.secondaryKey, 50);
          combined = hist1.map((p, i) => ({
            time: new Date(p.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            value: p.v,
            value2: hist2[i]?.v || 0
          }));
        } else {
          combined = hist1.map(p => ({
            time: new Date(p.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            value: p.v,
            value2: null
          }));
        }
        setHistoryData(combined);
      };

      updateData();
      interval = setInterval(updateData, 1000);
    }
    return () => clearInterval(interval);
  }, [config.primaryKey, config.secondaryKey, isRunning]);

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', p: 1 }}>


      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: '24px',
          border: '1px solid #f0f0f0',
          mb: 4,
          backgroundColor: '#fff'
        }}
      >
        {/* Top Row: Title and Connection Toggle */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
              {config.title}
            </Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: 0.5 }}>
              Commercial networks & enterprises
            </Typography>
          </Box>
          <Paper
            elevation={0}
            sx={{
              backgroundColor: '#f5f5f5',
              px: 2,
              py: 1,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#333' }}>
              Connected
            </Typography>
            <Switch
              checked={isConnected}
              color="success"
              size="small"
            />
          </Paper>
        </Box>

        {/* Second Row: Legend Badges and Start/Stop Buttons */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={2}>
            <Box
              sx={{
                backgroundColor: 'rgba(83, 186, 100, 0.1)',
                p: '4px 8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Typography variant="body2" sx={{ color: '#53ba64', fontWeight: 'bold' }}>
                {config.primaryLabel}
              </Typography>
              <Box sx={{ backgroundColor: '#fff', px: 1, borderRadius: '4px', border: '1px solid rgba(83, 186, 100, 0.2)' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {displayValue.toFixed(1)}
                </Typography>
              </Box>
            </Box>

            {config.secondaryKey && (
              <Box
                sx={{
                  backgroundColor: 'rgba(156, 39, 176, 0.1)',
                  p: '4px 8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Typography variant="body2" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                  {config.secondaryLabel}
                </Typography>
                <Box sx={{ backgroundColor: '#fff', px: 1, borderRadius: '4px', border: '1px solid rgba(156, 39, 176, 0.2)' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {displaySecondaryValue.toFixed(1)}
                  </Typography>
                </Box>
              </Box>
            )}
          </Stack>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              disabled={isRunning}
              sx={{
                backgroundColor: isRunning ? '#ccc' : '#53ba64',
                color: '#fff',
                textTransform: 'none',
                borderRadius: '8px',
                px: 3,
                fontWeight: 'bold',
                '&:disabled': { backgroundColor: '#b0b0b0', color: '#fff' }
              }}
              onClick={() => setIsRunning(true)}
            >
              Start
            </Button>
            <Button
              variant="contained"
              disabled={!isRunning}
              sx={{
                backgroundColor: !isRunning ? '#ccc' : '#ff3d00',
                color: '#fff',
                textTransform: 'none',
                borderRadius: '8px',
                px: 3,
                fontWeight: 'bold',
                '&:hover': { backgroundColor: '#d32f2f' },
                '&:disabled': { backgroundColor: '#b0b0b0', color: '#fff' }
              }}
              onClick={() => setIsRunning(false)}
            >
              Stop
            </Button>
          </Stack>
        </Box>

        {/* Graph Area */}
        <Box sx={{ height: 500, width: '100%', ml: -2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" stroke="#f0f0f0" />
              <XAxis
                dataKey="time"
                stroke="#ccc"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={15}
              />
              <YAxis
                stroke="#ccc"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  padding: '12px'
                }}
              />
              <Line
                type="linear"
                dataKey="value"
                stroke="#53ba64"
                strokeWidth={4}
                dot={{ r: 4, fill: '#53ba64', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="linear"
                dataKey="value2"
                stroke="#9c27b0"
                strokeWidth={4}
                dot={{ r: 4, fill: '#9c27b0', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
};

export default GraphPage;
