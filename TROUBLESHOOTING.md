# UFOBeep Troubleshooting Guide

## Database Connection Issues

### Problem: Authentication Failed Against Database Server

**Error Message:**
```
Error: P1000: Authentication failed against database server at `postgres`, the provided database credentials for `postgres` are not valid.
```

**Root Cause:**
Database credentials mismatch between Docker containers.

**Solutions:**

#### 1. For Development Mode (`./deploy.sh dev`)
The issue is fixed in the latest configuration. The development override now ensures consistent credentials:

- **Database Container:** `postgres:password@postgres:5432/ufobeep_dev`
- **Backend Container:** Uses the same credentials
- **Health Checks:** Updated to use correct user/database

#### 2. For Production Mode (`./deploy.sh start`)
Ensure your `.env` file has consistent credentials:

```bash
# Copy the example and edit
cp .env.example .env

# Edit .env with consistent values:
POSTGRES_DB=ufobeep
POSTGRES_USER=ufobeep_user  
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://ufobeep_user:your_secure_password@postgres:5432/ufobeep
```

#### 3. Clean Restart
If you're still having issues:

```bash
# Clean restart with fresh database
./deploy.sh stop
docker volume rm ufobeep_postgres_data 2>/dev/null || true
./deploy.sh fresh
```

#### 4. Manual Database Connection Test
Test database connectivity:

```bash
# Check if database container is ready
docker-compose logs postgres

# Test connection manually
docker-compose exec postgres psql -U postgres -d ufobeep_dev -c "SELECT 1;"
```

## Docker Build Issues

### Problem: Prisma Generate Fails

**Fixed:** Prisma schema relations have been corrected and OpenSSL installed.

**If you still encounter issues:**

```bash
# Rebuild containers from scratch
./deploy.sh stop
docker-compose build --no-cache
./deploy.sh start
```

### Problem: Package Lock Issues

**Fixed:** Both `package-lock.json` files are now present.

**If you encounter npm ci errors:**

```bash
# Regenerate lock files
rm package-lock.json frontend/package-lock.json
npm install
cd frontend && npm install && cd ..
./deploy.sh fresh
```

## Service Health Checks

### Check Service Status
```bash
# Overall status
./deploy.sh status

# Detailed health check  
./deploy.sh health

# Service-specific logs
./deploy.sh logs postgres
./deploy.sh logs backend
./deploy.sh logs frontend
```

### Database Migration Issues

The deployment now uses different strategies:

- **Development:** `prisma db push` (faster, no migration files)
- **Production:** `prisma migrate deploy` (versioned migrations)

**If migrations fail:**

```bash
# Development: Reset and push schema
./deploy.sh dev
docker-compose -f docker-compose.yml -f docker-compose.override.yml exec backend npx prisma db push --force-reset

# Production: Reset migrations (DATA LOSS WARNING)
./deploy.sh start  
docker-compose exec backend npx prisma migrate reset --force
```

## Common Environment Issues

### Port Conflicts
```bash
# Check what's using the ports
lsof -i :3000  # Frontend
lsof -i :3001  # Backend  
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Kill conflicting processes
sudo kill -9 <PID>
```

### Permission Issues
```bash
# Fix file permissions
chmod +x deploy.sh health-check.sh
sudo chown -R $USER:$USER ./

# Fix Docker permissions (if needed)
sudo usermod -aG docker $USER
# Log out and back in
```

### SSL/TLS Issues
```bash
# For production HTTPS setup
# 1. Obtain SSL certificates (Let's Encrypt recommended)
sudo certbot certonly --standalone -d yourdomain.com

# 2. Update nginx configuration
# Copy certificates to ./nginx/ssl/
# Update ./frontend/nginx.conf with SSL settings
```

## Performance Optimization

### Database Performance
```bash
# Monitor database performance
./deploy.sh logs postgres | grep slow

# Check connection counts
docker-compose exec postgres psql -U postgres -d ufobeep -c "SELECT count(*) FROM pg_stat_activity;"
```

### Memory Issues
```bash
# Check container memory usage
docker stats

# Increase memory limits in docker-compose.yml if needed
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

## Development Tips

### Hot Reloading Not Working
```bash
# Ensure development mode is active
./deploy.sh dev

# Check volume mounts
docker-compose -f docker-compose.yml -f docker-compose.override.yml exec backend ls -la /app

# Restart development services
./deploy.sh stop
./deploy.sh dev
```

### Database Changes
```bash
# After schema changes in development
docker-compose -f docker-compose.yml -f docker-compose.override.yml exec backend npx prisma db push

# View database in browser
docker-compose -f docker-compose.yml -f docker-compose.override.yml exec backend npx prisma studio
```

## Logs and Debugging

### Enable Debug Logging
Add to your `.env`:
```bash
# Enable debug logs
DEBUG=ufobeep:*
LOG_LEVEL=debug
```

### View Specific Logs
```bash
# Application logs
./deploy.sh logs backend | grep ERROR

# Database logs  
./deploy.sh logs postgres | tail -100

# All services with timestamps
./deploy.sh logs | head -200
```

## Getting Help

### Check Service Health
1. Run `./deploy.sh health` for comprehensive status
2. Check individual service logs
3. Verify environment variables are set correctly
4. Test database connectivity manually

### Reset Everything
If all else fails:
```bash
# Nuclear option - complete reset
./deploy.sh stop
docker system prune -a -f --volumes
./deploy.sh fresh
```

**Warning:** This will delete all data including uploaded files and database contents.

---

## Quick Fix Checklist

✅ **Database Issues:**
- [ ] Check `.env` file has correct DATABASE_URL
- [ ] Verify postgres container credentials match backend
- [ ] Run `./deploy.sh fresh` for clean start

✅ **Build Issues:** 
- [ ] Ensure `package-lock.json` files exist
- [ ] Clear Docker build cache: `docker-compose build --no-cache`
- [ ] Check Docker has enough disk space

✅ **Connection Issues:**
- [ ] Verify ports 3000, 3001, 5432, 6379 are available
- [ ] Check firewall/proxy settings
- [ ] Ensure Docker networking is working

✅ **Permission Issues:**
- [ ] Make scripts executable: `chmod +x *.sh`
- [ ] Fix file ownership: `sudo chown -R $USER:$USER ./`
- [ ] Add user to docker group if needed