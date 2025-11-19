import { useState } from "react";
import { Network } from "lucide-react";
import { NetworkNode, NodeType } from "../types";
import { getNodeWeight } from "../../data/securityWeights";
import NodeCard from "./NodeCard";

const nodeTypes: { value: NodeType; label: string }[] = [
  { value: "pc", label: "Персональный компьютер" },
  { value: "printer", label: "Принтер" },
  { value: "switch", label: "Коммутатор" },
  { value: "router", label: "Маршрутизатор" },
  { value: "firewall", label: "Файрволл" },
  { value: "wifi_ap", label: "Точка доступа Wi-Fi" },
  { value: "user", label: "Пользователь" }, // 👈 новый тип
];

const MOCK_NODES: Omit<NetworkNode, "id">[] = [
  {
    type: "pc",
    name: "DevOps Workstation",
    os: "Windows",
    antivirus: "Kaspersky Endpoint Security",
    encryption: ["BitLocker"],
    vpn: "Corporate VPN (OpenVPN)",
    wifi: {
      password: "StrongPass!23",
      encryption: "WPA3-Enterprise",
    },
    security_policy: {
      password_hashed: true,
      backup_frequency: "daily",
    },
    personal_data: {
      enabled: true,
      count: 2400,
    },
    professional_software: ["Visual Studio", "Docker Desktop", "Terraform"],
    auth_type: "Пароль",
  },
  {
    type: "firewall",
    name: "Perimeter Firewall",
    firewall_type: "Next-Generation Firewall",
  },
  {
    type: "router",
    name: "Branch Router",
  },
  {
    type: "pc",
    name: "Finance Laptop",
    os: "macOS",
    antivirus: "ESET NOD32",
    encryption: ["FileVault 2"],
    wifi: {
      password: "FinDept@2024",
      encryption: "WPA3-Personal",
    },
    security_policy: {
      password_hashed: true,
      backup_frequency: "daily",
    },
    personal_data: {
      enabled: true,
      count: 520,
    },
    professional_software: ["1C", "SAP GUI", "MS Office"],
    auth_type: "Смарт-карта",
  },
  {
    type: "wifi_ap",
    name: "Guest Wi-Fi",
    os: "Linux",
    antivirus: "",
    wifi: {
      password: "",
      encryption: "WPA2-Personal",
    },
    security_policy: {
      password_hashed: false,
      backup_frequency: "none",
    },
    personal_data: {
      enabled: false,
      count: 0,
    },
    professional_software: [],
  },
];

// 1f. Типы аутентификации
const authTypes = [
  "Пароль",
  "PIN-код",
  "Графический пароль",
  "Отпечаток пальца",
  "Распознавание лица",
  "По радужке глаза",
  "Смарт-карта",
  "USB-токен",
  "Ключ безопасности FIDO2",
  "Мобильный пропуск",
  "Биометрия вен ладони",
  "Голосовая аутентификация",
  "Комбинированные методы",
];

// 6. Типы файрволлов
const firewallTypes = [
  "Пакетный фильтр",
  "Stateful Inspection",
  "Proxy-файрвол",
  "Next-Generation Firewall",
  "WAF",
  "Персональный файрволл",
];

const osOptions = [
  { value: "Windows", label: "Windows" },
  { value: "Linux", label: "Linux" },
  { value: "macOS", label: "macOS" },
];

const antivirusOptions = [
  "Kaspersky Endpoint Security",
  "Dr.Web Security Space",
  "ESET NOD32",
  "Symantec Endpoint Protection",
  "CrowdStrike Falcon",
  "Microsoft Defender for Endpoint",
  "McAfee Endpoint Security",
  "Avast Business Security",
  "Panda Security",
  "360 Total Security",
];

const encryptionOptions = [
  "BitLocker",
  "VeraCrypt",
  "FileVault 2",
  "LUKS",
  "ViPNet Client",
  "КриптоПро CSP",
  "Secret Disk",
  "eCryptfs",
  "APFS Encryption",
  "NTFS EFS",
];

const wifiEncryptionOptions = [
  { value: "none", label: "Нет" },
  { value: "WEP", label: "WEP" },
  { value: "WPA", label: "WPA" },
  { value: "WPA2-Personal", label: "WPA2-Personal" },
  { value: "WPA2-Enterprise", label: "WPA2-Enterprise" },
  { value: "WPA3-Personal", label: "WPA3-Personal" },
  { value: "WPA3-Enterprise", label: "WPA3-Enterprise" },
];

const withWeight = (node: NetworkNode): NetworkNode => ({
  ...node,
  weight: getNodeWeight(node.name, node.type),
});

