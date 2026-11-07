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

# Copy project source code
COPY . .

# Create storage and mockup directories
RUN mkdir -p storage/documents storage/drafts

ENV PORT=8000
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
