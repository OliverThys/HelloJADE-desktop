# Scripts et Configurations

Ce dossier contient tous les scripts et configurations nécessaires pour le déploiement et la maintenance du projet HelloJADE.

## Structure

```
scripts/
├── database/           # Scripts de base de données Oracle
├── vm/                 # Configurations et scripts pour machines virtuelles
├── deployment/         # Scripts de déploiement
└── maintenance/        # Scripts de maintenance
```

## Base de Données

### Oracle
- Scripts de création de tables
- Données de test pour l'hôpital
- Scripts de migration
- Configurations de connexion

### Active Directory
- Scripts de création d'utilisateurs
- Configuration des groupes et permissions
- Scripts d'intégration avec l'application

## Machines Virtuelles

### Configuration
- Scripts d'installation des rôles Windows Server
- Configuration Active Directory
- Installation des services (Oracle, etc.)

### Maintenance
- Scripts de sauvegarde
- Scripts de monitoring
- Scripts de mise à jour

## Utilisation

1. **Base de données** : Exécuter les scripts dans l'ordre pour initialiser la base
2. **VM** : Suivre les guides d'installation pour configurer l'environnement
3. **Déploiement** : Utiliser les scripts automatisés pour le déploiement

## Sécurité

⚠️ **Important** : Les fichiers de configuration contenant des mots de passe ne doivent jamais être commités dans Git.
Utilisez les fichiers `.env` et `.gitignore` appropriés. 