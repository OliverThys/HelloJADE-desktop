# Script pour tuer le processus sur le port 5173
param(
    [int]$Port = 5173
)

Write-Host "🔍 Recherche du processus sur le port $Port..." -ForegroundColor Yellow

# Trouver le processus qui utilise le port
$processId = (Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess

if ($processId) {
    Write-Host "🔄 Arrêt du processus $processId sur le port $Port..." -ForegroundColor Red
    try {
        Stop-Process -Id $processId -Force
        Write-Host "✅ Processus $processId arrêté avec succès" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "❌ Erreur lors de l'arrêt du processus: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "ℹ️ Aucun processus trouvé sur le port $Port" -ForegroundColor Blue
}

Write-Host "🚀 Démarrage du serveur de développement..." -ForegroundColor Green 