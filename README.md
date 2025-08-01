# HelloJADE Desktop

Application desktop moderne pour la gestion hospitalière avec authentification LDAP.

## 🚀 Fonctionnalités

- **Authentification LDAP** : Connexion sécurisée via Active Directory
- **Interface moderne** : Frontend Vue.js avec Tailwind CSS
- **API REST** : Backend Node.js avec Express
- **Application desktop** : Interface Tauri pour une expérience native

## 📁 Structure du projet

```
HelloJADE-desktop/
├── frontend/          # Application Vue.js + Tauri
├── backend/           # API Node.js avec authentification LDAP
├── AD_CONFIGURATION.md # Configuration Active Directory
└── start-hellojade.js # Script de démarrage
```

## 🛠️ Installation

### Prérequis

- Node.js 18+ 
- npm ou yarn
- Configuration LDAP/Active Directory

### Démarrage rapide

```bash
# Cloner le projet
git clone <repository-url>
cd HelloJADE-desktop

# Démarrer l'application
node start-hellojade.js
```

### Démarrage manuel

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (dans un autre terminal)
cd frontend
npm install
npm run dev
```

## 🔐 Configuration LDAP

1. Créer un fichier `.env` dans le dossier `backend/`
2. Configurer les variables d'environnement LDAP :

```env
LDAP_SERVER=your-ldap-server.com
LDAP_BASE_DN=DC=yourdomain,DC=com
LDAP_BIND_DN=CN=ServiceAccount,OU=ServiceAccounts,DC=yourdomain,DC=com
LDAP_BIND_PASSWORD=your-service-account-password
LDAP_USER_SEARCH_BASE=OU=Users,DC=yourdomain,DC=com
LDAP_GROUP_SEARCH_BASE=OU=Groups,DC=yourdomain,DC=com
JWT_SECRET_KEY=your-jwt-secret-key
```

Voir `AD_CONFIGURATION.md` pour plus de détails.

## 🌐 Accès

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:8000
- **API Health Check** : http://localhost:8000/api/health

## 📋 Pages disponibles

- **Login** : Authentification LDAP
- **Dashboard** : En cours de développement
- **Patients** : En cours de développement
- **Appels** : En cours de développement
- **IA** : En cours de développement
- **Administration** : En cours de développement

## 🔧 Développement

### Backend

```bash
cd backend
npm run dev          # Mode développement
npm run test-ldap    # Tester la connexion LDAP
```

### Frontend

```bash
cd frontend
npm run dev          # Mode développement
npm run build        # Build de production
npm run tauri dev    # Application desktop
```

## 📝 Scripts disponibles

- `node start-hellojade.js` : Démarre le backend et le frontend
- `cd backend && npm run dev` : Démarre le backend en mode développement
- `cd frontend && npm run dev` : Démarre le frontend en mode développement

## 🏗️ Architecture

- **Frontend** : Vue.js 3 + Vite + Tailwind CSS + Tauri
- **Backend** : Node.js + Express + LDAP.js + JWT
- **Authentification** : LDAP/Active Directory + JWT
- **Interface** : Application desktop native avec Tauri

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

## 👥 Équipe

HelloJADE Team 