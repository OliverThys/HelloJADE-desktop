# HelloJADE v1.0 - Script de configuration simplifié
# PowerShell script pour configurer le fichier .env de production

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " HelloJADE v1.0 - Configuration des variables d'environnement" -ForegroundColor Cyan
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

# Étape 1: Copie du fichier .env
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Configuration des variables d'environnement" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$envSource = "env.production"
$envTarget = ".env"

if (!(Test-Path $envSource)) {
    Write-Host "❌ Fichier source $envSource non trouvé" -ForegroundColor Red
    exit 1
}

if (Test-Path $envTarget) {
    Write-Host "⚠️  Fichier .env existe déjà" -ForegroundColor Yellow
    $response = Read-Host "Voulez-vous le remplacer ? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "ℹ️  Configuration annulée" -ForegroundColor Blue
        exit 0
    }
    Remove-Item $envTarget -Force
}

try {
    Copy-Item $envSource $envTarget
    Write-Host "✅ Fichier .env créé avec succès" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la création du fichier .env: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Étape 2: Configuration des variables système
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Configuration des variables système" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

try {
    $content = Get-Content $envTarget
    $count = 0
    
    foreach ($line in $content) {
        if ($line -and $line -notmatch '^#' -and $line -match '=') {
            $parts = $line -split '=', 2
            if ($parts.Length -eq 2) {
                $name = $parts[0].Trim()
                $value = $parts[1].Trim()
                
                # Supprimer les guillemets si présents
                if ($value -match '^"(.*)"$') {
                    $value = $matches[1]
                }
                
                # Définir la variable d'environnement système
                [Environment]::SetEnvironmentVariable($name, $value, "Machine")
                $count++
            }
        }
    }
    
    Write-Host "✅ $count variables d'environnement système configurées" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la configuration des variables: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Étape 3: Configuration des permissions
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Configuration des permissions de sécurité" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

try {
    $acl = Get-Acl $envTarget
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule("Administrators", "FullControl", "Allow")
    $acl.SetAccessRule($rule)
    Set-Acl $envTarget $acl
    Write-Host "✅ Permissions de sécurité configurées" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la configuration des permissions: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Étape 4: Test de la configuration
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Test de la configuration" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

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
    Write-Host "⚠️  Variables manquantes ou non configurées:" -ForegroundColor Yellow
    foreach ($var in $missingVars) {
        Write-Host "  - $var" -ForegroundColor Yellow
    }
    Write-Host "❌ Configuration incomplète" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Configuration validée avec succès" -ForegroundColor Green

# Résumé final
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Résumé de la configuration" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

Write-Host "📁 Fichier .env créé: $(Test-Path '.env')" -ForegroundColor $(if (Test-Path '.env') { 'Green' } else { 'Red' })
Write-Host "🔐 Variables système configurées: ✅" -ForegroundColor Green
Write-Host "🔒 Permissions sécurisées: ✅" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Variables importantes configurées:" -ForegroundColor Cyan
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

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " Configuration terminée avec succès" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "✅ HelloJADE est maintenant configuré pour la production" -ForegroundColor Green
Write-Host "ℹ️  Vous pouvez maintenant lancer l'installation complète avec: .\scripts\install.ps1" -ForegroundColor Blue 