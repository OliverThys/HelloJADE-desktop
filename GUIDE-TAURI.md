# HelloJADE v1.0 - Guide Application Tauri

## 🖥️ Application Desktop HelloJADE

HelloJADE est disponible en tant qu'application desktop native grâce à Tauri, offrant une expérience utilisateur optimale avec toutes les fonctionnalités de l'application web.

### 🚀 Modes de Lancement

#### 1. Mode Production (Application Native)
```powershell
.\launch-tauri.ps1
```
- Construit l'application native (.exe)
- Lance l'application desktop
- Performance optimale
- Distribution possible

#### 2. Mode Développement (Hot Reload)
```powershell
.\launch-tauri-dev.ps1
```
- Mode développement avec hot reload
- Rechargement automatique des modifications
- Débogage facilité
- Interface de développement

#### 3. Mode Web (Navigateur)
```powershell
.\launch-hellojade.ps1
```
- Interface web dans le navigateur
- Accès via http://localhost:5173
- Compatible avec tous les navigateurs

### 🛠️ Prérequis pour Tauri

#### Installation des prérequis (Administrateur requis)
```powershell
# Ouvrir PowerShell en tant qu'administrateur
.\scripts\install-prerequisites.ps1
```

**Ce script installe :**
- Python 3.11
- Rust (requis pour Tauri)
- Dépendances Python
- Dépendances Node.js

### 📱 Fonctionnalités de l'Application Desktop

#### ✅ Avantages de l'Application Native
- **Performance** : Exécution native, plus rapide que le web
- **Intégration** : Accès aux APIs système
- **Sécurité** : Isolation des données locales
- **Offline** : Fonctionnement hors ligne
- **Notifications** : Notifications système natives
- **Fichiers** : Gestion des fichiers locaux

#### 🔧 Fonctionnalités Spécifiques
- **Gestion des patients** : Interface complète
- **Suivi post-hospitalisation** : Workflows automatisés
- **Téléphonie intégrée** : Appels via Zadarma
- **IA locale** : Modèles Ollama intégrés
- **Monitoring** : Dashboards Grafana
- **Sauvegarde** : Données locales sécurisées

### 🏗️ Architecture Tauri

#### Structure du Projet
```
frontend/
├── src/                    # Code Vue.js
├── src-tauri/             # Code Rust (Tauri)
│   ├── src/
│   │   └── main.rs        # Point d'entrée Rust
│   ├── Cargo.toml         # Dépendances Rust
│   └── tauri.conf.json    # Configuration Tauri
├── package.json           # Dépendances Node.js
└── vite.config.ts         # Configuration Vite
```

#### Configuration Tauri
- **Fenêtre** : 1200x800, redimensionnable
- **Permissions** : Fichiers, HTTP, notifications
- **Bundle** : Identifiant com.epicura.hellojade
- **Icônes** : Multi-formats inclus
- **Sécurité** : CSP configuré

### 🔄 Workflow de Développement

#### 1. Développement
```powershell
# Lancer en mode développement
.\launch-tauri-dev.ps1

# Modifier le code dans frontend/src/
# L'application se recharge automatiquement
```

#### 2. Test
```powershell
# Tester l'application
# Vérifier les fonctionnalités
# Valider l'interface utilisateur
```

#### 3. Build Production
```powershell
# Construire l'application native
.\launch-tauri.ps1

# L'exécutable sera dans frontend/src-tauri/target/release/
```

### 📦 Distribution

#### Build pour Windows
```powershell
cd frontend
npm run tauri:build
```

**Fichiers générés :**
- `hellojade.exe` - Application principale
- `hellojade_0.1.0_x64_en-US.msi` - Installateur Windows
- `hellojade_0.1.0_x64_en-US.zip` - Archive portable

#### Installation
1. Exécuter le fichier .msi
2. Suivre l'assistant d'installation
3. Lancer HelloJADE depuis le menu Démarrer

### 🔧 Configuration Avancée

#### Variables d'Environnement
```json
// tauri.conf.json
{
  "tauri": {
    "allowlist": {
      "http": {
        "scope": [
          "http://localhost:5000/**",
          "https://api.hellojade.com/**"
        ]
      }
    }
  }
}
```

#### Permissions Système
- **Fichiers** : Lecture/écriture dans $APPDATA/HelloJADE
- **Réseau** : Connexions HTTP/HTTPS
- **Notifications** : Notifications système
- **Fenêtres** : Gestion des fenêtres

### 🐛 Débogage

#### Logs de Développement
```powershell
# Voir les logs Tauri
cd frontend
npm run tauri:dev

# Logs dans la console PowerShell
```

#### Outils de Développement
- **DevTools** : F12 dans l'application
- **Console** : Logs JavaScript
- **Network** : Requêtes réseau
- **Elements** : Inspection DOM

### 🔒 Sécurité

#### Mesures de Sécurité
- **CSP** : Content Security Policy
- **Isolation** : Sandboxing des processus
- **Permissions** : Accès limité au système
- **Chiffrement** : Données sensibles chiffrées

#### Conformité
- **RGPD** : Gestion des données personnelles
- **ISO 27001** : Sécurité de l'information
- **Médical** : Standards de santé

### 📊 Monitoring

#### Métriques Application
- **Performance** : Temps de réponse
- **Erreurs** : Logs d'erreurs
- **Utilisation** : Statistiques d'usage
- **Ressources** : CPU, mémoire, disque

#### Intégration Grafana
- **Dashboards** : Métriques en temps réel
- **Alertes** : Notifications automatiques
- **Historique** : Tendances d'utilisation

### 🎯 Utilisation Recommandée

#### Scénarios d'Usage
1. **Gestion quotidienne** : Interface desktop pour les opérateurs
2. **Suivi patients** : Workflows automatisés
3. **Reporting** : Génération de rapports
4. **Configuration** : Paramétrage système

#### Workflow Typique
1. **Ouverture** : Lancer l'application desktop
2. **Authentification** : Connexion sécurisée
3. **Gestion** : Interface de gestion des patients
4. **Suivi** : Monitoring en temps réel
5. **Fermeture** : Sauvegarde automatique

### 🆘 Support et Dépannage

#### Problèmes Courants
1. **Rust non installé** → Exécuter install-prerequisites.ps1
2. **Ports occupés** → Vérifier les services Docker
3. **Erreurs de build** → Nettoyer node_modules et relancer
4. **Permissions** → Exécuter en tant qu'administrateur

#### Commandes Utiles
```powershell
# Nettoyer le cache
cd frontend
npm run clean

# Reconstruire
npm run tauri:build

# Mode développement
npm run tauri:dev
```

### 🎉 Avantages de l'Application Desktop

**HelloJADE Desktop offre :**
- ✅ Performance native optimale
- ✅ Intégration système complète
- ✅ Sécurité renforcée
- ✅ Fonctionnement hors ligne
- ✅ Interface utilisateur moderne
- ✅ Distribution facile

**Votre application HelloJADE v1.0 est maintenant disponible en mode desktop natif ! 🚀** 