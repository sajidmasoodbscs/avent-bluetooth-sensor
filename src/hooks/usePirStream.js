import { useCallback, useEffect, useRef, useState } from 'react';
import { useBle } from '../ble/BleContext';
import { GET_COMMANDS, parseTLV, TLV } from '../utils/bleProtocol';

export const USE_DUMMY_PIR_DATA = false;
export const PIR_THRESHOLD = 100;

const POLL_MS = 500;

function parsePirFromBuffer(dataView) {
  const items = parseTLV(dataView);
  const pirItem = items.find((item) => item.type === TLV.PIR);
  return pirItem?.value ?? null;
}

function nextDummyPir(tick) {
  const cycle = tick % 240;
  if (cycle < 80) return 35 + Math.sin(tick * 0.15) * 8;
  if (cycle < 120) return 40 + (cycle - 80) * 2.2;
  if (cycle < 180) return 115 + Math.sin(tick * 0.4) * 25;
  if (cycle < 210) return Math.max(40, 150 - (cycle - 180) * 3.5);
  return 38 + Math.sin(tick * 0.1) * 6;
}

export function usePirStream(active = true) {
  const { isConnected, sendTextCommand, latestData, setLatestData } = useBle();
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

    let cancelled = false;

    const poll = async () => {
      if (cancelled || !isRunning) return;
      if (inFlightRef.current) {
        pollTimerRef.current = setTimeout(poll, 100);
        return;
      }

      try {
        inFlightRef.current = true;
        const value = await sendTextCommand(GET_COMMANDS.PIR, 200);
        const pir = parsePirFromBuffer(value);
        if (pir != null) {
          setPirValue(pir);
          setLatestData((prev) => ({ ...prev, pir }));
          console.log('[Use case PIR] GET:PIR', { pir, detected: pir >= threshold });
        }
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
  }, [active, isRunning, isConnected, sendTextCommand, setLatestData]);

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
