import { useState } from "react";
import PlatformForm from "./PlatformForm";
import ThreatModelForm from "./ThreatModelForm";
import ReportView from "./ReportView";
import { NetworkNode, ThreatModel, AnalysisResult } from "../types";

export default function Dashboard() {
  const [step, setStep] = useState<"platform" | "threat" | "report">("platform");
  const [platformData, setPlatformData] = useState<NetworkNode[]>([]);
  const [threatData, setThreatData] = useState<ThreatModel | null>(null);
  const [report, setReport] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold">
          Комплекс анализа устойчивости к квантовым угрозам
        </h1>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* степпер */}
        <div className="flex gap-4 mb-8">
          <button
            className={`px-6 py-3 rounded ${
              step === "platform" ? "bg-indigo-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setStep("platform")}
          >
            1. Описание платформы
          </button>

          <button
            className={`px-6 py-3 rounded ${
              step === "threat" ? "bg-indigo-600 text-white" : "bg-gray-200"
            }`}
            disabled={platformData.length === 0}
            onClick={() => setStep("threat")}
          >
            2. Модель угроз
          </button>

          <button
            className={`px-6 py-3 rounded ${
              step === "report" ? "bg-indigo-600 text-white" : "bg-gray-200"
            }`}
            disabled={!threatData || !report}
            onClick={() => setStep("report")}
          >
            3. Отчёт
          </button>
        </div>

        {/* шаг 1: платформа */}
        {step === "platform" && (
          <PlatformForm
            onNext={(nodes: NetworkNode[]) => {
              setPlatformData(nodes);
              setStep("threat");
            }}
          />
        )}

        {/* шаг 2: модель угроз */}
        {step === "threat" && (
          <ThreatModelForm
            onBack={() => setStep("platform")}
            onSubmit={async (threat: ThreatModel) => {
              setLoading(true);
              const res = await fetch("http://localhost:8000/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  nodes: platformData,
                  threat_model: threat,
                }),
              });
              const data: AnalysisResult = await res.json();
              setReport(data);
              setThreatData(threat);
              setStep("report");
              setLoading(false);
            }}
          />
        )}

        {/* шаг 3: отчёт */}
        {step === "report" && report && (
          <ReportView report={report} nodes={platformData} />
        )}
        {/* Можно при желании воткнуть индикатор загрузки */}
        {loading && (
          <p className="mt-4 text-gray-500 text-sm">
            Выполняется анализ квантовых угроз...
          </p>
        )}
      </div>
    </div>
  );
}
