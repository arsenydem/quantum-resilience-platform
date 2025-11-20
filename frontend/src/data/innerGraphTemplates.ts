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
  title: "PC structure",
  nodes: [
    { id: "cpu", label: "CPU", variant: "asset", weight: 9 },
    { id: "gpu", label: "GPU", variant: "asset", weight: 9 },
    { id: "ram", label: "RAM", variant: "control", weight: 8 },
    { id: "mb", label: "Motherboard", variant: "control", weight: 8 },
    { id: "ssd", label: "SSD", variant: "control", weight: 8 },
    { id: "hdd", label: "HDD", variant: "info", weight: 6 },
    { id: "keyboard", label: "Keyboard", variant: "info", weight: 5 },
    { id: "mouse", label: "Mouse", variant: "info", weight: 5 },
    { id: "webcam", label: "Webcam", variant: "info", weight: 5 },
    { id: "mic", label: "Microphone", variant: "info", weight: 5 },
    { id: "monitor", label: "Monitor", variant: "info", weight: 6 },
    { id: "speakers", label: "Speakers", variant: "info", weight: 5 },
    { id: "headphones", label: "Headphones", variant: "info", weight: 5 },
    { id: "wifi", label: "Wi-Fi adapter", variant: "control", weight: 7 },
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
  title: "Router structure",
  nodes: [
    { id: "cpu", label: "Routing CPU", variant: "asset", weight: 9 },
    { id: "asic", label: "Switch ASIC", variant: "asset", weight: 8 },
    { id: "ram", label: "RAM", variant: "control", weight: 7 },
    { id: "firmware", label: "Firmware", variant: "info", weight: 6 },
    { id: "wan", label: "WAN port", variant: "control", weight: 7 },
    { id: "lan", label: "LAN switch", variant: "control", weight: 8 },
    { id: "wifi", label: "Wi-Fi radio", variant: "info", weight: 7 },
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
  title: "Wi-Fi access point",
  nodes: [
    { id: "radio", label: "Radio module", variant: "asset", weight: 8 },
    { id: "antenna", label: "Antennas", variant: "info", weight: 6 },
    { id: "cpu", label: "Controller", variant: "control", weight: 8 },
    { id: "lan", label: "Uplink", variant: "control", weight: 7 },
    { id: "firmware", label: "Firmware", variant: "info", weight: 6 },
  ],
  edges: expandRelations([
    { source: "radio", target: "antenna" },
    { source: "radio", target: "cpu" },
    { source: "cpu", target: "lan" },
    { source: "cpu", target: "firmware" },
  ]),
};

const firewallTemplate: InnerGraphTemplate = {
  title: "Firewall",
  nodes: [
    { id: "cpu", label: "Inspection CPU", variant: "asset", weight: 9 },
    { id: "asic", label: "Content ASIC", variant: "control", weight: 8 },
    { id: "ips", label: "IPS engine", variant: "control", weight: 8 },
    { id: "policy", label: "Policy DB", variant: "info", weight: 7 },
    { id: "wan", label: "WAN interface", variant: "control", weight: 7 },
    { id: "lan", label: "LAN interface", variant: "control", weight: 7 },
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
  title: "Switch",
  nodes: [
    { id: "asic", label: "Switch ASIC", variant: "asset", weight: 8 },
    { id: "mgmt", label: "Management CPU", variant: "control", weight: 7 },
    { id: "ports", label: "Access ports", variant: "info", weight: 6 },
    { id: "uplink", label: "Uplink ports", variant: "info", weight: 6 },
  ],
  edges: expandRelations([
    { source: "asic", target: "mgmt" },
    { source: "ports", target: "asic" },
    { source: "uplink", target: "asic" },
  ]),
};

const printerTemplate: InnerGraphTemplate = {
  title: "Printer",
  nodes: [
    { id: "controller", label: "Controller", variant: "asset", weight: 7 },
    { id: "engine", label: "Print engine", variant: "control", weight: 7 },
    { id: "scanner", label: "Scanner", variant: "info", weight: 6 },
    { id: "network", label: "Network module", variant: "info", weight: 6 },
  ],
  edges: expandRelations([
    { source: "controller", target: "engine" },
    { source: "controller", target: "scanner" },
    { source: "network", target: "controller" },
  ]),
};

const userTemplate: InnerGraphTemplate = {
  title: "User workstation",
  nodes: [
    { id: "persona", label: "User", variant: "asset", weight: 6 },
    { id: "credentials", label: "Credentials", variant: "risk", weight: 5 },
    { id: "device", label: "Endpoint", variant: "control", weight: 7 },
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
