#!/bin/bash

# UFOBeep Platform Deployment Script
# Usage: ./deploy.sh [command]
# Commands: start, stop, restart, fresh, logs, status, build, migrate

set -e

# Configuration
COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="ufobeep"
BACKEND_DIR="."
FRONTEND_DIR="frontend"
ENV_FILE=".env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker and Docker Compose are installed
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_success "Dependencies check passed"
}

# Create environment file if it doesn't exist
setup_env() {
    if [[ ! -f "$ENV_FILE" ]]; then
        log_warning "Environment file not found. Creating default .env file..."
        cat > "$ENV_FILE" << EOF
# Database Configuration
POSTGRES_DB=ufobeep
POSTGRES_USER=ufobeep_user
POSTGRES_PASSWORD=secure_password_change_this
DATABASE_URL=postgresql://ufobeep_user:secure_password_change_this@postgres:5432/ufobeep

# Redis Configuration
REDIS_URL=redis://redis:6379

# Application Configuration
NODE_ENV=production
PORT=3000
JWT_SECRET=your_super_secure_jwt_secret_change_this
JWT_EXPIRES_IN=24h

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Admin Configuration
ADMIN_EMAIL=admin@ufobeep.com
ADMIN_PASSWORD=change_this_admin_password

# Frontend Configuration
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000

# Geolocation API (Optional)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EOF
        log_warning "Please update the .env file with your actual configuration values!"
        log_warning "Especially change the default passwords and secrets!"
    fi
}

# Build the application
build_app() {
    log_info "Building application..."
    
    # Build backend
    log_info "Installing backend dependencies..."
    if [[ -f "package-lock.json" ]]; then
        npm ci
    else
        npm install
        log_warning "Generated package-lock.json for faster future builds"
    fi
    
    # Build frontend
    log_info "Building frontend..."
    cd "$FRONTEND_DIR"
    if [[ -f "package-lock.json" ]]; then
        npm ci
    else
        npm install
        log_warning "Generated package-lock.json for faster future builds"
    fi
    npm run build
    cd ..
    
    log_success "Application built successfully"
}

# Start the services
start_services() {
    local dev_mode=${1:-false}
    local compose_files="-f docker-compose.yml"
    
    if [[ "$dev_mode" == "true" ]]; then
        log_info "Starting UFOBeep services in development mode..."
        compose_files="-f docker-compose.yml -f docker-compose.override.yml"
    else
        log_info "Starting UFOBeep services in production mode..."
    fi
    
    # Start database and cache services first
    docker-compose $compose_files up -d postgres redis
    
    log_info "Waiting for database to be ready..."
    sleep 10
    
    # Run database migrations
    migrate_database "$compose_files"
    
    # Start all services
    docker-compose $compose_files up -d
    
    if [[ "$dev_mode" == "true" ]]; then
        log_success "All services started in development mode"
        log_info "Development features enabled:"
        log_info "  - Hot reloading for backend and frontend"
        log_info "  - Debug port 9229 exposed for Node.js debugging"
        log_info "  - Volume mounts for live code updates"
    else
        log_success "All services started in production mode"
    fi
    
    show_status
}

# Start development services
start_dev() {
    start_services true
}

# Stop the services
stop_services() {
    log_info "Stopping UFOBeep services..."
    # Stop both production and development services
    docker-compose -f docker-compose.yml -f docker-compose.override.yml down 2>/dev/null || true
    docker-compose down
    log_success "All services stopped"
}

# Restart the services
restart_services() {
    log_info "Restarting UFOBeep services..."
    stop_services
    sleep 2
    start_services
}

# Fresh deployment (rebuild everything)
fresh_deploy() {
    log_warning "Performing fresh deployment..."
    log_warning "This will remove all existing data and containers!"
    
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Fresh deployment cancelled"
        exit 0
    fi
    
    log_info "Stopping and removing all containers..."
    docker-compose down -v --remove-orphans
    
    log_info "Removing old images..."
    docker-compose build --no-cache
    
    log_info "Building application..."
    build_app
    
    log_info "Starting fresh deployment..."
    start_services
    
    log_success "Fresh deployment completed!"
}

# Run database migrations
migrate_database() {
    local compose_files=${1:-"-f docker-compose.yml"}
    log_info "Setting up database schema..."
    
    # Check if we're in development mode
    if [[ "$compose_files" == *"override"* ]]; then
        log_info "Development mode: Using db push for faster setup..."
        # Use db push for development (faster, no migration files needed)
        if docker-compose $compose_files ps backend | grep -q "Up"; then
            docker-compose $compose_files exec backend npx prisma db push --accept-data-loss
            docker-compose $compose_files exec backend npx prisma db seed || log_warning "Seeding skipped (may not exist)"
        else
            docker-compose $compose_files run --rm backend npx prisma db push --accept-data-loss
            docker-compose $compose_files run --rm backend npx prisma db seed || log_warning "Seeding skipped (may not exist)"
        fi
    else
        log_info "Production mode: Using migrations..."
        # Use migrations for production
        if docker-compose $compose_files ps backend | grep -q "Up"; then
            docker-compose $compose_files exec backend npx prisma migrate deploy
            docker-compose $compose_files exec backend npx prisma db seed || log_warning "Seeding skipped (may not exist)"
        else
            docker-compose $compose_files run --rm backend npx prisma migrate deploy
            docker-compose $compose_files run --rm backend npx prisma db seed || log_warning "Seeding skipped (may not exist)"
        fi
    fi
    
    log_success "Database setup completed"
}

