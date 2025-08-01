# Guide de résolution des problèmes - HelloJADE

## Problème : Contenu qui disparaît lors de l'actualisation

### Symptômes
- Le contenu des pages disparaît après actualisation (F5)
- Les données réapparaissent parfois après plusieurs actualisations
- L'application semble "oublier" l'état utilisateur

### Causes identifiées et solutions

#### 1. Gestion d'état non persistante ✅ RÉSOLU
**Problème** : Les stores Pinia ne persistaient pas les données entre les actualisations.

**Solution** : 
- Ajout de persistance automatique dans localStorage
- Cache avec durée de validité (5 minutes)
- Restauration automatique au démarrage

#### 2. Authentification fragile ✅ RÉSOLU
**Problème** : La vérification d'authentification échouait lors de l'actualisation.

**Solution** :
- Vérification robuste des tokens
- Fallback sur les données locales en cas d'erreur réseau
- Refresh automatique des tokens expirés

#### 3. Chargement asynchrone non géré ✅ RÉSOLU
**Problème** : Les données n'étaient pas rechargées automatiquement.

**Solution** :
- Initialisation automatique des stores
- Indicateurs de chargement
- Gestion d'erreur avec retry

### Vérifications à effectuer

#### 1. Vérifier le localStorage
```javascript
// Dans la console du navigateur
console.log('Auth token:', localStorage.getItem('access_token'))
console.log('Patients cache:', localStorage.getItem('patients_data'))
console.log('Calls cache:', localStorage.getItem('calls_data'))
```

#### 2. Vérifier les logs de l'application
- Ouvrir les outils de développement (F12)
- Aller dans l'onglet Console
- Rechercher les messages avec les emojis : 🔐, 📦, 🔄, ✅, ❌

#### 3. Vérifier la connexion API
```javascript
// Tester la connexion API
fetch('http://localhost:8000/api/auth/verify')
  .then(response => console.log('API Status:', response.status))
  .catch(error => console.error('API Error:', error))
```

### Actions de dépannage

#### 1. Vider le cache
```javascript
// Dans la console du navigateur
localStorage.clear()
sessionStorage.clear()
location.reload()
```

#### 2. Forcer le rechargement des données
- Cliquer sur le bouton "Actualiser" dans les vues
- Ou utiliser la console : `window.location.reload()`

#### 3. Vérifier l'état des stores
```javascript
// Dans la console du navigateur
import { usePatientsStore, useCallsStore } from '@/stores'
const patientsStore = usePatientsStore()
const callsStore = useCallsStore()

console.log('Patients:', patientsStore.patients)
console.log('Calls:', callsStore.calls)
console.log('Loading states:', { patients: patientsStore.isLoading, calls: callsStore.isLoading })
```

### Prévention

#### 1. Bonnes pratiques
- Toujours utiliser les stores pour la gestion d'état
- Éviter de stocker des données sensibles dans localStorage
- Tester régulièrement la persistance

#### 2. Monitoring
- Surveiller les erreurs dans la console
- Vérifier la taille du localStorage
- Tester les scénarios d'actualisation

#### 3. Maintenance
- Nettoyer régulièrement le cache expiré
- Mettre à jour les durées de cache si nécessaire
- Tester la récupération après perte de connexion

### Contact
En cas de problème persistant, vérifiez :
1. La version du navigateur (Chrome/Firefox/Safari récent)
2. Les extensions qui pourraient interférer
3. Les paramètres de confidentialité du navigateur
4. La connexion réseau et l'accessibilité de l'API 