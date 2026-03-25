import "./App.css";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Routes, Route, Navigate } from "react-router-dom";
import routes from "./routes";
import theme from "./theme";

// ✅ Create a cache (no RTL)

// ✅ Create default theme

function App() {
  const getRoutes = (allRoutes) =>
    allRoutes.flatMap((route) => {
      if (route.collapse) return getRoutes(route.collapse);
      return route.route ? (
        <Route
          exact
          path={route.route}
          element={route.component}
          key={route.key}
        />
      ) : [];
    });

  return (

      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          {getRoutes(routes)}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </ThemeProvider>
  );
}

export default App;
