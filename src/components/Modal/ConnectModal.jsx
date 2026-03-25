import React, { useState, useEffect, useRef } from 'react';
import { Box, Modal, Typography, Button } from "@mui/material";
import { useBle } from '../../ble/BleContext';
import { appendSensorPoint } from '../../utils/storage';

const ConnectModal = ({ onSensorData }) => {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [reconnect, setReconnect] = useState(false);
  const [server, setServer] = useState(null);
  const pollingTimeoutRef = useRef(null);
  const ble = useBle();

  const SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
  const TX_CHARACTERISTIC_UUID = '12345678-1234-1234-1234-123456789abd';
  const RX_CHARACTERISTIC_UUID = '12345678-1234-1234-1234-123456789abe';

  useEffect(() => {
    const isConnectedBefore = localStorage.getItem('bleConnected') === 'true';
    setReconnect(isConnectedBefore);
    setOpen(true); // Show modal on load
  }, []);

  const handleClose = () => setOpen(false);

  const handleScanDevices = async () => {
    setErrorMessage('');
    setIsScanning(true);

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [SERVICE_UUID],
      });

      const connectedServer = await device.gatt.connect();
      setServer(connectedServer);
      localStorage.setItem('bleConnected', 'true');

      await startDataStream(connectedServer);
    } catch (error) {
      console.error('BLE Error:', error);
      localStorage.removeItem('bleConnected');
      setErrorMessage(error.message || 'Bluetooth connection failed');
    } finally {
      setIsScanning(false);
    }
  };

  const startDataStream = async (server) => {
    try {
      const service = await server.getPrimaryService(SERVICE_UUID);
      const txCharacteristic = await service.getCharacteristic(TX_CHARACTERISTIC_UUID);
      const rxCharacteristic = await service.getCharacteristic(RX_CHARACTERISTIC_UUID);

      // expose into BLE context
      ble.setConnection({ server, service, tx: txCharacteristic, rx: rxCharacteristic });

      const cmd = new TextEncoder().encode('GET:ALL');
      if (server) {
        console.log(server);
      }
      let consecutiveErrors = 0;
      const pollData = async () => {
        if (!server.connected) return;

        try {
          // Skip global polling if a sensor modal is actively polling specific GET commands
          if (ble.activeSensorKey) {
            pollingTimeoutRef.current = setTimeout(pollData, 500);
            return;
          }
          await ble.withGattLock(async () => {
            await txCharacteristic.writeValue(cmd);
            await new Promise(resolve => setTimeout(resolve, 300));
            const value = await rxCharacteristic.readValue();
            handleNotification({ target: value });
          });
          consecutiveErrors = 0; // Reset error count on success
          pollingTimeoutRef.current = setTimeout(pollData, 500); // Keep polling
        } catch (error) {
          console.error('Polling error:', error);
          consecutiveErrors++;
          
          // Check if it's a Linux/Ubuntu specific error
          const isLinuxError = error.name === 'NotSupportedError' || 
                              error.message?.includes('GATT operation failed') ||
                              error.message?.includes('unknown reason');
          
          if (isLinuxError && consecutiveErrors < 3) {
            // For Linux, try with longer delays and different approach
            console.log(`[Linux] Retrying after error (attempt ${consecutiveErrors}/3)...`);
            pollingTimeoutRef.current = setTimeout(pollData, 1000 + (consecutiveErrors * 500));
            return;
          }
          
          // Only prompt reconnect if actually disconnected or too many errors
          try {
            if (!server.connected || consecutiveErrors >= 5) {
              if (isLinuxError) {
                setErrorMessage('Bluetooth error on Linux. Try: 1) Chrome flags: chrome://flags/#enable-experimental-web-platform-features 2) Run Chrome with: --enable-features=WebBluetooth');
              } else {
                setErrorMessage('Device disconnected or powered off. Please reconnect your sensor.');
              }
              localStorage.removeItem('bleConnected');
              setOpen(true);
              return;
            }
          } catch (_) {
            // fallthrough
          }
          // Otherwise, retry after a short delay without showing modal
          pollingTimeoutRef.current = setTimeout(pollData, 800);
        }
      };

      pollData(); // Start polling
    } catch (err) {
      console.error('startDataStream error:', err);
      setErrorMessage('Failed to start data stream. Please try again.');
    }
  };

  const handleNotification = (event) => {
    const buffer = new DataView(event.target.buffer || event.target.value.buffer);
    let offset = 0;
    const parsedData = {};

    while (offset < buffer.byteLength) {
      const type = buffer.getUint8(offset);
      const length = buffer.getUint8(offset + 1);
      const valueBytes = new DataView(buffer.buffer, offset + 2, length);
      const floatValue = valueBytes.getFloat32(0, true);
      offset += 2 + length;

      switch (type) {
        case 0x01:
          parsedData.temperature = floatValue;
          appendSensorPoint('temperature', floatValue);
          break;
        case 0x02:
          parsedData.humidity = floatValue;
          appendSensorPoint('humidity', floatValue);
          break;
        case 0x03:
          parsedData.irTemperature = floatValue;
          appendSensorPoint('irTemperature', floatValue);
          break;
        case 0x04:
          parsedData.accel = [...(parsedData.accel || []), floatValue];
          appendSensorPoint('imuAccel', floatValue);
          break;
        case 0x05:
          parsedData.pressure = floatValue;
          appendSensorPoint('pressure', floatValue);
          break;
        case 0x06:
          parsedData.gyro = [...(parsedData.gyro || []), floatValue];
          appendSensorPoint('imuGyro', floatValue);
          break;
        default:
          break;
      }
    }

    if (Object.keys(parsedData).length > 0) {
      ble.setLatestData(parsedData);
    }
    if (onSensorData) onSensorData(parsedData);
    setOpen(false); // Close modal once connected and receiving data
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
