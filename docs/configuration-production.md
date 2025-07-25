# HelloJADE v1.0 - Guide de Configuration Production

## 📋 Vue d'ensemble

Ce guide détaille la configuration complète de HelloJADE pour un déploiement en production chez Epicura Belgium.

## 🔧 Configuration Automatique

### Étape 1 : Configuration des variables d'environnement

```powershell
# Lancer PowerShell en tant qu'administrateur
# Puis exécuter :
.\scripts\setup-env.ps1
```

Ce script va :
- Copier `env.production` vers `.env`
- Configurer les variables système Windows
- Sécuriser les permissions du fichier `.env`
- Valider la configuration

### Étape 2 : Installation complète

```powershell
# Après la configuration des variables
.\scripts\install.ps1
```

## 🔐 Variables d'Environnement Critiques

### Sécurité
```bash
HELLOJADE_SECRET_KEY=HJ8x#mK9$vL2@nP7&qR4!wS5%tU1*yZ6^aB3-cD8+eF9
JWT_SECRET_KEY=JWT7k#mN9$vP2@qR5&wS8!tU1*yZ4^aB7-cD0+eF3
```

### Configuration Zadarma (d'après vos screenshots)
```bash
ZADARMA_SIP_SERVER=sip.zadarma.com
ZADARMA_SIP_LOGIN=514666
ZADARMA_SIP_PASSWORD=iGv3WMkYp8
ZADARMA_SIP_DISPLAY_NAME=HelloJadeFinal
ZADARMA_CALLER_ID=+32480206284
ZADARMA_OUTGOING_LINES=3
```

### Réseau
```bash
SERVER_PUBLIC_IP=81.241.207.153
HELLOJADE_API_URL=https://api.hellojade.epicura.be
HELLOJADE_FRONTEND_URL=https://hellojade.epicura.be
```

## 🏥 Configuration LDAP Epicura

### Variables à personnaliser
```bash
LDAP_SERVER=ldap.epicura.be
LDAP_BASE_DN=dc=epicura,dc=be
LDAP_BIND_DN=cn=hellojade,ou=services,dc=epicura,dc=be
LDAP_BIND_PASSWORD=Epicura2024!HelloJADE
```

### Structure LDAP recommandée
```
dc=epicura,dc=be
├── ou=users
│   ├── cn=medecin1
│   ├── cn=infirmier1
│   └── cn=secretaire1
├── ou=groups
│   ├── cn=medecins
│   ├── cn=infirmiers
│   └── cn=secretaires
└── ou=services
    └── cn=hellojade
```

## 📞 Configuration Téléphonie

### Asterisk Local
```bash
ASTERISK_HOST=localhost
ASTERISK_PORT=5038
ASTERISK_USER=hellojade
ASTERISK_PASSWORD=HelloJADE_Asterisk_2024!
```

### Intégration Zadarma
1. **Configuration SIP** (déjà configurée dans vos screenshots)
   - Serveur : `sip.zadarma.com`
   - Login : `514666`
   - Mot de passe : `iGv3WMkYp8`
   - CallerID : `+32480206284`

2. **Autorisation IP** (à configurer)
   - IP du serveur : `81.241.207.153`
   - Statut : À confirmer dans l'interface Zadarma

3. **API Zadarma** (à obtenir)
   ```bash
   ZADARMA_API_KEY=your-zadarma-api-key-here
   ZADARMA_API_SECRET=your-zadarma-api-secret-here
   ```

## 🗄️ Base de Données Oracle

### Configuration par défaut
```bash
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE=XE
ORACLE_USER=hellojade
ORACLE_PASSWORD=HelloJADE_Oracle_2024!
```

### Initialisation automatique
Le script `infrastructure/oracle/init/01-init-database.sql` sera exécuté automatiquement lors du premier démarrage du conteneur Oracle.

## 🧠 Configuration IA

### Modèles préconfigurés
```bash
# Whisper (Transcription)
WHISPER_MODEL=base
WHISPER_LANGUAGE=fr

# Piper (Synthèse vocale)
PIPER_MODEL=fr_FR-amy-medium.onnx
PIPER_VOICE=fr_FR-amy-medium

# Ollama (LLM local)
OLLAMA_MODEL=llama2:7b
```

