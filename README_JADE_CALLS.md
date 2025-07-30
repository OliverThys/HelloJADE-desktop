# Page des Appels HelloJADE

## Vue d'ensemble

La page des appels post-hospitalisation est une interface complète pour gérer et suivre les appels aux patients après leur sortie de l'hôpital. Cette page intègre toutes les fonctionnalités demandées pour un suivi médical efficace.

## Fonctionnalités principales

### 🔍 Bandeau de recherche et filtres
- **Recherche globale** : Recherche par numéro patient, nom, prénom, téléphone
- **Filtres avancés** :
  - Statut d'appel (À appeler, En cours, Appelé, Échec)
  - Service d'hospitalisation
  - Score minimum/maximum
  - Dates d'appel prévu (début/fin)
  - Dates de sortie (début/fin)

### 📊 Tableau des appels
Le tableau affiche toutes les informations demandées :
- **Numéro patient** (triable)
- **Nom et prénom** (triables)
- **Date de naissance**
- **Numéro de téléphone**
- **Site d'hospitalisation**
- **Date de sortie hôpital**
- **Date et heure prévue d'appel** (triable)
- **Statut d'appel** avec badge coloré et nombre de tentatives
- **Médecin référent**
- **Service d'hospitalisation**
- **Date et heure réelle d'appel**
- **Durée d'appel**
- **Score calculé** (triable)
- **Résumé d'appel** (cliquable)
- **Actions** (démarrer appel, modifier, historique, scores)

### 🎯 Statuts d'appel
- **À appeler** (pending) : Appel programmé mais pas encore effectué
- **En cours** (in_progress) : Appel en cours de réalisation
- **Appelé** (called) : Appel terminé avec succès
- **Échec** (failed) : Échec après dépassement du nombre maximum de tentatives

### 📈 Système de scoring
- **Score automatique** : Calculé selon l'algorithme médical
- **Scores détaillés** : Possibilité d'ajouter des scores spécifiques (douleur, moral, traitement, etc.)
- **Poids personnalisable** : Chaque score peut avoir un poids différent
- **Commentaires** : Ajout de notes pour chaque score

### 📋 Modals spécialisées
1. **Modal de résumé** : Affichage détaillé du résumé d'appel avec export PDF
2. **Modal d'édition** : Modification des détails de l'appel
3. **Modal d'historique** : Audit complet des modifications avec détails avant/après
4. **Modal des scores** : Gestion des scores détaillés avec ajout de nouveaux scores

### 📤 Export et rapports
- **Export CSV** : Export des données filtrées
- **Export PDF** : Génération de rapports PDF
- **Export résumé** : Export PDF du résumé d'un appel spécifique

## Configuration système

### Paramètres configurables
- **Nombre maximum de tentatives** : Défini dans les paramètres système
- **Délai d'appel** : Jours après la sortie pour programmer l'appel
- **Seuil d'alerte** : Score en dessous duquel une alerte est générée
- **Durées d'appel** : Durées minimale et maximale

### Tables de base de données
- `calls` : Appels principaux
- `call_history` : Historique des modifications (audit)
- `scores` : Scores détaillés
- `call_metadata` : Métadonnées enrichies
- `system_parameters` : Paramètres de configuration

## Installation et configuration

### 1. Créer les tables PostgreSQL
```bash
cd backend
node setup_calls_tables.js
```

### 2. Vérifier la configuration
Le script vérifie automatiquement :
- Création des tables
- Création des vues
- Création des fonctions
- Configuration des paramètres système

### 3. Démarrer le serveur
```bash
cd backend
npm start
```

### 4. Accéder à la page
Naviguez vers `/calls-enhanced` dans l'application frontend.

## Utilisation

### Filtrage et recherche
1. Utilisez la barre de recherche pour trouver rapidement un patient
2. Appliquez les filtres selon vos besoins
3. Les résultats se mettent à jour automatiquement

### Gestion des appels
1. **Démarrer un appel** : Cliquez sur l'icône téléphone
2. **Modifier un appel** : Cliquez sur l'icône crayon
3. **Voir l'historique** : Cliquez sur l'icône horloge
4. **Gérer les scores** : Cliquez sur l'icône graphique

### Export de données
1. **Export CSV** : Pour analyse dans Excel
2. **Export PDF** : Pour rapports officiels
3. **Export résumé** : Pour un appel spécifique

## Algorithme de scoring

Le score automatique est calculé selon :
- **Durée de l'appel** (0-40 points) : 30 secondes = 1 point
- **Nombre de tentatives** (0-20 points) : Moins de tentatives = plus de points
- **Présence d'un résumé** (0-20 points) : Bonus si résumé disponible
- **Appel réussi** (0-20 points) : Bonus pour un appel terminé

## Sécurité et audit

- **Historique complet** : Toutes les modifications sont tracées
- **Données avant/après** : Comparaison des changements
- **Utilisateur responsable** : Traçabilité des actions
- **Horodatage** : Timestamp de chaque action

## Intégration avec Oracle

La page utilise le système de base de données hybride :
- **Lecture Oracle** : Données hospitalières (patients, hospitalisations)
- **Écriture PostgreSQL** : Données HelloJADE (appels, scores, métadonnées)
- **Synchronisation automatique** : Toutes les 5 minutes

## Support et maintenance

### Logs
Les erreurs et actions importantes sont loggées dans la console du serveur.

### Performance
- Index optimisés sur les colonnes de recherche
- Pagination pour les gros volumes de données
- Requêtes optimisées avec jointures

### Évolutivité
- Architecture modulaire
- API RESTful
- Composants Vue.js réutilisables

## Prochaines améliorations

- [ ] Intégration avec l'IA pour analyse automatique des résumés
- [ ] Notifications en temps réel
- [ ] Tableau de bord avec métriques avancées
- [ ] Intégration avec le système de téléphonie
- [ ] Rapports automatisés par email 