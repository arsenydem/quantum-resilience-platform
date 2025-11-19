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

# ----------------- Модели -----------------
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
    password_policy: PasswordPolicy | None = None  # legacy поле


class ThreatModel(BaseModel):
    quantum_capability: str
    budget_usd: int
    has_error_correction: bool


class AnalysisRequest(BaseModel):
    nodes: List[NetworkNode]
    threat_model: ThreatModel


SYSTEM_PROMPT = """Ты эксперт по кибербезопасности. Всегда возвращай ТОЛЬКО валидный JSON без ```json.
Обязательный формат ответа:
{
  "score": 73,
  "summary": "Короткое описание",
  "recommendations": ["Не более 10 пунктов"],
  "attack_graph": {
    "nodes": [
      {"id": "n1", "data": {"label": "Точка долома"}, "type": "vulnerable"},
      {"id": "n2", "data": {"label": "Угроза"}, "type": "threat"}
    ],
    "edges": [
      {"id": "e1", "source": "n1", "target": "n2", "label": "вектор"}
    ]
  }
}
JSON не должен содержать дополнительных полей, если ты не уверен в их содержимом."""

ENDPOINT_TYPES = {"pc", "user"}
STRONG_WIFI_PREFIXES = ("wpa2", "wpa3")
RECOMMENDED_ANTIVIRUS = "QuantumShield EDR"
RECOMMENDED_ENCRYPTION = "Full-disk AES-256"
RECOMMENDED_WIFI = {"password": "StrongPass!2025", "encryption": "WPA3-Enterprise"}
RECOMMENDED_VPN = "ZeroTrust VPN"
RECOMMENDED_MFA = "FIDO2 token"


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
    if "password_hashed" not in policy:
        policy["password_hashed"] = True
    if not policy.get("backup_frequency"):
        policy["backup_frequency"] = "daily"
    node_dict["security_policy"] = policy
    return node_dict


def evaluate_security(nodes: List[NetworkNode]) -> Tuple[Dict[str, Any], List[Dict[str, Any]], List[Tuple[str, str]]]:
    if not nodes:
        metrics = {
            "value": 0,
            "weight_ratio": 0.0,
            "connection_ratio": 0.0,
            "control_details": [],
            "findings": [],
        }
        return metrics, [], []

    unique_edges = extract_connections(nodes)
    total_nodes = len(nodes)
    max_edges = total_nodes * (total_nodes - 1) // 2
    connection_ratio = 1.0 if max_edges == 0 else min(1.0, len(unique_edges) / max_edges) if max_edges else 1.0

    total_weight = sum((node.weight if node.weight is not None else 5.0) for node in nodes)
    max_weight = max(total_nodes * 10.0, 1.0)
    weight_ratio = min(1.0, total_weight / max_weight)

    base_weight_component = weight_ratio * 50.0
    base_connection_component = connection_ratio * 20.0

    control_adjustments = 0.0
    control_details: List[str] = [
        f"+{base_weight_component:.1f} вклад веса инфраструктуры",
        f"+{base_connection_component:.1f} вклад плотности связей",
    ]
    findings: set[str] = set()
    ideal_nodes: List[Dict[str, Any]] = []

    for node in nodes:
        ideal = node.model_dump(mode="python")
        ideal.setdefault("professional_software", node.professional_software or [])
        ideal.setdefault("connections", node.connections or [])
        ideal.setdefault("encryption", node.encryption or [])
        is_endpoint = node.type in ENDPOINT_TYPES

        if is_endpoint:
            if node.antivirus:
                control_adjustments += 8
                control_details.append(f"+8 {node.name}: установлен антивирус/EDR")
            else:
                control_adjustments -= 12
                control_details.append(f"-12 {node.name}: нет антивируса/EDR")
                findings.add("Установите EDR/антивирус на рабочие станции")
                ideal["antivirus"] = RECOMMENDED_ANTIVIRUS

            has_disk_encryption = bool(node.encryption)
            if has_disk_encryption:
                control_adjustments += 6
                control_details.append(f"+6 {node.name}: диск зашифрован")
            else:
                control_adjustments -= 8
                control_details.append(f"-8 {node.name}: отсутствует шифрование диска")
                findings.add("Включите шифрование данных на конечных устройствах")
                ideal["encryption"] = [RECOMMENDED_ENCRYPTION]

            if node.vpn:
                control_adjustments += 4
                control_details.append(f"+4 {node.name}: трафик идёт через VPN")
            else:
                control_adjustments -= 4
                control_details.append(f"-4 {node.name}: нет защищённого VPN")
                findings.add("Используйте VPN/Zero-Trust для удалённых узлов")
                ideal["vpn"] = RECOMMENDED_VPN

            auth_value = (node.auth_type or "").lower()
            has_mfa = any(keyword in auth_value for keyword in ("token", "fido", "usb", "otp", "face", "bio"))
            if has_mfa:
                control_adjustments += 6
                control_details.append(f"+6 {node.name}: настроен MFA")
            else:
                control_adjustments -= 4
                control_details.append(f"-4 {node.name}: отсутствует MFA")
                findings.add("Добавьте MFA/аппаратные токены для критичных пользователей")
                ideal["auth_type"] = RECOMMENDED_MFA
        else:
            has_mfa = False

        wifi_secure = is_wifi_secure(node.wifi)
        if node.type == "wifi_ap" or node.wifi:
            if wifi_secure:
                control_adjustments += 5
                control_details.append(f"+5 {node.name}: Wi-Fi защищён")
            else:
                control_adjustments -= 10
                control_details.append(f"-10 {node.name}: Wi-Fi небезопасен")
                findings.add("Переключите Wi-Fi на WPA3 и задайте сложный пароль")
                ideal["wifi"] = RECOMMENDED_WIFI

        policy = node.security_policy
        if policy and policy.password_hashed:
            control_adjustments += 4
            control_details.append(f"+4 {node.name}: пароли хэшируются")
        else:
            control_adjustments -= 6
            control_details.append(f"-6 {node.name}: пароли хранятся в открытом виде")
            findings.add("Включите хэширование и управление паролями")
            ideal = ensure_security_policy(ideal)

        backup_freq = normalize_backup((policy.backup_frequency if policy else None))
        if backup_freq == "daily":
            control_adjustments += 7
            control_details.append(f"+7 {node.name}: ежедневные резервные копии")
        elif backup_freq == "weekly":
            control_adjustments += 5
            control_details.append(f"+5 {node.name}: еженедельные резервные копии")
        elif backup_freq == "monthly":
            control_adjustments += 3
            control_details.append(f"+3 {node.name}: ежемесячные резервные копии")
        else:
            control_adjustments -= 10
            control_details.append(f"-10 {node.name}: отсутствует стратегия резервного копирования")
            findings.add("Настройте регулярные резервные копии")
            ideal = ensure_security_policy(ideal)

        if node.type == "firewall":
            if node.firewall_type:
                control_adjustments += 6
                control_details.append(f"+6 {node.name}: указан класс межсетевого экрана")
            else:
                control_adjustments -= 8
                control_details.append(f"-8 {node.name}: неизвестен тип межсетевого экрана")
                findings.add("Определите и задокументируйте класс МЭ")
                ideal["firewall_type"] = "Next-Generation Firewall"

        if node.personal_data and node.personal_data.enabled:
            if node.encryption or wifi_secure or has_mfa:
                control_adjustments += 3
                control_details.append(f"+3 {node.name}: данные клиентов защищены")
            else:
                control_adjustments -= 12
                control_details.append(f"-12 {node.name}: персональные данные без защиты")
                findings.add("Зашифруйте и ограничьте доступ к персональным данным")
                ideal["encryption"] = ideal.get("encryption") or [RECOMMENDED_ENCRYPTION]
                ideal["auth_type"] = ideal.get("auth_type") or RECOMMENDED_MFA

        current_weight = node.weight if node.weight is not None else 5.0
        ideal["weight"] = min(10.0, current_weight + 2.0)
        ideal_nodes.append(ideal)

    topology_bonus = 0.0
    if total_nodes > 2:
        if connection_ratio >= 0.6:
            topology_bonus = 5.0
        elif connection_ratio < 0.2:
            topology_bonus = -5.0
    if topology_bonus:
        control_adjustments += topology_bonus
        control_details.append(f"{topology_bonus:+} за топологию сети")

    total_score = clamp(base_weight_component + base_connection_component + control_adjustments)
    metrics = {
        "value": round(total_score),
        "weight_ratio": round(weight_ratio, 2),
        "connection_ratio": round(connection_ratio, 2),
        "control_details": control_details,
        "topology_bonus": topology_bonus,
        "findings": sorted(findings),
    }
    return metrics, ideal_nodes, unique_edges


