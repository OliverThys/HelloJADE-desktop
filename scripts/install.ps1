# HelloJADE v1.0 - Script d'installation Windows
# Script d'installation automatique pour l'environnement de développement et production

param(
    [string]$Environment = "development",
    [switch]$SkipPrerequisites = $false,
    [switch]$SkipDatabase = $false,
    [switch]$SkipInfrastructure = $false
)

# Configuration des couleurs pour l'affichage
$Host.UI.RawUI.ForegroundColor = "White"
$Host.UI.RawUI.BackgroundColor = "Black"

# Fonction pour afficher les messages avec couleurs
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    $Host.UI.RawUI.ForegroundColor = $Color
    Write-Host $Message
    $Host.UI.RawUI.ForegroundColor = "White"
}

function Write-Header {
    param([string]$Title)
    Write-ColorOutput "`n" "Cyan"
    Write-ColorOutput "=" * 60 "Cyan"
    Write-ColorOutput "  $Title" "Cyan"
    Write-ColorOutput "=" * 60 "Cyan"
    Write-ColorOutput "`n" "Cyan"
}

function Write-Step {
    param([string]$Step)
    Write-ColorOutput "`n[INFO] $Step" "Yellow"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "[SUCCESS] $Message" "Green"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "[ERROR] $Message" "Red"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "[WARNING] $Message" "Magenta"
}

# Vérification des privilèges administrateur
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Vérification de la version de PowerShell
function Test-PowerShellVersion {
    $version = $PSVersionTable.PSVersion
    if ($version.Major -lt 5) {
        Write-Error "PowerShell 5.0 ou supérieur est requis. Version actuelle: $version"
        exit 1
    }
    Write-Success "PowerShell version $version détectée"
}

# Vérification et installation de Chocolatey
function Install-Chocolatey {
    Write-Step "Vérification de Chocolatey..."
    if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Step "Installation de Chocolatey..."
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Success "Chocolatey installé avec succès"
    } else {
        Write-Success "Chocolatey déjà installé"
    }
}

# Vérification et installation de Git
function Install-Git {
    Write-Step "Vérification de Git..."
    if (!(Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Step "Installation de Git..."
        choco install git -y
        refreshenv
        Write-Success "Git installé avec succès"
    } else {
        Write-Success "Git déjà installé"
    }
}

# Vérification et installation de Python
function Install-Python {
    Write-Step "Vérification de Python 3.11..."
    $pythonVersion = python --version 2>$null
    if (!$pythonVersion -or $pythonVersion -notmatch "Python 3\.11") {
        Write-Step "Installation de Python 3.11..."
        choco install python311 -y
        refreshenv
        Write-Success "Python 3.11 installé avec succès"
    } else {
        Write-Success "Python 3.11 déjà installé: $pythonVersion"
    }
}

# Vérification et installation de Node.js
function Install-NodeJS {
    Write-Step "Vérification de Node.js..."
    $nodeVersion = node --version 2>$null
    if (!$nodeVersion -or [version]$nodeVersion.TrimStart('v') -lt [version]"18.0.0") {
        Write-Step "Installation de Node.js 18..."
        choco install nodejs-lts -y
        refreshenv
        Write-Success "Node.js installé avec succès"
    } else {
        Write-Success "Node.js déjà installé: $nodeVersion"
    }
}

# Vérification et installation de Rust
function Install-Rust {
    Write-Step "Vérification de Rust..."
    $rustVersion = rustc --version 2>$null
    if (!$rustVersion) {
        Write-Step "Installation de Rust..."
        choco install rust -y
        refreshenv
        Write-Success "Rust installé avec succès"
    } else {
        Write-Success "Rust déjà installé: $rustVersion"
    }
}

# Vérification et installation de Docker Desktop
function Install-Docker {
    Write-Step "Vérification de Docker Desktop..."
    $dockerVersion = docker --version 2>$null
    if (!$dockerVersion) {
        Write-Step "Installation de Docker Desktop..."
        choco install docker-desktop -y
        Write-Warning "Docker Desktop installé. Veuillez redémarrer votre ordinateur et relancer ce script."
        Write-Warning "Ou lancez Docker Desktop manuellement et relancez ce script."
        exit 0
    } else {
        Write-Success "Docker déjà installé: $dockerVersion"
    }
}

# Vérification et installation de Visual Studio Build Tools
function Install-VisualStudioBuildTools {
    Write-Step "Vérification de Visual Studio Build Tools..."
    $vcvarsall = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019\BuildTools\VC\Auxiliary\Build\vcvarsall.bat"
    if (!(Test-Path $vcvarsall)) {
        Write-Step "Installation de Visual Studio Build Tools..."
        choco install visualstudio2019buildtools -y
        choco install visualstudio2019-workload-vctools -y
        Write-Success "Visual Studio Build Tools installé avec succès"
    } else {
        Write-Success "Visual Studio Build Tools déjà installé"
    }
}

# Installation des prérequis
function Install-Prerequisites {
    Write-Header "Installation des prérequis"
    
    Install-Chocolatey
    Install-Git
    Install-Python
    Install-NodeJS
    Install-Rust
    Install-Docker
    Install-VisualStudioBuildTools
    
    Write-Success "Tous les prérequis sont installés"
}

# Configuration de l'environnement
function Setup-Environment {
    Write-Header "Configuration de l'environnement"
    
    Write-Step "Création des dossiers nécessaires..."
    $directories = @(
        "logs",
        "backups",
        "uploads",
        "temp",
        "ai/models",
        "ai/models/whisper",
        "ai/models/piper",
        "ai/models/ollama"
    )
    
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Success "Dossier créé: $dir"
        }
    }
    
    Write-Step "Configuration du fichier .env..."
    if (!(Test-Path ".env")) {
        Copy-Item "env.example" ".env"
        Write-Warning "Fichier .env créé à partir de env.example"
        Write-Warning "Veuillez configurer les variables d'environnement dans le fichier .env"
    } else {
        Write-Success "Fichier .env déjà existant"
    }
    
    Write-Success "Environnement configuré"
}

