import React from 'react';
import { Box, Typography } from '@mui/material';
import { useBle } from '../ble/BleContext';
import BreathMoistureLevel from './Common/BreathMoistureLevel';

const UseCasesPage = () => {
  const { latestData } = useBle();

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', p: 1 }}>
      <Box
        sx={{
          backgroundColor: "#53ba64",
          borderRadius: "24px",
          p: { xs: 3, md: 4 },
          mb: 4,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          minHeight: "220px",
          boxShadow: "0 10px 40px rgba(83, 186, 100, 0.2)"
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: "bold", mb: 1 }}>
            Use Cases
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: "normal" }}>
            Explore specific sensor applications and analytics.
          </Typography>
        </Box>
        <Typography 
          sx={{ 
            position: "absolute", 
            right: -20, 
            bottom: -40, 
            fontSize: "250px", 
            fontWeight: "900", 
            color: "rgba(255,255,255,0.15)", 
            userSelect: "none",
            lineHeight: 1,
            zIndex: 0
          }}
        >
          U
        </Typography>
      </Box>

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
