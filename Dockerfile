# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend (Python)
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy frontend build to /frontend/dist (as expected by app/main.py)
COPY --from=frontend-builder /app/frontend/dist /frontend/dist

# Ensure storage directory exists
RUN mkdir -p /app/storage

EXPOSE 8000

# Command to run the application
# We run the migration script first to ensure database columns like parent_id are present
CMD ["sh", "-c", "python scripts/migrate_subtasks.py && python scripts/migrate_to_istmo.py && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"]
