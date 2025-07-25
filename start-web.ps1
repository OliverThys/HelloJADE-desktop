# HelloJADE v1.0 - Démarrage Application Web
# Script simplifié pour lancer l'application web

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " HelloJADE v1.0 - Démarrage Application Web" -ForegroundColor Cyan
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

# Démarrer le frontend
Write-Host ""
Write-Host "Demarrage du frontend Vue.js..." -ForegroundColor Yellow
if (Test-Path "frontend/package.json") {
    Set-Location frontend
    
    # Arrêter les processus Node.js existants
    Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # Démarrer le serveur de développement
    Write-Host "Lancement du serveur de developpement..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal
    
    Set-Location ..
    Write-Host "✅ Frontend Vue.js demarre" -ForegroundColor Green
    
    # Attendre que le serveur démarre
    Write-Host "Attente du demarrage du serveur..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    # Ouvrir le navigateur
    Write-Host "Ouverture du navigateur..." -ForegroundColor Cyan
    Start-Process "http://localhost:5173"
    
} else {
    Write-Host "❌ Fichier package.json non trouve dans le dossier frontend" -ForegroundColor Red
}

# Résumé final
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " HelloJADE v1.0 Web est maintenant demarre !" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Interfaces disponibles:" -ForegroundColor Cyan
Write-Host "- Frontend Web: http://localhost:5173" -ForegroundColor White
Write-Host "- Grafana (Monitoring): http://localhost:3000" -ForegroundColor White
Write-Host "  Username: admin" -ForegroundColor White
Write-Host "  Password: hellojade123" -ForegroundColor White
Write-Host "- Prometheus (Metriques): http://localhost:9090" -ForegroundColor White
Write-Host "- Ollama (IA): http://localhost:11434" -ForegroundColor White
Write-Host "- Redis (Cache): localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "1. Utiliser l'interface web sur http://localhost:5173" -ForegroundColor White
Write-Host "2. Configurer les dashboards Grafana" -ForegroundColor White
Write-Host "3. Configurer les modeles IA dans Ollama" -ForegroundColor White
Write-Host ""
Write-Host "Documentation: docs/configuration-production.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Bonne utilisation de HelloJADE Web !" -ForegroundColor Green 