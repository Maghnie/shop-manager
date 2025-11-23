# Backend Dockerfile for Django application
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    postgresql-client \
    gettext \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install Python dependencies
# Copy requirements.txt from project root
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && \
    pip install -r /app/requirements.txt && \
    pip install gunicorn

# Copy backend project files
COPY backend/ .

# Copy entrypoint script (it's inside backend/)
# Already copied above with backend/ directory

# Create necessary directories
RUN mkdir -p /app/staticfiles /app/media

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

# Create non-root user
RUN useradd -m -u 1000 django && \
    chown -R django:django /app
USER django

# Set entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/api/', timeout=5)" || exit 1

# Default command (can be overridden in docker-compose)
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--threads", "2", "--timeout", "60", "--access-logfile", "-", "--error-logfile", "-"]
