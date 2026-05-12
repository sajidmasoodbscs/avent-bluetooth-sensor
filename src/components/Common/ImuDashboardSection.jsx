import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  Stack,
  Button,
  Grid,
} from '@mui/material';
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
import { useBle } from '../../ble/BleContext';
import { ImuTrajectoryStore } from '../../utils/imuPhysics';
import TrajectoryCanvas3D from './TrajectoryCanvas3D';

/** Set to `false` when wiring real BLE samples from the device. */
const USE_DUMMY_BLE_DATA = true;

const POLL_INTERVAL_S = 0.2;
const DARK_BG = '#0d1117';
const PANEL_BG = '#161b22';
const GRID_COL = '#21262d';
const TEXT_COL = '#e6edf3';
const DIM_COL = '#8b949e';

const ACCEL_COLS = ['#ff6b6b', '#ffd93d', '#6bcb77'];
const GYRO_COLS = ['#c77dff', '#48cae4', '#f4a261'];
const ALT_COL = '#00d4aa';
const ALT_BASE = '#ff6b6b';

const TAG_ACCEL = 0x04;
const TAG_PRES = 0x05;
const TAG_GYRO = 0x06;

const POLL_MS = POLL_INTERVAL_S * 1000;

/** One synthetic IMU + pressure sample at cycle index `i` (same waveforms as before). */
function getDummySampleAtCycle(i) {
  const t = i * POLL_INTERVAL_S;
  const ax = 0.28 * Math.sin(0.38 * t) + 0.05 * Math.sin(2.1 * t);
  const ay = 0.2 * Math.cos(0.31 * t) + 0.04 * Math.cos(1.7 * t);
  const az = 9.81 + 0.14 * Math.sin(0.24 * t);
  const gx = 3.2 * Math.sin(0.16 * t);
  const gy = 2.1 * Math.cos(0.13 * t);
  const gz = 0.9 * Math.sin(0.09 * t);
  const hpa = 964.0 + 0.45 * Math.sin(0.22 * t) + 0.12 * Math.cos(0.5 * t);
  return { ax, ay, az, gx, gy, gz, hpa };
}

function parseTlvBuffer(dataView) {
  const view = dataView instanceof DataView ? dataView : new DataView(dataView);
  const tlv = { accel: [], gyro: [], pressure: null };
  let offset = 0;
  while (offset + 2 <= view.byteLength) {
    const tag = view.getUint8(offset);
    const length = view.getUint8(offset + 1);
    offset += 2;
    if (offset + length > view.byteLength) break;
    if (length === 4) {
      const floatValue = view.getFloat32(offset, true);
      if (tag === TAG_ACCEL) tlv.accel.push(floatValue);
      else if (tag === TAG_GYRO) tlv.gyro.push(floatValue);
      else if (tag === TAG_PRES) tlv.pressure = floatValue;
    }
    offset += length;
  }
  return tlv;
}

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

const chartMargin = { top: 8, right: 12, left: 4, bottom: 0 };

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
 * Live IMU / pressure / trajectory block for the main dashboard only.
 * Uses the same GATT lock as the rest of the app so GET:ALL and IMU polls serialize.
 */
function createStore() {
  return new ImuTrajectoryStore();
}

