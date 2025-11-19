import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.tsx";
import PlatformPage from "./pages/PlatformPage.tsx";
import ThreatPage from "./pages/ThreatPage.tsx";
import ReportPage from "./pages/ReportPage.tsx";

export default function App() {
  const token = localStorage.getItem("token");

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* защищённые страницы */}
      <Route
        path="/platform"
        element={token ? <PlatformPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/threat"
        element={token ? <ThreatPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/report"
        element={token ? <ReportPage /> : <Navigate to="/login" />}
      />

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
