const axios = require('axios')

const API_BASE_URL = 'http://localhost:8000'

async function testPatientUpdate() {
  try {
    console.log('🧪 Test de mise à jour d\'un patient...')
    
    // D'abord, récupérer un patient existant
    const getResponse = await axios.get(`${API_BASE_URL}/api/patients?limit=1`)
    
    if (!getResponse.data.success || getResponse.data.data.patients.length === 0) {
      console.log('❌ Aucun patient trouvé pour le test')
      return
    }
    
    const patient = getResponse.data.data.patients[0]
    console.log('📋 Patient trouvé:', patient.prenom, patient.nom)
    
    // Données de test pour la mise à jour
    const updateData = {
      nom: patient.nom,
      prenom: patient.prenom,
      date_naissance: patient.date_naissance,
      telephone: '01-23-45-67-89',
      email: 'test@example.com',
      adresse: '123 Rue de Test, 75001 Paris',
      numero_secu: '1234567890123'
    }
    
    console.log('🔄 Mise à jour du patient...')
    
    // Mettre à jour le patient
    const updateResponse = await axios.put(`${API_BASE_URL}/api/patients/${patient.patient_id}`, updateData)
    
    if (updateResponse.data.success) {
      console.log('✅ Patient mis à jour avec succès!')
      console.log('📊 Données mises à jour:', updateResponse.data.data)
    } else {
      console.log('❌ Erreur lors de la mise à jour:', updateResponse.data.error)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message)
  }
}

// Exécuter le test
testPatientUpdate() 