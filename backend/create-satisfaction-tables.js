const { Pool } = require('pg')
require('dotenv').config({ path: './config.env' })

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function createSatisfactionTables() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Création des tables de satisfaction dans hellojade...')
    
    // 1. Table patient_satisfaction
    console.log('\n1️⃣ Création de patient_satisfaction...')
    const createSatisfactionTable = `
      CREATE TABLE IF NOT EXISTS patient_satisfaction (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL,
        date_evaluation DATE NOT NULL,
        score_global DECIMAL(3,1) NOT NULL CHECK (score_global >= 0 AND score_global <= 10),
        score_communication DECIMAL(3,1) CHECK (score_communication >= 0 AND score_communication <= 10),
        score_soins DECIMAL(3,1) CHECK (score_soins >= 0 AND score_soins <= 10),
        score_environnement DECIMAL(3,1) CHECK (score_environnement >= 0 AND score_environnement <= 10),
        commentaires TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    await client.query(createSatisfactionTable)
    console.log('✅ Table patient_satisfaction créée')
    
    // Index pour patient_satisfaction
    await client.query('CREATE INDEX IF NOT EXISTS idx_patient_satisfaction_patient_id ON patient_satisfaction(patient_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_patient_satisfaction_date ON patient_satisfaction(date_evaluation)')
    console.log('✅ Index créés pour patient_satisfaction')
    
    // 2. Table patient_alerts
    console.log('\n2️⃣ Création de patient_alerts...')
    const createAlertsTable = `
      CREATE TABLE IF NOT EXISTS patient_alerts (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL,
        type_alerte VARCHAR(50) NOT NULL CHECK (type_alerte IN ('CONTACT_ECHEC', 'COMPLICATION', 'SUIVI_REQUIS', 'URGENCE')),
        niveau_urgence VARCHAR(20) NOT NULL CHECK (niveau_urgence IN ('ELEVE', 'MOYEN', 'FAIBLE')),
        description TEXT NOT NULL,
        statut VARCHAR(20) DEFAULT 'ACTIVE' CHECK (statut IN ('ACTIVE', 'RESOLVED', 'IGNORED')),
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_resolution TIMESTAMP,
        action_requise TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    await client.query(createAlertsTable)
    console.log('✅ Table patient_alerts créée')
    
    // Index pour patient_alerts
    await client.query('CREATE INDEX IF NOT EXISTS idx_patient_alerts_patient_id ON patient_alerts(patient_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_patient_alerts_statut ON patient_alerts(statut)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_patient_alerts_urgence ON patient_alerts(niveau_urgence)')
    console.log('✅ Index créés pour patient_alerts')
    
    // 3. Table patient_wellness_metrics
    console.log('\n3️⃣ Création de patient_wellness_metrics...')
    const createWellnessTable = `
      CREATE TABLE IF NOT EXISTS patient_wellness_metrics (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL,
        date_evaluation DATE NOT NULL,
        niveau_douleur INTEGER CHECK (niveau_douleur >= 0 AND niveau_douleur <= 10),
        etat_fatigue VARCHAR(20) CHECK (etat_fatigue IN ('LEGER', 'MODERE', 'ELEVE')),
        niveau_anxiete VARCHAR(20) CHECK (niveau_anxiete IN ('FAIBLE', 'MOYEN', 'ELEVE')),
        presence_infection BOOLEAN DEFAULT FALSE,
        type_infection VARCHAR(100),
        commentaires TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    await client.query(createWellnessTable)
    console.log('✅ Table patient_wellness_metrics créée')
    
    // Index pour patient_wellness_metrics
    await client.query('CREATE INDEX IF NOT EXISTS idx_patient_wellness_patient_id ON patient_wellness_metrics(patient_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_patient_wellness_date ON patient_wellness_metrics(date_evaluation)')
    console.log('✅ Index créés pour patient_wellness_metrics')
    
    // 4. Insertion de données de test
    console.log('\n4️⃣ Insertion de données de test...')
    
    // Données de satisfaction
    const satisfactionData = [
      { patient_id: 1, date_evaluation: '2025-08-02', score_global: 8.5, score_communication: 9.0, score_soins: 8.0, score_environnement: 8.5, commentaires: 'Très satisfait du suivi post-hospitalisation' },
      { patient_id: 3, date_evaluation: '2025-08-19', score_global: 7.2, score_communication: 7.5, score_soins: 7.0, score_environnement: 7.0, commentaires: 'Satisfait mais quelques améliorations possibles' },
      { patient_id: 5, date_evaluation: '2025-08-15', score_global: 9.1, score_communication: 9.5, score_soins: 9.0, score_environnement: 9.0, commentaires: 'Excellente expérience' },
      { patient_id: 7, date_evaluation: '2025-08-10', score_global: 6.8, score_communication: 7.0, score_soins: 6.5, score_environnement: 7.0, commentaires: 'Correct mais communication à améliorer' },
      { patient_id: 9, date_evaluation: '2025-08-12', score_global: 8.9, score_communication: 9.0, score_soins: 9.0, score_environnement: 8.5, commentaires: 'Très bonne prise en charge' }
    ]
    
    for (const data of satisfactionData) {
      const insertQuery = `
        INSERT INTO patient_satisfaction (
          patient_id, date_evaluation, score_global, score_communication, 
          score_soins, score_environnement, commentaires
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
      `
      await client.query(insertQuery, [
        data.patient_id, data.date_evaluation, data.score_global,
        data.score_communication, data.score_soins, data.score_environnement,
        data.commentaires
      ])
    }
    console.log(`✅ ${satisfactionData.length} évaluations de satisfaction insérées`)
    
    // Données d'alertes
    const alertsData = [
      { patient_id: 2, type_alerte: 'CONTACT_ECHEC', niveau_urgence: 'MOYEN', description: 'Patient non joignable depuis 3 tentatives', action_requise: 'Vérifier les coordonnées et relancer' },
      { patient_id: 4, type_alerte: 'CONTACT_ECHEC', niveau_urgence: 'FAIBLE', description: 'Patient en déplacement, rappel prévu', action_requise: 'Rappeler dans 48h' },
      { patient_id: 6, type_alerte: 'COMPLICATION', niveau_urgence: 'ELEVE', description: 'Complications mineures détectées lors du suivi', action_requise: 'Surveillance renforcée requise' },
      { patient_id: 8, type_alerte: 'SUIVI_REQUIS', niveau_urgence: 'MOYEN', description: 'Patient nécessite un suivi médical supplémentaire', action_requise: 'Programmer une consultation' }
    ]
    
    for (const data of alertsData) {
      const insertQuery = `
        INSERT INTO patient_alerts (
          patient_id, type_alerte, niveau_urgence, description, action_requise
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `
      await client.query(insertQuery, [
        data.patient_id, data.type_alerte, data.niveau_urgence,
        data.description, data.action_requise
      ])
    }
    console.log(`✅ ${alertsData.length} alertes insérées`)
    
    // Données de bien-être
    const wellnessData = [
      { patient_id: 1, date_evaluation: '2025-08-02', niveau_douleur: 2, etat_fatigue: 'LEGER', niveau_anxiete: 'FAIBLE', presence_infection: false },
      { patient_id: 3, date_evaluation: '2025-08-19', niveau_douleur: 4, etat_fatigue: 'MODERE', niveau_anxiete: 'MOYEN', presence_infection: false },
      { patient_id: 5, date_evaluation: '2025-08-15', niveau_douleur: 1, etat_fatigue: 'LEGER', niveau_anxiete: 'FAIBLE', presence_infection: false },
      { patient_id: 7, date_evaluation: '2025-08-10', niveau_douleur: 3, etat_fatigue: 'MODERE', niveau_anxiete: 'MOYEN', presence_infection: false },
      { patient_id: 9, date_evaluation: '2025-08-12', niveau_douleur: 1, etat_fatigue: 'LEGER', niveau_anxiete: 'FAIBLE', presence_infection: false },
      { patient_id: 6, date_evaluation: '2025-08-08', niveau_douleur: 5, etat_fatigue: 'ELEVE', niveau_anxiete: 'ELEVE', presence_infection: true, type_infection: 'Infection locale' }
    ]
    
    for (const data of wellnessData) {
      const insertQuery = `
        INSERT INTO patient_wellness_metrics (
          patient_id, date_evaluation, niveau_douleur, etat_fatigue, 
          niveau_anxiete, presence_infection, type_infection
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
      `
      await client.query(insertQuery, [
        data.patient_id, data.date_evaluation, data.niveau_douleur,
        data.etat_fatigue, data.niveau_anxiete, data.presence_infection,
        data.type_infection
      ])
    }
    console.log(`✅ ${wellnessData.length} métriques de bien-être insérées`)
    
    // 5. Vérification finale
    console.log('\n5️⃣ Vérification finale...')
    const satisfactionCount = await client.query('SELECT COUNT(*) as count FROM patient_satisfaction')
    const alertsCount = await client.query('SELECT COUNT(*) as count FROM patient_alerts WHERE statut = \'ACTIVE\'')
    const wellnessCount = await client.query('SELECT COUNT(*) as count FROM patient_wellness_metrics')
    
    console.log('📊 Résumé des données insérées:')
    console.log(`  - Évaluations de satisfaction: ${satisfactionCount.rows[0].count}`)
    console.log(`  - Alertes actives: ${alertsCount.rows[0].count}`)
    console.log(`  - Métriques de bien-être: ${wellnessCount.rows[0].count}`)
    
    console.log('\n✅ Toutes les tables de satisfaction ont été créées avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    client.release()
    await pool.end()
  }
}

createSatisfactionTables() 