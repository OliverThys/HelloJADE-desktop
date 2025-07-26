# HelloJADE v1.0 - Script de démarrage de la base de données Oracle
# Ce script démarre Oracle Database Express Edition dans un conteneur Docker

Write-Host "=== HelloJADE - Démarrage Base de Données Oracle ===" -ForegroundColor Green

# Vérification de Docker
Write-Host "Vérification de Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✓ Docker est installé" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker n'est pas installé ou n'est pas accessible" -ForegroundColor Red
    Write-Host "Veuillez installer Docker Desktop depuis https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Vérification que Docker est démarré
Write-Host "Vérification que Docker est démarré..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker est démarré" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker n'est pas démarré" -ForegroundColor Red
    Write-Host "Veuillez démarrer Docker Desktop" -ForegroundColor Yellow
    exit 1
}

# Arrêt des conteneurs existants
Write-Host "Arrêt des conteneurs Oracle existants..." -ForegroundColor Yellow
docker stop hellojade-oracle 2>$null
docker rm hellojade-oracle 2>$null

# Création du réseau si nécessaire
Write-Host "Création du réseau Docker..." -ForegroundColor Yellow
docker network create hellojade-network 2>$null

# Démarrage d'Oracle Database
Write-Host "Démarrage d'Oracle Database Express Edition..." -ForegroundColor Yellow
Write-Host "Cette opération peut prendre plusieurs minutes lors du premier démarrage..." -ForegroundColor Cyan

docker run -d `
    --name hellojade-oracle `
    --network hellojade-network `
    -p 1521:1521 `
    -e ORACLE_PWD=hellojade123 `
    -e ORACLE_CHARACTERSET=AL32UTF8 `
    -v "${PWD}/oracle/init:/opt/oracle/scripts/startup" `
    container-registry.oracle.com/database/express:21.3.0-xe

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Conteneur Oracle démarré avec succès" -ForegroundColor Green
} else {
    Write-Host "✗ Erreur lors du démarrage du conteneur Oracle" -ForegroundColor Red
    exit 1
}

# Attente du démarrage complet
Write-Host "Attente du démarrage complet d'Oracle (peut prendre 5-10 minutes)..." -ForegroundColor Yellow
Write-Host "Vous pouvez surveiller les logs avec: docker logs -f hellojade-oracle" -ForegroundColor Cyan

$maxAttempts = 60
$attempt = 0
$oracleReady = $false

while ($attempt -lt $maxAttempts -and -not $oracleReady) {
    $attempt++
    Write-Progress -Activity "Démarrage d'Oracle Database" -Status "Tentative $attempt/$maxAttempts" -PercentComplete (($attempt / $maxAttempts) * 100)
    
    Start-Sleep -Seconds 10
    
    try {
        $logs = docker logs hellojade-oracle 2>&1
        if ($logs -match "DATABASE IS READY TO USE") {
            $oracleReady = $true
            Write-Host "✓ Oracle Database est prêt !" -ForegroundColor Green
        } elseif ($logs -match "DATABASE IS STARTING UP") {
            Write-Host "Oracle Database démarre... (tentative $attempt/$maxAttempts)" -ForegroundColor Yellow
        } else {
            Write-Host "En attente... (tentative $attempt/$maxAttempts)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "En attente... (tentative $attempt/$maxAttempts)" -ForegroundColor Yellow
    }
}

Write-Progress -Activity "Démarrage d'Oracle Database" -Completed

if ($oracleReady) {
    Write-Host "=== Configuration de la base de données ===" -ForegroundColor Green
    
    # Exécution du script d'initialisation
    Write-Host "Exécution du script d'initialisation..." -ForegroundColor Yellow
    docker exec hellojade-oracle sqlplus -s system/hellojade123@//localhost:1521/XE @/opt/oracle/scripts/startup/01-init-database.sql
    
    # Exécution du script de données de test
    Write-Host "Insertion des données de test..." -ForegroundColor Yellow
    docker exec hellojade-oracle sqlplus -s system/hellojade123@//localhost:1521/XE @/opt/oracle/scripts/startup/02-test-data.sql
    
    Write-Host "=== Informations de connexion ===" -ForegroundColor Green
    Write-Host "Host: localhost" -ForegroundColor White
    Write-Host "Port: 1521" -ForegroundColor White
    Write-Host "Service: XE" -ForegroundColor White
    Write-Host "Utilisateur système: system" -ForegroundColor White
    Write-Host "Mot de passe système: hellojade123" -ForegroundColor White
    Write-Host "Utilisateur HelloJADE: hellojade" -ForegroundColor White
    Write-Host "Mot de passe HelloJADE: hellojade123" -ForegroundColor White
    
    Write-Host "=== Commandes utiles ===" -ForegroundColor Green
    Write-Host "Voir les logs: docker logs -f hellojade-oracle" -ForegroundColor Cyan
    Write-Host "Se connecter à Oracle: docker exec -it hellojade-oracle sqlplus hellojade/hellojade123@//localhost:1521/XE" -ForegroundColor Cyan
    Write-Host "Arrêter Oracle: docker stop hellojade-oracle" -ForegroundColor Cyan
    Write-Host "Redémarrer Oracle: docker start hellojade-oracle" -ForegroundColor Cyan
    
    Write-Host "=== Base de données Oracle prête ! ===" -ForegroundColor Green
} else {
    Write-Host "✗ Oracle Database n'a pas démarré dans le délai imparti" -ForegroundColor Red
    Write-Host "Vérifiez les logs avec: docker logs hellojade-oracle" -ForegroundColor Yellow
    exit 1
} 