import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  Stack,
  Button,
} from '@mui/material';
import { useBle } from '../../ble/BleContext';
import { useImuStream } from '../../hooks/useImuStream';
import ImuChartsGrid, { buildImuStatusText } from './ImuChartsGrid';

export default function ImuDashboardSection() {
  const { isConnected } = useBle();
  const {
    snap,
    isRunning,
    setIsRunning,
    reset,
    pollIntervalS,
    useDummy,
  } = useImuStream('full', true);

  const statusText = buildImuStatusText(snap, useDummy, pollIntervalS);

  return (
    <Box sx={{ mt: 4, mb: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '6px',
          border: '1px solid #f0f0f0',
          backgroundColor: '#fff',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
              IMU — Accel, Gyro, Altitude &amp; Trajectory
            </Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: 0.5 }}>
              {useDummy
                ? 'Demo mode: synthetic samples every 200 ms (like the Python visualizer). Set USE_DUMMY_BLE_DATA to false to use the device.'
                : 'Live charts (GET:IMU / GET:PRES). Shown only on the dashboard; other pages are unchanged.'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Paper sx={{ px: 1.5, py: 0.5, backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0' }}>
              <Typography component="span" variant="body2" sx={{ color: '#333', mr: 1, fontWeight: 'bold' }}>
                Connected
              </Typography>
              <Switch checked={isConnected} color="success" size="small" disabled />
            </Paper>
            <Button variant="outlined" size="small" onClick={reset}>
              {useDummy ? 'Reset demo stream' : 'Clear history'}
            </Button>
            <Button
              variant="contained"
              size="small"
              color={isRunning ? 'warning' : 'success'}
              onClick={() => setIsRunning((v) => !v)}
              disabled={!useDummy && !isConnected}
            >
              {isRunning ? 'Pause' : 'Resume'}
            </Button>
          </Stack>
        </Box>

        <ImuChartsGrid
          snap={snap}
          charts={['accel', 'gyro', 'alt', 'traj']}
          animate={useDummy}
        />

        <Typography variant="body2" sx={{ color: '#8b949e', mt: 2, textAlign: 'center' }}>
          {statusText}
        </Typography>
      </Paper>
    </Box>
  );
}
