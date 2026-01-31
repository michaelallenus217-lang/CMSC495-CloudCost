FROM python:3.12-slim

WORKDIR /app

# --- OS deps + Microsoft ODBC Driver 18 (Azure SQL) ---
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl gnupg2 ca-certificates apt-transport-https \
    unixodbc unixodbc-dev \
  && curl -sSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /usr/share/keyrings/microsoft.gpg \
  && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" \
     > /etc/apt/sources.list.d/microsoft-prod.list \
  && apt-get update \
  && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 \
  && rm -rf /var/lib/apt/lists/*


# --- Python deps (copy first for build cache) ---
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


# --- App code ---
COPY . /app/backend
ENV PYTHONPATH=/app
EXPOSE 5000
CMD ["gunicorn", "-b", "0.0.0.0:5000", "backend.wsgi:app"]
