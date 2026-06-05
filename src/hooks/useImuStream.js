import { useCallback, useEffect, useRef, useState } from 'react';
import { useBle } from '../ble/BleContext';
import { ImuTrajectoryStore } from '../utils/imuPhysics';
import { GET_COMMANDS, parseTLV, TLV } from '../utils/bleProtocol';

/** Set to `true` only for offline UI demo without a device. */
export const USE_DUMMY_BLE_DATA = false;

const POLL_INTERVAL_S = 0.2;
const POLL_MS = POLL_INTERVAL_S * 1000;

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

function parseImuTlv(dataView) {
  const items = parseTLV(dataView);
  const tlv = { accel: [], gyro: [], pressure: null };
  for (const { type, value } of items) {
    if (type === TLV.ACCEL) tlv.accel.push(value);
    else if (type === TLV.GYRO) tlv.gyro.push(value);
    else if (type === TLV.PRES) tlv.pressure = value;
  }
  return tlv;
}

/**
 * @param {'full'|'imu'|'pressure'} mode
 * @param {boolean} active
 */
export function useImuStream(mode = 'full', active = true) {
  const { isConnected, sendTextCommand } = useBle();
  const storeRef = useRef(new ImuTrajectoryStore());
  const cycleRef = useRef(0);
  const pollTimerRef = useRef(null);
  const inFlightRef = useRef(false);
  const dummyMonoRef = useRef(null);
  const dummyIntervalRef = useRef(null);

  const [snap, setSnap] = useState(() => storeRef.current.snapshot());
  const [isRunning, setIsRunning] = useState(true);

  const refresh = useCallback(() => {
    setSnap(storeRef.current.snapshot());
  }, []);

  const reset = useCallback(() => {
    storeRef.current.reset();
    cycleRef.current = 0;
    dummyMonoRef.current = null;
    refresh();
  }, [refresh]);

  const running = active && isRunning;

  useEffect(() => {
    if (!USE_DUMMY_BLE_DATA) return undefined;
    if (!running) {
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
      if (mode !== 'pressure') {
        storeRef.current.pushImu(s.ax, s.ay, s.az, s.gx, s.gy, s.gz, mono);
      }
      if (mode !== 'imu' && c % 5 === 0) {
        storeRef.current.pushPressure(s.hpa, mono);
      }
      cycleRef.current = c + 1;
      refresh();
    }, POLL_MS);
    return () => {
      if (dummyIntervalRef.current) {
        clearInterval(dummyIntervalRef.current);
        dummyIntervalRef.current = null;
      }
    };
  }, [running, refresh, mode]);

  useEffect(() => {
    if (USE_DUMMY_BLE_DATA || !running || !isConnected) {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return undefined;
    }

    let cancelled = false;

    const schedule = (delayMs) => {
      pollTimerRef.current = setTimeout(tick, delayMs);
    };

    const tick = async () => {
      if (cancelled || !running) return;
      if (inFlightRef.current) {
        schedule(50);
        return;
      }

      const tStart = performance.now() / 1000;
      const cycle = cycleRef.current;

      try {
        inFlightRef.current = true;
        if (mode !== 'pressure') {
          const imuBuf = await sendTextCommand(GET_COMMANDS.IMU, 15);
          const imuTlv = parseImuTlv(imuBuf);
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
        }

        if (mode !== 'imu' && cycle % 5 === 0) {
          const presBuf = await sendTextCommand(GET_COMMANDS.PRES, 15);
          const presTlv = parseImuTlv(presBuf);
          if (presTlv.pressure != null) {
            const nowS = performance.now() / 1000;
            storeRef.current.pushPressure(presTlv.pressure, nowS);
          }
        }
      } catch (e) {
        console.warn('[IMU stream] poll error', e);
      } finally {
        inFlightRef.current = false;
        cycleRef.current = cycle + 1;
        refresh();
        const elapsed = performance.now() / 1000 - tStart;
        const wait = Math.max(0, POLL_INTERVAL_S - elapsed);
        if (!cancelled && running) schedule(wait * 1000);
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
  }, [running, isConnected, sendTextCommand, refresh, mode]);

  return {
    snap,
    isRunning,
    setIsRunning,
    reset,
    pollIntervalS: POLL_INTERVAL_S,
    useDummy: USE_DUMMY_BLE_DATA,
  };
}
