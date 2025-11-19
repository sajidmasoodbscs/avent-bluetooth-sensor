import React from "react";
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from '@mui/icons-material/Settings';
import logo from "../assets/images/avnet_abacus.svg";

const drawerWidth = 240;

export default function Sidebar({ drawerOpen, setDrawerOpen }) {
  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={drawerOpen}
      sx={{
        width: drawerOpen ? drawerWidth : 0,
        flexShrink: 0,
        transition: "width 0.3s",
        "& .MuiDrawer-paper": {
          width: drawerOpen ? drawerWidth : 0,
          transition: "width 0.3s",
          overflowX: "hidden",
          boxSizing: "border-box",
          backgroundColor: "#ea8301",
          color: "#fff",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 64,
          p: 2,
        }}
      >
        <img src={logo} alt="Logo" style={{ maxWidth: "100%", maxHeight: "40px" }} />
      </Box>

      <Box sx={{ overflow: "auto" }}>
        <List>
          <ListItem button sx={{ cursor: "pointer" }}>
            <ListItemIcon>
              <DashboardIcon sx={{ color: "#fff" }} />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
          <ListItem button sx={{ cursor: "pointer" }}>
            <ListItemIcon>
              <SearchIcon sx={{ color: "#fff" }} />
            </ListItemIcon>
            <ListItemText primary="Explore" />
          </ListItem>
          <ListItem button sx={{ cursor: "pointer" }}>
            <ListItemIcon>
              <CalendarTodayIcon sx={{ color: "#fff" }} />
            </ListItemIcon>
            <ListItemText primary="Schedule" />
          </ListItem>
          <ListItem button sx={{ cursor: "pointer" }}>
            <ListItemIcon>
              <SettingsIcon sx={{ color: "#fff" }} />
            </ListItemIcon>
            <ListItemText primary="Setting" />
          </ListItem>
        </List>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.3)" }} />
        <List>
          <ListItem button sx={{ cursor: "pointer" }} onClick={() => setDrawerOpen(false)}>
            <ListItemIcon>
              <CloseIcon sx={{ color: "#fff" }} />
            </ListItemIcon>
            <ListItemText primary="Close Drawer" />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
}
