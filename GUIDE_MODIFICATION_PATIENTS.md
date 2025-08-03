# Guide d'utilisation - Modification des Patients

## Fonctionnalité implémentée

La fonctionnalité de modification des patients est maintenant entièrement opérationnelle. Voici comment l'utiliser :

## Comment modifier un patient

### 1. Accéder à la liste des patients
- Allez sur la page `http://localhost:5173/patients`
- Vous verrez la liste de tous les patients avec leurs informations

### 2. Cliquer sur le bouton modifier
- Dans la dernière colonne de chaque ligne patient, vous verrez deux icônes :
  - 👁️ **Œil** : Pour voir les détails du patient
  - ✏️ **Crayon** : Pour modifier le patient
- Cliquez sur l'icône **crayon** pour ouvrir le modal de modification

### 3. Modifier les informations
Le modal de modification contient deux sections :

#### **Informations Personnelles**
- **Nom** (obligatoire)
- **Prénom** (obligatoire)
- **Date de naissance** (obligatoire)
- **Numéro de sécurité sociale**

#### **Contact**
- **Téléphone**
- **Email**
- **Adresse**

### 4. Sauvegarder les modifications
- Cliquez sur le bouton **"Enregistrer"** pour sauvegarder les modifications
- Ou cliquez sur **"Annuler"** pour fermer sans sauvegarder

## Fonctionnalités techniques

### Backend
- **Route API** : `PUT /api/patients/:id`
- **Base de données** : Mise à jour dans la table `patients_sync`
- **Validation** : Vérification de l'existence du patient avant modification
- **Timestamp** : Mise à jour automatique du `sync_timestamp`

### Frontend
- **Store Pinia** : Méthode `updatePatient()` dans `usePatientsStore`
- **Composant** : `PatientEditModal.vue` pour l'interface
- **Validation** : Champs obligatoires et formatage des données
- **Feedback** : Notifications de succès/erreur

## Test de la fonctionnalité

Pour tester que tout fonctionne correctement :

1. **Démarrer le backend** :
   ```bash
   cd backend
   npm start
   ```

2. **Démarrer le frontend** :
   ```bash
   cd frontend
   npm run dev
   ```

3. **Tester l'API** (optionnel) :
   ```bash
   node test-patient-update.js
   ```

4. **Utiliser l'interface** :
   - Aller sur `http://localhost:5173/patients`
   - Cliquer sur l'icône crayon d'un patient
   - Modifier quelques informations
   - Sauvegarder

## Gestion des erreurs

- **Patient non trouvé** : Message d'erreur 404
- **Erreur de base de données** : Message d'erreur 500
- **Erreur de validation** : Affichage des erreurs dans l'interface
- **Erreur réseau** : Notification à l'utilisateur

## Sécurité

- **Validation côté serveur** : Toutes les données sont validées
- **Protection SQL** : Utilisation de requêtes préparées
- **Gestion des erreurs** : Messages d'erreur appropriés sans exposition de données sensibles

## Notes importantes

- Les modifications sont immédiatement visibles dans la liste
- L'âge est recalculé automatiquement après modification de la date de naissance
- Le timestamp de synchronisation est mis à jour automatiquement
- Les champs vides sont gérés comme `null` en base de données 