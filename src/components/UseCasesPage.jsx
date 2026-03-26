import React from 'react';
import { Box, Typography } from '@mui/material';
import { useBle } from '../ble/BleContext';
import BreathMoistureLevel from './Common/BreathMoistureLevel';
import Hero from './Common/Hero';

const UseCasesPage = () => {
  const { latestData } = useBle();

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', p: 1 }}>
      <Hero/>

      {/* Passing only the first 3 sensors by limiting what BreathMoistureLevel renders */}
      <BreathMoistureLevel 
        temperature={latestData.temperature} 
        humidity={latestData.humidity} 
        irTemperature={latestData.irTemperature}
        isUseCaseView={true} // Add a prop to filter cards
      />
    </Box>
  );
};

export default UseCasesPage;
