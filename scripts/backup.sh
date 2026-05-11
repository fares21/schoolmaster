#!/bin/bash
set -e

# SchoolMaster Automated Backup Script
# Usage: ./backup.sh [full|incremental]

BACKUP_TYPE=${1:-full}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/${BACKUP_TYPE}/${TIMESTAMP}"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

echo "========================================="
echo "SchoolMaster Backup Script"
echo "Type: ${BACKUP_TYPE}"
echo "Timestamp: ${TIMESTAMP}"
echo "========================================="

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Database backup
echo "[1/5] Backing up database..."
if [ "${BACKUP_TYPE}" = "full" ]; then
    docker exec schoolmaster-postgres pg_dump -U ${DB_USERNAME} -Fc schoolmaster > "${BACKUP_DIR}/database.dump"
else
    # Incremental backup using WAL
    docker exec schoolmaster-postgres psql -U ${DB_USERNAME} -c "SELECT pg_switch_wal();"
    docker cp schoolmaster-postgres:/var/lib/postgresql/data/pg_wal "${BACKUP_DIR}/"
fi

# Backup size
DB_SIZE=$(du -h "${BACKUP_DIR}/database.dump" | cut -f1)
echo "  - Database backup size: ${DB_SIZE}"

# Storage backup
echo "[2/5] Backing up storage..."
tar -czf "${BACKUP_DIR}/storage.tar.gz" -C ./src storage/ \
    --exclude="storage/logs" \
    --exclude="storage/framework/cache"

STORAGE_SIZE=$(du -h "${BACKUP_DIR}/storage.tar.gz" | cut -f1)
echo "  - Storage backup size: ${STORAGE_SIZE}"

# Configuration backup
echo "[3/5] Backing up configuration..."
cp .env.production "${BACKUP_DIR}/.env"
cp docker-compose.prod.yml "${BACKUP_DIR}/docker-compose.yml"
tar -czf "${BACKUP_DIR}/config.tar.gz" -C ./src config/

# Encrypt backup (if encryption key is set)
if [ -n "${ENCRYPTION_KEY}" ]; then
    echo "[4/5] Encrypting backup..."
    for file in "${BACKUP_DIR}"/*.dump "${BACKUP_DIR}"/*.tar.gz "${BACKUP_DIR}"/*.env; do
        if [ -f "$file" ]; then
            gpg --batch --yes --passphrase "${ENCRYPTION_KEY}" -c "$file"
            rm "$file"
        fi
    done
fi

# Upload to cloud storage (if configured)
if [ -n "${AWS_BUCKET}" ]; then
    echo "[5/5] Uploading to S3..."
    aws s3 sync "${BACKUP_DIR}/" "s3://${AWS_BUCKET}/backups/${BACKUP_TYPE}/${TIMESTAMP}/"
fi

# Cleanup old backups
echo "[+] Cleaning up backups older than ${RETENTION_DAYS} days..."
find /backups -type f -name "*.gpg" -mtime +${RETENTION_DAYS} -delete
find /backups -type d -empty -delete

# Send verification
BACKUP_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)

# Health check ping
if [ -n "${HEALTH_CHECK_URL}" ]; then
    curl -X POST "${HEALTH_CHECK_URL}" \
        -d "status=success&type=${BACKUP_TYPE}&size=${BACKUP_SIZE}" \
        -o /dev/null -s
fi

echo "========================================="
echo "Backup completed successfully!"
echo "Type: ${BACKUP_TYPE}"
echo "Location: ${BACKUP_DIR}"
echo "Size: ${BACKUP_SIZE}"
echo "========================================="
