import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Grid, Modal, Typography, IconButton, Paper, Tooltip as MuiTooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import SplineAreaChart from '../Common/SplineAreaChart';
import { useBle } from '../../ble/BleContext';
import { readSensorHistory, appendSensorPoint } from '../../utils/storage';

const SENSOR_CMD = {
  temperature: { start: [0x01, 0x01], stop: [0x01, 0x00] },
  humidity: { start: [0x01, 0x01], stop: [0x01, 0x00] },
  irTemperature: { start: [0x02, 0x01], stop: [0x02, 0x00] },
  imuAccel: { start: [0x03, 0x01], stop: [0x03, 0x00] },
  imuGyro: { start: [0x03, 0x01], stop: [0x03, 0x00] },
  pressure: { start: [0x04, 0x01], stop: [0x04, 0x00] },
  all: { start: [0x7f, 0x01], stop: [0x7f, 0x00] },
};

const SENSOR_GET_CMD = {
  temperature: 'GET:TEMP',
  humidity: 'GET:HUMID',
  irTemperature: 'GET:IRTEMP',
  imuAccel: 'GET:IMU',
  imuGyro: 'GET:IMU',
  pressure: 'GET:PRES',
};

function formatHistoryToChart(points) {
  return points.map(p => ({ time: new Date(p.t).toLocaleTimeString([], { hour12: false }), value: p.v }));
}

