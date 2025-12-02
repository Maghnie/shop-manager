# Database Backup & Restore Scripts

Windows PowerShell scripts for managing PostgreSQL database backups and migrations.

## Quick Start

### Migrate Local Database to Docker
```powershell
make migrate-local
```
This command does everything automatically:
1. Backs up your local PostgreSQL database
2. Restores it to Docker
3. Verifies the data

### Individual Operations

```powershell
# Backup local PostgreSQL
make backup-local

# Backup Docker database
make backup-docker

# Restore specific backup to Docker
make restore-backup BACKUP=./backups/backup_local_20240101_120000.sql
```

## Scripts

### backup-local.ps1
Backs up your **local Windows PostgreSQL** installation to a timestamped SQL file.

**Requirements:**
- PostgreSQL 17.5 installed locally
- `pg_dump` in your PATH (typically `C:\Program Files\PostgreSQL\17\bin`)

**Usage:**
```powershell
.\scripts\backup-local.ps1
```

**Prompts for:**
- PostgreSQL password (secure input)

**Output:**
- `./backups/backup_local_YYYYMMDD_HHMMSS.sql`

---

### backup-docker.ps1
Backs up the **Docker PostgreSQL** database to a timestamped SQL file.

**Requirements:**
- Docker Desktop running
- Docker containers running (`make up`)

**Usage:**
```powershell
.\scripts\backup-docker.ps1
```

**Output:**
- `./backups/backup_docker_YYYYMMDD_HHMMSS.sql`

---

### restore-to-docker.ps1
Restores a backup file to the Docker PostgreSQL database.

**⚠️ WARNING:** This will **replace all data** in the Docker database!

**Requirements:**
- Docker Desktop running
- Docker containers running (`make up`)
- Valid backup SQL file

**Usage:**
```powershell
# Basic usage (prompts for confirmation)
.\scripts\restore-to-docker.ps1 -BackupFile ".\backups\backup_local_20240101_120000.sql"

# Skip safety backup (not recommended)
.\scripts\restore-to-docker.ps1 -BackupFile ".\backups\backup.sql" -SkipBackup

# Force without confirmation (dangerous!)
.\scripts\restore-to-docker.ps1 -BackupFile ".\backups\backup.sql" -Force
```

**Safety Features:**
- Creates automatic safety backup before restore
- Requires confirmation
- Verifies data after restore
- Shows statistics

---

## Common Workflows

### First-Time Migration (Local → Docker)
```powershell
# Option 1: One command (recommended)
make migrate-local

# Option 2: Step by step
make backup-local
# Note the backup filename from output
make restore-backup BACKUP=./backups/backup_local_20240118_143000.sql
```

### Regular Backups
```powershell
# Backup Docker database daily
make backup-docker

# Or schedule in Windows Task Scheduler:
# Action: powershell.exe
# Arguments: -ExecutionPolicy Bypass -File "C:\Path\To\shop-manager\scripts\backup-docker.ps1"
# Trigger: Daily at 2:00 AM
```

### Testing / Rollback
```powershell
# Backup current state
make backup-docker

# Make changes in the app
# ...

# If something goes wrong, restore
make restore-backup BACKUP=./backups/backup_docker_20240118_120000.sql
```

### Moving Between Environments
```powershell
# Export from Docker
make backup-docker

# Import to local PostgreSQL (using psql)
psql -U postgres -d shop_db -f ./backups/backup_docker_20240118_120000.sql
```

---

## Troubleshooting

### "pg_dump not found"
Add PostgreSQL to your PATH:
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\17\bin"
# Or add permanently via System Environment Variables
```

### "Docker is not running"
Start Docker Desktop and wait for it to fully start:
```powershell
# Check Docker status
docker ps
```

### "Container is not running"
Start the containers:
```powershell
make up
# Or
docker-compose up -d
```

### "Permission denied" when running scripts
Set PowerShell execution policy:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Backup file seems too small
- Check if database has data
- Verify connection credentials
- Look for errors in script output

---

## Data Persistence

Once data is restored to Docker:
- ✅ **Automatically persisted** in Docker volume `shop-manager-postgres-data`
- ✅ **Survives container restarts**
- ✅ **Survives** `docker-compose down`
- ❌ **Deleted by** `docker-compose down -v` (removes volumes)

---

## Best Practices

1. ✅ **Backup before major changes**
2. ✅ **Use timestamped backups** (scripts do this automatically)
3. ✅ **Test restores periodically** (verify backups are valid)
4. ✅ **Store backups off-site** (copy to cloud/external drive)
5. ✅ **Automate regular backups** (Task Scheduler)
6. ❌ **Never commit backup files** to git (contains sensitive data)

---

## File Locations

- **Scripts**: `./scripts/`
- **Backups**: `./backups/` (created automatically, gitignored)
- **Logs**: `./backup_migration.log` (for `make migrate-local`)

---

For detailed documentation, see [DOCKER.md](../DOCKER.md#backup--restore-strategy)
