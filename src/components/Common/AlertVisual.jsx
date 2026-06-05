import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { TLV, getAlertLabel } from '../../utils/bleProtocol';

const CONFIG = {
  occupancy: {
    title: 'Occupancy',
    type: TLV.OCCUPANCY,
    colors: ['#e8f5e9', '#c8e6c9'],
    activeColor: '#2e7d32',
    icons: ['○', '●'],
  },
  tilt: {
    title: 'Board tilt',
    type: TLV.TILT,
    colors: ['#e3f2fd', '#fff3e0', '#ffebee'],
    activeColor: '#c62828',
    icons: ['▬', '╱', '╲'],
  },
  motion: {
    title: 'Motion',
    type: TLV.MOTION,
    colors: ['#f5f5f5', '#fff8e1', '#fce4ec'],
    activeColor: '#e65100',
    icons: ['—', '~', '!!'],
  },
  syringe: {
    title: 'Syringe pressure',
    type: TLV.PRESSURE_ALERT,
    colors: ['#eceff1', '#e8f5e9', '#e3f2fd', '#fce4ec'],
    activeColor: '#6a1b9a',
    icons: ['—', '↓', '↑', '⚡'],
  },
};

export default function AlertVisual({ alertKey, state, label, isConnected }) {
  const cfg = CONFIG[alertKey];
  if (!cfg) return null;

  const idx = state ?? 0;
  const bg = cfg.colors[idx] || cfg.colors[0];
  const options = (cfg.colors || []).map((color, i) => ({
    color,
    text: getAlertLabel(cfg.type, i),
    icon: cfg.icons[i] || '•',
    active: i === idx,
  }));

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: 'center',
          backgroundColor: bg,
          border: `2px solid ${idx > 0 ? cfg.activeColor : '#e0e0e0'}`,
          borderRadius: 3,
          transition: 'all 0.3s ease',
        }}
      >
        <Typography variant="h2" sx={{ fontWeight: 800, color: cfg.activeColor, mb: 1 }}>
          {cfg.icons[idx] || '—'}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
          {cfg.title} alert · {isConnected ? 'live BLE' : 'not connected'}
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 2 }}>
        {options.map((opt) => (
          <Chip
            key={opt.text}
            label={`${opt.icon} ${opt.text}`}
            size="small"
            color={opt.active ? 'success' : 'default'}
            variant={opt.active ? 'filled' : 'outlined'}
          />
        ))}
      </Box>
    </Box>
  );
}
