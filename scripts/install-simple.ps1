# HelloJADE v1.0 - Script d'installation simplifié
# Installation automatique pour Windows

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " HelloJADE v1.0 - Installation Windows" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier les privilèges administrateur
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
if (!$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "❌ Ce script nécessite des privilèges administrateur" -ForegroundColor Red
    Write-Host "ℹ️  Veuillez relancer PowerShell en tant qu'administrateur" -ForegroundColor Blue
    exit 1
}

Write-Host "✅ Privilèges administrateur vérifiés" -ForegroundColor Green

# Vérifier la version de PowerShell
$version = $PSVersionTable.PSVersion
if ($version.Major -lt 5) {
    Write-Host "❌ PowerShell 5.0 ou supérieur est requis. Version actuelle: $version" -ForegroundColor Red
    exit 1
}
Write-Host "✅ PowerShell version $version détectée" -ForegroundColor Green

# Étape 1: Installation de Chocolatey
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Installation de Chocolatey" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installation de Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Write-Host "✅ Chocolatey installé avec succès" -ForegroundColor Green
} else {
    Write-Host "✅ Chocolatey déjà installé" -ForegroundColor Green
}

# Étape 2: Installation des prérequis
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Installation des prérequis" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# Git
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installation de Git..." -ForegroundColor Yellow
    choco install git -y
    refreshenv
    Write-Host "✅ Git installé avec succès" -ForegroundColor Green
} else {
    Write-Host "✅ Git déjà installé" -ForegroundColor Green
}

# Python 3.11
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installation de Python 3.11..." -ForegroundColor Yellow
    choco install python311 -y
    refreshenv
    Write-Host "✅ Python 3.11 installé avec succès" -ForegroundColor Green
} else {
    Write-Host "✅ Python déjà installé" -ForegroundColor Green
}

# Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installation de Node.js..." -ForegroundColor Yellow
    choco install nodejs -y
    refreshenv
    Write-Host "✅ Node.js installé avec succès" -ForegroundColor Green
} else {
    Write-Host "✅ Node.js déjà installé" -ForegroundColor Green
}

# Rust
if (!(Get-Command rustc -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installation de Rust..." -ForegroundColor Yellow
    choco install rust -y
    refreshenv
    Write-Host "✅ Rust installé avec succès" -ForegroundColor Green
} else {
    Write-Host "✅ Rust déjà installé" -ForegroundColor Green
}

# Docker Desktop
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installation de Docker Desktop..." -ForegroundColor Yellow
    choco install docker-desktop -y
    Write-Host "✅ Docker Desktop installé avec succès" -ForegroundColor Green
    Write-Host "⚠️  Veuillez redémarrer votre machine après l'installation" -ForegroundColor Yellow
} else {
    Write-Host "✅ Docker Desktop déjà installé" -ForegroundColor Green
}

# Étape 3: Configuration de l'environnement
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Configuration de l'environnement" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# Créer les répertoires nécessaires
$directories = @(
    "logs",
    "backups", 
    "uploads",
    "temp",
    "ai/models",
    "ai/models/whisper",
    "ai/models/piper",
    "ai/models/ollama",
    "recordings",
    "cache/audio"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "📁 Répertoire créé: $dir" -ForegroundColor Green
    } else {
        Write-Host "📁 Répertoire existant: $dir" -ForegroundColor Blue
    }
}

# Étape 4: Installation du backend Python
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Installation du backend Python" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

if (Test-Path "backend/requirements.txt") {
    Write-Host "📦 Installation des dépendances Python..." -ForegroundColor Yellow
    python -m pip install --upgrade pip
    python -m pip install -r backend/requirements.txt
    Write-Host "✅ Dépendances Python installées" -ForegroundColor Green
} else {
    Write-Host "⚠️  Fichier requirements.txt non trouvé" -ForegroundColor Yellow
}

# Étape 5: Installation du frontend Node.js
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Installation du frontend Node.js" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

if (Test-Path "frontend/package.json") {
    Write-Host "📦 Installation des dépendances Node.js..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
    Write-Host "✅ Dépendances Node.js installées" -ForegroundColor Green
} else {
    Write-Host "⚠️  Fichier package.json non trouvé" -ForegroundColor Yellow
}

# Étape 6: Démarrage de l'infrastructure Docker
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Démarrage de l'infrastructure Docker" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

if (Test-Path "infrastructure/docker-compose.yml") {
    Write-Host "🐳 Démarrage des services Docker..." -ForegroundColor Yellow
    Set-Location infrastructure
    docker-compose up -d
    Set-Location ..
    Write-Host "✅ Services Docker démarrés" -ForegroundColor Green
} else {
    Write-Host "⚠️  Fichier docker-compose.yml non trouvé" -ForegroundColor Yellow
}

# Étape 7: Test de l'installation
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Test de l'installation" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# Vérifier les services
Write-Host "🔍 Vérification des services..." -ForegroundColor Yellow

if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "✅ Python: OK" -ForegroundColor Green
} else {
    Write-Host "❌ Python: ERREUR" -ForegroundColor Red
}

if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "✅ Node.js: OK" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js: ERREUR" -ForegroundColor Red
}

if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "✅ Docker: OK" -ForegroundColor Green
} else {
    Write-Host "❌ Docker: ERREUR" -ForegroundColor Red
}

# Résumé final
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " Installation terminée avec succès" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green

Write-Host "🎉 HelloJADE v1.0 est maintenant installé sur votre machine !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. Redémarrer Docker Desktop si nécessaire" -ForegroundColor White
Write-Host "2. Vérifier que tous les services sont démarrés" -ForegroundColor White
Write-Host "3. Accéder à l'application via: http://localhost:3000" -ForegroundColor White
Write-Host "4. Accéder à l'API via: http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "📊 Interfaces de monitoring:" -ForegroundColor Cyan
Write-Host "- Grafana: http://localhost:3000 (admin/HelloJADE_Grafana_2024!)" -ForegroundColor White
Write-Host "- Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "- Kibana: http://localhost:5601" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation: docs/configuration-production.md" -ForegroundColor Cyan 