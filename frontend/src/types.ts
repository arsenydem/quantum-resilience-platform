export type NodeType =
  | "pc"
  | "printer"
  | "switch"
  | "router"
  | "firewall"
  | "wifi_ap"
  | "user";

export interface PasswordPolicy {
  min_length: number;
  require_upper: boolean;
  require_lower: boolean;
  require_digits: boolean;
  require_special: boolean;
}

export interface NetworkNode {
  id: string;
  type: NodeType;
  name: string;

  auth_type?: string;

  firewall_type?: string;

  access_level?: 1 | 2 | 3;
  weight?: number;

  os?: string;
  antivirus?: string;
  encryption?: string[];
  vpn?: string;

  wifi?: {
    password: string;
    encryption: string;
  };

  security_policy?: {
    password_hashed: boolean;
    backup_frequency: string;
  };

  personal_data?: {
    enabled: boolean;
    count: number;
  };

  professional_software?: string[];
  connections?: string[];
}
export interface ThreatModel {
  quantum_capability: string;
  budget_usd: number;
  has_error_correction: boolean;
  is_fstec_compliant: boolean;
  has_large_pd_storage: boolean;
}

export interface AttackGraphData {
  nodes: Array<{ id: string; type?: string; data: { label: string } }>;
  edges: Array<{ id: string; source: string; target: string; label?: string }>;
}

export interface LocalScore {
  value: number;
  weight_ratio: number;
  connection_ratio: number;
  topology_bonus?: number;
  control_details: string[];
  findings?: string[];
  finding_codes?: string[];
}

export interface AnalysisResult {
  score: number;
  summary: string;
  recommendations: string[];
  attack_graph: AttackGraphData;
  ideal_graph?: AttackGraphData;
  ideal_nodes?: NetworkNode[];
  local_score?: LocalScore;
}
