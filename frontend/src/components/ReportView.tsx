import { CheckCircle, XCircle, AlertTriangle, Download } from "lucide-react";
import AttackGraph from "./AttackGraph";
import { AnalysisResult, NetworkNode } from "../types";

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600 bg-green-50";
  if (score >= 60) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
};

export default function ReportView({
  report,
  nodes,
}: {
  report: AnalysisResult;
  nodes: NetworkNode[];
}) {
  return (
    <div className="space-y-8">
      <div className="text-center py-12">
        <div className={`inline-flex items-center justify-center w-48 h-48 rounded-full text-6xl font-bold ${getScoreColor(report.score)}`}>
          {report.score}
        </div>
        <h2 className="text-4xl font-bold mt-6">Уровень квантовой устойчивости</h2>
        <p className="text-xl text-gray-600 mt-4 max-w-3xl mx-auto">{report.summary}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-red-800 mb-6 flex items-center gap-3">
            <XCircle className="w-8 h-8" />
            Критические рекомендации
          </h3>
          <ul className="space-y-4">
            {report.recommendations
              .filter(r => r.toLowerCase().includes("срочно") || r.includes("заменить") || r.includes("перейти"))
              .map((r, i) => (
                <li key={i} className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">{r}</span>
                </li>
              ))}
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
            <CheckCircle className="w-8 h-8" />
            Что уже сделано хорошо
          </h3>
          <ul className="space-y-4">
            {report.recommendations
              .filter(r => !r.toLowerCase().includes("срочно") && !r.includes("заменить"))
              .map((r, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">{r}</span>
                </li>
              ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-3xl font-bold mb-6 text-center">Граф квантовых атак</h3>
        <AttackGraph platformNodes={nodes} fallbackGraph={report.attack_graph} />
      </div>

      <div className="text-center pt-8">
        <button className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-indigo-700 flex items-center gap-3 mx-auto">
          <Download className="w-6 h-6" />
          Скачать отчёт в PDF
        </button>
      </div>
    </div>
  );
}
