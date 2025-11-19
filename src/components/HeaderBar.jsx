import React from "react";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";

const drawerWidth = 240;

export default function MenuAppBar({ drawerOpen, setDrawerOpen }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const auth = true; // Or manage via props/context

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
    position="fixed"
    sx={{
        backgroundColor:"#53ba64",
      zIndex: (theme) => theme.zIndex.drawer + 1,
      transition: "width 0.3s, margin 0.3s",
      width: drawerOpen ? `calc(100% - ${drawerWidth}px)` : "100%",
      ml: drawerOpen ? `${drawerWidth}px` : 0,
    }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={() => setDrawerOpen(!drawerOpen)}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Dashboard
        </Typography>
        {auth && (
          <>
            <IconButton color="inherit" onClick={handleMenu}>
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose}>Profile</MenuItem>
              <MenuItem onClick={handleClose}>Logout</MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
