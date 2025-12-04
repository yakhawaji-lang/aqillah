# Script to check MySQL status and fix issues

Write-Host "Checking MySQL status..." -ForegroundColor Cyan

# Check for MySQL services
$mysqlServices = Get-Service | Where-Object {$_.Name -like "*mysql*"}

if ($mysqlServices.Count -eq 0) {
    Write-Host "MySQL not found in services" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible solutions:" -ForegroundColor Yellow
    Write-Host "1. Make sure MySQL or XAMPP is installed" -ForegroundColor White
    Write-Host "2. If using XAMPP, start MySQL from Control Panel" -ForegroundColor White
    Write-Host "3. If using MySQL Server, make sure it's running" -ForegroundColor White
    exit 1
}

Write-Host "Found MySQL services:" -ForegroundColor Green
foreach ($service in $mysqlServices) {
    $status = if ($service.Status -eq "Running") { "Running" } else { "Stopped" }
    Write-Host "  - $($service.Name): $status" -ForegroundColor $(if ($service.Status -eq "Running") { "Green" } else { "Red" })
}

# Check for stopped services
$stoppedServices = $mysqlServices | Where-Object {$_.Status -ne "Running"}

if ($stoppedServices.Count -gt 0) {
    Write-Host ""
    Write-Host "Some MySQL services are stopped" -ForegroundColor Yellow
    
    foreach ($service in $stoppedServices) {
        Write-Host ""
        Write-Host "Attempting to start: $($service.Name)..." -ForegroundColor Cyan
        
        try {
            Start-Service -Name $service.Name -ErrorAction Stop
            Write-Host "Successfully started $($service.Name)" -ForegroundColor Green
            
            # Wait a bit to ensure startup
            Start-Sleep -Seconds 3
            
            # Check again
            $service.Refresh()
            if ($service.Status -eq "Running") {
                Write-Host "$($service.Name) is now running" -ForegroundColor Green
            } else {
                Write-Host "$($service.Name) is still stopped" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "Failed to start $($service.Name): $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ""
            Write-Host "Additional solutions:" -ForegroundColor Yellow
            Write-Host "1. Start MySQL manually from Control Panel (XAMPP Control Panel)" -ForegroundColor White
            Write-Host "2. Or start MySQL from Services (services.msc)" -ForegroundColor White
            Write-Host "3. Make sure you have Administrator permissions" -ForegroundColor White
        }
    }
}

# Check MySQL connection
Write-Host ""
Write-Host "Checking MySQL connection on localhost:3306..." -ForegroundColor Cyan

try {
    # Try to connect using Test-NetConnection
    $connection = Test-NetConnection -ComputerName localhost -Port 3306 -WarningAction SilentlyContinue
    
    if ($connection.TcpTestSucceeded) {
        Write-Host "MySQL connection on port 3306 successful" -ForegroundColor Green
    } else {
        Write-Host "Failed to connect to MySQL on port 3306" -ForegroundColor Red
        Write-Host ""
        Write-Host "Solutions:" -ForegroundColor Yellow
        Write-Host "1. Make sure MySQL is running" -ForegroundColor White
        Write-Host "2. Check that MySQL is listening on port 3306" -ForegroundColor White
        Write-Host "3. Check Firewall settings" -ForegroundColor White
    }
} catch {
    Write-Host "Could not check connection: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Check .env file
Write-Host ""
Write-Host "Checking .env file..." -ForegroundColor Cyan

if (Test-Path ".env") {
    Write-Host ".env file exists" -ForegroundColor Green
    
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "DATABASE_URL") {
        Write-Host "DATABASE_URL found in .env" -ForegroundColor Green
        
        # Extract DATABASE_URL (without showing password)
        $dbUrl = ($envContent -split "`n" | Where-Object { $_ -match "DATABASE_URL" }) -replace "=.*", "=***"
        Write-Host "  $dbUrl" -ForegroundColor Gray
    } else {
        Write-Host "DATABASE_URL not found in .env" -ForegroundColor Red
        Write-Host ""
        Write-Host "Add this line to .env file:" -ForegroundColor Yellow
        Write-Host 'DATABASE_URL="mysql://root:your_password@localhost:3306/aqqilha"' -ForegroundColor White
    }
} else {
    Write-Host ".env file not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Create .env file in project root and add:" -ForegroundColor Yellow
    Write-Host 'DATABASE_URL="mysql://root:your_password@localhost:3306/aqqilha"' -ForegroundColor White
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure MySQL is running" -ForegroundColor White
Write-Host "2. Make sure DATABASE_URL exists in .env" -ForegroundColor White
Write-Host "3. Create database if it doesn't exist:" -ForegroundColor White
Write-Host "   mysql -u root -p -e 'CREATE DATABASE IF NOT EXISTS aqqilha;'" -ForegroundColor Gray
Write-Host "4. Apply database schema:" -ForegroundColor White
Write-Host "   npm run db:push" -ForegroundColor Gray
Write-Host "5. Restart Next.js:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