### Téléchargement automatique
```powershell
# Les modèles seront téléchargés automatiquement
python ai/download-models.py
```

## 📊 Monitoring et Logs

### Accès aux interfaces
- **Grafana** : http://localhost:3000 (admin/HelloJADE_Grafana_2024!)
- **Prometheus** : http://localhost:9090
- **Kibana** : http://localhost:5601
- **Elasticsearch** : http://localhost:9200

### Dashboards préconfigurés
- Vue d'ensemble HelloJADE
- Métriques système
- Métriques applicatives
- Logs centralisés

## 🔒 Sécurité

### Permissions automatiques
- Fichier `.env` : Administrateurs uniquement
- Variables système : Niveau machine
- Logs d'audit : Activés

### Conformité
- RGPD : Données chiffrées et tracées
- ISO 27001 : Logs d'audit complets
- Accès contrôlé par rôles

## 📧 Notifications

### Email SMTP Epicura
```bash
SMTP_HOST=smtp.epicura.be
SMTP_USER=noreply@epicura.be
SMTP_PASSWORD=Epicura_SMTP_2024!
```

### SMS (optionnel)
```bash
TWILIO_FROM_NUMBER=+32480206284
```

## 🔄 Sauvegarde

### Configuration automatique
- **Fréquence** : Tous les jours à 2h du matin
- **Rétention** : 30 jours
- **Chiffrement** : Activé
- **Compression** : Activée

## 🚀 Déploiement

### Ordre d'exécution
1. **Configuration** : `.\scripts\setup-env.ps1`
2. **Installation** : `.\scripts\install.ps1`
3. **Démarrage** : `docker-compose up -d`
4. **Vérification** : Accès aux interfaces web

### Vérifications post-déploiement
```powershell
# Test de santé de l'API
Invoke-RestMethod -Uri "http://localhost:5000/api/health"

# Test de la base de données
docker exec hellojade-oracle sqlplus hellojade/HelloJADE_Oracle_2024!@localhost:1521/XE

# Test des services
docker-compose ps
```

## 🛠️ Maintenance

### Logs
- **Application** : `C:/HelloJADE/logs/`
- **Système** : Event Viewer Windows
- **Docker** : `docker-compose logs [service]`

### Mises à jour
```powershell
# Arrêt propre
docker-compose down

# Sauvegarde
.\scripts\backup.ps1

# Mise à jour
git pull
docker-compose up -d --build
```

### Monitoring
- **Alertes** : Configurées dans Grafana
- **Seuils** : CPU 80%, RAM 85%, Disque 90%
- **Notifications** : Email automatique

## 🔧 Dépannage

### Problèmes courants

#### 1. Erreur de connexion LDAP
```bash
# Vérifier la configuration
ldapsearch -H ldap://ldap.epicura.be -D "cn=hellojade,ou=services,dc=epicura,dc=be" -w "password" -b "dc=epicura,dc=be"
```

#### 2. Erreur de connexion Oracle
```bash
# Vérifier le service
docker exec hellojade-oracle sqlplus system/hellojade123@localhost:1521/XE
```

#### 3. Erreur téléphonie
```bash
# Vérifier Asterisk
docker exec hellojade-asterisk asterisk -rx "core show version"
```

#### 4. Erreur IA
```bash
# Vérifier Ollama
curl http://localhost:11434/api/tags
```

## 📞 Support

### Contacts
- **Support technique** : support@hellojade.epicura.be
- **Documentation** : https://docs.hellojade.epicura.be
- **Monitoring** : https://monitoring.hellojade.epicura.be

### Escalade
1. **Niveau 1** : Support HelloJADE
2. **Niveau 2** : Administrateur système Epicura
3. **Niveau 3** : Équipe de développement

---

**Note importante** : Ce guide suppose que toutes les variables d'environnement sont correctement configurées. En cas de problème, vérifiez d'abord la configuration avec `.\scripts\setup-env.ps1`. 