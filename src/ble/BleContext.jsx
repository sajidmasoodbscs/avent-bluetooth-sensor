import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

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

  const setConnection = useCallback(({ server, service, tx, rx, alert }) => {
    serverRef.current = server;
    serviceRef.current = service;
    txRef.current = tx;
    rxRef.current = rx;
    alertRef.current = alert ?? null;
    setIsConnected(Boolean(server));
  }, []);

  const clearConnection = useCallback(() => {
    serverRef.current = null;
    serviceRef.current = null;
    txRef.current = null;
    rxRef.current = null;
    alertRef.current = null;
    setIsConnected(false);
    setMicModeActive(false);
    micModeActiveRef.current = false;
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
    server: serverRef,
    service: serviceRef,
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
    sendTextCommand,
    withGattLock,
    setActiveSensorKeyTracked,
    setMicModeActiveTracked,
  ]);

  return (
    <BleContext.Provider value={value}>{children}</BleContext.Provider>
  );
}
