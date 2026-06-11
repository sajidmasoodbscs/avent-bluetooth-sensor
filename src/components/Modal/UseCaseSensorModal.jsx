import React from 'react';
import {
  Box,
  Modal,
  Typography,
  IconButton,
  Stack,
  Button,
  Switch,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useBle } from '../../ble/BleContext';
import { useImuStream } from '../../hooks/useImuStream';
import { useMicStream } from '../../hooks/useMicStream';
import { usePirStream } from '../../hooks/usePirStream';
import { useAlertStream } from '../../hooks/useAlertStream';
import ImuChartsGrid, { buildImuStatusText } from '../Common/ImuChartsGrid';
import MicChartsGrid from '../Common/MicChartsGrid';
import MicAudioControls from '../Common/MicAudioControls';
import PirDetectionVisual from '../Common/PirDetectionVisual';
import AlertVisual from '../Common/AlertVisual';

const MODAL_CONFIG = {
  gyro: {
    title: 'Gyroscope Positioning Use Case',
    subtitle: 'Acceleration, gyroscope, and integrated 3D trajectory',
    kind: 'imu',
    imuMode: 'imu',
    charts: ['accel', 'gyro', 'traj'],
  },
  pressure: {
    title: 'Altitude / Depth Change Indicator (Altimeter)',
    subtitle: 'Barometric altitude from pressure (GET:PRES)',
    kind: 'imu',
    imuMode: 'pressure',
    charts: ['alt'],
  },
  mic: {
    title: 'Sound-Triggered Control (Clap to Activate)',
    subtitle: 'GET:MIC → PCM notifications · STOP:MIC returns to sensors',
    kind: 'mic',
  },
  pir: {
    title: 'PIR Sensor Use Case',
    subtitle: 'Passive infrared motion via GET:PIR (int16 raw)',
    kind: 'pir',
  },
  occupancy: {
    title: 'Intelligent Occupancy Detection for Energy Management Systems (HVAC, Lighting)',
    subtitle: 'ALERT 0x08 — vacant / occupied (push, no polling)',
    kind: 'alert',
    alertKey: 'occupancy',
  },
  tilt: {
    title: 'Real-Time Tilt & Stability Monitoring System',
    subtitle: 'ALERT 0x09 — stable / warning / alarm',
    kind: 'alert',
    alertKey: 'tilt',
  },
  motion: {
    title: 'Smart Motion & Tamper Detection System',
    subtitle: 'ALERT 0x0A — idle / motion / spike',
    kind: 'alert',
    alertKey: 'motion',
  },
  syringe: {
    title: 'Syringe and tube',
    subtitle: 'ALERT 0x0B — baseline / push / pull / spike',
    kind: 'alert',
    alertKey: 'syringe',
  },
};

export default function UseCaseSensorModal({ open, useCaseKey, onClose }) {
  const config = MODAL_CONFIG[useCaseKey];
  const { isConnected } = useBle();

  const imu = useImuStream(config?.imuMode ?? 'full', open && config?.kind === 'imu');
  const mic = useMicStream(open && useCaseKey === 'mic');
  const pir = usePirStream(open && useCaseKey === 'pir');
  const alert = useAlertStream(config?.alertKey, open && config?.kind === 'alert');

  if (!config) return null;

  const stream = config.kind === 'mic' ? mic
    : config.kind === 'pir' ? pir
      : config.kind === 'alert' ? alert
        : imu;

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '96%',
          maxWidth: 1100,
          maxHeight: '92vh',
          overflow: 'auto',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 3,
          outline: 'none',
          borderRadius: 2,
        }}
      >
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8 }} aria-label="close">
          <CloseIcon />
        </IconButton>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2, pr: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
              {config.title}
            </Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: 0.5 }}>
              {config.subtitle}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Paper sx={{ px: 1.5, py: 0.5, backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0' }}>
              <Typography component="span" variant="body2" sx={{ color: '#333', mr: 1, fontWeight: 'bold' }}>
                Connected
              </Typography>
              <Switch checked={isConnected} color="success" size="small" disabled />
            </Paper>
            {config.kind !== 'alert' && (
              <>
                <Button variant="outlined" size="small" onClick={stream.reset}>
                  {stream.useDummy ? 'Reset demo' : 'Clear'}
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  color={stream.isRunning ? 'warning' : 'success'}
                  onClick={() => stream.setIsRunning((v) => !v)}
                  disabled={!stream.useDummy && !isConnected}
                >
                  {stream.isRunning ? 'Pause' : 'Resume'}
                </Button>
              </>
            )}
          </Stack>
        </Box>

        {config.kind === 'alert' ? (
          <>
            <AlertVisual
              alertKey={config.alertKey}
              state={alert.state}
              label={alert.label}
              isConnected={isConnected}
            />
            <Typography variant="body2" sx={{ color: '#8b949e', mt: 2, textAlign: 'center' }}>
              {isConnected
                ? 'Listening on ALERT characteristic — updates when device state changes.'
                : 'Connect the sensor to receive live alerts.'}
            </Typography>
          </>
        ) : config.kind === 'pir' ? (
          <>
            <PirDetectionVisual
              pirValue={pir.pirValue}
              detected={pir.detected}
              threshold={pir.threshold}
              useDummy={pir.useDummy}
              onThresholdChange={pir.setThreshold}
            />
            <Typography variant="body2" sx={{ color: '#8b949e', mt: 2, textAlign: 'center' }}>
              {pir.useDummy
                ? `Demo · Signal ${pir.pirValue.toFixed(0)} · ${pir.detected ? 'Motion detected' : 'Idle'}`
                : `Live BLE · Signal ${pir.pirValue.toFixed(0)} · Threshold ${pir.threshold}`}
            </Typography>
          </>
        ) : config.kind === 'mic' ? (
          <>
            <MicAudioControls
              isCapturing={mic.isCapturing}
              isPlaying={mic.isPlaying}
              captureDurationSec={mic.captureDurationSec}
              hasExportableAudio={mic.hasExportableAudio}
              useDummy={mic.useDummy}
              onStartCapture={mic.startCapture}
              onStopCapture={mic.stopCapture}
              onDownload={mic.downloadWav}
              onPlay={mic.playRecording}
              onStopPlay={mic.stopPlayback}
            />
            <MicChartsGrid
              waveformRows={mic.waveformRows}
              envelopeRows={mic.envelopeRows}
              sampleRate={mic.sampleRate}
              stats={mic.stats}
              useDummy={mic.useDummy}
            />
            {!isConnected && (
              <Typography variant="caption" sx={{ color: '#888', display: 'block', mt: 1, textAlign: 'center' }}>
                Connect device — mic mode sends GET:MIC and subscribes to PCM notifications.
              </Typography>
            )}
          </>
        ) : (
          <>
            <ImuChartsGrid snap={imu.snap} charts={config.charts} animate={imu.useDummy} />
            <Typography variant="body2" sx={{ color: '#8b949e', mt: 2, textAlign: 'center' }}>
              {buildImuStatusText(imu.snap, imu.useDummy, imu.pollIntervalS)}
            </Typography>
          </>
        )}
      </Box>
    </Modal>
  );
}
