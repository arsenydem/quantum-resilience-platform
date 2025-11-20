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
    password_policy: PasswordPolicy | None = None


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
SIEM_KEYWORDS = ("siem", "soc", "xdr", "elk", "observ")
BACKUP_KEYWORDS = ("veeam", "backup", "snapshot", "replica")
SUPPORT_CONTROLS_DEFAULT = {
    "antivirus": "QuantumShield EDR",
    "disk_encryption": "Full-disk AES-256",
    "vpn": "ZeroTrust VPN",
    "mfa": "FIDO2 token",
    "wifi_password": "StrongPass!2025",
    "wifi_encryption": "WPA3-Enterprise",
    "firewall": "Next-Generation Firewall",
}
SUPPORT_CONTROLS_FSTEK = {
    "antivirus": "Kaspersky Endpoint Security",
    "disk_encryption": "ViPNet Client",
    "vpn": "ViPNet TLS",
    "mfa": "Rutoken ECP",
    "wifi_password": "StrongPass!2025",
    "wifi_encryption": "WPA3-Enterprise",
    "firewall": "ViPNet Coordinator NGFW",
}
GENERAL_RECOMMENDATIONS = {
    "antivirus_missing": "Install certified endpoint protection (EDR/antivirus) on every workstation.",
    "disk_missing": "Encrypt disks on workstations and servers (full-disk AES-256).",
    "vpn_missing": "Introduce secure VPN/Zero-Trust access for remote segments.",
    "mfa_missing": "Protect privileged accounts with MFA or hardware tokens.",
    "wifi_insecure": "Switch Wi-Fi to WPA3-Enterprise and set strong passwords.",
    "password_plain": "Hash stored passwords and forbid plaintext credential storage.",
    "backup_missing": "Schedule daily offline backups stored in an isolated network.",
    "firewall_unknown": "Deploy an NGFW/WAF and document traffic segmentation.",
    "firewall_absent": "Add a perimeter firewall to separate internal segments.",
    "siem_missing": "Deploy SIEM/SOC to aggregate logs from all systems.",
    "personal_data_unprotected": "Encrypt personal data stores and restrict access to them.",
}
FSTEK_RECOMMENDATIONS = {
    "antivirus_missing": "Разверните Kaspersky Endpoint Security или другой сертифицированный ФСТЭК EDR.",
    "disk_missing": "Зашифруйте рабочие станции с помощью ViPNet Client / Secret Disk (ФСТЭК).",
    "vpn_missing": "Организуйте защищённый канал на ViPNet TLS или Континент.",
    "mfa_missing": "Включите Rutoken/JaCarta для администраторов и критичных ролей.",
    "wifi_insecure": "Настройте Wi-Fi в режиме WPA3-Enterprise с сертификатами ФСТЭК.",
    "password_plain": "Храните пароли только в зашифрованном виде и контролируйте управление ключами.",
    "backup_missing": "Настройте ежедневные оффлайн-копии с контролем ФСТЭК.",
    "firewall_unknown": "Замените МЭ на ViPNet Coordinator NGFW или аналог, имеющий сертификат.",
    "firewall_absent": "Добавьте сертифицированный ФСТЭК межсетевой экран между сегментами.",
    "siem_missing": "Разверните ФСТЭК-сертифицированный SIEM/SOC (ОКБ САПР, РусГидро и т.д.).",
    "personal_data_unprotected": "Защитите ПДн ViPNet-шифрованием и аппаратными токенами доступа.",
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
    node_dict["security_policy"] = {
        "password_hashed": True,
        "backup_frequency": "daily",
    }
    return node_dict


def apply_ideal_defaults(node_dict: Dict[str, Any], controls: Dict[str, str]) -> Dict[str, Any]:
    ideal = dict(node_dict)
    ideal["weight"] = 10.0
    ensure_security_policy(ideal)
    ideal["wifi"] = {
        "password": controls["wifi_password"],
        "encryption": controls["wifi_encryption"],
    }
    return ideal


def software_contains(values: List[str], keywords: Tuple[str, ...]) -> bool:
    normalized = [v.lower() for v in values]
    return any(any(keyword in value for keyword in keywords) for value in normalized)


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
    controls = SUPPORT_CONTROLS_FSTEK if fstec_only else SUPPORT_CONTROLS_DEFAULT

    firewall_present = any(node.type == "firewall" for node in nodes)
    siem_present = False
    backup_platform_present = False

    for node in nodes:
        ideal = apply_ideal_defaults(node.model_dump(mode="python"), controls)
        ideal.setdefault("professional_software", node.professional_software or [])
        ideal.setdefault("connections", node.connections or [])
        ideal.setdefault("encryption", node.encryption or [])

        normalized_soft = [s.lower() for s in node.professional_software or []]
        if software_contains(normalized_soft, SIEM_KEYWORDS):
            siem_present = True
        if software_contains(normalized_soft, BACKUP_KEYWORDS):
            backup_platform_present = True

        is_endpoint = node.type in ENDPOINT_TYPES

        if is_endpoint:
            if node.antivirus:
                control_adjustments += 8
                control_details.append(f"+8 {node.name}: endpoint protected")
            else:
                control_adjustments -= 12
                control_details.append(f"-12 {node.name}: antivirus missing")
                finding_texts.add("Install certified endpoint protection")
                finding_codes.add("antivirus_missing")
            ideal["antivirus"] = controls["antivirus"]

            if node.encryption:
                control_adjustments += 6
                control_details.append(f"+6 {node.name}: disk encryption enabled")
            else:
                control_adjustments -= 8
                control_details.append(f"-8 {node.name}: disk encryption missing")
                finding_texts.add("Enable disk encryption on endpoints")
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
            firewall_present = True
            if node.firewall_type:
                control_adjustments += 6
                control_details.append(f"+6 {node.name}: firewall type defined")
            else:
                control_adjustments -= 8
                control_details.append(f"-8 {node.name}: firewall class unknown")
                finding_texts.add("Deploy NGFW/WAF with proper classification")
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

        ideal_nodes.append(ideal)

    support_nodes: List[Dict[str, Any]] = []
    endpoint_ids = [node.id for node in nodes]

    if not firewall_present:
        control_adjustments -= 10
        control_details.append("-10 No perimeter firewall in the architecture")
        finding_texts.add("Add a perimeter firewall between network segments")
        finding_codes.add("firewall_absent")
        support_nodes.append({
            "id": "ideal-firewall",
            "type": "firewall",
            "name": "Ideal NGFW",
            "firewall_type": controls["firewall"],
            "weight": 10.0,
            "connections": endpoint_ids,
            "professional_software": ["Segmentation", "IPS"],
            "security_policy": {"password_hashed": True, "backup_frequency": "daily"},
        })

    if not siem_present:
        control_adjustments -= 8
        control_details.append("-8 No SIEM/SOC collecting events")
        finding_texts.add("Deploy SIEM/SOC to aggregate logs")
        finding_codes.add("siem_missing")
        support_nodes.append({
            "id": "ideal-siem",
            "type": "pc",
            "name": "Central SIEM",
            "weight": 10.0,
            "professional_software": ["Managed SIEM", "SOAR"],
            "connections": endpoint_ids,
            "security_policy": {"password_hashed": True, "backup_frequency": "daily"},
        })

    if not backup_platform_present:
        control_adjustments -= 6
        control_details.append("-6 No dedicated backup appliance")
        finding_texts.add("Deploy a dedicated backup appliance")
        finding_codes.add("backup_missing")
        support_nodes.append({
            "id": "ideal-backup",
            "type": "pc",
            "name": "Backup Appliance",
            "weight": 10.0,
            "professional_software": ["Veeam", "Snapshot"],
            "connections": endpoint_ids,
            "security_policy": {"password_hashed": True, "backup_frequency": "daily"},
        })

    if pd_sensitive and not any(node.personal_data and node.personal_data.enabled for node in nodes):
        support_nodes.append({
            "id": "ideal-pd-store",
            "type": "pc",
            "name": "Protected PD storage",
            "weight": 10.0,
            "personal_data": {"enabled": True, "count": 1000},
            "encryption": [controls["disk_encryption"]],
            "connections": endpoint_ids,
            "security_policy": {"password_hashed": True, "backup_frequency": "daily"},
        })

    ideal_nodes.extend(support_nodes)

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
    recs = [FSTEK_RECOMMENDATIONS[code] for code in finding_codes if code in FSTEK_RECOMMENDATIONS]
    if not recs:
        recs.append("Сохраняйте актуальные сертификаты ФСТЭК и подтверждайте соответствие ежегодно.")
    return recs[:10]


def build_general_recommendations(finding_codes: List[str]) -> List[str]:
    seen: List[str] = []
    for code in finding_codes:
        text = GENERAL_RECOMMENDATIONS.get(code)
        if text and text not in seen:
            seen.append(text)
    return seen


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

    user_prompt = (
        f"Текущая инфраструктура:\n{chr(10).join(nodes_desc) if nodes_desc else 'узлы отсутствуют'}\n\n"
        f"Локальная модель оценила стойкость в {metrics['value']} баллов. Проверь расчёт, при необходимости скорректируй и верни JSON строго по схеме. {extra_clause}\n"
        f"Ниже подробные данные:\n`json\n{payload_json}\n`"
    )

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

        base_recs = build_fstek_recommendations(metrics.get("finding_codes", [])) if fstec_mode else build_general_recommendations(metrics.get("finding_codes", []))

        if fstec_mode:
            recommendations = base_recs
        else:
            merged: List[str] = []
            for rec in base_recs + llm_recommendations:
                if rec and rec not in merged:
                    merged.append(rec)
            recommendations = merged[:10]

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
