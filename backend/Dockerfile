FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Flask'ın Cloud Run portunda (8080) çalışması için:
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app