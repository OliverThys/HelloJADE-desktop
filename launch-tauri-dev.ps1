# HelloJADE v1.0 - Lancement Application Tauri en Mode Développement
# Lancement de l'application desktop HelloJADE en mode développement

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " HelloJADE v1.0 - Mode Développement" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Docker est démarré
Write-Host "Verification des services Docker..." -ForegroundColor Yellow
$dockerStatus = docker-compose -f infrastructure/docker-compose-minimal.yml ps --format "table {{.Name}}\t{{.Status}}"
Write-Host $dockerStatus -ForegroundColor Green

# Démarrer l'infrastructure si nécessaire
Write-Host ""
Write-Host "Demarrage de l'infrastructure..." -ForegroundColor Yellow
Set-Location infrastructure
docker-compose -f docker-compose-minimal.yml up -d
Set-Location ..

# Attendre que les services soient prêts
Write-Host ""
Write-Host "Attente du demarrage des services..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Vérifier les services
Write-Host ""
Write-Host "Verification des services..." -ForegroundColor Yellow

# Test Redis
try {
    $redisTest = docker exec hellojade-redis redis-cli ping
    if ($redisTest -eq "PONG") {
        Write-Host "✅ Redis: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Redis: ERREUR" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Redis: ERREUR" -ForegroundColor Red
}

# Test Prometheus
try {
    $prometheusTest = Invoke-WebRequest -Uri "http://localhost:9090" -TimeoutSec 5
    if ($prometheusTest.StatusCode -eq 200) {
        Write-Host "✅ Prometheus: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Prometheus: ERREUR" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Prometheus: ERREUR" -ForegroundColor Red
}

# Test Grafana
try {
    $grafanaTest = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5
    if ($grafanaTest.StatusCode -eq 200) {
        Write-Host "✅ Grafana: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Grafana: ERREUR" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Grafana: ERREUR" -ForegroundColor Red
}

# Test Ollama
try {
    $ollamaTest = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 5
    if ($ollamaTest.StatusCode -eq 200) {
        Write-Host "✅ Ollama: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Ollama: ERREUR" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Ollama: ERREUR" -ForegroundColor Red
}

# Vérifier Node.js
Write-Host ""
Write-Host "Verification de Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    
    # Vérifier Rust
    Write-Host ""
    Write-Host "Verification de Rust..." -ForegroundColor Yellow
    $rustVersion = rustc --version 2>$null
    if ($rustVersion) {
        Write-Host "✅ Rust: $rustVersion" -ForegroundColor Green
        
        # Lancer l'application Tauri en mode développement
        Write-Host ""
        Write-Host "Lancement de l'application Tauri en mode developpement..." -ForegroundColor Yellow
        if (Test-Path "frontend/src-tauri") {
            Set-Location frontend
            Write-Host "Demarrage du serveur de developpement..." -ForegroundColor Cyan
            npm run tauri:dev
        } else {
            Write-Host "❌ Dossier src-tauri non trouve" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Rust non installe" -ForegroundColor Red
        Write-Host "Executez en tant qu'administrateur: .\scripts\install-prerequisites.ps1" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Node.js non installe" -ForegroundColor Red
} 