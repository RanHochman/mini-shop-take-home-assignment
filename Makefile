.PHONY: up down logs logs-api logs-db logs-proxy logs-frontend shell-api shell-db clean rebuild build help

# Default target
help:
	@echo "Mini-Shop Development Commands"
	@echo "=============================="
	@echo ""
	@echo "  make up          - Start all services"
	@echo "  make down        - Stop all services"
	@echo "  make build       - Build all images"
	@echo "  make rebuild     - Clean rebuild everything"
	@echo "  make clean       - Remove containers, volumes, images"
	@echo ""
	@echo "  make logs        - View all logs"
	@echo "  make logs-api    - View API logs"
	@echo "  make logs-db     - View database logs"
	@echo "  make logs-proxy  - View proxy logs"
	@echo "  make logs-frontend - View frontend logs"
	@echo ""
	@echo "  make shell-api   - Shell into API container"
	@echo "  make shell-db    - Shell into DB container"
	@echo "  make shell-proxy - Shell into proxy container"
	@echo ""
	@echo "  make ps          - Show container status"
	@echo "  make config      - Show resolved compose config"
	@echo ""

# Start all services
up:
	docker-compose up --build -d
	@echo ""
	@echo "Services starting... Check status with: make ps"
	@echo "View logs with: make logs"
	@echo "Access the app at: http://localhost:8080"

# Stop all services
down:
	docker-compose down

# Build images without starting
build:
	docker-compose build

# View all logs
logs:
	docker-compose logs -f

# View specific service logs
logs-api:
	docker-compose logs -f api

logs-db:
	docker-compose logs -f db

logs-proxy:
	docker-compose logs -f proxy

logs-frontend:
	docker-compose logs -f frontend

logs-cache:
	docker-compose logs -f cache

# Shell into containers
shell-api:
	docker-compose exec api sh

shell-db:
	docker-compose exec db psql -U minishop -d minishop

shell-proxy:
	docker-compose exec proxy sh

shell-frontend:
	docker-compose exec frontend sh

# Show container status
ps:
	docker-compose ps

# Show resolved config
config:
	docker-compose config

# Clean everything
clean:
	docker-compose down -v --rmi all --remove-orphans
	@echo "Cleaned up all containers, volumes, and images"

# Rebuild from scratch
rebuild: clean
	docker-compose build --no-cache
	docker-compose up -d
	@echo ""
	@echo "Rebuilt and started all services"
	@echo "Access the app at: http://localhost:8080"

# Test API health
test-health:
	@echo "Testing API health..."
	@curl -s http://localhost:8080/api/health || echo "API not responding"

# Test database connection
test-db:
	docker-compose exec db pg_isready -U minishop -d minishop
