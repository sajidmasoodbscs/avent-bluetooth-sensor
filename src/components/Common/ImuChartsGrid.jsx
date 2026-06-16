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
  ReferenceLine,
} from 'recharts';
import TrajectoryCanvas3D from './TrajectoryCanvas3D';

const DARK_BG = '#0d1117';
const PANEL_BG = '#161b22';
const GRID_COL = '#21262d';
const TEXT_COL = '#e6edf3';
const DIM_COL = '#8b949e';

const ACCEL_COLS = ['#ff6b6b', '#ffd93d', '#6bcb77'];
const GYRO_COLS = ['#c77dff', '#48cae4', '#f4a261'];
const ALT_COL = '#00d4aa';
const ALT_BASE = '#ff6b6b';

const chartMargin = { top: 8, right: 12, left: 4, bottom: 0 };

function buildImuChartRows(t, ax, ay, az) {
  const rows = [];
  for (let i = 0; i < t.length; i += 1) {
    rows.push({ t: t[i], ax: ax[i], ay: ay[i], az: az[i] });
  }
  return rows;
}

function buildGyroChartRows(t, gx, gy, gz) {
  const rows = [];
  for (let i = 0; i < t.length; i += 1) {
    rows.push({ t: t[i], gx: gx[i], gy: gy[i], gz: gz[i] });
  }
  return rows;
}

function buildAltRows(altT, alt) {
  return altT.map((ti, i) => ({ t: ti, alt: alt[i] }));
}

function DarkLineChartPanel({ title, yLabel, children, data, referenceY, minSamples = 2 }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        backgroundColor: PANEL_BG,
        border: `1px solid ${GRID_COL}`,
        borderRadius: 1,
        height: 320,
      }}
    >
      <Typography variant="subtitle2" sx={{ color: TEXT_COL, mb: 0.5, fontWeight: 600 }}>
        {title}
      </Typography>
      <Box sx={{ width: '100%', height: 270 }}>
        {data.length < minSamples ? (
          <Typography variant="body2" sx={{ color: DIM_COL, p: 1 }}>
            Waiting for BLE data…
          </Typography>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COL} />
              <XAxis
                dataKey="t"
                type="number"
                domain={[0, 'auto']}
                stroke={TEXT_COL}
                tick={{ fill: DIM_COL, fontSize: 10 }}
                label={{ value: 'Time (s)', position: 'insideBottom', offset: -2, fill: DIM_COL, fontSize: 10 }}
              />
              <YAxis
                stroke={TEXT_COL}
                tick={{ fill: DIM_COL, fontSize: 10 }}
                label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: DIM_COL, fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: PANEL_BG,
                  border: `1px solid ${GRID_COL}`,
                  borderRadius: 8,
                  color: TEXT_COL,
                }}
                labelStyle={{ color: DIM_COL }}
              />
              <Legend wrapperStyle={{ color: TEXT_COL, fontSize: 11 }} />
              {referenceY != null && data.length >= 1 && (
                <ReferenceLine
                  y={referenceY}
                  stroke={ALT_BASE}
                  strokeDasharray="6 4"
                  strokeOpacity={0.75}
                  label={{ value: 'Start baseline', fill: DIM_COL, fontSize: 10 }}
                />
              )}
              {children}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  );
}

/**
 * @param {object} snap — ImuTrajectoryStore.snapshot()
 * @param {('accel'|'gyro'|'alt'|'traj')[]} charts — which panels to render
 */
