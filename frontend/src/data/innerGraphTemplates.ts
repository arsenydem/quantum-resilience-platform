import type { NodeType } from "../types";

export type CommunicationLevel = "physical" | "linguistic" | "semantic";

export const COMMUNICATION_LEVELS: CommunicationLevel[] = ["physical", "linguistic", "semantic"];

export const COMMUNICATION_LEVEL_WEIGHTS: Record<CommunicationLevel, number> = {
  physical: 6,
  linguistic: 7,
  semantic: 8,
};

export interface InnerNode {
  id: string;
  label: string;
  variant?: "asset" | "control" | "info" | "risk";
  weight?: number;
}

export interface InnerEdge {
  id: string;
  source: string;
  target: string;
  level: CommunicationLevel;
  weight?: number;
}

interface InnerRelation {
  source: string;
  target: string;
}

const expandRelations = (relations: InnerRelation[]): InnerEdge[] => {
  return relations.flatMap((relation) =>
    COMMUNICATION_LEVELS.map((level) => ({
      id: relation.source + "-" + relation.target + "-" + level,
      source: relation.source,
      target: relation.target,
      level,
      weight: COMMUNICATION_LEVEL_WEIGHTS[level],
    })),
  );
};

export interface InnerGraphTemplate {
  title: string;
  nodes: InnerNode[];
  edges: InnerEdge[];
}

const pcTemplate: InnerGraphTemplate = {
  title: "Структура ПК",
  nodes: [
    { id: "cpu", label: "ЦП", variant: "asset", weight: 9 },
    { id: "gpu", label: "ГП", variant: "asset", weight: 9 },
    { id: "ram", label: "ОЗУ", variant: "control", weight: 8 },
    { id: "mb", label: "Материнская плата", variant: "control", weight: 8 },
    { id: "ssd", label: "SSD", variant: "control", weight: 8 },
    { id: "hdd", label: "HDD", variant: "info", weight: 6 },
    { id: "keyboard", label: "Клавиатура", variant: "info", weight: 5 },
    { id: "mouse", label: "Мышь", variant: "info", weight: 5 },
    { id: "webcam", label: "Веб-камера", variant: "info", weight: 5 },
    { id: "mic", label: "Микрофон", variant: "info", weight: 5 },
    { id: "monitor", label: "Монитор", variant: "info", weight: 6 },
    { id: "speakers", label: "Акустика", variant: "info", weight: 5 },
    { id: "headphones", label: "Наушники", variant: "info", weight: 5 },
    { id: "wifi", label: "Wi‑Fi адаптер", variant: "control", weight: 7 },
  ],
  edges: expandRelations([
    { source: "cpu", target: "gpu" },
    { source: "cpu", target: "ram" },
    { source: "cpu", target: "mb" },
    { source: "gpu", target: "mb" },
    { source: "ram", target: "mb" },
    { source: "ssd", target: "mb" },
    { source: "hdd", target: "mb" },
    { source: "keyboard", target: "mb" },
    { source: "mouse", target: "mb" },
    { source: "webcam", target: "mb" },
    { source: "mic", target: "mb" },
    { source: "monitor", target: "gpu" },
    { source: "speakers", target: "mb" },
    { source: "headphones", target: "mb" },
    { source: "wifi", target: "mb" },
  ]),
};

const routerTemplate: InnerGraphTemplate = {
  title: "Маршрутизатор",
  nodes: [
    { id: "cpu", label: "ЦП маршрутизации", variant: "asset", weight: 9 },
    { id: "asic", label: "Коммутационный ASIC", variant: "asset", weight: 8 },
    { id: "ram", label: "RAM", variant: "control", weight: 7 },
    { id: "firmware", label: "Прошивка", variant: "info", weight: 6 },
    { id: "wan", label: "WAN порт", variant: "control", weight: 7 },
    { id: "lan", label: "LAN коммутатор", variant: "control", weight: 8 },
    { id: "wifi", label: "Wi‑Fi радио", variant: "info", weight: 7 },
  ],
  edges: expandRelations([
    { source: "cpu", target: "asic" },
    { source: "cpu", target: "ram" },
    { source: "cpu", target: "firmware" },
    { source: "cpu", target: "wan" },
    { source: "cpu", target: "lan" },
    { source: "lan", target: "wifi" },
  ]),
};

