from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Any, Dict, Tuple
from openai import OpenAI
from dotenv import load_dotenv
import os
import json
import re

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)


class PasswordPolicy(BaseModel):
    min_length: int = 12
    require_upper: bool = True
    require_lower: bool = True
    require_digits: bool = True
    require_special: bool = True


class WifiSettings(BaseModel):
    password: str | None = None
    encryption: str | None = None


class SecurityPolicy(BaseModel):
    password_hashed: bool | None = None
    backup_frequency: str | None = None


class PersonalData(BaseModel):
    enabled: bool | None = None
    count: int | None = None


class NetworkNode(BaseModel):
    id: str
    type: str
    name: str
    weight: float | None = None
    os: str | None = None
    antivirus: str | None = None
    encryption: List[str] = Field(default_factory=list)
    vpn: str | None = None
    wifi: WifiSettings | None = None
    security_policy: SecurityPolicy | None = None
    personal_data: PersonalData | None = None
    professional_software: List[str] = Field(default_factory=list)
    connections: List[str] = Field(default_factory=list)
    auth_type: str | None = None
    firewall_type: str | None = None
    access_level: int | None = None
    password_policy: PasswordPolicy | None = None  # legacy field from old UI


class ThreatModel(BaseModel):
    quantum_capability: str
    budget_usd: int
    has_error_correction: bool
    is_fstec_compliant: bool = False
    has_large_pd_storage: bool = False


class AnalysisRequest(BaseModel):
    nodes: List[NetworkNode]
    threat_model: ThreatModel


SYSTEM_PROMPT = """You are a quantum-resilience analyst. Always respond with a VALID JSON object and nothing else. Use this strict schema:
{
  "score": <0-100>,
  "summary": "short text",
  "recommendations": ["no more than 10 short items"],
  "attack_graph": {
    "nodes": [{"id": "n1", "data": {"label": "node"}, "type": "vulnerable|threat|control"}],
    "edges": [{"id": "e1", "source": "n1", "target": "n2", "label": "vector"}]
  }
}
If you cannot fill some field, keep it an empty list/array."""

ENDPOINT_TYPES = {"pc", "user"}
STRONG_WIFI_PREFIXES = ("wpa2", "wpa3")
DEFAULT_CONTROLS = {
    "antivirus": "QuantumShield EDR",
    "disk_encryption": "Full-disk AES-256",
    "vpn": "ZeroTrust VPN",
    "mfa": "FIDO2 token",
    "wifi_password": "StrongPass!2025",
    "wifi_encryption": "WPA3-Enterprise",
    "firewall": "Next-Generation Firewall",
}
FSTEK_CONTROLS = {
    "antivirus": "Kaspersky Endpoint Security",
    "disk_encryption": "ViPNet Client",
    "vpn": "ViPNet TLS",
    "mfa": "Rutoken ECP",
    "wifi_password": "StrongPass!2025",
    "wifi_encryption": "WPA3-Enterprise",
    "firewall": "ViPNet Coordinator NGFW",
}
FSTEK_RECOMMENDATION_MAP = {
    "antivirus_missing": "Разверните Kaspersky Endpoint Security или другой сертифицированный ФСТЭК EDR на конечных узлах.",
    "disk_missing": "Зашифруйте рабочие станции с помощью ViPNet Client / Secret Disk (ФСТЭК).",
    "vpn_missing": "Организуйте защищённый канал ViPNet TLS или Континент для удалённого доступа.",
    "mfa_missing": "Включите ФСТЭК-сертифицированный второй фактор (Rutoken, JaCarta) для администраторов.",
    "wifi_insecure": "Настройте корпоративный Wi-Fi в режиме WPA3-Enterprise с сертификатами и сложным паролем.",
    "backup_missing": "Запланируйте ежедневные оффлайн-резервные копии и храните их на доверенной площадке (мониторинг ФСТЭК).",
    "firewall_unknown": "Замените межсетевой экран на ViPNet Coordinator NGFW или другой продукт с сертификатом ФСТЭК.",
    "personal_data_unprotected": "Для хранилищ ПДн включите шифрование ViPNet и аппаратные токены доступа.",
}


def clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def extract_connections(nodes: List[NetworkNode]) -> List[Tuple[str, str]]:
    known_ids = {node.id for node in nodes}
    result: set[Tuple[str, str]] = set()
    for node in nodes:
        for target in node.connections or []:
            if target not in known_ids or target == node.id:
                continue
            pair = tuple(sorted((node.id, target)))
            result.add(pair)
    return sorted(result)


def is_wifi_secure(wifi: WifiSettings | None) -> bool:
    if not wifi:
        return False
    if not wifi.password or len(wifi.password) < 8:
        return False
    if not wifi.encryption:
        return False
    encryption = wifi.encryption.lower()
    return any(prefix in encryption for prefix in STRONG_WIFI_PREFIXES)


def normalize_backup(freq: str | None) -> str:
    if not freq:
        return "none"
    freq = freq.strip().lower()
    if freq == "daily":
        return "daily"
    if freq == "weekly":
        return "weekly"
    if freq == "monthly":
        return "monthly"
    return "none"


def ensure_security_policy(node_dict: Dict[str, Any]) -> Dict[str, Any]:
    policy = node_dict.get("security_policy") or {}
    policy["password_hashed"] = True
    policy["backup_frequency"] = "daily"
    node_dict["security_policy"] = policy
    return node_dict


def apply_ideal_defaults(node_dict: Dict[str, Any], controls: Dict[str, str]) -> Dict[str, Any]:
    ideal = dict(node_dict)
    ideal["weight"] = 10.0
    ideal["security_policy"] = {"password_hashed": True, "backup_frequency": "daily"}
    ideal["wifi"] = {
        "password": controls["wifi_password"],
        "encryption": controls["wifi_encryption"],
    }
    return ideal


