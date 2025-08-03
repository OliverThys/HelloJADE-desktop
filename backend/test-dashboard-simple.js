const axios = require('axios')

const API_BASE_URL = 'http://localhost:8000'

async function testServer() {
  console.log('🧪 Test de connectivité du serveur...\n')

  try {
    // Test 1: Vérifier si le serveur répond
    console.log('1️⃣ Test de connectivité...')
    const healthResponse = await axios.get(`${API_BASE_URL}/api/health`)
    console.log('✅ Serveur accessible:', healthResponse.status)
    console.log('')

    // Test 2: Route de test simple
    console.log('2️⃣ Test de la route dashboard/test...')
    const testResponse = await axios.get(`${API_BASE_URL}/api/dashboard/test`)
    console.log('✅ Route test accessible:', testResponse.data)
    console.log('')

    // Test 3: Route overview
    console.log('3️⃣ Test de la route dashboard/overview...')
    const overviewResponse = await axios.get(`${API_BASE_URL}/api/dashboard/overview`)
    console.log('✅ Route overview accessible:', overviewResponse.data)
    console.log('')

    console.log('🎉 Tous les tests sont passés!')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
    
    if (error.response) {
      console.error('Status:', error.response.status)
      console.error('URL:', error.config?.url)
      console.error('Data:', error.response.data)
    }
    
    // Test de connectivité basique
    try {
      console.log('\n🔍 Test de connectivité basique...')
      const basicResponse = await axios.get(`${API_BASE_URL}`)
      console.log('✅ Serveur répond sur la racine:', basicResponse.status)
    } catch (basicError) {
      console.error('❌ Serveur ne répond pas du tout:', basicError.message)
    }
  }
}

testServer() 