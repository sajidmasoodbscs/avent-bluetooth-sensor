import React, { useMemo } from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatResponseSeconds } from '../../utils/breathResponseMetrics';

function buildRows(t, values) {
  return t.map((ti, i) => ({ t: ti, value: values[i] }));
}

function MetricCard({ label, value, accent }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        flex: 1,
        minWidth: 200,
        borderRadius: 2,
        border: '2px solid',
        borderColor: accent,
        backgroundColor: `${accent}14`,
      }}
    >
      <Typography variant="overline" sx={{ color: accent, fontWeight: 700, letterSpacing: 1 }}>
        {label}
      </Typography>
      <Typography variant="h3" sx={{ fontWeight: 800, color: '#1a1a1a', mt: 0.5 }}>
        {value}
      </Typography>
    </Paper>
  );
}

function LiveChart({ title, unit, data, color, baseline, domainPadding = 2 }) {
  const yDomain = useMemo(() => {
    if (!data.length) return ['auto', 'auto'];
    const vals = data.map((d) => d.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return [Math.floor(min - domainPadding), Math.ceil(max + domainPadding)];
  }, [data, domainPadding]);

  return (
    <Paper elevation={0} sx={{ p: 2, border: '1px solid #e8e8e8', borderRadius: 2, height: 320 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        {title}
      </Typography>
      {data.length < 2 ? (
        <Typography variant="body2" sx={{ color: '#888', p: 2 }}>
          Waiting for live data…
        </Typography>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis
              dataKey="t"
              type="number"
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 11 }}
              label={{ value: 'Time (s)', position: 'insideBottom', offset: -2, fontSize: 11 }}
            />
            <YAxis
              domain={yDomain}
              tick={{ fontSize: 11 }}
              label={{ value: unit, angle: -90, position: 'insideLeft', fontSize: 11 }}
            />
            <Tooltip
              formatter={(v) => [`${Number(v).toFixed(2)} ${unit}`, title]}
              labelFormatter={(l) => `t = ${Number(l).toFixed(1)} s`}
            />
            {baseline != null && (
              <ReferenceLine
                y={baseline}
                stroke="#999"
                strokeDasharray="5 5"
                label={{ value: 'Baseline', fill: '#666', fontSize: 10 }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}

const PHASE_LABEL = {
  idle: 'Ready — breathe onto the sensor',
  rising: 'Humidity rising…',
  recovering: 'Recovering to baseline…',
};

export default function BreathHumidityVisual({ snap, pollHz, isConnected }) {
  const tempRows = buildRows(snap.t, snap.temp);
  const humidRows = buildRows(snap.t, snap.humid);

  return (
    <Box>
      <Paper
        sx={{
          p: 2,
          mb: 2,
          background: 'linear-gradient(135deg, rgba(33,150,243,0.08) 0%, rgba(83,186,100,0.12) 100%)',
          border: '1px solid rgba(83,186,100,0.35)',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2e7d32' }}>
          Response Time Indicator
        </Typography>
        <Typography variant="body2" sx={{ color: '#555', mb: 2 }}>
          Fast RH response is the product USP — breathe on the sensor and watch rise &amp; recovery.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <MetricCard
            label="Rise Time"
            value={formatResponseSeconds(snap.riseTimeS)}
            accent="#1565c0"
          />
          <MetricCard
            label="Recovery Time"
            value={formatResponseSeconds(snap.recoveryTimeS)}
            accent="#2e7d32"
          />
          <MetricCard
            label="Live RH"
            value={snap.currentHumid != null ? `${snap.currentHumid.toFixed(1)} %` : '—'}
            accent="#6a1b9a"
          />
          <MetricCard
            label="Live Temp"
            value={snap.currentTemp != null ? `${snap.currentTemp.toFixed(1)} °C` : '—'}
            accent="#e65100"
          />
        </Box>
      </Paper>

      <Grid container spacing={2}>
        <Grid item size={{ xs: 12, md: 6 }}>
          <LiveChart
            title="Relative Humidity (%RH)"
            unit="%RH"
            data={humidRows}
            color="#1976d2"
            baseline={snap.baseline}
            domainPadding={3}
          />
        </Grid>
        <Grid item size={{ xs: 12, md: 6 }}>
          <LiveChart
            title="Temperature (°C)"
            unit="°C"
            data={tempRows}
            color="#e65100"
            baseline={null}
            domainPadding={1}
          />
        </Grid>
      </Grid>

      <Typography variant="body2" sx={{ color: '#666', mt: 2, textAlign: 'center' }}>
        {!isConnected
          ? 'Connect the sensor to start the live demo.'
          : `${PHASE_LABEL[snap.phase] || snap.phase} · GET:ALL @ ~${pollHz.toFixed(0)} Hz · TLV 0x01 / 0x02`}
      </Typography>
    </Box>
  );
}
