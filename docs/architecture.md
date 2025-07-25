# HelloJADE v1.0 - Architecture Technique

## Vue d'ensemble

HelloJADE est une application desktop SaaS conçue pour la gestion post-hospitalisation, intégrant des technologies modernes pour l'automatisation des appels, la transcription audio, l'analyse IA et le suivi patient.

## Architecture Générale

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │ Infrastructure  │
│   Vue.js 3      │◄──►│   Flask API     │◄──►│   Docker        │
│   + Tauri       │    │   + Oracle      │    │   + Monitoring  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Téléphonie    │    │      IA         │    │   Sécurité      │
│   Asterisk      │    │   Whisper       │    │   LDAP + JWT    │
│   + Zadarma     │    │   + Piper       │    │   + RBAC        │
└─────────────────┘    │   + Ollama      │    └─────────────────┘
                       └─────────────────┘
```

## Composants Principaux

### 1. Frontend (Vue.js 3 + Tauri)

**Technologies :**
- Vue.js 3 avec Composition API
- TypeScript pour le typage statique
- Tauri (Rust) pour l'application desktop
- Pinia pour la gestion d'état
- Vue Router pour la navigation
- Tailwind CSS pour le styling
- Headless UI pour les composants
- Chart.js pour les graphiques

**Structure :**
```
frontend/
├── src/
│   ├── components/     # Composants réutilisables
│   ├── views/         # Pages de l'application
│   ├── stores/        # Stores Pinia
│   ├── assets/        # Ressources statiques
│   ├── utils/         # Utilitaires
│   └── types/         # Types TypeScript
├── src-tauri/         # Configuration Tauri
└── dist/              # Build de production
```

**Fonctionnalités :**
- Interface utilisateur moderne et responsive
- Authentification LDAP intégrée
- Gestion des rôles et permissions
- Tableau de bord en temps réel
- Gestion des patients et appels
- Visualisation des données médicales
- Intégration IA pour l'analyse

### 2. Backend (Flask + Oracle)

**Technologies :**
- Flask 2.3+ pour l'API REST
- Oracle Database pour la persistance
- SQLAlchemy pour l'ORM
- Alembic pour les migrations
- Marshmallow pour la sérialisation
- JWT pour l'authentification
- LDAP pour l'intégration hospitalière

**Structure :**
```
backend/
├── app.py             # Point d'entrée principal
├── core/              # Modules de base
│   ├── config.py      # Configuration
│   ├── database.py    # Modèles et connexion DB
│   ├── auth.py        # Authentification LDAP/JWT
│   ├── logging.py     # Système de logs
│   ├── monitoring.py  # Métriques Prometheus
│   ├── telephony.py   # Gestion téléphonie
│   └── ai.py          # Intégration IA
├── routes/            # Endpoints API
│   ├── auth.py        # Authentification
│   ├── patients.py    # Gestion patients
│   ├── calls.py       # Gestion appels
│   └── ai.py          # Endpoints IA
└── requirements.txt   # Dépendances Python
```

**API Endpoints :**
- `POST /api/auth/login` - Connexion LDAP
- `POST /api/auth/logout` - Déconnexion
- `GET /api/patients` - Liste des patients
- `POST /api/calls` - Créer un appel
- `POST /api/ai/transcribe` - Transcription audio
- `GET /api/monitoring/metrics` - Métriques système

### 3. Infrastructure (Docker + Monitoring)

**Services Docker :**
- **Oracle Database** : Base de données principale
- **Prometheus** : Collecte de métriques
- **Grafana** : Visualisation des dashboards
- **Elasticsearch** : Stockage des logs
- **Logstash** : Traitement des logs
- **Kibana** : Interface de logs
- **Redis** : Cache et sessions
- **Nginx** : Reverse proxy
- **Asterisk** : Serveur téléphonique
- **Ollama** : LLM local

**Monitoring :**
- Métriques système (CPU, mémoire, disque)
- Métriques applicatives (requêtes, erreurs)
- Métriques métier (patients, appels, IA)
- Alertes automatiques
- Logs centralisés et structurés

### 4. Téléphonie (Asterisk + Zadarma)

**Asterisk :**
- Serveur téléphonique open source
- Gestion des appels sortants automatiques
- Enregistrement des conversations
- Intégration AMI pour le contrôle
- Scripts de routage personnalisés

**Zadarma :**
- Fournisseur de téléphonie cloud
- API REST pour les appels
- Webhooks pour les événements
- Support international
- Facturation à l'usage

**Fonctionnalités :**
- Appels automatiques J+1
- Planification d'appels
- Enregistrement automatique
- Intégration avec l'IA
- Gestion des erreurs et retry

### 5. Intelligence Artificielle

**Whisper (STT) :**
- Transcription audio en temps réel
- Support multilingue (FR, EN, NL)
- Modèles optimisés pour le médical
- Intégration avec les enregistrements

**Piper (TTS) :**
- Synthèse vocale de haute qualité
- Voix française naturelle
- Génération de messages automatiques
- Intégration avec les résumés IA

**Ollama (LLM) :**
- Modèles de langage locaux
- Analyse des conversations
- Génération de résumés médicaux
- Recommandations automatiques
- Conformité RGPD (données locales)

**Pipeline IA :**
1. Enregistrement audio (Asterisk)
2. Transcription (Whisper)
3. Analyse conversation (Ollama)
4. Génération résumé (Ollama)
5. Synthèse vocale (Piper)
6. Stockage résultats (Oracle)

### 6. Sécurité

**Authentification :**
- LDAP hospitalier pour l'authentification
- JWT pour les sessions API
- Refresh tokens automatiques
- Gestion des sessions multiples

**Autorisation :**
- RBAC (Role-Based Access Control)
- Permissions granulaires
- Vérification des rôles par endpoint
- Audit trail complet

**Conformité :**
- RGPD : Données personnelles protégées
- ISO 27001 : Sécurité de l'information
- Chiffrement des données sensibles
- Logs d'audit détaillés

**Rôles Utilisateurs :**
- **Admin** : Accès complet au système
- **Médecin** : Gestion patients et appels
- **Infirmier** : Suivi patients et appels
- **Secrétaire** : Gestion administrative
- **User** : Lecture seule

## Flux de Données

### 1. Appel Automatique
```
Patient DB → Planification → Asterisk → Appel → Enregistrement → IA → Résultats
```

### 2. Authentification
```
LDAP → Validation → JWT → Session → Permissions → Accès
```

### 3. Traitement IA
```
Audio → Whisper → Texte → Ollama → Analyse → Résumé → Piper → Audio
```

## Performance et Scalabilité

**Optimisations :**
- Cache Redis pour les données fréquentes
- Indexation Oracle pour les requêtes
- Compression des réponses API
- Pagination des résultats
- Mise en cache des modèles IA

**Monitoring :**
- Métriques temps réel
- Alertes automatiques
- Logs structurés
- Traçabilité complète

**Scalabilité :**
- Architecture microservices
- Conteneurisation Docker
- Load balancing Nginx
- Base de données optimisée

## Déploiement

**Environnements :**
- **Développement** : Docker Compose local
- **Staging** : Environnement de test
- **Production** : Serveur Windows dédié

**Scripts d'installation :**
- `install.ps1` : Installation automatique Windows
- `docker-compose.yml` : Infrastructure complète
- Configuration centralisée

**Maintenance :**
- Backups automatiques
- Mises à jour sécurisées
- Monitoring continu
- Support technique

## Sécurité et Conformité

**Mesures de sécurité :**
- Chiffrement TLS/SSL
- Authentification forte
- Autorisation granulaire
- Audit trail complet
- Isolation des données

**Conformité médicale :**
- Protection des données patients
- Traçabilité des actions
- Sauvegarde sécurisée
- Accès contrôlé
- Documentation complète

## Support et Maintenance

**Documentation :**
- Guide utilisateur
- Documentation technique
- API Reference
- Troubleshooting

**Support :**
- Support technique 24/7
- Formation utilisateurs
- Maintenance préventive
- Mises à jour régulières

Cette architecture garantit une solution robuste, sécurisée et évolutive pour la gestion post-hospitalisation avec intégration IA avancée. 