import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const PANEL_BG = '#161b22';
const GRID_COL = '#21262d';
const TEXT_COL = '#e6edf3';
const DIM_COL = '#8b949e';
const WAVE_COL = '#58a6ff';
const ENV_COL = '#f4a261';

const chartMargin = { top: 8, right: 12, left: 4, bottom: 0 };

function DarkPanel({ title, subtitle, children, height = 300 }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        backgroundColor: PANEL_BG,
        border: `1px solid ${GRID_COL}`,
        borderRadius: 1,
        height,
      }}
    >
      <Typography variant="subtitle2" sx={{ color: TEXT_COL, mb: 0.25, fontWeight: 600 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: DIM_COL, display: 'block', mb: 1 }}>
          {subtitle}
        </Typography>
      )}
      <Box sx={{ width: '100%', height: height - 72 }}>{children}</Box>
    </Paper>
  );
}

/** Live mic visualization — 16 kHz mono PCM (see mic_receiver.py). */
export default function MicChartsGrid({ waveformRows, envelopeRows, sampleRate, stats, useDummy }) {
  const hasData = waveformRows.length > 0;

  return (
    <Box sx={{ borderRadius: 1, overflow: 'hidden', backgroundColor: '#0d1117', p: 2 }}>
      <Grid container spacing={2}>
        <Grid item size={{ xs: 12 }}>
          <DarkPanel
            title="Microphone waveform"
            subtitle={`${sampleRate / 1000} kHz · 16-bit mono PCM · ${useDummy ? 'demo stream' : 'BLE notifications'}`}
            height={340}
          >
            {!hasData ? (
              <Typography variant="body2" sx={{ color: DIM_COL, p: 1 }}>
                Waiting for audio…
              </Typography>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={waveformRows} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COL} />
                  <XAxis
                    dataKey="t"
                    stroke={TEXT_COL}
                    tick={{ fill: DIM_COL, fontSize: 10 }}
                    label={{ value: 'Time (ms)', position: 'insideBottom', offset: -2, fill: DIM_COL, fontSize: 10 }}
                  />
                  <YAxis
                    domain={[-1, 1]}
                    stroke={TEXT_COL}
                    tick={{ fill: DIM_COL, fontSize: 10 }}
                    label={{ value: 'Amplitude', angle: -90, position: 'insideLeft', fill: DIM_COL, fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: PANEL_BG,
                      border: `1px solid ${GRID_COL}`,
                      borderRadius: 8,
                      color: TEXT_COL,
                    }}
                  />
                  <Legend wrapperStyle={{ color: TEXT_COL, fontSize: 11 }} />
                  <Line type="monotone" dataKey="amp" name="Peak" stroke={WAVE_COL} dot={false} strokeWidth={1.2} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </DarkPanel>
        </Grid>
        <Grid item size={{ xs: 12 }}>
          <DarkPanel
            title="Audio level (RMS)"
            subtitle="Envelope per 32 ms window — useful for voice / sound activity"
            height={280}
          >
            {!envelopeRows.length ? (
              <Typography variant="body2" sx={{ color: DIM_COL, p: 1 }}>
                Waiting for audio…
              </Typography>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={envelopeRows} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COL} />
                  <XAxis
                    dataKey="t"
                    stroke={TEXT_COL}
                    tick={{ fill: DIM_COL, fontSize: 10 }}
                    label={{ value: 'Time (s)', position: 'insideBottom', offset: -2, fill: DIM_COL, fontSize: 10 }}
                  />
                  <YAxis
                    domain={[0, 'auto']}
                    stroke={TEXT_COL}
                    tick={{ fill: DIM_COL, fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: PANEL_BG,
                      border: `1px solid ${GRID_COL}`,
                      borderRadius: 8,
                      color: TEXT_COL,
                    }}
                  />
                  <Line type="monotone" dataKey="level" name="RMS" stroke={ENV_COL} dot={false} strokeWidth={1.6} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </DarkPanel>
        </Grid>
      </Grid>
      <Typography variant="body2" sx={{ color: DIM_COL, mt: 2, textAlign: 'center' }}>
        {hasData
          ? `Stream: ${stats.kbps.toFixed(1)} kbps · ${stats.notifications} notifications · ${stats.bytes} bytes`
          : 'Use Start recording above, then Play or Download .wav'}
      </Typography>
    </Box>
  );
}