export default function SensorDetailsModal({ open, onClose, companyName, sensorName, sensorKey, extraValues }) {
  const {
    latestData = {},
    setLatestData,
    setActiveSensorKey,
    writeCommand,
    withGattLock,
    tx,
    rx,
    isConnected,
  } = useBle();

  const [chartData, setChartData] = useState([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const pollTimerRef = useRef(null);
  const inFlightRef = useRef(false);

  const currentValue = latestData[sensorKey];

  const smallBoxes = useMemo(() => {
    const items = [];

    if (sensorKey === 'imuAccel') {
      const arr = Array.isArray(latestData.accel) ? latestData.accel : [];
      if (arr.length >= 3) {
        items.push({ label: `${sensorName} X`, value: arr[arr.length - 3] });
        items.push({ label: `${sensorName} Y`, value: arr[arr.length - 2] });
        items.push({ label: `${sensorName} Z`, value: arr[arr.length - 1] });
      }
      return items;
    }

    if (sensorKey === 'imuGyro') {
      const arr = Array.isArray(latestData.gyro) ? latestData.gyro : [];
      if (arr.length >= 3) {
        items.push({ label: `${sensorName} X`, value: arr[arr.length - 3] });
        items.push({ label: `${sensorName} Y`, value: arr[arr.length - 2] });
        items.push({ label: `${sensorName} Z`, value: arr[arr.length - 1] });
      }
      return items;
    }

    if (sensorKey && currentValue !== undefined) {
      items.push({ label: sensorName, value: Array.isArray(currentValue) ? currentValue.join(', ') : currentValue });
    }

    return items;
  }, [sensorKey, currentValue, sensorName, latestData]);

  useEffect(() => {
    if (!open) {
      setIsStreaming(false);
      setActiveSensorKey(null);
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    setIsStreaming(true);
    setActiveSensorKey(sensorKey);
    setChartData(formatHistoryToChart(readSensorHistory(sensorKey)));

    return () => {
      setActiveSensorKey(null);
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [open, sensorKey, setActiveSensorKey]);

  useEffect(() => {
    if (!open || !isStreaming) {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    let cancelled = false;
    const encoder = new TextEncoder();

    const parseAndRecord = (dataView) => {
      const buffer = new DataView(dataView.buffer);
      let offset = 0;
      const parsedData = {};

      while (offset < buffer.byteLength) {
        const type = buffer.getUint8(offset);
        const length = buffer.getUint8(offset + 1);
        const valueBytes = new DataView(buffer.buffer, offset + 2, length);
        const floatValue = valueBytes.getFloat32(0, true);
        offset += 2 + length;

        switch (type) {
          case 0x01:
            parsedData.temperature = floatValue;
            appendSensorPoint('temperature', floatValue);
            break;
          case 0x02:
            parsedData.humidity = floatValue;
            appendSensorPoint('humidity', floatValue);
            break;
          case 0x03:
            parsedData.irTemperature = floatValue;
            appendSensorPoint('irTemperature', floatValue);
            break;
          case 0x04:
            parsedData.accel = [...(parsedData.accel || []), floatValue];
            appendSensorPoint('imuAccel', floatValue);
            break;
          case 0x05:
            parsedData.pressure = floatValue;
            appendSensorPoint('pressure', floatValue);
            break;
          case 0x06:
            parsedData.gyro = [...(parsedData.gyro || []), floatValue];
            appendSensorPoint('imuGyro', floatValue);
            break;
          default:
            break;
        }
      }

      if (Object.keys(parsedData).length > 0) {
        setLatestData(parsedData);
        setChartData(formatHistoryToChart(readSensorHistory(sensorKey)));
      }
    };

    const poll = async () => {
      if (cancelled || !isStreaming) return;
      if (inFlightRef.current) {
        pollTimerRef.current = setTimeout(poll, 100);
        return;
      }

      try {
        inFlightRef.current = true;
        let txChar = tx?.current;
        let rxChar = rx?.current;
        let attempts = 0;

        while ((!txChar || !rxChar) && attempts < 40 && !cancelled) {
          await new Promise(r => setTimeout(r, 150));
          txChar = tx?.current;
          rxChar = rx?.current;
          attempts += 1;
        }

        if (!txChar || !rxChar || cancelled) {
          pollTimerRef.current = setTimeout(poll, 500);
          return;
        }

        const cmd = SENSOR_GET_CMD[sensorKey] || 'GET:ALL';

        await withGattLock(async () => {
          await txChar.writeValue(encoder.encode(cmd));
          await new Promise(r => setTimeout(r, 250));
          const value = await rxChar.readValue();
          parseAndRecord(value);
        });
      } catch (err) {
        console.warn('[Modal] Poll error', err);
      } finally {
        inFlightRef.current = false;
        if (!cancelled && isStreaming) {
          pollTimerRef.current = setTimeout(poll, 500);
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [open, isStreaming, sensorKey, tx, rx, withGattLock, setLatestData]);

  const handleStart = async () => {
    const cmd = SENSOR_CMD[sensorKey]?.start || SENSOR_CMD.all.start;
    try {
      await writeCommand(new Uint8Array(cmd));
      setIsStreaming(true);
    } catch (err) {
      console.warn('Start command failed', err);
    }
  };

  const handleStop = async () => {
    const cmd = SENSOR_CMD[sensorKey]?.stop || SENSOR_CMD.all.stop;
    try {
      await writeCommand(new Uint8Array(cmd));
      setIsStreaming(false);
      setActiveSensorKey(null);
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    } catch (err) {
      console.warn('Stop command failed', err);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: '900px',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 3,
          outline: 'none',
          borderRadius: 2,
          overflow: 'hidden',
          pb: 10,
        }}
      >
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8 }} aria-label="close">
          <CloseIcon />
        </IconButton>

        <Grid container spacing={2}>
          <Grid item size={{ xs: 12, md: 12 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 'bold',
                  background: '#dedcdc',
                  p: 2.5,
                  borderRadius: 1,
                  fontSize: 20,
                  boxShadow: '0 0 0 2px #53ba64 inset',
                }}
              >
                {companyName}
              </Typography>
              <Typography variant="h4" sx={{ textAlign: 'left', fontWeight: 700, ml: 2 }}>{sensorName}</Typography>
            </Box>
          </Grid>

          <Grid item size={{ xs: 12, md: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {smallBoxes.map((b, idx) => (
                <Paper key={idx} elevation={2} sx={{ p: 2, minWidth: 200, borderRadius: 2, backgroundColor: '#f5fff7' }}>
                  <Typography variant="overline" sx={{ color: '#388e3c' }}>{b.label}</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>{b.value}</Typography>
                </Paper>
              ))}
            </Box>
          </Grid>

          <Grid item size={{ xs: 12, md: 12 }}>
            <Box sx={{ height: 320 }}>
              <SplineAreaChart title="" data={chartData} height={320} hideXAxis />
            </Box>
          </Grid>

          <Grid item size={{ xs: 12, md: 12 }}>
            <Box sx={{ position: 'absolute', left: 16, bottom: 16, display: 'flex', gap: 2 }}>
              <MuiTooltip title={isConnected ? 'Start streaming' : 'Connect device first'}>
                <span>
                  <Button
                    size="large"
                    variant="contained"
                    color="success"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleStart}
                    disabled={!isConnected || isStreaming}
                  >
                    Start
                  </Button>
                </span>
              </MuiTooltip>
              <MuiTooltip title={isConnected ? 'Stop streaming' : 'Connect device first'}>
                <span>
                  <Button
                    size="large"
                    variant="outlined"
                    color="error"
                    startIcon={<StopIcon />}
                    onClick={handleStop}
                    disabled={!isConnected || !isStreaming}
                  >
                    Stop
                  </Button>
                </span>
              </MuiTooltip>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Modal>
  );
}


