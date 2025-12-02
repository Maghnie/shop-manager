# Save Docker stack and create deployment package for Windows
# Fixed version that properly preserves database data
# Usage: powershell -ExecutionPolicy Bypass -File .\save-and-package.ps1

Write-Host "=== Creating Single-File Deployment ===" -ForegroundColor Green

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

# Step 1: Export database volume to a backup file
Write-Host "`nStep 1: Backing up database volume..." -ForegroundColor Yellow

# Find database service
$servicesOutput = docker compose ps --format json | ConvertFrom-Json
$services = $servicesOutput | ForEach-Object { $_.Service }
$dbService = $services | Where-Object { $_ -match 'db|postgres' } | Select-Object -First 1

if ($dbService) {
    Write-Host "Found database service: $dbService" -ForegroundColor Cyan
    
    # Get the container ID
    $dbContainerId = docker compose ps -q $dbService
    
    # Create database backup
    Write-Host "Creating database backup..." -ForegroundColor Cyan
    docker exec $dbContainerId tar czf /tmp/db-backup.tar.gz -C /var/lib/postgresql/data .
    docker cp "${dbContainerId}:/tmp/db-backup.tar.gz" "./db-backup.tar.gz"
    
    if (Test-Path "db-backup.tar.gz") {
        Write-Host "Database backup created successfully" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Database backup failed!" -ForegroundColor Yellow
    }
} else {
    Write-Host "No database service found, skipping database backup" -ForegroundColor Yellow
}

# Step 2: Commit running containers
Write-Host "`nStep 2: Saving container states..." -ForegroundColor Yellow

Write-Host "Found services: $($services -join ', ')" -ForegroundColor Cyan

foreach ($service in $services) {
    $containerId = docker compose ps -q $service
    if ($containerId) {
        Write-Host "  Committing $service..." -ForegroundColor Cyan
        docker commit $containerId "${service}-snapshot:latest" | Out-Null
    }
}

Write-Host "All containers committed successfully" -ForegroundColor Green

# Step 3: Save images
Write-Host "`nStep 3: Packaging images..." -ForegroundColor Yellow
$imageList = @()
foreach ($service in $services) {
    $imageList += "${service}-snapshot:latest"
}

if ($imageList.Count -eq 0) {
    Write-Host "ERROR: No images to save!" -ForegroundColor Red
    exit 1
}

$saveCommand = "docker save -o webapp-stack.tar " + ($imageList -join " ")
Invoke-Expression $saveCommand

if (Test-Path "webapp-stack.tar") {
    Write-Host "Images saved to webapp-stack.tar successfully" -ForegroundColor Green
}
else {
    Write-Host "ERROR: Failed to create webapp-stack.tar!" -ForegroundColor Red
    exit 1
}

# Step 4: Create docker-compose file for deployment
Write-Host "`nStep 4: Creating compose configuration..." -ForegroundColor Yellow

$composeContent = "version: '3.8'`n`nservices:`n"

$hasDatabase = $false

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
    
    # DO NOT add volume for database - we'll restore it manually
    if ($service -match 'db|postgres') {
        $hasDatabase = $true
    }
    
    $composeContent += "`n"
}

# NO volumes section - data will be in the container image

$composeContent | Out-File -FilePath "docker-compose-deploy.yml" -Encoding UTF8
Write-Host "Created docker-compose-deploy.yml successfully" -ForegroundColor Green

# Step 5: Create deployment script for client
Write-Host "`nStep 5: Creating deployment script..." -ForegroundColor Yellow

$deployScript = @'
# Web Application Deployment Script
# Usage: powershell -ExecutionPolicy Bypass -File .\deploy.ps1

Write-Host "=== Deploying Web Application ===" -ForegroundColor Green

