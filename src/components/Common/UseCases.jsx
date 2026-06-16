import { useState } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import ThermostatIcon from '@mui/icons-material/Thermostat';
import OpacityIcon from '@mui/icons-material/Opacity';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import TerrainIcon from '@mui/icons-material/Terrain';
import MicIcon from '@mui/icons-material/Mic';
import SensorsIcon from '@mui/icons-material/Sensors';
import PersonIcon from '@mui/icons-material/Person';
import ScreenRotationIcon from '@mui/icons-material/ScreenRotation';
import VibrationIcon from '@mui/icons-material/Vibration';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from "react-router-dom";
import UseCaseSensorModal from "../Modal/UseCaseSensorModal";
import teLogo from '../../assets/sensors/te_logo.png';
import amphenolLogo from '../../assets/sensors/Amphenol.png';
import murataLogo from '../../assets/sensors/Murata_Logo.png';

/** Legacy use case cards — kept in code, hidden from the grid */
const SHOW_LEGACY_USE_CASES = false;

const ModelCodeBadge = ({ modelCode }) => (
    <Typography
        component="span"
        sx={{
            fontFamily: "monospace",
            fontWeight: 700,
            fontSize: modelCode.length > 12 ? 10 : 12,
            letterSpacing: 0.5,
            lineHeight: 1.35,
            color: "#333",
            backgroundColor: "#f5f5f5",
            border: "1px solid #e0e0e0",
            borderRadius: "6px",
            px: 1,
            py: 0.5,
            alignSelf: "flex-start",
            mt: 0.75,
            wordBreak: "break-word",
        }}
    >
        {modelCode}
    </Typography>
);

const UseCaseModuleGroup = ({ logo, logoAlt, brandLabel, children }) => (
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
                            mt: 0.5,
                            lineHeight: 1.2,
                        }}
                    >
                        {brandLabel}
                    </Typography>
                )}
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

