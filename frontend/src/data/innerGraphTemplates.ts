import type { NodeType } from "../types";

export type CommunicationLevel = "physical" | "linguistic" | "semantic";

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
  edges: [
    { id: "cpu-gpu-phys", source: "cpu", target: "gpu", level: "physical" },
    { id: "cpu-gpu-ling", source: "cpu", target: "gpu", level: "linguistic" },
    { id: "cpu-gpu-sem", source: "cpu", target: "gpu", level: "semantic" },
    { id: "cpu-ram-phys", source: "cpu", target: "ram", level: "physical" },
    { id: "cpu-ram-ling", source: "cpu", target: "ram", level: "linguistic" },
    { id: "cpu-mb-phys", source: "cpu", target: "mb", level: "physical" },
    { id: "gpu-mb-phys", source: "gpu", target: "mb", level: "physical" },
    { id: "ram-mb-phys", source: "ram", target: "mb", level: "physical" },
    { id: "ssd-mb-phys", source: "ssd", target: "mb", level: "physical" },
    { id: "hdd-mb-phys", source: "hdd", target: "mb", level: "physical" },
    { id: "keyboard-mb-phys", source: "keyboard", target: "mb", level: "physical" },
    { id: "mouse-mb-phys", source: "mouse", target: "mb", level: "physical" },
    { id: "webcam-mb-phys", source: "webcam", target: "mb", level: "physical" },
    { id: "mic-mb-phys", source: "mic", target: "mb", level: "physical" },
    { id: "monitor-gpu-physical", source: "monitor", target: "gpu", level: "physical" },
    { id: "speakers-mb-phys", source: "speakers", target: "mb", level: "physical" },
    { id: "headphones-mb-phys", source: "headphones", target: "mb", level: "physical" },
    { id: "wifi-mb-phys", source: "wifi", target: "mb", level: "physical" },
    { id: "wifi-mb-ling", source: "wifi", target: "mb", level: "linguistic" },
    { id: "wifi-mb-sem", source: "wifi", target: "mb", level: "semantic" },
  ],
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
  edges: [
    { id: "cpu-asic-phys", source: "cpu", target: "asic", level: "physical" },
    { id: "cpu-asic-ling", source: "cpu", target: "asic", level: "linguistic" },
    { id: "cpu-ram-phys", source: "cpu", target: "ram", level: "physical" },
    { id: "cpu-firmware-sem", source: "cpu", target: "firmware", level: "semantic" },
    { id: "cpu-wan-ling", source: "cpu", target: "wan", level: "linguistic" },
    { id: "cpu-lan-ling", source: "cpu", target: "lan", level: "linguistic" },
    { id: "lan-wifi-physical", source: "lan", target: "wifi", level: "physical" },
    { id: "lan-wifi-ling", source: "lan", target: "wifi", level: "linguistic" },
  ],
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
  edges: [
    { id: "radio-antenna-phys", source: "radio", target: "antenna", level: "physical" },
    { id: "radio-cpu-phys", source: "radio", target: "cpu", level: "physical" },
    { id: "radio-cpu-ling", source: "radio", target: "cpu", level: "linguistic" },
    { id: "cpu-lan-phys", source: "cpu", target: "lan", level: "physical" },
    { id: "cpu-lan-ling", source: "cpu", target: "lan", level: "linguistic" },
    { id: "cpu-firmware-sem", source: "cpu", target: "firmware", level: "semantic" },
  ],
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
  edges: [
    { id: "cpu-asic-phys", source: "cpu", target: "asic", level: "physical" },
    { id: "cpu-asic-ling", source: "cpu", target: "asic", level: "linguistic" },
    { id: "cpu-ips-sem", source: "cpu", target: "ips", level: "semantic" },
    { id: "cpu-policy-sem", source: "cpu", target: "policy", level: "semantic" },
    { id: "wan-cpu-ling", source: "wan", target: "cpu", level: "linguistic" },
    { id: "lan-cpu-ling", source: "lan", target: "cpu", level: "linguistic" },
  ],
};

const switchTemplate: InnerGraphTemplate = {
  title: "Switch",
  nodes: [
    { id: "asic", label: "Switch ASIC", variant: "asset", weight: 8 },
    { id: "mgmt", label: "Management CPU", variant: "control", weight: 7 },
    { id: "ports", label: "Access ports", variant: "info", weight: 6 },
    { id: "uplink", label: "Uplink ports", variant: "info", weight: 6 },
  ],
  edges: [
    { id: "asic-mgmt-phys", source: "asic", target: "mgmt", level: "physical" },
    { id: "asic-mgmt-ling", source: "asic", target: "mgmt", level: "linguistic" },
    { id: "ports-asic-phys", source: "ports", target: "asic", level: "physical" },
    { id: "uplink-asic-phys", source: "uplink", target: "asic", level: "physical" },
  ],
};

const printerTemplate: InnerGraphTemplate = {
  title: "Printer",
  nodes: [
    { id: "controller", label: "Controller", variant: "asset", weight: 7 },
    { id: "engine", label: "Print engine", variant: "control", weight: 7 },
    { id: "scanner", label: "Scanner", variant: "info", weight: 6 },
    { id: "network", label: "Network module", variant: "info", weight: 6 },
  ],
  edges: [
    { id: "controller-engine-phys", source: "controller", target: "engine", level: "physical" },
    { id: "controller-engine-ling", source: "controller", target: "engine", level: "linguistic" },
    { id: "controller-scanner-sem", source: "controller", target: "scanner", level: "semantic" },
    { id: "network-controller-ling", source: "network", target: "controller", level: "linguistic" },
  ],
};

const userTemplate: InnerGraphTemplate = {
  title: "User workstation",
  nodes: [
    { id: "persona", label: "User", variant: "asset", weight: 6 },
    { id: "credentials", label: "Credentials", variant: "risk", weight: 5 },
    { id: "device", label: "Endpoint", variant: "control", weight: 7 },
  ],
  edges: [
    { id: "persona-credentials-ling", source: "persona", target: "credentials", level: "linguistic" },
    { id: "persona-device-physical", source: "persona", target: "device", level: "physical" },
    { id: "device-credentials-sem", source: "device", target: "credentials", level: "semantic" },
  ],
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
