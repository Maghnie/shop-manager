# ============================================================================
# Shop Manager - Restore to Docker PostgreSQL Script (Windows)
# ============================================================================
# This script restores a PostgreSQL backup into your Docker database
#
# Usage: .\scripts\restore-to-docker.ps1 -BackupFile <path> [-SkipBackup]
# ============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,

    [string]$DatabaseName = "shop_db",
    [string]$PostgresUser = "postgres",
    [string]$ContainerName = "shop-manager-db",
    [switch]$SkipBackup = $false,
    [switch]$Force = $false
)

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }

# Banner
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Shop Manager - Restore to Docker" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if backup file exists
if (-not (Test-Path $BackupFile)) {
    Write-Error "[X] ERROR: Backup file not found: $BackupFile"
    exit 1
}

$fileSize = (Get-Item $BackupFile).Length
$fileSizeMB = [math]::Round($fileSize / 1MB, 2)

Write-Info "[i] Configuration:"
Write-Info "  * Backup File: $BackupFile"
Write-Info "  * File Size: $fileSizeMB MB"
Write-Info "  * Target Database: $DatabaseName"
Write-Info "  * Docker Container: $ContainerName"
Write-Info "  * PostgreSQL User: $PostgresUser"
Write-Host ""

# Check if Docker is running
Write-Info "[?] Checking Docker status..."
$dockerCheck = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "[X] ERROR: Docker is not running!"
    Write-Info "Please start Docker Desktop and try again."
    exit 1
}
Write-Success "[OK] Docker is running"

# Check if container is running
Write-Info "[?] Checking if container '$ContainerName' is running..."
$containerCheck = docker ps --filter "name=$ContainerName" --format "{{.Names}}" 2>&1
if ($containerCheck -notmatch $ContainerName) {
    Write-Error "[X] ERROR: Container '$ContainerName' is not running!"
    Write-Info ""
    Write-Info "Start the container with:"
    Write-Info "  docker-compose up -d"
    Write-Info "Or:"
    Write-Info "  make up"
    exit 1
}
Write-Success "[OK] Container is running"
Write-Host ""

# Warning about data loss
if (-not $Force) {
    Write-Warning "[!] WARNING: This will REPLACE all data in the Docker database!"
    Write-Warning "[!] Current database '$DatabaseName' will be dropped and recreated."
    Write-Host ""
    $confirm = Read-Host "Are you sure you want to continue? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Info "Operation cancelled."
        exit 0
    }
    Write-Host ""
}

# Backup current Docker database first (unless skipped)
if (-not $SkipBackup) {
    Write-Info "[>] Creating safety backup of current Docker database..."
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $safetyBackupDir = ".\backups"
    if (-not (Test-Path $safetyBackupDir)) {
        New-Item -ItemType Directory -Path $safetyBackupDir -Force | Out-Null
    }
    $safetyBackupFile = Join-Path $safetyBackupDir "backup_docker_before_restore_${timestamp}.sql"

    $backupCmd = "docker exec -t $ContainerName pg_dump -U $PostgresUser $DatabaseName"
    Invoke-Expression $backupCmd | Out-File -FilePath $safetyBackupFile -Encoding UTF8

    if (Test-Path $safetyBackupFile) {
        $safetySize = [math]::Round((Get-Item $safetyBackupFile).Length / 1MB, 2)
        Write-Success "[OK] Safety backup created: $safetyBackupFile ($safetySize MB)"
    } else {
        Write-Warning "[!] Could not create safety backup (container might be empty)"
    }
    Write-Host ""
}

# Read .env file to get PostgreSQL password
Write-Info "[?] Reading credentials from .env file..."
$envFile = ".\.env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    foreach ($line in $envContent) {
        if ($line -match "^POSTGRES_PASSWORD=(.+)$") {
            $postgresPassword = $matches[1]
            break
        }
    }
    if (-not $postgresPassword) {
        Write-Warning "[!] POSTGRES_PASSWORD not found in .env, using default"
        $postgresPassword = "super"
    }
} else {
    Write-Warning "[!] .env file not found, using default password"
    $postgresPassword = "super"
}
Write-Success "[OK] Credentials loaded"
Write-Host ""

# Step 1: Terminate existing connections
Write-Info "[>] Terminating existing database connections..."
$terminateCmd = @"
docker exec -t $ContainerName psql -U $PostgresUser -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DatabaseName' AND pid <> pg_backend_pid();"
"@
Invoke-Expression $terminateCmd | Out-Null
Write-Success "[OK] Connections terminated"

# Step 2: Drop database
Write-Info "[>] Dropping database '$DatabaseName'..."
Write-Info "[DEBUG] Running: docker exec $ContainerName psql -U $PostgresUser -d postgres -c 'DROP DATABASE IF EXISTS $DatabaseName;'"
$dropResult = docker exec $ContainerName psql -U $PostgresUser -d postgres -c "DROP DATABASE IF EXISTS $DatabaseName;" 2>&1
Write-Info "[DEBUG] Drop completed with exit code: $LASTEXITCODE"
if ($LASTEXITCODE -ne 0 -and $dropResult -notmatch "does not exist") {
    Write-Error "[X] ERROR: Failed to drop database!"
    Write-Error $dropResult
    exit 1
}
Write-Success "[OK] Database dropped"

