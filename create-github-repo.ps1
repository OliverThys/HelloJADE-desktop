# Script pour créer un repository GitHub pour HelloJADE
# Utilisez ce script après avoir créé le repository sur GitHub

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUsername,
    
    [Parameter(Mandatory=$true)]
    [string]$RepositoryName = "hellojade-desktop"
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Creation du repository GitHub pour HelloJADE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Configuration..." -ForegroundColor Yellow
Write-Host "Username GitHub: $GitHubUsername" -ForegroundColor White
Write-Host "Nom du repository: $RepositoryName" -ForegroundColor White
Write-Host ""

# Vérifier que Git est configuré
Write-Host "Verification de Git..." -ForegroundColor Yellow
$gitUser = git config user.name
$gitEmail = git config user.email

if (-not $gitUser -or -not $gitEmail) {
    Write-Host "❌ Git n'est pas configure" -ForegroundColor Red
    Write-Host "Executez d'abord:" -ForegroundColor Yellow
    Write-Host "git config --global user.name 'Votre Nom'" -ForegroundColor White
    Write-Host "git config --global user.email 'votre@email.com'" -ForegroundColor White
    exit 1
}

Write-Host "✅ Git configure: $gitUser <$gitEmail>" -ForegroundColor Green

# Ajouter le remote GitHub
Write-Host ""
Write-Host "Ajout du remote GitHub..." -ForegroundColor Yellow
$remoteUrl = "https://github.com/$GitHubUsername/$RepositoryName.git"

try {
    git remote add origin $remoteUrl
    Write-Host "✅ Remote ajoute: $remoteUrl" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Remote deja existe ou erreur" -ForegroundColor Yellow
}

# Push vers GitHub
Write-Host ""
Write-Host "Push vers GitHub..." -ForegroundColor Yellow
try {
    git branch -M main
    git push -u origin main
    Write-Host "✅ Code pousse vers GitHub avec succes!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors du push" -ForegroundColor Red
    Write-Host "Verifiez que le repository existe sur GitHub" -ForegroundColor Yellow
    Write-Host "URL: https://github.com/$GitHubUsername/$RepositoryName" -ForegroundColor Cyan
    exit 1
}

# Créer les tags
Write-Host ""
Write-Host "Creation des tags..." -ForegroundColor Yellow
try {
    git tag -a v1.0.0 -m "Version 1.0.0 - Application desktop fonctionnelle"
    git push origin v1.0.0
    Write-Host "✅ Tag v1.0.0 cree et pousse" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Erreur lors de la creation du tag" -ForegroundColor Yellow
}

# Résumé final
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " Repository GitHub cree avec succes !" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Repository: https://github.com/$GitHubUsername/$RepositoryName" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "1. Ajouter une description sur GitHub" -ForegroundColor White
Write-Host "2. Configurer les topics: tauri,vue,desktop,healthcare" -ForegroundColor White
Write-Host "3. Ajouter un README avec badges" -ForegroundColor White
Write-Host "4. Configurer GitHub Actions si necessaire" -ForegroundColor White
Write-Host ""
Write-Host "🎉 HelloJADE est maintenant sur GitHub !" -ForegroundColor Green 