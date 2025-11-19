import "./App.css";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Routes, Route, Navigate } from "react-router-dom";
import routes from "./routes";
import theme from "./theme";

// ✅ Create a cache (no RTL)
const cache = createCache({ key: "mui" });

// ✅ Create default theme
const defaultTheme = createTheme();

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
