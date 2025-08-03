const axios = require('axios')

const API_BASE_URL = 'http://localhost:8000'

async function testDashboardErrors() {
  console.log('🔍 Diagnostic des erreurs 500 sur les routes dashboard...\n')

  try {
    // Test 1: Route overview (qui fonctionne)
    console.log('1️⃣ Test de /api/dashboard/overview (devrait fonctionner)...')
    const overviewResponse = await axios.get(`${API_BASE_URL}/api/dashboard/overview`)
    console.log('✅ Overview OK:', overviewResponse.status)
    console.log('')

    // Test 2: Route recent-patients (erreur 500)
    console.log('2️⃣ Test de /api/dashboard/recent-patients (erreur 500)...')
    try {
      const patientsResponse = await axios.get(`${API_BASE_URL}/api/dashboard/recent-patients?limit=5`)
      console.log('✅ Recent patients OK:', patientsResponse.status)
    } catch (error) {
      console.log('❌ Erreur recent-patients:', error.response?.status)
      console.log('Détails:', error.response?.data)
    }
    console.log('')

    // Test 3: Route statistics (erreur 500)
    console.log('3️⃣ Test de /api/dashboard/statistics (erreur 500)...')
    try {
      const statsResponse = await axios.get(`${API_BASE_URL}/api/dashboard/statistics`)
      console.log('✅ Statistics OK:', statsResponse.status)
    } catch (error) {
      console.log('❌ Erreur statistics:', error.response?.status)
      console.log('Détails:', error.response?.data)
    }
    console.log('')

    // Test 4: Route alerts (devrait fonctionner)
    console.log('4️⃣ Test de /api/dashboard/alerts...')
    const alertsResponse = await axios.get(`${API_BASE_URL}/api/dashboard/alerts?limit=5`)
    console.log('✅ Alerts OK:', alertsResponse.status)
    console.log('')

  } catch (error) {
    console.error('❌ Erreur générale:', error.message)
  }
}

testDashboardErrors() 