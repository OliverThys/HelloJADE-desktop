# 🚀 Comment Ouvrir HelloJADE v1.0

## 📋 Instructions Simples

### 1. Vérifier que Docker est démarré
- Ouvrez Docker Desktop
- Attendez que l'icône Docker soit verte

### 2. Démarrer les services (si pas déjà fait)
Ouvrez PowerShell en tant qu'administrateur et tapez :
```powershell
cd C:\Users\olive\Documents\HelloJADE\infrastructure
docker-compose -f docker-compose-minimal.yml up -d
```

### 3. Ouvrir les interfaces dans votre navigateur

#### 📊 Grafana (Interface principale)
- **URL** : http://localhost:3000
- **Username** : `admin`
- **Password** : `hellojade123`

#### 📈 Prometheus (Métriques)
- **URL** : http://localhost:9090

#### 🧠 Ollama (IA)
- **URL** : http://localhost:11434

## 🎯 Étapes Rapides

1. **Copiez et collez ces URLs dans votre navigateur :**
   ```
   http://localhost:3000
   http://localhost:9090
   http://localhost:11434
   ```

2. **Connectez-vous à Grafana :**
   - Username: `admin`
   - Password: `hellojade123`

3. **Explorez les interfaces !**

## 🔧 Si les services ne répondent pas

### Vérifier Docker
```powershell
docker ps
```

### Redémarrer les services
```powershell
cd C:\Users\olive\Documents\HelloJADE\infrastructure
docker-compose -f docker-compose-minimal.yml down
docker-compose -f docker-compose-minimal.yml up -d
```

### Vérifier les logs
```powershell
docker-compose -f docker-compose-minimal.yml logs
```

## 🎉 C'est parti !

Une fois connecté à Grafana, vous pourrez :
- Voir les dashboards de monitoring
- Configurer les datasources
- Surveiller les performances
- Gérer les alertes

**Bon développement avec HelloJADE ! 🚀** 