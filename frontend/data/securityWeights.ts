import type { NetworkNode, NodeType } from "../src/types";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9а-яё#+]+/g, "");

const specificNodeWeights: Record<string, number> = {
  // Wi-Fi
  wep: 2,
  wpa: 4,
  wpa2personal: 6,
  wpa2enterprise: 8,
  wpa3personal: 9,
  wpa3enterprise: 10,
  // Disk / data encryption
  bitlocker: 8,
  veracrypt: 9,
  filevault: 8,
  luks: 9,
  vipnet: 10,
  cryptopro: 10,
  secretdisk: 9,
  ecryptfs: 6,
  apfs: 7,
  ntfs: 5,
  xfsenc: 6,
  // Endpoint protection
  kaspersky: 9,
  drweb: 8,
  eset: 8,
  symantec: 8,
  crowdstrike: 9,
  defender: 8,
  mcafee: 7,
  avast: 6,
  panda: 6,
  "360totalsecurity": 6,
  edr: 8,
  // Auth / MFA
  pincod: 5,
  pin: 4,
  otp: 7,
  token: 9,
  usbtoken: 9,
  faceid: 8,
  fido2: 9,
  biometrics: 8,
  // Backup / monitoring
  backup: 6,
  veeam: 9,
  snapshot: 7,
  replica: 7,
  siem: 8,
  soc: 9,
  monitoring: 6,
};

export type ControlCategoryId =
  | "wifi"
  | "diskEncryption"
  | "endpointProtection"
  | "authFactors"
  | "backupRecovery"
  | "monitoring";

export interface ControlCategory {
  id: ControlCategoryId;
  label: string;
  keywords: string[];
  recommendedWeight: number;
  critical?: boolean;
}

export const CONTROL_CATEGORIES: ControlCategory[] = [
  {
    id: "wifi",
    label: "Wi-Fi и беспроводная защита",
    keywords: ["wep", "wpa", "wpa2", "wpa3", "wifi"],
    recommendedWeight: 8,
    critical: true,
  },
  {
    id: "diskEncryption",
    label: "Шифрование дисков и данных",
    keywords: [
      "bitlocker",
      "veracrypt",
      "filevault",
      "luks",
      "vipnet",
      "cryptopro",
      "secretdisk",
      "ecryptfs",
      "apfs",
      "ntfs",
      "xfsenc",
    ],
    recommendedWeight: 8,
    critical: true,
  },
  {
    id: "endpointProtection",
    label: "Endpoint / EDR защита",
    keywords: [
      "kaspersky",
      "drweb",
      "eset",
      "symantec",
      "crowdstrike",
      "microsoftdefender",
      "defender",
      "mcafee",
      "avast",
      "panda",
      "360",
      "endpoint",
      "edr",
    ],
    recommendedWeight: 8,
    critical: true,
  },
  {
    id: "authFactors",
    label: "Факторы аутентификации и MFA",
    keywords: [
      "pin",
      "otp",
      "token",
      "faceid",
      "usb",
      "fido",
      "biometrics",
    ],
    recommendedWeight: 7,
    critical: true,
  },
  {
    id: "backupRecovery",
    label: "Резервное копирование и восстановление",
    keywords: ["backup", "veeam", "replica", "snapshot", "recovery"],
    recommendedWeight: 8,
    critical: true,
  },
  {
    id: "monitoring",
    label: "Мониторинг / SIEM / SOC",
    keywords: ["monitor", "siem", "soc", "xdr", "observ", "securitycenter", "elk"],
    recommendedWeight: 8,
    critical: true,
  },
];

const nodeTypeDefaults: Record<NodeType, number> = {
  pc: 6,
  printer: 3,
  switch: 5,
  router: 6,
  firewall: 8,
  wifi_ap: 7,
};

const linkTypeWeights: Record<string, number> = {
  wifi: 5,
  ethernet: 6,
  internet: 4,
  vpn: 8,
  zerotrust: 9,
  netflow: 6,
  bluetooth: 3,
};

const findWeight = (map: Record<string, number>, value: string) => {
  const normalized = normalize(value);
  if (!normalized) return undefined;
  for (const [key, weight] of Object.entries(map)) {
    if (normalized.includes(key)) {
      return weight;
    }
  }
  return map[normalized];
};

export const getNodeWeight = (name: string, type?: NodeType) => {
  const specific = findWeight(specificNodeWeights, name);
  if (specific !== undefined) {
    return specific;
  }
  if (type && nodeTypeDefaults[type] !== undefined) {
    return nodeTypeDefaults[type];
  }
  return 5;
};

export const getEdgeWeight = (linkType: string) => {
  return findWeight(linkTypeWeights, linkType) ?? 5;
};

export interface CategoryCoverageResult {
  id: ControlCategoryId;
  label: string;
  maxWeight: number;
  normalized: number;
  meetsRecommended: boolean;
  critical: boolean;
  recommendedWeight: number;
}

export const evaluateCategoryCoverage = (
  nodes: NetworkNode[],
): CategoryCoverageResult[] => {
  const initial: Record<ControlCategoryId, CategoryCoverageResult> = CONTROL_CATEGORIES.reduce(
    (acc, category) => {
      acc[category.id] = {
        id: category.id,
        label: category.label,
        maxWeight: 0,
        normalized: 0,
        meetsRecommended: false,
        critical: Boolean(category.critical),
        recommendedWeight: category.recommendedWeight,
      };
      return acc;
    },
    {} as Record<ControlCategoryId, CategoryCoverageResult>,
  );

  nodes.forEach((node) => {
    const normalizedName = normalize(node.name);
    CONTROL_CATEGORIES.forEach((category) => {
      if (category.keywords.some((keyword) => normalizedName.includes(keyword))) {
        const weight = node.weight ?? getNodeWeight(node.name, node.type);
        const coverage = initial[category.id];
        if (weight > coverage.maxWeight) {
          coverage.maxWeight = weight;
          coverage.normalized = Math.min(1, weight / 10);
        }
        if (weight >= category.recommendedWeight) {
          coverage.meetsRecommended = true;
        }
      }
    });
  });

  return CONTROL_CATEGORIES.map((category) => initial[category.id]);
};
