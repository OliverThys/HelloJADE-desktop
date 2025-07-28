# Configuration des Machines Virtuelles

## Windows Server - Active Directory

### Prérequis
- Windows Server 2019/2022
- Au moins 4GB RAM
- 50GB d'espace disque
- Configuration réseau statique

### Installation Active Directory

#### Étape 1 : Installation des rôles
```powershell
# Installer le rôle AD DS
Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools
```

#### Étape 2 : Promotion en contrôleur de domaine
```powershell
# Promouvoir en contrôleur de domaine
Install-ADDSForest -DomainName "hellojade.local" -DomainNetbiosName "HELLOJADE" -InstallDns
```

#### Étape 3 : Configuration post-installation
```powershell
# Vérifier l'installation
Get-ADDomain
Get-ADForest

# Installer les outils d'administration
Install-WindowsFeature -Name RSAT-ADDS, RSAT-AD-Tools, RSAT-AD-PowerShell
```

### Configuration réseau

#### Paramètres recommandés
- **Nom de domaine** : hellojade.local
- **IP statique** : 192.168.129.46
- **Masque** : 255.255.255.0
- **Passerelle** : 192.168.129.1
- **DNS** : 127.0.0.1 (lui-même)

#### Script de configuration réseau
```powershell
# Configurer l'IP statique
New-NetIPAddress -InterfaceAlias "Ethernet0" -IPAddress "192.168.129.46" -PrefixLength 24 -DefaultGateway "192.168.129.1"

# Configurer DNS
Set-DnsClientServerAddress -InterfaceAlias "Ethernet0" -ServerAddresses "127.0.0.1"
```

## Oracle Database

### Installation Oracle XE

#### Étape 1 : Téléchargement
- Télécharger Oracle Database 21c XE depuis le site officiel
- Ou utiliser Oracle Database 19c XE

#### Étape 2 : Installation
```bash
# Monter l'ISO et lancer l'installateur
./runInstaller -silent -responseFile /path/to/response.rsp
```

#### Étape 3 : Configuration
```sql
-- Connexion en tant que SYSTEM
sqlplus / as sysdba

-- Créer un utilisateur pour l'application
CREATE USER hellojade IDENTIFIED BY "MotDePasse123!";
GRANT CONNECT, RESOURCE, DBA TO hellojade;
```

### Scripts de maintenance

#### Sauvegarde
```bash
#!/bin/bash
# backup-oracle.sh
DATE=$(date +%Y%m%d_%H%M%S)
expdp SYSTEM/system123@//localhost:1521/XE \
  DIRECTORY=DATA_PUMP_DIR \
  DUMPFILE=hellojade_backup_$DATE.dmp \
  LOGFILE=hellojade_backup_$DATE.log
```

#### Monitoring
```sql
-- Vérifier l'espace disque
SELECT tablespace_name, bytes/1024/1024 MB 
FROM dba_data_files;

-- Vérifier les connexions actives
SELECT username, machine, program 
FROM v$session 
WHERE username IS NOT NULL;
```

## Intégration

### Scripts d'intégration AD-Oracle
```powershell
# Script pour synchroniser les utilisateurs AD avec Oracle
# À développer selon les besoins spécifiques
```

### Monitoring global
```powershell
# Script de vérification de l'état des services
Get-Service -Name "NTDS", "DNS", "OracleServiceXE"
```

## Sécurité

### Bonnes pratiques
- Changer les mots de passe par défaut
- Configurer le pare-feu Windows
- Mettre en place des sauvegardes automatiques
- Monitorer les logs d'événements

### Configuration du pare-feu
```powershell
# Autoriser les ports nécessaires
New-NetFirewallRule -DisplayName "Oracle Database" -Direction Inbound -Protocol TCP -LocalPort 1521 -Action Allow
New-NetFirewallRule -DisplayName "DNS Server" -Direction Inbound -Protocol TCP -LocalPort 53 -Action Allow
New-NetFirewallRule -DisplayName "LDAP" -Direction Inbound -Protocol TCP -LocalPort 389 -Action Allow
``` 