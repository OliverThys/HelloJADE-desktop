# HelloJADE v1.0 - Application Desktop

Application desktop SaaS pour la gestion post-hospitalisation avec transcription automatique, analyse IA et tableau de bord patient.

## 🚀 Fonctionnalités

- **Interface moderne** avec Vue.js 3 et Tailwind CSS
- **Application native** avec Tauri (plus rapide qu'Electron)
- **Monitoring complet** avec Grafana et Prometheus
- **Intelligence artificielle** avec Ollama
- **Cache performant** avec Redis
- **Infrastructure Docker** complète

## 📋 Prérequis

- **Windows 10/11** (testé sur Windows 10)
- **Docker Desktop** avec WSL2
- **Node.js** v18+ 
- **Rust** v1.70+
- **Visual Studio Build Tools 2022** avec composants C++

## 🛠️ Installation

### 1. Cloner le repository
```bash
git clone https://github.com/votre-username/hellojade-desktop.git
cd hellojade-desktop
```

### 2. Installer les dépendances
```bash
cd frontend
npm install
```

### 3. Lancer l'application
```bash
# Depuis la racine du projet
.\launch-tauri.ps1
```

## 🎯 Utilisation

### Scripts disponibles

- **`launch-tauri.ps1`** - Lance l'application en mode production
- **`launch-tauri-dev.ps1`** - Lance l'application en mode développement
- **`start-web.ps1`** - Lance uniquement l'interface web

### Interfaces disponibles

- **Application Desktop** : HelloJADE.exe (lancée automatiquement)
- **Grafana** (Monitoring) : http://localhost:3000
  - Username: `admin`
  - Password: `hellojade123`
- **Prometheus** (Métriques) : http://localhost:9090
- **Ollama** (IA) : http://localhost:11434
- **Redis** (Cache) : localhost:6379

## 🏗️ Architecture

```
HelloJADE/
├── frontend/                 # Application Vue.js + Tauri
│   ├── src/                 # Code source Vue.js
│   ├── src-tauri/           # Configuration Tauri/Rust
│   └── package.json
├── backend/                 # API Python (optionnel)
├── infrastructure/          # Configuration Docker
│   ├── docker-compose.yml
│   ├── grafana/
│   ├── prometheus/
│   └── redis/
└── scripts/                 # Scripts d'installation
```

## 🔧 Configuration

### Variables d'environnement
Copiez `env.example` vers `.env` et configurez :
```bash
# Backend API
BACKEND_URL=http://localhost:5000

# Base de données
DATABASE_URL=postgresql://user:pass@localhost:5432/hellojade

# Services externes
OLLAMA_URL=http://localhost:11434
REDIS_URL=redis://localhost:6379
```

### Modèles IA
Installez des modèles dans Ollama :
```bash
# Modèle de transcription
ollama pull whisper

# Modèle d'analyse
ollama pull llama2
```

## 🐛 Dépannage

### Erreur "link.exe not found"
Installez Visual Studio Build Tools 2022 avec les composants C++ :
```bash
winget install Microsoft.VisualStudio.2022.BuildTools --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

### Services Docker non démarrés
```bash
# Redémarrer Docker Desktop
# Puis relancer
.\launch-tauri.ps1
```

### Problème de permissions
Exécutez PowerShell en tant qu'administrateur pour l'installation des outils.

## 📝 Développement

### Mode développement
```bash
.\launch-tauri-dev.ps1
```

### Modifier l'interface
- Code Vue.js : `frontend/src/`
- Styles : `frontend/src/assets/`
- Configuration Tauri : `frontend/src-tauri/tauri.conf.json`

### Construire pour la production
```bash
cd frontend
npm run tauri:build
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 Remerciements

- [Tauri](https://tauri.app/) - Framework pour applications desktop
- [Vue.js](https://vuejs.org/) - Framework JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Docker](https://www.docker.com/) - Conteneurisation
- [Grafana](https://grafana.com/) - Monitoring
- [Ollama](https://ollama.ai/) - Modèles IA locaux

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation dans `docs/`
- Vérifier les logs dans `logs/`

---

**HelloJADE v1.0** - Application de gestion post-hospitalisation moderne et performante. 