# Configuration Base de données Oracle - Simulation Hôpital

## Vue d'ensemble

Ce document explique comment configurer et utiliser la base de données Oracle simulée hôpital dans le projet HelloJADE.

## Prérequis

1. **Oracle Database** installé et configuré
2. **Oracle Instant Client** installé (pour Node.js)
3. **Schéma SIMULATIONHOPITAL** créé avec les tables de données

## Installation

### 1. Installation d'Oracle Database

#### Option A: Oracle Database Express Edition (XE)
```bash
# Télécharger Oracle Database XE depuis le site officiel Oracle
# Installer selon les instructions du guide d'installation
```

#### Option B: Oracle Database via Docker
```bash
docker run -d --name oracle-db \
  -p 1521:1521 \
  -e ORACLE_PWD=oracle \
  -e ORACLE_CHARACTERSET=AL32UTF8 \
  oracle/database:21.3.0-xe
```

### 2. Installation d'Oracle Instant Client

#### Windows
```bash
# Télécharger Oracle Instant Client depuis le site officiel
# Ajouter le chemin au PATH système
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get install libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/instantclient-basiclite-linuxx64.zip
unzip instantclient-basiclite-linuxx64.zip
export LD_LIBRARY_PATH=/path/to/instantclient:$LD_LIBRARY_PATH
```

### 3. Configuration du projet

#### Variables d'environnement
Modifiez le fichier `backend/config.env` :

```env
# Configuration Oracle (Hôpital)
ORACLE_USER=SIMULATIONHOPITAL
ORACLE_PASSWORD=Hospital2024
ORACLE_CONNECTION_STRING=localhost:1521/XE
```

#### Installation des dépendances
```bash
cd backend
npm install oracledb
```

## Création du schéma et des données

### 1. Connexion à Oracle
```sql
-- Se connecter en tant qu'utilisateur SYSTEM
sqlplus system/oracle@localhost:1521/XE
```

### 2. Création du schéma
```sql
-- Créer l'utilisateur SIMULATIONHOPITAL
CREATE USER SIMULATIONHOPITAL IDENTIFIED BY Hospital2024;

-- Accorder les privilèges
GRANT CONNECT, RESOURCE TO SIMULATIONHOPITAL;
GRANT CREATE SESSION TO SIMULATIONHOPITAL;
GRANT UNLIMITED TABLESPACE TO SIMULATIONHOPITAL;
```

### 3. Import des données

Le fichier SQL d'export est disponible à l'emplacement suivant :
```
c:\Users\olive\Downloads\sqldeveloper-24.3.1.347.1826-x64\sqldeveloper\sqldeveloper\bin\.sql
```

**Informations de connexion :**
- **Utilisateur :** SIMULATIONHOPITAL
- **Mot de passe :** Hospital2024

Pour importer le schéma et les données :

```sql
-- Se connecter en tant que SIMULATIONHOPITAL
sqlplus SIMULATIONHOPITAL/Hospital2024@localhost:1521/XE

-- Exécuter le script SQL d'export
@c:\Users\olive\Downloads\sqldeveloper-24.3.1.347.1826-x64\sqldeveloper\sqldeveloper\bin\.sql
```

**Alternative avec SQL Developer :**
1. Ouvrir SQL Developer
2. Se connecter avec les identifiants SIMULATIONHOPITAL/Hospital2024
3. Ouvrir le fichier `.sql` et exécuter le script

## Test de la configuration

### 1. Test de connexion
```bash
cd backend
npm run test-oracle
```

### 2. Vérification via l'interface web
1. Démarrer le serveur backend : `npm start`
2. Démarrer le frontend : `npm run dev`
3. Aller dans l'onglet Monitoring
4. Vérifier que "Base de données Hôpital" apparaît en vert

## Structure des données

### Tables principales
- **PATIENTS** : Informations sur les patients
- **MEDECINS** : Informations sur les médecins
- **SERVICES** : Services hospitaliers
- **CHAMBRES** : Chambres d'hospitalisation
- **HOSPITALISATIONS** : Hospitalisations en cours
- **RENDEZ_VOUS** : Rendez-vous médicaux
- **TELEPHONES** : Numéros de téléphone

### Statistiques disponibles
- Nombre total d'enregistrements
- Chambres occupées
- Hospitalisations actives
- Rendez-vous programmés
- Temps de réponse de la base

## Monitoring

### Endpoints API
- `GET /api/monitoring/hospital-db` : Statut de la base de données

### Métriques surveillées
- **Connectivité** : Capacité à se connecter à Oracle
- **Performance** : Temps de réponse des requêtes
- **Données** : Nombre d'enregistrements par table
- **Activité** : Hospitalisations et chambres occupées

### Interface de monitoring
Le monitoring affiche :
- Statut en temps réel (online/offline)
- Temps de réponse
- Statistiques détaillées par table
- Informations sur l'occupation des chambres
- Nombre d'hospitalisations actives

## Dépannage

### Erreurs courantes

#### 1. Erreur de connexion
```
ORA-12541: TNS:no listener
```
**Solution** : Vérifier que le service Oracle est démarré

#### 2. Erreur d'authentification
```
ORA-01017: invalid username/password
```
**Solution** : Vérifier les identifiants dans config.env

#### 3. Erreur de schéma
```
ORA-00942: table or view does not exist
```
**Solution** : Vérifier que le schéma SIMULATIONHOPITAL existe et contient les tables

#### 4. Erreur de bibliothèque
```
Error: DPI-1047: Cannot locate a 64-bit Oracle Client library
```
**Solution** : Installer Oracle Instant Client et configurer LD_LIBRARY_PATH

### Commandes utiles

#### Vérifier le statut d'Oracle
```bash
# Windows
sc query OracleServiceXE

# Linux
systemctl status oracle-xe
```

#### Tester la connexion SQLPlus
```bash
sqlplus system/oracle@localhost:1521/XE
```

#### Vérifier les tables
```sql
SELECT table_name FROM user_tables WHERE owner = 'SIMULATIONHOPITAL';
```

## Maintenance

### Sauvegarde
```bash
# Export des données
expdp SIMULATIONHOPITAL/password@localhost:1521/XE \
  directory=DATA_PUMP_DIR \
  dumpfile=hospital_backup.dmp \
  schemas=SIMULATIONHOPITAL
```

### Restauration
```bash
# Import des données
impdp SIMULATIONHOPITAL/password@localhost:1521/XE \
  directory=DATA_PUMP_DIR \
  dumpfile=hospital_backup.dmp \
  schemas=SIMULATIONHOPITAL
```

## Support

Pour toute question ou problème :
1. Vérifier les logs du serveur backend
2. Consulter la documentation Oracle officielle
3. Tester la connexion avec le script `test-oracle-connection.js` 