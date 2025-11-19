// Pages
import Dashboard from "./layouts/dashboard";

// MUI Icons
import DashboardIcon from '@mui/icons-material/Dashboard';

const routes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    icon: <DashboardIcon sx={{ color: "#fff" }} />,
    route: "/dashboard",
    component: <Dashboard />,
  },
];

export default routes;
