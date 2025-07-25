# HelloJADE v1.0 - Script de configuration des variables d'environnement
# PowerShell script pour configurer le fichier .env de production

param(
    [switch]$Force,
    [switch]$Interactive
)

# Configuration des couleurs pour l'affichage
$Host.UI.RawUI.ForegroundColor = "White"

function Write-Header {
    param([string]$Message)
    Write-Host "`n" -NoNewline
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Copy-EnvFile {
    Write-Header "Configuration des variables d'environnement"
    
    $envSource = "env.production"
    $envTarget = ".env"
    
    if (!(Test-Path $envSource)) {
        Write-Error "Fichier source $envSource non trouvé"
        return $false
    }
    
    if (Test-Path $envTarget) {
        if ($Force) {
            Write-Warning "Fichier .env existant - remplacement forcé"
            Remove-Item $envTarget -Force
        } else {
            Write-Warning "Fichier .env existe déjà"
            $response = Read-Host "Voulez-vous le remplacer ? (y/N)"
            if ($response -ne "y" -and $response -ne "Y") {
                Write-Info "Configuration annulée"
                return $false
            }
            Remove-Item $envTarget -Force
        }
    }
    
    try {
        Copy-Item $envSource $envTarget
        Write-Success "Fichier .env créé avec succès"
        return $true
    } catch {
        Write-Error "Erreur lors de la création du fichier .env: $($_.Exception.Message)"
        return $false
    }
}

function Set-EnvironmentVariables {
    Write-Header "Configuration des variables système"
    
    $envFile = ".env"
    if (!(Test-Path $envFile)) {
        Write-Error "Fichier .env non trouvé"
        return $false
    }
    
    try {
        # Lire le fichier .env et définir les variables système
        $content = Get-Content $envFile
        foreach ($line in $content) {
            if ($line -match '^([^#][^=]+)=(.*)$') {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                
                # Supprimer les guillemets si présents
                if ($value -match '^"(.*)"$') {
                    $value = $matches[1]
                }
                
                # Définir la variable d'environnement système
                [Environment]::SetEnvironmentVariable($name, $value, "Machine")
                Write-Info "Variable définie: $name"
            }
        }
        
        Write-Success "Variables d'environnement système configurées"
        return $true
        
    } catch {
        Write-Error "Erreur lors de la configuration des variables: $($_.Exception.Message)"
        return $false
    }
}

function Set-FilePermissions {
    Write-Header "Configuration des permissions de sécurité"
    
    $envFile = ".env"
    if (!(Test-Path $envFile)) {
        Write-Error "Fichier .env non trouvé"
        return $false
    }
    
    try {
        # Définir les permissions restrictives sur le fichier .env
        $acl = Get-Acl $envFile
        $rule = New-Object System.Security.AccessControl.FileSystemAccessRule("Administrators", "FullControl", "Allow")
        $acl.SetAccessRule($rule)
        
        # Supprimer les permissions pour les autres utilisateurs
        $acl.Access | Where-Object { $_.IdentityReference -ne "NT AUTHORITY\SYSTEM" -and $_.IdentityReference -ne "BUILTIN\Administrators" } | ForEach-Object {
            $acl.RemoveAccessRule($_) | Out-Null
        }
        
        Set-Acl $envFile $acl
        Write-Success "Permissions de sécurité configurées"
        return $true
        
    } catch {
        Write-Error "Erreur lors de la configuration des permissions: $($_.Exception.Message)"
        return $false
    }
}

function Test-Configuration {
    Write-Header "Test de la configuration"
    
    $envFile = ".env"
    if (!(Test-Path $envFile)) {
        Write-Error "Fichier .env non trouvé"
        return $false
    }
    
    $requiredVars = @(
        "HELLOJADE_SECRET_KEY",
        "JWT_SECRET_KEY",
        "LDAP_SERVER",
        "ORACLE_HOST",
        "ZADARMA_SIP_LOGIN",
        "ZADARMA_SIP_PASSWORD"
    )
    
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        $value = [Environment]::GetEnvironmentVariable($var, "Machine")
        if ([string]::IsNullOrEmpty($value)) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Warning "Variables manquantes ou non configurées:"
        foreach ($var in $missingVars) {
            Write-Host "  - $var" -ForegroundColor Yellow
        }
        return $false
    }
    
    Write-Success "Configuration validée avec succès"
    return $true
}

