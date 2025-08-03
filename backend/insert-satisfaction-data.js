const { Pool } = require('pg')
require('dotenv').config({ path: './config.env' })

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function insertSatisfactionData() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Insertion de données de satisfaction et d\'alertes...')
    
    // Créer les tables si elles n'existent pas
    const createSatisfactionTable = `
      CREATE TABLE IF NOT EXISTS patient_satisfaction (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL,
        date_evaluation DATE NOT NULL,
        score_global DECIMAL(3,1) NOT NULL,
        score_communication DECIMAL(3,1),
        score_soins DECIMAL(3,1),
        score_environnement DECIMAL(3,1),
        commentaires TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    await client.query(createSatisfactionTable)
    console.log('✅ Table patient_satisfaction créée/vérifiée')
    
    const createAlertsTable = `
      CREATE TABLE IF NOT EXISTS patient_alerts (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL,
        type_alerte VARCHAR(50) NOT NULL,
        niveau_urgence VARCHAR(20) NOT NULL,
        description TEXT NOT NULL,
        statut VARCHAR(20) DEFAULT 'ACTIVE',
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_resolution TIMESTAMP,
        action_requise TEXT
      )
    `
    await client.query(createAlertsTable)
    console.log('✅ Table patient_alerts créée/vérifiée')
    
    const createWellnessTable = `
      CREATE TABLE IF NOT EXISTS patient_wellness_metrics (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL,
        date_evaluation DATE NOT NULL,
        niveau_douleur INTEGER CHECK (niveau_douleur >= 0 AND niveau_douleur <= 10),
        etat_fatigue VARCHAR(20),
        niveau_anxiete VARCHAR(20),
        presence_infection BOOLEAN DEFAULT FALSE,
        type_infection VARCHAR(100),
        commentaires TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    await client.query(createWellnessTable)
    console.log('✅ Table patient_wellness_metrics créée/vérifiée')
    
    // Vider les tables
    await client.query('DELETE FROM patient_satisfaction')
    await client.query('DELETE FROM patient_alerts')
    await client.query('DELETE FROM patient_wellness_metrics')
    console.log('✅ Tables vidées')
    
    // Données de satisfaction
    const satisfactionData = [
      { patient_id: 1001, date_evaluation: '2024-01-20', score_global: 8.5, score_communication: 9.0, score_soins: 8.0, score_environnement: 8.5, commentaires: 'Très satisfait du suivi' },
      { patient_id: 1002, date_evaluation: '2024-01-18', score_global: 7.2, score_communication: 7.5, score_soins: 7.0, score_environnement: 7.0, commentaires: 'Satisfait mais quelques améliorations possibles' },
      { patient_id: 1005, date_evaluation: '2024-01-21', score_global: 9.1, score_communication: 9.5, score_soins: 9.0, score_environnement: 9.0, commentaires: 'Excellente expérience' },
      { patient_id: 1006, date_evaluation: '2024-01-17', score_global: 6.8, score_communication: 7.0, score_soins: 6.5, score_environnement: 7.0, commentaires: 'Correct mais communication à améliorer' },
      { patient_id: 1009, date_evaluation: '2024-01-22', score_global: 8.9, score_communication: 9.0, score_soins: 9.0, score_environnement: 8.5, commentaires: 'Très bonne prise en charge' },
      { patient_id: 1010, date_evaluation: '2024-01-15', score_global: 7.5, score_communication: 8.0, score_soins: 7.0, score_environnement: 7.5, commentaires: 'Satisfait du suivi post-opératoire' },
      { patient_id: 1012, date_evaluation: '2024-01-14', score_global: 6.2, score_communication: 6.0, score_soins: 6.5, score_environnement: 6.0, commentaires: 'Quelques complications mais équipe réactive' },
      { patient_id: 1014, date_evaluation: '2024-01-13', score_global: 8.7, score_communication: 9.0, score_soins: 8.5, score_environnement: 8.5, commentaires: 'Excellent suivi, personnel très compétent' }
    ]
    
    // Données d'alertes
    const alertsData = [
      { patient_id: 1003, type_alerte: 'CONTACT_ECHEC', niveau_urgence: 'MOYEN', description: 'Patient non joignable depuis 3 tentatives', action_requise: 'Vérifier les coordonnées et relancer' },
      { patient_id: 1007, type_alerte: 'CONTACT_ECHEC', niveau_urgence: 'FAIBLE', description: 'Patient en déplacement, rappel prévu', action_requise: 'Rappeler dans 48h' },
      { patient_id: 1013, type_alerte: 'CONTACT_ECHEC', niveau_urgence: 'MOYEN', description: 'Patient injoignable, message laissé', action_requise: 'Attendre retour d\'appel' },
      { patient_id: 1012, type_alerte: 'COMPLICATION', niveau_urgence: 'ELEVE', description: 'Complications mineures détectées', action_requise: 'Surveillance renforcée requise' }
    ]
    
    // Données de bien-être
    const wellnessData = [
      { patient_id: 1001, date_evaluation: '2024-01-20', niveau_douleur: 2, etat_fatigue: 'LEGER', niveau_anxiete: 'FAIBLE', presence_infection: false },
      { patient_id: 1002, date_evaluation: '2024-01-18', niveau_douleur: 4, etat_fatigue: 'MODERE', niveau_anxiete: 'MOYEN', presence_infection: false },
      { patient_id: 1005, date_evaluation: '2024-01-21', niveau_douleur: 1, etat_fatigue: 'LEGER', niveau_anxiete: 'FAIBLE', presence_infection: false },
      { patient_id: 1006, date_evaluation: '2024-01-17', niveau_douleur: 3, etat_fatigue: 'MODERE', niveau_anxiete: 'MOYEN', presence_infection: false },
      { patient_id: 1009, date_evaluation: '2024-01-22', niveau_douleur: 1, etat_fatigue: 'LEGER', niveau_anxiete: 'FAIBLE', presence_infection: false },
      { patient_id: 1010, date_evaluation: '2024-01-15', niveau_douleur: 3, etat_fatigue: 'MODERE', niveau_anxiete: 'MOYEN', presence_infection: false },
      { patient_id: 1012, date_evaluation: '2024-01-14', niveau_douleur: 5, etat_fatigue: 'ELEVE', niveau_anxiete: 'ELEVE', presence_infection: true, type_infection: 'Infection locale' },
      { patient_id: 1014, date_evaluation: '2024-01-13', niveau_douleur: 2, etat_fatigue: 'LEGER', niveau_anxiete: 'FAIBLE', presence_infection: false }
    ]
    
    // Insérer les données de satisfaction
    for (const data of satisfactionData) {
      const insertQuery = `
        INSERT INTO patient_satisfaction (
          patient_id, date_evaluation, score_global, score_communication, 
          score_soins, score_environnement, commentaires
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `
      await client.query(insertQuery, [
        data.patient_id, data.date_evaluation, data.score_global,
        data.score_communication, data.score_soins, data.score_environnement,
        data.commentaires
      ])
    }
    console.log(`✅ ${satisfactionData.length} évaluations de satisfaction insérées`)
    
    // Insérer les alertes
    for (const data of alertsData) {
      const insertQuery = `
        INSERT INTO patient_alerts (
          patient_id, type_alerte, niveau_urgence, description, action_requise
        ) VALUES ($1, $2, $3, $4, $5)
      `
      await client.query(insertQuery, [
        data.patient_id, data.type_alerte, data.niveau_urgence,
        data.description, data.action_requise
      ])
    }
    console.log(`✅ ${alertsData.length} alertes insérées`)
    
    // Insérer les métriques de bien-être
    for (const data of wellnessData) {
      const insertQuery = `
        INSERT INTO patient_wellness_metrics (
          patient_id, date_evaluation, niveau_douleur, etat_fatigue, 
          niveau_anxiete, presence_infection, type_infection
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `
      await client.query(insertQuery, [
        data.patient_id, data.date_evaluation, data.niveau_douleur,
        data.etat_fatigue, data.niveau_anxiete, data.presence_infection,
        data.type_infection
      ])
    }
    console.log(`✅ ${wellnessData.length} métriques de bien-être insérées`)
    
    // Afficher un résumé
    const satisfactionCount = await client.query('SELECT COUNT(*) as count FROM patient_satisfaction')
    const alertsCount = await client.query('SELECT COUNT(*) as count FROM patient_alerts WHERE statut = \'ACTIVE\'')
    const wellnessCount = await client.query('SELECT COUNT(*) as count FROM patient_wellness_metrics')
    
    console.log('📊 Résumé des données insérées:')
    console.log(`  - Évaluations de satisfaction: ${satisfactionCount.rows[0].count}`)
    console.log(`  - Alertes actives: ${alertsCount.rows[0].count}`)
    console.log(`  - Métriques de bien-être: ${wellnessCount.rows[0].count}`)
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    client.release()
    await pool.end()
  }
}

insertSatisfactionData() 