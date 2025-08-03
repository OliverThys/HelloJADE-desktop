const { Pool } = require('pg')
require('dotenv').config({ path: './config.env' })

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function insertTestData() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Insertion de données de test pour le dashboard...')
    
    // Données de test pour les patients
    const testPatients = [
      {
        patient_id: 1001,
        nom: 'Dupont',
        prenom: 'Marie',
        date_sortie_hospitalisation: '2024-01-15',
        statut_appel: 'APPELE',
        date_heure_reelle: '2024-01-20 14:30:00',
        score_calcule: 8.5,
        resume_appel: 'Patient satisfait du suivi post-hospitalisation'
      },
      {
        patient_id: 1002,
        nom: 'Martin',
        prenom: 'Jean',
        date_sortie_hospitalisation: '2024-01-10',
        statut_appel: 'APPELE',
        date_heure_reelle: '2024-01-18 10:15:00',
        score_calcule: 7.2,
        resume_appel: 'Récupération en cours, quelques douleurs résiduelles'
      },
      {
        patient_id: 1003,
        nom: 'Bernard',
        prenom: 'Sophie',
        date_sortie_hospitalisation: '2024-01-12',
        statut_appel: 'ECHEC',
        date_heure_reelle: '2024-01-19 16:45:00',
        score_calcule: 3.0,
        resume_appel: 'Patient non joignable, numéro incorrect'
      },
      {
        patient_id: 1004,
        nom: 'Petit',
        prenom: 'Pierre',
        date_sortie_hospitalisation: '2024-01-08',
        statut_appel: 'A_APPELER',
        date_heure_reelle: null,
        score_calcule: null,
        resume_appel: null
      },
      {
        patient_id: 1005,
        nom: 'Robert',
        prenom: 'Claire',
        date_sortie_hospitalisation: '2024-01-14',
        statut_appel: 'APPELE',
        date_heure_reelle: '2024-01-21 09:20:00',
        score_calcule: 9.1,
        resume_appel: 'Excellente récupération, patient très satisfait'
      },
      {
        patient_id: 1006,
        nom: 'Richard',
        prenom: 'Michel',
        date_sortie_hospitalisation: '2024-01-11',
        statut_appel: 'APPELE',
        date_heure_reelle: '2024-01-17 11:30:00',
        score_calcule: 6.8,
        resume_appel: 'Suivi normal, quelques questions sur la médication'
      },
      {
        patient_id: 1007,
        nom: 'Durand',
        prenom: 'Isabelle',
        date_sortie_hospitalisation: '2024-01-09',
        statut_appel: 'ECHEC',
        date_heure_reelle: '2024-01-16 14:00:00',
        score_calcule: 2.5,
        resume_appel: 'Patient en déplacement, rappel prévu'
      },
      {
        patient_id: 1008,
        nom: 'Moreau',
        prenom: 'François',
        date_sortie_hospitalisation: '2024-01-13',
        statut_appel: 'A_APPELER',
        date_heure_reelle: null,
        score_calcule: null,
        resume_appel: null
      },
      {
        patient_id: 1009,
        nom: 'Simon',
        prenom: 'Nathalie',
        date_sortie_hospitalisation: '2024-01-16',
        statut_appel: 'APPELE',
        date_heure_reelle: '2024-01-22 15:45:00',
        score_calcule: 8.9,
        resume_appel: 'Récupération excellente, retour au travail prévu'
      },
      {
        patient_id: 1010,
        nom: 'Michel',
        prenom: 'Laurent',
        date_sortie_hospitalisation: '2024-01-07',
        statut_appel: 'APPELE',
        date_heure_reelle: '2024-01-15 13:20:00',
        score_calcule: 7.5,
        resume_appel: 'Suivi post-opératoire normal, cicatrisation bonne'
      },
      {
        patient_id: 1011,
        nom: 'Leroy',
        prenom: 'Catherine',
        date_sortie_hospitalisation: '2024-01-17',
        statut_appel: 'A_APPELER',
        date_heure_reelle: null,
        score_calcule: null,
        resume_appel: null
      },
      {
        patient_id: 1012,
        nom: 'Roux',
        prenom: 'Philippe',
        date_sortie_hospitalisation: '2024-01-06',
        statut_appel: 'APPELE',
        date_heure_reelle: '2024-01-14 10:30:00',
        score_calcule: 6.2,
        resume_appel: 'Quelques complications mineures, surveillance renforcée'
      },
      {
        patient_id: 1013,
        nom: 'David',
        prenom: 'Anne',
        date_sortie_hospitalisation: '2024-01-18',
        statut_appel: 'ECHEC',
        date_heure_reelle: '2024-01-23 16:15:00',
        score_calcule: 1.0,
        resume_appel: 'Patient injoignable, message laissé'
      },
      {
        patient_id: 1014,
        nom: 'Bertrand',
        prenom: 'Marc',
        date_sortie_hospitalisation: '2024-01-05',
        statut_appel: 'APPELE',
        date_heure_reelle: '2024-01-13 11:45:00',
        score_calcule: 8.7,
        resume_appel: 'Récupération parfaite, patient très reconnaissant'
      },
      {
        patient_id: 1015,
        nom: 'Rousseau',
        prenom: 'Valérie',
        date_sortie_hospitalisation: '2024-01-19',
        statut_appel: 'A_APPELER',
        date_heure_reelle: null,
        score_calcule: null,
        resume_appel: null
      }
    ]
    
    // Vérifier si la table calls existe
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'calls'
      ) as table_exists
    `
    const tableResult = await client.query(tableExistsQuery)
    
    if (!tableResult.rows[0].table_exists) {
      console.log('❌ La table calls n\'existe pas. Création...')
      
      // Créer la table calls
      const createTableQuery = `
        CREATE TABLE calls (
          id SERIAL PRIMARY KEY,
          patient_id INTEGER NOT NULL,
          nom VARCHAR(100) NOT NULL,
          prenom VARCHAR(100) NOT NULL,
          date_sortie_hospitalisation DATE,
          statut_appel VARCHAR(20),
          date_heure_reelle TIMESTAMP,
          score_calcule DECIMAL(3,1),
          resume_appel TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
      await client.query(createTableQuery)
      console.log('✅ Table calls créée')
    }
    
    // Vider la table pour éviter les doublons
    await client.query('DELETE FROM calls')
    console.log('✅ Table calls vidée')
    
    // Insérer les données de test
    for (const patient of testPatients) {
      const insertQuery = `
        INSERT INTO calls (
          patient_id, nom, prenom, date_sortie_hospitalisation, 
          statut_appel, date_heure_reelle, score_calcule, resume_appel
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `
      
      await client.query(insertQuery, [
        patient.patient_id,
        patient.nom,
        patient.prenom,
        patient.date_sortie_hospitalisation,
        patient.statut_appel,
        patient.date_heure_reelle,
        patient.score_calcule,
        patient.resume_appel
      ])
    }
    
    console.log(`✅ ${testPatients.length} patients de test insérés`)
    
    // Vérifier l'insertion
    const countQuery = 'SELECT COUNT(*) as total FROM calls'
    const countResult = await client.query(countQuery)
    console.log(`✅ Total d'enregistrements dans calls: ${countResult.rows[0].total}`)
    
    // Afficher un résumé des statuts
    const statsQuery = `
      SELECT 
        statut_appel,
        COUNT(*) as count
      FROM calls 
      GROUP BY statut_appel
      ORDER BY count DESC
    `
    const statsResult = await client.query(statsQuery)
    console.log('📊 Répartition des statuts:')
    statsResult.rows.forEach(row => {
      console.log(`  - ${row.statut_appel || 'NULL'}: ${row.count}`)
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    client.release()
    await pool.end()
  }
}

insertTestData() 