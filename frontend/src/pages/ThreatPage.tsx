import { useNavigate } from "react-router-dom";
import ThreatModelForm from "../components/ThreatModelForm";
import { api } from "../lib/api";

export default function ThreatPage() {
  const navigate = useNavigate();
  const nodes = JSON.parse(sessionStorage.getItem("platformNodes") || "[]");

  return (
    <ThreatModelForm
      onBack={() => navigate("/platform")}
      onSubmit={async (threat) => {
        const result = await api.analyze(nodes, threat);
        sessionStorage.setItem("report", JSON.stringify(result));
        navigate("/report");
      }}
    />
  );
}
