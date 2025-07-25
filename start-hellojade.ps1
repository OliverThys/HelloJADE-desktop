# HelloJADE v1.0 - Script de démarrage
# Démarrage de l'application HelloJADE

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " HelloJADE v1.0 - Démarrage de l'application" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Docker est démarré
Write-Host "🔍 Vérification des services Docker..." -ForegroundColor Yellow
$dockerStatus = docker-compose -f infrastructure/docker-compose-minimal.yml ps --format "table {{.Name}}\t{{.Status}}"
Write-Host $dockerStatus -ForegroundColor Green

# Démarrer l'infrastructure si nécessaire
Write-Host ""
Write-Host "🐳 Démarrage de l'infrastructure..." -ForegroundColor Yellow
Set-Location infrastructure
docker-compose -f docker-compose-minimal.yml up -d
Set-Location ..

# Attendre que les services soient prêts
Write-Host ""
Write-Host "⏳ Attente du démarrage des services..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Vérifier les services
Write-Host ""
Write-Host "🔍 Vérification des services..." -ForegroundColor Yellow

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

# Résumé final
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " HelloJADE v1.0 est maintenant démarré !" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Interfaces disponibles:" -ForegroundColor Cyan
Write-Host "- Grafana (Monitoring): http://localhost:3000" -ForegroundColor White
Write-Host "  Username: admin" -ForegroundColor White
Write-Host "  Password: hellojade123" -ForegroundColor White
Write-Host "- Prometheus (Métriques): http://localhost:9090" -ForegroundColor White
Write-Host "- Ollama (IA): http://localhost:11434" -ForegroundColor White
Write-Host "- Redis (Cache): localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. Accéder à Grafana pour configurer les dashboards" -ForegroundColor White
Write-Host "2. Installer Python et Node.js pour le développement" -ForegroundColor White
Write-Host "3. Configurer les modèles IA dans Ollama" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation: docs/configuration-production.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Bon développement avec HelloJADE !" -ForegroundColor Green 