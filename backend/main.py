from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Any
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

class NetworkNode(BaseModel):
    id: str
    type: str
    name: str
    os: str | None = None
    antivirus: str = ""
    professional_software: List[str] = []
    password_policy: PasswordPolicy | None = None

class ThreatModel(BaseModel):
    quantum_capability: str
    budget_usd: int
    has_error_correction: bool

class AnalysisRequest(BaseModel):
    nodes: List[NetworkNode]
    threat_model: ThreatModel

# ----------------- Жёсткий промпт -----------------
SYSTEM_PROMPT = """Ты эксперт по квантовым угрозам.
Ответь ТОЛЬКО валидным JSON (без ```json, без лишнего текста) строго по схеме:

{
  "score": 73,
  "summary": "Инфраструктура имеет средний уровень защиты от квантовых атак.",
  "recommendations": [
    "Перейти на постквантовые алгоритмы Kyber/Dilithium",
    "Увеличить длину паролей до 20+ символов",
    "Заменить RSA/ECC на PQC"
  ],
  "attack_graph": {
    "nodes": [
      {"id": "n1", "data": {"label": "Сервер 1"}, "type": "vulnerable"},
      {"id": "n2", "data": {"label": "Слабые пароли"}, "type": "threat"}
    ],
    "edges": [
      {"id": "e1", "source": "n1", "target": "n2", "label": "Атака Гровера"}
    ]
  }
}

Всегда рассчитывай итоговый балл S_total по формуле с жёсткими штрафами:

S_total = [(W_узлы·S_узлы + W_сеть·S_сеть + W_аут·S_аут + W_политики·S_политики) / (W_узлы + W_сеть + W_аут + W_политики)] × K_штраф

K_штраф = K_крит × K_актуальность × K_квант. Каждый K в диапазоне 0.0–1.0, штрафы перемножаются.

K_крит (любой триггер снижает значение):
• Аутентификация < 50 → ×0.3
• Шифрование < 40 → ×0.4
• Wi-Fi протокол < 60 → ×0.5
• Антивирус = 0 → ×0.2
• Файрволл = 0 → ×0.6

K_актуальность:
• Критичные обновления ОС не устанавливались >6 месяцев → ×0.3
• Базы антивируса >1 месяца → ×0.5
• Используются TLS 1.0 / SSL → ×0.4

K_квант:
• Классическая криптография (RSA-2048, ECC-256) без PQC → ×0.5
• Нет плана миграции на PQC → ×0.7
• Используются только симметричные алгоритмы → ×0.6

Дополнительный штраф: отсутствие резервного копирования → ×0.7, отсутствие VPN при необходимости удалённого доступа → ×0.7.

Минимальный порог безопасности: если отсутствует шифрование данных, используется WEP/WPA, нет антивируса, парольная политика <8 символов без требований, либо отсутствует аутентификация — итоговая оценка не может превышать 30, независимо от остальных расчётов.

Шкала:
• 90–100 — Высокая устойчивость (включая квантовую)
• 70–89 — Хорошая защита (требуется миграция на PQC)
• 50–69 — Приемлемый уровень (нужны значимые улучшения)
• 30–49 — Низкая безопасность (критические риски)
• 10–29 — Опасный уровень (немедленное вмешательство)
• 0–9 — Катастрофическая уязвимость

Примеры негативных кейсов:
• «Слабое звено»: 68.6 × 0.3 × 0.7 = 14.4
• «Фасад соответствия»: 59.2 × 0.5 × 0.3 × 0.8 × 0.7 = 4.97
• «Квантовая уязвимость»: 91.5 × 0.5 × 0.7 = 32.0

Сначала оцени базовые подсистемы (S_узлы, S_сеть, S_аут, S_политики), затем рассчитай штрафы и приведи итоговый `score` с учётом всех ограничений."""

@app.post("/api/analyze")
async def analyze(request: AnalysisRequest):
    # Формируем описание инфраструктуры
    nodes_desc = []
    for n in request.nodes:
        os_name = n.os or "не указана"
        antivirus = n.antivirus or "нет"
        
        pwd = f" (пароль ≥{n.password_policy.min_length} симв.)" if n.password_policy else ""
        soft = ", ".join(n.professional_software) if n.professional_software else "нет"
        nodes_desc.append(f"• {n.name} ({n.type}): {n.os}, антивирус: {n.antivirus or 'нет'}, ПО: {soft}{pwd}")

    user_prompt = f"""Инфраструктура:
{chr(10).join(nodes_desc)}

Модель нарушителя:
— {request.threat_model.quantum_capability}
— Бюджет ${request.threat_model.budget_usd:,}
— Полная коррекция ошибок: {'да' if request.threat_model.has_error_correction else 'нет'}

Напомню: используй формулу S_total с жёсткими штрафами (K_крит, K_актуальность, K_квант + дополнительные ограничения), не превышай порог 30 при отсутствии базовых мер. Дай оценку и верни ТОЛЬКО JSON по схеме выше."""

    try:
        response = client.chat.completions.create(
            model="deepseek/deepseek-v3.2-exp",   # самая послушная
            # model="openai/o1-mini",                       # тоже отлично
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1,
            max_tokens=3000,
        )

        raw = response.choices[0].message.content.strip()
        print("\n=== RAW ОТВЕТ LLM ===\n", raw, "\n======================\n")

        # Ищем JSON даже если там мусор до/после
        json_match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not json_match:
            raise ValueError("JSON не найден в ответе модели")

        data = json.loads(json_match.group(0))

        # Защита от кривых полей
        result = {
            "score": int(data.get("score", 0)),
            "summary": str(data.get("summary", "Нет описания")),
            "recommendations": data.get("recommendations", [])[:10],
            "attack_graph": data.get("attack_graph", {"nodes": [], "edges": []})
        }
        return result

    except Exception as e:
        print("ОШИБКА:", str(e))
        raise HTTPException(status_code=500, detail=f"LLM упрямится: {str(e)}")

@app.get("/")
def root():
    return {"status": "ok", "message": "Quantum Resilience API работает"}