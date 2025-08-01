# Script de configuration d'Asterisk pour HelloJADE
# Ce script crée la structure de dossiers et les fichiers de configuration pour Asterisk

Write-Host "🚀 Configuration d'Asterisk pour HelloJADE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Créer la structure de dossiers
Write-Host "`n📁 Création de la structure de dossiers..." -ForegroundColor Yellow

$folders = @(
    "asterisk",
    "asterisk\etc",
    "asterisk\etc\asterisk",
    "asterisk\var",
    "asterisk\var\lib",
    "asterisk\var\lib\asterisk",
    "asterisk\var\spool",
    "asterisk\var\spool\asterisk",
    "asterisk\logs"
)

foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "  ✓ Créé: $folder" -ForegroundColor Green
    } else {
        Write-Host "  → Existe déjà: $folder" -ForegroundColor Cyan
    }
}

# Créer les fichiers de configuration
Write-Host "`n📝 Création des fichiers de configuration..." -ForegroundColor Yellow

# Contenu des fichiers de configuration
$sipConf = @'
[general]
context=default
allowoverlap=no
bindport=5060
bindaddr=0.0.0.0
transport=udp
nat=force_rport,comedia
externaddr=YOUR_PUBLIC_IP
localnet=192.168.0.0/255.255.0.0
localnet=10.0.0.0/255.0.0.0
localnet=172.16.0.0/255.240.0.0
srvlookup=yes
alwaysauthreject=yes
canreinvite=no
pedantic=no
promiscredir=no
qualify=yes
allowguest=no
language=fr
relaxdtmf=yes
trustrpid=yes
sendrpid=yes
progressinband=yes
useragent=HelloJADE PBX
dtmfmode=auto
videosupport=no
maxexpiry=3600
minexpiry=60
defaultexpiry=120
rtptimeout=30
rtpholdtimeout=300
disallow=all
allow=alaw
allow=ulaw
allow=gsm
register => 514666:ioGlgIA65Q@sip.zadarma.com:5060/514666

[zadarma]
type=friend
host=sip.zadarma.com
port=5060
username=514666
secret=ioGlgIA65Q
fromuser=514666
fromdomain=sip.zadarma.com
context=from-zadarma
insecure=port,invite
nat=yes
canreinvite=no
disallow=all
allow=alaw
allow=ulaw
qualify=yes
dtmfmode=rfc2833
directmedia=no
'@

$extensionsConf = @'
[general]
static=yes
writeprotect=no
autofallthrough=yes
clearglobalvars=no
extenpatternmatchnew=no

[globals]
TRUNK=zadarma
CALLERID=+32480206284

[default]
exten => _.,1,Hangup()

[from-zadarma]
exten => _X.,1,NoOp(=== Appel entrant de ${CALLERID(num)} vers ${EXTEN} ===)
same => n,Set(CDR(accountcode)=zadarma_in)
same => n,Answer()
same => n,Wait(1)
same => n,Playback(hello-world)
same => n,Wait(1)
same => n,Hangup()

exten => 514666,1,NoOp(=== Appel sur le numéro principal ===)
same => n,Goto(_X.,1)

[internal]
exten => _1XX,1,NoOp(Appel interne vers ${EXTEN})
same => n,Dial(SIP/${EXTEN},30)
same => n,VoiceMail(${EXTEN}@default,u)
same => n,Hangup()

[outgoing]
exten => _0X.,1,NoOp(=== Appel sortant vers ${EXTEN} ===)
same => n,Set(CALLERID(num)=${CALLERID})
same => n,Set(CDR(accountcode)=zadarma_out)
same => n,Dial(SIP/${TRUNK}/${EXTEN},60,T)
same => n,Hangup()

exten => _00X.,1,NoOp(=== Appel international vers ${EXTEN} ===)
same => n,Set(CALLERID(num)=${CALLERID})
same => n,Set(CDR(accountcode)=zadarma_out_intl)
same => n,Dial(SIP/${TRUNK}/${EXTEN},60,T)
same => n,Hangup()

