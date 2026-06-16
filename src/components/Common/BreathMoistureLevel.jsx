import React, { useState } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import ThermostatIcon from '@mui/icons-material/Thermostat';
import OpacityIcon from '@mui/icons-material/Opacity';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import SpeedIcon from '@mui/icons-material/Speed';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import CompressIcon from '@mui/icons-material/Compress';
import AirIcon from '@mui/icons-material/Air';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import SensorDetailsModal from "../Modal/SensorDetailsModal";
import { useNavigate } from "react-router-dom";
import teLogo from '../../assets/sensors/te_logo.png';
import amphenolLogo from '../../assets/sensors/Amphenol.png';
import murataLogo from '../../assets/sensors/Murata_Logo.png';

const SensorCard = ({ title, value, unit, icon: Icon, iconBg, onClick, nested }) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      p: 2,
      backgroundColor: nested ? "#fafafa" : "#fff",
      color: "#000",
      borderRadius: "6px",
      height: "100%",
      width: "100%",
      border: nested ? "1px solid #ececec" : "1px solid #f0f0f0",
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

const SensorModuleGroup = ({ logo, logoAlt, brandLabel, modelCode, children }) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 2, sm: 2.5 },
      height: "100%",
      borderRadius: "6px",
      border: "1px solid #e0e0e0",
      backgroundColor: "#fff",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    }}
  >
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "stretch" },
        gap: { xs: 2, sm: 2.5 },
        minHeight: { sm: 120 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          width: { xs: "100%", sm: 148 },
          py: { xs: 1, sm: 2 },
          px: 1.5,
          borderBottom: { xs: "1px solid #f0f0f0", sm: "none" },
          borderRight: { sm: "1px solid #f0f0f0" },
        }}
      >
        <Box
          component="img"
          src={logo}
          alt={logoAlt}
          sx={{
            height: { xs: 52, sm: 72 },
            width: "auto",
            maxWidth: "100%",
            objectFit: "contain",
            mb: brandLabel ? 0.5 : 1.5,
          }}
        />
        {brandLabel && (
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              fontSize: 15,
              color: "#333",
              textAlign: "center",
              mb: 1,
              lineHeight: 1.2,
            }}
          >
            {brandLabel}
          </Typography>
        )}
        <Typography
          component="span"
          sx={{
            fontFamily: "monospace",
            fontWeight: 700,
            fontSize: modelCode.length > 12 ? 10 : 14,
            letterSpacing: 0.5,
            lineHeight: 1.35,
            textAlign: "center",
            color: "#333",
            backgroundColor: "#f5f5f5",
            border: "1px solid #e0e0e0",
            borderRadius: "6px",
            px: 1.25,
            py: 0.75,
            maxWidth: "100%",
            wordBreak: "break-word",
          }}
        >
          {modelCode}
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 2,
          minWidth: 0,
        }}
      >
        {children}
      </Box>
    </Box>
  </Paper>
);

