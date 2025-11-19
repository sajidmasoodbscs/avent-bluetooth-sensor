import * as React from 'react';
import { styled } from '@mui/material/styles';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import SplineAreaChart from './Common/SplineAreaChart';
import BreathMoistureLevel from './Common/BreathMoistureLevel';
import BleDeviceScanner from './Common/BleDeviceScanner';
import ConnectModal from './Modal/ConnectModal'


const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: (theme.vars ?? theme).palette.text.secondary,
  ...theme.applyStyles('dark', {
    backgroundColor: '#1A2027',
  }),
}));

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


