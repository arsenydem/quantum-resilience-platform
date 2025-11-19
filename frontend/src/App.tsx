import { Routes, Route, Navigate } from "react-router-dom";
import PlatformPage from "./pages/PlatformPage.tsx";
import ThreatPage from "./pages/ThreatPage.tsx";
import ReportPage from "./pages/ReportPage.tsx";

export default function App() {
  return (
    <Routes>
      <Route path="/platform" element={<PlatformPage />} />
      <Route path="/threat" element={<ThreatPage />} />
      <Route path="/report" element={<ReportPage />} />

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
