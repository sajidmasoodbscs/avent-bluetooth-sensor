import React, { useState } from 'react';
import { Box, Typography, Button } from "@mui/material";
import {
  BLE_SERVICE_UUID,
  BLE_TX_UUID,
  BLE_RX_UUID,
  BLE_ALERT_UUID,
  GET_COMMANDS,
  parseTLV,
  tlvItemsToSensorData,
  parseAlertNotification,
} from '../../utils/bleProtocol';

const BleDeviceScanner = ({ onSensorData, onAlert }) => {
  const [errorMessage, setErrorMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleScanDevices = async () => {
    setErrorMessage('');
    setIsScanning(true);

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [BLE_SERVICE_UUID] }],
        optionalServices: [BLE_SERVICE_UUID],
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(BLE_SERVICE_UUID);
      const txCharacteristic = await service.getCharacteristic(BLE_TX_UUID);
      const rxCharacteristic = await service.getCharacteristic(BLE_RX_UUID);
      const alertCharacteristic = await service.getCharacteristic(BLE_ALERT_UUID);

      await alertCharacteristic.startNotifications();
      alertCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
        const alert = parseAlertNotification(event.target.value);
        if (alert && onAlert) onAlert(alert);
      });

      const cmd = new TextEncoder().encode(GET_COMMANDS.ALL);
      await txCharacteristic.writeValue(cmd);
      setTimeout(async () => {
        const value = await rxCharacteristic.readValue();
        const items = parseTLV(value);
        const parsedData = tlvItemsToSensorData(items);
        if (onSensorData) onSensorData(parsedData);
      }, 300);
    } catch (error) {
      console.error('BLE Error:', error);
      setErrorMessage(error.message || 'Bluetooth connection failed');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, width: "100%" }}>
      <Typography variant="h2">BLE Sensor Reader</Typography>
      <Button variant="contained" color="primary" onClick={handleScanDevices} disabled={isScanning}>
        {isScanning ? 'Scanning...' : 'Connect & Read Sensor'}
      </Button>

      {errorMessage && <Typography sx={{ color: 'red', fontSize: 12 }}>{errorMessage}</Typography>}
    </Box>
  );
};

export default BleDeviceScanner;
