# Script de vérification Oracle sur la VM Windows Server
# À exécuter sur la VM Windows Server où Oracle est installé

Write-Host "🔍 Vérification de l'état d'Oracle Database sur la VM..." -ForegroundColor Cyan
Write-Host "=" * 60

# 1. Vérifier les services Oracle
Write-Host "`n📋 Vérification des services Oracle..." -ForegroundColor Yellow

$oracleServices = @(
    "OracleServiceXE",
    "OracleOraDB21Home1TNSListener"
)

foreach ($service in $oracleServices) {
    try {
        $serviceStatus = Get-Service -Name $service -ErrorAction Stop
        $statusColor = if ($serviceStatus.Status -eq "Running") { "Green" } else { "Red" }
        Write-Host "   $service : $($serviceStatus.Status)" -ForegroundColor $statusColor
        
        if ($serviceStatus.Status -ne "Running") {
            Write-Host "   ⚠️  Service $service n'est pas démarré" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ❌ Service $service non trouvé" -ForegroundColor Red
    }
}

# 2. Vérifier le listener Oracle
Write-Host "`n🔊 Vérification du listener Oracle..." -ForegroundColor Yellow

try {
    # Essayer d'exécuter lsnrctl
    $listenerStatus = & lsnrctl status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Listener Oracle actif" -ForegroundColor Green
        
        # Vérifier les services enregistrés
        Write-Host "   📋 Services enregistrés:" -ForegroundColor Cyan
        $services = & lsnrctl services 2>&1
        if ($LASTEXITCODE -eq 0) {
            $services | Where-Object { $_ -match "XE" } | ForEach-Object {
                Write-Host "      $_" -ForegroundColor White
            }
        }
    } else {
        Write-Host "   ❌ Listener Oracle non accessible" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Impossible d'exécuter lsnrctl" -ForegroundColor Red
}

# 3. Vérifier le pare-feu Windows
Write-Host "`n🔥 Vérification du pare-feu Windows..." -ForegroundColor Yellow

try {
    $firewallRule = Get-NetFirewallRule -DisplayName "*Oracle*" -ErrorAction SilentlyContinue
    if ($firewallRule) {
        Write-Host "   ✅ Règles de pare-feu Oracle trouvées:" -ForegroundColor Green
        $firewallRule | ForEach-Object {
            Write-Host "      $($_.DisplayName) - $($_.Enabled)" -ForegroundColor White
        }
    } else {
        Write-Host "   ⚠️  Aucune règle de pare-feu Oracle trouvée" -ForegroundColor Yellow
    }
    
    # Vérifier si le port 1521 est ouvert
    $port1521 = Get-NetFirewallPortFilter -LocalPort 1521 -ErrorAction SilentlyContinue
    if ($port1521) {
        Write-Host "   ✅ Port 1521 configuré dans le pare-feu" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Port 1521 non configuré dans le pare-feu" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Erreur lors de la vérification du pare-feu" -ForegroundColor Red
}

# 4. Vérifier la connectivité locale
Write-Host "`n🌐 Test de connectivité locale..." -ForegroundColor Yellow

try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $result = $tcpClient.BeginConnect("localhost", 1521, $null, $null)
    $success = $result.AsyncWaitHandle.WaitOne(5000, $false)
    
    if ($success) {
        Write-Host "   ✅ Port 1521 accessible localement" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Port 1521 non accessible localement" -ForegroundColor Red
    }
    $tcpClient.Close()
} catch {
    Write-Host "   ❌ Erreur lors du test de connectivité" -ForegroundColor Red
}

# 5. Vérifier les variables d'environnement Oracle
Write-Host "`n🔧 Variables d'environnement Oracle..." -ForegroundColor Yellow

$oracleVars = @("ORACLE_HOME", "ORACLE_SID", "TNS_ADMIN")
foreach ($var in $oracleVars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if ($value) {
        Write-Host "   ✅ $var = $value" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $var non définie" -ForegroundColor Yellow
    }
}

# 6. Vérifier l'utilisateur hellojade
Write-Host "`n👤 Vérification de l'utilisateur hellojade..." -ForegroundColor Yellow

try {
    # Essayer de se connecter avec SQL*Plus
    $sqlplusTest = @"
    WHENEVER OSERROR EXIT 1
    WHENEVER SQLERROR EXIT SQL.SQLCODE
    CONNECT hellojade/hellojade123@//localhost:1521/XE
    SELECT 'Connection successful' FROM DUAL;
    EXIT
"@
    
    $tempFile = [System.IO.Path]::GetTempFileName()
    $sqlplusTest | Out-File -FilePath $tempFile -Encoding ASCII
    
    $result = & sqlplus /nolog @$tempFile 2>&1
    Remove-Item $tempFile -Force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Utilisateur hellojade accessible" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Utilisateur hellojade non accessible" -ForegroundColor Red
        Write-Host "   🔍 Erreur: $result" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Impossible de tester la connexion utilisateur" -ForegroundColor Red
}

# 7. Recommandations
Write-Host "`n💡 Recommandations:" -ForegroundColor Cyan

Write-Host "   1. Si les services ne sont pas démarrés:" -ForegroundColor White
Write-Host "      net start OracleServiceXE" -ForegroundColor Gray
Write-Host "      net start OracleOraDB21Home1TNSListener" -ForegroundColor Gray

Write-Host "`n   2. Si le service XE n'est pas enregistré:" -ForegroundColor White
Write-Host "      sqlplus / as sysdba" -ForegroundColor Gray
Write-Host "      ALTER SYSTEM REGISTER;" -ForegroundColor Gray

Write-Host "`n   3. Pour configurer le pare-feu:" -ForegroundColor White
Write-Host "      netsh advfirewall firewall add rule name='Oracle 1521' dir=in action=allow protocol=TCP localport=1521" -ForegroundColor Gray

Write-Host "`n   4. Pour redémarrer Oracle complètement:" -ForegroundColor White
Write-Host "      net stop OracleServiceXE" -ForegroundColor Gray
Write-Host "      net stop OracleOraDB21Home1TNSListener" -ForegroundColor Gray
Write-Host "      net start OracleOraDB21Home1TNSListener" -ForegroundColor Gray
Write-Host "      net start OracleServiceXE" -ForegroundColor Gray

Write-Host "`n🎯 Diagnostic terminé!" -ForegroundColor Green 