import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { clearMicAiSessionChat } from '../utils/micChatStorage';
import { MIC_SERVICE_UUID, MIC_AUDIO_CHAR_UUID } from '../utils/bleProtocol';

const BleContext = createContext(null);

export const useBle = () => useContext(BleContext);

export function BleProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [latestData, setLatestData] = useState({});
  const [latestAlerts, setLatestAlerts] = useState({});
  const [runningBySensor, setRunningBySensor] = useState({});
  const [activeSensorKey, setActiveSensorKey] = useState(null);
  const [micModeActive, setMicModeActive] = useState(false);
  const activeSensorKeyRef = useRef(null);
  const micModeActiveRef = useRef(false);
  const serverRef = useRef(null);
  const serviceRef = useRef(null);
  const micServiceRef = useRef(null);
  const txRef = useRef(null);
  const rxRef = useRef(null);
  const alertRef = useRef(null);
  const gattBusyRef = useRef(false);

  const withGattLock = useCallback(async (fn) => {
    while (gattBusyRef.current) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 25));
    }
    gattBusyRef.current = true;
    try {
      // eslint-disable-next-line no-return-await
      return await fn();
    } finally {
      gattBusyRef.current = false;
    }
  }, []);

  const setConnection = useCallback(({ server, service, micService, tx, rx, alert }) => {
    serverRef.current = server;
    serviceRef.current = service;
    micServiceRef.current = micService ?? null;
    txRef.current = tx;
    rxRef.current = rx;
    alertRef.current = alert ?? null;
    // Always leave mic mode when (re)connecting sensors
    setMicModeActive(false);
    micModeActiveRef.current = false;
    setIsConnected(Boolean(server));
  }, []);

  /** Lazy-resolve mic GATT service (do not call during initial sensor connect). */
  const ensureMicService = useCallback(async () => {
    if (micServiceRef.current) return micServiceRef.current;
    if (!serverRef.current) return null;
    try {
      const svc = await serverRef.current.getPrimaryService(MIC_SERVICE_UUID);
      micServiceRef.current = svc;
      console.log('[BLE] Microphone service resolved', { uuid: MIC_SERVICE_UUID });
      return svc;
    } catch (err) {
      console.warn('[BLE] Microphone service unavailable', err);
      return null;
    }
  }, []);

  const clearConnection = useCallback(() => {
    serverRef.current = null;
    serviceRef.current = null;
    micServiceRef.current = null;
    txRef.current = null;
    rxRef.current = null;
    alertRef.current = null;
    setIsConnected(false);
    setMicModeActive(false);
    micModeActiveRef.current = false;
    clearMicAiSessionChat();
  }, []);

  const setActiveSensorKeyTracked = useCallback((key) => {
    activeSensorKeyRef.current = key;
    setActiveSensorKey(key);
  }, []);

  const setMicModeActiveTracked = useCallback((active) => {
    micModeActiveRef.current = active;
    setMicModeActive(active);
  }, []);

  const writeCommand = useCallback(async (bytes) => {
    if (!txRef.current) throw new Error('TX characteristic not ready');
    const value = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    await txRef.current.writeValue(value);
  }, []);

  /** Matches Bleak write_gatt_char(..., response=True) used by test_ble_mic.py */
  const writeCommandWithResponse = useCallback(async (bytes) => {
    if (!txRef.current) throw new Error('TX characteristic not ready');
    const value = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (typeof txRef.current.writeValueWithResponse === 'function') {
      await txRef.current.writeValueWithResponse(value);
    } else {
      await txRef.current.writeValue(value);
    }
  }, []);

  const waitForGattIdle = useCallback(async (timeoutMs = 2500) => {
    const start = Date.now();
    while (gattBusyRef.current && Date.now() - start < timeoutMs) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 25));
    }
  }, []);

  /** Find AUDIO_CHAR across GATT services (same as Bleak UUID lookup). */
  const findMicAudioCharacteristic = useCallback(async () => {
    if (!serverRef.current) return null;

    const tryService = async (svc) => {
      if (!svc) return null;
      try {
        return await svc.getCharacteristic(MIC_AUDIO_CHAR_UUID);
      } catch (_) {
        return null;
      }
    };

    let char = await tryService(micServiceRef.current);
    if (char) return char;

    const micSvc = await ensureMicService();
    char = await tryService(micSvc);
    if (char) return char;

    char = await tryService(serviceRef.current);
    if (char) return char;

    try {
      const services = await serverRef.current.getPrimaryServices();
      console.log('[BLE] GATT services', services.map((s) => s.uuid));
      for (const svc of services) {
        // eslint-disable-next-line no-await-in-loop
        char = await tryService(svc);
        if (char) return char;
      }
    } catch (err) {
      console.warn('[BLE] getPrimaryServices failed', err);
    }
    return null;
  }, [ensureMicService]);

  const sendTextCommand = useCallback(async (command, readDelayMs = 250) => {
    if (!txRef.current || !rxRef.current) throw new Error('TX/RX characteristics not ready');
    const encoder = new TextEncoder();
    return withGattLock(async () => {
      await txRef.current.writeValue(encoder.encode(command));
      await new Promise((r) => setTimeout(r, readDelayMs));
      return rxRef.current.readValue();
    });
  }, [withGattLock]);

  const updateAlert = useCallback((key, state) => {
    setLatestAlerts((prev) => ({ ...prev, [key]: state }));
  }, []);

  const value = useMemo(() => ({
    isConnected,
    latestData,
    setLatestData,
    latestAlerts,
    setLatestAlerts,
    updateAlert,
    setConnection,
    clearConnection,
    writeCommand,
    writeCommandWithResponse,
    waitForGattIdle,
    findMicAudioCharacteristic,
    sendTextCommand,
    withGattLock,
    isSensorRunning: (key) => Boolean(runningBySensor[key]),
    setSensorRunning: (key, running) => setRunningBySensor((m) => ({ ...m, [key]: running })),
    activeSensorKey,
    setActiveSensorKey: setActiveSensorKeyTracked,
    activeSensorKeyRef,
    micModeActive,
    setMicModeActive: setMicModeActiveTracked,
    micModeActiveRef,
    ensureMicService,
    server: serverRef,
    service: serviceRef,
    micService: micServiceRef,
    tx: txRef,
    rx: rxRef,
    alert: alertRef,
  }), [
    isConnected,
    latestData,
    latestAlerts,
    runningBySensor,
    activeSensorKey,
    micModeActive,
    updateAlert,
    setConnection,
    clearConnection,
    writeCommand,
    writeCommandWithResponse,
    waitForGattIdle,
    findMicAudioCharacteristic,
    sendTextCommand,
    withGattLock,
    setActiveSensorKeyTracked,
    setMicModeActiveTracked,
    ensureMicService,
  ]);

  return (
    <BleContext.Provider value={value}>{children}</BleContext.Provider>
  );
}
