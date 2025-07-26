# HelloJADE - Configuration Environnement Hospitalier Réaliste

## Vue d'ensemble

Cette configuration simule un environnement hospitalier réel où :
- **Serveur Oracle** tourne sur une machine séparée (votre ordinateur)
- **Application HelloJADE** se connecte à distance au serveur
- **Sécurité réseau** appropriée pour un environnement médical
- **Conformité RGPD** et standards hospitaliers

## Architecture simulée

```
┌─────────────────────────────────────────────────────────────┐
│                    ENVIRONNEMENT HOSPITALIER                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   Application   │    │        Serveur Oracle           │ │
│  │   HelloJADE     │◄──►│      (192.168.1.100:1521)       │ │
│  │                 │    │                                 │ │
│  │ - Frontend      │    │ - Base de données patients      │ │
│  │ - Backend       │    │ - Dossiers médicaux             │ │
│  │ - API REST      │    │ - Logs d'audit                  │ │
│  │ - Téléphonie    │    │ - Transcriptions IA             │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   Monitoring    │    │        Sécurité                 │ │
│  │                 │    │                                 │ │
│  │ - Prometheus    │    │ - Firewall                      │ │
│  │ - Grafana       │    │ - SSL/TLS                       │ │
│  │ - Logs          │    │ - Audit trails                  │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Pourquoi cette configuration ?

### Réalisme hospitalier
- **Séparation des responsabilités** : Base de données séparée de l'application
- **Sécurité** : Accès contrôlé et chiffré
- **Scalabilité** : Possibilité d'ajouter des serveurs
- **Maintenance** : Mise à jour indépendante des composants

### Conformité médicale
- **RGPD** : Protection des données personnelles
- **HDS** : Hébergeur de Données de Santé
- **ISO 27001** : Sécurité de l'information
- **Audit trails** : Traçabilité complète

## Installation et configuration

### 1. Démarrage du serveur Oracle hospitalier

```powershell
cd infrastructure
.\oracle-server-setup.ps1
```

Ce script :
- Crée un réseau Docker sécurisé
- Démarre Oracle sur l'IP `192.168.1.100`
- Configure la sécurité réseau
- Initialise la base de données avec les données de test

### 2. Test de connexion à distance

```powershell
.\test-remote-oracle.ps1
```

Ce script teste :
- Connectivité réseau vers le serveur
- Connexion à distance depuis l'application
- Performance du serveur
- Intégrité des données

### 3. Configuration de l'application

L'application HelloJADE se configure avec :
- **Host** : `192.168.1.100`
- **Port** : `1521`
- **Service** : `XE`
- **Utilisateur** : `hellojade`
- **Mot de passe** : `hellojade123`

## Informations techniques

### Serveur Oracle
- **IP** : 192.168.1.100 (simulation serveur hospitalier)
- **Port** : 1521 (Oracle standard)
- **Service** : XE (Express Edition)
- **Version** : Oracle Database 21c Express Edition
- **Encodage** : AL32UTF8 (support multilingue)

### Réseau
- **Nom** : hellojade-hospital-network
- **Sous-réseau** : 192.168.1.0/24
- **Passerelle** : 192.168.1.1
- **Sécurité** : Firewall activé, SSL/TLS

### Base de données
- **Tables** : 8 tables principales
- **Données** : 10 patients, 8 utilisateurs, 15 appels
- **Index** : Optimisés pour les performances
- **Audit** : Logs complets d'activité

## Sécurité

### Chiffrement
- **SSL/TLS** : Connexions chiffrées
- **Encryption** : Données chiffrées en transit
- **Integrity** : Vérification d'intégrité

### Authentification
- **Utilisateurs** : Rôles et permissions
- **Mots de passe** : Politique de complexité
- **Sessions** : Timeout automatique

### Audit
- **Logs système** : Toutes les activités
- **Logs d'audit** : Modifications et accès
- **Conformité** : Traçabilité RGPD

## Monitoring

### Métriques disponibles
- **Performance** : Temps de réponse des requêtes
- **Connexions** : Nombre de connexions actives
- **Espace** : Utilisation du stockage
- **Erreurs** : Logs d'erreurs et exceptions

### Outils
- **Prometheus** : Collecte de métriques
- **Grafana** : Dashboards de monitoring
- **Logs** : Centralisation des logs

## Conformité RGPD

### Protection des données
- **Chiffrement** : Données chiffrées
- **Accès** : Contrôle d'accès strict
- **Audit** : Traçabilité complète
- **Suppression** : Droit à l'oubli

### Droits des patients
- **Accès** : Consultation des données
- **Rectification** : Modification des données
- **Portabilité** : Export des données
- **Opposition** : Refus de traitement

## Utilisation en production

### Variables d'environnement
```bash
ORACLE_HOST=serveur-oracle.hopital.fr
ORACLE_PORT=1521
ORACLE_SERVICE=PROD
ORACLE_USER=hellojade_prod
ORACLE_PASSWORD=MotDePasseComplexe123!
```

### Configuration de sécurité
- **Firewall** : Accès restreint par IP
- **VPN** : Connexion sécurisée
- **Certificats** : Certificats SSL valides
- **Monitoring** : Surveillance 24/7

### Sauvegarde
- **Fréquence** : Quotidienne
- **Rétention** : 30 jours
- **Récupération** : Test mensuel
- **Sécurité** : Chiffrement des sauvegardes

## Dépannage

### Problèmes courants

1. **Connexion refusée**
   - Vérifiez que le serveur Oracle est démarré
   - Vérifiez les paramètres de connexion
   - Testez la connectivité réseau

2. **Performance lente**
   - Vérifiez les ressources système
   - Optimisez les requêtes
   - Surveillez les logs de performance

3. **Erreurs de sécurité**
   - Vérifiez les certificats SSL
   - Contrôlez les permissions utilisateur
   - Consultez les logs d'audit

### Commandes utiles

```bash
# Vérifier le statut du serveur
docker ps | grep hellojade-oracle-server

# Voir les logs
docker logs -f hellojade-oracle-server

# Se connecter à Oracle
docker exec -it hellojade-oracle-server sqlplus hellojade/hellojade123@//localhost:1521/XE

# Tester la connexion
.\test-remote-oracle.ps1
```

## Support

Pour toute question ou problème :
1. Consultez les logs Docker
2. Vérifiez la documentation
3. Testez la connexion à distance
4. Contactez l'équipe technique

Cette configuration vous permet de simuler un environnement hospitalier réaliste et de développer votre application HelloJADE dans des conditions proches de la production. 