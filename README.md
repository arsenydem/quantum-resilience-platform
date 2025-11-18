# КОМПЛЕКС АНАЛИЗА УСТОЙЧИВОСТИ ЦИФРОВОЙ ПЛАТФОРМЫ К КВАНТОВЫМ УГРОЗАМ

Прототип веб-приложения для оценки устойчивости корпоративной инфраструктуры и блок形式-платформ к квантовым атакам (Harvest Now, Decrypt Later, алгоритмы Шора и Гровера).

### Функционал
- Веб-интерфейс с авторизацией
- Ввод топологии сети (ПК, серверы, свитчи, блокчейн-узлы)
- Настройка модели квантового нарушителя (2030/2035+/2040+)
- Анализ через LLM (Claude 3.5 / DeepSeek / Gemini)
- Оценка от 0 до 100
- Рекомендации по переходу на постквантовую защиту
- Визуальный граф атаки (React Flow)

### Скриншоты
![image](https://github.com/user-attachments/assets/xxx) ← потом добавишь

### Как запустить за 2 минуты

```bash
# Клонируем
git clone https://github.com/tvoy-login/quantum-resilience-platform.git
cd quantum-resilience-platform

# Запускаем всё одной командой (рекомендуется)
docker-compose up --build

# Или вручную:
# 1. Бэкенд
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port=8000

# 2. Фронтенд (в другом терминале)
cd frontend
npm install
npm run dev