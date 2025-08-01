@echo off
echo 🔄 Démarrage du serveur de développement avec nettoyage automatique du port...

REM Exécuter le script PowerShell pour tuer le port
powershell -ExecutionPolicy Bypass -File "%~dp0kill-port.ps1"

REM Démarrer le serveur de développement
npm run dev 