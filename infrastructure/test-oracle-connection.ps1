# HelloJADE v1.0 - Script de test de connexion Oracle
# Ce script teste la connexion à la base de données Oracle

Write-Host "=== HelloJADE - Test de connexion Oracle ===" -ForegroundColor Green

# Vérification que le conteneur Oracle est en cours d'exécution
Write-Host "Vérification du conteneur Oracle..." -ForegroundColor Yellow
$containerStatus = docker ps --filter "name=hellojade-oracle" --format "table {{.Names}}\t{{.Status}}"

if ($containerStatus -match "hellojade-oracle") {
    Write-Host "✓ Conteneur Oracle en cours d'exécution" -ForegroundColor Green
} else {
    Write-Host "✗ Conteneur Oracle non trouvé ou arrêté" -ForegroundColor Red
    Write-Host "Démarrez d'abord Oracle avec: .\start-oracle.ps1" -ForegroundColor Yellow
    exit 1
}

# Test de connexion avec sqlplus
Write-Host "Test de connexion à la base de données..." -ForegroundColor Yellow

$testQuery = @"
SELECT 'Connexion Oracle réussie' AS status FROM dual;
SELECT COUNT(*) AS total_patients FROM patients;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_calls FROM calls;
"@

try {
    $result = docker exec hellojade-oracle sqlplus -s hellojade/hellojade123@//localhost:1521/XE <<< $testQuery 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Connexion à Oracle réussie !" -ForegroundColor Green
        Write-Host "Résultats du test :" -ForegroundColor Cyan
        Write-Host $result -ForegroundColor White
    } else {
        Write-Host "✗ Erreur de connexion à Oracle" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Erreur lors du test de connexion" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test de connexion avec un client Python (si disponible)
Write-Host "Test avec client Python (si cx_Oracle est installé)..." -ForegroundColor Yellow

$pythonTest = @"
import cx_Oracle
try:
    connection = cx_Oracle.connect('hellojade', 'hellojade123', 'localhost:1521/XE')
    cursor = connection.cursor()
    cursor.execute('SELECT COUNT(*) FROM patients')
    result = cursor.fetchone()
    print(f'Connexion Python réussie - Nombre de patients: {result[0]}')
    cursor.close()
    connection.close()
except Exception as e:
    print(f'Erreur Python: {e}')
"@

try {
    python -c $pythonTest 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Connexion Python réussie" -ForegroundColor Green
    } else {
        Write-Host "⚠ Connexion Python échouée (cx_Oracle non installé)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Python ou cx_Oracle non disponible" -ForegroundColor Yellow
}

Write-Host "=== Test terminé ===" -ForegroundColor Green 