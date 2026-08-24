import React, { useState, useEffect, useRef } from 'react';
import { Box, Modal, Typography, Button } from "@mui/material";
import { useBle } from '../../ble/BleContext';
import { appendSensorPoint } from '../../utils/storage';
import {
  BLE_SERVICE_UUID,
  BLE_TX_UUID,
  BLE_RX_UUID,
  BLE_ALERT_UUID,
  GET_COMMANDS,
  TLV,
  parseTLV,
  parseTLVDetailed,
  tlvItemsToSensorData,
  parseAlertNotification,
} from '../../utils/bleProtocol';

const ConnectModal = () => {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [reconnect, setReconnect] = useState(false);
  const pollingTimeoutRef = useRef(null);
  const pollCycleRef = useRef(0);
  const alertHandlerRef = useRef(null);
  const ble = useBle();

  useEffect(() => {
    const isConnectedBefore = localStorage.getItem('bleConnected') === 'true';
    setReconnect(isConnectedBefore);
    setOpen(true);
  }, []);

  useEffect(() => () => {
    if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
  }, []);

  const handleClose = () => setOpen(false);

  const handleGetPirResponse = (dataView) => {
    const rawBytes = Array.from(
      new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength),
    );
    const items = parseTLV(dataView);
    const parsedData = tlvItemsToSensorData(items);
    const tlvRecords = parseTLVDetailed(dataView);
    const tag0x07 = tlvRecords.find((r) => r.type === TLV.PIR);

    console.log('[BLE device] GET:PIR', {
      rawBytes,
      byteLength: rawBytes.length,
      tlvRecords,
      received0x07: Boolean(tag0x07),
      tag0x07: tag0x07 ?? null,
      pir: parsedData.pir ?? null,
    });

    if (parsedData.pir != null) {
      appendSensorPoint('pir', parsedData.pir);
      ble.setLatestData((prev) => ({ ...prev, pir: parsedData.pir }));
    }
  };

  const handleGetAltResponse = (dataView) => {
    const rawBytes = Array.from(
      new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength),
    );
    const items = parseTLV(dataView);
    const parsedData = tlvItemsToSensorData(items);
    const tlvRecords = parseTLVDetailed(dataView);
    const tag0x0C = tlvRecords.find((r) => r.type === TLV.BARO_PRESS);
    const tag0x0D = tlvRecords.find((r) => r.type === TLV.ALT_CHANGE);
    const tag0x0E = tlvRecords.find((r) => r.type === TLV.BARO_TEMP);

    console.log('[BLE device] GET:ALT', {
      rawBytes,
      byteLength: rawBytes.length,
      tlvRecords,
      received0x0C: Boolean(tag0x0C),
      tag0x0C: tag0x0C ?? null,
      baroPressureHpa: parsedData.baroPressure ?? null,
      received0x0D: Boolean(tag0x0D),
      tag0x0D: tag0x0D ?? null,
      altChangeCm: parsedData.altChangeCm ?? null,
      received0x0E: Boolean(tag0x0E),
      tag0x0E: tag0x0E ?? null,
      baroTemperatureC: parsedData.baroTemperature ?? null,
    });

    if (parsedData.baroPressure != null) {
      appendSensorPoint('baroPressure', parsedData.baroPressure);
    }
    if (parsedData.baroTemperature != null) {
      appendSensorPoint('baroTemperature', parsedData.baroTemperature);
    }

    if (
      parsedData.baroPressure != null
      || parsedData.altChangeCm != null
      || parsedData.baroTemperature != null
    ) {
      ble.setLatestData((prev) => ({ ...prev, ...parsedData }));
    }
  };

  const handlePollResponse = (dataView, { source = 'GET:ALL' } = {}) => {
    const items = parseTLV(dataView);
    const parsedData = tlvItemsToSensorData(items);
    const rawBytes = Array.from(
      new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength),
    );
    const tlvItems = items.map(({ type, value }) => ({
      type: `0x${type.toString(16).padStart(2, '0')}`,
      value,
    }));

    if (source === 'GET:ALL') {
      console.log('[BLE device] GET:ALL', {
        rawBytes,
        tlvItems,
        parsedData,
      });
    } else if (source === 'GET:PRES' || parsedData.pressure != null) {
      console.log(`[BLE device] ${source}`, {
        rawBytes,
        pressure: parsedData.pressure ?? null,
        tlvItems,
      });
    }

    if (parsedData.temperature != null) appendSensorPoint('temperature', parsedData.temperature);
    if (parsedData.humidity != null) appendSensorPoint('humidity', parsedData.humidity);
    if (parsedData.irTemperature != null) appendSensorPoint('irTemperature', parsedData.irTemperature);
    if (parsedData.pressure != null) appendSensorPoint('pressure', parsedData.pressure);
    if (parsedData.baroPressure != null) appendSensorPoint('baroPressure', parsedData.baroPressure);
    if (parsedData.baroTemperature != null) appendSensorPoint('baroTemperature', parsedData.baroTemperature);
    if (Array.isArray(parsedData.accel)) {
      parsedData.accel.forEach((v) => appendSensorPoint('imuAccel', v));
    }
    if (Array.isArray(parsedData.gyro)) {
      parsedData.gyro.forEach((v) => appendSensorPoint('imuGyro', v));
    }

    if (Object.keys(parsedData).length > 0) {
      ble.setLatestData((prev) => ({ ...prev, ...parsedData }));
    }
    setOpen(false);
  };

  const subscribeAlerts = async (alertCharacteristic) => {
    if (alertHandlerRef.current) {
      alertCharacteristic.removeEventListener('characteristicvaluechanged', alertHandlerRef.current);
    }

    const handler = (event) => {
      const alert = parseAlertNotification(event.target.value);
      if (alert) ble.updateAlert(alert.key, alert.state);
    };
    alertHandlerRef.current = handler;

    await alertCharacteristic.startNotifications();
    alertCharacteristic.addEventListener('characteristicvaluechanged', handler);
  };

  const handleScanDevices = async () => {
    setErrorMessage('');
    setIsScanning(true);

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [BLE_SERVICE_UUID] }],
        optionalServices: [BLE_SERVICE_UUID],
      });

      const connectedServer = await device.gatt.connect();
      localStorage.setItem('bleConnected', 'true');

      await startDataStream(connectedServer);
    } catch (error) {
      console.error('BLE Error:', error);
      localStorage.removeItem('bleConnected');
      ble.clearConnection();
      setErrorMessage(error.message || 'Bluetooth connection failed');
    } finally {
      setIsScanning(false);
    }
  };

  const startDataStream = async (connectedServer) => {
    try {
      const service = await connectedServer.getPrimaryService(BLE_SERVICE_UUID);
      const txCharacteristic = await service.getCharacteristic(BLE_TX_UUID);
      const rxCharacteristic = await service.getCharacteristic(BLE_RX_UUID);
      const alertCharacteristic = await service.getCharacteristic(BLE_ALERT_UUID);

      ble.setConnection({
        server: connectedServer,
        service,
        tx: txCharacteristic,
        rx: rxCharacteristic,
        alert: alertCharacteristic,
      });

      await subscribeAlerts(alertCharacteristic);

      const cmd = new TextEncoder().encode(GET_COMMANDS.ALL);
      const altCmd = new TextEncoder().encode(GET_COMMANDS.ALT);
      const pirCmd = new TextEncoder().encode(GET_COMMANDS.PIR);
      let consecutiveErrors = 0;

      const pollData = async () => {
        if (!connectedServer.connected) return;

        try {
          if (ble.activeSensorKeyRef?.current || ble.micModeActiveRef?.current) {
            pollingTimeoutRef.current = setTimeout(pollData, 500);
            return;
          }

          const cycle = pollCycleRef.current;

          await ble.withGattLock(async () => {
            await txCharacteristic.writeValue(cmd);
            await new Promise((resolve) => setTimeout(resolve, 300));
            const value = await rxCharacteristic.readValue();
            handlePollResponse(value, { source: 'GET:ALL' });

            await txCharacteristic.writeValue(altCmd);
            await new Promise((resolve) => setTimeout(resolve, 250));
            const altValue = await rxCharacteristic.readValue();
            handleGetAltResponse(altValue);

            await txCharacteristic.writeValue(pirCmd);
            await new Promise((resolve) => setTimeout(resolve, 200));
            const pirValue = await rxCharacteristic.readValue();
            handleGetPirResponse(pirValue);
          });

          pollCycleRef.current = cycle + 1;
          consecutiveErrors = 0;
          pollingTimeoutRef.current = setTimeout(pollData, 500);
        } catch (error) {
          console.error('Polling error:', error);
          consecutiveErrors += 1;

          const isLinuxError = error.name === 'NotSupportedError'
            || error.message?.includes('GATT operation failed')
            || error.message?.includes('unknown reason');

          if (isLinuxError && consecutiveErrors < 3) {
            pollingTimeoutRef.current = setTimeout(pollData, 1000 + (consecutiveErrors * 500));
            return;
          }

          try {
            if (!connectedServer.connected || consecutiveErrors >= 5) {
              if (isLinuxError) {
                setErrorMessage('Bluetooth error on Linux. Try: 1) Chrome flags: chrome://flags/#enable-experimental-web-platform-features 2) Run Chrome with: --enable-features=WebBluetooth');
              } else {
                setErrorMessage('Device disconnected or powered off. Please reconnect your sensor.');
              }
              localStorage.removeItem('bleConnected');
              ble.clearConnection();
              setOpen(true);
              return;
            }
          } catch (_) {
            // fallthrough
          }
          pollingTimeoutRef.current = setTimeout(pollData, 800);
        }
      };

      pollData();
    } catch (err) {
      console.error('startDataStream error:', err);
      setErrorMessage('Failed to start data stream. Please try again.');
    }
  };

  return (
    <Box>
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            maxWidth: '600px',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            outline: 'none',
          }}
        >
          <Typography sx={{ fontWeight: 'bold', textAlign: 'center' }} variant="h4" gutterBottom>
            BLE Sensor Reader
          </Typography>

          <Typography sx={{ textAlign: 'center', mb: 4 }}>
            {reconnect
              ? 'We’ve detected a previously connected device. Click below to quickly reconnect and resume live sensor data.'
              : 'To begin using the sensor, please connect your Bluetooth device. This is a one-time setup.'}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <Button
              sx={{ width: 260, color: '#fff', mb: 2 }}
              variant="contained"
              color="primary"
              onClick={handleScanDevices}
              disabled={isScanning}
              fullWidth
            >
              {isScanning ? 'Scanning...' : reconnect ? 'Reconnect Sensor' : 'Connect & Read Sensor'}
            </Button>
          </Box>

          {errorMessage && (
            <Typography sx={{ color: 'red', fontSize: 14, mt: 2, textAlign: 'center' }}>
              {errorMessage}
            </Typography>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default ConnectModal;
