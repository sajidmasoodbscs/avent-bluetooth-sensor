import React from 'react';
import { Button, Stack, Typography, Paper } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

/**
 * Record → download mic.wav → play in browser (no Python).
 * Works with demo PCM or real BLE notifications.
 */
export default function MicAudioControls({
  isCapturing,
  isPlaying,
  captureDurationSec,
  hasExportableAudio,
  useDummy,
  onStartCapture,
  onStopCapture,
  onDownload,
  onPlay,
  onStopPlay,
}) {
  const durationLabel = captureDurationSec >= 1
    ? `${captureDurationSec.toFixed(1)} s`
    : `${Math.round(captureDurationSec * 1000)} ms`;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 1,
        border: '1px solid #e0e0e0',
        backgroundColor: '#fafafa',
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
        Record &amp; listen (in browser)
      </Typography>
      <Typography variant="body2" sx={{ color: '#666', mb: 1.5 }}>
        {useDummy
          ? 'Demo speech-like audio is streaming. Record a few seconds, Stop, then Play or Download mic.wav.'
          : 'Start recording while BLE audio arrives, then Play or Download.'}
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" useFlexGap>
        {!isCapturing ? (
          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={<FiberManualRecordIcon />}
            onClick={onStartCapture}
          >
            Start recording
          </Button>
        ) : (
          <Button
            variant="contained"
            color="inherit"
            size="small"
            startIcon={<StopIcon />}
            onClick={onStopCapture}
          >
            Stop recording
          </Button>
        )}

        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadIcon />}
          onClick={onDownload}
          disabled={!hasExportableAudio}
        >
          Download .wav
        </Button>

        {!isPlaying ? (
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<PlayArrowIcon />}
            onClick={onPlay}
            disabled={!hasExportableAudio}
          >
            Play
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="warning"
            size="small"
            startIcon={<PauseIcon />}
            onClick={onStopPlay}
          >
            Stop playback
          </Button>
        )}

        {hasExportableAudio && (
          <Typography variant="body2" sx={{ color: '#555', ml: 1 }}>
            Captured: {durationLabel}
            {isCapturing && ' (recording…)'}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
