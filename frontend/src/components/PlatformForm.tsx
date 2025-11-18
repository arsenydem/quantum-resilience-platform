import { useState } from "react";
import { Network  } from "lucide-react";
import { NetworkNode, NodeType } from "../types";
import NodeCard from "./NodeCard";

const nodeTypes: { value: NodeType; label: string }[] = [
  { value: "pc", label: "Рабочая станция" },
  { value: "switch", label: "Коммутатор" },
  { value: "server", label: "Сервер" },
  { value: "database", label: "База данных" },
  { value: "blockchain_node", label: "Узел блокчейна" },
];

export default function PlatformForm({ onNext }: { onNext: (nodes: NetworkNode[]) => void }) {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NetworkNode | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const newNode: NetworkNode = {
      id: editing?.id || Date.now().toString(),
      type: data.get("type") as NodeType,
      name: data.get("name") as string,
      os: data.get("os") as string,
      antivirus: data.get("antivirus") as string,
      professional_software: (data.get("software") as string).split(",").map(s => s.trim()).filter(Boolean),
      password_policy: data.get("hasPassword") === "on" ? {
        min_length: Number(data.get("min_length")) || 12,
        require_upper: true,
        require_lower: true,
        require_digits: true,
        require_special: true,
      } : undefined,
    };

    if (editing) {
      setNodes(prev => prev.map(n => n.id === editing.id ? newNode : n));
      setEditing(null);
    } else {
      setNodes(prev => [...prev, newNode]);
    }
    setShowForm(false);
    form.reset();
  };

  const startEdit = (node: NetworkNode) => {
    setEditing(node);
    setShowForm(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Network className="w-8 h-8 text-indigo-600" />
          Описание цифровой платформы
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
        >
          + Добавить узел
        </button>
      </div>

      {nodes.length === 0 ? (
        <p className="text-center text-gray-500 py-12">Узлы сети не добавлены</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nodes.map(node => (
            <NodeCard
              key={node.id}
              node={node}
              onEdit={() => startEdit(node)}
              onDelete={() => setNodes(prev => prev.filter(n => n.id !== node.id))}
            />
          ))}
        </div>
      )}

      <div className="mt-10 flex justify-end">
        <button
          onClick={() => onNext(nodes)}
          disabled={nodes.length === 0}
          className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          Далее → Модель угроз
        </button>
      </div>

      {/* Модальное окно формы */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">
              {editing ? "Редактировать" : "Добавить"} узел сети
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Тип узла</label>
                  <select name="type" required defaultValue={editing?.type || "pc"} className="w-full mt-1 p-3 border rounded-lg">
                    {nodeTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label>Название</label>
                  <input name="name" required defaultValue={editing?.name} className="w-full mt-1 p-3 border rounded-lg" />
                </div>
              </div>

              <div>
                <label>Операционная система</label>
                <input name="os" required defaultValue={editing?.os || "Windows 11"} className="w-full mt-1 p-3 border rounded-lg" />
              </div>

              <div>
                <label>Антивирус / EDR</label>
                <input name="antivirus" defaultValue={editing?.antivirus} placeholder="Kaspersky, ESET NOD32, CrowdStrike..." className="w-full mt-1 p-3 border rounded-lg" />
              </div>

              <div>
                <label>Профессиональное ПО (через запятую)</label>
                <input name="software" defaultValue={editing?.professional_software?.join(", ")} placeholder="1С, SAP, Oracle DB, Hyperledger Fabric..." className="w-full mt-1 p-3 border rounded-lg" />
              </div>

              <div className="border-t pt-6">
                <label className="flex items-center gap-3 text-lg">
                  <input type="checkbox" name="hasPassword" defaultChecked={!!editing?.password_policy} className="w-5 h-5" />
                  <span>Есть политика паролей</span>
                </label>
                <div className="mt-3">
                  <label>Минимальная длина пароля</label>
                  <input type="number" name="min_length" defaultValue={editing?.password_policy?.min_length || 16} className="w-full mt-1 p-3 border rounded-lg" />
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-6 py-3 border rounded-lg">
                  Отмена
                </button>
                <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  {editing ? "Сохранить" : "Добавить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}