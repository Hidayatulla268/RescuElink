# ==============================================================================
# RescuELINK — Autonomous Smart City Emergency Command System
# Production Multi-Stage Dockerfile (Frontend Build + FastAPI ASGI Production Runner)
# ==============================================================================

# --- Stage 1: Frontend Build ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit

COPY frontend/ ./
RUN npm run build

# --- Stage 2: Production ASGI Runtime ---
FROM python:3.12-slim AS runner

WORKDIR /app

# Install security patches & curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy built frontend assets from builder stage
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Copy backend application source
COPY backend /app/backend

# Create unprivileged application user for security hardening
RUN useradd -u 1001 -m -s /bin/bash appuser && \
    chown -R appuser:appuser /app

USER appuser

ENV PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production \
    HOST=0.0.0.0 \
    PORT=8000 \
    FRONTEND_DIST_DIR=/app/frontend/dist

EXPOSE 8000

# Docker Healthcheck targeting /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

WORKDIR /app/backend

# Run production ASGI server with multi-worker process management
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--proxy-headers", "--forwarded-allow-ips", "*"]