def evaluate_security(
    nodes: List[NetworkNode],
    fstec_only: bool = False,
    pd_sensitive: bool = False,
) -> Tuple[Dict[str, Any], List[Dict[str, Any]], List[Tuple[str, str]]]:
    if not nodes:
        metrics = {
            "value": 0,
            "weight_ratio": 0.0,
            "connection_ratio": 0.0,
            "control_details": [],
            "findings": [],
            "finding_codes": [],
        }
        return metrics, [], []

    unique_edges = extract_connections(nodes)
    total_nodes = len(nodes)
    max_edges = total_nodes * (total_nodes - 1) // 2
    connection_ratio = 1.0 if max_edges == 0 else min(1.0, len(unique_edges) / max_edges)

    total_weight = sum((node.weight if node.weight is not None else 5.0) for node in nodes)
    max_weight = max(total_nodes * 10.0, 1.0)
    weight_ratio = min(1.0, total_weight / max_weight)

    base_weight_component = weight_ratio * 50.0
    base_connection_component = connection_ratio * 20.0

    control_adjustments = 0.0
    control_details: List[str] = [
        f"+{base_weight_component:.1f} from current node weights",
        f"+{base_connection_component:.1f} from link density",
    ]
    finding_texts: set[str] = set()
    finding_codes: set[str] = set()
    ideal_nodes: List[Dict[str, Any]] = []
    controls = FSTEK_CONTROLS if fstec_only else DEFAULT_CONTROLS

    for node in nodes:
        ideal = apply_ideal_defaults(node.model_dump(mode="python"), controls)
        ideal.setdefault("professional_software", node.professional_software or [])
        ideal.setdefault("connections", node.connections or [])
        ideal.setdefault("encryption", [])

        is_endpoint = node.type in ENDPOINT_TYPES

        if is_endpoint:
            if node.antivirus:
                control_adjustments += 8
                control_details.append(f"+8 {node.name}: endpoint protected")
            else:
                control_adjustments -= 12
                control_details.append(f"-12 {node.name}: antivirus missing")
                finding_texts.add("Install certified EDR on endpoints")
                finding_codes.add("antivirus_missing")
            ideal["antivirus"] = controls["antivirus"]

            if node.encryption:
                control_adjustments += 6
                control_details.append(f"+6 {node.name}: disk encryption enabled")
            else:
                control_adjustments -= 8
                control_details.append(f"-8 {node.name}: disk encryption missing")
                finding_texts.add("Enable disk encryption on laptops/workstations")
                finding_codes.add("disk_missing")
            ideal["encryption"] = [controls["disk_encryption"]]

            if node.vpn:
                control_adjustments += 4
                control_details.append(f"+4 {node.name}: VPN in place")
            else:
                control_adjustments -= 4
                control_details.append(f"-4 {node.name}: no VPN for remote access")
                finding_texts.add("Provide secure VPN/ZeroTrust access")
                finding_codes.add("vpn_missing")
            ideal["vpn"] = controls["vpn"]

            auth_value = (node.auth_type or "").lower()
            has_mfa = any(keyword in auth_value for keyword in ("token", "fido", "usb", "otp", "face", "bio"))
            if has_mfa:
                control_adjustments += 6
                control_details.append(f"+6 {node.name}: MFA enabled")
            else:
                control_adjustments -= 4
                control_details.append(f"-4 {node.name}: MFA missing")
                finding_texts.add("Add MFA/hardware tokens for operators")
                finding_codes.add("mfa_missing")
            ideal["auth_type"] = controls["mfa"]

        wifi_secure = is_wifi_secure(node.wifi)
        if node.type == "wifi_ap" or node.wifi:
            if wifi_secure:
                control_adjustments += 5
                control_details.append(f"+5 {node.name}: Wi-Fi hardened")
            else:
                control_adjustments -= 10
                control_details.append(f"-10 {node.name}: Wi-Fi insecure")
                finding_texts.add("Switch Wi-Fi to WPA3 with strong password")
                finding_codes.add("wifi_insecure")
            ideal["wifi"] = {
                "password": controls["wifi_password"],
                "encryption": controls["wifi_encryption"],
            }

        policy = node.security_policy
        if policy and policy.password_hashed:
            control_adjustments += 4
            control_details.append(f"+4 {node.name}: passwords hashed")
        else:
            control_adjustments -= 6
            control_details.append(f"-6 {node.name}: passwords stored openly")
            finding_texts.add("Hash passwords and protect credential store")
            finding_codes.add("password_plain")
            ensure_security_policy(ideal)

        backup_freq = normalize_backup((policy.backup_frequency if policy else None))
        if backup_freq == "daily":
            control_adjustments += 7
            control_details.append(f"+7 {node.name}: daily backups")
        elif backup_freq == "weekly":
            control_adjustments += 5
            control_details.append(f"+5 {node.name}: weekly backups")
        elif backup_freq == "monthly":
            control_adjustments += 3
            control_details.append(f"+3 {node.name}: monthly backups")
        else:
            control_adjustments -= 10
            control_details.append(f"-10 {node.name}: no backup strategy")
            finding_texts.add("Configure daily offline backups")
            finding_codes.add("backup_missing")
            ensure_security_policy(ideal)

        if node.type == "firewall":
            if node.firewall_type:
                control_adjustments += 6
                control_details.append(f"+6 {node.name}: firewall type defined")
            else:
                control_adjustments -= 8
                control_details.append(f"-8 {node.name}: firewall class unknown")
                finding_texts.add("Deploy NGFW/WAF with proper certification")
                finding_codes.add("firewall_unknown")
            ideal["firewall_type"] = controls["firewall"]

        if node.personal_data and node.personal_data.enabled:
            if node.encryption or wifi_secure or (policy and policy.password_hashed):
                control_adjustments += 3
                control_details.append(f"+3 {node.name}: personal data protected")
            else:
                control_adjustments -= 12
                control_details.append(f"-12 {node.name}: personal data exposed")
                finding_texts.add("Encrypt and limit access to personal data")
                finding_codes.add("personal_data_unprotected")
                ideal["encryption"] = [controls["disk_encryption"]]
                ideal["auth_type"] = controls["mfa"]
        elif pd_sensitive:
            control_details.append("+0 system processes PD separately, ensure safeguards")

        ideal_nodes.append(ideal)

    topology_bonus = 0.0
    if total_nodes > 2:
        if connection_ratio >= 0.6:
            topology_bonus = 5.0
        elif connection_ratio < 0.2:
            topology_bonus = -5.0
    if topology_bonus:
        control_adjustments += topology_bonus
        control_details.append(f"{topology_bonus:+} network topology factor")

    total_score = clamp(base_weight_component + base_connection_component + control_adjustments)

    metrics = {
        "value": round(total_score),
        "weight_ratio": round(weight_ratio, 2),
        "connection_ratio": round(connection_ratio, 2),
        "control_details": control_details,
        "topology_bonus": topology_bonus,
        "findings": sorted(finding_texts),
        "finding_codes": sorted(finding_codes),
    }
    return metrics, ideal_nodes, unique_edges


