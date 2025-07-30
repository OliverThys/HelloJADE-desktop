# HelloJADE - Gestion des Appels Post-Hospitalisation

## 🚀 Architecture PostgreSQL + Docker

HelloJADE est une application de gestion des appels post-hospitalisation utilisant :
- **Backend** : Node.js + Express + PostgreSQL
- **Frontend** : Vue.js 3 + Tailwind CSS
- **Base de données** : PostgreSQL (Docker)
- **Cache** : Redis (Docker)

## 📋 Prérequis

- Docker et Docker Compose
- Node.js 18+
- npm

## 🛠️ Installation et démarrage

### 1. Cloner le projet
```bash
git clone <repository-url>
cd HelloJADE-desktop
```

### 2. Démarrer l'environnement complet
```bash
cd backend
npm install
docker-compose up -d
node server.js
```

### 3. Démarrer le frontend (dans un autre terminal)
```bash
cd frontend
npm install
npm run dev
```

### 4. Accéder à l'application
- **Frontend** : http://localhost:5173
- **Page Appels** : http://localhost:5173/calls
- **API Backend** : http://localhost:8000/api
- **PostgreSQL** : localhost:5432

## 🗄️ Structure de la base de données

### Tables principales
- `patients_sync` : Patients synchronisés depuis Oracle
- `hospitalisations_sync` : Hospitalisations synchronisées
- `calls` : Appels post-hospitalisation
- `call_history` : Historique des modifications
- `scores` : Scores détaillés des appels
- `call_metadata` : Métadonnées des appels

### Données de test incluses
- 5 patients de test
- 5 hospitalisations de test
- 5 appels de test (avec différents statuts)

## 📊 Fonctionnalités de la page Appels

### Filtres disponibles
- **Recherche globale** : Nom, prénom, numéro patient
- **Filtre par date** : Intervalle de dates d'appel
- **Filtre par statut** : À appeler, Appelé, Échec

### Actions disponibles
- **Sync Oracle** : Synchronisation avec la base hospitalière
- **Export CSV** : Export des données filtrées
- **Voir résumé** : Modal détaillé de l'appel
- **Export PDF** : Export du résumé en PDF

### Colonnes du tableau
- **Patient** : Nom, prénom, numéro, date naissance
- **Contact** : Téléphone
- **Hospitalisation** : Site, service, médecin, date sortie
- **Appel** : Date prévue/réelle, durée, statut
- **Résultats** : Score, résumé
- **Actions** : Voir résumé, export PDF

## 🔧 Configuration

### Variables d'environnement
```bash
# Backend
PORT=8000
NODE_ENV=development

# PostgreSQL
POSTGRES_DB=hellojade
POSTGRES_USER=hellojade_user
POSTGRES_PASSWORD=hellojade_password
```

### Docker Compose
```yaml
services:
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: hellojade
      POSTGRES_USER: hellojade_user
      POSTGRES_PASSWORD: hellojade_password

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

## 📡 API Endpoints

### Appels
- `GET /api/calls` - Liste des appels avec filtres
- `GET /api/calls/:id` - Détails d'un appel
- `POST /api/calls` - Créer un appel
- `PUT /api/calls/:id` - Modifier un appel
- `GET /api/calls/statistics/overview` - Statistiques
- `POST /api/calls/sync-oracle` - Sync Oracle
- `GET /api/calls/export/csv` - Export CSV

### Santé
- `GET /api/health` - Statut de l'API

## 🎯 Workflow d'appel

1. **Synchronisation Oracle** : Récupération des nouveaux patients
2. **Création d'appels** : Génération automatique des appels prévus
3. **Exécution d'appels** : Via Asterisk + Whisper + Rasa
4. **Analyse** : Scoring via Ollama
5. **Stockage** : Sauvegarde en PostgreSQL
6. **Interface** : Visualisation et gestion via Vue.js

## 🚀 Démarrage rapide

### Script automatique
```bash
cd backend
node start-hellojade.js
```

Ce script démarre automatiquement :
- Docker Compose (PostgreSQL + Redis)
- Serveur backend
- Frontend (si configuré)

## 🔍 Dépannage

### Problèmes courants

**PostgreSQL ne démarre pas**
```bash
docker-compose down
docker-compose up -d
```

**Erreur de connexion à la base**
```bash
# Vérifier les logs
docker-compose logs postgres

# Redémarrer le service
docker-compose restart postgres
```

**Frontend ne se connecte pas à l'API**
- Vérifier que le serveur backend tourne sur le port 8000
- Vérifier les CORS dans `server.js`

## 📝 Format des données

### Structure d'un appel
```json
{
  "project_call_id": 1,
  "project_patient_id": 1,
  "statut": "complete",
  "date_appel_prevue": "2025-01-30T14:00:00",
  "date_appel_reelle": "2025-01-30T14:30:22",
  "duree_secondes": 185,
  "score": 85,
  "resume_appel": "Patient en bonne forme...",
  "dialogue_result": {
    "douleur_niveau": 3,
    "traitement_suivi": true,
    "moral_niveau": 7
  }
}
```

## 🔄 Synchronisation Oracle

La synchronisation avec Oracle est simulée pour le moment. Pour l'intégrer :

1. Modifier `services/postgresql.js`
2. Ajouter la connexion Oracle
3. Implémenter la logique de sync dans `syncFromOracle()`

## 📈 Performance

- **PostgreSQL** : Optimisé pour milliers d'appels/jour
- **Index** : Créés sur les colonnes fréquemment utilisées
- **Cache Redis** : Pour les données temps réel
- **Virtual Scroll** : Pour les gros tableaux

## 🛡️ Sécurité

- **CORS** : Configuré pour le développement
- **Validation** : Des données d'entrée
- **Isolation** : Base PostgreSQL séparée de l'hôpital

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs Docker : `docker-compose logs`
2. Vérifier les logs backend : `node server.js`
3. Vérifier les logs frontend : `npm run dev`

---

**HelloJADE** - Gestion intelligente des appels post-hospitalisation 