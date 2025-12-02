# Save Docker stack and create deployment package for Windows
# Usage: powershell -ExecutionPolicy Bypass -File .\save-and-package.ps1

# Define database backup file to use
$db_backup_path = "db_backups/backup_20251114_144619_FIXED.sql"

Write-Host "=== Creating Single-File Deployment ===" -ForegroundColor Green

# Create deployments directory if it doesn't exist
$deploymentsDir = "deployments"
if (-not (Test-Path $deploymentsDir)) {
    Write-Host "`nCreating deployments directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $deploymentsDir -Force | Out-Null
    Write-Host "Deployments directory created" -ForegroundColor Green
}

# Create deployment folder with timestamp inside deployments directory
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$deployFolderName = "shop_program_$timestamp"
$deployFolder = Join-Path $deploymentsDir $deployFolderName
Write-Host "`nCreating deployment folder: $deployFolder" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $deployFolder -Force | Out-Null
Write-Host "Deployment folder created successfully" -ForegroundColor Green

# Check if docker-compose.yml exists
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "ERROR: docker-compose.yml not found!" -ForegroundColor Red
    Write-Host "Please run this script from your project directory (where docker-compose.yml is located)" -ForegroundColor Yellow
    exit 1
}

# Check if stack is running
$runningContainers = docker compose ps -q
if (-not $runningContainers) {
    Write-Host "ERROR: No running containers found!" -ForegroundColor Red
    Write-Host "Please start your stack first with: docker compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nDetecting services..." -ForegroundColor Yellow
$servicesOutput = docker compose ps --format json | ConvertFrom-Json
$services = $servicesOutput | ForEach-Object { $_.Service }
Write-Host "Found services: $($services -join ', ')" -ForegroundColor Cyan

# Step 1: Copy database backup file
Write-Host "`nStep 1: Preparing database backup..." -ForegroundColor Yellow

# Verify backup file exists
if (-not (Test-Path $db_backup_path)) {
    Write-Host "ERROR: Database backup file not found at: $db_backup_path" -ForegroundColor Red
    Write-Host "Please ensure the backup file exists before running this script." -ForegroundColor Yellow
    exit 1
}

Write-Host "Found backup file: $db_backup_path" -ForegroundColor Cyan

# Verify it's a valid SQL file
$backupSize = (Get-Item $db_backup_path).Length
if ($backupSize -lt 100) {
    Write-Host "ERROR: Backup file is too small ($backupSize bytes) - may be empty or corrupted!" -ForegroundColor Red
    exit 1
}

# Verify file contains PostgreSQL dump header
$backupContent = Get-Content $db_backup_path -First 100 -ErrorAction SilentlyContinue
if (-not ($backupContent -match "PostgreSQL database dump")) {
    Write-Host "WARNING: File may not be a valid PostgreSQL dump!" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        Write-Host "Aborted by user." -ForegroundColor Yellow
        exit 0
    }
}

# Copy backup to deployment folder
$backupFile = Join-Path $deployFolder "backup.sql"
Copy-Item -Path $db_backup_path -Destination $backupFile -Force

if (Test-Path $backupFile) {
    $backupSizeKB = [math]::Round($backupSize / 1KB, 2)
    Write-Host "Database backup copied successfully: backup.sql ($backupSizeKB KB)" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to copy backup file!" -ForegroundColor Red
    exit 1
}

# Step 2: Commit running containers
Write-Host "`nStep 2: Saving container states..." -ForegroundColor Yellow

foreach ($service in $services) {
    $containerId = docker compose ps -q $service
    if ($containerId) {
        Write-Host "  Committing $service..." -ForegroundColor Cyan
        docker commit $containerId "${service}-snapshot:latest" | Out-Null
    }
}

Write-Host "All containers committed successfully" -ForegroundColor Green

# Step 3: Save images (one tar per service for faster parallel loading)
Write-Host "`nStep 3: Packaging images..." -ForegroundColor Yellow
$imageTarFiles = @()

foreach ($service in $services) {
    $imageName = "${service}-snapshot:latest"
    $tarFileName = "${service}-image.tar"
    $tarFilePath = Join-Path $deployFolder $tarFileName

    Write-Host "  Saving ${service} image..." -ForegroundColor Cyan
    docker save -o "$tarFilePath" $imageName

    if (Test-Path $tarFilePath) {
        $tarSize = (Get-Item $tarFilePath).Length / 1MB
        Write-Host "  - $tarFileName ($([math]::Round($tarSize, 2)) MB)" -ForegroundColor Green
        $imageTarFiles += $tarFileName
    } else {
        Write-Host "ERROR: Failed to create $tarFileName!" -ForegroundColor Red
        exit 1
    }
}

