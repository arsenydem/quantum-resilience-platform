// src/components/NodeCard.tsx
import { NetworkNode, NodeType } from "../types";
import { Trash2, Edit2, Monitor, Printer, Router, Shield, Wifi, Box, User } from "lucide-react";

interface Props {
  node: NetworkNode;
  onEdit: () => void;
  onDelete: () => void;
}

const iconByType: Record<NodeType, JSX.Element> = {
  pc: <Monitor className="w-8 h-8 text-indigo-600" />,
  printer: <Printer className="w-8 h-8 text-indigo-600" />,
  switch: <Router className="w-8 h-8 text-indigo-600" />,   // можно другой
  router: <Router className="w-8 h-8 text-indigo-600" />,
  firewall: <Shield className="w-8 h-8 text-indigo-600" />,
  wifi_ap: <Wifi className="w-8 h-8 text-indigo-600" />,
  user: <User className="w-8 h-8 text-indigo-600" />,
};

export default function NodeCard({ node, onEdit, onDelete }: Props) {
  const software = node.professional_software ?? [];
  const hasSoftware = software.length > 0;

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">
            {iconByType[node.type] ?? <Box className="w-8 h-8 text-indigo-600" />}
          </div>
          <div>
            <h4 className="font-semibold">{node.name}</h4>
            <span className="text-xs text-gray-500">{node.type}</span>
            {typeof node.weight === "number" && (
              <div className="mt-1 text-xs text-indigo-700">
                Вес узла: <span className="font-semibold">{node.weight.toFixed(1)}</span> / 10
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-blue-600 hover:bg-blue-50 p-1 rounded"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:bg-red-50 p-1 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="text-sm space-y-1 text-gray-600">
        {node.os && <p>ОС: {node.os}</p>}
        {node.antivirus && <p>Антивирус: {node.antivirus}</p>}
        {hasSoftware && <p>ПО: {software.join(", ")}</p>}
        {node.wifi && (
          <p className="text-xs">
            Wi-Fi: {node.wifi.encryption} {node.wifi.password ? "(пароль задан)" : "(открытая сеть)"}
          </p>
        )}
        {node.personal_data?.enabled && (
          <p className="text-xs">
            Персональные данные: ~{node.personal_data.count} записей
          </p>
        )}
      </div>
    </div>
  );
}