const wifiTemplate: InnerGraphTemplate = {
  title: "Wi‑Fi точка доступа",
  nodes: [
    { id: "radio", label: "Радиомодуль", variant: "asset", weight: 8 },
    { id: "antenna", label: "Антенны", variant: "info", weight: 6 },
    { id: "cpu", label: "Контроллер", variant: "control", weight: 8 },
    { id: "lan", label: "Аплинк", variant: "control", weight: 7 },
    { id: "firmware", label: "Прошивка", variant: "info", weight: 6 },
  ],
  edges: expandRelations([
    { source: "radio", target: "antenna" },
    { source: "radio", target: "cpu" },
    { source: "cpu", target: "lan" },
    { source: "cpu", target: "firmware" },
  ]),
};

const firewallTemplate: InnerGraphTemplate = {
  title: "Межсетевой экран",
  nodes: [
    { id: "cpu", label: "ЦП проверки", variant: "asset", weight: 9 },
    { id: "asic", label: "Content ASIC", variant: "control", weight: 8 },
    { id: "ips", label: "IPS‑движок", variant: "control", weight: 8 },
    { id: "policy", label: "База политик", variant: "info", weight: 7 },
    { id: "wan", label: "WAN интерфейс", variant: "control", weight: 7 },
    { id: "lan", label: "LAN интерфейс", variant: "control", weight: 7 },
  ],
  edges: expandRelations([
    { source: "cpu", target: "asic" },
    { source: "cpu", target: "ips" },
    { source: "cpu", target: "policy" },
    { source: "wan", target: "cpu" },
    { source: "lan", target: "cpu" },
  ]),
};

const switchTemplate: InnerGraphTemplate = {
  title: "Коммутатор",
  nodes: [
    { id: "asic", label: "Switch ASIC", variant: "asset", weight: 8 },
    { id: "mgmt", label: "Управляющий ЦП", variant: "control", weight: 7 },
    { id: "ports", label: "Порты доступа", variant: "info", weight: 6 },
    { id: "uplink", label: "Аплинк‑порты", variant: "info", weight: 6 },
  ],
  edges: expandRelations([
    { source: "asic", target: "mgmt" },
    { source: "ports", target: "asic" },
    { source: "uplink", target: "asic" },
  ]),
};

const printerTemplate: InnerGraphTemplate = {
  title: "Принтер",
  nodes: [
    { id: "controller", label: "Контроллер", variant: "asset", weight: 7 },
    { id: "engine", label: "Печатающий узел", variant: "control", weight: 7 },
    { id: "scanner", label: "Сканер", variant: "info", weight: 6 },
    { id: "network", label: "Сетевой модуль", variant: "info", weight: 6 },
  ],
  edges: expandRelations([
    { source: "controller", target: "engine" },
    { source: "controller", target: "scanner" },
    { source: "network", target: "controller" },
  ]),
};

const userTemplate: InnerGraphTemplate = {
  title: "Рабочее место пользователя",
  nodes: [
    { id: "persona", label: "Пользователь", variant: "asset", weight: 6 },
    { id: "credentials", label: "Учетные данные", variant: "risk", weight: 5 },
    { id: "device", label: "Устройство", variant: "control", weight: 7 },
  ],
  edges: expandRelations([
    { source: "persona", target: "credentials" },
    { source: "persona", target: "device" },
    { source: "device", target: "credentials" },
  ]),
};

export const INNER_GRAPH_TEMPLATES: Partial<Record<NodeType, InnerGraphTemplate>> = {
  pc: pcTemplate,
  router: routerTemplate,
  wifi_ap: wifiTemplate,
  firewall: firewallTemplate,
  switch: switchTemplate,
  printer: printerTemplate,
  user: userTemplate,
};
