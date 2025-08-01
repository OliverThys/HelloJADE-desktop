# Guide de Configuration HelloJADE

## Vue d'ensemble

Le fichier `config.yml` centralise toute la configuration de l'application HelloJADE. Il remplace les variables d'environnement dispersées et offre une gestion centralisée des paramètres.

## Structure des fichiers

- `config.yml` - Configuration principale (à ne pas commiter)
- `config.example.yml` - Exemple de configuration (à commiter)
- `CONFIGURATION.md` - Ce guide

## Installation

1. **Copier le fichier d'exemple :**
   ```bash
   cp config.example.yml config.yml
   ```

2. **Modifier la configuration :**
   Éditez `config.yml` selon votre environnement

3. **Ajouter au .gitignore :**
   ```bash
   echo "config.yml" >> .gitignore
   ```

## Sections de configuration

### 🔐 Authentification Active Directory

```yaml
authentication:
  active_directory:
    enabled: true
    server: "hellojade.local"
    port: 389
    base_dn: "DC=hellojade,DC=local"
    bind_dn: "CN=Administrator,CN=Users,DC=hellojade,DC=local"
    bind_password: "MotDePasse123!"
    user_search_base: "CN=Users,DC=hellojade,DC=local"
```

**Paramètres importants :**
- `server` : Nom du serveur Active Directory
- `bind_dn` : DN de l'utilisateur de service
- `bind_password` : Mot de passe de l'utilisateur de service
- `user_search_base` : Base de recherche des utilisateurs

### 🗄️ Bases de données

#### PostgreSQL (HelloJADE)
```yaml
databases:
  hellojade:
    type: "postgresql"
    host: "localhost"
    port: 5432
    database: "hellojade"
    username: "postgres"
    password: "password"
```

#### Oracle (Hôpital)
```yaml
databases:
  hospital:
    type: "oracle"
    host: "localhost"
    port: 1521
    service_name: "XE"
    username: "system"
    password: "oracle"
```

### 📊 Monitoring

```yaml
monitoring:
  enabled: true
  interval: 30000  # 30 secondes
  services:
    active_directory:
      enabled: true
      timeout: 5000
    asterisk:
      enabled: false  # À activer plus tard
```

### 🔒 Sécurité

```yaml
security:
  cors:
    enabled: true
    origin: ["http://localhost:3000", "http://localhost:5173"]
  rate_limiting:
    enabled: true
    max_requests: 100
```

### 📧 Email (futur)

```yaml
email:
  enabled: false
  provider: "smtp"
  host: "smtp.gmail.com"
  port: 587
  username: "votre_email@gmail.com"
  password: "votre_mot_de_passe"
```

## Environnements

### Développement
```yaml
app:
  environment: "development"
  debug: true
  port: 8000
```

### Production
```yaml
app:
  environment: "production"
  debug: false
  port: 80
```

## Utilisation dans le code

### Backend Node.js

```javascript
const yaml = require('js-yaml');
const fs = require('fs');

// Charger la configuration
const config = yaml.load(fs.readFileSync('config.yml', 'utf8'));

// Utiliser la configuration
const dbConfig = config.databases.hellojade;
const adConfig = config.authentication.active_directory;
```

### Frontend Vue.js

```javascript
// Dans le store ou composant
import { api } from '@/utils/api';

// La configuration est gérée côté backend
const response = await api.get('/api/config');
const config = response.data;
```

## Variables sensibles

### 🔐 Sécurisation des mots de passe

**Option 1 : Variables d'environnement**
```yaml
authentication:
  active_directory:
    bind_password: "${AD_BIND_PASSWORD}"
```

**Option 2 : Fichier séparé**
```yaml
# config.yml
authentication:
  active_directory:
    bind_password: "!include secrets.yml"
```

```yaml
# secrets.yml (non commité)
ad_bind_password: "MotDePasse123!"
```

### 🔑 JWT Secret

```yaml
jwt:
  secret: "${JWT_SECRET}"  # Variable d'environnement
  secret_key: "${JWT_SECRET_KEY}"
```

## Validation de la configuration

### Script de validation

```bash
# Valider la configuration
node scripts/validate-config.js
```

### Tests de connexion

```bash
# Tester la connexion AD
node test-ldap-connection.js

# Tester la connexion PostgreSQL
node test-postgres-connection.js

# Tester la connexion Oracle
node test-oracle-connection.js
```

## Migration depuis les variables d'environnement

### Ancien système (config.env)
```env
LDAP_SERVER=hellojade.local
LDAP_BIND_DN=CN=Administrator,CN=Users,DC=hellojade,DC=local
LDAP_BIND_PASSWORD=MotDePasse123!
```

### Nouveau système (config.yml)
```yaml
authentication:
  active_directory:
    server: "hellojade.local"
    bind_dn: "CN=Administrator,CN=Users,DC=hellojade,DC=local"
    bind_password: "MotDePasse123!"
```

## Bonnes pratiques

### ✅ À faire
- Utiliser `config.example.yml` comme template
- Ne jamais commiter `config.yml`
- Utiliser des variables d'environnement pour les secrets
- Valider la configuration au démarrage
- Documenter les changements de configuration

### ❌ À éviter
- Commiter des mots de passe en clair
- Modifier `config.example.yml` directement
- Utiliser des chemins absolus
- Ignorer la validation de configuration

## Dépannage

### Problèmes courants

#### 1. Configuration non trouvée
```bash
Error: Cannot find config.yml
```
**Solution :** Copier `config.example.yml` vers `config.yml`

#### 2. Connexion AD échoue
```bash
Error: LDAP bind failed
```
**Solution :** Vérifier les paramètres AD dans la configuration

#### 3. Base de données inaccessible
```bash
Error: Database connection failed
```
**Solution :** Vérifier les paramètres de connexion DB

### Logs de debug

```yaml
logging:
  level: "debug"  # Activer les logs détaillés
```

## Support

Pour toute question sur la configuration :
1. Consulter ce guide
2. Vérifier les exemples dans `config.example.yml`
3. Consulter la documentation des modules utilisés
4. Ouvrir une issue sur GitHub 