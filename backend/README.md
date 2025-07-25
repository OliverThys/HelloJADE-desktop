# HelloJADE Backend

Backend Flask professionnel pour l'application HelloJADE, une solution SaaS de gestion post-hospitalisation avec transcription automatique et analyse IA.

## 🏗️ Architecture

### Stack Technologique
- **Framework** : Flask 2.3+ avec architecture modulaire
- **Base de données** : Oracle Database avec SQLAlchemy ORM
- **Authentification** : LDAP + JWT avec rôles RBAC
- **IA** : Whisper (transcription), Piper (synthèse vocale), Ollama (analyse)
- **Téléphonie** : Intégration Asterisk + Zadarma
- **Monitoring** : Prometheus + Grafana + ELK Stack
- **Cache** : Redis
- **Sécurité** : Rate limiting, CORS, validation des données

### Structure des Modules
```
backend/
├── app.py                 # Point d'entrée principal avec factory pattern
├── core/                  # Modules de base
│   ├── config.py         # Configuration centralisée
│   ├── database.py       # Modèles SQLAlchemy et connexion Oracle
│   ├── auth.py           # Authentification LDAP + JWT + RBAC
│   ├── logging.py        # Système de logs structurés
│   ├── monitoring.py     # Métriques Prometheus et health checks
│   ├── telephony.py      # Gestion appels Asterisk/Zadarma
│   ├── ai.py             # Intégration Whisper/Piper/Ollama
│   └── security.py       # Middleware de sécurité
├── routes/               # Endpoints API REST
│   ├── auth.py           # Login/logout/profile
│   ├── patients.py       # CRUD patients avec validation
│   ├── calls.py          # Gestion appels et planification
│   ├── ai.py             # Transcription/analyse/synthèse
│   ├── admin.py          # Administration système
│   └── monitoring.py     # Métriques et logs
├── models/               # Modèles de données
├── schemas/              # Validation Marshmallow
├── services/             # Logique métier
├── utils/                # Utilitaires
├── tests/                # Tests unitaires et d'intégration
└── requirements.txt      # Dépendances Python complètes
```

## 🚀 Installation et Déploiement

### Prérequis
- Python 3.11+
- Oracle Database 19c+
- Redis 6+
- Docker & Docker Compose (optionnel)

### Installation Locale

1. **Cloner le repository**
```bash
git clone https://github.com/OliverThys/HelloJADE-desktop.git
cd HelloJADE-desktop/backend
```

2. **Créer un environnement virtuel**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows
```

3. **Installer les dépendances**
```bash
pip install -r requirements.txt
```

4. **Configuration**
```bash
cp .env.example .env
# Éditer .env avec vos paramètres
```

5. **Initialiser la base de données**
```bash
python -c "from app import create_app; from core.database import init_db; app = create_app(); init_db(app)"
```

6. **Démarrer l'application**
```bash
python app.py
```

### Déploiement Docker

1. **Construction et déploiement automatique**
```bash
./deploy.sh deploy
```

2. **Commandes disponibles**
```bash
./deploy.sh build      # Construire l'image
./deploy.sh start      # Démarrer le conteneur
./deploy.sh stop       # Arrêter le conteneur
./deploy.sh restart    # Redémarrer le conteneur
./deploy.sh logs       # Afficher les logs
./deploy.sh status     # Statut du conteneur
```

## 🔧 Configuration

### Variables d'Environnement

```bash
# Configuration Flask
HELLOJADE_SECRET_KEY=very_secure_app_key
JWT_SECRET_KEY=very_secure_jwt_key

# Base de données Oracle
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE=XE
ORACLE_USER=hellojade
ORACLE_PASSWORD=secure_password

# LDAP
LDAP_SERVER=ldap.epicura.be
LDAP_PORT=389
LDAP_BASE_DN=dc=epicura,dc=be
LDAP_BIND_DN=cn=hellojade,ou=services,dc=epicura,dc=be
LDAP_BIND_PASSWORD=ldap_password

# Redis
REDIS_URL=redis://localhost:6379/0

# CORS
CORS_ORIGINS=http://localhost:1420

# IA
WHISPER_MODEL=base
PIPER_MODEL_PATH=./ai/models/piper/fr_FR-amy-medium.onnx
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama2

# Téléphonie
ASTERISK_HOST=localhost
ASTERISK_PORT=5038
ASTERISK_USERNAME=hellojade
ASTERISK_PASSWORD=asterisk_password

ZADARMA_API_KEY=your_zadarma_key
ZADARMA_SECRET_KEY=your_zadarma_secret

# Logs
LOG_LEVEL=INFO
LOG_FILE=/app/logs/hellojade.log
```

## 📡 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion LDAP
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/refresh` - Renouvellement token
- `GET /api/auth/profile` - Profil utilisateur

