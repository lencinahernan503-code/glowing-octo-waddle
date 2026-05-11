FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV DATABASE_URL=postgresql://feriant_db_user:9siUMMa467NQrmrsGGkgHxH34mVdPn0t@dpg-d80v0htckfvc73df5vug-a/feriant_db

EXPOSE 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
