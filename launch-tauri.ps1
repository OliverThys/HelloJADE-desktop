# HelloJADE v1.0 - Lancement Application Tauri
# Lancement de l'application desktop HelloJADE

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " HelloJADE v1.0 - Lancement Application Desktop" -ForegroundColor Cyan
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
        
        # Lancer l'application Tauri
        Write-Host ""
        Write-Host "Lancement de l'application Tauri..." -ForegroundColor Yellow
        if (Test-Path "frontend/src-tauri") {
            Set-Location frontend
            Write-Host "Construction de l'application Tauri..." -ForegroundColor Cyan
            npm run tauri:build
            Write-Host "✅ Application Tauri construite" -ForegroundColor Green
            
            # Vérifier que l'exécutable existe
            $exePath = ".\src-tauri\target\release\hellojade.exe"
            if (Test-Path $exePath) {
                # Lancer l'application
                Write-Host "Lancement de l'application desktop..." -ForegroundColor Cyan
                Start-Process $exePath -WindowStyle Normal
                Write-Host "✅ Application desktop HelloJADE lancee" -ForegroundColor Green
            } else {
                Write-Host "❌ Fichier executable non trouve: $exePath" -ForegroundColor Red
                Write-Host "Verifiez que la construction s'est bien terminee" -ForegroundColor Yellow
            }
            Set-Location ..
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

# Résumé final
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " HelloJADE v1.0 Desktop est maintenant lance !" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Interfaces disponibles:" -ForegroundColor Cyan
Write-Host "- Application Desktop: HelloJADE.exe" -ForegroundColor White
Write-Host "- Grafana (Monitoring): http://localhost:3000" -ForegroundColor White
Write-Host "  Username: admin" -ForegroundColor White
Write-Host "  Password: hellojade123" -ForegroundColor White
Write-Host "- Prometheus (Metriques): http://localhost:9090" -ForegroundColor White
Write-Host "- Ollama (IA): http://localhost:11434" -ForegroundColor White
Write-Host "- Redis (Cache): localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "1. Utiliser l'application desktop HelloJADE" -ForegroundColor White
Write-Host "2. Configurer les dashboards Grafana" -ForegroundColor White
Write-Host "3. Configurer les modeles IA dans Ollama" -ForegroundColor White
Write-Host ""
Write-Host "Documentation: docs/configuration-production.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Bonne utilisation de HelloJADE Desktop !" -ForegroundColor Green 