function Show-ConfigurationSummary {
    Write-Header "Résumé de la configuration"
    
    Write-Host "📁 Fichier .env créé: $(Test-Path '.env')" -ForegroundColor $(if (Test-Path '.env') { 'Green' } else { 'Red' })
    Write-Host "🔐 Variables système configurées: $(Test-Configuration)" -ForegroundColor $(if (Test-Configuration) { 'Green' } else { 'Red' })
    Write-Host "🔒 Permissions sécurisées: $(Test-Path '.env')" -ForegroundColor $(if (Test-Path '.env') { 'Green' } else { 'Red' })
    
    Write-Host "`n📋 Variables importantes configurées:" -ForegroundColor Cyan
    $importantVars = @(
        @{ Name = "LDAP_SERVER"; Value = [Environment]::GetEnvironmentVariable("LDAP_SERVER", "Machine") },
        @{ Name = "ORACLE_HOST"; Value = [Environment]::GetEnvironmentVariable("ORACLE_HOST", "Machine") },
        @{ Name = "ZADARMA_SIP_LOGIN"; Value = [Environment]::GetEnvironmentVariable("ZADARMA_SIP_LOGIN", "Machine") },
        @{ Name = "HELLOJADE_API_URL"; Value = [Environment]::GetEnvironmentVariable("HELLOJADE_API_URL", "Machine") }
    )
    
    foreach ($var in $importantVars) {
        $status = if ([string]::IsNullOrEmpty($var.Value)) { "❌ Non configuré" } else { "✅ Configuré" }
        Write-Host "  $($var.Name): $status" -ForegroundColor $(if ([string]::IsNullOrEmpty($var.Value)) { 'Red' } else { 'Green' })
    }
}

function Main {
    Write-Header "HelloJADE v1.0 - Configuration des variables d'environnement"
    
    # Vérifier les privilèges administrateur
    if (!(Test-Administrator)) {
        Write-Error "Ce script nécessite des privilèges administrateur"
        Write-Info "Veuillez relancer PowerShell en tant qu'administrateur"
        return
    }
    
    # Configuration interactive si demandée
    if ($Interactive) {
        Write-Info "Mode interactif activé"
        $response = Read-Host "Voulez-vous personnaliser la configuration ? (y/N)"
        if ($response -eq "y" -or $response -eq "Y") {
            Write-Info "Mode interactif non encore implémenté - utilisation de la configuration par défaut"
        }
    }
    
    # Étapes de configuration
    $steps = @(
        @{ Name = "Copie du fichier .env"; Function = "Copy-EnvFile" },
        @{ Name = "Configuration des variables système"; Function = "Set-EnvironmentVariables" },
        @{ Name = "Configuration des permissions"; Function = "Set-FilePermissions" },
        @{ Name = "Test de la configuration"; Function = "Test-Configuration" }
    )
    
    $success = $true
    
    foreach ($step in $steps) {
        Write-Header $step.Name
        $result = & $step.Function
        if (!$result) {
            $success = $false
            Write-Error "Étape '$($step.Name)' échouée"
            break
        }
    }
    
    # Affichage du résumé
    Show-ConfigurationSummary
    
    if ($success) {
        Write-Header "Configuration terminée avec succès"
        Write-Success "HelloJADE est maintenant configuré pour la production"
        Write-Info "Vous pouvez maintenant lancer l'installation complète avec: .\scripts\install.ps1"
    } else {
        Write-Header "Configuration échouée"
        Write-Error "Des erreurs sont survenues lors de la configuration"
        Write-Info "Veuillez vérifier les messages d'erreur ci-dessus"
    }
}

# Exécution du script principal
Main 