export default function ImuChartsGrid({ snap, charts, animate = false }) {
  const d = snap;
  const imuRows = buildImuChartRows(d.t, d.ax, d.ay, d.az);
  const gyroRows = buildGyroChartRows(d.t, d.gx, d.gy, d.gz);
  const altRows = buildAltRows(d.altT, d.alt);
  const px = d.px;
  const py = d.py;
  const pz = d.pz;

  const anim = animate ? 160 : 0;
  const show = (key) => charts.includes(key);

  return (
    <Box sx={{ borderRadius: 1, overflow: 'hidden', backgroundColor: DARK_BG, p: 2 }}>
      <Grid container spacing={2} columns={12}>
        {show('accel') && (
          <Grid item size={{ xs: 12, md: charts.length === 1 ? 12 : 6 }}>
            <DarkLineChartPanel title="Acceleration (m/s²)" yLabel="m/s²" data={imuRows}>
              <Line type="monotone" dataKey="ax" name="Ax" stroke={ACCEL_COLS[0]} dot={false} strokeWidth={1.4} isAnimationActive={animate} animationDuration={anim} />
              <Line type="monotone" dataKey="ay" name="Ay" stroke={ACCEL_COLS[1]} dot={false} strokeWidth={1.4} isAnimationActive={animate} animationDuration={anim} />
              <Line type="monotone" dataKey="az" name="Az" stroke={ACCEL_COLS[2]} dot={false} strokeWidth={1.4} isAnimationActive={animate} animationDuration={anim} />
            </DarkLineChartPanel>
          </Grid>
        )}
        {show('gyro') && (
          <Grid item size={{ xs: 12, md: charts.length === 1 ? 12 : 6 }}>
            <DarkLineChartPanel title="Gyroscope (°/s)" yLabel="°/s" data={gyroRows}>
              <Line type="monotone" dataKey="gx" name="Gx" stroke={GYRO_COLS[0]} dot={false} strokeWidth={1.4} isAnimationActive={animate} animationDuration={anim} />
              <Line type="monotone" dataKey="gy" name="Gy" stroke={GYRO_COLS[1]} dot={false} strokeWidth={1.4} isAnimationActive={animate} animationDuration={anim} />
              <Line type="monotone" dataKey="gz" name="Gz" stroke={GYRO_COLS[2]} dot={false} strokeWidth={1.4} isAnimationActive={animate} animationDuration={anim} />
            </DarkLineChartPanel>
          </Grid>
        )}
        {show('alt') && (
          <Grid item size={{ xs: 12, md: charts.includes('traj') ? 6 : 12 }}>
            <DarkLineChartPanel
              title={d.altUnit === 'cm' ? 'Altitude change (cm vs baseline)' : 'Barometric altitude (m ASL)'}
              yLabel={d.altUnit === 'cm' ? 'Δ altitude (cm)' : 'Altitude (m)'}
              data={altRows}
              referenceY={d.altBase}
              minSamples={1}
            >
              <Line type="monotone" dataKey="alt" name={d.altUnit === 'cm' ? 'Δ altitude (cm)' : 'Altitude ASL'} stroke={ALT_COL} dot={false} strokeWidth={1.8} isAnimationActive={animate} animationDuration={anim} />
            </DarkLineChartPanel>
          </Grid>
        )}
        {show('traj') && (
          <Grid item size={{ xs: 12, md: charts.includes('alt') ? 6 : 12 }}>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                backgroundColor: PANEL_BG,
                border: `1px solid ${GRID_COL}`,
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle2" sx={{ color: TEXT_COL, mb: 1, fontWeight: 600 }}>
                3D position trajectory (m)
              </Typography>
              <Typography variant="caption" sx={{ color: DIM_COL, display: 'block', mb: 1 }}>
                Drag to rotate, scroll to zoom.
              </Typography>
              <TrajectoryCanvas3D px={px} py={py} pz={pz} height={360} dataRevision={px.length} />
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export function buildImuStatusText(snap, useDummy, pollIntervalS) {
  const d = snap;
  const n = d.t.length;
  let altStr = '—';
  let deltaStr = '';
  if (d.alt.length >= 1) {
    const last = d.alt[d.alt.length - 1];
    const unit = d.altUnit === 'cm' ? 'cm' : 'm';
    altStr = `${last.toFixed(1)} ${unit}`;
    if (d.altBase != null) {
      deltaStr = `  Δ=${(last - d.altBase).toFixed(1)} ${unit}`;
    }
  }
  const px = d.px;
  const py = d.py;
  const pz = d.pz;

  if (useDummy) {
    return `Demo live stream ~${(1000 / (pollIntervalS * 1000)).toFixed(0)} Hz (no BLE)  |  ${n >= 2
      ? `Samples: ${n}  |  A=(${d.ax[n - 1].toFixed(2)}, ${d.ay[n - 1].toFixed(2)}, ${d.az[n - 1].toFixed(2)}) m/s²  |  G=(${d.gx[n - 1].toFixed(2)}, ${d.gy[n - 1].toFixed(2)}, ${d.gz[n - 1].toFixed(2)}) °/s  |  Alt=${altStr}${deltaStr}  |  Pos=(${px[n - 1].toFixed(3)}, ${py[n - 1].toFixed(3)}, ${pz[n - 1].toFixed(3)}) m`
      : 'Building trace…'}`;
  }
  if (d.alt.length >= 1 && n < 2) {
    return `Altitude samples: ${d.alt.length}  |  Alt=${altStr}${deltaStr}`;
  }
  return n < 2
    ? 'Waiting for BLE data…'
    : `Samples: ${n}  |  A=(${d.ax[n - 1].toFixed(2)}, ${d.ay[n - 1].toFixed(2)}, ${d.az[n - 1].toFixed(2)}) m/s²  |  G=(${d.gx[n - 1].toFixed(2)}, ${d.gy[n - 1].toFixed(2)}, ${d.gz[n - 1].toFixed(2)}) °/s  |  Alt=${altStr}${deltaStr}  |  Pos=(${px[n - 1].toFixed(3)}, ${py[n - 1].toFixed(3)}, ${pz[n - 1].toFixed(3)}) m`;
}
