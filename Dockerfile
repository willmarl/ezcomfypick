# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/web

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY apps/web/package.json apps/web/pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/web/ ./

# Build
RUN pnpm run build


# Stage 2: Runtime - FastAPI + serve frontend
FROM python:3.12-slim

WORKDIR /app

# Create non-root user
RUN useradd -m -u 1000 appuser

# Copy requirements
COPY apps/api/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY apps/api/ ./

# Copy built frontend from stage 1
COPY --from=frontend-build /app/web/dist ./static

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/').read()"

# Run FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