export default function PlatformForm({
  onNext,
}: {
  onNext: (nodes: NetworkNode[]) => void;
}) {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NetworkNode | null>(null);
  const [currentType, setCurrentType] = useState<NodeType>("pc");

  const applyMockNodes = () => {
    const stamp = Date.now();
    const prepared = MOCK_NODES.map((mock, index) =>
      withWeight({
        ...mock,
        id: `mock-${index}-${stamp}`,
      } as NetworkNode),
    );
    setNodes(prepared);
    setShowForm(false);
    setEditing(null);
  };

  const clearAllNodes = () => {
    setNodes([]);
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const encryption = data.getAll("encryption") as string[];

    const security_policy = {
      password_hashed: data.get("password_hashed") === "on",
      backup_frequency: (data.get("backup_frequency") as string) || "none",
    };

    const wifi =
      (data.get("wifi_encryption") as string) || data.get("wifi_password")
        ? {
            password: (data.get("wifi_password") as string) || "",
            encryption:
              ((data.get("wifi_encryption") as string) as string) || "none",
          }
        : undefined;

    const personal_data = {
      enabled: data.get("personal_data") === "on",
      count: Number(data.get("personal_data_count") || 0) || 0,
    };

    const connections = data.getAll("connections") as string[];

    const accessLevelValue = data.get("access_level") as string | null;

    const newNode: NetworkNode = {
      id: editing?.id || Date.now().toString(),
      type: data.get("type") as NodeType,
      name: (data.get("name") as string) || "",
      professional_software: ((data.get("software") as string) || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      os: (data.get("os") as string) || undefined,
      antivirus: (data.get("antivirus") as string) || undefined,
      encryption: encryption.length ? encryption : undefined,
      vpn: ((data.get("vpn") as string) || "").trim() || undefined,
      // 1f. Тип аутентификации
      auth_type: ((data.get("auth_type") as string) || "").trim() || undefined,
      // 6. Тип файрволла
      firewall_type:
        ((data.get("firewall_type") as string) || "").trim() || undefined,
      // 8. Уровень доступа пользователя
      access_level: accessLevelValue
        ? (Number(accessLevelValue) as 1 | 2 | 3)
        : undefined,
      security_policy,
      wifi,
      personal_data,
      connections,
    };

    const nodeWithWeight = withWeight(newNode);

    if (editing) {
      setNodes((prev) =>
        prev.map((n) => (n.id === editing.id ? nodeWithWeight : n)),
      );
      setEditing(null);
    } else {
      setNodes((prev) => [...prev, nodeWithWeight]);
    }

    setShowForm(false);
    form.reset();
  };

  const startEdit = (node: NetworkNode) => {
    setEditing(node);
    setCurrentType(node.type);
    setShowForm(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Network className="w-8 h-8 text-indigo-600" />
          Описание цифровой платформы
        </h2>
        <div className="flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            onClick={applyMockNodes}
            className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-indigo-50"
          >
            Автозаполнение
          </button>
          <button
            type="button"
            onClick={clearAllNodes}
            disabled={nodes.length === 0}
            className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-rose-50 disabled:opacity-50"
          >
            Очистить
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setCurrentType("pc");
              setShowForm(true);
            }}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            + Добавить узел
          </button>
        </div>
      </div>

      {nodes.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          Узлы сети не добавлены
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              onEdit={() => startEdit(node)}
              onDelete={() =>
                setNodes((prev) => prev.filter((n) => n.id !== node.id))
              }
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

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">
              {editing ? "Редактировать" : "Добавить"} узел сети
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Тип + имя */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Тип узла</label>
                  <select
                    name="type"
                    required
                    className="w-full mt-1 p-3 border rounded-lg"
                    value={currentType}
                    onChange={(e) =>
                      setCurrentType(e.target.value as NodeType)
                    }
                  >
                    {nodeTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Название</label>
                  <input
                    name="name"
                    required
                    defaultValue={editing?.name}
                    className="w-full mt-1 p-3 border rounded-lg"
                    placeholder="Например: ПК бухгалтера, Маршрутизатор офиса..."
                  />
                </div>
              </div>

              {/* 1. Персональный компьютер */}
              {currentType === "pc" && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold text-lg">
                    Параметры персонального компьютера
                  </h4>

                  <div>
                    <label className="block text-sm font-medium">
                      Операционная система
                    </label>
                    <select
                      name="os"
                      required
                      className="w-full mt-1 p-3 border rounded-lg"
                      defaultValue={editing?.os || "Windows"}
                    >
                      {osOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Перечень программ (через запятую)
                    </label>
                    <input
                      name="software"
                      defaultValue={editing?.professional_software?.join(", ")}
                      placeholder="1С, SAP, Oracle DB, Hyperledger Fabric..."
                      className="w-full mt-1 p-3 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Антивирус / EDR
                    </label>
                    <select
                      name="antivirus"
                      className="w-full mt-1 p-3 border rounded-lg"
                      defaultValue={editing?.antivirus || ""}
                    >
                      <option value="">Не установлен / другое</option>
                      {antivirusOptions.map((av) => (
                        <option key={av} value={av}>
                          {av}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Средства шифрования
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {encryptionOptions.map((enc) => (
                        <label
                          key={enc}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            name="encryption"
                            value={enc}
                            className="w-4 h-4"
                            defaultChecked={
                              (editing as any)?.encryption?.includes?.(enc)
                            }
                          />
                          <span>{enc}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">VPN</label>
                    <input
                      name="vpn"
                      defaultValue={(editing as any)?.vpn}
                      placeholder="Например: OpenVPN, Cisco AnyConnect..."
                      className="w-full mt-1 p-3 border rounded-lg"
                    />
                  </div>

                  {/* 1f. Тип аутентификации */}
                  <div>
                    <label className="block text-sm font-medium">
                      Тип аутентификации
                    </label>
                    <select
                      name="auth_type"
                      className="w-full mt-1 p-3 border rounded-lg"
                      defaultValue={(editing as any)?.auth_type || ""}
                    >
                      <option value="">Нет / другое</option>
                      {authTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* 6. Файрволл */}
              {currentType === "firewall" && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold text-lg">
                    Параметры файрволла
                  </h4>
                  <div>
                    <label className="block text-sm font-medium">
                      Тип файрволла
                    </label>
                    <select
                      name="firewall_type"
                      className="w-full mt-1 p-3 border rounded-lg"
                      defaultValue={(editing as any)?.firewall_type || ""}
                    >
                      <option value="">Не указано</option>
                      {firewallTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* 7. Точка доступа Wi-Fi */}
              {currentType === "wifi_ap" && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold text-lg">
                    Параметры Wi-Fi точки доступа
                  </h4>
                  <div>
                    <label className="block text-sm font-medium">
                      Пароль
                    </label>
                    <input
                      name="wifi_password"
                      type="text"
                      className="w-full mt-1 p-3 border rounded-lg"
                      defaultValue={(editing as any)?.wifi?.password}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Протокол шифрования
                    </label>
                    <select
                      name="wifi_encryption"
                      className="w-full mt-1 p-3 border rounded-lg"
                      defaultValue={
                        (editing as any)?.wifi?.encryption || "none"
                      }
                    >
                      {wifiEncryptionOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* 8. Пользователь */}
              {currentType === "user" && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold text-lg">
                    Параметры пользователя
                  </h4>
                  <div>
                    <label className="block text-sm font-medium">
                      Уровень доступа
                    </label>
                    <select
                      name="access_level"
                      className="w-full mt-1 p-3 border rounded-lg"
                      defaultValue={
                        editing?.access_level
                          ? String(editing.access_level)
                          : "1"
                      }
                    >
                      <option value="1">Уровень доступа 1</option>
                      <option value="2">Уровень доступа 2</option>
                      <option value="3">Уровень доступа 3</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 5. Политика безопасности + персональные данные */}
              <div className="border-t pt-4 space-y-4">
                <h4 className="font-semibold text-lg">Политика безопасности</h4>

                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    name="password_hashed"
                    className="w-4 h-4"
                    defaultChecked={
                      (editing as any)?.security_policy?.password_hashed
                    }
                  />
                  <span>Пароли хранятся в хэшированном виде</span>
                </label>

                <div>
                  <label className="block text-sm font-medium">
                    Частота резервного копирования
                  </label>
                  <select
                    name="backup_frequency"
                    className="w-full mt-1 p-3 border rounded-lg"
                    defaultValue={
                      (editing as any)?.security_policy?.backup_frequency ||
                      "none"
                    }
                  >
                    <option value="none">Не используется</option>
                    <option value="daily">Ежедневно</option>
                    <option value="weekly">Еженедельно</option>
                    <option value="monthly">Ежемесячно</option>
                  </select>
                </div>

                {/* Хранение персональных данных */}
                <div className="pt-2 border-t mt-2 space-y-2">
                  <h5 className="font-semibold text-sm">
                    Хранение персональных данных
                  </h5>
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      name="personal_data"
                      className="w-4 h-4"
                      defaultChecked={editing?.personal_data?.enabled}
                    />
                    <span>На узле обрабатываются / хранятся персональные данные</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium">
                      Оценочное количество записей
                    </label>
                    <input
                      type="number"
                      name="personal_data_count"
                      min={0}
                      className="w-full mt-1 p-3 border rounded-lg"
                      defaultValue={editing?.personal_data?.count ?? 0}
                    />
                  </div>
                </div>
              </div>

              {/* Связи с другими узлами */}
              {nodes.length > 0 && (
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-lg">
                    Связи с другими узлами
                  </h4>
                  <p className="text-xs text-gray-500">
                    Выберите, с какими узлами этот элемент связан (кабель,
                    логический канал и т.п.).
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {nodes
                      .filter((n) => !editing || n.id !== editing.id)
                      .map((n) => (
                        <label
                          key={n.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            name="connections"
                            value={n.id}
                            className="w-4 h-4"
                            defaultChecked={editing?.connections?.includes(
                              n.id,
                            )}
                          />
                          <span>
                            {n.name}{" "}
                            <span className="text-xs text-gray-500">
                              ({n.type})
                            </span>
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              )}

              {/* Кнопки */}
              <div className="flex gap-4 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                  className="px-6 py-3 border rounded-lg"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
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
