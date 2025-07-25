# HelloJADE v1.0 - Installation des prérequis
# Script à exécuter en tant qu'administrateur

param(
    [switch]$SkipPython = $false,
    [switch]$SkipRust = $false
)

# Configuration des couleurs
$Host.UI.RawUI.ForegroundColor = "White"
$Host.UI.RawUI.BackgroundColor = "Black"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
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

# Installation de Python 3.11
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

# Installation de Rust
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

# Installation des dépendances Python
function Install-PythonDependencies {
    Write-Step "Installation des dépendances Python..."
    if (Test-Path "backend/requirements.txt") {
        python -m pip install --upgrade pip
        python -m pip install -r backend/requirements.txt
        Write-Success "Dépendances Python installées"
    } else {
        Write-Error "Fichier requirements.txt non trouvé dans le dossier backend"
    }
}

# Installation des dépendances Node.js
function Install-NodeDependencies {
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

# Fonction principale
function Main {
    Write-Header "HelloJADE v1.0 - Installation des Prérequis"
    
    # Vérifications préliminaires
    if (!(Test-Administrator)) {
        Write-Error "Ce script doit être exécuté en tant qu'administrateur"
        Write-Warning "Veuillez relancer PowerShell en tant qu'administrateur"
        exit 1
    }
    
    # Installation de Python
    if (!$SkipPython) {
        Install-Python
        Install-PythonDependencies
    }
    
    # Installation de Rust
    if (!$SkipRust) {
        Install-Rust
    }
    
    # Installation des dépendances Node.js
    Install-NodeDependencies
    
    Write-Header "Installation des prérequis terminée"
    Write-Success "Tous les prérequis sont installés !"
    Write-ColorOutput "`nProchaines étapes:" "Cyan"
    Write-ColorOutput "1. Retourner au dossier HelloJADE" "White"
    Write-ColorOutput "2. Lancer: .\start-hellojade.ps1" "White"
    Write-ColorOutput "3. Ou lancer: .\launch-hellojade.ps1" "White"
}

# Exécution du script principal
try {
    Main
} catch {
    Write-Error "Erreur lors de l'installation: $($_.Exception.Message)"
    exit 1
} 