import React, { useState } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import ThermostatIcon from '@mui/icons-material/Thermostat';
import OpacityIcon from '@mui/icons-material/Opacity';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import SpeedIcon from '@mui/icons-material/Speed';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import CompressIcon from '@mui/icons-material/Compress';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import SensorDetailsModal from "../Modal/SensorDetailsModal";
import { useNavigate } from "react-router-dom";

const SensorCard = ({ title, value, unit, icon: Icon, iconBg, onClick }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      backgroundColor: "#fff",
      color: "#000",
      borderRadius: "6px",
      height: "100%",
      width: "100%",
      border: "1px solid #f0f0f0",
      transition: "all 0.3s ease",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 2,
      "&:hover": {
        boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
        transform: "translateY(-4px)",
        borderColor: "#53ba64",
      },
    }}
    onClick={onClick}
  >
    {/* Left: Icon Box */}
    <Box
      sx={{
        backgroundColor: iconBg || "rgba(83, 186, 100, 0.1)",
        p: 1.5,
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "56px",
        height: "56px"
      }}
    >
      <Icon sx={{ color: iconBg?.includes('255, 193, 7') ? "#ffc107" : (iconBg ? "rgba(0,0,0,0.5)" : "#53ba64"), fontSize: 28 }} />
    </Box>

    {/* Middle: Value & Label Stack */}
    <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ color: "#888", fontWeight: "bold" }}>
          {unit}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: "#999", fontWeight: 500 }}>
        {title}
      </Typography>
    </Box>

    {/* Right: Chevron Box */}
    <Box
      sx={{
        backgroundColor: "#f5f5f5",
        p: 0.5,
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <ChevronRightIcon sx={{ color: "#808080", fontSize: 20 }} />
    </Box>
  </Paper>
);

export default function BreathMoistureLevel({ temperature, humidity, irTemperature, accel, gyro, pressure, pir, isUseCaseView }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ companyName: 'Nordic Sensor', sensorName: '', sensorKey: 'all', extraValues: null });
  const navigate = useNavigate();

  const handleCardClick = (config) => {
    if (isUseCaseView) {
      navigate(`/use-cases/${config.sensorKey}`);
    } else {
      setModalConfig({ companyName: 'Test Assembly Sensor', ...config });
      setModalOpen(true);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={2} columns={12}>
        <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
          <SensorCard
            title="Temperature"
            value={temperature ? temperature.toFixed(1) : 0}
            unit="°C"
            icon={ThermostatIcon}
            iconBg="rgba(156, 39, 176, 0.1)"
            onClick={() => handleCardClick({ sensorName: 'Temperature', sensorKey: 'temperature' })}
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
          <SensorCard
            title="Humidity"
            value={humidity ? humidity.toFixed(1) : 0}
            unit="% RH"
            icon={OpacityIcon}
            iconBg="rgba(33, 150, 243, 0.1)"
            onClick={() => handleCardClick({ sensorName: 'Humidity', sensorKey: 'humidity' })}
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
          <SensorCard
            title="IR Temperature"
            value={irTemperature ? irTemperature.toFixed(1) : 0}
            unit="°C"
            icon={DeviceThermostatIcon}
            iconBg="rgba(255, 152, 0, 0.1)"
            onClick={() => handleCardClick({ sensorName: 'IR Evaluation', sensorKey: 'irTemperature' })}
          />
        </Grid>

        {!isUseCaseView && (
          <>
            <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
              <SensorCard
                title="IMU Accelerometer"
                value={accel ? accel[0].toFixed(2) : 0}
                unit="m/s²"
                icon={SpeedIcon}
                iconBg="rgba(76, 175, 80, 0.1)"
                onClick={() => handleCardClick({ sensorName: 'IMU Accelerometer', sensorKey: 'imuAccel' })}
              />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
              <SensorCard
                title="Gyroscope"
                value={gyro ? gyro[0].toFixed(2) : 0}
                unit="°/s"
                icon={RotateRightIcon}
                iconBg="rgba(244, 67, 54, 0.1)"
                onClick={() => handleCardClick({ sensorName: 'IMU Gyroscope', sensorKey: 'imuGyro' })}
              />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
              <SensorCard
                title="Pressure"
                value={pressure ? pressure.toFixed(1) : 0}
                unit="hPa"
                icon={CompressIcon}
                iconBg="rgba(0, 188, 212, 0.1)"
                onClick={() => handleCardClick({ sensorName: 'Pressure Sensor', sensorKey: 'pressure' })}
              />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
              <SensorCard
                title="Pir"
                value={pir !== undefined ? pir.toFixed(1) : 500}
                unit="lux"
                icon={pir > 100 ? LightbulbIcon : LightbulbOutlinedIcon}
                iconBg={pir > 100 ? "rgba(255, 193, 7, 0.2)" : "rgba(0, 0, 0, 0.05)"}
                onClick={() => handleCardClick({ sensorName: 'Pir Sensor', sensorKey: 'Pir' })}
              />
            </Grid>
          </>
        )}
      </Grid>

      <SensorDetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        companyName={modalConfig.companyName}
        sensorName={modalConfig.sensorName}
        sensorKey={modalConfig.sensorKey}
        extraValues={modalConfig.extraValues}
      />
    </Box>
  );
}
