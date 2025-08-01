# Configuration d'Asterisk pour HelloJADE

Ce guide vous explique comment configurer Asterisk avec Docker pour ajouter des fonctionnalités de téléphonie à HelloJADE.

## 📋 Prérequis

- Docker Desktop installé et en cours d'exécution
- HelloJADE fonctionnel
- Compte Zadarma configuré (les informations sont déjà dans les fichiers de configuration)

## 🚀 Installation rapide

### 1. Exécuter le script de configuration

Ouvrez PowerShell en tant qu'administrateur et exécutez :

```powershell
.\setup-asterisk.ps1
```

Ce script va :
- Créer la structure de dossiers nécessaire
- Générer les fichiers de configuration Asterisk
- Configurer la connexion à Zadarma avec vos identifiants

### 2. Créer le fichier monitoring-asterisk.js

Copiez le fichier `monitoring-asterisk.js` dans le dossier `backend/routes/` :

```powershell
# Depuis la racine du projet
Copy-Item monitoring-asterisk.js backend\routes\monitoring-asterisk.js
```

### 3. Démarrer les services

```powershell
# Démarrer tous les services (Docker + HelloJADE)
node start-hellojade.js
```

Ou séparément :

```powershell
# Démarrer uniquement les services Docker
docker-compose up -d

# Puis démarrer HelloJADE normalement
node start-hellojade.js
```

## 🔍 Vérification

### 1. Vérifier le statut des conteneurs Docker

```powershell
docker-compose ps
```

Vous devriez voir :
- `hellojade-asterisk` : Status "Up"
- `hellojade-postgres` : Status "Up"
- `hellojade-oracle` : Status "Up" (optionnel)
- `hellojade-redis` : Status "Up"

### 2. Vérifier les logs d'Asterisk

```powershell
docker-compose logs -f asterisk
```

Recherchez la ligne confirmant l'enregistrement SIP :
```
Registered SIP '514666' at sip.zadarma.com
```

### 3. Tester dans l'interface HelloJADE

1. Ouvrez HelloJADE : http://localhost:5173
2. Allez dans la section Monitoring
3. Vérifiez que le service "Asterisk" apparaît comme "En ligne"

## 📞 Configuration Zadarma

Vos identifiants Zadarma sont déjà configurés :
- **Serveur SIP** : sip.zadarma.com
- **Login** : 514666
- **Mot de passe** : ioGlgIA65Q
- **CallerID** : +32480206284

## 🛠️ Dépannage

### Asterisk ne se connecte pas à Zadarma

1. Vérifiez votre connexion Internet
2. Assurez-vous que les ports suivants ne sont pas bloqués :
   - 5060 (SIP)
   - 10000-10100 (RTP)

### Le monitoring affiche "Service non disponible"

1. Vérifiez que le conteneur Asterisk est en cours d'exécution :
   ```powershell
   docker ps | findstr asterisk
   ```

2. Vérifiez les logs pour des erreurs :
   ```powershell
   docker-compose logs asterisk
   ```

3. Redémarrez le conteneur :
   ```powershell
   docker-compose restart asterisk
   ```

### Erreur "Docker non disponible"

1. Assurez-vous que Docker Desktop est installé
2. Démarrez Docker Desktop
3. Attendez que Docker soit complètement démarré avant de relancer

## 📁 Structure des fichiers

```
HelloJADE-desktop/
├── docker-compose.yml           # Configuration Docker
├── asterisk/                    # Fichiers de configuration Asterisk
│   ├── etc/
│   │   └── asterisk/
│   │       ├── sip.conf        # Configuration SIP/Zadarma
│   │       ├── extensions.conf  # Plan de numérotation
│   │       └── manager.conf     # Configuration AMI
│   └── logs/                   # Logs Asterisk
├── backend/
│   └── routes/
│       ├── monitoring.js       # Routes de monitoring (mis à jour)
│       └── monitoring-asterisk.js # Module de monitoring Asterisk
└── setup-asterisk.ps1          # Script d'installation

```

## 🔒 Sécurité

- Les mots de passe AMI sont configurés localement uniquement
- L'accès AMI est restreint aux connexions locales
- Les identifiants Zadarma sont stockés dans les fichiers de configuration

## 📊 Monitoring

Le monitoring vérifie :
- ✅ État du conteneur Docker
- ✅ Connexion AMI (Asterisk Manager Interface)
- ✅ Enregistrement SIP avec Zadarma
- ✅ Nombre d'appels actifs

## 🚧 Prochaines étapes

Une fois Asterisk configuré et fonctionnel, vous pourrez :
- Ajouter des extensions SIP internes
- Configurer des files d'attente d'appels
- Implémenter l'enregistrement des appels
- Ajouter des fonctionnalités IVR
- Intégrer la téléphonie dans l'application HelloJADE

## 💡 Commandes utiles

```powershell
# Voir les logs en temps réel
docker-compose logs -f asterisk

# Accéder à la console Asterisk
docker exec -it hellojade-asterisk asterisk -rvvv

# Vérifier l'enregistrement SIP
docker exec -it hellojade-asterisk asterisk -rx "sip show registry"

# Voir les peers SIP
docker exec -it hellojade-asterisk asterisk -rx "sip show peers"

# Redémarrer Asterisk
docker-compose restart asterisk
```