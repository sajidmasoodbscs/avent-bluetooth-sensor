import { useState } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import ThermostatIcon from '@mui/icons-material/Thermostat';
import OpacityIcon from '@mui/icons-material/Opacity';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import TerrainIcon from '@mui/icons-material/Terrain';
import MicIcon from '@mui/icons-material/Mic';
import SensorsIcon from '@mui/icons-material/Sensors';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from "react-router-dom";
import UseCaseSensorModal from "../Modal/UseCaseSensorModal";

const SensorCard = ({ title, icon: Icon, iconBg, onClick }) => (
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
            <Typography variant="body2" sx={{ color: "#000", fontWeight: 500 }}>
                {title}
            </Typography>
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
        navigate(`/use-cases/${sensorKey}`);
    };

    const handleModalClick = (key) => {
        setModalKey(key);
    };

    return (
        <Box sx={{ width: "100%" }}>
            <Grid container spacing={2} columns={12}>
                <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                    <SensorCard
                        title="Digital Temperature Use Case"
                        icon={ThermostatIcon}
                        iconBg="rgba(156, 39, 176, 0.1)"
                        onClick={() => handleRouteClick('Digital-Temperature-Use-Case')}
                    />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                    <SensorCard
                        title="Digital Presssure Use Case"
                        icon={OpacityIcon}
                        iconBg="rgba(33, 150, 243, 0.1)"
                        onClick={() => handleRouteClick('Digital-Presssure-Use-Case')}
                    />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                    <SensorCard
                        title="Gyroscope Positioning Use Case"
                        icon={ThreeDRotationIcon}
                        iconBg="rgba(255, 152, 0, 0.12)"
                        onClick={() => handleModalClick('gyro')}
                    />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                    <SensorCard
                        title="Pressure Sensor Use Case"
                        icon={TerrainIcon}
                        iconBg="rgba(0, 150, 136, 0.12)"
                        onClick={() => handleModalClick('pressure')}
                    />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                    <SensorCard
                        title="Sound Mic Use Case"
                        icon={MicIcon}
                        iconBg="rgba(233, 30, 99, 0.12)"
                        onClick={() => handleModalClick('mic')}
                    />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
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
                onClose={() => setModalKey(null)}
            />
        </Box>
    );
}
