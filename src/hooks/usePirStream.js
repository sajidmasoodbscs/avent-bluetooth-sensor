import { useCallback, useEffect, useRef, useState } from 'react';
import { useBle } from '../ble/BleContext';

export const USE_DUMMY_PIR_DATA = true;
export const PIR_THRESHOLD = 100;

const TAG_PIR = 0x07;
const POLL_MS = 500;

function parsePirFromBuffer(dataView) {
  const view = dataView instanceof DataView ? dataView : new DataView(dataView);
  let offset = 0;
  let pir = null;
  while (offset + 2 <= view.byteLength) {
    const tag = view.getUint8(offset);
    const length = view.getUint8(offset + 1);
    offset += 2;
    if (offset + length > view.byteLength) break;
    if (length === 4 && tag === TAG_PIR) {
      pir = view.getFloat32(offset, true);
    }
    offset += length;
  }
  return pir;
}

/** Simulates someone walking into / out of PIR range. */
function nextDummyPir(tick) {
  const cycle = tick % 240;
  if (cycle < 80) return 35 + Math.sin(tick * 0.15) * 8;
  if (cycle < 120) return 40 + (cycle - 80) * 2.2;
  if (cycle < 180) return 115 + Math.sin(tick * 0.4) * 25;
  if (cycle < 210) return Math.max(40, 150 - (cycle - 180) * 3.5);
  return 38 + Math.sin(tick * 0.1) * 6;
}

export function usePirStream(active = true) {
  const { isConnected, withGattLock, tx, rx, latestData, setLatestData } = useBle();
  const pollTimerRef = useRef(null);
  const inFlightRef = useRef(false);
  const tickRef = useRef(0);

  const [pirValue, setPirValue] = useState(USE_DUMMY_PIR_DATA ? 45 : 0);
  const [threshold, setThreshold] = useState(PIR_THRESHOLD);
  const [isRunning, setIsRunning] = useState(true);

  const detected = pirValue >= threshold;

  const reset = useCallback(() => {
    tickRef.current = 0;
    setPirValue(USE_DUMMY_PIR_DATA ? 45 : 0);
  }, []);

  useEffect(() => {
    if (!active || !isRunning || !USE_DUMMY_PIR_DATA) {
      return undefined;
    }

    const id = setInterval(() => {
      tickRef.current += 1;
      setPirValue(nextDummyPir(tickRef.current));
    }, POLL_MS);

    return () => clearInterval(id);
  }, [active, isRunning]);

  useEffect(() => {
    if (USE_DUMMY_PIR_DATA || !active || !isRunning || !isConnected) {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return undefined;
    }

    const encoder = new TextEncoder();
    let cancelled = false;

    const poll = async () => {
      if (cancelled || !isRunning) return;
      if (inFlightRef.current) {
        pollTimerRef.current = setTimeout(poll, 100);
        return;
      }

      let txChar = tx?.current;
      let rxChar = rx?.current;
      if (!txChar || !rxChar) {
        pollTimerRef.current = setTimeout(poll, 500);
        return;
      }

      try {
        inFlightRef.current = true;
        await withGattLock(async () => {
          await txChar.writeValue(encoder.encode('GET:ALL'));
          await new Promise((r) => setTimeout(r, 200));
          const value = await rxChar.readValue();
          const pir = parsePirFromBuffer(value);
          if (pir != null) {
            setPirValue(pir);
            setLatestData({ pir });
          }
        });
      } catch (e) {
        console.warn('[PIR] poll error', e);
      } finally {
        inFlightRef.current = false;
        if (!cancelled && isRunning) pollTimerRef.current = setTimeout(poll, POLL_MS);
      }
    };

    poll();
    return () => {
      cancelled = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [active, isRunning, isConnected, tx, rx, withGattLock, setLatestData]);

  useEffect(() => {
    if (USE_DUMMY_PIR_DATA || !active) return;
    if (latestData.pir != null) setPirValue(latestData.pir);
  }, [latestData.pir, active]);

  return {
    pirValue,
    detected,
    threshold,
    setThreshold,
    isRunning,
    setIsRunning,
    reset,
    useDummy: USE_DUMMY_PIR_DATA,
  };
}
