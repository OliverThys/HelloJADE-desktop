# HelloJADE Manager

Plateforme de gestion des appels post-hospitalisation avec intelligence artificielle.

## 🚀 Fonctionnalités

### Page 1 : Connexion
- Authentification par email et mot de passe
- Réinitialisation de mot de passe par email
- Gestion des sessions utilisateur
- Distinction entre utilisateurs Standard et Admin

### Page 2 : Tableau de bord
- KPIs en temps réel (appels prévus, réalisés, réussis, échecs)
- Graphiques d'évolution des appels
- Filtres par période (jour, semaine, mois, trimestre, année)
- Alertes récentes avec navigation directe

### Page 3 : Gestion des appels
- Tableau complet des appels avec toutes les informations
- Filtres avancés (recherche, statut, dates)
- Tri par colonnes
- Résumé d'appel avec conversation simulée
- Export PDF des résumés
- Signalement de problèmes

### Page 4 : Paramètres du compte
- Modification des informations personnelles
- Changement de mot de passe sécurisé
- Accès au support et documentation

### Page 5 : Paramétrage système (Admin uniquement)
- Gestion des utilisateurs (création, modification, suppression)
- Configuration des paramètres d'appels
- Upload de base de connaissances (KB)
- Paramètres système avancés

## 🛠️ Technologies utilisées

- **Frontend** : Vue.js 3 + TypeScript
- **UI Framework** : Tailwind CSS
- **Icons** : Heroicons
- **Charts** : Chart.js
- **State Management** : Pinia
- **Routing** : Vue Router
- **Internationalisation** : Vue I18n
- **Notifications** : Vue Toastification
- **Desktop** : Tauri (Rust)

## 📦 Installation

### Prérequis
- Node.js >= 18.0.0
- npm >= 9.0.0
- Rust (pour Tauri)

### Installation des dépendances
```bash
cd frontend
npm install
```

### Variables d'environnement
Créer un fichier `.env` à la racine du projet frontend :
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_TITLE=HelloJADE Manager
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development
```

## 🚀 Lancement

### Mode développement
```bash
npm run dev
```

### Mode production
```bash
npm run build
npm run preview
```

### Application desktop (Tauri)
```bash
npm run tauri:dev
```

## 🎨 Design System

### Couleurs HelloJADE
- **Vert principal** : #10B981
- **Vert clair** : #34D399
- **Vert foncé** : #059669
- **Bleu** : #1E40AF
- **Gris** : #6B7280

### Composants personnalisés
- `.btn-primary` : Bouton principal vert
- `.btn-secondary` : Bouton secondaire blanc
- `.btn-danger` : Bouton danger rouge
- `.card` : Carte avec ombre et bordure
- `.input-field` : Champ de saisie stylisé
- `.status-badge` : Badge de statut
- `.kpi-card` : Carte KPI

## 📱 Responsive Design

L'application est entièrement responsive et s'adapte à :
- **Desktop** : Interface complète avec sidebar
- **Tablet** : Interface adaptée avec navigation simplifiée
- **Mobile** : Interface mobile-first avec navigation hamburger

## 🔐 Sécurité

- Authentification JWT avec refresh tokens
- Gestion des permissions par rôle
- Validation côté client et serveur
- Protection des routes sensibles
- Gestion sécurisée des mots de passe

## 📊 Performance

### Optimisations
- Lazy loading des composants
- Code splitting automatique
- Optimisation des images
- Cache des données API
- Debounce sur les recherches

### Métriques cibles
- **First Contentful Paint** : < 1.5s
- **Largest Contentful Paint** : < 2.5s
- **Cumulative Layout Shift** : < 0.1
- **First Input Delay** : < 100ms

## 🧪 Tests

```bash
# Vérification des types
npm run type-check

# Linting
npm run lint

# Formatage
npm run format

# Tests (à implémenter)
npm run test
```

## 📈 Monitoring

L'application intègre :
- **Grafana** : Dashboards de monitoring
- **Prometheus** : Métriques système
- **Logs** : Traçabilité complète
- **Alertes** : Notifications automatiques

## 🔧 Configuration avancée

### Personnalisation des thèmes
Modifier `src/assets/tailwind.css` pour changer les couleurs et styles.

### Ajout de nouvelles pages
1. Créer le composant Vue dans `src/views/`
2. Ajouter la route dans `src/router/index.ts`
3. Mettre à jour la navigation si nécessaire

### Intégration API
L'API client est configuré dans `src/utils/api.ts` avec :
- Intercepteurs automatiques
- Gestion des erreurs
- Refresh tokens automatique
- Retry logic

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

- **Email** : support@hellojade.be
- **Téléphone** : +32 2 123 45 67
- **Horaires** : Lun-Ven 9h-17h

## 🏥 Contexte médical

HelloJADE est conçu pour améliorer le suivi post-hospitalisation en :
- Automatisant les appels de suivi
- Détectant précocement les complications
- Réduisant les réhospitalisations évitables
- Améliorant la qualité des soins

L'application respecte les standards de sécurité médicale et la confidentialité des données patients. 