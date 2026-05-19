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
import ImuChartsGrid, { buildImuStatusText } from '../Common/ImuChartsGrid';
import MicChartsGrid from '../Common/MicChartsGrid';
import MicAudioControls from '../Common/MicAudioControls';
import PirDetectionVisual from '../Common/PirDetectionVisual';

const MODAL_CONFIG = {
  gyro: {
    title: 'Gyroscope Positioning Use Case',
    subtitle: 'Acceleration, gyroscope, and integrated 3D trajectory',
    imuMode: 'imu',
    charts: ['accel', 'gyro', 'traj'],
  },
  pressure: {
    title: 'Pressure Sensor Use Case',
    subtitle: 'Barometric altitude from pressure (GET:PRES)',
    imuMode: 'pressure',
    charts: ['alt'],
  },
  mic: {
    title: 'Sound Mic Use Case',
    subtitle: '16 kHz mono PCM over BLE (nRF54L_Mic)',
    imuMode: null,
    charts: null,
  },
  pir: {
    title: 'PIR Sensor Use Case',
    subtitle: 'Passive infrared motion — human turns green when signal crosses threshold',
    imuMode: null,
    charts: null,
  },
};

export default function UseCaseSensorModal({ open, useCaseKey, onClose }) {
  const config = MODAL_CONFIG[useCaseKey];
  const { isConnected } = useBle();

  const imu = useImuStream(config?.imuMode ?? 'full', open && config?.imuMode != null);
  const mic = useMicStream(open && useCaseKey === 'mic');
  const pir = usePirStream(open && useCaseKey === 'pir');

  if (!config) return null;

  const isMic = useCaseKey === 'mic';
  const isPir = useCaseKey === 'pir';
  const stream = isMic ? mic : isPir ? pir : imu;

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
          </Stack>
        </Box>

        {isPir ? (
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
        ) : isMic ? (
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
            {mic.useDummy && (
              <Typography variant="caption" sx={{ color: '#888', display: 'block', mt: 1, textAlign: 'center' }}>
                Demo mode: synthetic speech-like audio — no device needed. For real mic BLE, set USE_DUMMY_MIC_DATA to false in useMicStream.js.
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
