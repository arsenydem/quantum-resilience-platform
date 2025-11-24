FROM python:3.11-slim

# Чтобы питон не создавал .pyc и выводил сразу лог
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Сначала зависимости
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Потом код
COPY . .

# Запуск uvicorn-сервера
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