$totalSize = (Get-ChildItem -Path $deployFolder -Filter "*-image.tar" | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "All images saved successfully. Total: $([math]::Round($totalSize, 2)) MB" -ForegroundColor Green

# Step 4: Create docker-compose file for deployment
Write-Host "`nStep 4: Creating compose configuration..." -ForegroundColor Yellow

$composeContent = "services:`n"

foreach ($service in $services) {
    $composeContent += "  ${service}:`n"
    $composeContent += "    image: ${service}-snapshot:latest`n"
    
    # Get ports
    $portsJson = docker compose ps $service --format json | ConvertFrom-Json
    $portsList = $portsJson.Publishers
    
    if ($portsList) {
        $composeContent += "    ports:`n"
        foreach ($portInfo in $portsList) {
            $publishedPort = $portInfo.PublishedPort
            $targetPort = $portInfo.TargetPort
            if ($publishedPort -and $targetPort) {
                $composeContent += "      - `"${publishedPort}:${targetPort}`"`n"
            }
        }
    }
    
    # Add volume for database to persist data
    if ($service -match 'db|postgres') {
        $composeContent += "    volumes:`n"
        $composeContent += "      - db_data:/var/lib/postgresql/data`n"
    }
    
    $composeContent += "`n"
}

# Add volumes section if there's a database service
$hasDbService = $services | Where-Object { $_ -match 'db|postgres' }
if ($hasDbService) {
    $composeContent += "volumes:`n"
    $composeContent += "  db_data:`n"
}

$composeFile = Join-Path $deployFolder "docker-compose-deploy.yml"
$composeContent | Out-File -FilePath $composeFile -Encoding UTF8
Write-Host "Created docker-compose-deploy.yml successfully" -ForegroundColor Green

# Step 5: Create deployment script for client
Write-Host "`nStep 5: Creating deployment script..." -ForegroundColor Yellow

$deployScript = @"
# Web Application Deployment Script
# Usage: powershell -ExecutionPolicy Bypass -File .\deploy.ps1

Write-Host "=== Deploying Web Application ===" -ForegroundColor Green
Write-Host ""

# Check required files
if (-not (Test-Path "docker-compose-deploy.yml")) {
    Write-Host ""
    Write-Host "ERROR: docker-compose-deploy.yml not found!" -ForegroundColor Red
    exit 1
}

# Find all image tar files
`$imageTars = Get-ChildItem -Filter "*-image.tar" -File
if (`$imageTars.Count -eq 0) {
    Write-Host ""
    Write-Host "ERROR: No image tar files found!" -ForegroundColor Red
    Write-Host "Expected files like: frontend-image.tar, backend-image.tar, etc." -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
Write-Host "`nChecking Docker..." -ForegroundColor Yellow
`$dockerRunning = docker ps 2>&1
if (`$LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}
Write-Host "Docker is running" -ForegroundColor Green

# Load Docker images
Write-Host "`nStep 1: Loading Docker images..." -ForegroundColor Yellow
Write-Host "Found `$(`$imageTars.Count) image file(s) to load" -ForegroundColor Cyan
Write-Host ""

