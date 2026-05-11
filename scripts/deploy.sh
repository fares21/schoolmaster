#!/bin/bash
set -e

# SchoolMaster Production Deployment Script
# Version: 2.0
# Usage: ./deploy.sh [environment]

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/pre-deploy/${TIMESTAMP}"

echo "========================================="
echo "SchoolMaster Deployment Script v2.0"
echo "Environment: ${ENVIRONMENT}"
echo "Timestamp: ${TIMESTAMP}"
echo "========================================="

# Pre-deployment checks
echo "[1/8] Running pre-deployment checks..."
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: Docker Compose not installed"
    exit 1
fi

if [ ! -f ".env.${ENVIRONMENT}" ]; then
    echo "ERROR: .env.${ENVIRONMENT} file not found"
    exit 1
fi

# Backup current state
echo "[2/8] Creating pre-deployment backup..."
mkdir -p "${BACKUP_DIR}"

# Backup database
echo "  - Backing up database..."
docker exec schoolmaster-postgres pg_dump -U ${DB_USERNAME} schoolmaster > "${BACKUP_DIR}/database.sql"

# Backup storage
echo "  - Backing up storage..."
tar -czf "${BACKUP_DIR}/storage.tar.gz" -C ./src storage/

# Backup .env
cp ".env.${ENVIRONMENT}" "${BACKUP_DIR}/.env"

# Pull latest images
echo "[3/8] Pulling latest Docker images..."
docker-compose -f docker-compose.${ENVIRONMENT}.yml pull

# Build images
echo "[4/8] Building Docker images..."
docker-compose -f docker-compose.${ENVIRONMENT}.yml build --no-cache

# Run migrations with rollback on failure
echo "[5/8] Running database migrations..."
if ! docker-compose -f docker-compose.${ENVIRONMENT}.yml run --rm app php artisan migrate --force; then
    echo "ERROR: Migration failed! Rolling back..."
    docker-compose -f docker-compose.${ENVIRONMENT}.yml run --rm app php artisan migrate:rollback
    echo "Restoring backup..."
    docker exec schoolmaster-postgres psql -U ${DB_USERNAME} schoolmaster < "${BACKUP_DIR}/database.sql"
    exit 1
fi

# Clear caches
echo "[6/8] Clearing caches..."
docker-compose -f docker-compose.${ENVIRONMENT}.yml run --rm app php artisan config:clear
docker-compose -f docker-compose.${ENVIRONMENT}.yml run --rm app php artisan cache:clear
docker-compose -f docker-compose.${ENVIRONMENT}.yml run --rm app php artisan view:clear
docker-compose -f docker-compose.${ENVIRONMENT}.yml run --rm app php artisan route:clear

# Restart services
echo "[7/8] Restarting services..."
docker-compose -f docker-compose.${ENVIRONMENT}.yml down
docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d

# Wait for services to be healthy
echo "[8/8] Waiting for services to be healthy..."
sleep 10

# Health check
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost/health > /dev/null 2>&1; then
        echo "✓ Health check passed!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for services... (${RETRY_COUNT}/${MAX_RETRIES})"
    sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "ERROR: Health check failed!"
    echo "Rolling back..."
    docker-compose -f docker-compose.${ENVIRONMENT}.yml down
    # Restore from backup
    echo "Manual restoration required from: ${BACKUP_DIR}"
    exit 1
fi

# Post-deployment tasks
echo "[+] Running post-deployment tasks..."
docker-compose -f docker-compose.${ENVIRONMENT}.yml run --rm app php artisan optimize
docker-compose -f docker-compose.${ENVIRONMENT}.yml run --rm app php artisan queue:restart

# Send notification
echo "[+] Deployment completed successfully!"
echo "Time: $(date)"
echo "Backup saved to: ${BACKUP_DIR}"

# Slack notification (optional)
if [ -n "${SLACK_WEBHOOK_URL}" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ SchoolMaster deployment to ${ENVIRONMENT} completed successfully at $(date)\"}" \
        "${SLACK_WEBHOOK_URL}"
fi

echo "========================================="
echo "Deployment complete!"
echo "========================================="
