const { initialize, executeQuery } = require('./database')

async function createMissingTables() {
  try {
    console.log('🔧 Création des tables manquantes...')
    
    // Initialiser la base de données
    await initialize()
    
    // Créer la table PATIENTS_SYNC manquante
    console.log('📝 Création de la table PATIENTS_SYNC...')
    await executeQuery(`
      CREATE TABLE PATIENTS_SYNC (
        PROJECT_PATIENT_ID NUMBER DEFAULT PROJECT_PATIENT_SEQ.NEXTVAL PRIMARY KEY,
        HOSPITAL_PATIENT_ID NUMBER NOT NULL UNIQUE,
        NUMERO_PATIENT VARCHAR2(20),
        NOM VARCHAR2(100),
        PRENOM VARCHAR2(100),
        DATE_NAISSANCE DATE,
        TELEPHONE VARCHAR2(20),
        DATE_CREATION DATE DEFAULT SYSDATE,
        DATE_MODIFICATION DATE DEFAULT SYSDATE,
        STATUT_SYNC VARCHAR2(20) DEFAULT 'ACTIVE'
      )
    `)
    console.log('✅ Table PATIENTS_SYNC créée')
    
    // Créer les index pour PATIENTS_SYNC
    console.log('📝 Création des index pour PATIENTS_SYNC...')
    await executeQuery('CREATE INDEX idx_patients_sync_hospital_id ON PATIENTS_SYNC(HOSPITAL_PATIENT_ID)')
    await executeQuery('CREATE INDEX idx_patients_sync_number ON PATIENTS_SYNC(NUMERO_PATIENT)')
    await executeQuery('CREATE INDEX idx_patients_sync_name ON PATIENTS_SYNC(NOM, PRENOM)')
    console.log('✅ Index pour PATIENTS_SYNC créés')
    
    // Ajouter les contraintes de clés étrangères
    console.log('📝 Ajout des contraintes de clés étrangères...')
    await executeQuery(`
      ALTER TABLE HOSPITALISATIONS_SYNC ADD CONSTRAINT fk_hosp_patient 
      FOREIGN KEY (PROJECT_PATIENT_ID) REFERENCES PATIENTS_SYNC(PROJECT_PATIENT_ID)
    `)
    await executeQuery(`
      ALTER TABLE CALLS ADD CONSTRAINT fk_calls_patient 
      FOREIGN KEY (PROJECT_PATIENT_ID) REFERENCES PATIENTS_SYNC(PROJECT_PATIENT_ID)
    `)
    await executeQuery(`
      ALTER TABLE CALLS ADD CONSTRAINT fk_calls_hospitalisation 
      FOREIGN KEY (PROJECT_HOSPITALISATION_ID) REFERENCES HOSPITALISATIONS_SYNC(PROJECT_HOSPITALISATION_ID)
    `)
    await executeQuery(`
      ALTER TABLE CALL_HISTORY ADD CONSTRAINT fk_history_call 
      FOREIGN KEY (PROJECT_CALL_ID) REFERENCES CALLS(PROJECT_CALL_ID)
    `)
    await executeQuery(`
      ALTER TABLE SCORES ADD CONSTRAINT fk_scores_call 
      FOREIGN KEY (PROJECT_CALL_ID) REFERENCES CALLS(PROJECT_CALL_ID)
    `)
    await executeQuery(`
      ALTER TABLE CALL_METADATA ADD CONSTRAINT fk_metadata_call 
      FOREIGN KEY (PROJECT_CALL_ID) REFERENCES CALLS(PROJECT_CALL_ID)
    `)
    await executeQuery(`
      ALTER TABLE CALL_METADATA ADD CONSTRAINT uk_metadata_call_key 
      UNIQUE (PROJECT_CALL_ID, CLE_METADONNEE)
    `)
    console.log('✅ Contraintes de clés étrangères ajoutées')
    
    // Ajouter les contraintes de vérification
    console.log('📝 Ajout des contraintes de vérification...')
    await executeQuery(`
      ALTER TABLE CALLS ADD CONSTRAINT ck_calls_statut 
      CHECK (STATUT IN ('pending', 'called', 'failed', 'in_progress'))
    `)
    await executeQuery(`
      ALTER TABLE CALLS ADD CONSTRAINT ck_calls_score 
      CHECK (SCORE IS NULL OR (SCORE >= 0 AND SCORE <= 100))
    `)
    await executeQuery(`
      ALTER TABLE CALLS ADD CONSTRAINT ck_calls_duree 
      CHECK (DUREE >= 0)
    `)
    await executeQuery(`
      ALTER TABLE CALLS ADD CONSTRAINT ck_calls_tentatives 
      CHECK (NOMBRE_TENTATIVES >= 0)
    `)
    console.log('✅ Contraintes de vérification ajoutées')
    
    // Créer les vues
    console.log('📝 Création des vues...')
    await executeQuery(`
      CREATE OR REPLACE VIEW V_APPELS_EN_COURS AS
      SELECT 
          c.PROJECT_CALL_ID,
          p.NUMERO_PATIENT,
          p.NOM,
          p.PRENOM,
          p.TELEPHONE,
          h.SERVICE,
          h.MEDECIN,
          h.DATE_SORTIE,
          c.DATE_APPEL_PREVU,
          c.STATUT,
          c.NOMBRE_TENTATIVES
      FROM CALLS c
      JOIN PATIENTS_SYNC p ON c.PROJECT_PATIENT_ID = p.PROJECT_PATIENT_ID
      LEFT JOIN HOSPITALISATIONS_SYNC h ON c.PROJECT_HOSPITALISATION_ID = h.PROJECT_HOSPITALISATION_ID
      WHERE c.STATUT = 'pending'
      ORDER BY c.DATE_APPEL_PREVU
    `)
    
    await executeQuery(`
      CREATE OR REPLACE VIEW V_STATISTIQUES_APPELS AS
      SELECT 
          STATUT,
          COUNT(*) as NOMBRE_APPELS,
          AVG(DUREE) as DUREE_MOYENNE,
          AVG(SCORE) as SCORE_MOYEN,
          MIN(DATE_CREATION) as PREMIER_APPEL,
          MAX(DATE_CREATION) as DERNIER_APPEL
      FROM CALLS
      GROUP BY STATUT
    `)
    console.log('✅ Vues créées')
    
    // Ajouter les commentaires
    console.log('📝 Ajout des commentaires...')
    await executeQuery("COMMENT ON TABLE PATIENTS_SYNC IS 'Copie synchronisée des patients de la base hospitalière'")
    await executeQuery("COMMENT ON TABLE HOSPITALISATIONS_SYNC IS 'Copie synchronisée des hospitalisations de la base hospitalière'")
    await executeQuery("COMMENT ON TABLE CALLS IS 'Appels post-hospitalisation gérés par HelloJADE'")
    await executeQuery("COMMENT ON TABLE CALL_HISTORY IS 'Historique des modifications d''appels pour audit'")
    await executeQuery("COMMENT ON TABLE SCORES IS 'Scores détaillés calculés par l''algorithme médical'")
    await executeQuery("COMMENT ON TABLE CALL_METADATA IS 'Métadonnées enrichies des appels'")
    console.log('✅ Commentaires ajoutés')
    
    console.log('🎉 Toutes les tables manquantes ont été créées avec succès !')
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables manquantes:', error)
    throw error
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  createMissingTables()
    .then(() => {
      console.log('✅ Script terminé avec succès')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erreur:', error)
      process.exit(1)
    })
}

module.exports = { createMissingTables } 