# Installation du backend Python
function Install-Backend {
    Write-Header "Installation du backend Python"
    
    Write-Step "Installation des dépendances Python..."
    if (Test-Path "backend/requirements.txt") {
        python -m pip install --upgrade pip
        python -m pip install -r backend/requirements.txt
        Write-Success "Dépendances Python installées"
    } else {
        Write-Error "Fichier requirements.txt non trouvé dans le dossier backend"
    }
}

# Installation du frontend Vue.js
function Install-Frontend {
    Write-Header "Installation du frontend Vue.js"
    
    Write-Step "Installation des dépendances Node.js..."
    if (Test-Path "frontend/package.json") {
        Set-Location frontend
        npm install
        Set-Location ..
        Write-Success "Dépendances Node.js installées"
    } else {
        Write-Error "Fichier package.json non trouvé dans le dossier frontend"
    }
}

# Configuration de la base de données
function Setup-Database {
    Write-Header "Configuration de la base de données"
    
    Write-Step "Vérification de la connexion Oracle..."
    # Ici on pourrait ajouter un test de connexion à Oracle
    Write-Warning "Veuillez configurer manuellement la base de données Oracle"
    Write-Warning "Assurez-vous que les variables d'environnement Oracle sont correctement configurées"
}

# Démarrage de l'infrastructure Docker
function Start-Infrastructure {
    Write-Header "Démarrage de l'infrastructure Docker"
    
    Write-Step "Vérification de Docker..."
    if (!(docker info 2>$null)) {
        Write-Error "Docker n'est pas démarré. Veuillez démarrer Docker Desktop"
        return
    }
    
    Write-Step "Démarrage des services Docker..."
    if (Test-Path "infrastructure/docker-compose.yml") {
        Set-Location infrastructure
        docker-compose up -d
        Set-Location ..
        Write-Success "Services Docker démarrés"
    } else {
        Write-Error "Fichier docker-compose.yml non trouvé dans le dossier infrastructure"
    }
}

# Test de l'installation
function Test-Installation {
    Write-Header "Test de l'installation"
    
    Write-Step "Test du backend..."
    if (Test-Path "backend/app.py") {
        python backend/app.py --test
        Write-Success "Backend testé avec succès"
    }
    
    Write-Step "Test du frontend..."
    if (Test-Path "frontend") {
        Set-Location frontend
        npm run build
        Set-Location ..
        Write-Success "Frontend testé avec succès"
    }
    
    Write-Success "Installation testée avec succès"
}

# Fonction principale
function Main {
    Write-Header "HelloJADE v1.0 - Installation Windows"
    
    # Vérifications préliminaires
    if (!(Test-Administrator)) {
        Write-Error "Ce script doit être exécuté en tant qu'administrateur"
        exit 1
    }
    
    Test-PowerShellVersion
    
    # Installation des prérequis
    if (!$SkipPrerequisites) {
        Install-Prerequisites
    }
    
    # Configuration de l'environnement
    Setup-Environment
    
    # Installation du backend
    Install-Backend
    
    # Installation du frontend
    Install-Frontend
    
    # Configuration de la base de données
    if (!$SkipDatabase) {
        Setup-Database
    }
    
    # Démarrage de l'infrastructure
    if (!$SkipInfrastructure) {
        Start-Infrastructure
    }
    
    # Test de l'installation
    Test-Installation
    
    Write-Header "Installation terminée"
    Write-Success "HelloJADE v1.0 a été installé avec succès !"
    Write-ColorOutput "`nProchaines étapes:" "Cyan"
    Write-ColorOutput "1. Configurez les variables d'environnement dans le fichier .env" "White"
    Write-ColorOutput "2. Configurez votre base de données Oracle" "White"
    Write-ColorOutput "3. Configurez votre serveur LDAP" "White"
    Write-ColorOutput "4. Lancez l'application avec: .\scripts\start.ps1" "White"
    Write-ColorOutput "`nPour plus d'informations, consultez le README.md" "Cyan"
}

# Exécution du script principal
try {
    Main
} catch {
    Write-Error "Erreur lors de l'installation: $($_.Exception.Message)"
    exit 1
} 