# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /build
COPY tenderpilot/frontend/package*.json ./
RUN npm install
COPY tenderpilot/frontend/ ./
RUN npm run build

# Stage 2: Python production application
FROM python:3.12-slim
WORKDIR /app

# Install system dependencies (including libpq for PostgreSQL/Rumptycloud support)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copy project source code (which now includes pre-built static/ assets as well)
COPY . .

# Copy compiled frontend assets to both locations for bulletproof serving
COPY --from=frontend-builder /build/dist /app/tenderpilot/frontend/dist
COPY --from=frontend-builder /build/dist /app/static

# Create storage directories
RUN mkdir -p storage/documents storage/drafts

ENV PORT=8000
EXPOSE 8000

# Bind dynamically to Rumptycloud's $PORT environment variable, defaulting to 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
