import type { NetworkNode, NodeType } from "../src/types";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9а-яё#+]+/g, "");

// Базовые веса для конкретных технологий / продуктов
const specificNodeWeights: Record<string, number> = {
  // Wi-Fi (по таблице стойкости протоколов)
  wep: 2,
  wpa: 4,
  wpa2personal: 6,
  wpa2enterprise: 8,
  wpa3personal: 9,
  wpa3enterprise: 10,

  // Disk / data encryption (по таблице технологий шифрования носителей)
  bitlocker: 8,
  veracrypt: 9,
  filevault: 8,
  luks: 9,
  vipnet: 10,
  cryptopro: 10,
  secretdisk: 10,
  ecryptfs: 6,
  apfs: 7,
  ntfs: 5,
  xfsenc: 6,

  // Endpoint protection / antivirus / EDR (по таблице антивирусов)
  kaspersky: 9,
  drweb: 9,
  eset: 8,
  symantec: 8,
  crowdstrike: 9,
  defender: 8,        // Microsoft Defender for Endpoint
  mcafee: 8,
  avast: 7,
  panda: 7,
  "360totalsecurity": 7,
  edr: 8,

  // Auth / MFA (методы аутентификации)
  password: 4,
  "пароль": 4,

  pincod: 5,
  pin: 5,
  "pinкод": 5,

  "графическийпароль": 4,

  otp: 7,

  token: 9,
  usbtoken: 9,
  "usbтокен": 9,

  faceid: 8,
  "распознаваниелица": 8,

  fingerprint: 7,
  "отпечатокпальца": 7,

  iris: 9,
  "радужкаглаза": 9,

  smartcard: 8,
  "смарткарта": 8,

  fido2: 9,
  "ключбезопасностиfido2": 9,

  mobilepass: 6,
  "мобильныйпропуск": 6,

  palmvein: 9,
  "биометријавенладони": 9,

  voice: 5,
  "голосоваяаутентификация": 5,

  biometrics: 8,

  mfa: 10,
  "2fa": 10,
  "комбинированныеметоды": 10,

  // Backup / monitoring
  backup: 6,
  veeam: 9,
  snapshot: 7,
  replica: 7,
  siem: 8,
  soc: 9,
  monitoring: 6,

  // Firewalls (по таблице типов файрволлов)
  packetfilter: 4,
  "пакетныйфильтр": 4,

  stateful: 7,
  "statefulinspection": 7,

  proxyfirewall: 8,
  "proxyфайрволл": 8,

  ngfw: 9,
  "nextgenerationfirewall": 9,

  waf: 8,

  personalfirewall: 6,
  "персональныйфайрволл": 6,

  firewall: 6, // общее слово, чуть ниже NGFW/WAF, но выше пакетного
};

// Ключевые слова для продуктов, сертифицированных ФСТЭК
const fstekCertifiedKeywords: Record<string, true> = {
  // Шифрование дисков
  vipnet: true,       // ViPNet Client – сертифицирован ФСТЭК
  secretdisk: true,   // Secret Disk – сертификация ФСТЭК

  // Антивирусы
  kaspersky: true,    // Kaspersky Endpoint Security – ✅ Да
  drweb: true,        // Dr.Web Security Space – ✅ Да
};

// Флаг соответствия ФСТЭК по имени узла
export const hasFstekCertification = (name: string): boolean => {
  const normalized = normalize(name);
  if (!normalized) return false;

  for (const keyword of Object.keys(fstekCertifiedKeywords)) {
    if (normalized.includes(keyword)) {
      return true;
    }
  }
  return false;
};

export type ControlCategoryId =
  | "wifi"
  | "diskEncryption"
  | "endpointProtection"
  | "authFactors"
  | "backupRecovery"
  | "monitoring"
  | "networkFirewall"; // новая категория для файрволлов

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
      "password",
      "пароль",
      "pin",
      "pinкод",
      "otp",
      "token",
      "faceid",
      "usb",
      "usbтокен",
      "fido",
      "biometrics",
      "графическийпароль",
      "fingerprint",
      "отпечатокпальца",
      "распознаваниелица",
      "радужкаглаза",
      "smartcard",
      "смарткарта",
      "ключбезопасностиfido2",
      "мобильныйпропуск",
      "биометријавенладони",
      "голосоваяаутентификация",
      "mfa",
      "2fa",
      "комбинированныеметоды",
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
  {
    id: "networkFirewall",
    label: "Сетевые файрволы и фильтрация трафика",
    keywords: [
      "firewall",
      "packetfilter",
      "пакетныйфильтр",
      "statefulinspection",
      "stateful",
      "proxyfirewall",
      "proxyфайрволл",
      "ngfw",
      "nextgenerationfirewall",
      "waf",
      "personalfirewall",
      "персональныйфайрволл",
    ],
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
  const initial: Record<ControlCategoryId, CategoryCoverageResult> =
    CONTROL_CATEGORIES.reduce(
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
