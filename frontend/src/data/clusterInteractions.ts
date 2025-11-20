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
  physical: "Physical channel",
  linguistic: "Protocol / driver layer",
  semantic: "Business / data context",
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
  physical: "Peripherals / USB / Bluetooth",
  linguistic: "HID drivers / desktop session",
  semantic: "Human input & UI intent",
});

registerBidirectional("user", "wifi_ap", {
  physical: "Radio (2.4/5/6 GHz)",
  linguistic: "802.11 auth & association",
  semantic: "App traffic, credentials, MFA",
});

registerBidirectional("pc", "wifi_ap", {
  physical: "Wi-Fi radio / antennas",
  linguistic: "802.11i / WPA handshake",
  semantic: "Secure SSID payloads",
});

registerBidirectional("pc", "router", {
  physical: "Ethernet / uplink medium",
  linguistic: "IP/TCP stack, DHCP/DNS",
  semantic: "Business application flows",
});

registerBidirectional("pc", "switch", {
  physical: "Copper/Fiber access link",
  linguistic: "Ethernet frames, VLAN tags",
  semantic: "Segmentation & NAC context",
});

registerBidirectional("pc", "firewall", {
  physical: "Inline Ethernet / TAP",
  linguistic: "Stateful inspection stream",
  semantic: "Policy enforcement & logs",
});

registerBidirectional("pc", "printer", {
  physical: "USB / LAN drop",
  linguistic: "IPP / SMB print protocol",
  semantic: "Document payload & metadata",
});

registerBidirectional("router", "wifi_ap", {
  physical: "PoE/Fiber uplink",
  linguistic: "CAPWAP / 802.11 control",
  semantic: "SSID config & NAC policies",
});

registerBidirectional("router", "switch", {
  physical: "Trunk link",
  linguistic: "Routing / STP / LLDP",
  semantic: "QoS & segmentation policy",
});

registerBidirectional("router", "firewall", {
  physical: "Inline network path",
  linguistic: "Routing & ACL sync",
  semantic: "Threat intel / security policy",
});

registerBidirectional("firewall", "switch", {
  physical: "Inline copper/fiber",
  linguistic: "802.1X enforcement channel",
  semantic: "Access logs & policy context",
});

registerBidirectional("firewall", "wifi_ap", {
  physical: "DMZ / controller uplink",
  linguistic: "CAPWAP security channel",
  semantic: "Posture, captive portal data",
});

registerBidirectional("switch", "printer", {
  physical: "Ethernet access port",
  linguistic: "L2 frames / LLDP",
  semantic: "Print queues & monitoring",
});

registerBidirectional("user", "printer", {
  physical: "USB / NFC release",
  linguistic: "Print driver protocol",
  semantic: "Printed document content",
});

export const getClusterInteractionChannels = (
  from: NodeType,
  to: NodeType,
): ClusterChannel[] => {
  return matrix[from]?.[to] ?? makeChannels(defaultLabels);
};
