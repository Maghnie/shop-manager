.PHONY: help build up down restart logs clean test migrate shell db-shell backup-local backup-docker restore-backup migrate-local check-ports

# Default target
help:
	@echo "Shop Manager Docker Commands"
	@echo "============================"
	@echo ""
	@echo "Development:"
	@echo "  make check-ports   - Check if required ports are available"
	@echo "  make build          - Build all Docker images"
	@echo "  make up            - Start all services in development mode"
	@echo "  make down          - Stop all services"
	@echo "  make restart       - Restart all services"
	@echo "  make logs          - View logs from all services"
	@echo "  make logs-backend  - View backend logs"
	@echo "  make logs-frontend - View frontend logs"
	@echo ""
	@echo "Database:"
	@echo "  make migrate          - Run Django migrations"
	@echo "  make shell            - Open Django shell"
	@echo "  make db-shell         - Open PostgreSQL shell"
	@echo ""
	@echo "Backup & Restore:"
	@echo "  make backup-local     - Backup local PostgreSQL to file"
	@echo "  make backup-docker    - Backup Docker database to file"
	@echo "  make restore-backup   - Restore backup to Docker (requires BACKUP=path)"
	@echo "  make migrate-local    - Full migration: backup local → restore to Docker"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean         - Stop services and remove volumes"
	@echo "  make clean-all     - Clean everything including images"
	@echo "  make test          - Run tests"
	@echo ""
	@echo "Production:"
	@echo "  make prod-build    - Build production images"
	@echo "  make prod-up       - Start production services"
	@echo "  make prod-down     - Stop production services"

# Development commands
check-ports:
	@echo "🔍 Checking port availability..."
	@echo ""
	@echo "Loading port configuration from .env..."
	@if [ -f .env ]; then \
		. ./.env; \
		FRONTEND=$${FRONTEND_PORT:-5173}; \
		BACKEND=$${BACKEND_PORT:-8000}; \
		POSTGRES=$${POSTGRES_PORT:-5432}; \
		REDIS=$${REDIS_PORT:-6379}; \
	else \
		echo "⚠️  Warning: .env file not found, using defaults"; \
		FRONTEND=5173; \
		BACKEND=8000; \
		POSTGRES=5432; \
		REDIS=6379; \
	fi; \
	echo ""; \
	echo "Checking ports:"; \
	echo "  • Frontend (Vite):     $$FRONTEND"; \
	echo "  • Backend (Django):    $$BACKEND"; \
	echo "  • PostgreSQL:          $$POSTGRES"; \
	echo "  • Redis:               $$REDIS"; \
	echo ""; \
	ALL_OK=true; \
	if command -v netstat > /dev/null 2>&1; then \
		for port in $$FRONTEND $$BACKEND $$POSTGRES $$REDIS; do \
			if netstat -an 2>/dev/null | grep -q ":$$port.*LISTEN"; then \
				echo "❌ Port $$port is IN USE"; \
				ALL_OK=false; \
			else \
				echo "✅ Port $$port is available"; \
			fi; \
		done; \
	elif command -v ss > /dev/null 2>&1; then \
		for port in $$FRONTEND $$BACKEND $$POSTGRES $$REDIS; do \
			if ss -tuln 2>/dev/null | grep -q ":$$port "; then \
				echo "❌ Port $$port is IN USE"; \
				ALL_OK=false; \
			else \
				echo "✅ Port $$port is available"; \
			fi; \
		done; \
	else \
		echo "⚠️  Cannot check ports: netstat/ss not available"; \
	fi; \
	echo ""; \
	if [ "$$ALL_OK" = "true" ]; then \
		echo "✅ All ports are available!"; \
	else \
		echo ""; \
		echo "💡 Solutions:"; \
		echo "  1. Stop the services using those ports"; \
		echo "  2. Change ports in your .env file:"; \
		echo "     • FRONTEND_PORT (alternatives: 5174, 3000, 3001, 8080)"; \
		echo "     • BACKEND_PORT (alternatives: 8001, 8080, 8888, 9000)"; \
		echo "     • POSTGRES_PORT (alternatives: 5433, 5434, 54320)"; \
		echo "     • REDIS_PORT (alternatives: 6380, 6381, 63790)"; \
		echo ""; \
		exit 1; \
	fi

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f db

# Database commands
migrate:
	docker-compose exec backend python manage.py migrate

makemigrations:
	docker-compose exec backend python manage.py makemigrations

shell:
	docker-compose exec backend python manage.py shell

db-shell:
	docker-compose exec db psql -U postgres -d shop_db

db-backup:
	@echo "Creating database backup..."
	@docker-compose exec -T db pg_dump -U postgres shop_db > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup created: backup_$$(date +%Y%m%d_%H%M%S).sql"

# Backup and Restore commands (Windows PowerShell compatible)
backup-local:
	@echo "🔄 Running local PostgreSQL backup..."
	@powershell -ExecutionPolicy Bypass -File ./scripts/backup-local.ps1

backup-docker:
	@echo "🔄 Running Docker database backup..."
	@powershell -ExecutionPolicy Bypass -File ./scripts/backup-docker.ps1

restore-backup:
	@if [ -z "$(BACKUP)" ]; then \
		echo "❌ ERROR: Please specify backup file with BACKUP=path"; \
		echo "Example: make restore-backup BACKUP=./backups/backup_local_20240101_120000.sql"; \
		exit 1; \
	fi
	@echo "🔄 Restoring backup to Docker..."
	@powershell -ExecutionPolicy Bypass -File ./scripts/restore-to-docker.ps1 -BackupFile "$(BACKUP)"

migrate-local:
	@echo "🔄 Starting full migration: Local PostgreSQL → Docker"
	@echo ""
	@echo "Step 1: Backing up local PostgreSQL..."
	@powershell -ExecutionPolicy Bypass -File ./scripts/backup-local.ps1 > backup_migration.log 2>&1
	@if [ $$? -ne 0 ]; then \
		echo "❌ Backup failed! Check backup_migration.log"; \
		exit 1; \
	fi
	@echo "✅ Backup complete"
	@echo ""
	@echo "Step 2: Finding latest backup..."
	@LATEST_BACKUP=$$(ls -t ./backups/backup_local_*.sql 2>/dev/null | head -n1); \
	if [ -z "$$LATEST_BACKUP" ]; then \
		echo "❌ No backup file found!"; \
		exit 1; \
	fi; \
	echo "Found: $$LATEST_BACKUP"; \
	echo ""; \
	echo "Step 3: Restoring to Docker..."; \
	powershell -ExecutionPolicy Bypass -File ./scripts/restore-to-docker.ps1 -BackupFile "$$LATEST_BACKUP"

# Testing
test:
	docker-compose exec backend python manage.py test

test-frontend:
	docker-compose exec frontend npm test

# Maintenance
clean:
	docker-compose down -v

clean-all:
	docker-compose down -v --rmi all
	docker system prune -a --volumes -f

# Production commands
prod-build:
	docker-compose -f docker-compose.prod.yml build

prod-up:
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.prod.yml down

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f

# Utility commands
ps:
	docker-compose ps

exec-backend:
	docker-compose exec backend bash

exec-frontend:
	docker-compose exec frontend sh

collectstatic:
	docker-compose exec backend python manage.py collectstatic --noinput

createsuperuser:
	docker-compose exec backend python manage.py createsuperuser

flush-cache:
	docker-compose exec redis redis-cli FLUSHALL
