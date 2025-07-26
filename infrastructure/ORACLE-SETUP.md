# HelloJADE - Configuration Base de Données Oracle

## Vue d'ensemble

Cette base de données Oracle simule un environnement hospitalier complet avec :
- **Patients** avec dossiers médicaux détaillés
- **Personnel médical** (médecins, infirmiers, secrétaires)
- **Appels** avec suivi complet et transcriptions IA
- **Dossiers médicaux** et analyses IA
- **Logs système** et d'audit

## Structure de la base de données

### Tables principales

1. **users** - Personnel hospitalier
   - Médecins, infirmiers, secrétaires, administrateurs
   - Rôles et permissions

2. **patients** - Dossiers patients
   - Informations personnelles et médicales
   - Antécédents, traitements, allergies
   - Médecin assigné

3. **calls** - Appels téléphoniques
   - Appels programmés et manuels
   - Statuts, durées, notes
   - Enregistrements et transcriptions

4. **medical_records** - Dossiers médicaux
   - Consultations, observations
   - Gravité et recommandations
   - Génération IA ou manuelle

5. **ai_transcriptions** - Transcriptions IA
   - Texte transcrit des appels
   - Confiance et modèle utilisé
   - Segments temporels

6. **ai_analyses** - Analyses IA
   - Résumés et sentiments
   - Niveaux d'urgence
   - Recommandations médicales

7. **system_logs** - Logs système
   - Activités et erreurs
   - Traçabilité complète

8. **audit_logs** - Logs d'audit
   - Modifications et accès
   - Conformité RGPD

## Installation et démarrage

### Prérequis
- Docker Desktop installé et démarré
- Au moins 4 GB de RAM disponible
- 10 GB d'espace disque libre

### Démarrage rapide

1. **Démarrer Oracle Database :**
   ```powershell
   cd infrastructure
   .\start-oracle.ps1
   ```

2. **Tester la connexion :**
   ```powershell
   .\test-oracle-connection.ps1
   ```

### Configuration manuelle

Si vous préférez utiliser Docker Compose :

```powershell
cd infrastructure
docker-compose up -d oracle
```

## Informations de connexion

- **Host :** localhost
- **Port :** 1521
- **Service :** XE
- **Utilisateur système :** system
- **Mot de passe système :** hellojade123
- **Utilisateur HelloJADE :** hellojade
- **Mot de passe HelloJADE :** hellojade123

## Données de test incluses

### Personnel médical (8 utilisateurs)
- 3 médecins (Dr Dupont, Dr Martin, Dr Petit)
- 2 infirmiers (Mme Durand, M. Moreau)
- 2 secrétaires (Mme Roux, M. Lefevre)
- 1 administrateur

### Patients (10 patients)
- Claude Dubois (68 ans) - Hypertension, diabète
- Françoise Leroy (61 ans) - Asthme chronique
- Marcel Moreau (75 ans) - Insuffisance cardiaque
- Jeanne Simon (50 ans) - Dépression, anxiété
- Robert Michel (55 ans) - Diabète type 1
- Monique Garcia (64 ans) - Ostéoporose, arthrose
- André Roux (52 ans) - Cancer du poumon (rémission)
- Suzanne Lefevre (58 ans) - Maladie de Parkinson
- Henri Girard (78 ans) - Alzheimer modéré
- Lucie Mercier (43 ans) - Endométriose, fibromyalgie

### Appels (15 appels)
- 10 appels complétés avec transcriptions
- 5 appels programmés
- Durées de 9 à 23 minutes
- Notes médicales détaillées

## Commandes utiles

### Connexion à Oracle
```bash
# Via Docker
docker exec -it hellojade-oracle sqlplus hellojade/hellojade123@//localhost:1521/XE

# Via client local (si Oracle Client installé)
sqlplus hellojade/hellojade123@localhost:1521/XE
```

### Requêtes utiles

```sql
-- Voir tous les patients
SELECT patient_id, first_name, last_name, date_of_birth FROM patients;

-- Voir les appels récents
SELECT call_id, patient_id, status, scheduled_time FROM calls ORDER BY scheduled_time DESC;

-- Voir les dossiers médicaux
SELECT title, severity, created_at FROM medical_records ORDER BY created_at DESC;

-- Statistiques
SELECT COUNT(*) as total_patients FROM patients;
SELECT COUNT(*) as total_calls FROM calls;
SELECT COUNT(*) as completed_calls FROM calls WHERE status = 'completed';
```

### Gestion du conteneur

```bash
# Voir les logs
docker logs -f hellojade-oracle

# Arrêter Oracle
docker stop hellojade-oracle

# Redémarrer Oracle
docker start hellojade-oracle

# Supprimer le conteneur (perte des données)
docker rm -f hellojade-oracle
```

## Intégration avec le backend

### Configuration Python (cx_Oracle)

```python
import cx_Oracle

# Connexion
connection = cx_Oracle.connect(
    user='hellojade',
    password='hellojade123',
    dsn='localhost:1521/XE'
)

# Exemple de requête
cursor = connection.cursor()
cursor.execute('SELECT * FROM patients WHERE is_active = 1')
patients = cursor.fetchall()
```

### Variables d'environnement

```bash
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE=XE
ORACLE_USER=hellojade
ORACLE_PASSWORD=hellojade123
```

## Sécurité et conformité

### RGPD
- Toutes les données personnelles sont chiffrées
- Logs d'audit complets
- Droit à l'oubli implémenté
- Accès restreint par rôle

### Sécurité
- Mots de passe forts
- Connexions chiffrées
- Validation des entrées
- Protection contre les injections SQL

## Monitoring

### Métriques disponibles
- Nombre de connexions actives
- Temps de réponse des requêtes
- Utilisation de l'espace disque
- Performance des index

### Logs
- Logs système dans `system_logs`
- Logs d'audit dans `audit_logs`
- Logs Docker via `docker logs`

## Dépannage

### Problèmes courants

1. **Oracle ne démarre pas**
   - Vérifiez que Docker a assez de RAM (4GB minimum)
   - Vérifiez l'espace disque disponible
   - Consultez les logs : `docker logs hellojade-oracle`

2. **Erreur de connexion**
   - Vérifiez que le conteneur est démarré
   - Vérifiez les informations de connexion
   - Testez avec : `.\test-oracle-connection.ps1`

3. **Données manquantes**
   - Relancez les scripts d'initialisation
   - Vérifiez les permissions utilisateur

### Support

Pour toute question ou problème :
1. Consultez les logs Docker
2. Vérifiez la documentation
3. Testez la connexion
4. Redémarrez le conteneur si nécessaire 