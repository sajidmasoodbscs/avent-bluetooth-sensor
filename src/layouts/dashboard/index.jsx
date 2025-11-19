import React, { useState } from "react";
import Box from "@mui/material/Box";
import MenuAppBar from "../../components/HeaderBar";
import Sidebar from "../../components/Sidebar";
import HomePage from "../../components/HomePage";

const SIDEBAR_WIDTH = 240;

const DashboardLayout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          p: 3,
        //   transition: "margin 0.3s",
        //   ml: drawerOpen ? `${SIDEBAR_WIDTH}px` : 0,
        //   width: drawerOpen ? `calc(100% - ${SIDEBAR_WIDTH}px)` : "100%",
        }}
      >
        {/* Spacer for AppBar */}
        <Box sx={{ height: "64px" }} />
        <HomePage />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
