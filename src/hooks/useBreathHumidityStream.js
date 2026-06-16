import { useCallback, useEffect, useRef, useState } from 'react';
import { useBle } from '../ble/BleContext';
import { BreathResponseTracker } from '../utils/breathResponseMetrics';
import { GET_COMMANDS, parseTLV, tlvItemsToSensorData } from '../utils/bleProtocol';

/** High refresh poll while breath demo is active (GET:ALL → TLV 0x01 / 0x02). */
const POLL_INTERVAL_S = 0.2;
const READ_DELAY_MS = 200;

export function useBreathHumidityStream(active = true) {
  const { isConnected, sendTextCommand, setActiveSensorKey } = useBle();
  const trackerRef = useRef(new BreathResponseTracker());
  const pollTimerRef = useRef(null);
  const inFlightRef = useRef(false);
  const t0Ref = useRef(null);

  const [snap, setSnap] = useState(() => trackerRef.current.snapshot());
  const [isRunning, setIsRunning] = useState(true);

  const refresh = useCallback(() => {
    setSnap(trackerRef.current.snapshot());
  }, []);

  const reset = useCallback(() => {
    trackerRef.current.reset();
    t0Ref.current = null;
    refresh();
  }, [refresh]);

  const running = active && isRunning;

  useEffect(() => {
    if (!active) {
      setActiveSensorKey(null);
      return undefined;
    }
    setActiveSensorKey('breathHumidity');
    return () => setActiveSensorKey(null);
  }, [active, setActiveSensorKey]);

  useEffect(() => {
    if (!running || !isConnected) {
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
        schedule(40);
        return;
      }

      const tStart = performance.now() / 1000;

      try {
        inFlightRef.current = true;
        const buf = await sendTextCommand(GET_COMMANDS.ALL, READ_DELAY_MS);
        const items = parseTLV(buf);
        const parsed = tlvItemsToSensorData(items);

        if (parsed.temperature != null && parsed.humidity != null) {
          if (t0Ref.current == null) t0Ref.current = performance.now() / 1000;
          const elapsed = performance.now() / 1000 - t0Ref.current;
          trackerRef.current.push(elapsed, parsed.temperature, parsed.humidity);
          refresh();
        }
      } catch (e) {
        console.warn('[Breath humidity] poll error', e);
      } finally {
        inFlightRef.current = false;
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
  }, [running, isConnected, sendTextCommand, refresh]);

  return {
    snap,
    isRunning,
    setIsRunning,
    reset,
    pollIntervalS: POLL_INTERVAL_S,
    pollHz: 1 / POLL_INTERVAL_S,
  };
}
