const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

// Configuration PostgreSQL
const POSTGRES_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hellojade',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
};

async function createScoreTables() {
    const pool = new Pool(POSTGRES_CONFIG);
    const client = await pool.connect();
    
    try {
        console.log('🚀 Création des tables pour le système de score...');
        
        // Suppression des anciennes tables si elles existent
        console.log('🗑️ Suppression des anciennes tables...');
        await client.query('DROP TABLE IF EXISTS patient_alerts CASCADE');
        await client.query('DROP TABLE IF EXISTS patient_wellness_metrics CASCADE');
        
        // Table des métriques de score pour les patients
        console.log('📊 Création de la table patient_score_metrics...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS patient_score_metrics (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER NOT NULL,
                douleur INTEGER CHECK (douleur >= 0 AND douleur <= 10),
                traitement_suivi BOOLEAN DEFAULT true,
                transit_normal BOOLEAN DEFAULT true,
                moral INTEGER CHECK (moral >= 0 AND moral <= 10),
                fievre BOOLEAN DEFAULT false,
                mots_cles_urgents TEXT[],
                score_calcule INTEGER CHECK (score_calcule >= 0 AND score_calcule <= 100),
                date_evaluation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                UNIQUE(patient_id, date_evaluation)
            )
        `);
        
        // Table des alertes basées sur le score
        console.log('🚨 Création de la table patient_score_alerts...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS patient_score_alerts (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER NOT NULL,
                score_metrics_id INTEGER REFERENCES patient_score_metrics(id),
                score_calcule INTEGER NOT NULL,
                niveau_urgence VARCHAR(20) CHECK (niveau_urgence IN ('ELEVE', 'MOYEN', 'FAIBLE')),
                raison_alerte TEXT,
                statut VARCHAR(20) DEFAULT 'ACTIVE' CHECK (statut IN ('ACTIVE', 'RESOLVED', 'IGNORED')),
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date_resolution TIMESTAMP,
                action_requise TEXT,
                traite_par VARCHAR(100),
                notes TEXT
            )
        `);
        
        // Index pour optimiser les performances
        console.log('⚡ Création des index...');
        await client.query('CREATE INDEX IF NOT EXISTS idx_patient_score_metrics_patient_id ON patient_score_metrics(patient_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_patient_score_metrics_date ON patient_score_metrics(date_evaluation)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_patient_score_alerts_patient_id ON patient_score_alerts(patient_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_patient_score_alerts_statut ON patient_score_alerts(statut)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_patient_score_alerts_score ON patient_score_alerts(score_calcule)');
        
        // Fonction pour calculer automatiquement le score
        console.log('🧮 Création de la fonction de calcul de score...');
        await client.query(`
            CREATE OR REPLACE FUNCTION calculer_score_patient(
                p_douleur INTEGER,
                p_traitement_suivi BOOLEAN,
                p_transit_normal BOOLEAN,
                p_moral INTEGER,
                p_fievre BOOLEAN,
                p_mots_cles_urgents TEXT[]
            ) RETURNS INTEGER AS $$
            DECLARE
                score INTEGER := 100;
                mots_urgents_presents BOOLEAN := false;
            BEGIN
                -- Vérification des mots-clés urgents
                IF p_mots_cles_urgents IS NOT NULL AND array_length(p_mots_cles_urgents, 1) > 0 THEN
                    mots_urgents_presents := true;
                END IF;
                
                -- Calcul du score selon l'algorithme
                score := score - (
                    CASE WHEN p_douleur > 5 THEN 20 ELSE 0 END +
                    CASE WHEN NOT p_traitement_suivi THEN 15 ELSE 0 END +
                    CASE WHEN NOT p_transit_normal THEN 10 ELSE 0 END +
                    CASE WHEN p_moral < 5 THEN 15 ELSE 0 END +
                    CASE WHEN p_fievre THEN 20 ELSE 0 END +
                    CASE WHEN mots_urgents_presents THEN 20 ELSE 0 END
                );
                
                -- S'assurer que le score reste entre 0 et 100
                RETURN GREATEST(0, LEAST(100, score));
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        // Trigger pour calculer automatiquement le score
        console.log('🔗 Création du trigger pour le calcul automatique...');
        await client.query(`
            CREATE OR REPLACE FUNCTION trigger_calculer_score() RETURNS TRIGGER AS $$
            BEGIN
                NEW.score_calcule := calculer_score_patient(
                    NEW.douleur,
                    NEW.traitement_suivi,
                    NEW.transit_normal,
                    NEW.moral,
                    NEW.fievre,
                    NEW.mots_cles_urgents
                );
                NEW.date_modification := CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        await client.query(`
            DROP TRIGGER IF EXISTS trigger_calculer_score_metrics ON patient_score_metrics;
            CREATE TRIGGER trigger_calculer_score_metrics
                BEFORE INSERT OR UPDATE ON patient_score_metrics
                FOR EACH ROW
                EXECUTE FUNCTION trigger_calculer_score();
        `);
        
        // Trigger pour créer automatiquement des alertes si le score est bas
        console.log('🚨 Création du trigger pour les alertes automatiques...');
        await client.query(`
            CREATE OR REPLACE FUNCTION trigger_creer_alerte_score() RETURNS TRIGGER AS $$
            DECLARE
                niveau_urgence VARCHAR(20);
            BEGIN
                -- Déterminer le niveau d'urgence basé sur le score
                IF NEW.score_calcule <= 30 THEN
                    niveau_urgence := 'ELEVE';
                ELSIF NEW.score_calcule <= 60 THEN
                    niveau_urgence := 'MOYEN';
                ELSE
                    niveau_urgence := 'FAIBLE';
                END IF;
                
                -- Créer une alerte si le score est <= 60
                IF NEW.score_calcule <= 60 THEN
                    INSERT INTO patient_score_alerts (
                        patient_id,
                        score_metrics_id,
                        score_calcule,
                        niveau_urgence,
                        raison_alerte,
                        action_requise
                    ) VALUES (
                        NEW.patient_id,
                        NEW.id,
                        NEW.score_calcule,
                        niveau_urgence,
                        'Score de santé faible: ' || NEW.score_calcule || '/100',
                        'Contacter le patient pour évaluation médicale'
                    );
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        await client.query(`
            DROP TRIGGER IF EXISTS trigger_creer_alerte_score_metrics ON patient_score_metrics;
            CREATE TRIGGER trigger_creer_alerte_score_metrics
                AFTER INSERT OR UPDATE ON patient_score_metrics
                FOR EACH ROW
                EXECUTE FUNCTION trigger_creer_alerte_score();
        `);
        
        console.log('✅ Tables et fonctions créées avec succès !');
        
        // Insertion de données de test
        console.log('🎲 Insertion de données de test...');
        await insertTestData(client);
        
    } catch (error) {
        console.error('❌ Erreur lors de la création des tables:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

async function insertTestData(client) {
    // Données de test pour les métriques de score
    const testMetrics = [
        [1, 7, false, true, 3, true, ['urgence', 'douleur intense'], 'Test patient avec douleur élevée'],
        [2, 3, true, false, 6, false, [], 'Test patient avec transit anormal'],
        [3, 2, true, true, 8, false, [], 'Test patient stable'],
        [4, 8, false, false, 2, true, ['critique', 'fièvre'], 'Test patient critique'],
        [5, 4, true, true, 7, false, [], 'Test patient avec moral moyen']
    ];
    
    for (const metrics of testMetrics) {
        await client.query(`
            INSERT INTO patient_score_metrics (
                patient_id, douleur, traitement_suivi, transit_normal, moral, fievre, mots_cles_urgents, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, metrics);
    }
    
    console.log(`✅ ${testMetrics.length} métriques de test insérées`);
}

// Fonction pour insérer des données de test pour les patients appelés
async function insertTestScoreData() {
  try {
    console.log('Insertion des données de test pour les patients appelés...')
    
    // Récupérer les patients qui ont été appelés (statut_appel = 'SUCCES')
    const calledPatientsQuery = `
      SELECT id, nom, prenom 
      FROM patients 
      WHERE statut_appel = 'SUCCES' 
      ORDER BY id 
      LIMIT 10
    `
    const calledPatients = await pool.query(calledPatientsQuery)
    
    if (calledPatients.rows.length === 0) {
      console.log('Aucun patient appelé trouvé. Création de données de test...')
      // Insérer quelques patients avec statut SUCCES pour les tests
      await pool.query(`
        UPDATE patients 
        SET statut_appel = 'SUCCES', date_appel = CURRENT_TIMESTAMP 
        WHERE id IN (1, 2, 3, 4, 5)
      `)
      
      // Récupérer à nouveau
      const updatedPatients = await pool.query(calledPatientsQuery)
      if (updatedPatients.rows.length === 0) {
        console.log('Impossible de trouver des patients pour les tests')
        return
      }
      calledPatients.rows = updatedPatients.rows
    }
    
    console.log(`${calledPatients.rows.length} patients appelés trouvés pour les tests`)
    
    // Données de test variées pour tester différents scénarios
    const testData = [
      // Patient avec score très faible (urgence)
      {
        douleur: 8,
        traitement_suivi: false,
        transit_normal: false,
        moral: 2,
        fievre: true,
        mots_cles_urgents: ['douleur intense', 'fièvre élevée', 'détresse']
      },
      // Patient avec score faible (attention)
      {
        douleur: 6,
        traitement_suivi: true,
        transit_normal: false,
        moral: 4,
        fievre: false,
        mots_cles_urgents: ['fatigue', 'douleur']
      },
      // Patient avec score moyen
      {
        douleur: 4,
        traitement_suivi: true,
        transit_normal: true,
        moral: 6,
        fievre: false,
        mots_cles_urgents: []
      },
      // Patient avec bon score
      {
        douleur: 2,
        traitement_suivi: true,
        transit_normal: true,
        moral: 8,
        fievre: false,
        mots_cles_urgents: []
      },
      // Patient avec excellent score
      {
        douleur: 1,
        traitement_suivi: true,
        transit_normal: true,
        moral: 9,
        fievre: false,
        mots_cles_urgents: []
      }
    ]
    
    // Insérer les données de test pour chaque patient appelé
    for (let i = 0; i < calledPatients.rows.length; i++) {
      const patient = calledPatients.rows[i]
      const testMetrics = testData[i % testData.length] // Cycle à travers les données de test
      
      // Calculer le score
      const scoreResult = await pool.query(`
        SELECT calculer_score_patient($1, $2, $3, $4, $5, $6) as score
      `, [
        testMetrics.douleur,
        testMetrics.traitement_suivi,
        testMetrics.transit_normal,
        testMetrics.moral,
        testMetrics.fievre,
        testMetrics.mots_cles_urgents
      ])
      
      const score = scoreResult.rows[0].score
      
      // Insérer les métriques de score
      const insertResult = await pool.query(`
        INSERT INTO patient_score_metrics 
        (patient_id, douleur, traitement_suivi, transit_normal, moral, fievre, mots_cles_urgents, score_calcule, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (patient_id, date_evaluation) DO UPDATE SET
        douleur = EXCLUDED.douleur,
        traitement_suivi = EXCLUDED.traitement_suivi,
        transit_normal = EXCLUDED.transit_normal,
        moral = EXCLUDED.moral,
        fievre = EXCLUDED.fievre,
        mots_cles_urgents = EXCLUDED.mots_cles_urgents,
        score_calcule = EXCLUDED.score_calcule,
        notes = EXCLUDED.notes,
        date_modification = CURRENT_TIMESTAMP
        RETURNING id
      `, [
        patient.id,
        testMetrics.douleur,
        testMetrics.traitement_suivi,
        testMetrics.transit_normal,
        testMetrics.moral,
        testMetrics.fievre,
        testMetrics.mots_cles_urgents,
        score,
        `Données de test pour ${patient.prenom} ${patient.nom}`
      ])
      
      console.log(`Patient ${patient.prenom} ${patient.nom} (ID: ${patient.id}) - Score: ${score}/100`)
    }
    
    // Vérifier les alertes générées automatiquement
    const alertsQuery = `
      SELECT 
        psa.id,
        p.nom,
        p.prenom,
        psa.score_calcule,
        psa.niveau_urgence,
        psa.raison_alerte
      FROM patient_score_alerts psa
      JOIN patients p ON psa.patient_id = p.id
      WHERE psa.statut = 'ACTIVE'
      ORDER BY psa.score_calcule ASC
    `
    const alerts = await pool.query(alertsQuery)
    
    console.log(`\nAlertes générées automatiquement:`)
    alerts.rows.forEach(alert => {
      console.log(`- ${alert.prenom} ${alert.nom}: Score ${alert.score_calcule}/100 (${alert.niveau_urgence}) - ${alert.raison_alerte}`)
    })
    
    console.log('\n✅ Données de test insérées avec succès pour les patients appelés')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données de test:', error)
    throw error
  }
}

// Exécution du script
if (require.main === module) {
    createScoreTables()
        .then(() => {
            console.log('🎉 Script terminé avec succès !');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Erreur fatale:', error);
            process.exit(1);
        });
}

module.exports = { createScoreTables }; 