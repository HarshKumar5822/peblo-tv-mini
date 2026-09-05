FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/pyproject.toml ./
RUN pip install --no-cache-dir fastapi uvicorn sqlalchemy pydantic pydantic-settings pillow pytest httpx python-multipart psycopg2-binary

COPY backend/ ./app/
COPY seed_shows.json ./
COPY reference.json ./
COPY assets/ ./assets/

EXPOSE 8000

CMD ["sh", "-c", "python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
