#!/bin/bash

# UFOBeep Platform Health Check Script
# Checks the health of all services and provides detailed status

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"
REDIS_HOST="localhost"
REDIS_PORT="6379"
TIMEOUT=10

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if a service is responding
check_http_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    log_info "Checking $service_name at $url..."
    
    if curl -f -s --max-time $TIMEOUT "$url" > /dev/null 2>&1; then
        log_success "$service_name is responding"
        return 0
    else
        log_error "$service_name is not responding"
        return 1
    fi
}

# Check PostgreSQL connection
check_postgres() {
    log_info "Checking PostgreSQL connection..."
    
    if docker-compose exec -T postgres pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
        log_success "PostgreSQL is ready"
        return 0
    else
        log_error "PostgreSQL is not responding"
        return 1
    fi
}

# Check Redis connection
check_redis() {
    log_info "Checking Redis connection..."
    
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        log_success "Redis is responding"
        return 0
    else
        log_error "Redis is not responding"
        return 1
    fi
}

# Check Docker containers
check_containers() {
    log_info "Checking Docker containers..."
    
    local all_running=true
    local containers=("ufobeep_postgres" "ufobeep_redis" "ufobeep_backend" "ufobeep_frontend")
    
    for container in "${containers[@]}"; do
        if docker ps --filter "name=$container" --filter "status=running" --format "table {{.Names}}" | grep -q "$container"; then
            log_success "$container is running"
        else
            log_error "$container is not running"
            all_running=false
        fi
    done
    
    return $all_running
}

# Check disk space
check_disk_space() {
    log_info "Checking disk space..."
    
    local available=$(df . | tail -1 | awk '{print $4}')
    local threshold=1000000  # 1GB in KB
    
    if [ "$available" -gt "$threshold" ]; then
        log_success "Sufficient disk space available ($(($available / 1024))MB)"
        return 0
    else
        log_warning "Low disk space: $(($available / 1024))MB available"
        return 1
    fi
}

# Check memory usage
check_memory() {
    log_info "Checking memory usage..."
    
    local total_mem=$(free | grep '^Mem:' | awk '{print $2}')
    local used_mem=$(free | grep '^Mem:' | awk '{print $3}')
    local mem_percent=$((used_mem * 100 / total_mem))
    
    if [ "$mem_percent" -lt 90 ]; then
        log_success "Memory usage is acceptable ($mem_percent%)"
        return 0
    else
        log_warning "High memory usage: $mem_percent%"
        return 1
    fi
}

# Check API endpoints
check_api_endpoints() {
    log_info "Checking API endpoints..."
    
    local endpoints=(
        "/health"
        "/api/sightings"
        "/api/auth/status"
    )
    
    local all_ok=true
    
    for endpoint in "${endpoints[@]}"; do
        if check_http_service "API $endpoint" "$BACKEND_URL$endpoint"; then
            continue
        else
            all_ok=false
        fi
    done
    
    return $all_ok
}

# Generate health report
generate_report() {
    local exit_code=$1
    
    echo
    echo "================================================"
    echo "          UFOBeep Health Check Report"
    echo "================================================"
    echo "Timestamp: $(date)"
    echo
    
    if [ $exit_code -eq 0 ]; then
        echo -e "Overall Status: ${GREEN}HEALTHY${NC}"
        echo
        echo -e "${GREEN}🚀 All services are running properly!${NC}"
        echo
        echo "Access URLs:"
        echo "  Frontend: http://localhost:3000"
        echo "  Backend:  http://localhost:3001"
        echo "  Admin:    http://localhost:3000/admin"
    else
        echo -e "Overall Status: ${RED}UNHEALTHY${NC}"
        echo
        echo -e "${RED}⚠️  Some services are experiencing issues!${NC}"
        echo
        echo "Troubleshooting steps:"
        echo "1. Check service logs: ./deploy.sh logs"
        echo "2. Restart services: ./deploy.sh restart"
        echo "3. Check system resources (disk, memory)"
        echo "4. Verify Docker is running properly"
    fi
    
    echo "================================================"
}

# Main health check function
main() {
    echo "Starting UFOBeep Platform Health Check..."
    echo
    
    local overall_health=0
    
    # Run all checks
    check_containers || overall_health=1
    check_postgres || overall_health=1
    check_redis || overall_health=1
    check_http_service "Frontend" "$FRONTEND_URL" || overall_health=1
    check_http_service "Backend Health" "$BACKEND_URL/health" || overall_health=1
    check_api_endpoints || overall_health=1
    check_disk_space || overall_health=1
    check_memory || overall_health=1
    
    # Generate report
    generate_report $overall_health
    
    exit $overall_health
}

# Run health check if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi