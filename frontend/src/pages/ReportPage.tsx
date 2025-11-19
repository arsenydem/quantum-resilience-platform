import ReportView from "../components/ReportView";

export default function ReportPage() {
  const report = JSON.parse(sessionStorage.getItem("report") || "null");
  const nodes = JSON.parse(sessionStorage.getItem("platformNodes") || "[]");

  return <ReportView report={report} nodes={nodes} />;
}
