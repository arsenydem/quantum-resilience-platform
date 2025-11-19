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
  const recommendations = report?.recommendations ?? [];
  const findings = report.local_score?.findings ?? [];
  const idealNodes = report?.ideal_nodes && report.ideal_nodes.length > 0 ? report.ideal_nodes : nodes;

  return (
    <div className="space-y-8">
      <div className="text-center py-12">
        <div className={`inline-flex items-center justify-center w-48 h-48 rounded-full text-6xl font-bold ${getScoreColor(report.score)}`}>
          {report.score}
        </div>
        <h2 className="text-4xl font-bold mt-6">Overall resilience score</h2>
        <p className="text-xl text-gray-600 mt-4 max-w-3xl mx-auto">{report.summary}</p>
      </div>

      {report.local_score && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
            <p className="text-sm uppercase tracking-wide text-slate-500">Local heuristic</p>
            <p className="text-4xl font-bold text-slate-800 mt-2">{report.local_score.value}</p>
            <p className="text-xs text-slate-500 mt-1">
              Node weight: {(report.local_score.weight_ratio * 100).toFixed(0)}%, links: {" "}
              {(report.local_score.connection_ratio * 100).toFixed(0)}%
            </p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 text-center">
            <p className="text-sm uppercase tracking-wide text-indigo-600">LLM result</p>
            <p className="text-4xl font-bold text-indigo-800 mt-2">{report.score}</p>
            <p className="text-xs text-indigo-500 mt-1">Adjusted with quantum-risk expertise</p>
          </div>
        </div>
      )}

      {report.local_score?.control_details?.length ? (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-xl font-semibold mb-3">Local score details</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {report.local_score.control_details.slice(0, 8).map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-red-800 mb-6 flex items-center gap-3">
            <XCircle className="w-8 h-8" />
            LLM recommendations
          </h3>
          <ul className="space-y-4">
            {recommendations.map((r, i) => (
              <li key={`${r}-${i}`} className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-lg">{r}</span>
              </li>
            ))}
            {!recommendations.length && <p className="text-sm text-red-600">No additional recommendations.</p>}
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
            <CheckCircle className="w-8 h-8" />
            Local gaps to fix
          </h3>
          <ul className="space-y-4">
            {findings.map((gap, i) => (
              <li key={`${gap}-${i}`} className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-lg">{gap}</span>
              </li>
            ))}
            {!findings.length && <p className="text-sm text-green-700">Local heuristic did not flag additional gaps.</p>}
          </ul>
        </div>
      </div>

      <div className="space-y-10">
        <div>
          <h3 className="text-3xl font-bold mb-4 text-center">Current attack surface</h3>
          <AttackGraph platformNodes={nodes} fallbackGraph={report.attack_graph} />
        </div>

        <div>
          <h3 className="text-3xl font-bold mb-4 text-center">Ideal state after mitigations</h3>
          <AttackGraph platformNodes={idealNodes} fallbackGraph={report.ideal_graph ?? report.attack_graph} />
        </div>
      </div>

      <div className="text-center pt-8">
        <button className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-indigo-700 flex items-center gap-3 mx-auto">
          <Download className="w-6 h-6" />
          Export to PDF
        </button>
      </div>
    </div>
  );
}
