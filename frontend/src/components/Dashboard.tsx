import { useState } from "react";
import PlatformForm from "./PlatformForm";
import ThreatModelForm from "./ThreatModelForm";
import ReportView from "./ReportView";

export default function Dashboard() {
  const [step, setStep] = useState<"platform" | "threat" | "report">("platform");
  const [platformData, setPlatformData] = useState<any>(null);
  const [threatData, setThreatData] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold">
          Комплекс анализа устойчивости к квантовым угрозам
        </h1>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-4 mb-8">
          <button className={`px-6 py-3 rounded ${step === "platform" ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
            onClick={() => setStep("platform")}>1. Описание платформы</button>
          <button className={`px-6 py-3 rounded ${step === "threat" ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
            disabled={!platformData} onClick={() => setStep("threat")}>2. Модель угроз</button>
          <button className={`px-6 py-3 rounded ${step === "report" ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
            disabled={!threatData}>3. Отчёт</button>
        </div>

        {step === "platform" && <PlatformForm onSubmit={(d) => { setPlatformData(d); setStep("threat"); }} />}
        {step === "threat" && <ThreatModelForm platform={platformData}
          onSubmit={async (threat) => {
            setLoading(true);
            const res = await fetch("http://localhost:8000/api/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nodes: platformData, threat_model: threat })
            });
            const data = await res.json();
            setReport(data);
            setThreatData(threat);
            setStep("report");
            setLoading(false);
          }} />}
        {step === "report" && <ReportView report={report} loading={loading} />}
      </div>
    </div>
  );
}