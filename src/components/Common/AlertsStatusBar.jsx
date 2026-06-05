import React from 'react';
import { Box, Chip, Paper, Typography } from '@mui/material';
import { useBle } from '../../ble/BleContext';
import { TLV, getAlertLabel } from '../../utils/bleProtocol';

const ALERT_CHIPS = [
  { key: 'occupancy', type: TLV.OCCUPANCY, label: 'Occupancy' },
  { key: 'tilt', type: TLV.TILT, label: 'Tilt' },
  { key: 'motion', type: TLV.MOTION, label: 'Motion' },
  { key: 'pressureAlert', type: TLV.PRESSURE_ALERT, label: 'Syringe' },
];

export default function AlertsStatusBar() {
  const { latestAlerts, isConnected } = useBle();

  const hasAny = ALERT_CHIPS.some(({ key }) => latestAlerts[key] != null);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        border: '1px solid #e8e8e8',
        borderRadius: 2,
        backgroundColor: '#fafafa',
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#444', mb: 1 }}>
        Live alerts {isConnected ? '' : '(connect device)'}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {ALERT_CHIPS.map(({ key, type, label }) => {
          const state = latestAlerts[key];
          const text = state != null ? getAlertLabel(type, state) : 'waiting…';
          const active = state != null && state > 0;
          return (
            <Chip
              key={key}
              label={`${label}: ${text}`}
              size="small"
              color={active ? 'warning' : 'default'}
              variant={state != null ? 'filled' : 'outlined'}
            />
          );
        })}
        {!hasAny && isConnected && (
          <Typography variant="caption" sx={{ color: '#888', alignSelf: 'center', ml: 1 }}>
            Alerts fire only when state changes on the device.
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
