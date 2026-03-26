import "./App.css";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Routes, Route, Navigate } from "react-router-dom";
import theme from "./theme";

// ✅ Create a cache (no RTL)

// ✅ Create default theme

import HomePage from "./components/HomePage";
import UseCasesPage from "./components/UseCasesPage";
import GraphPage from "./components/GraphPage";
import DashboardLayout from "./layouts/dashboard";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<HomePage />} />
          <Route path="/use-cases" element={<UseCasesPage />} />
          <Route path="/use-cases/:sensorId" element={<GraphPage />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
