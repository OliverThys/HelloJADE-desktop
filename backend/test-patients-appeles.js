const axios = require('axios')

const API_BASE_URL = 'http://localhost:8000'

async function testPatientsAppeles() {
  console.log('🔍 Test des patients appelés avec alertes...\n')

  try {
    // Test de la route des patients appelés
    console.log('1️⃣ Test de /api/dashboard/recent-patients (patients appelés)...')
    const response = await axios.get(`${API_BASE_URL}/api/dashboard/recent-patients?limit=10`)
    
    if (response.status === 200) {
      console.log('✅ Route OK:', response.status)
      console.log(`📊 ${response.data.data.length} patients appelés récupérés`)
      
      console.log('\n📋 Détail des patients appelés:')
      response.data.data.forEach((patient, index) => {
        console.log(`${index + 1}. ${patient.prenom} ${patient.nom}`)
        console.log(`   - Service: ${patient.service}`)
        console.log(`   - Médecin: ${patient.medecin}`)
        console.log(`   - Statut: ${patient.statut} (${patient.statut_color})`)
        console.log(`   - Appelé: ${patient.temps_appel}`)
        console.log(`   - Satisfaction: ${patient.satisfaction_score || 'Non évalué'}`)
        
        if (patient.alerte_id) {
          console.log(`   ⚠️  ALERTE: ${patient.type_alerte} (${patient.niveau_urgence})`)
          console.log(`   📝 ${patient.alerte_description}`)
          console.log(`   🔧 Action: ${patient.action_requise}`)
        }
        console.log('')
      })
    }
    
    // Test de la route des alertes
    console.log('2️⃣ Test de /api/dashboard/alerts...')
    const alertsResponse = await axios.get(`${API_BASE_URL}/api/dashboard/alerts?limit=10`)
    
    if (alertsResponse.status === 200) {
      console.log('✅ Route alertes OK:', alertsResponse.status)
      console.log(`📊 ${alertsResponse.data.data.length} alertes actives récupérées`)
      
      console.log('\n📋 Détail des alertes actives:')
      alertsResponse.data.data.forEach((alert, index) => {
        console.log(`${index + 1}. ${alert.patient_prenom} ${alert.patient_nom}`)
        console.log(`   - Type: ${alert.type_alerte}`)
        console.log(`   - Urgence: ${alert.niveau_urgence}`)
        console.log(`   - Description: ${alert.description}`)
        console.log(`   - Action: ${alert.action_requise}`)
        console.log(`   - Date: ${alert.date_creation}`)
        console.log('')
      })
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (error.response) {
      console.error('Status:', error.response.status)
      console.error('Data:', error.response.data)
    }
  }
}

testPatientsAppeles() 