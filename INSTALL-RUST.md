# HelloJADE v1.0 - Installation Rust pour Application Desktop

## 🦀 Installation de Rust pour Tauri

Pour utiliser l'application desktop HelloJADE, vous devez installer Rust qui est requis par Tauri.

### 🚀 Installation Automatique (Recommandé)

#### 1. Ouvrir PowerShell en tant qu'Administrateur
- Clic droit sur PowerShell
- "Exécuter en tant qu'administrateur"

#### 2. Exécuter le script d'installation
```powershell
# Naviguer vers le dossier HelloJADE
cd C:\Users\olive\Documents\HelloJADE

# Exécuter le script d'installation
.\scripts\install-prerequisites.ps1
```

**Ce script installera automatiquement :**
- Python 3.11
- Rust (pour Tauri)
- Dépendances Python
- Dépendances Node.js

### 🔧 Installation Manuelle de Rust

Si l'installation automatique ne fonctionne pas :

#### 1. Télécharger Rust
- Aller sur https://rustup.rs/
- Télécharger et exécuter `rustup-init.exe`

#### 2. Suivre l'assistant d'installation
- Choisir l'option 1 (installation par défaut)
- Attendre la fin de l'installation

#### 3. Redémarrer PowerShell
- Fermer et rouvrir PowerShell
- Vérifier l'installation : `rustc --version`

### ✅ Vérification de l'Installation

Après l'installation, vérifiez que Rust est installé :

```powershell
# Vérifier Rust
rustc --version

# Vérifier Cargo
cargo --version

# Vérifier que Tauri CLI est installé
npm list -g @tauri-apps/cli
```

### 🖥️ Lancement de l'Application Desktop

Une fois Rust installé, vous pouvez lancer l'application desktop :

#### Mode Production (Application Native)
```powershell
.\launch-tauri.ps1
```
- Construit l'application native (.exe)
- Lance l'application desktop
- Performance optimale

#### Mode Développement (Hot Reload)
```powershell
.\launch-tauri-dev.ps1
```
- Mode développement avec hot reload
- Rechargement automatique des modifications

### 🎯 Utilisation Immédiate (Sans Rust)

Si vous ne voulez pas installer Rust pour le moment, utilisez l'application web :

#### Application Web
```powershell
.\start-web.ps1
```
- Interface web moderne
- Accès via http://localhost:5173
- Toutes les fonctionnalités disponibles

### 📊 Comparaison des Modes

| Mode | Avantages | Inconvénients | Recommandé pour |
|------|-----------|---------------|-----------------|
| **Web** | ✅ Rapide à démarrer<br>✅ Pas d'installation<br>✅ Compatible tous navigateurs | ❌ Dépend du navigateur<br>❌ Performance limitée | Test rapide, développement |
| **Desktop** | ✅ Performance native<br>✅ Intégration système<br>✅ Fonctionnement hors ligne | ❌ Installation Rust requise<br>❌ Build plus long | Production, utilisation quotidienne |

### 🔧 Dépannage

#### Problème : "rustc n'est pas reconnu"
**Solution :**
1. Redémarrer PowerShell après installation
2. Vérifier que Rust est dans le PATH
3. Réinstaller avec `rustup-init.exe`

#### Problème : Erreur de build Tauri
**Solution :**
```powershell
# Nettoyer le cache
cd frontend
npm run clean

# Réinstaller les dépendances
npm install

# Reconstruire
npm run tauri:build
```

#### Problème : Ports occupés
**Solution :**
```powershell
# Vérifier les processus
netstat -ano | findstr :5173

# Arrêter les processus Node.js
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
```

### 🎉 Résumé

**Pour utiliser HelloJADE :**

1. **Application Web (Recommandé pour commencer)**
   ```powershell
   .\start-web.ps1
   ```
   Accès : http://localhost:5173

2. **Application Desktop (Après installation Rust)**
   ```powershell
   .\launch-tauri.ps1
   ```
   Application native : HelloJADE.exe

### 📚 Documentation Complète

- `GUIDE-TAURI.md` - Guide complet application desktop
- `RESUME-FINAL.md` - Résumé de tous les modes
- `docs/configuration-production.md` - Configuration détaillée

**Votre application HelloJADE v1.0 est prête à être utilisée ! 🚀** 