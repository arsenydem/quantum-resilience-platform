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
    os: str
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
"""

@app.post("/api/analyze")
async def analyze(request: AnalysisRequest):
    # Формируем описание инфраструктуры
    nodes_desc = []
    for n in request.nodes:
        pwd = f" (пароль ≥{n.password_policy.min_length} симв.)" if n.password_policy else ""
        soft = ", ".join(n.professional_software) if n.professional_software else "нет"
        nodes_desc.append(f"• {n.name} ({n.type}): {n.os}, антивирус: {n.antivirus or 'нет'}, ПО: {soft}{pwd}")

    user_prompt = f"""Инфраструктура:
{chr(10).join(nodes_desc)}

Модель нарушителя:
— {request.threat_model.quantum_capability}
— Бюджет ${request.threat_model.budget_usd:,}
— Полная коррекция ошибок: {'да' if request.threat_model.has_error_correction else 'нет'}

Дай оценку и верни ТОЛЬКО JSON по схеме выше."""

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