const SensorCard = ({ title, icon: Icon, iconBg, onClick, nested, modelCode }) => (
    <Paper
        elevation={0}
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
        onClick={onClick}
    >
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
            <Icon sx={{ color: iconBg ? "rgba(0,0,0,0.5)" : "#53ba64", fontSize: 28 }} />
        </Box>

        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
            <Typography variant="body2" sx={{ color: "#000", fontWeight: 500, lineHeight: 1.45, whiteSpace: "normal" }}>
                {title}
            </Typography>
            {modelCode && <ModelCodeBadge modelCode={modelCode} />}
        </Box>

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

export default function UseCases() {
    const navigate = useNavigate();
    const [modalKey, setModalKey] = useState(null);

    const handleRouteClick = (sensorKey) => {
        console.log('[Use case] navigate', { sensorKey, path: `/use-cases/${sensorKey}` });
        navigate(`/use-cases/${sensorKey}`);
    };

    const handleModalClick = (key) => {
        console.log('[Use case] open modal', { useCaseKey: key });
        setModalKey(key);
    };

    const handleModalClose = () => {
        console.log('[Use case] close modal', { useCaseKey: modalKey });
        setModalKey(null);
    };

    return (
        <Box sx={{ width: "100%" }}>
            <Grid container spacing={2} columns={12}>
                <Grid item size={{ xs: 12 }}>
                    <UseCaseModuleGroup logo={teLogo} logoAlt="TE Connectivity">
                        <SensorCard
                            nested
                            title="Temperature (°C) & Relative Humidity (%RH)"
                            modelCode="HTU31D"
                            icon={WaterDropIcon}
                            iconBg="rgba(33, 150, 243, 0.15)"
                            onClick={() => handleModalClick('breath')}
                        />
                    </UseCaseModuleGroup>
                </Grid>
                <Grid item size={{ xs: 12 }}>
                    <UseCaseModuleGroup logo={teLogo} logoAlt="TE Connectivity">
                        <SensorCard
                            nested
                            title="Altitude / Depth Change Indicator (Altimeter)"
                            modelCode="MS5849-02BA (20032999-50)"
                            icon={TerrainIcon}
                            iconBg="rgba(0, 150, 136, 0.12)"
                            onClick={() => handleModalClick('pressure')}
                        />
                    </UseCaseModuleGroup>
                </Grid>
                <Grid item size={{ xs: 12 }}>
                    <UseCaseModuleGroup logo={amphenolLogo} logoAlt="Amphenol" brandLabel="Amphenol">
                        <SensorCard
                            nested
                            title="Touchless Surface Temperature Measurement"
                            modelCode="ZTPD-2210"
                            icon={ThermostatIcon}
                            iconBg="rgba(156, 39, 176, 0.1)"
                            onClick={() => handleRouteClick('Digital-Temperature-Use-Case')}
                        />
                    </UseCaseModuleGroup>
                </Grid>
                <Grid item size={{ xs: 12 }}>
                    <UseCaseModuleGroup logo={amphenolLogo} logoAlt="Amphenol" brandLabel="Amphenol">
                        <SensorCard
                            nested
                            title="Syringe and tube"
                            modelCode="NPA-730B-005-D"
                            icon={MedicalServicesIcon}
                            iconBg="rgba(156, 39, 176, 0.12)"
                            onClick={() => handleModalClick('syringe')}
                        />
                    </UseCaseModuleGroup>
                </Grid>
                <Grid item size={{ xs: 12 }}>
                    <UseCaseModuleGroup logo={murataLogo} logoAlt="Murata">
                        <SensorCard
                            nested
                            title="Gyroscope Positioning Use Case"
                            modelCode="SCH16T-K01-004"
                            icon={ThreeDRotationIcon}
                            iconBg="rgba(255, 152, 0, 0.12)"
                            onClick={() => handleModalClick('gyro')}
                        />
                        <SensorCard
                            nested
                            title="Real-Time Tilt & Stability Monitoring System"
                            modelCode="SCH16T-K01-004"
                            icon={ScreenRotationIcon}
                            iconBg="rgba(63, 81, 181, 0.12)"
                            onClick={() => handleModalClick('tilt')}
                        />
                        <SensorCard
                            nested
                            title="Smart Motion & Tamper Detection System"
                            modelCode="SCH16T-K01-004"
                            icon={VibrationIcon}
                            iconBg="rgba(255, 87, 34, 0.12)"
                            onClick={() => handleModalClick('motion')}
                        />
                    </UseCaseModuleGroup>
                </Grid>
                <Grid item size={{ xs: 12 }}>
                    <UseCaseModuleGroup logo={murataLogo} logoAlt="Murata">
                        <SensorCard
                            nested
                            title="Intelligent Occupancy Detection for Energy Management Systems (HVAC, Lighting)"
                            modelCode="IRS-D200ST00R1"
                            icon={PersonIcon}
                            iconBg="rgba(76, 175, 80, 0.15)"
                            onClick={() => handleModalClick('occupancy')}
                        />
                    </UseCaseModuleGroup>
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 4 }} sx={{ display: SHOW_LEGACY_USE_CASES ? undefined : 'none' }}>
                    <SensorCard
                        title="Digital Presssure Use Case"
                        icon={OpacityIcon}
                        iconBg="rgba(33, 150, 243, 0.1)"
                        onClick={() => handleRouteClick('Digital-Presssure-Use-Case')}
                    />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 4 }} sx={{ display: SHOW_LEGACY_USE_CASES ? undefined : 'none' }}>
                    <SensorCard
                        title="Sound-Triggered Control (Clap to Activate)"
                        icon={MicIcon}
                        iconBg="rgba(233, 30, 99, 0.12)"
                        onClick={() => handleModalClick('mic')}
                    />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 4 }} sx={{ display: SHOW_LEGACY_USE_CASES ? undefined : 'none' }}>
                    <SensorCard
                        title="PIR Sensor Use Case"
                        icon={SensorsIcon}
                        iconBg="rgba(255, 152, 0, 0.15)"
                        onClick={() => handleModalClick('pir')}
                    />
                </Grid>
            </Grid>

            <UseCaseSensorModal
                open={Boolean(modalKey)}
                useCaseKey={modalKey}
                onClose={handleModalClose}
            />
        </Box>
    );
}
