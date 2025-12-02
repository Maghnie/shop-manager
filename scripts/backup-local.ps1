# ============================================================================
# Shop Manager - Local PostgreSQL Backup Script (Windows)
# ============================================================================
# This script backs up your local PostgreSQL database to a timestamped file
#
# Usage: .\scripts\backup-local.ps1 [-DatabaseName <name>] [-OutputDir <path>]
# ============================================================================

param(
    [string]$DatabaseName = "shop_db",
    [string]$PostgresUser = "postgres",
    [string]$PostgresHost = "localhost",
    [string]$PostgresPort = "5432",
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
Write-Host "  Shop Manager - Local Database Backup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if pg_dump exists
$pgDumpPath = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDumpPath) {
    Write-Error "[X] ERROR: pg_dump not found!"
    Write-Info ""
    Write-Info "Please ensure PostgreSQL is installed and pg_dump is in your PATH."
    Write-Info "Typical location: C:\Program Files\PostgreSQL\17\bin"
    Write-Info ""
    Write-Info "To add to PATH:"
    Write-Info "  1. Search for 'Environment Variables' in Windows"
    Write-Info "  2. Edit System or User PATH variable"
    Write-Info "  3. Add: C:\Program Files\PostgreSQL\17\bin"
    Write-Info "  4. Restart PowerShell"
    exit 1
}

Write-Info "[i] Configuration:"
Write-Info "  * Database Name: $DatabaseName"
Write-Info "  * Host: $PostgresHost"
Write-Info "  * Port: $PostgresPort"
Write-Info "  * User: $PostgresUser"
Write-Info "  * Output Directory: $OutputDir"
Write-Host ""

# Create output directory if it doesn't exist
if (-not (Test-Path $OutputDir)) {
    Write-Info "[+] Creating output directory: $OutputDir"
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Test database connection
Write-Info "[?] Testing database connection..."
$SecurePassword = Read-Host "Enter PostgreSQL password for user '$PostgresUser'" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
$env:PGPASSWORD = $PlainPassword
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

$testConnection = & psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $DatabaseName -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "[X] ERROR: Cannot connect to database!"
    Write-Error $testConnection
    exit 1
}
Write-Success "[OK] Database connection successful!"
Write-Host ""

# Generate timestamped filename
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $OutputDir "backup_local_${timestamp}.sql"

# Perform backup
Write-Info "[>] Creating backup: $backupFile"
Write-Info "[>] This may take a moment..."
Write-Host ""

$backupResult = & pg_dump -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $DatabaseName -F p -f $backupFile 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error "[X] ERROR: Backup failed!"
    Write-Error $backupResult
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

Write-Success "============================================"
Write-Success "  Backup Complete!"
Write-Success "============================================"
Write-Host ""
Write-Info "Next steps:"
Write-Info "  1. To restore to Docker, run:"
Write-Info "     .\scripts\restore-to-docker.ps1 -BackupFile `"$backupFile`""
Write-Info ""
Write-Info "  2. Or using Make:"
Write-Info "     make restore-backup BACKUP=`"$backupFile`""
Write-Host ""

# Clear password from environment
$env:PGPASSWORD = $null
