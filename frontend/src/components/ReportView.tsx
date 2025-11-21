import { useRef, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Download } from "lucide-react";
import AttackGraph from "./AttackGraph";
import { AnalysisResult, NetworkNode } from "../types";

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600 bg-green-50";
  if (score >= 60) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
};

export default function ReportView({ report, nodes }: { report: AnalysisResult; nodes: NetworkNode[] }) {
  const recommendations = report?.recommendations ?? [];
  const findings = report.local_score?.findings ?? [];
  const idealNodes = report?.ideal_nodes && report.ideal_nodes.length > 0 ? report.ideal_nodes : nodes;
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);

  const handleExport = async () => {
    if (!reportRef.current || exporting) return;
    setExporting(true);
    try {
      const [html2canvas, jsPDF] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const canvas = await html2canvas.default(reportRef.current, {
        useCORS: true,
        scale: 2,
        logging: false,
        ignoreElements: (element) => element?.getAttribute?.("data-html2canvas-ignore") === "true",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF.default("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      const scale = Math.min(1, (pageHeight - 10) / imgHeight);
      const renderWidth = pageWidth * scale;
      const renderHeight = imgHeight * scale;
      const xOffset = (pageWidth - renderWidth) / 2;
      let position = 5;
      pdf.addImage(imgData, "PNG", xOffset, position, renderWidth, renderHeight);
      let heightLeft = renderHeight + position - pageHeight;
      while (heightLeft > 0) {
        pdf.addPage();
        position = 5;
        pdf.addImage(imgData, "PNG", xOffset, position, renderWidth, renderHeight);
        heightLeft -= pageHeight - position;
      }
      pdf.save("Отчет-об-устойчивости.pdf");
    } catch (err) {
      console.error("PDF export failed", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8" ref={reportRef}>
      <div className="text-center py-12">
        <div
          className={`inline-flex items-center justify-center w-48 h-48 rounded-full text-6xl font-bold ${getScoreColor(
            report.score,
          )}`}
        >
          {report.score}
        </div>
        <h2 className="text-4xl font-bold mt-6">Итоговый индекс устойчивости</h2>
        <p className="text-xl text-gray-600 mt-4 max-w-3xl mx-auto">{report.summary}</p>
      </div>

      {report.local_score && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
            <p className="text-sm uppercase tracking-wide text-slate-500">Локальная эвристика</p>
            <p className="text-4xl font-bold text-slate-800 mt-2">{report.local_score.value}</p>
            <p className="text-xs text-slate-500 mt-1">
              Вес узлов: {(report.local_score.weight_ratio * 100).toFixed(0)}%, связи:{" "}
              {(report.local_score.connection_ratio * 100).toFixed(0)}%
            </p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 text-center">
            <p className="text-sm uppercase tracking-wide text-indigo-600">Оценка LLM</p>
            <p className="text-4xl font-bold text-indigo-800 mt-2">{report.score}</p>
            <p className="text-xs text-indigo-500 mt-1">С поправкой на квантовые риски</p>
          </div>
        </div>
      )}

      {report.local_score?.control_details?.length ? (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-xl font-semibold mb-3">Детали локальной оценки</h3>
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
            Рекомендации LLM
          </h3>
          <ul className="space-y-4">
            {recommendations.map((r, i) => (
              <li key={`${r}-${i}`} className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-lg">{r}</span>
              </li>
            ))}
            {!recommendations.length && <p className="text-sm text-red-600">Дополнительные рекомендации отсутствуют.</p>}
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
            <CheckCircle className="w-8 h-8" />
            Локальные проблемы
          </h3>
          <ul className="space-y-4">
            {findings.map((gap, i) => (
              <li key={`${gap}-${i}`} className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-lg">{gap}</span>
              </li>
            ))}
            {!findings.length && (
              <p className="text-sm text-green-700">Локальная эвристика не выявила дополнительных проблем.</p>
            )}
          </ul>
        </div>
      </div>

      <div className="space-y-10">
        <div>
          <h3 className="text-3xl font-bold mb-4 text-center">Текущая поверхность атаки</h3>
          <AttackGraph platformNodes={nodes} fallbackGraph={report.attack_graph} />
        </div>

        <div>
          <h3 className="text-3xl font-bold mb-4 text-center">Идеальное состояние после мер</h3>
          <AttackGraph platformNodes={idealNodes} fallbackGraph={report.ideal_graph ?? report.attack_graph} />
        </div>
      </div>

      <div className="text-center pt-8">
        <button
          onClick={handleExport}
          disabled={exporting}
          data-html2canvas-ignore="true"
          className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-indigo-700 flex items-center gap-3 mx-auto disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Download className="w-6 h-6" />
          {exporting ? "Формирование..." : "Экспорт в PDF"}
        </button>
      </div>
    </div>
  );
}