def build_fstek_recommendations(finding_codes: List[str]) -> List[str]:
    recs = []
    for code in finding_codes:
        text = FSTEK_RECOMMENDATION_MAP.get(code)
        if text:
            recs.append(text)
    if not recs:
        recs.append("Сохраняйте актуальные сертификаты ФСТЭК и подтверждайте соответствие ежегодно.")
    return recs[:10]


@app.post("/api/analyze")
async def analyze(request: AnalysisRequest):
    fstec_mode = request.threat_model.is_fstec_compliant
    metrics, ideal_nodes, connection_pairs = evaluate_security(
        request.nodes,
        fstec_only=fstec_mode,
        pd_sensitive=request.threat_model.has_large_pd_storage,
    )

    nodes_desc = [
        f"- {node.name} ({node.type}): weight={node.weight or 'n/a'}, AV={'yes' if node.antivirus else 'no'}, VPN={'yes' if node.vpn else 'no'}, links={len(node.connections or [])}"
        for node in request.nodes
    ]

    payload = {
        "local_score": metrics,
        "nodes": [node.model_dump(mode="python") for node in request.nodes],
        "ideal_nodes": ideal_nodes,
        "connections": [{"source": a, "target": b} for a, b in connection_pairs],
        "threat_model": request.threat_model.model_dump(),
        "fstec_mode": fstec_mode,
    }
    payload_json = json.dumps(payload, ensure_ascii=False, indent=2)

    extra_clause = "Все рекомендации должны соответствовать требованиям ФСТЭК." if fstec_mode else ""

    user_prompt = f"""Текущая инфраструктура:
{chr(10).join(nodes_desc) if nodes_desc else 'узлы отсутствуют'}

Локальная модель оценила стойкость в {metrics['value']} баллов. Проверь расчёт, при необходимости скорректируй и верни JSON строго по схеме. {extra_clause}
Ниже подробные данные:
""" + "`json\n" + payload_json + "\n`"

    try:
        response = client.chat.completions.create(
            model="deepseek/deepseek-v3.2-exp",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
            max_tokens=3000,
        )

        raw = response.choices[0].message.content.strip()
        print("\n=== RAW LLM RESPONSE ===\n", raw, "\n======================\n")

        json_match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not json_match:
            raise ValueError("JSON не найден в ответе модели")

        data = json.loads(json_match.group(0))

        llm_score = int(data.get("score", metrics["value"]))
        summary = str(data.get("summary", "Описание отсутствует"))
        llm_recommendations = data.get("recommendations", [])
        if not isinstance(llm_recommendations, list):
            llm_recommendations = [str(llm_recommendations)]
        attack_graph = data.get("attack_graph", {"nodes": [], "edges": []})

        recommendations = (
            build_fstek_recommendations(metrics.get("finding_codes", []))
            if fstec_mode
            else llm_recommendations[:10]
        )

        result = {
            "score": llm_score,
            "summary": summary,
            "recommendations": recommendations,
            "attack_graph": attack_graph,
            "local_score": metrics,
            "ideal_nodes": ideal_nodes,
        }

        if "ideal_graph" in data:
            result["ideal_graph"] = data["ideal_graph"]

        return result

    except Exception as e:
        print("ERROR:", str(e))
        raise HTTPException(status_code=500, detail=f"LLM failed: {str(e)}")


@app.get("/")
def root():
    return {"status": "ok", "message": "Quantum Resilience API"}
