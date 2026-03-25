import * as React from 'react';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import BreathMoistureLevel from './Common/BreathMoistureLevel';
import ConnectModal from './Modal/ConnectModal'




export default function HomePage() {
  const [sensorData, setSensorData] = useState({});
console.log("sensorData",sensorData)
  

  return (
    <>
    <Box sx={{ flexGrow: 1 }}>
       {/* <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 12 }}>
            <BleDeviceScanner onSensorData={setSensorData}/>
        </Grid>
       </Grid> */}
      <Grid container spacing={2}>
        {/* <Grid size={{ xs: 12, md: 6 }}>
            <SplineAreaChart title="Temperature" />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
        <SplineAreaChart title="Humidity" />
        </Grid> */}
      
        <Grid size={{ xs: 12, md: 12 }}>
            <BreathMoistureLevel temperature={sensorData.temperature} humidity={sensorData.humidity} irTemperature={sensorData.irTemperature} accel={sensorData.accel} gyro={sensorData.gyro} pressure={sensorData.pressure}/>
        </Grid>
        
      </Grid>
    </Box>
    <ConnectModal onSensorData={setSensorData}/>
    </>
  );
}


