import React from "react";
import { Box, Grid, Paper, Typography, Container } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

const data = {
  reading1: 65,
  reading2: 72,
  levelChange: 7, // positive = increase, negative = decrease
};

export default function BreathMoistureLevel({temperature,humidity,irTemperature,accel,gyro,pressure}) {
  const isIncrease = data.levelChange >= 0;

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
          >
            <Typography variant="h5">IMU Accelerometer </Typography>
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
          >
            <Typography variant="h5">Pressure</Typography>
            <Typography variant="h4">{pressure?pressure:0}hPa</Typography>
          </Paper>
        </Grid>
      </Grid>

    </Box>
  );
}