# Check if tar file exists
if (-not (Test-Path "webapp-stack.tar")) {
    Write-Host ""
    Write-Host "ERROR: webapp-stack.tar not found!" -ForegroundColor Red
    Write-Host "Make sure you are in the correct directory." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if docker-compose-deploy.yml exists
if (-not (Test-Path "docker-compose-deploy.yml")) {
    Write-Host ""
    Write-Host "ERROR: docker-compose-deploy.yml not found!" -ForegroundColor Red
    Write-Host "Make sure all files from the zip were extracted." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if Docker is running
Write-Host "`nChecking Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
Write-Host "Docker is running" -ForegroundColor Green

# Load Docker images
Write-Host "`nStep 1: Loading Docker images..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Cyan
docker load -i webapp-stack.tar

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Failed to load Docker images!" -ForegroundColor Red
    exit 1
}

Write-Host "Images loaded successfully" -ForegroundColor Green

# Restore database if backup exists
if (Test-Path "db-backup.tar.gz") {
    Write-Host "`nStep 2: Restoring database..." -ForegroundColor Yellow
    
    # Start only the database first
    $dbServices = docker compose -f docker-compose-deploy.yml config --services | Select-String -Pattern 'db|postgres'
    if ($dbServices) {
        $dbService = $dbServices -split "`n" | Select-Object -First 1
        Write-Host "Starting database service: $dbService" -ForegroundColor Cyan
        docker compose -f docker-compose-deploy.yml up -d $dbService
        
        Write-Host "Waiting for database to initialize..." -ForegroundColor Cyan
        Start-Sleep -Seconds 10
        
        # Copy backup into container and restore
        $dbContainerId = docker compose -f docker-compose-deploy.yml ps -q $dbService
        docker cp "db-backup.tar.gz" "${dbContainerId}:/tmp/db-backup.tar.gz"
        docker exec $dbContainerId sh -c "rm -rf /var/lib/postgresql/data/* && tar xzf /tmp/db-backup.tar.gz -C /var/lib/postgresql/data"
        
        Write-Host "Restarting database with restored data..." -ForegroundColor Cyan
        docker compose -f docker-compose-deploy.yml restart $dbService
        Start-Sleep -Seconds 5
        
        Write-Host "Database restored successfully" -ForegroundColor Green
    }
}

# Start all services
Write-Host "`nStep 3: Starting all services..." -ForegroundColor Yellow
docker compose -f docker-compose-deploy.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Failed to start the application!" -ForegroundColor Red
    exit 1
}

Write-Host "Application started successfully" -ForegroundColor Green

# Wait for services to initialize
Write-Host "`nWaiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Show deployment status
Write-Host ""
Write-Host "=== Deployment Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Your application is now running!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access your application at:" -ForegroundColor Yellow

# Show accessible URLs
$servicesJson = docker compose -f docker-compose-deploy.yml ps --format json | ConvertFrom-Json
$urlsShown = $false

foreach ($svc in $servicesJson) {
    $ports = $svc.Publishers
    if ($ports) {
        foreach ($port in $ports) {
            if ($port.PublishedPort) {
                Write-Host "  $($svc.Service): http://localhost:$($port.PublishedPort)" -ForegroundColor Cyan
                $urlsShown = $true
            }
        }
    }
}

