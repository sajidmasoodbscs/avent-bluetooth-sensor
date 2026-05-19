import React from 'react';
import { Box, Paper, Typography, Slider, Stack } from '@mui/material';
import { PIR_THRESHOLD } from '../../hooks/usePirStream';

const WAVE_COUNT = 11;

function PirSensorIcon() {
  return (
    <Box sx={{ textAlign: 'center', minWidth: 100 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#333' }}>
        PIR Sensor
      </Typography>
      <Box
        sx={{
          width: 56,
          height: 56,
          mx: 'auto',
          borderRadius: '14px',
          bgcolor: '#ececec',
          border: '1px solid #d8d8d8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: '#b0b0b0',
            border: '2px solid #9a9a9a',
          }}
        />
      </Box>
    </Box>
  );
}

function DetectionWaves({ active, intensity }) {
  const baseOpacity = active ? 0.4 + intensity * 0.5 : 0.15;

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        minWidth: 200,
      }}
    >
      <svg width="280" height="160" viewBox="0 0 280 160" aria-hidden>
        <defs>
          <linearGradient id="pirWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffd54f" />
            <stop offset="55%" stopColor="#ff8a50" />
            <stop offset="100%" stopColor="#e64a19" />
          </linearGradient>
        </defs>
        {Array.from({ length: WAVE_COUNT }).map((_, i) => {
          const t = i / (WAVE_COUNT - 1);
          const x = 18 + i * 24;
          const h = 35 + t * 90;
          const y = 150 - h;
          const opacity = baseOpacity * (0.45 + t * 0.55);
          const delay = i * 0.08;
          return (
            <path
              key={i}
              d={`M ${x} 150 Q ${x + 8} ${y + h * 0.35} ${x + 14} ${y} Q ${x + 20} ${y + h * 0.35} ${x + 26} 150`}
              fill="none"
              stroke="url(#pirWaveGrad)"
              strokeWidth={3.5}
              strokeLinecap="round"
              opacity={opacity}
              style={{
                transformOrigin: `${x + 13}px 150px`,
                animation: active ? `pirArcPulse 1.5s ease-in-out ${delay}s infinite` : 'none',
              }}
            />
          );
        })}
      </svg>
      <style>
        {`
          @keyframes pirArcPulse {
            0%, 100% { transform: scaleY(0.82); opacity: 0.5; }
            50% { transform: scaleY(1.06); opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
}

function HumanSilhouette({ detected }) {
  const fillId = detected ? 'humanGreen' : 'humanWarm';
  const gradient = detected
    ? (
      <linearGradient id="humanGreen" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#2e7d32" />
        <stop offset="50%" stopColor="#43a047" />
        <stop offset="100%" stopColor="#66bb6a" />
      </linearGradient>
    )
    : (
      <linearGradient id="humanWarm" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#ffd54f" />
        <stop offset="45%" stopColor="#ff8a50" />
        <stop offset="100%" stopColor="#e64a19" />
      </linearGradient>
    );

  return (
    <Box
      sx={{
        minWidth: 120,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: 'transform 0.4s ease',
        transform: detected ? 'scale(1.03)' : 'scale(1)',
      }}
    >
      <svg
        viewBox="0 0 80 140"
        width="100"
        height="175"
        aria-label={detected ? 'Motion detected' : 'No motion'}
      >
        <defs>{gradient}</defs>
        <g fill={`url(#${fillId})`} stroke="none">
          {/* Head */}
          <circle cx="40" cy="14" r="11" />
          {/* Torso */}
          <path d="M28 28 Q40 24 52 28 L48 72 Q40 76 32 72 Z" />
          {/* Walking legs */}
          <path d="M34 72 L28 108 L32 108 L36 82 L40 108 L44 82 L48 108 L52 108 L46 72 Z" />
          {/* Arms */}
          <path d="M26 32 L14 58 L18 60 L28 38 Z" />
          <path d="M54 32 L66 52 L62 54 L52 38 Z" />
        </g>
      </svg>
      <Typography
        variant="caption"
        sx={{
          mt: 0.5,
          fontWeight: 700,
          color: detected ? '#2e7d32' : '#e65100',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {detected ? 'Motion detected' : 'No motion'}
      </Typography>
    </Box>
  );
}

export default function PirDetectionVisual({
  pirValue,
  detected,
  threshold = PIR_THRESHOLD,
  useDummy,
  onThresholdChange,
}) {
  const intensity = Math.min(1, Math.max(0, pirValue / (threshold * 1.8)));
  const wavesActive = pirValue > threshold * 0.35;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 4 },
        borderRadius: 2,
        border: '1px solid #f0f0f0',
        bgcolor: '#fff',
        minHeight: 280,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          maxWidth: 720,
          mx: 'auto',
        }}
      >
        <PirSensorIcon />
        <DetectionWaves active={wavesActive} intensity={intensity} />
        <HumanSilhouette detected={detected} />
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems="center"
        justifyContent="center"
        sx={{ mt: 3, pt: 2, borderTop: '1px solid #f0f0f0' }}
      >
        <Typography variant="body2" sx={{ color: '#666', minWidth: 140 }}>
          Signal: <strong>{pirValue.toFixed(0)}</strong>
          {' · '}
          Threshold: <strong>{threshold}</strong>
        </Typography>
        {useDummy && (
          <Typography variant="caption" sx={{ color: '#999' }}>
            Demo: figure walks in/out of range automatically
          </Typography>
        )}
      </Stack>

      {onThresholdChange && (
        <Box sx={{ maxWidth: 360, mx: 'auto', mt: 2, px: 2 }}>
          <Typography variant="caption" sx={{ color: '#888' }}>
            Detection threshold
          </Typography>
          <Slider
            size="small"
            value={threshold}
            min={20}
            max={200}
            onChange={(_, v) => onThresholdChange(v)}
            valueLabelDisplay="auto"
          />
        </Box>
      )}
    </Paper>
  );
}