# Show service logs
show_logs() {
    local service=${2:-""}
    if [[ -n "$service" ]]; then
        log_info "Showing logs for $service..."
        docker-compose logs -f "$service"
    else
        log_info "Showing logs for all services..."
        docker-compose logs -f
    fi
}

# Show service status
show_status() {
    log_info "Service Status:"
    echo
    docker-compose ps
    echo
    
    # Check if services are healthy
    local backend_status=$(docker-compose ps backend | grep -o "Up\|Exit")
    local frontend_status=$(docker-compose ps frontend | grep -o "Up\|Exit")
    local postgres_status=$(docker-compose ps postgres | grep -o "Up\|Exit")
    local redis_status=$(docker-compose ps redis | grep -o "Up\|Exit")
    
    echo "Service Health Check:"
    [[ "$backend_status" == "Up" ]] && echo -e "  Backend:  ${GREEN}✓ Running${NC}" || echo -e "  Backend:  ${RED}✗ Not Running${NC}"
    [[ "$frontend_status" == "Up" ]] && echo -e "  Frontend: ${GREEN}✓ Running${NC}" || echo -e "  Frontend: ${RED}✗ Not Running${NC}"
    [[ "$postgres_status" == "Up" ]] && echo -e "  Database: ${GREEN}✓ Running${NC}" || echo -e "  Database: ${RED}✗ Not Running${NC}"
    [[ "$redis_status" == "Up" ]] && echo -e "  Redis:    ${GREEN}✓ Running${NC}" || echo -e "  Redis:    ${RED}✗ Not Running${NC}"
    echo
    
    if [[ "$backend_status" == "Up" && "$frontend_status" == "Up" ]]; then
        echo -e "${GREEN}🚀 UFOBeep Platform is running!${NC}"
        echo -e "   Frontend: http://localhost:3000"
        echo -e "   Backend:  http://localhost:3001/api"
        echo -e "   Admin:    http://localhost:3000/admin"
        echo
        echo "Run './health-check.sh' for detailed health monitoring"
    fi
}

# Backup database
backup_database() {
    log_info "Creating database backup..."
    
    local backup_dir="./backups"
    local backup_file="ufobeep_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p "$backup_dir"
    
    docker-compose exec postgres pg_dump -U ufobeep_user -d ufobeep > "$backup_dir/$backup_file"
    
    log_success "Database backup created: $backup_dir/$backup_file"
}

# Show help
show_help() {
    echo "UFOBeep Platform Deployment Script"
    echo
    echo "Usage: ./deploy.sh [command]"
    echo
    echo "Commands:"
    echo "  start     - Start all services"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart all services"
    echo "  fresh     - Fresh deployment (removes all data)"
    echo "  build     - Build the application"
    echo "  migrate   - Run database migrations"
    echo "  logs      - Show service logs (optional: specify service name)"
    echo "  status    - Show service status"
    echo "  backup    - Create database backup"
    echo "  health    - Run comprehensive health check"
    echo "  dev       - Start in development mode with hot reloading"
    echo "  help      - Show this help message"
    echo
    echo "Examples:"
    echo "  ./deploy.sh start"
    echo "  ./deploy.sh dev"
    echo "  ./deploy.sh logs backend"
    echo "  ./deploy.sh fresh"
    echo
}

# Main script logic
main() {
    local command=${1:-"help"}
    
    case $command in
        "start")
            check_dependencies
            setup_env
            start_services
            ;;
        "stop")
            check_dependencies
            stop_services
            ;;
        "restart")
            check_dependencies
            restart_services
            ;;
        "fresh")
            check_dependencies
            setup_env
            fresh_deploy
            ;;
        "build")
            check_dependencies
            build_app
            ;;
        "migrate")
            check_dependencies
            migrate_database
            ;;
        "logs")
            check_dependencies
            show_logs "$@"
            ;;
        "status")
            check_dependencies
            show_status
            ;;
        "backup")
            check_dependencies
            backup_database
            ;;
        "health")
            check_dependencies
            if [[ -f "./health-check.sh" ]]; then
                ./health-check.sh
            else
                log_error "Health check script not found"
                exit 1
            fi
            ;;
        "dev")
            check_dependencies
            setup_env
            start_dev
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"