import React, { createContext, useContext, useMemo, useRef, useState } from 'react';

const BleContext = createContext(null);

export const useBle = () => useContext(BleContext);

export function BleProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [latestData, setLatestData] = useState({});
  const [runningBySensor, setRunningBySensor] = useState({});
  const [activeSensorKey, setActiveSensorKey] = useState(null);
  const serverRef = useRef(null);
  const serviceRef = useRef(null);
  const txRef = useRef(null);
  const rxRef = useRef(null);
  const gattBusyRef = useRef(false);

  const setConnection = ({ server, service, tx, rx }) => {
    serverRef.current = server;
    serviceRef.current = service;
    txRef.current = tx;
    rxRef.current = rx;
    setIsConnected(Boolean(server));
  };

  const writeCommand = async (bytes) => {
    if (!txRef.current) throw new Error('TX characteristic not ready');
    const value = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    await txRef.current.writeValue(value);
  };

  const withGattLock = async (fn) => {
    // Simple mutex to serialize GATT ops across the app
    // Avoids NetworkError: GATT operation already in progress
    while (gattBusyRef.current) {
      // wait a bit
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 25));
    }
    gattBusyRef.current = true;
    try {
      // eslint-disable-next-line no-return-await
      return await fn();
    } finally {
      gattBusyRef.current = false;
    }
  };

  const value = useMemo(() => ({
    isConnected,
    latestData,
    setLatestData,
    setConnection,
    writeCommand,
    withGattLock,
    isSensorRunning: (key) => Boolean(runningBySensor[key]),
    setSensorRunning: (key, running) => setRunningBySensor((m) => ({ ...m, [key]: running })),
    activeSensorKey,
    setActiveSensorKey,
    server: serverRef,
    service: serviceRef,
    tx: txRef,
    rx: rxRef,
  }), [isConnected, latestData, runningBySensor, activeSensorKey]);

  return (
    <BleContext.Provider value={value}>{children}</BleContext.Provider>
  );
}


