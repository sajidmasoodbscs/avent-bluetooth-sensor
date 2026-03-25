import React, { useState } from "react";
import Box from "@mui/material/Box";
import MenuAppBar from "../../components/HeaderBar";
import Sidebar from "../../components/Sidebar";
import { Outlet } from "react-router-dom";
import ConnectModal from "../../components/Modal/ConnectModal";
import { useBle } from "../../ble/BleContext";

const DashboardLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { setLatestData } = useBle();

  return (
    <Box sx={{ display: "flex" }}>
      {/* Top Navigation Bar */}
      <MenuAppBar drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />

      {/* Left Sidebar */}
      <Sidebar drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 1,
        }}
      >
        {/* Spacer for AppBar */}
        <Box sx={{ height: "64px" }} />
        <Outlet />
      </Box>

      {/* Global Connection Modal */}
      <ConnectModal onSensorData={setLatestData} />
    </Box>
  );
};

export default DashboardLayout;
