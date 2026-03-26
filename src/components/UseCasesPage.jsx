import React from 'react';
import { Box } from '@mui/material';
import { useBle } from '../ble/BleContext';
import UseCases from "./Common/UseCases"
import Hero from './Common/Hero';

const UseCasesPage = () => {
  const { latestData } = useBle();

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', p: 1 }}>
      <Hero />

      {/* Passing only the first 3 sensors by limiting what BreathMoistureLevel renders */}
      <UseCases
        temperature={latestData.temperature}
        humidity={latestData.humidity}
        irTemperature={latestData.irTemperature}
        isUseCaseView={true} // Add a prop to filter cards
      />
    </Box>
  );
};

export default UseCasesPage;
