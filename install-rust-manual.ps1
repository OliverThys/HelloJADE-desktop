# HelloJADE v1.0 - Installation Rust Manuelle
# Installation de Rust sans privilèges administrateur

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " HelloJADE v1.0 - Installation Rust Manuelle" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Rust est déjà installé
Write-Host "Verification de Rust..." -ForegroundColor Yellow
$rustVersion = rustc --version 2>$null
if ($rustVersion) {
    Write-Host "✅ Rust deja installe: $rustVersion" -ForegroundColor Green
    Write-Host "Vous pouvez maintenant lancer l'application desktop!" -ForegroundColor Cyan
    exit 0
}

Write-Host "❌ Rust non installe" -ForegroundColor Red
Write-Host ""

# Instructions pour l'installation manuelle
Write-Host "Instructions pour installer Rust:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ouvrir PowerShell en tant qu'Administrateur:" -ForegroundColor White
Write-Host "   - Clic droit sur PowerShell" -ForegroundColor White
Write-Host "   - 'Executer en tant qu'administrateur'" -ForegroundColor White
Write-Host ""
Write-Host "2. Naviguer vers le dossier HelloJADE:" -ForegroundColor White
Write-Host "   cd C:\Users\olive\Documents\HelloJADE" -ForegroundColor White
Write-Host ""
Write-Host "3. Executer le script d'installation:" -ForegroundColor White
Write-Host "   .\scripts\install-prerequisites.ps1" -ForegroundColor White
Write-Host ""
Write-Host "OU" -ForegroundColor Yellow
Write-Host ""
Write-Host "Installation manuelle de Rust:" -ForegroundColor White
Write-Host "1. Aller sur https://rustup.rs/" -ForegroundColor White
Write-Host "2. Telecharger rustup-init.exe" -ForegroundColor White
Write-Host "3. Executer rustup-init.exe" -ForegroundColor White
Write-Host "4. Choisir l'option 1 (installation par defaut)" -ForegroundColor White
Write-Host "5. Redemarrer PowerShell" -ForegroundColor White
Write-Host ""
Write-Host "Apres l'installation, vous pourrez lancer:" -ForegroundColor Cyan
Write-Host "   .\launch-tauri.ps1" -ForegroundColor White
Write-Host ""

# Alternative : essayer d'installer avec scoop
Write-Host "Tentative d'installation avec Scoop..." -ForegroundColor Yellow
try {
    # Vérifier si scoop est installé
    $scoopVersion = scoop --version 2>$null
    if (!$scoopVersion) {
        Write-Host "Installation de Scoop..." -ForegroundColor Cyan
        Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
        Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
    }
    
    Write-Host "Installation de Rust avec Scoop..." -ForegroundColor Cyan
    scoop install rust
    Write-Host "✅ Rust installe avec Scoop!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de l'installation avec Scoop" -ForegroundColor Red
    Write-Host "Veuillez suivre les instructions manuelles ci-dessus" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " Installation Rust terminee!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "1. Redemarrer PowerShell" -ForegroundColor White
Write-Host "2. Verifier: rustc --version" -ForegroundColor White
Write-Host "3. Lancer: .\launch-tauri.ps1" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Bonne utilisation de HelloJADE Desktop !" -ForegroundColor Green 