export default function BreathMoistureLevel({ temperature, humidity, irTemperature, accel, gyro, pressure, baroPressure, pir, isUseCaseView }) {
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
        {!isUseCaseView ? (
          <>
            {/* Module cards — one per row, full width */}
            <Grid item size={{ xs: 12 }}>
              <SensorModuleGroup logo={teLogo} logoAlt="TE Connectivity" modelCode="HTU31D">
                <SensorCard
                  nested
                  title="Temperature"
                  value={temperature ? temperature.toFixed(1) : 0}
                  unit="°C"
                  icon={ThermostatIcon}
                  iconBg="rgba(156, 39, 176, 0.1)"
                  onClick={() => handleCardClick({ sensorName: 'Temperature', sensorKey: 'temperature' })}
                />
                <SensorCard
                  nested
                  title="Humidity"
                  value={humidity ? humidity.toFixed(1) : 0}
                  unit="% RH"
                  icon={OpacityIcon}
                  iconBg="rgba(33, 150, 243, 0.1)"
                  onClick={() => handleCardClick({ sensorName: 'Humidity', sensorKey: 'humidity' })}
                />
              </SensorModuleGroup>
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <SensorModuleGroup
                logo={teLogo}
                logoAlt="TE Connectivity"
                modelCode="MS5849-02BA (20032999-50)"
              >
                <SensorCard
                  nested
                  title="Barometric Pressure"
                  value={baroPressure != null && baroPressure > 1 ? baroPressure.toFixed(1) : '—'}
                  unit="hPa"
                  icon={AirIcon}
                  iconBg="rgba(3, 169, 244, 0.12)"
                  onClick={() => handleCardClick({ sensorName: 'Barometric Pressure', sensorKey: 'baroPressure' })}
                />
              </SensorModuleGroup>
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <SensorModuleGroup
                logo={amphenolLogo}
                logoAlt="Amphenol"
                brandLabel="Amphenol"
                modelCode="ZTPD-2210"
              >
                <SensorCard
                  nested
                  title="IR Temperature"
                  value={irTemperature ? irTemperature.toFixed(1) : 0}
                  unit="°C"
                  icon={DeviceThermostatIcon}
                  iconBg="rgba(255, 152, 0, 0.1)"
                  onClick={() => handleCardClick({ sensorName: 'IR Evaluation', sensorKey: 'irTemperature' })}
                />
              </SensorModuleGroup>
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <SensorModuleGroup
                logo={amphenolLogo}
                logoAlt="Amphenol"
                brandLabel="Amphenol"
                modelCode="NPA-730B-005-D"
              >
                <SensorCard
                  nested
                  title="Pressure"
                  value={pressure != null && pressure > 1 ? pressure.toFixed(1) : '—'}
                  unit="hPa"
                  icon={CompressIcon}
                  iconBg="rgba(0, 188, 212, 0.1)"
                  onClick={() => handleCardClick({ sensorName: 'Pressure Sensor', sensorKey: 'pressure' })}
                />
              </SensorModuleGroup>
            </Grid>

            <Grid item size={{ xs: 12 }}>
              <SensorModuleGroup
                logo={murataLogo}
                logoAlt="Murata"
                modelCode="SCH16T-K01-004"
              >
                <SensorCard
                  nested
                  title="IMU Accelerometer"
                  value={accel ? accel[0].toFixed(2) : 0}
                  unit="m/s²"
                  icon={SpeedIcon}
                  iconBg="rgba(76, 175, 80, 0.1)"
                  onClick={() => handleCardClick({ sensorName: 'IMU Accelerometer', sensorKey: 'imuAccel' })}
                />
                <SensorCard
                  nested
                  title="IMU Gyroscope"
                  value={gyro ? gyro[0].toFixed(2) : 0}
                  unit="°/s"
                  icon={RotateRightIcon}
                  iconBg="rgba(244, 67, 54, 0.1)"
                  onClick={() => handleCardClick({ sensorName: 'IMU Gyroscope', sensorKey: 'imuGyro' })}
                />
              </SensorModuleGroup>
            </Grid>

            <Grid item size={{ xs: 12 }}>
              <SensorModuleGroup
                logo={murataLogo}
                logoAlt="Murata"
                modelCode="IRS-D200ST00R1"
              >
                <SensorCard
                  nested
                  title="PIR"
                  value={pir !== undefined ? pir.toFixed(1) : 500}
                  unit="lux"
                  icon={pir > 100 ? LightbulbIcon : LightbulbOutlinedIcon}
                  iconBg={pir > 100 ? "rgba(255, 193, 7, 0.2)" : "rgba(0, 0, 0, 0.05)"}
                  onClick={() => handleCardClick({ sensorName: 'Pir Sensor', sensorKey: 'Pir' })}
                />
              </SensorModuleGroup>
            </Grid>
          </>
        ) : (
          <>
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