`$currentImage = 0
foreach (`$tarFile in `$imageTars) {
    `$currentImage++
    `$tarSize = `$tarFile.Length / 1MB
    `$tarSizeRounded = [math]::Round(`$tarSize, 2)

    Write-Host "[`$currentImage/`$(`$imageTars.Count)] Loading `$(`$tarFile.Name) (`$tarSizeRounded MB)..." -ForegroundColor Yellow

    # Load with explicit output
    docker load -i `$tarFile.FullName 2>&1 | ForEach-Object {
        if (`$_ -match "Loaded image") {
            Write-Host "  `$_" -ForegroundColor Green
        } else {
            Write-Host "  `$_" -ForegroundColor Gray
        }
    }

    if (`$LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Failed to load `$(`$tarFile.Name)!" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

Write-Host "All images loaded successfully!" -ForegroundColor Green

# Prompt for database credentials BEFORE starting services
if (Test-Path "backup.sql") {
    Write-Host "`nStep 3: Database Configuration" -ForegroundColor Yellow
    Write-Host "Please provide database credentials for restoration:" -ForegroundColor Cyan
    Write-Host ""

    `$DB_USER = "postgres"
    `$DB_NAME = "shop_db" 

    Write-Host ""
    Write-Host "Using credentials: User=`$DB_USER, Database=`$DB_NAME" -ForegroundColor Cyan

    # Find database service
    `$dbServices = docker compose -f docker-compose-deploy.yml config --services | Select-String -Pattern 'db|postgres'
    if (`$dbServices) {
        `$dbService = `$dbServices -split "``n" | Select-Object -First 1

        # Start ONLY the database service first
        Write-Host "`nStep 2: Starting database service..." -ForegroundColor Yellow
        docker compose -f docker-compose-deploy.yml up -d `$dbService

        if (`$LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "ERROR: Failed to start database service!" -ForegroundColor Red
            exit 1
        }

        Write-Host "`nWaiting for database to be ready..." -ForegroundColor Yellow
        Write-Host "Checking database availability..." -ForegroundColor Cyan

        # Wait for database to accept connections (up to 30 seconds)
        `$maxAttempts = 15
        `$attempt = 0
        `$dbReady = `$false

        while (`$attempt -lt `$maxAttempts -and -not `$dbReady) {
            `$attempt++
            `$checkResult = docker compose -f docker-compose-deploy.yml exec -T `$dbService pg_isready -U `$DB_USER 2>&1
            if (`$LASTEXITCODE -eq 0) {
                `$dbReady = `$true
                Write-Host "Database is ready (attempt `$attempt/`$maxAttempts)" -ForegroundColor Green
            } else {
                Write-Host "Waiting for database... (attempt `$attempt/`$maxAttempts)" -ForegroundColor Yellow
                Start-Sleep -Seconds 2
            }
        }

        if (-not `$dbReady) {
            Write-Host "ERROR: Database did not become ready in time!" -ForegroundColor Red
            Write-Host "Please check Docker logs: docker compose -f docker-compose-deploy.yml logs `$dbService" -ForegroundColor Yellow
            exit 1
        }

        Write-Host "`nStep 4: Restoring database backup..." -ForegroundColor Yellow
        Write-Host "This may take a minute..." -ForegroundColor Cyan

        # Get backup file size for progress indication
        `$backupSize = (Get-Item "backup.sql").Length / 1KB
        `$backupSizeRounded = [math]::Round(`$backupSize, 2)
        Write-Host "Restoring backup (`$backupSizeRounded KB)..." -ForegroundColor Cyan

        # Restore database using psql with explicit UTF-8 encoding
        Get-Content "backup.sql" -Encoding UTF8 | docker compose -f docker-compose-deploy.yml exec -T `$dbService psql -U `$DB_USER -d `$DB_NAME --set=client_encoding=UTF8 2>&1 | Out-Null

        if (`$LASTEXITCODE -eq 0) {
            Write-Host "Database restore completed" -ForegroundColor Green

            # Verify database restore
            Write-Host "Verifying database restore..." -ForegroundColor Cyan

            # Check if tables exist
            `$tableCheck = docker compose -f docker-compose-deploy.yml exec -T `$dbService psql -U `$DB_USER -d `$DB_NAME -c "\dt" 2>&1

            if (`$tableCheck -match "List of relations" -or `$tableCheck -match "public") {
                Write-Host "[OK] Database tables verified successfully" -ForegroundColor Green

                # Count total rows across all tables for verification
                `$rowCountQuery = "SELECT COUNT(*) as total_rows FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
                `$tableCount = docker compose -f docker-compose-deploy.yml exec -T `$dbService psql -U `$DB_USER -d `$DB_NAME -t -c `"`$rowCountQuery`" 2>&1

                if (`$tableCount) {
                    `$tableCountTrimmed = `$tableCount.Trim()
                    if (`$tableCountTrimmed -match '^\d+$') {
                        Write-Host "[OK] Database contains `$tableCountTrimmed tables" -ForegroundColor Green
                    }
                }

                # Verify UTF-8 encoding
                `$encodingCheck = docker compose -f docker-compose-deploy.yml exec -T `$dbService psql -U `$DB_USER -d `$DB_NAME -t -c "SHOW server_encoding;" 2>&1
                if (`$encodingCheck -match "UTF8") {
                    Write-Host "[OK] Database encoding is UTF-8" -ForegroundColor Green
                } else {
                    Write-Host "WARNING: Database encoding may not be UTF-8: `$encodingCheck" -ForegroundColor Yellow
                }
            } else {
                Write-Host "WARNING: Could not verify database tables!" -ForegroundColor Yellow
                Write-Host "The application may not work correctly." -ForegroundColor Yellow
            }
        } else {
            Write-Host "ERROR: Database restore failed!" -ForegroundColor Red
            Write-Host "Please check the backup file and database logs." -ForegroundColor Yellow
            Write-Host "Logs command: docker compose -f docker-compose-deploy.yml logs `$dbService" -ForegroundColor Yellow
            exit 1
        }
    }
}

