import type { NodeType } from "../types";
import {
  COMMUNICATION_LEVELS,
  COMMUNICATION_LEVEL_WEIGHTS,
  type CommunicationLevel,
} from "./innerGraphTemplates";

export interface ClusterChannel {
  level: CommunicationLevel;
  label: string;
  weight: number;
}

type ClusterInteractionMatrix = Partial<
  Record<NodeType, Partial<Record<NodeType, ClusterChannel[]>>>
>;

const matrix: ClusterInteractionMatrix = {};

const defaultLabels: Record<CommunicationLevel, string> = {
  physical: "Физический канал",
  linguistic: "Протоколы / драйверы",
  semantic: "Данные / бизнес‑контекст",
};

const makeChannels = (
  labels: Record<CommunicationLevel, string>,
  weights?: Partial<Record<CommunicationLevel, number>>,
): ClusterChannel[] => {
  return COMMUNICATION_LEVELS.map((level) => ({
    level,
    label: labels[level],
    weight: weights?.[level] ?? COMMUNICATION_LEVEL_WEIGHTS[level],
  }));
};

const assignChannels = (from: NodeType, to: NodeType, channels: ClusterChannel[]) => {
  if (!matrix[from]) matrix[from] = {};
  matrix[from]![to] = channels;
};

const registerBidirectional = (
  a: NodeType,
  b: NodeType,
  labels: Record<CommunicationLevel, string>,
  weights?: Partial<Record<CommunicationLevel, number>>,
) => {
  const channels = makeChannels(labels, weights);
  assignChannels(a, b, channels);
  assignChannels(b, a, channels);
};

registerBidirectional("user", "pc", {
  physical: "Периферия / USB / Bluetooth",
  linguistic: "Драйверы HID / сессия",
  semantic: "Действия пользователя / UI",
});

registerBidirectional("user", "wifi_ap", {
  physical: "Радио (2.4/5/6 ГГц)",
  linguistic: "802.11 аутентификация",
  semantic: "Трафик, учетные данные, MFA",
});

registerBidirectional("pc", "wifi_ap", {
  physical: "Wi‑Fi радио / антенны",
  linguistic: "802.11i / WPA рукопожатие",
  semantic: "Шифрованный трафик SSID",
});

registerBidirectional("pc", "router", {
  physical: "Ethernet / аплинк",
  linguistic: "IP/TCP, DHCP/DNS",
  semantic: "Бизнес‑трафик",
});

registerBidirectional("pc", "switch", {
  physical: "Медь/оптика",
  linguistic: "Кадры Ethernet, VLAN",
  semantic: "Сегментация / NAC",
});

registerBidirectional("pc", "firewall", {
  physical: "Инлайн Ethernet / TAP",
  linguistic: "Поток для stateful‑анализа",
  semantic: "Политики и журналы",
});

registerBidirectional("pc", "printer", {
  physical: "USB / LAN",
  linguistic: "IPP / SMB",
  semantic: "Документы и метаданные",
});

registerBidirectional("router", "wifi_ap", {
  physical: "PoE / оптика",
  linguistic: "CAPWAP / 802.11 control",
  semantic: "Настройки SSID / NAC",
});

registerBidirectional("router", "switch", {
  physical: "Транковый линк",
  linguistic: "Маршрутизация / STP / LLDP",
  semantic: "QoS и сегментация",
});

registerBidirectional("router", "firewall", {
  physical: "Инлайн‑путь",
  linguistic: "Маршруты и ACL",
  semantic: "Политики / TI",
});

registerBidirectional("firewall", "switch", {
  physical: "Инлайн медь/оптика",
  linguistic: "Канал 802.1X",
  semantic: "Логи доступа / политики",
});

registerBidirectional("firewall", "wifi_ap", {
  physical: "DMZ / uplink",
  linguistic: "Защищённый CAPWAP",
  semantic: "Профиль/портал",
});

registerBidirectional("switch", "printer", {
  physical: "Порт доступа Ethernet",
  linguistic: "L2 кадры / LLDP",
  semantic: "Очереди печати / мониторинг",
});

registerBidirectional("user", "printer", {
  physical: "USB / NFC",
  linguistic: "Протокол драйвера печати",
  semantic: "Контент печати",
});

export const getClusterInteractionChannels = (
  from: NodeType,
  to: NodeType,
): ClusterChannel[] => {
  return matrix[from]?.[to] ?? makeChannels(defaultLabels);
};
