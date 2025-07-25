# HelloJADE v1.0 - Guide Installation Rust

## 🦀 Installation de Rust pour l'Application Desktop

### ❌ Problème Identifié
Vous n'avez pas les privilèges administrateur nécessaires pour installer Rust automatiquement.

### ✅ Solution : Installation Manuelle

#### Option 1 : Installation avec Privilèges Administrateur (Recommandé)

1. **Ouvrir PowerShell en tant qu'Administrateur**
   - Clic droit sur PowerShell
   - "Exécuter en tant qu'administrateur"

2. **Naviguer vers le dossier HelloJADE**
   ```powershell
   cd C:\Users\olive\Documents\HelloJADE
   ```

3. **Exécuter le script d'installation**
   ```powershell
   .\scripts\install-prerequisites.ps1
   ```

#### Option 2 : Installation Manuelle Directe

1. **Télécharger Rust**
   - Aller sur https://rustup.rs/
   - Cliquer sur "DOWNLOAD RUSTUP-INIT.EXE (64-BIT)"

2. **Installer Rust**
   - Exécuter le fichier `rustup-init.exe` téléchargé
   - Choisir l'option 1 (installation par défaut)
   - Attendre la fin de l'installation

3. **Redémarrer PowerShell**
   - Fermer et rouvrir PowerShell
   - Vérifier l'installation : `rustc --version`

### 🎯 Après l'Installation de Rust

Une fois Rust installé, vous pourrez lancer l'application desktop :

```powershell
# Vérifier que Rust est installé
rustc --version

# Lancer l'application desktop
.\launch-tauri.ps1
```

### 🌐 Alternative : Utiliser l'Application Web

En attendant l'installation de Rust, vous pouvez utiliser l'application web :

```powershell
# Démarrer l'application web
.\start-web.ps1

# Ou démarrer manuellement le frontend
cd frontend
npm run dev
# Puis ouvrir http://localhost:5173
```

### 📊 Services Disponibles Immédiatement

Même sans Rust, vous avez accès à :

- **Grafana (Monitoring)** : http://localhost:3000
  - Username: `admin`
  - Password: `hellojade123`

- **Prometheus (Métriques)** : http://localhost:9090

- **Ollama (IA)** : http://localhost:11434

### 🔧 Dépannage

#### Problème : "rustc n'est pas reconnu"
**Solution :**
1. Redémarrer PowerShell après installation
2. Vérifier que Rust est dans le PATH
3. Réinstaller avec `rustup-init.exe`

#### Problème : Erreurs de permissions
**Solution :**
1. Exécuter PowerShell en tant qu'administrateur
2. Ou utiliser l'installation manuelle depuis https://rustup.rs/

### 🎉 Résumé

**Pour utiliser HelloJADE Desktop :**
1. Installer Rust (voir options ci-dessus)
2. Lancer : `.\launch-tauri.ps1`

**Pour utiliser HelloJADE Web :**
1. Lancer : `.\start-web.ps1`
2. Accéder : http://localhost:5173

**Votre application HelloJADE v1.0 est prête ! 🚀** 