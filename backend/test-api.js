const axios = require('axios')

async function testAPI() {
  try {
    console.log('🧪 Test de l\'API HelloJADE...')
    
    // Test 1: Endpoint de santé
    console.log('\n1️⃣ Test de l\'endpoint de santé...')
    const healthResponse = await axios.get('http://localhost:8000/api/health')
    console.log('✅ Santé:', healthResponse.data)
    
    // Test 2: Endpoint des appels
    console.log('\n2️⃣ Test de l\'endpoint des appels...')
    const callsResponse = await axios.get('http://localhost:8000/api/calls')
    console.log('✅ Appels:', callsResponse.data)
    
    if (callsResponse.data.success) {
      const patients = callsResponse.data.data.items
      console.log(`📊 ${patients.length} patients récupérés`)
      
      if (patients.length > 0) {
        console.log('\n📋 Premier patient:')
        console.log(JSON.stringify(patients[0], null, 2))
      }
    }
    
    // Test 3: Test avec paramètres
    console.log('\n3️⃣ Test avec paramètres de recherche...')
    const searchResponse = await axios.get('http://localhost:8000/api/calls', {
      params: {
        page: 1,
        per_page: 5,
        search: 'Thys'
      }
    })
    console.log('✅ Recherche "Thys":', searchResponse.data)
    
    console.log('\n🎉 Tous les tests API sont réussis !')
    
  } catch (error) {
    console.error('❌ Erreur lors du test API:', error.message)
    if (error.response) {
      console.error('📄 Réponse:', error.response.data)
      console.error('📊 Status:', error.response.status)
    }
  }
}

// Exécuter le test
testAPI() 