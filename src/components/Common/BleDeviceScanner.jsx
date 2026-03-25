import React, { useState } from 'react';
import { Box, Typography, Button } from "@mui/material";

const BleDeviceScanner = ({ onSensorData }) => {
  // const [sensorData, setSensorData] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
  const TX_CHARACTERISTIC_UUID = '12345678-1234-1234-1234-123456789abd';
  const RX_CHARACTERISTIC_UUID = '12345678-1234-1234-1234-123456789abe';

  const handleScanDevices = async () => {
    setErrorMessage('');
    // setSensorData({});
    setIsScanning(true);

    try {

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [SERVICE_UUID],
      });


      console.log("device",device)
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      console.log("service",service)

      const txCharacteristic = await service.getCharacteristic(TX_CHARACTERISTIC_UUID);
      console.log('TX supports:', txCharacteristic.properties);

      const rxCharacteristic = await service.getCharacteristic(RX_CHARACTERISTIC_UUID);
      console.log('RX supports:', rxCharacteristic.properties);


     // Send command to get all sensor data
const cmd = new TextEncoder().encode('GET:ALL');
await txCharacteristic.writeValue(cmd);

// Wait a bit for the sensor to prepare the response
setTimeout(async () => {
  const value = await rxCharacteristic.readValue();
  handleNotification({ target: value }); // simulate notification event
}, 300); // 300ms delay (adjust if needed)

    } catch (error) {
      console.error('BLE Error:', error);
      setErrorMessage(error.message || 'Bluetooth connection failed');
    } finally {
      setIsScanning(false);
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
          break;
        case 0x02:
          parsedData.humidity = floatValue;
          break;
        case 0x03:
          parsedData.irTemperature = floatValue;
          break;
        case 0x04:
          parsedData.accel = [...(parsedData.accel || []), floatValue];
          break;
        case 0x05:
          parsedData.pressure = floatValue;
          break;
        case 0x06:
          parsedData.gyro = [...(parsedData.gyro || []), floatValue];
          break;
        default:
          break;
      }
    }
  
    if (onSensorData) onSensorData(parsedData);
  };
  
  

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, width: "100%" }}>
      <Typography variant="h2">BLE Sensor Reader</Typography>
      <Button variant="contained" color="primary" onClick={handleScanDevices} disabled={isScanning}>
      {isScanning ? 'Scanning...' : 'Connect & Read Sensor'}
      </Button>
     

      {errorMessage && <Typography sx={{ color: 'red',fontSize:12 }}>{errorMessage}</Typography>}

      {/* {Object.keys(sensorData).length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <p><strong>Temperature:</strong> {sensorData.temperature} °C</p>
          <p><strong>Humidity:</strong> {sensorData.humidity} %</p>
          <p><strong>IR Temperature:</strong> {sensorData.irTemperature} °C</p>
          <p><strong>Pressure:</strong> {sensorData.pressure} hPa</p>
          <p><strong>Accelerometer:</strong> {sensorData.accel?.join(', ')} m/s²</p>
          <p><strong>Gyroscope:</strong> {sensorData.gyro?.join(', ')} °/s</p>
        </div>
      )} */}
    </Box>
  );
};

export default BleDeviceScanner;
