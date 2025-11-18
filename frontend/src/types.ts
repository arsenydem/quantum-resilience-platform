export type NodeType = "pc" | "switch" | "server" | "database" | "blockchain_node";

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
  os: string;
  antivirus: string;
  professional_software: string[];
  password_policy?: PasswordPolicy;
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