export default function ImuDashboardSection() {
  const {
    isConnected,
    withGattLock,
    tx,
    rx,
  } = useBle();

  const storeRef = useRef(createStore());
  const cycleRef = useRef(0);
  const pollTimerRef = useRef(null);
  const inFlightRef = useRef(false);

  const [snap, setSnap] = useState(() => storeRef.current.snapshot());
  const [isRunning, setIsRunning] = useState(true);

  const dummyMonoRef = useRef(null);
  const dummyIntervalRef = useRef(null);

  const refresh = useCallback(() => {
    setSnap(storeRef.current.snapshot());
  }, []);

  useEffect(() => {
    if (!USE_DUMMY_BLE_DATA) return undefined;
    if (!isRunning) {
      if (dummyIntervalRef.current) {
        clearInterval(dummyIntervalRef.current);
        dummyIntervalRef.current = null;
      }
      return undefined;
    }
    dummyIntervalRef.current = setInterval(() => {
      const c = cycleRef.current;
      if (dummyMonoRef.current == null) dummyMonoRef.current = performance.now() / 1000;
      else dummyMonoRef.current += POLL_INTERVAL_S;
      const mono = dummyMonoRef.current;
      const s = getDummySampleAtCycle(c);
      storeRef.current.pushImu(s.ax, s.ay, s.az, s.gx, s.gy, s.gz, mono);
      if (c % 5 === 0) storeRef.current.pushPressure(s.hpa, mono);
      cycleRef.current = c + 1;
      refresh();
    }, POLL_MS);
    return () => {
      if (dummyIntervalRef.current) {
        clearInterval(dummyIntervalRef.current);
        dummyIntervalRef.current = null;
      }
    };
  }, [isRunning, refresh]);

  useEffect(() => {
    if (USE_DUMMY_BLE_DATA || !isRunning || !isConnected) {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return undefined;
    }

    const encoder = new TextEncoder();
    let cancelled = false;

    const schedule = (delayMs) => {
      pollTimerRef.current = setTimeout(tick, delayMs);
    };

    const tick = async () => {
      if (cancelled || !isRunning) return;
      if (inFlightRef.current) {
        schedule(50);
        return;
      }

      let txChar = tx?.current;
      let rxChar = rx?.current;
      let attempts = 0;
      while ((!txChar || !rxChar) && attempts < 40 && !cancelled) {
        await new Promise((r) => setTimeout(r, 150));
        txChar = tx?.current;
        rxChar = rx?.current;
        attempts += 1;
      }

      if (!txChar || !rxChar || cancelled) {
        schedule(500);
        return;
      }

      const tStart = performance.now() / 1000;
      const cycle = cycleRef.current;

      try {
        inFlightRef.current = true;
        await withGattLock(async () => {
          await txChar.writeValue(encoder.encode('GET:IMU'));
          await new Promise((r) => setTimeout(r, 15));
          const imuBuf = await rxChar.readValue();
          const imuTlv = parseTlvBuffer(imuBuf);

          if (imuTlv.accel.length >= 3 && imuTlv.gyro.length >= 3) {
            const nowS = performance.now() / 1000;
            storeRef.current.pushImu(
              imuTlv.accel[0],
              imuTlv.accel[1],
              imuTlv.accel[2],
              imuTlv.gyro[0],
              imuTlv.gyro[1],
              imuTlv.gyro[2],
              nowS,
            );
          }

          if (cycle % 5 === 0) {
            await txChar.writeValue(encoder.encode('GET:PRES'));
            await new Promise((r) => setTimeout(r, 15));
            const presBuf = await rxChar.readValue();
            const presTlv = parseTlvBuffer(presBuf);
            if (presTlv.pressure != null) {
              const nowS = performance.now() / 1000;
              storeRef.current.pushPressure(presTlv.pressure, nowS);
            }
          }
        });
      } catch (e) {
        console.warn('[IMU dashboard] poll error', e);
      } finally {
        inFlightRef.current = false;
        cycleRef.current = cycle + 1;
        refresh();
        const elapsed = performance.now() / 1000 - tStart;
        const wait = Math.max(0, POLL_INTERVAL_S - elapsed);
        if (!cancelled && isRunning) schedule(wait * 1000);
      }
    };

    tick();

    return () => {
      cancelled = true;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [isRunning, isConnected, tx, rx, withGattLock, refresh]);

  const d = snap;
  const n = d.t.length;

  const imuRows = buildImuChartRows(d.t, d.ax, d.ay, d.az);
  const gyroRows = buildGyroChartRows(d.t, d.gx, d.gy, d.gz);
  const altRows = buildAltRows(d.altT, d.alt);

  let altStr = '—';
  let deltaStr = '';
  if (d.alt.length >= 1) {
    const last = d.alt[d.alt.length - 1];
    altStr = `${last.toFixed(1)} m`;
    if (d.altBase != null) {
      deltaStr = `  Δ=${(last - d.altBase).toFixed(1)} m`;
    }
  }

  const px = d.px;
  const py = d.py;
  const pz = d.pz;

  const statusText = USE_DUMMY_BLE_DATA
    ? `Demo live stream ~${(1000 / POLL_MS).toFixed(0)} Hz (no BLE)  |  ${n >= 2
      ? `Samples: ${n}  |  A=(${d.ax[n - 1].toFixed(2)}, ${d.ay[n - 1].toFixed(2)}, ${d.az[n - 1].toFixed(2)}) m/s²  |  G=(${d.gx[n - 1].toFixed(2)}, ${d.gy[n - 1].toFixed(2)}, ${d.gz[n - 1].toFixed(2)}) °/s  |  Alt=${altStr}${deltaStr}  |  Pos=(${px[n - 1].toFixed(3)}, ${py[n - 1].toFixed(3)}, ${pz[n - 1].toFixed(3)}) m`
      : 'Building trace…'}`
    : (n < 2
      ? 'Waiting for BLE data…'
      : `Samples: ${n}  |  A=(${d.ax[n - 1].toFixed(2)}, ${d.ay[n - 1].toFixed(2)}, ${d.az[n - 1].toFixed(2)}) m/s²  |  G=(${d.gx[n - 1].toFixed(2)}, ${d.gy[n - 1].toFixed(2)}, ${d.gz[n - 1].toFixed(2)}) °/s  |  Alt=${altStr}${deltaStr}  |  Pos=(${px[n - 1].toFixed(3)}, ${py[n - 1].toFixed(3)}, ${pz[n - 1].toFixed(3)}) m`);

  return (
    <Box sx={{ mt: 4, mb: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '6px',
          border: '1px solid #f0f0f0',
          backgroundColor: '#fff',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
              IMU — Accel, Gyro, Altitude &amp; Trajectory
            </Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: 0.5 }}>
              {USE_DUMMY_BLE_DATA
                ? 'Demo mode: synthetic samples every 200 ms (like the Python visualizer). Set USE_DUMMY_BLE_DATA to false to use the device.'
                : 'Live charts (GET:IMU / GET:PRES). Shown only on the dashboard; other pages are unchanged.'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Paper sx={{ px: 1.5, py: 0.5, backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0' }}>
              <Typography component="span" variant="body2" sx={{ color: '#333', mr: 1, fontWeight: 'bold' }}>
                Connected
              </Typography>
              <Switch checked={isConnected} color="success" size="small" disabled />
            </Paper>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                storeRef.current.reset();
                cycleRef.current = 0;
                dummyMonoRef.current = null;
                refresh();
              }}
            >
              {USE_DUMMY_BLE_DATA ? 'Reset demo stream' : 'Clear history'}
            </Button>
            <Button
              variant="contained"
              size="small"
              color={isRunning ? 'warning' : 'success'}
              onClick={() => setIsRunning((v) => !v)}
              disabled={!USE_DUMMY_BLE_DATA && !isConnected}
            >
              {isRunning ? 'Pause' : 'Resume'}
            </Button>
          </Stack>
        </Box>

        <Box sx={{ borderRadius: 1, overflow: 'hidden', backgroundColor: DARK_BG, p: 2 }}>
          <Grid container spacing={2} columns={12}>
            <Grid item size={{ xs: 12, md: 6 }}>
              <DarkLineChartPanel title="Acceleration (m/s²)" yLabel="m/s²" data={imuRows}>
                <Line type="monotone" dataKey="ax" name="Ax" stroke={ACCEL_COLS[0]} dot={false} strokeWidth={1.4} isAnimationActive={USE_DUMMY_BLE_DATA} animationDuration={USE_DUMMY_BLE_DATA ? 160 : 0} />
                <Line type="monotone" dataKey="ay" name="Ay" stroke={ACCEL_COLS[1]} dot={false} strokeWidth={1.4} isAnimationActive={USE_DUMMY_BLE_DATA} animationDuration={USE_DUMMY_BLE_DATA ? 160 : 0} />
                <Line type="monotone" dataKey="az" name="Az" stroke={ACCEL_COLS[2]} dot={false} strokeWidth={1.4} isAnimationActive={USE_DUMMY_BLE_DATA} animationDuration={USE_DUMMY_BLE_DATA ? 160 : 0} />
              </DarkLineChartPanel>
            </Grid>
            <Grid item size={{ xs: 12, md: 6 }}>
              <DarkLineChartPanel title="Gyroscope (°/s)" yLabel="°/s" data={gyroRows}>
                <Line type="monotone" dataKey="gx" name="Gx" stroke={GYRO_COLS[0]} dot={false} strokeWidth={1.4} isAnimationActive={USE_DUMMY_BLE_DATA} animationDuration={USE_DUMMY_BLE_DATA ? 160 : 0} />
                <Line type="monotone" dataKey="gy" name="Gy" stroke={GYRO_COLS[1]} dot={false} strokeWidth={1.4} isAnimationActive={USE_DUMMY_BLE_DATA} animationDuration={USE_DUMMY_BLE_DATA ? 160 : 0} />
                <Line type="monotone" dataKey="gz" name="Gz" stroke={GYRO_COLS[2]} dot={false} strokeWidth={1.4} isAnimationActive={USE_DUMMY_BLE_DATA} animationDuration={USE_DUMMY_BLE_DATA ? 160 : 0} />
              </DarkLineChartPanel>
            </Grid>
            <Grid item size={{ xs: 12, md: 6 }}>
              <DarkLineChartPanel
                title="Barometric altitude (m ASL)"
                yLabel="Altitude (m)"
                data={altRows}
                referenceY={d.altBase}
                minSamples={1}
              >
                <Line type="monotone" dataKey="alt" name="Altitude ASL" stroke={ALT_COL} dot={false} strokeWidth={1.8} isAnimationActive={USE_DUMMY_BLE_DATA} animationDuration={USE_DUMMY_BLE_DATA ? 160 : 0} />
              </DarkLineChartPanel>
            </Grid>
            <Grid item size={{ xs: 12, md: 6 }}>
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
                  Plotly 3D scene (plotly.js + react-plotly.js): drag to rotate, scroll to zoom, toolbar for reset.
                </Typography>
                <TrajectoryCanvas3D px={px} py={py} pz={pz} height={360} dataRevision={px.length} />
              </Paper>
            </Grid>
          </Grid>

          <Typography variant="body2" sx={{ color: DIM_COL, mt: 2, textAlign: 'center' }}>
            {statusText}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
