# Script PowerShell pour démarrer le serveur de développement avec nettoyage automatique
param(
    [int]$Port = 5173
)

Write-Host "🚀 Démarrage du serveur de développement HelloJADE" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Vérifier si Node.js est installé
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Vérifier si npm est installé
try {
    $npmVersion = npm --version
    Write-Host "✅ npm détecté: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Recherche du processus sur le port $Port..." -ForegroundColor Yellow

# Trouver le processus qui utilise le port
$processId = (Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess

if ($processId) {
    Write-Host "🔄 Arrêt du processus $processId sur le port $Port..." -ForegroundColor Red
    
    try {
        # Obtenir les informations du processus
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "📋 Processus à arrêter: $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
        }
        
        # Arrêter le processus
        Stop-Process -Id $processId -Force
        Write-Host "✅ Processus $processId arrêté avec succès" -ForegroundColor Green
        
        # Attendre que le port soit libéré
        Write-Host "⏳ Attente de la libération du port..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        
        # Vérifier que le port est bien libéré
        $remainingProcess = (Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess
        if ($remainingProcess) {
            Write-Host "⚠️ Le processus $remainingProcess utilise encore le port $Port" -ForegroundColor Yellow
        } else {
            Write-Host "✅ Port $Port libéré avec succès" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ Erreur lors de l'arrêt du processus: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "ℹ️ Aucun processus trouvé sur le port $Port" -ForegroundColor Blue
}

Write-Host "🚀 Démarrage du serveur de développement..." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan

# Démarrer le serveur de développement
try {
    npm run dev
} catch {
    Write-Host "❌ Erreur lors du démarrage du serveur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} 