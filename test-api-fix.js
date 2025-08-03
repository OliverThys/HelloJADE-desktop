const axios = require('axios')

const API_BASE_URL = 'http://localhost:8000/api'

async function testAPIFix() {
  console.log('🧪 Test des corrections API...\n')
  
  try {
    // Test 1: Récupérer les appels (devrait fonctionner maintenant)
    console.log('1. Test GET /calls')
    const callsResponse = await axios.get(`${API_BASE_URL}/calls?limit=5`)
    console.log('✅ Statut:', callsResponse.status)
    console.log('📊 Nombre de patients:', callsResponse.data.data?.length || 0)
    console.log('📄 Pagination:', callsResponse.data.pagination ? 'OK' : 'MANQUANT')
    
    if (callsResponse.data.pagination) {
      console.log('   - Total patients:', callsResponse.data.pagination.total)
    }
    
    // Test 2: Récupérer les statistiques
    console.log('\n2. Test GET /calls/stats/overview')
    const statsResponse = await axios.get(`${API_BASE_URL}/calls/stats/overview`)
    console.log('✅ Statut:', statsResponse.status)
    console.log('📈 Statistiques:', statsResponse.data.data.overview)
    
    console.log('\n🎉 Tests réussis! L\'API fonctionne maintenant.')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Assurez-vous que le serveur backend est démarré sur le port 8000')
      console.log('   Commande: cd backend && npm start')
    }
  }
}

if (require.main === module) {
  testAPIFix().catch(console.error)
} 