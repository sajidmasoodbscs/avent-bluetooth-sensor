import React from 'react';
import { Box } from '@mui/material';
import UseCases from "./Common/UseCases"
import Hero from './Common/Hero';

const UseCasesPage = () => {
  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', p: 1 }}>
      <Hero />

      {/* Passing only the first 3 sensors by limiting what BreathMoistureLevel renders */}
      <UseCases />
    </Box>
  );
};

export default UseCasesPage;