# Start remaining services (backend, frontend) now that database has data
Write-Host "`nStep 4: Starting remaining services (backend, frontend)..." -ForegroundColor Yellow
docker compose -f docker-compose-deploy.yml up -d

if (`$LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Failed to start remaining services!" -ForegroundColor Red
    exit 1
}

Write-Host "`nWaiting for all services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Show deployment status
Write-Host ""
Write-Host "=== Deployment Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Your application is now running!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access your application at:" -ForegroundColor Yellow

# Show accessible URLs
`$servicesJson = docker compose -f docker-compose-deploy.yml ps --format json | ConvertFrom-Json
`$urlsShown = `$false

foreach (`$svc in `$servicesJson) {
    `$ports = `$svc.Publishers
    if (`$ports) {
        foreach (`$port in `$ports) {
            if (`$port.PublishedPort) {
                Write-Host "  `$(`$svc.Service): http://localhost:`$(`$port.PublishedPort)" -ForegroundColor Cyan
                `$urlsShown = `$true
            }
        }
    }
}

if (-not `$urlsShown) {
    Write-Host "  Check docker-compose-deploy.yml for port mappings" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "NOTE: The application may take 20-30 seconds to fully start up." -ForegroundColor Yellow
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Green
Write-Host "  View logs:       docker compose -f docker-compose-deploy.yml logs -f" -ForegroundColor White
Write-Host "  Stop app:        docker compose -f docker-compose-deploy.yml down" -ForegroundColor White
Write-Host "  Restart app:     docker compose -f docker-compose-deploy.yml restart" -ForegroundColor White
Write-Host ""
"@

$deployScriptFile = Join-Path $deployFolder "deploy.ps1"
$deployScript | Out-File -FilePath $deployScriptFile -Encoding UTF8
Write-Host "Created deploy.ps1 successfully" -ForegroundColor Green

# Step 6: Create README
Write-Host "`nStep 6: Creating documentation..." -ForegroundColor Yellow

$readmeText = "=== Web Application Deployment Guide ===`n`n"
$readmeText += "REQUIREMENTS:`n"
$readmeText += "- Windows 10 or later`n"
$readmeText += "- Docker Desktop installed and running`n"
$readmeText += "- At least 5GB of free disk space`n`n"
$readmeText += "DEPLOYMENT:`n`n"
$readmeText += "1. Extract the zip file`n"
$readmeText += "2. Open PowerShell in that folder`n"
$readmeText += "3. Run: powershell -ExecutionPolicy Bypass -File .\deploy.ps1`n`n"
$readmeText += "COMMANDS:`n`n"
$readmeText += "View logs: docker compose -f docker-compose-deploy.yml logs -f`n"
$readmeText += "Stop: docker compose -f docker-compose-deploy.yml down`n"
$readmeText += "Restart: docker compose -f docker-compose-deploy.yml restart`n"

$readmeFile = Join-Path $deployFolder "README.txt"
$readmeText | Out-File -FilePath $readmeFile -Encoding UTF8
Write-Host "Created README.txt successfully" -ForegroundColor Green

# Step 7: Create zip package
Write-Host "`nStep 7: Creating final package..." -ForegroundColor Yellow

# Zip the entire deployment folder (zip file goes in deployments directory)
$zipFileName = Join-Path $deploymentsDir "$deployFolderName.zip"
Compress-Archive -Path $deployFolder -DestinationPath $zipFileName -Force

Write-Host ""
Write-Host "=== SUCCESS! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Created deployment package: $zipFileName" -ForegroundColor Cyan
Write-Host ""
Write-Host "Package contains:" -ForegroundColor Yellow

# List files in deployment folder
$deploymentFiles = Get-ChildItem -Path $deployFolder -File
foreach ($file in $deploymentFiles) {
    $size = $file.Length / 1MB
    Write-Host "  - $($file.Name) ($([math]::Round($size, 2)) MB)" -ForegroundColor White
}

Write-Host ""
if (Test-Path $zipFileName) {
    $fileSize = (Get-Item $zipFileName).Length / 1MB
    Write-Host ("Total package size: {0:N2} MB" -f $fileSize) -ForegroundColor Cyan
}
Write-Host ""
Write-Host "Client deployment instructions:" -ForegroundColor Yellow
Write-Host "  1. Extract $zipFileName" -ForegroundColor White
Write-Host "  2. Navigate to the extracted folder" -ForegroundColor White
Write-Host "  3. Run: powershell -ExecutionPolicy Bypass -File .\deploy.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Database backup verified and included in package" -ForegroundColor Green
Write-Host ""
