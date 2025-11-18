from pydantic import BaseModel
from typing import List, Dict, Any

class PasswordPolicy(BaseModel):
    min_length: int = 12
    require_upper: bool = True
    require_lower: bool = True
    require_digits: bool = True
    require_special: bool = True

class Node(BaseModel):
    id: str
    type: str  # pc, switch, server, etc.
    name: str
    os: str = "Windows Server 2022"
    antivirus: str = ""
    professional_software: List[str] = []
    password_policy: PasswordPolicy | None = None

class ThreatModel(BaseModel):
    quantum_capability: str = "CRQC 2035+"  # или 2030, 2040
    budget_usd: int = 1_000_000_000
    has_error_correction: bool = True

class AnalysisRequest(BaseModel):
    nodes: List[Node]
    threat_model: ThreatModel

class AnalysisResponse(BaseModel):
    score: int  # 0–100
    summary: str
    recommendations: List[str]
    attack_graph: Dict[str, Any]  # nodes + edges для react-flow