exten => 112,1,NoOp(=== APPEL D'URGENCE 112 ===)
same => n,Set(CALLERID(num)=${CALLERID})
same => n,Dial(SIP/${TRUNK}/112,60,T)
same => n,Hangup()

[hellojade]
include => internal
include => outgoing

exten => 999,1,NoOp(=== Test de connexion HelloJADE ===)
same => n,Answer()
same => n,Playback(hello-world)
same => n,Wait(1)
same => n,Playback(vm-goodbye)
same => n,Hangup()

exten => 998,1,NoOp(=== Vérification du statut ===)
same => n,Answer()
same => n,SayDigits(${EPOCH})
same => n,Hangup()
'@

$managerConf = @'
[general]
enabled = yes
port = 5038
bindaddr = 0.0.0.0
displayconnects = yes
timestampevents = yes

[hellojade]
secret = hellojade123
deny = 0.0.0.0/0.0.0.0
permit = 127.0.0.1/255.255.255.255
permit = 172.0.0.0/8
permit = 192.168.0.0/16
permit = 10.0.0.0/8
read = system,call,log,verbose,command,agent,user,config,originate
write = system,call,command,agent,user,config,originate
writetimeout = 5000

[admin]
secret = admin123
deny = 0.0.0.0/0.0.0.0
permit = 127.0.0.1/255.255.255.255
read = all
write = all
'@

$modulesConf = @'
[modules]
autoload=yes
noload => chan_alsa.so
noload => chan_console.so
noload => chan_mgcp.so
noload => res_config_mysql.so
noload => res_config_pgsql.so
'@

# Écrire les fichiers
$files = @{
    "asterisk\etc\asterisk\sip.conf" = $sipConf
    "asterisk\etc\asterisk\extensions.conf" = $extensionsConf
    "asterisk\etc\asterisk\manager.conf" = $managerConf
    "asterisk\etc\asterisk\modules.conf" = $modulesConf
}

foreach ($file in $files.Keys) {
    $files[$file] | Out-File -FilePath $file -Encoding UTF8
    Write-Host "  ✓ Créé: $file" -ForegroundColor Green
}

# Créer le fichier docker-compose.yml s'il n'existe pas
if (!(Test-Path "docker-compose.yml")) {
    Write-Host "`n📋 Création du fichier docker-compose.yml..." -ForegroundColor Yellow
    Copy-Item -Path "docker-compose.yml" -Destination "docker-compose.yml"
    Write-Host "  ✓ Fichier docker-compose.yml créé" -ForegroundColor Green
}

# Mettre à jour le fichier .env
Write-Host "`n🔧 Mise à jour des variables d'environnement..." -ForegroundColor Yellow

$envContent = @"

# Configuration Asterisk AMI
ASTERISK_HOST=localhost
ASTERISK_AMI_PORT=5038
ASTERISK_AMI_USERNAME=hellojade
ASTERISK_AMI_PASSWORD=hellojade123
"@

if (Test-Path "backend\config.env") {
    Add-Content -Path "backend\config.env" -Value $envContent
    Write-Host "  ✓ Variables d'environnement ajoutées à backend\config.env" -ForegroundColor Green
}

Write-Host "`n✅ Configuration terminée!" -ForegroundColor Green
Write-Host "`n📌 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "  1. Démarrer les services Docker: docker-compose up -d" -ForegroundColor White
Write-Host "  2. Vérifier les logs: docker-compose logs -f asterisk" -ForegroundColor White
Write-Host "  3. Tester la connexion dans le monitoring HelloJADE" -ForegroundColor White
Write-Host "`n💡 Note: Remplacez YOUR_PUBLIC_IP dans sip.conf par votre IP publique si nécessaire" -ForegroundColor Cyan