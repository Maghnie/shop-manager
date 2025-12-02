# ============================================================================
# Shop Manager - Docker PostgreSQL Backup Script (Windows)
# ============================================================================
# This script backs up your Docker PostgreSQL database to a timestamped file
#
# Usage: .\scripts\backup-docker.ps1 [-DatabaseName <name>] [-OutputDir <path>]
# ============================================================================

param(
    [string]$DatabaseName = "shop_db",
    [string]$PostgresUser = "postgres",
    [string]$ContainerName = "shop-manager-db",
    [string]$OutputDir = ".\backups"
)

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }

# Banner
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Shop Manager - Docker Database Backup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Info "[i] Configuration:"
Write-Info "  * Database Name: $DatabaseName"
Write-Info "  * Docker Container: $ContainerName"
Write-Info "  * PostgreSQL User: $PostgresUser"
Write-Info "  * Output Directory: $OutputDir"
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

# Create output directory if it doesn't exist
if (-not (Test-Path $OutputDir)) {
    Write-Info "[+] Creating output directory: $OutputDir"
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Test database connection
Write-Info "[?] Testing database connection..."
$testCmd = "docker exec -t $ContainerName psql -U $PostgresUser -d $DatabaseName -c 'SELECT 1;'"
$testResult = Invoke-Expression $testCmd 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "[X] ERROR: Cannot connect to database!"
    Write-Error $testResult
    exit 1
}
Write-Success "[OK] Database connection successful!"
Write-Host ""

# Generate timestamped filename
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $OutputDir "backup_docker_${timestamp}.sql"

# Perform backup
Write-Info "[>] Creating backup: $backupFile"
Write-Info "[>] This may take a moment..."
Write-Host ""

$backupCmd = "docker exec -t $ContainerName pg_dump -U $PostgresUser $DatabaseName"
Invoke-Expression $backupCmd | Out-File -FilePath $backupFile -Encoding UTF8

if ($LASTEXITCODE -ne 0) {
    Write-Error "[X] ERROR: Backup failed!"
    exit 1
}

# Verify backup file
if (-not (Test-Path $backupFile)) {
    Write-Error "[X] ERROR: Backup file was not created!"
    exit 1
}

$fileSize = (Get-Item $backupFile).Length
$fileSizeMB = [math]::Round($fileSize / 1MB, 2)

Write-Success "[OK] Backup completed successfully!"
Write-Host ""
Write-Info "[i] Backup Details:"
Write-Info "  * File: $backupFile"
Write-Info "  * Size: $fileSizeMB MB ($fileSize bytes)"
Write-Info "  * Timestamp: $timestamp"
Write-Host ""

# Count some stats from the backup
Write-Info "[i] Backup Statistics:"
$content = Get-Content $backupFile -Raw
$tableCount = ([regex]::Matches($content, "CREATE TABLE")).Count
$insertCount = ([regex]::Matches($content, "COPY .* FROM stdin")).Count
Write-Info "  * Tables: $tableCount"
Write-Info "  * Data dumps: $insertCount"
Write-Host ""

# Get database size
Write-Info "[?] Getting database information..."
$sizeCmd = "docker exec -t $ContainerName psql -U $PostgresUser -d $DatabaseName -t -c ""SELECT pg_size_pretty(pg_database_size('$DatabaseName'));"""
$dbSize = (Invoke-Expression $sizeCmd).Trim()
Write-Info "  * Database Size: $dbSize"
Write-Host ""

Write-Success "============================================"
Write-Success "  Backup Complete!"
Write-Success "============================================"
Write-Host ""
Write-Info "[i] This backup can be used to:"
Write-Info "  1. Restore to Docker (if needed):"
Write-Info "     .\scripts\restore-to-docker.ps1 -BackupFile `"$backupFile`""
Write-Info ""
Write-Info "  2. Restore to local PostgreSQL:"
Write-Info "     psql -U postgres -d shop_db -f `"$backupFile`""
Write-Info ""
Write-Info "  3. Keep as safety backup before major changes"
Write-Host ""
