const express = require('express')
const cors = require('cors')
const { initialize, executeQuery, closePool } = require('./database')

// Créer une mini-application Express pour tester
const app = express()
app.use(cors())
app.use(express.json())

// Route de test
app.get('/test-calls', async (req, res) => {
  try {
    console.log('🧪 Test de la route /test-calls...')
    
    const sql = `
      SELECT 
        p.PATIENT_ID as id,
        p.NUMERO_REGISTRE_NATIONAL as patient_number,
        p.NOM as patient_last_name,
        p.PRENOM as patient_first_name,
        p.DATE_NAISSANCE as birth_date,
        p.TELEPHONE as phone,
        'CHU Liège' as hospital_site,
        h.DATE_SORTIE as discharge_date,
        h.DATE_SORTIE + 1 as scheduled_call,
        'pending' as status,
        m.NOM || ' ' || m.PRENOM as doctor,
        s.NOM_SERVICE as service,
        NULL as actual_call,
        NULL as duration,
        NULL as score
      FROM PATIENTS p
      INNER JOIN HOSPITALISATIONS h ON p.PATIENT_ID = h.PATIENT_ID
      INNER JOIN MEDECINS m ON h.MEDECIN_TRAITANT_ID = m.MEDECIN_ID
      INNER JOIN SERVICES s ON h.SERVICE_ID = s.SERVICE_ID
      WHERE h.DATE_SORTIE IS NOT NULL OR h.STATUT = 'EN_COURS'
      ORDER BY h.DATE_SORTIE DESC
    `
    
    console.log('🔍 Exécution de la requête SQL...')
    const patients = await executeQuery(sql, [])
    
    console.log(`✅ ${patients.length} patients récupérés`)
    
    const transformedPatients = patients.map(patient => ({
      id: patient.ID,
      patient_number: patient.PATIENT_NUMBER,
      patient_last_name: patient.PATIENT_LAST_NAME,
      patient_first_name: patient.PATIENT_FIRST_NAME,
      birth_date: patient.BIRTH_DATE ? new Date(patient.BIRTH_DATE).toISOString().split('T')[0] : null,
      phone: patient.PHONE,
      hospital_site: patient.HOSPITAL_SITE,
      discharge_date: patient.DISCHARGE_DATE ? new Date(patient.DISCHARGE_DATE).toISOString().split('T')[0] : null,
      scheduled_call: patient.SCHEDULED_CALL ? new Date(patient.SCHEDULED_CALL).toISOString() : null,
      status: patient.STATUS || 'pending',
      doctor: patient.DOCTOR,
      service: patient.SERVICE,
      actual_call: patient.ACTUAL_CALL ? new Date(patient.ACTUAL_CALL).toISOString() : null,
      duration: patient.DURATION,
      score: patient.SCORE
    }))
    
    res.json({
      success: true,
      data: {
        items: transformedPatients,
        total: patients.length,
        page: 1,
        per_page: patients.length,
        pages: 1
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test',
      error: error.message
    })
  }
})

async function runTest() {
  try {
    console.log('🚀 Démarrage du test avec contexte Express...')
    
    // Initialiser la base de données
    await initialize()
    
    // Démarrer le serveur de test
    const server = app.listen(8001, () => {
      console.log('✅ Serveur de test démarré sur le port 8001')
    })
    
    // Tester la route
    const axios = require('axios')
    const response = await axios.get('http://localhost:8001/test-calls')
    
    console.log('✅ Test réussi:', response.data)
    
    // Fermer le serveur
    server.close()
    await closePool()
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    await closePool()
  }
}

runTest() 