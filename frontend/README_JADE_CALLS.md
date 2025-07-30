# Système d'Appels JADE - HelloJADE

## Vue d'ensemble

Le système d'appels JADE (Just Automated Dialogue Engine) est une solution complète de gestion des appels post-hospitalisation avec dialogue intelligent. Il utilise une architecture JSON pour le stockage local et intègre un assistant vocal intelligent pour le suivi des patients.

## Architecture

### Structure des données

```
HelloJADE-data/
├── calls/
│   ├── 2025/
│   │   ├── 01/
│   │   │   ├── 30/
│   │   │   │   ├── call_12345_20250130_143022.json
│   │   │   │   └── call_12346_20250130_145512.json
│   │   └── index.json (index mensuel pour recherche rapide)
├── call-summaries/
│   └── [même structure avec résumés détaillés]
├── call-recordings/
│   └── [fichiers audio .wav]
├── issues/
│   └── reported_issues_2025.json
└── config/
    └── call_parameters.json
```

### Format JSON des appels

```json
{
  "call_id": "12345",
  "timestamp": "2025-01-30T14:30:22",
  "patient": {
    "id": "P123456",
    "nom": "DUPONT",
    "prenom": "Marie",
    "date_naissance": "1970-03-15",
    "telephone": "+33612345678"
  },
  "hospital_data": {
    "site": "Hôpital Saint-Louis",
    "date_sortie": "2025-01-25",
    "medecin": "Dr Martin",
    "service": "Cardiologie"
  },
  "call_data": {
    "date_prevue": "2025-01-30T14:00:00",
    "date_reelle": "2025-01-30T14:30:22",
    "duree_secondes": 185,
    "statut": "complete",
    "tentatives": 1
  },
  "dialogue_result": {
    "patient_confirme": true,
    "identite_verifiee": true,
    "douleur_niveau": 3,
    "douleur_localisation": "poitrine légère",
    "traitement_suivi": true,
    "transit_normal": true,
    "probleme_transit": null,
    "moral_niveau": 7,
    "moral_details": null,
    "fievre": false,
    "temperature": null,
    "autres_plaintes": "fatigue le soir"
  },
  "score": 85,
  "recording_path": "call-recordings/2025/01/30/call_12345.wav",
  "transcription": "...",
  "analysis": {
    "urgency_level": "low",
    "risk_factors": ["Fatigue persistante"],
    "recommendations": ["Surveiller la fatigue"],
    "follow_up_needed": false,
    "follow_up_priority": "low"
  }
}
```

## Dialogue JADE

### Script de dialogue

1. **Introduction**
   - Présentation de JADE
   - Confirmation de l'identité du patient

2. **Vérification d'identité**
   - Demande de la date de naissance

3. **Questions structurées**
   - Niveau de douleur (0-10)
   - Suivi du traitement
   - Transit intestinal
   - Niveau moral (0-10)
   - Présence de fièvre
   - Autres plaintes

4. **Clôture**
   - Remerciements
   - Information sur le suivi

### Validation des réponses

- **Nombres** : Validation des échelles (0-10)
- **Booléens** : Reconnaissance de "oui/non" et variantes
- **Dates** : Format JJ/MM/AAAA
- **Températures** : Format XX.X°C
- **Texte libre** : Limitation de longueur

## Fonctionnalités

### Page principale (`CallsEnhancedView.vue`)

- **Statistiques en temps réel** : Total, terminés, en attente, échecs
- **Filtres avancés** : Recherche, statut, site, service, médecin, score
- **Tableau interactif** : Sélection multiple, pagination, tri
- **Actions rapides** : Démarrer appel, voir détails, signaler problème

### Modal de dialogue (`CallDialogueModal.vue`)

- **Interface de simulation** : Test du dialogue JADE
- **Réponses rapides** : Boutons pour tests
- **Progression en temps réel** : Barre de progression
- **Résultats partiels** : Affichage des réponses collectées

### Modal de détails (`CallDetailsModal.vue`)

- **Informations complètes** : Patient, hospitalisation, appel
- **Résultats du dialogue** : Toutes les réponses structurées
- **Analyse IA** : Score, urgence, recommandations
- **Enregistrement audio** : Lecture des appels
- **Transcription** : Texte complet du dialogue

### Modal de résumé (`CallSummaryModal.vue`)

- **Synthèse visuelle** : Points clés mis en évidence
- **Analyse de l'IA** : Niveau d'urgence, facteurs de risque
- **Actions recommandées** : Suggestions automatiques
- **Export PDF** : Génération de rapports

### Signalement de problèmes (`IssueReportModal.vue`)

- **Types de problèmes** : Technique, médical, communication
- **Niveaux de gravité** : Faible, moyenne, haute, critique
- **Suivi automatisé** : Contact pour retour

## Services

### JSONStorageService

Gestion du stockage local avec :
- Indexation mensuelle pour performances
- Cache mémoire pour accès rapide
- Export CSV/JSON
- Statistiques calculées

### JadeDialogueService

Gestion du dialogue intelligent avec :
- Configuration flexible des étapes
- Validation des réponses
- Intégration Rasa
- Calcul automatique des scores

### Store Pinia (`callsEnhanced.ts`)

Gestion d'état centralisée avec :
- Filtrage et pagination
- Actions CRUD
- Synchronisation temps réel
- Gestion des erreurs

## Installation et configuration

### Prérequis

- Vue.js 3 + TypeScript
- Tauri (pour l'accès aux fichiers)
- Rasa (pour le dialogue intelligent)
- Whisper (pour la transcription)
- Ollama (pour l'analyse IA)

### Configuration

1. **Paramètres d'appel** (`config/call_parameters.json`)
```json
{
  "retry_attempts": 3,
  "call_timeout": 180,
  "default_call_time": "14:00",
  "max_daily_calls": 100
}
```

2. **Configuration Rasa** (endpoint par défaut : `http://localhost:5005`)

3. **Configuration Whisper** (auto-hébergé via Docker)

### Utilisation

1. **Accès à la page** : `/calls-enhanced`
2. **Chargement des données** : Automatique au montage
3. **Filtrage** : Interface intuitive avec recherche en temps réel
4. **Démarrage d'appel** : Bouton "Démarrer l'appel" sur les appels en attente
5. **Simulation** : Interface de test dans la modal de dialogue

## Avantages de l'architecture JSON

- **Déploiement simple** : Copier/coller du dossier
- **Pas de base de données** : Stockage local uniquement
- **Backup facile** : Compression du dossier
- **Lecture humaine** : Fichiers JSON lisibles
- **Versioning** : Contrôle Git simple
- **Performance** : Indexation pour recherche rapide
- **Offline** : Fonctionnement complet sans réseau

## Sécurité et conformité

- **Données locales** : Aucune transmission externe
- **Chiffrement** : Optionnel pour les données sensibles
- **Audit trail** : Historique complet des actions
- **RGPD** : Conformité avec le droit à l'effacement

## Évolutions futures

- **Intégration Asterisk** : Appels automatiques
- **Analyse prédictive** : Détection précoce des risques
- **Interface mobile** : Application dédiée
- **API REST** : Synchronisation multi-sites
- **Machine Learning** : Amélioration continue du dialogue

## Support et maintenance

- **Logs détaillés** : Traçabilité complète
- **Monitoring** : Métriques de performance
- **Sauvegarde automatique** : Protection des données
- **Mise à jour** : Processus automatisé

---

*Système développé pour HelloJADE - Assistant vocal intelligent pour le suivi post-hospitalisation* 