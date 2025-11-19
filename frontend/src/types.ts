export type NodeType =
  | "pc"
  | "printer"
  | "switch"
  | "router"
  | "firewall"
  | "wifi_ap";

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

  /** Computed security weight (0..10) assigned on form submit. */
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
}

export interface AnalysisResult {
  score: number;
  summary: string;
  recommendations: string[];
  attack_graph: {
    nodes: Array<{ id: string; type?: string; data: { label: string } }>;
    edges: Array<{ id: string; source: string; target: string; label?: string }>;
  };
}