@app.post("/api/analyze")
async def analyze(request: AnalysisRequest):
    metrics, ideal_nodes, connection_pairs = evaluate_security(request.nodes)
    nodes_desc = []
    for node in request.nodes:
        nodes_desc.append(
            f"- {node.name} ({node.type}), вес={node.weight or 'n/a'}, AV={'да' if node.antivirus else 'нет'}, VPN={'да' if node.vpn else 'нет'}, связей={len(node.connections)}"
        )

    payload = {
        "local_score": metrics,
        "nodes": [node.model_dump(mode="python") for node in request.nodes],
        "ideal_nodes": ideal_nodes,
        "connections": [{"source": a, "target": b} for a, b in connection_pairs],
        "threat_model": request.threat_model.model_dump(),
    }
    payload_json = json.dumps(payload, ensure_ascii=False, indent=2)

    user_prompt = f"""Текущая инфраструктура (кратко):
{chr(10).join(nodes_desc) if nodes_desc else 'узлы отсутствуют'}

Локальная модель оценила устойчивость в {metrics['value']} баллов. Проверь расчёт, при необходимости скорректируй и верни JSON строго по схеме из системного промпта. Ниже полный набор данных:
```json
{payload_json}
```"""

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
        print("\n=== RAW ОТВЕТ LLM ===\n", raw, "\n======================\n")

        json_match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not json_match:
            raise ValueError("JSON не найден в ответе модели")

        data = json.loads(json_match.group(0))

        score = int(data.get("score", metrics["value"]))
        summary = str(data.get("summary", "Описание отсутствует"))
        recommendations = data.get("recommendations", [])
        if not isinstance(recommendations, list):
            recommendations = [str(recommendations)]
        attack_graph = data.get("attack_graph", {"nodes": [], "edges": []})

        result = {
            "score": score,
            "summary": summary,
            "recommendations": recommendations[:10],
            "attack_graph": attack_graph,
            "local_score": metrics,
            "ideal_nodes": ideal_nodes,
        }

        if "ideal_graph" in data:
            result["ideal_graph"] = data["ideal_graph"]

        return result

    except Exception as e:
        print("ОШИБКА:", str(e))
        raise HTTPException(status_code=500, detail=f"LLM упрямится: {str(e)}")


@app.get("/")
def root():
    return {"status": "ok", "message": "Quantum Resilience API работает"}
