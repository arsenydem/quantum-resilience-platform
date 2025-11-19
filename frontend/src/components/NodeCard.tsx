import { NetworkNode } from "../types";
import { Trash2, Edit2 } from "lucide-react";

interface Props {
  node: NetworkNode;
  onEdit: () => void;
  onDelete: () => void;
}

export default function NodeCard({ node, onEdit, onDelete }: Props) {
  const icons: Record<string, string> = {
    pc: "Desktop",
    switch: "Router",
    server: "Server",
    database: "Database",
    blockchain_node: "Blocks",
  };

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{icons[node.type] || "Box"}</div>
          <div>
            <h4 className="font-semibold">{node.name}</h4>
            <span className="text-xs text-gray-500">{node.type}</span>
            {typeof node.weight === "number" && (
              <span className="block text-xs font-semibold text-indigo-600">
                Вес: {node.weight}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="text-blue-600 hover:bg-blue-50 p-1 rounded">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="text-red-600 hover:bg-red-50 p-1 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="text-sm space-y-1 text-gray-600">
        <p>ОС: {node.os || "—"}</p>
        {node.antivirus && <p>Антивирус: {node.antivirus}</p>}
        {node.professional_software.length > 0 && (
          <p>ПО: {node.professional_software.join(", ")}</p>
        )}
        {node.wifi && (
          <p className="text-xs">
            Wi-Fi: {node.wifi.encryption} ({node.wifi.password ? "пароль задан" : "без пароля"})
          </p>
        )}
        {node.security_policy && (
          <>
            <p className="text-xs">
              Пароли хешируются: {node.security_policy.password_hashed ? "да" : "нет"}
            </p>
            <p className="text-xs">Резервные копии: {node.security_policy.backup_frequency}</p>
          </>
        )}
        <p className="text-xs">
          Персональные данные:{" "}
          {node.personal_data.enabled ? `${node.personal_data.count} записей` : "не обрабатываются"}
        </p>
      </div>
    </div>
  );
}
