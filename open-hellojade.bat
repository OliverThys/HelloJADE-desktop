@echo off
echo ========================================
echo    HelloJADE v1.0 - Lancement
echo ========================================
echo.

echo Ouverture des interfaces HelloJADE...
echo.

echo 1. Ouverture de Grafana (Monitoring)...
start http://localhost:3000

echo 2. Ouverture de Prometheus (Metriques)...
start http://localhost:9090

echo 3. Ouverture d'Ollama (IA)...
start http://localhost:11434

echo.
echo ========================================
echo    Interfaces ouvertes !
echo ========================================
echo.
echo Grafana: http://localhost:3000
echo Username: admin
echo Password: hellojade123
echo.
echo Prometheus: http://localhost:9090
echo Ollama: http://localhost:11434
echo.
echo Appuyez sur une touche pour fermer...
pause > nul 