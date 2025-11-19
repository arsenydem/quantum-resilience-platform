import ReportView from "../components/ReportView";

export default function ReportPage() {
  const report = JSON.parse(sessionStorage.getItem("report") || "null");

  return <ReportView report={report} />;
}