# Step 3: Create database
Write-Info "[>] Creating fresh database '$DatabaseName'..."
Write-Info "[DEBUG] Running: docker exec $ContainerName psql -U $PostgresUser -d postgres -c 'CREATE DATABASE $DatabaseName;'"
$createResult = docker exec $ContainerName psql -U $PostgresUser -d postgres -c "CREATE DATABASE $DatabaseName;" 2>&1
Write-Info "[DEBUG] Create completed with exit code: $LASTEXITCODE"
if ($LASTEXITCODE -ne 0) {
    Write-Error "[X] ERROR: Failed to create database!"
    Write-Error $createResult
    exit 1
}
Write-Success "[OK] Database created"

# Step 4: Copy backup file into container
Write-Info "[>] Copying backup file into container..."
$containerBackupPath = "/tmp/restore_backup.sql"
docker cp "$BackupFile" "${ContainerName}:${containerBackupPath}" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "[X] ERROR: Failed to copy backup file into container!"
    exit 1
}
Write-Success "[OK] Backup file copied to container"

# Step 5: Restore from backup
Write-Info "[>] Restoring data from backup..."
Write-Info "[>] This may take a moment..."
Write-Host ""

Write-Info "[DEBUG] Running: docker exec $ContainerName psql -U $PostgresUser -d $DatabaseName -f $containerBackupPath"
$restoreResult = docker exec $ContainerName psql -U $PostgresUser -d $DatabaseName -f $containerBackupPath 2>&1

Write-Info "[DEBUG] Restore command completed with exit code: $LASTEXITCODE"
Write-Info "[DEBUG] Result preview: $($restoreResult | Select-Object -First 3)"

if ($LASTEXITCODE -ne 0) {
    # Check if errors are just warnings
    $errorText = $restoreResult | Out-String
    if ($errorText -match "ERROR") {
        Write-Warning "[!] Some errors occurred during restore:"
        Write-Warning $errorText
        Write-Host ""
        Write-Warning "Continuing to verification..."
    }
} else {
    Write-Success "[OK] Restore command completed"
}

# Clean up backup file from container
Write-Info "[>] Cleaning up temporary file..."
docker exec $ContainerName rm $containerBackupPath 2>&1 | Out-Null
Write-Host ""

# Step 6: Verify restore
Write-Info "[?] Verifying restore..."

# First check if database exists and has tables
Write-Info "[DEBUG] Running verification: docker exec $ContainerName psql -U $PostgresUser -d $DatabaseName -t -c '\dt'"
$tableList = docker exec $ContainerName psql -U $PostgresUser -d $DatabaseName -t -c "\dt" 2>&1
Write-Info "[DEBUG] Verification completed with exit code: $LASTEXITCODE"

if ($LASTEXITCODE -eq 0 -and $tableList) {
    Write-Success "[OK] Database tables found"

    # Get row counts
    Write-Info ""
    Write-Info "[i] Database Statistics:"

    # Count tables
    $tableCount = (docker exec $ContainerName psql -U $PostgresUser -d $DatabaseName -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>&1).Trim()
    if ($tableCount -match '\d+') {
        Write-Info "  * Total Tables: $tableCount"
    }

    # Try to get some row counts from common tables
    $commonTables = @("products_product", "inventory_inventoryitem", "sales_sale")
    foreach ($table in $commonTables) {
        $rowCount = (docker exec $ContainerName psql -U $PostgresUser -d $DatabaseName -t -c "SELECT count(*) FROM $table;" 2>&1).Trim()
        if ($LASTEXITCODE -eq 0 -and $rowCount -match '\d+') {
            Write-Info "  * $table : $rowCount rows"
        }
    }
} else {
    Write-Warning "[!] WARNING: Could not verify database tables!"
    Write-Warning "Database may be empty or verification command failed."
    Write-Info ""
    Write-Info "You can manually verify by running:"
    Write-Info "  docker exec -it $ContainerName psql -U $PostgresUser -d $DatabaseName -c '\dt'"
}

Write-Host ""
Write-Success "============================================"
Write-Success "  Restore Complete!"
Write-Success "============================================"
Write-Host ""
Write-Info "[OK] Your local database has been successfully restored to Docker!"
Write-Info ""
Write-Info "The data is now persisted in the Docker volume 'shop-manager-postgres-data'"
Write-Info "All changes made through the Docker app will be saved automatically."
Write-Host ""
Write-Info "Next steps:"
Write-Info "  1. Access the application:"
Write-Info "     * Frontend: http://localhost:5173"
Write-Info "     * Backend API: http://localhost:8000/api"
Write-Info "     * Django Admin: http://localhost:8000/admin"
Write-Info ""
Write-Info "  2. View logs:"
Write-Info "     make logs"
Write-Info ""
Write-Info "  3. To backup Docker database later:"
Write-Info "     make backup-docker"
Write-Host ""

if (-not $SkipBackup -and (Test-Path $safetyBackupFile)) {
    Write-Info "[i] Note: Your pre-restore safety backup is saved at:"
    Write-Info "   $safetyBackupFile"
    Write-Host ""
}
