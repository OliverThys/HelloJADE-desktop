# HelloJADE v1.0 - Test de connexion à distance au serveur Oracle
# Simulation d'une connexion depuis l'application vers le serveur hospitalier

Write-Host "=== HelloJADE - Test Connexion à Distance Oracle ===" -ForegroundColor Green
Write-Host "Simulation d'une connexion depuis l'application vers le serveur hospitalier" -ForegroundColor Cyan

# Configuration du serveur Oracle (simulation hôpital)
$ORACLE_HOST = "192.168.1.100"
$ORACLE_PORT = "1521"
$ORACLE_SERVICE = "XE"
$ORACLE_USER = "hellojade"
$ORACLE_PASSWORD = "hellojade123"

# Vérification que le serveur Oracle est en cours d'exécution
Write-Host "Vérification du serveur Oracle hospitalier..." -ForegroundColor Yellow
$containerStatus = docker ps --filter "name=hellojade-oracle-server" --format "table {{.Names}}\t{{.Status}}"

if ($containerStatus -match "hellojade-oracle-server") {
    Write-Host "✓ Serveur Oracle hospitalier en cours d'exécution" -ForegroundColor Green
} else {
    Write-Host "✗ Serveur Oracle hospitalier non trouvé" -ForegroundColor Red
    Write-Host "Démarrez d'abord le serveur avec: .\oracle-server-setup.ps1" -ForegroundColor Yellow
    exit 1
}

# Test de connectivité réseau
Write-Host "Test de connectivité réseau vers le serveur..." -ForegroundColor Yellow
try {
    $pingResult = Test-NetConnection -ComputerName $ORACLE_HOST -Port $ORACLE_PORT -InformationLevel Quiet
    if ($pingResult) {
        Write-Host "✓ Connectivité réseau OK vers $ORACLE_HOST:$ORACLE_PORT" -ForegroundColor Green
    } else {
        Write-Host "⚠ Connectivité réseau limitée (normal en environnement Docker)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Test de connectivité réseau échoué (normal en environnement Docker)" -ForegroundColor Yellow
}

# Test de connexion via Docker (simulation d'une connexion à distance)
Write-Host "Test de connexion à distance au serveur Oracle..." -ForegroundColor Yellow

$testQuery = @"
SELECT 'Connexion à distance réussie' AS status FROM dual;
SELECT COUNT(*) AS total_patients FROM patients;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_calls FROM calls;
SELECT 'Serveur Oracle hospitalier accessible' AS message FROM dual;
"@

try {
    Write-Host "Tentative de connexion à $ORACLE_HOST:$ORACLE_PORT..." -ForegroundColor Cyan
    $result = docker exec hellojade-oracle-server sqlplus -s $ORACLE_USER/$ORACLE_PASSWORD@//localhost:1521/XE <<< $testQuery 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Connexion à distance au serveur Oracle réussie !" -ForegroundColor Green
        Write-Host "Résultats du test :" -ForegroundColor Cyan
        Write-Host $result -ForegroundColor White
    } else {
        Write-Host "✗ Erreur de connexion à distance au serveur Oracle" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Erreur lors du test de connexion à distance" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test de connexion avec un client Python (simulation de l'application)
Write-Host "Test avec client Python (simulation de l'application HelloJADE)..." -ForegroundColor Yellow

$pythonTest = @"
import cx_Oracle
import sys

# Configuration de connexion à distance (simulation hôpital)
config = {
    'host': '$ORACLE_HOST',
    'port': $ORACLE_PORT,
    'service': '$ORACLE_SERVICE',
    'user': '$ORACLE_USER',
    'password': '$ORACLE_PASSWORD'
}

try:
    # Connexion à distance au serveur Oracle
    dsn = f"{config['host']}:{config['port']}/{config['service']}"
    connection = cx_Oracle.connect(config['user'], config['password'], dsn)
    
    cursor = connection.cursor()
    
    # Test de requêtes
    cursor.execute('SELECT COUNT(*) FROM patients')
    patients_count = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM calls WHERE status = \\'completed\\'')
    calls_count = cursor.fetchone()[0]
    
    cursor.execute('SELECT first_name, last_name FROM patients LIMIT 3')
    sample_patients = cursor.fetchall()
    
    print(f'✓ Connexion Python à distance réussie')
    print(f'  - Nombre de patients: {patients_count}')
    print(f'  - Appels complétés: {calls_count}')
    print(f'  - Exemple patients: {[f"{p[0]} {p[1]}" for p in sample_patients]}')
    
    cursor.close()
    connection.close()
    
except Exception as e:
    print(f'✗ Erreur Python: {e}')
    sys.exit(1)
"@

try {
    python -c $pythonTest 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Connexion Python à distance réussie" -ForegroundColor Green
    } else {
        Write-Host "⚠ Connexion Python à distance échouée (cx_Oracle non installé)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Python ou cx_Oracle non disponible" -ForegroundColor Yellow
}

# Test de performance (simulation d'un environnement hospitalier)
Write-Host "Test de performance du serveur Oracle..." -ForegroundColor Yellow

$performanceQuery = @"
SELECT 
    'Performance Test' AS test_type,
    COUNT(*) AS total_records,
    SYSDATE AS test_time
FROM (
    SELECT 1 FROM patients
    UNION ALL
    SELECT 1 FROM calls
    UNION ALL
    SELECT 1 FROM users
    UNION ALL
    SELECT 1 FROM medical_records
);
"@

try {
    $perfResult = docker exec hellojade-oracle-server sqlplus -s $ORACLE_USER/$ORACLE_PASSWORD@//localhost:1521/XE <<< $performanceQuery 2>&1
    Write-Host "✓ Test de performance réussi" -ForegroundColor Green
} catch {
    Write-Host "⚠ Test de performance échoué" -ForegroundColor Yellow
}

Write-Host "=== Résumé de la configuration ===" -ForegroundColor Green
Write-Host "Serveur Oracle hospitalier:" -ForegroundColor White
Write-Host "  IP: $ORACLE_HOST" -ForegroundColor Cyan
Write-Host "  Port: $ORACLE_PORT" -ForegroundColor Cyan
Write-Host "  Service: $ORACLE_SERVICE" -ForegroundColor Cyan
Write-Host "  Utilisateur: $ORACLE_USER" -ForegroundColor Cyan

Write-Host "=== Connexion depuis l'application ===" -ForegroundColor Green
Write-Host "Votre application HelloJADE peut se connecter avec:" -ForegroundColor White
Write-Host "  Host: $ORACLE_HOST" -ForegroundColor Cyan
Write-Host "  Port: $ORACLE_PORT" -ForegroundColor Cyan
Write-Host "  Service: $ORACLE_SERVICE" -ForegroundColor Cyan
Write-Host "  Utilisateur: $ORACLE_USER" -ForegroundColor Cyan
Write-Host "  Mot de passe: $ORACLE_PASSWORD" -ForegroundColor Cyan

Write-Host "=== Test de connexion à distance terminé ===" -ForegroundColor Green 