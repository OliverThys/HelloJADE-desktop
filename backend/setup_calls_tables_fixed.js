const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Configuration PostgreSQL
const postgresConfig = {
  host: 'localhost',
  port: 5432,
  database: 'hellojade',
  user: 'hellojade_user',
  password: 'hellojade_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}

async function setupCallsTablesFixed() {
  const pool = new Pool(postgresConfig)
  
  try {
    console.log('🔄 Configuration des tables d\'appels HelloJADE (version corrigée)...')
    
    // Étape 1: Supprimer les vues existantes d'abord
    console.log('🗑️ Suppression des vues existantes...')
    await pool.query('DROP VIEW IF EXISTS v_appels_en_cours CASCADE')
    await pool.query('DROP VIEW IF EXISTS v_statistiques_appels CASCADE')
    
    // Étape 2: Supprimer les triggers existants
    console.log('🔔 Suppression des triggers existants...')
    await pool.query('DROP TRIGGER IF EXISTS trigger_audit_calls ON calls')
    
    // Étape 3: Supprimer les fonctions existantes
    console.log('⚙️ Suppression des fonctions existantes...')
    await pool.query('DROP FUNCTION IF EXISTS marquer_appel_echec(INTEGER, INTEGER) CASCADE')
    await pool.query('DROP FUNCTION IF EXISTS calculer_score_appel(INTEGER) CASCADE')
    await pool.query('DROP FUNCTION IF EXISTS audit_call_changes() CASCADE')
    
    // Étape 4: Créer les tables (elles existent déjà, mais on s'assure qu'elles sont à jour)
    console.log('📊 Création/mise à jour des tables...')
    
    // Table calls
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calls (
        project_call_id SERIAL PRIMARY KEY,
        project_patient_id INTEGER NOT NULL,
        project_hospitalisation_id INTEGER,
        statut VARCHAR(20) DEFAULT 'pending' NOT NULL,
        date_appel_prevue TIMESTAMP,
        date_appel_reelle TIMESTAMP,
        duree_secondes INTEGER DEFAULT 0,
        score INTEGER DEFAULT NULL,
        resume_appel TEXT,
        dialogue_result JSONB,
        recording_path VARCHAR(500),
        nombre_tentatives INTEGER DEFAULT 0,
        derniere_tentative TIMESTAMP,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        utilisateur_creation VARCHAR(50),
        utilisateur_modification VARCHAR(50)
      )
    `)
    
    // Table call_history
    await pool.query(`
      CREATE TABLE IF NOT EXISTS call_history (
        history_id SERIAL PRIMARY KEY,
        project_call_id INTEGER NOT NULL,
        action VARCHAR(50) NOT NULL,
        ancien_statut VARCHAR(20),
        nouveau_statut VARCHAR(20),
        donnees_avant JSONB,
        donnees_apres JSONB,
        utilisateur VARCHAR(50),
        date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Table scores
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scores (
        score_id SERIAL PRIMARY KEY,
        project_call_id INTEGER NOT NULL,
        type_score VARCHAR(50) NOT NULL,
        valeur_score INTEGER NOT NULL,
        poids_score DECIMAL(3,2) DEFAULT 1.0,
        commentaire VARCHAR(500),
        date_calcul TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Table call_metadata
    await pool.query(`
      CREATE TABLE IF NOT EXISTS call_metadata (
        metadata_id SERIAL PRIMARY KEY,
        project_call_id INTEGER NOT NULL,
        cle_metadonnee VARCHAR(100) NOT NULL,
        valeur_metadonnee TEXT,
        type_donnee VARCHAR(20) DEFAULT 'TEXT',
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_call_id, cle_metadonnee)
      )
    `)
    
    // Table system_parameters
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_parameters (
        param_id SERIAL PRIMARY KEY,
        cle_parametre VARCHAR(100) NOT NULL UNIQUE,
        valeur_parametre TEXT,
        description TEXT,
        type_parametre VARCHAR(20) DEFAULT 'TEXT',
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Étape 5: Ajouter les contraintes si elles n'existent pas
    console.log('🔒 Ajout des contraintes...')
    
    // Contraintes pour calls
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_calls_statut') THEN
          ALTER TABLE calls ADD CONSTRAINT ck_calls_statut CHECK (statut IN ('pending', 'called', 'failed', 'in_progress'));
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_calls_score') THEN
          ALTER TABLE calls ADD CONSTRAINT ck_calls_score CHECK (score IS NULL OR (score >= 0 AND score <= 100));
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_calls_duree') THEN
          ALTER TABLE calls ADD CONSTRAINT ck_calls_duree CHECK (duree_secondes >= 0);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_calls_tentatives') THEN
          ALTER TABLE calls ADD CONSTRAINT ck_calls_tentatives CHECK (nombre_tentatives >= 0);
        END IF;
      END $$;
    `)
    
    // Étape 6: Créer les index
    console.log('📈 Création des index...')
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_calls_patient ON calls(project_patient_id)',
      'CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(statut)',
      'CREATE INDEX IF NOT EXISTS idx_calls_scheduled ON calls(date_appel_prevue)',
      'CREATE INDEX IF NOT EXISTS idx_calls_actual ON calls(date_appel_reelle)',
      'CREATE INDEX IF NOT EXISTS idx_call_history_call ON call_history(project_call_id)',
      'CREATE INDEX IF NOT EXISTS idx_call_history_action ON call_history(action)',
      'CREATE INDEX IF NOT EXISTS idx_call_history_date ON call_history(date_action)',
      'CREATE INDEX IF NOT EXISTS idx_scores_call ON scores(project_call_id)',
      'CREATE INDEX IF NOT EXISTS idx_scores_type ON scores(type_score)',
      'CREATE INDEX IF NOT EXISTS idx_metadata_call ON call_metadata(project_call_id)',
      'CREATE INDEX IF NOT EXISTS idx_metadata_key ON call_metadata(cle_metadonnee)'
    ]
    
    for (const indexQuery of indexes) {
      await pool.query(indexQuery)
    }
    
    // Étape 7: Créer les vues
    console.log('👁️ Création des vues...')
    
    await pool.query(`
      CREATE VIEW v_appels_en_cours AS
      SELECT 
        c.project_call_id,
        p.numero_patient,
        p.nom,
        p.prenom,
        p.telephone,
        h.service,
        h.medecin,
        h.date_sortie,
        c.date_appel_prevue,
        c.statut,
        c.nombre_tentatives
      FROM calls c
      JOIN patients_sync p ON c.project_patient_id = p.project_patient_id
      LEFT JOIN hospitalisations_sync h ON c.project_hospitalisation_id = h.project_hospitalisation_id
      WHERE c.statut = 'pending'
      ORDER BY c.date_appel_prevue
    `)
    
    await pool.query(`
      CREATE VIEW v_statistiques_appels AS
      SELECT 
        statut,
        COUNT(*) as nombre_appels,
        AVG(duree_secondes) as duree_moyenne,
        AVG(score) as score_moyen,
        MIN(date_creation) as premier_appel,
        MAX(date_creation) as dernier_appel
      FROM calls
      GROUP BY statut
    `)
    
    // Étape 8: Créer les fonctions
    console.log('⚙️ Création des fonctions...')
    
    await pool.query(`
      CREATE FUNCTION marquer_appel_echec(p_patient_id INTEGER, p_max_tentatives INTEGER DEFAULT 3)
      RETURNS VOID AS $$
      DECLARE
        v_tentatives INTEGER;
      BEGIN
        SELECT nombre_tentatives INTO v_tentatives
        FROM calls 
        WHERE project_patient_id = p_patient_id 
        AND statut = 'pending';
        
        IF v_tentatives >= p_max_tentatives THEN
          UPDATE calls 
          SET statut = 'failed',
              date_modification = CURRENT_TIMESTAMP
          WHERE project_patient_id = p_patient_id 
          AND statut = 'pending';
        END IF;
      END;
      $$ LANGUAGE plpgsql
    `)
    
    await pool.query(`
      CREATE FUNCTION calculer_score_appel(p_call_id INTEGER)
      RETURNS INTEGER AS $$
      DECLARE
        v_score INTEGER := 0;
        v_duree INTEGER;
        v_nombre_tentatives INTEGER;
        v_has_resume BOOLEAN;
      BEGIN
        SELECT duree_secondes, nombre_tentatives, (resume_appel IS NOT NULL AND resume_appel != '')
        INTO v_duree, v_nombre_tentatives, v_has_resume
        FROM calls
        WHERE project_call_id = p_call_id;
        
        IF v_duree > 0 THEN
          v_score := v_score + LEAST(v_duree / 30, 40);
        END IF;
        
        IF v_nombre_tentatives = 1 THEN
          v_score := v_score + 20;
        ELSIF v_nombre_tentatives = 2 THEN
          v_score := v_score + 15;
        ELSIF v_nombre_tentatives = 3 THEN
          v_score := v_score + 10;
        END IF;
        
        IF v_has_resume THEN
          v_score := v_score + 20;
        END IF;
        
        IF v_duree > 0 THEN
          v_score := v_score + 20;
        END IF;
        
        v_score := LEAST(v_score, 100);
        
        UPDATE calls 
        SET score = v_score,
            date_modification = CURRENT_TIMESTAMP
        WHERE project_call_id = p_call_id;
        
        RETURN v_score;
      END;
      $$ LANGUAGE plpgsql
    `)
    
    await pool.query(`
      CREATE FUNCTION audit_call_changes()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'UPDATE' THEN
          INSERT INTO call_history (
            project_call_id, 
            action, 
            ancien_statut, 
            nouveau_statut, 
            donnees_avant, 
            donnees_apres, 
            utilisateur
          ) VALUES (
            OLD.project_call_id,
            'updated',
            OLD.statut,
            NEW.statut,
            to_jsonb(OLD),
            to_jsonb(NEW),
            NEW.utilisateur_modification
          );
          RETURN NEW;
        ELSIF TG_OP = 'INSERT' THEN
          INSERT INTO call_history (
            project_call_id, 
            action, 
            nouveau_statut, 
            donnees_apres, 
            utilisateur
          ) VALUES (
            NEW.project_call_id,
            'created',
            NEW.statut,
            to_jsonb(NEW),
            NEW.utilisateur_creation
          );
          RETURN NEW;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql
    `)
    
    // Étape 9: Créer le trigger
    console.log('🔔 Création du trigger...')
    await pool.query(`
      CREATE TRIGGER trigger_audit_calls
        AFTER INSERT OR UPDATE ON calls
        FOR EACH ROW
        EXECUTE FUNCTION audit_call_changes()
    `)
    
    // Étape 10: Insérer les paramètres système
    console.log('🔧 Configuration des paramètres système...')
    await pool.query(`
      INSERT INTO system_parameters (cle_parametre, valeur_parametre, description, type_parametre) VALUES
      ('max_tentatives_appel', '3', 'Nombre maximum de tentatives d''appel avant échec', 'INTEGER'),
      ('delai_appel_jours', '3', 'Délai en jours après la sortie pour programmer l''appel', 'INTEGER'),
      ('score_seuil_alerte', '50', 'Seuil de score en dessous duquel une alerte est générée', 'INTEGER'),
      ('duree_appel_min', '60', 'Durée minimale d''un appel en secondes', 'INTEGER'),
      ('duree_appel_max', '1800', 'Durée maximale d''un appel en secondes', 'INTEGER')
      ON CONFLICT (cle_parametre) DO NOTHING
    `)
    
    console.log('✅ Configuration terminée avec succès!')
    
    // Vérification finale
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('calls', 'call_history', 'scores', 'call_metadata', 'system_parameters')
      ORDER BY table_name
    `)
    
    console.log('📋 Tables vérifiées:')
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`)
    })
    
    const views = await pool.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'v_%'
      ORDER BY table_name
    `)
    
    console.log('👁️ Vues vérifiées:')
    views.rows.forEach(row => {
      console.log(`  - ${row.table_name}`)
    })
    
    const functions = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
      AND routine_name IN ('marquer_appel_echec', 'calculer_score_appel', 'audit_call_changes')
      ORDER BY routine_name
    `)
    
    console.log('⚙️ Fonctions vérifiées:')
    functions.rows.forEach(row => {
      console.log(`  - ${row.routine_name}`)
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  setupCallsTablesFixed()
    .then(() => {
      console.log('✅ Script terminé avec succès')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erreur lors de l\'exécution du script:', error)
      process.exit(1)
    })
}

module.exports = { setupCallsTablesFixed } 