### Patients
- `GET /api/patients` - Liste avec pagination/filtres
- `GET /api/patients/<id>` - Détails patient
- `POST /api/patients` - Création patient
- `PUT /api/patients/<id>` - Mise à jour
- `DELETE /api/patients/<id>` - Suppression

### Appels
- `GET /api/calls` - Liste des appels
- `GET /api/calls/<id>` - Détails appel
- `POST /api/calls` - Création appel
- `POST /api/calls/schedule` - Planification
- `POST /api/calls/<id>/start` - Démarrage appel
- `PUT /api/calls/<id>` - Mise à jour statut

### IA
- `POST /api/ai/transcribe` - Transcription audio
- `POST /api/ai/analyze` - Analyse de contenu
- `POST /api/ai/synthesize` - Synthèse vocale
- `GET /api/ai/models` - Modèles disponibles

### Administration
- `GET /api/admin/users` - Liste des utilisateurs
- `GET /api/admin/config` - Configuration système
- `POST /api/admin/maintenance/backup` - Sauvegarde
- `GET /api/admin/stats` - Statistiques système

### Monitoring
- `GET /api/health` - Santé de l'application
- `GET /api/monitoring/metrics` - Métriques Prometheus
- `GET /api/monitoring/logs` - Logs récents
- `GET /api/monitoring/dashboard` - Dashboard monitoring

## 🧪 Tests

### Exécution des tests
```bash
# Tests unitaires
pytest tests/

# Tests avec couverture
pytest --cov=. tests/

# Tests d'intégration
pytest tests/integration/
```

### Qualité du code
```bash
# Formatage
black .

# Linting
flake8 .

# Vérification des types
mypy .

# Audit de sécurité
bandit -r .
```

## 📊 Monitoring

### Métriques Prometheus
L'application expose des métriques au format Prometheus sur `/api/monitoring/metrics` :
- Métriques système (CPU, mémoire, disque)
- Métriques d'application (requêtes, erreurs)
- Métriques métier (patients, appels, transcriptions)

### Logs Structurés
Les logs sont au format JSON pour faciliter l'intégration avec ELK Stack :
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "module": "auth",
  "message": "Utilisateur connecté",
  "user_id": 123,
  "ip_address": "192.168.1.100"
}
```

### Health Checks
- `/api/health` - Vérification basique
- `/api/monitoring/health/detailed` - Vérification détaillée de tous les services

## 🔒 Sécurité

### Authentification et Autorisation
- **LDAP** : Intégration avec serveur LDAP hospitalier
- **JWT** : Tokens d'accès et refresh avec expiration
- **RBAC** : Rôles (admin, médecin, infirmier, secrétaire)
- **Rate Limiting** : Protection contre les abus

### Protection des Données
- **Validation stricte** : Marshmallow pour toutes les données
- **Audit trail** : Logs de toutes les actions
- **Chiffrement** : Données sensibles chiffrées
- **CORS** : Configuration sécurisée pour Tauri desktop

### Conformité
- **OWASP** : Protection contre les vulnérabilités courantes
- **RGPD** : Gestion des données personnelles
- **Hébergement** : Conformité hospitalière

## 🚀 Performance

### Optimisations
- **Connection pooling** : Oracle avec SQLAlchemy
- **Cache Redis** : Sessions et données fréquentes
- **Compression** : Réponses API optimisées
- **Pagination** : Gestion des gros volumes

### Métriques de Performance
- **Response time** : <200ms pour les requêtes simples
- **Concurrent users** : Support 100+ utilisateurs simultanés
- **Memory usage** : Optimisation pour serveur 8GB RAM
- **Database** : Requêtes optimisées avec index

## 📚 Documentation

### API Documentation
- **Swagger/OpenAPI** : Documentation interactive disponible sur `/api/docs`
- **Exemples** : Requêtes et réponses documentées
- **Schémas** : Validation Marshmallow documentée

### Architecture
- **Diagrammes** : Architecture système et base de données
- **Flux** : Processus métier et intégrations
- **Déploiement** : Guides de déploiement et configuration

## 🤝 Contribution

### Développement
1. Fork le repository
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

### Standards de Code
- **Python** : PEP 8, type hints, docstrings
- **Tests** : Couverture >80%, tests unitaires et d'intégration
- **Documentation** : Docstrings en français, README à jour
- **Sécurité** : Audit de sécurité avant merge

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](../LICENSE) pour plus de détails.

## 🆘 Support

### Contact
- **Email** : support@hellojade.be
- **Documentation** : https://docs.hellojade.be
- **Issues** : https://github.com/OliverThys/HelloJADE-desktop/issues

### Troubleshooting
- **Logs** : Vérifier les logs dans `/app/logs/`
- **Health Check** : `curl http://localhost:5000/api/health`
- **Base de données** : Vérifier la connexion Oracle
- **Redis** : Vérifier la connexion Redis

---

**HelloJADE Backend** - Solution professionnelle de gestion post-hospitalisation 🏥 