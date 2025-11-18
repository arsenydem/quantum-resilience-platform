import { useState } from "react";
import Login from "./components/Login";
import PlatformForm from "./components/PlatformForm";
import ThreatModelForm from "./components/ThreatModelForm";
import ReportView from "./components/ReportView";
import { NetworkNode, ThreatModel, AnalysisResult } from "./types";
import { api } from "./lib/api";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [step, setStep] = useState<"login" | "platform" | "threat" | "report">("login");
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [report, setReport] = useState<AnalysisResult | null>(null);

  if (!token || step === "login") {
    return <Login onLogin={(t) => { localStorage.setItem("token", t); setToken(t); setStep("platform"); }} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-indigo-800 text-white p-6 shadow-xl">
        <h1 className="text-3xl font-bold text-center">
          КОМПЛЕКС АНАЛИЗА УСТОЙЧИВОСТИ К КВАНТОВЫМ УГРОЗАМ
        </h1>
      </header>

      {step === "platform" && (
        <PlatformForm onNext={(n) => { setNodes(n); setStep("threat"); }} />
      )}

      {step === "threat" && (
        <ThreatModelForm
          onSubmit={async (threat: ThreatModel) => {
            const result = await api.analyze(nodes, threat);
            setReport(result);
            setStep("report");
          }}
          onBack={() => setStep("platform")}
        />
      )}

      {step === "report" && report && <ReportView report={report} />}
    </div>
  );
}