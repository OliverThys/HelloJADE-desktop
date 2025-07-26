# HelloJADE v1.0 - Configuration Oracle comme serveur séparé
# Ce script configure Oracle Database comme un serveur accessible à distance
# Simulation d'un environnement hospitalier réel

Write-Host "=== HelloJADE - Configuration Oracle Serveur ===" -ForegroundColor Green
Write-Host "Simulation d'un environnement hospitalier avec serveur Oracle séparé" -ForegroundColor Cyan

# Vérification de Docker
Write-Host "Vérification de Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✓ Docker est installé" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker n'est pas installé" -ForegroundColor Red
    exit 1
}

# Arrêt des conteneurs existants
Write-Host "Arrêt des conteneurs Oracle existants..." -ForegroundColor Yellow
docker stop hellojade-oracle-server 2>$null
docker rm hellojade-oracle-server 2>$null

# Création du réseau sécurisé
Write-Host "Création du réseau sécurisé pour l'hôpital..." -ForegroundColor Yellow
docker network create hellojade-hospital-network 2>$null

# Configuration des variables d'environnement pour l'hôpital
$env:ORACLE_HOST = "192.168.1.100"  # IP du serveur Oracle (simulation)
$env:ORACLE_PORT = "1521"
$env:ORACLE_SERVICE = "XE"
$env:ORACLE_USER = "hellojade"
$env:ORACLE_PASSWORD = "hellojade123"

# Démarrage d'Oracle comme serveur séparé
Write-Host "Démarrage d'Oracle Database comme serveur séparé..." -ForegroundColor Yellow
Write-Host "IP du serveur: $env:ORACLE_HOST" -ForegroundColor Cyan
Write-Host "Port: $env:ORACLE_PORT" -ForegroundColor Cyan

docker run -d `
    --name hellojade-oracle-server `
    --network hellojade-hospital-network `
    --ip 192.168.1.100 `
    -p 1521:1521 `
    -p 5500:5500 `
    -e ORACLE_PWD=hellojade123 `
    -e ORACLE_CHARACTERSET=AL32UTF8 `
    -e ORACLE_ENABLE_CDB=false `
    -v "${PWD}/oracle/init:/opt/oracle/scripts/startup" `
    -v "${PWD}/oracle/data:/opt/oracle/oradata" `
    --restart unless-stopped `
    container-registry.oracle.com/database/express:21.3.0-xe

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Serveur Oracle démarré avec succès" -ForegroundColor Green
} else {
    Write-Host "✗ Erreur lors du démarrage du serveur Oracle" -ForegroundColor Red
    exit 1
}

# Attente du démarrage complet
Write-Host "Attente du démarrage complet du serveur Oracle..." -ForegroundColor Yellow
Write-Host "Cette opération peut prendre 5-10 minutes..." -ForegroundColor Cyan

$maxAttempts = 60
$attempt = 0
$oracleReady = $false

while ($attempt -lt $maxAttempts -and -not $oracleReady) {
    $attempt++
    Write-Progress -Activity "Démarrage du serveur Oracle" -Status "Tentative $attempt/$maxAttempts" -PercentComplete (($attempt / $maxAttempts) * 100)
    
    Start-Sleep -Seconds 10
    
    try {
        $logs = docker logs hellojade-oracle-server 2>&1
        if ($logs -match "DATABASE IS READY TO USE") {
            $oracleReady = $true
            Write-Host "✓ Serveur Oracle est prêt !" -ForegroundColor Green
        } else {
            Write-Host "En attente... (tentative $attempt/$maxAttempts)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "En attente... (tentative $attempt/$maxAttempts)" -ForegroundColor Yellow
    }
}

Write-Progress -Activity "Démarrage du serveur Oracle" -Completed

if ($oracleReady) {
    Write-Host "=== Configuration du serveur ===" -ForegroundColor Green
    
    # Exécution des scripts d'initialisation
    Write-Host "Initialisation de la base de données hospitalière..." -ForegroundColor Yellow
    docker exec hellojade-oracle-server sqlplus -s system/hellojade123@//localhost:1521/XE @/opt/oracle/scripts/startup/01-init-database.sql
    docker exec hellojade-oracle-server sqlplus -s system/hellojade123@//localhost:1521/XE @/opt/oracle/scripts/startup/02-test-data.sql
    
    # Configuration de la sécurité réseau
    Write-Host "Configuration de la sécurité réseau..." -ForegroundColor Yellow
    
    # Création d'un fichier de configuration réseau
    $networkConfig = @"
# HelloJADE - Configuration réseau hospitalière
# Simulation d'un environnement hospitalier sécurisé

# Informations du serveur Oracle
ORACLE_HOST=$env:ORACLE_HOST
ORACLE_PORT=$env:ORACLE_PORT
ORACLE_SERVICE=$env:ORACLE_SERVICE
ORACLE_USER=$env:ORACLE_USER
ORACLE_PASSWORD=$env:ORACLE_PASSWORD

# Configuration réseau
NETWORK_NAME=hellojade-hospital-network
SUBNET=192.168.1.0/24
GATEWAY=192.168.1.1

# Sécurité
FIREWALL_ENABLED=true
SSL_ENABLED=true
AUDIT_LOGGING=true
"@

    $networkConfig | Out-File -FilePath "infrastructure/hospital-network.conf" -Encoding UTF8
    
    Write-Host "=== Informations du serveur Oracle ===" -ForegroundColor Green
    Write-Host "Serveur Oracle (simulation hôpital):" -ForegroundColor White
    Write-Host "  IP: $env:ORACLE_HOST" -ForegroundColor Cyan
    Write-Host "  Port: $env:ORACLE_PORT" -ForegroundColor Cyan
    Write-Host "  Service: $env:ORACLE_SERVICE" -ForegroundColor Cyan
    Write-Host "  Utilisateur: $env:ORACLE_USER" -ForegroundColor Cyan
    Write-Host "  Mot de passe: $env:ORACLE_PASSWORD" -ForegroundColor Cyan
    
    Write-Host "=== Connexion à distance ===" -ForegroundColor Green
    Write-Host "Votre application HelloJADE peut maintenant se connecter à:" -ForegroundColor White
    Write-Host "  Host: $env:ORACLE_HOST" -ForegroundColor Cyan
    Write-Host "  Port: $env:ORACLE_PORT" -ForegroundColor Cyan
    Write-Host "  Service: $env:ORACLE_SERVICE" -ForegroundColor Cyan
    
    Write-Host "=== Commandes de gestion ===" -ForegroundColor Green
    Write-Host "Voir les logs: docker logs -f hellojade-oracle-server" -ForegroundColor Cyan
    Write-Host "Se connecter: docker exec -it hellojade-oracle-server sqlplus $env:ORACLE_USER/$env:ORACLE_PASSWORD@//localhost:1521/XE" -ForegroundColor Cyan
    Write-Host "Arrêter le serveur: docker stop hellojade-oracle-server" -ForegroundColor Cyan
    Write-Host "Redémarrer: docker start hellojade-oracle-server" -ForegroundColor Cyan
    
    Write-Host "=== Serveur Oracle hospitalier prêt ! ===" -ForegroundColor Green
    Write-Host "Simulation d'un environnement hospitalier avec serveur Oracle séparé" -ForegroundColor Cyan
} else {
    Write-Host "✗ Le serveur Oracle n'a pas démarré dans le délai imparti" -ForegroundColor Red
    Write-Host "Vérifiez les logs avec: docker logs hellojade-oracle-server" -ForegroundColor Yellow
    exit 1
} 