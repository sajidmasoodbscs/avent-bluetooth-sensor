import * as React from 'react';
import Box from '@mui/material/Box';
import BreathMoistureLevel from './Common/BreathMoistureLevel';
import Hero from './Common/Hero';
import AlertsStatusBar from './Common/AlertsStatusBar';
import { useBle } from '../ble/BleContext';

export default function HomePage() {
  const { latestData } = useBle();

  return (
    <>
      <Box sx={{ maxWidth: '1400px', mx: 'auto', p: 1 }}>
        <Hero />
        <AlertsStatusBar />
        <BreathMoistureLevel
          temperature={latestData.temperature}
          humidity={latestData.humidity}
          irTemperature={latestData.irTemperature}
          accel={latestData.accel}
          gyro={latestData.gyro}
          pressure={latestData.pressure}
          baroPressure={latestData.baroPressure}
          pir={latestData.pir}
        />
      </Box>
    </>
  );
}
