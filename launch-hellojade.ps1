# HelloJADE v1.0 - Script de lancement complet
# Démarrage de l'application HelloJADE avec backend et frontend

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " HelloJADE v1.0 - Lancement complet de l'application" -ForegroundColor Cyan
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

# Vérifier Python
Write-Host ""
Write-Host "Verification de Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>$null
if ($pythonVersion) {
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
    
    # Démarrer le backend Python
    Write-Host ""
    Write-Host "Demarrage du backend Python..." -ForegroundColor Yellow
    if (Test-Path "backend/app.py") {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; python backend/app.py" -WindowStyle Normal
        Write-Host "✅ Backend Python démarré" -ForegroundColor Green
    } else {
        Write-Host "❌ Fichier backend/app.py non trouvé" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Python non installé" -ForegroundColor Red
    Write-Host "Executez en tant qu'administrateur: .\scripts\install-prerequisites.ps1" -ForegroundColor Yellow
}

# Vérifier Node.js
Write-Host ""
Write-Host "Verification de Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    
    # Démarrer le frontend Vue.js
    Write-Host ""
    Write-Host "Demarrage du frontend Vue.js..." -ForegroundColor Yellow
    if (Test-Path "frontend/package.json") {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev" -WindowStyle Normal
        Write-Host "✅ Frontend Vue.js démarré" -ForegroundColor Green
    } else {
        Write-Host "❌ Fichier frontend/package.json non trouvé" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Node.js non installé" -ForegroundColor Red
}

# Résumé final
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " HelloJADE v1.0 est maintenant démarré !" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Interfaces disponibles:" -ForegroundColor Cyan
Write-Host "- Grafana (Monitoring): http://localhost:3000" -ForegroundColor White
Write-Host "  Username: admin" -ForegroundColor White
Write-Host "  Password: hellojade123" -ForegroundColor White
Write-Host "- Prometheus (Métriques): http://localhost:9090" -ForegroundColor White
Write-Host "- Ollama (IA): http://localhost:11434" -ForegroundColor White
Write-Host "- Redis (Cache): localhost:6379" -ForegroundColor White
Write-Host "- Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "- Frontend Web: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "1. Accéder à Grafana pour configurer les dashboards" -ForegroundColor White
Write-Host "2. Configurer les modèles IA dans Ollama" -ForegroundColor White
Write-Host "3. Tester l'API backend sur http://localhost:8000" -ForegroundColor White
Write-Host "4. Accéder au frontend sur http://localhost:5173" -ForegroundColor White
Write-Host "5. Lancer l'application desktop: .\launch-tauri.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Documentation: docs/configuration-production.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Bon développement avec HelloJADE !" -ForegroundColor Green 