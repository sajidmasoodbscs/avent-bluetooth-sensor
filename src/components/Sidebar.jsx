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

import { useNavigate } from "react-router-dom";
import CasesIcon from '@mui/icons-material/Assignment';

const drawerWidth = 240;

export default function Sidebar({ drawerOpen, setDrawerOpen }) {
  const navigate = useNavigate();

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
          backgroundColor: "#fff",
          color: "#000",
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
          <ListItem 
            component="div" 
            onClick={() => navigate("/dashboard")} 
            sx={{ cursor: "pointer", "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" } }}
          >
            <ListItemIcon>
              <DashboardIcon sx={{ color: "#000" }} />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
          
          <ListItem 
            component="div" 
            onClick={() => navigate("/use-cases")} 
            sx={{ cursor: "pointer", "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" } }}
          >
            <ListItemIcon>
              <CasesIcon sx={{ color: "#000" }} />
            </ListItemIcon>
            <ListItemText primary="Use Cases" />
          </ListItem>

          {/* <ListItem component="div" sx={{ cursor: "pointer", "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" } }}>
            <ListItemIcon>
              <SearchIcon sx={{ color: "#000" }} />
            </ListItemIcon>
            <ListItemText primary="Explore" />
          </ListItem>
          <ListItem component="div" sx={{ cursor: "pointer", "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" } }}>
            <ListItemIcon>
              <CalendarTodayIcon sx={{ color: "#000" }} />
            </ListItemIcon>
            <ListItemText primary="Schedule" />
          </ListItem>
          <ListItem component="div" sx={{ cursor: "pointer", "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" } }}>
            <ListItemIcon>
              <SettingsIcon sx={{ color: "#000" }} />
            </ListItemIcon>
            <ListItemText primary="Setting" />
          </ListItem> */}
        </List>
        <Divider sx={{ borderColor: "rgba(0,0,0,0.1)" }} />
        <List>
          <ListItem component="div" sx={{ cursor: "pointer", "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" } }} onClick={() => setDrawerOpen(false)}>
            <ListItemIcon>
              <CloseIcon sx={{ color: "#000" }} />
            </ListItemIcon>
            <ListItemText primary="Close Drawer" />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
}
