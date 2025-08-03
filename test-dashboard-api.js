const axios = require('axios')

const API_BASE_URL = 'http://localhost:8000'

async function testDashboardAPI() {
  console.log('🧪 Test des routes Dashboard API...\n')

  try {
    // Test 1: Route overview
    console.log('1️⃣ Test de /api/dashboard/overview')
    const overviewResponse = await axios.get(`${API_BASE_URL}/api/dashboard/overview`)
    console.log('✅ Overview:', overviewResponse.data)
    console.log('')

    // Test 2: Route recent-patients
    console.log('2️⃣ Test de /api/dashboard/recent-patients')
    const patientsResponse = await axios.get(`${API_BASE_URL}/api/dashboard/recent-patients?limit=5`)
    console.log('✅ Patients récents:', patientsResponse.data)
    console.log('')

    // Test 3: Route statistics
    console.log('3️⃣ Test de /api/dashboard/statistics')
    const statsResponse = await axios.get(`${API_BASE_URL}/api/dashboard/statistics`)
    console.log('✅ Statistiques:', statsResponse.data)
    console.log('')

    // Test 4: Route alerts
    console.log('4️⃣ Test de /api/dashboard/alerts')
    const alertsResponse = await axios.get(`${API_BASE_URL}/api/dashboard/alerts?limit=5`)
    console.log('✅ Alertes:', alertsResponse.data)
    console.log('')

    console.log('🎉 Tous les tests sont passés avec succès!')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
    
    if (error.response) {
      console.error('Status:', error.response.status)
      console.error('Data:', error.response.data)
    }
    
    // Test de la route de santé
    try {
      console.log('\n🔍 Test de la route de santé...')
      const healthResponse = await axios.get(`${API_BASE_URL}/api/health`)
      console.log('✅ Health check:', healthResponse.data)
    } catch (healthError) {
      console.error('❌ Health check échoué:', healthError.message)
    }
  }
}

testDashboardAPI() 