if (-not $urlsShown) {
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
'@

$deployScript | Out-File -FilePath "deploy.ps1" -Encoding UTF8
Write-Host "Created deploy.ps1 successfully" -ForegroundColor Green

# Step 6: Create README for client
Write-Host "`nStep 6: Creating instructions..." -ForegroundColor Yellow

$readmeText = "=== Web Application Deployment Guide ===`n`n"
$readmeText += "REQUIREMENTS:`n"
$readmeText += "- Windows 10 or later`n"
$readmeText += "- Docker Desktop installed and running`n"
$readmeText += "- At least 5GB of free disk space`n`n"
$readmeText += "QUICK START:`n`n"
$readmeText += "1. Extract the zip file to a folder on your computer`n`n"
$readmeText += "2. Open PowerShell in that folder`n"
$readmeText += "   (Shift + Right-click in the folder, then select Open PowerShell window here)`n`n"
$readmeText += "3. Run the deployment script:`n"
$readmeText += "   powershell -ExecutionPolicy Bypass -File .\deploy.ps1`n`n"
$readmeText += "4. Wait for the deployment to complete (usually 2-5 minutes)`n`n"
$readmeText += "5. Access your application at the URLs shown after deployment`n`n"
$readmeText += "USEFUL COMMANDS:`n`n"
$readmeText += "View logs:`n"
$readmeText += "  docker compose -f docker-compose-deploy.yml logs -f`n`n"
$readmeText += "Stop application:`n"
$readmeText += "  docker compose -f docker-compose-deploy.yml down`n`n"
$readmeText += "Restart application:`n"
$readmeText += "  docker compose -f docker-compose-deploy.yml restart`n`n"

$readmeText | Out-File -FilePath "README.txt" -Encoding UTF8
Write-Host "Created README.txt successfully" -ForegroundColor Green

# Create Quick Reference Card
Write-Host "Creating quick reference..." -ForegroundColor Yellow

$quickRef = "=== Quick Reference Card ===`n`n"
$quickRef += "DEPLOYMENT (First Time):`n"
$quickRef += "  powershell -ExecutionPolicy Bypass -File .\deploy.ps1`n`n"
$quickRef += "COMMON COMMANDS:`n`n"
$quickRef += "View Logs:`n"
$quickRef += "  docker compose -f docker-compose-deploy.yml logs -f`n`n"
$quickRef += "Stop Application:`n"
$quickRef += "  docker compose -f docker-compose-deploy.yml down`n`n"
$quickRef += "Start Application (After Stopping):`n"
$quickRef += "  docker compose -f docker-compose-deploy.yml up -d`n`n"
$quickRef += "Restart Application:`n"
$quickRef += "  docker compose -f docker-compose-deploy.yml restart`n`n"

$quickRef | Out-File -FilePath "QUICK-REFERENCE.txt" -Encoding UTF8
Write-Host "Created QUICK-REFERENCE.txt successfully" -ForegroundColor Green

# Step 7: Create zip package
Write-Host "`nStep 7: Creating final package..." -ForegroundColor Yellow

$filesToZip = @("webapp-stack.tar", "docker-compose-deploy.yml", "deploy.ps1", "README.txt", "QUICK-REFERENCE.txt")

# Add database backup if it exists
if (Test-Path "db-backup.tar.gz") {
    $filesToZip += "db-backup.tar.gz"
}

# Verify all files exist
$missingFiles = @()
foreach ($file in $filesToZip) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "ERROR: Missing files: $($missingFiles -join ', ')" -ForegroundColor Red
    exit 1
}

Compress-Archive -Path $filesToZip -DestinationPath "webapp-deployment.zip" -Force

Write-Host ""
Write-Host "=== SUCCESS! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Created: webapp-deployment.zip" -ForegroundColor Cyan
Write-Host ""
Write-Host "Package includes:" -ForegroundColor Yellow
foreach ($file in $filesToZip) {
    Write-Host "  - $file" -ForegroundColor White
}
Write-Host ""
Write-Host "Send this file to your client." -ForegroundColor Yellow
Write-Host ""
Write-Host "Client instructions:" -ForegroundColor Yellow
Write-Host "  1. Extract the zip file" -ForegroundColor White
Write-Host "  2. Open PowerShell in that folder" -ForegroundColor White
Write-Host "  3. Run: powershell -ExecutionPolicy Bypass -File .\deploy.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Done!" -ForegroundColor Green
Write-Host ""

if (Test-Path "webapp-deployment.zip") {
    $fileSize = (Get-Item "webapp-deployment.zip").Length / 1MB
    Write-Host ("Package size: {0:N2} MB" -f $fileSize) -ForegroundColor Cyan
}
