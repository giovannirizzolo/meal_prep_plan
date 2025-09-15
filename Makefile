# Makefile for MPP (Meal Prep Planner) Docker operations

.PHONY: help build build-all build-no-cache build-no-cache-all up down restart logs clean dev test db-reset

# Default target
help:
	@echo "Available commands:"
	@echo ""
	@echo "  General startup commands:"
	@echo "    start		- Build no cache and starts up all the services (make build-no-cache-all && make up)"
	@echo ""
	@echo "  Build commands:"
	@echo "    build SERVICE=<name>     - Build a specific service"
	@echo "    build-all                - Build all services"
	@echo "    build-no-cache SERVICE=<name> - Build a specific service without cache"
	@echo "    build-no-cache-all       - Build all services without cache"
	@echo ""
	@echo "  Container management:"
	@echo "    up                       - Start all services"
	@echo "    down                     - Stop all services"
	@echo "    restart SERVICE=<name>   - Restart a specific service"
	@echo "    restart-all              - Restart all services"
	@echo ""
	@echo "  Logging and debugging:"
	@echo "    logs SERVICE=<name>      - Show logs for a specific service"
	@echo "    logs-all                 - Show logs for all services"
	@echo "    logs-follow SERVICE=<name> - Follow logs for a specific service"
	@echo ""
	@echo "  Development:"
	@echo "    dev                      - Start development environment (build + up)"
	@echo "    dev-clean                - Clean rebuild and start (no cache)"
	@echo "    shell SERVICE=<name>     - Open shell in running container"
	@echo ""
	@echo "  Cleanup:"
	@echo "    clean                    - Remove containers, networks, and volumes"
	@echo "    clean-images             - Remove unused images"
	@echo "    clean-all                - Full cleanup (containers, images, volumes)"
	@echo ""
	@echo "  Database:"
	@echo "    db-shell                 - Open PostgreSQL shell"
	@echo "    db-reset                 - Reset database (WARNING: deletes all data)"
	@echo "    pgadmin                  - Open pgAdmin in browser"
	@echo ""
	@echo "  Services: api, web, db, pgadmin, importer"
	@echo ""
	@echo "Examples:"
	@echo "  make build SERVICE=api"
	@echo "  make build-no-cache SERVICE=web"
	@echo "  make restart SERVICE=db"
	@echo "  make logs SERVICE=api"

# General startup commands
start:
	make build-no-cache-all && make up

# Build commands
build:
	@if [ -z "$(SERVICE)" ]; then \
		echo "Error: Please specify SERVICE=<name>"; \
		echo "Available services: api, web, db, pgadmin, importer"; \
		exit 1; \
	fi
	docker compose build $(SERVICE)

build-all:
	docker compose build

build-no-cache:
	@if [ -z "$(SERVICE)" ]; then \
		echo "Error: Please specify SERVICE=<name>"; \
		echo "Available services: api, web, db, pgadmin, importer"; \
		exit 1; \
	fi
	docker compose build --no-cache $(SERVICE)

build-no-cache-all:
	docker compose build --no-cache

# Container management
up:
	docker compose up -d

down:
	docker compose down

restart:
	@if [ -z "$(SERVICE)" ]; then \
		echo "Error: Please specify SERVICE=<name>"; \
		echo "Available services: api, web, db, pgadmin, importer"; \
		exit 1; \
	fi
	docker compose restart $(SERVICE)

restart-all:
	docker compose restart

# Logging
logs:
	@if [ -z "$(SERVICE)" ]; then \
		echo "Error: Please specify SERVICE=<name>"; \
		echo "Available services: api, web, db, pgadmin, importer"; \
		exit 1; \
	fi
	docker compose logs $(SERVICE)

logs-all:
	docker compose logs

logs-follow:
	@if [ -z "$(SERVICE)" ]; then \
		echo "Error: Please specify SERVICE=<name>"; \
		echo "Available services: api, web, db, pgadmin, importer"; \
		exit 1; \
	fi
	docker compose logs -f $(SERVICE)

# Development shortcuts
dev: build-all up
	@echo "Development environment started!"
	@echo "API: http://localhost:8000"
	@echo "Web: http://localhost:3000"
	@echo "pgAdmin: http://localhost:5050"

dev-clean: build-no-cache-all up
	@echo "Clean development environment started!"

shell:
	@if [ -z "$(SERVICE)" ]; then \
		echo "Error: Please specify SERVICE=<name>"; \
		echo "Available services: api, web, db, pgadmin, importer"; \
		exit 1; \
	fi
	docker compose exec $(SERVICE) /bin/sh

# Database operations
db-shell:
	docker compose exec db psql -U mpp -d mpp

db-reset:
	@echo "Resetting database (this will delete all data)..."
	@echo "Stopping services..."
	docker compose down
	@echo "Removing database volume..."
	docker volume rm mpp_db_data 2>/dev/null || true
	@echo "Starting services..."
	docker compose up -d db
	@echo "Waiting for database to be ready..."
	sleep 10
	@echo "Starting all services..."
	docker compose up -d
	@echo "Database reset complete!"

pgadmin:
	@echo "Opening pgAdmin..."
	@echo "URL: http://localhost:5050"
	@echo "Login: admin@example.com / admin"
	@which xdg-open > /dev/null && xdg-open http://localhost:5050 || \
	which open > /dev/null && open http://localhost:5050 || \
	echo "Please open http://localhost:5050 manually"

# Cleanup commands
clean:
	docker compose down --volumes --remove-orphans

clean-images:
	docker image prune -f

clean-all: clean
	docker system prune -af --volumes

# Status and info
status:
	docker compose ps

info:
	@echo "MPP (Meal Prep Planner) Services:"
	@echo "=================================="
	@docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@echo "Volumes:"
	@docker volume ls --filter name=mpp

# Test commands (for future use)
test:
	@echo "Running tests..."
	docker compose exec api python -m pytest || echo "Tests not configured yet"

test-api:
	docker compose exec api python -m pytest

# Quick rebuild and restart specific service
quick-rebuild:
	@if [ -z "$(SERVICE)" ]; then \
		echo "Error: Please specify SERVICE=<name>"; \
		exit 1; \
	fi
	docker compose build --no-cache $(SERVICE) && docker compose up -d $(SERVICE)
	@echo "Service $(SERVICE) rebuilt and restarted!"

# Import data (runs importer)
import-data:
	docker compose run --rm importer

# Show URLs
urls:
	@echo "Service URLs:"
	@echo "============="
	@echo "API (FastAPI): http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"
	@echo "Web (Next.js): http://localhost:3000"
	@echo "pgAdmin: http://localhost:5050"
	@echo "PostgreSQL: localhost:5432"
