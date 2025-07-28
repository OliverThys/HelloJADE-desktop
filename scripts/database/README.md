# Scripts de Base de Données

## Oracle Database

### Structure des fichiers
```
database/
├── init/              # Scripts d'initialisation
├── data/              # Données de test
├── migrations/        # Scripts de migration
└── config/           # Configurations de connexion
```

### Scripts disponibles

#### Initialisation
- `01-create-tables.sql` - Création des tables principales
- `02-create-sequences.sql` - Création des séquences
- `03-create-indexes.sql` - Création des index

#### Données de test
- `01-insert-patients.sql` - Données patients
- `02-insert-appointments.sql` - Données rendez-vous
- `03-insert-users.sql` - Données utilisateurs

#### Migrations
- `001-add-audit-columns.sql` - Ajout de colonnes d'audit
- `002-update-user-roles.sql` - Mise à jour des rôles

### Utilisation

1. **Connexion à Oracle** :
   ```bash
   sqlplus SYSTEM/system123@//192.168.129.46:1521/XE
   ```

2. **Exécution des scripts** :
   ```bash
   @scripts/database/init/01-create-tables.sql
   ```

3. **Vérification** :
   ```sql
   SELECT table_name FROM user_tables;
   ```

### Configuration

Les paramètres de connexion sont dans `backend/config.env` :
- HOST: 192.168.129.46
- PORT: 1521
- SERVICE: XE
- USER: SYSTEM
- PASSWORD: system123

## Active Directory

### Scripts PowerShell

#### Création d'utilisateurs
```powershell
# Créer un utilisateur admin
New-ADUser -Name "Admin HelloJADE" -SamAccountName "admin" -UserPrincipalName "admin@hellojade.local" -AccountPassword (ConvertTo-SecureString "MotDePasse123!" -AsPlainText -Force) -Enabled $true

# Créer un utilisateur standard
New-ADUser -Name "User Standard" -SamAccountName "user" -UserPrincipalName "user@hellojade.local" -AccountPassword (ConvertTo-SecureString "MotDePasse123!" -AsPlainText -Force) -Enabled $true
```

#### Création de groupes
```powershell
# Groupe administrateurs
New-ADGroup -Name "HelloJADE-Admins" -GroupScope Global -GroupCategory Security

# Groupe utilisateurs
New-ADGroup -Name "HelloJADE-Users" -GroupScope Global -GroupCategory Security
```

### Intégration avec l'application

Les scripts d'intégration permettront de :
- Authentifier les utilisateurs contre l'AD
- Récupérer les informations de profil
- Gérer les permissions basées sur les groupes AD 