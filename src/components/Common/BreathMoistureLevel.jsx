import React, { useState } from "react";
import { Box, Grid, Paper, Typography, Container } from "@mui/material";
import SensorDetailsModal from "../Modal/SensorDetailsModal";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

const data = {
  reading1: 65,
  reading2: 72,
  levelChange: 7, // positive = increase, negative = decrease
};

export default function BreathMoistureLevel({temperature,humidity,irTemperature,accel,gyro,pressure}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ companyName: 'Nordic Sensor', sensorName: '', sensorKey: 'all', extraValues: null });
  const isIncrease = data.levelChange >= 0;

  const openModal = (config) => {
    setModalConfig({ companyName: 'Test Assembly Sensor', ...config });
    setModalOpen(true);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, width: "100%" }}>
      <Typography variant="h6" gutterBottom>
        Today Breath Moisture Level
      </Typography>

      <Grid container spacing={2}>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              backgroundColor: "#53ba64",
              color: "#fff",
              textAlign: "center",
              borderRadius: 2,
              height: "100%",
              width:"100%"
            }}
          onClick={() => openModal({ sensorName: 'Temperature', sensorKey: 'temperature' })}
          >
            <Typography variant="h5">Temprature</Typography>
            <Typography variant="h4">{temperature?temperature:0}°C</Typography>
          </Paper>
        </Grid>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              backgroundColor: "#53ba64",
              color: "#fff",
              textAlign: "center",
              borderRadius: 2,
              height: "100%",
              width:"100%"
            }}
            onClick={() => openModal({ sensorName: 'Humidity', sensorKey: 'humidity' })}
          >
            <Typography variant="h5">Humidity</Typography>
            <Typography variant="h4">{humidity?humidity:0}% RH</Typography>
          </Paper>
        </Grid>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              backgroundColor: "#53ba64",
              color: "#fff",
              textAlign: "center",
              borderRadius: 2,
              height: "100%",
            }}
            onClick={() => openModal({ sensorName: 'IR Evaluation', sensorKey: 'irTemperature' })}
          >
            <Typography variant="h5">IR Temperature</Typography>
            <Typography variant="h4">{irTemperature?irTemperature:0}°C</Typography>
          </Paper>
        </Grid>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              backgroundColor: "#53ba64",
              color: "#fff",
              textAlign: "center",
              borderRadius: 2,
              height: "100%",
            }}
            onClick={() => openModal({ sensorName: 'IMU Accelerometer', sensorKey: 'imuAccel' })}
          >
            <Typography variant="h5">IMU Accelerometer </Typography>
            <Typography variant="h4">{accel?accel.join(', '):0} m/s²</Typography>
          </Paper>
        </Grid>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              backgroundColor: "#53ba64",
              color: "#fff",
              textAlign: "center",
              borderRadius: 2,
              height: "100%",
            }}
            onClick={() => openModal({ sensorName: 'IMU Gyroscope', sensorKey: 'imuGyro' })}
          >
            <Typography variant="h5">Gyroscope </Typography>
            <Typography variant="h4">{gyro?gyro.join(', '):0} °/s</Typography>
          </Paper>
        </Grid>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              backgroundColor: "#53ba64",
              color: "#fff",
              textAlign: "center",
              borderRadius: 2,
              height: "100%",
              width:"100%"
            }}
            onClick={() => openModal({ sensorName: 'Pressure Sensor', sensorKey: 'pressure' })}
          >
            <Typography variant="h5">Pressure</Typography>
            <Typography variant="h4">{pressure?pressure:0}hPa</Typography>
          </Paper>
        </Grid>
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
