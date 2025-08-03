const { Pool } = require('pg')
require('dotenv').config({ path: './config.env' })

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function addMoreAlerts() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Ajout d\'alertes supplémentaires pour les patients appelés...')
    
    // D'abord, vérifions quels patients ont été appelés
    const calledPatientsQuery = `
      SELECT patient_id, nom, prenom, statut_appel, date_heure_reelle
      FROM calls 
      WHERE statut_appel = 'APPELE'
      ORDER BY date_heure_reelle DESC
    `
    const calledPatientsResult = await client.query(calledPatientsQuery)
    console.log(`✅ ${calledPatientsResult.rows.length} patients appelés trouvés`)
    
    // Nouvelles alertes pour les patients appelés
    const newAlerts = [
      // Patient 1 (Durand Jean) - déjà appelé
      { 
        patient_id: 1, 
        type_alerte: 'SUIVI_REQUIS', 
        niveau_urgence: 'MOYEN', 
        description: 'Patient nécessite un suivi médical supplémentaire suite à l\'appel', 
        action_requise: 'Programmer une consultation de suivi' 
      },
      
      // Patient 3 (Petit Lucas) - déjà appelé
      { 
        patient_id: 3, 
        type_alerte: 'COMPLICATION', 
        niveau_urgence: 'ELEVE', 
        description: 'Complications détectées lors de l\'appel de suivi', 
        action_requise: 'Intervention médicale urgente requise' 
      },
      
      // Patient 5 (Robert Claire) - déjà appelé
      { 
        patient_id: 5, 
        type_alerte: 'CONTACT_ECHEC', 
        niveau_urgence: 'FAIBLE', 
        description: 'Patient difficile à joindre lors du rappel', 
        action_requise: 'Essayer un autre numéro de contact' 
      },
      
      // Patient 7 (Simon Nathalie) - déjà appelé
      { 
        patient_id: 7, 
        type_alerte: 'URGENCE', 
        niveau_urgence: 'ELEVE', 
        description: 'Symptômes d\'urgence signalés lors de l\'appel', 
        action_requise: 'Hospitalisation immédiate requise' 
      },
      
      // Patient 9 (Michel Laurent) - déjà appelé
      { 
        patient_id: 9, 
        type_alerte: 'SUIVI_REQUIS', 
        niveau_urgence: 'MOYEN', 
        description: 'Patient demande un suivi plus fréquent', 
        action_requise: 'Programmer des rendez-vous réguliers' 
      },
      
      // Patient 11 (Roux Philippe) - déjà appelé
      { 
        patient_id: 11, 
        type_alerte: 'COMPLICATION', 
        niveau_urgence: 'MOYEN', 
        description: 'Complications mineures signalées lors de l\'appel', 
        action_requise: 'Surveillance renforcée' 
      },
      
      // Patient 13 (David Anne) - déjà appelé
      { 
        patient_id: 13, 
        type_alerte: 'CONTACT_ECHEC', 
        niveau_urgence: 'FAIBLE', 
        description: 'Patient en déplacement, rappel prévu', 
        action_requise: 'Rappeler dans 24h' 
      },
      
      // Patient 15 (Bertrand Marc) - déjà appelé
      { 
        patient_id: 15, 
        type_alerte: 'SUIVI_REQUIS', 
        niveau_urgence: 'MOYEN', 
        description: 'Patient nécessite une évaluation psychologique', 
        action_requise: 'Orienter vers un psychologue' 
      },
      
      // Patient 17 (Rousseau Valérie) - déjà appelé
      { 
        patient_id: 17, 
        type_alerte: 'COMPLICATION', 
        niveau_urgence: 'ELEVE', 
        description: 'Aggravation des symptômes signalée', 
        action_requise: 'Consultation d\'urgence' 
      },
      
      // Patient 19 (Leroy Catherine) - déjà appelé
      { 
        patient_id: 19, 
        type_alerte: 'CONTACT_ECHEC', 
        niveau_urgence: 'FAIBLE', 
        description: 'Patient injoignable, message laissé', 
        action_requise: 'Attendre retour d\'appel' 
      }
    ]
    
    // Insérer les nouvelles alertes
    for (const alert of newAlerts) {
      const insertQuery = `
        INSERT INTO patient_alerts (
          patient_id, type_alerte, niveau_urgence, description, action_requise
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `
      await client.query(insertQuery, [
        alert.patient_id, alert.type_alerte, alert.niveau_urgence,
        alert.description, alert.action_requise
      ])
    }
    
    console.log(`✅ ${newAlerts.length} nouvelles alertes ajoutées`)
    
    // Vérification finale
    const totalAlertsQuery = 'SELECT COUNT(*) as count FROM patient_alerts WHERE statut = \'ACTIVE\''
    const totalAlertsResult = await client.query(totalAlertsQuery)
    console.log(`📊 Total d'alertes actives: ${totalAlertsResult.rows[0].count}`)
    
    // Afficher les patients appelés avec leurs alertes
    const patientsWithAlertsQuery = `
      SELECT 
        c.nom,
        c.prenom,
        c.statut_appel,
        c.date_heure_reelle,
        pa.type_alerte,
        pa.niveau_urgence,
        pa.description
      FROM calls c
      LEFT JOIN patient_alerts pa ON c.patient_id = pa.patient_id AND pa.statut = 'ACTIVE'
      WHERE c.statut_appel = 'APPELE'
      ORDER BY c.date_heure_reelle DESC
      LIMIT 10
    `
    const patientsWithAlertsResult = await client.query(patientsWithAlertsQuery)
    
    console.log('\n📋 Patients appelés avec leurs alertes:')
    patientsWithAlertsResult.rows.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.prenom} ${patient.nom} - ${patient.statut_appel}`)
      if (patient.type_alerte) {
        console.log(`   ⚠️  Alerte: ${patient.type_alerte} (${patient.niveau_urgence})`)
        console.log(`   📝 ${patient.description}`)
      }
      console.log('')
    })
    
    console.log('✅ Alertes supplémentaires ajoutées avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des alertes:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    client.release()
    await pool.end()
  }
}

addMoreAlerts() 