import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Switch, Stack } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useBle } from '../ble/BleContext';

const mockData = [
  { time: '1/12', value: 36, value2: 5 },
  { time: '2/12', value: 25, value2: 16 },
  { time: '3/12', value: 28, value2: 13 },
  { time: '4/12', value: 22, value2: 19 },
  { time: '5/12', value: 35, value2: 6 },
  { time: '6/12', value: 32, value2: 9 },
  { time: '7/12', value: 7, value2: 34 },
  { time: '8/12', value: 10, value2: 31 },
  { time: '9/12', value: 25, value2: 16 },
  { time: '10/12', value: 18, value2: 23 },
  { time: '11/12', value: 20, value2: 22 },
  { time: '12/12', value: 12, value2: 31 },
  { time: '13/12', value: 19, value2: 23 },
  { time: '14/12', value: 12, value2: 16 },
];

const GraphPage = () => {
  const { sensorId } = useParams();
  const navigate = useNavigate();
  const { latestData, isConnected } = useBle();
  const [isRunning, setIsRunning] = useState(true);

  const sensorName = sensorId?.charAt(0).toUpperCase() + sensorId?.slice(1);
  const currentValue = latestData[sensorId] || 26.6; // Mocking if no data

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', p: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)}
          sx={{ color: '#53ba64', fontWeight: 'bold' }}
        >
          Back
        </Button>
      </Box>

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
              {sensorId === 'temperature' ? 'Temperature Reading' : `${sensorName} Reading`}
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
                backgroundColor: 'rgba(156, 39, 176, 0.1)', 
                p: '4px 8px', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Typography variant="body2" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                Plot 1
              </Typography>
              <Box sx={{ backgroundColor: '#fff', px: 1, borderRadius: '4px', border: '1px solid rgba(156, 39, 176, 0.2)' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {currentValue.toFixed(1)}
                </Typography>
              </Box>
            </Box>
            
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
                Plot 2
              </Typography>
              <Box sx={{ backgroundColor: '#fff', px: 1, borderRadius: '4px', border: '1px solid rgba(83, 186, 100, 0.2)' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {(currentValue - 3).toFixed(1)}
                </Typography>
              </Box>
            </Box>
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
              sx={{ 
                backgroundColor: '#ff3d00', 
                color: '#fff',
                textTransform: 'none',
                borderRadius: '8px',
                px: 3,
                fontWeight: 'bold',
                '&:hover': { backgroundColor: '#d32f2f' }
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
            <LineChart data={mockData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
