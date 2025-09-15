# Docker Operations with Makefile

This Makefile provides convenient shortcuts for common Docker Compose operations in the MPP project.

## Quick Start

```bash
# See all available commands
make help

# Start development environment
make dev

# Build and restart API after code changes
make quick-rebuild SERVICE=api

# View logs for API service
make logs SERVICE=api

# Open database shell
make db-shell
```

## Common Workflows

### 🔧 **Development Workflow**

```bash
# Initial setup
make dev-clean          # Clean build and start all services

# During development
make quick-rebuild SERVICE=api    # Quick rebuild API after changes
make logs-follow SERVICE=api      # Follow API logs in real-time
make restart SERVICE=web          # Restart web service
```

### 🏗️ **Building Services**

```bash
# Build specific service
make build SERVICE=api

# Build all services
make build-all

# Force rebuild without cache (recommended for major changes)
make build-no-cache SERVICE=api
make build-no-cache-all          # Rebuild everything from scratch
```

### 📊 **Monitoring & Debugging**

```bash
# Check service status
make status

# View service info and ports
make info

# View logs
make logs SERVICE=api             # Show recent logs
make logs-follow SERVICE=api      # Follow logs in real-time
make logs-all                     # Show all services logs

# Open shell in running container
make shell SERVICE=api
```

### 🗄️ **Database Operations**

```bash
# Open PostgreSQL shell
make db-shell

# Open pgAdmin in browser
make pgadmin

# Import data using the importer service
make import-data
```

### 🧹 **Cleanup Operations**

```bash
# Stop services and remove containers
make down

# Remove containers, networks, and volumes
make clean

# Remove unused Docker images
make clean-images

# Full cleanup (containers, images, volumes)
make clean-all
```

## Service Names

The following service names can be used with the `SERVICE=` parameter:

- `api` - FastAPI backend service
- `web` - Next.js frontend service  
- `db` - PostgreSQL database
- `pgadmin` - pgAdmin web interface
- `importer` - Data import service

## Service URLs

After running `make dev` or `make up`, these services will be available:

- **API (FastAPI)**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Web (Next.js)**: http://localhost:3000
- **pgAdmin**: http://localhost:5050
- **PostgreSQL**: localhost:5432

## Examples

```bash
# Typical development session
make dev                         # Start everything
make logs-follow SERVICE=api     # Watch API logs in terminal 1
# Make code changes...
make quick-rebuild SERVICE=api   # Quick rebuild and restart API
make logs SERVICE=api            # Check if restart was successful

# Debugging database issues  
make db-shell                    # Open PostgreSQL CLI
make pgadmin                     # Open pgAdmin in browser

# Clean restart after major changes
make down                        # Stop everything
make build-no-cache-all         # Rebuild from scratch
make up                         # Start everything
```

## Tips

1. **Use tab completion**: Most shells support tab completion for make targets
2. **Combine with watch**: Use `watch make status` to monitor service status
3. **Log following**: Use `make logs-follow SERVICE=api` in a separate terminal during development
4. **Quick iterations**: `make quick-rebuild SERVICE=api` is faster than rebuilding everything
