const axios = require('axios')

const API_BASE_URL = 'http://localhost:8000/api'

async function testCallsAPI() {
  console.log('🧪 Test de l\'API des appels...')
  
  try {
    // Test 1: Récupérer tous les appels
    console.log('\n1. Test GET /calls')
    const callsResponse = await axios.get(`${API_BASE_URL}/calls`)
    console.log('✅ Statut:', callsResponse.status)
    console.log('📊 Nombre d\'appels:', callsResponse.data.data?.length || 0)
    console.log('📄 Pagination:', callsResponse.data.pagination ? 'OK' : 'MANQUANT')
    
    if (callsResponse.data.pagination) {
      console.log('   - Page:', callsResponse.data.pagination.page)
      console.log('   - Total:', callsResponse.data.pagination.total)
      console.log('   - TotalPages:', callsResponse.data.pagination.totalPages)
    }
    
    // Test 2: Récupérer les statistiques
    console.log('\n2. Test GET /calls/stats/overview')
    const statsResponse = await axios.get(`${API_BASE_URL}/calls/stats/overview`)
    console.log('✅ Statut:', statsResponse.status)
    console.log('📈 Statistiques:', statsResponse.data)
    
    // Test 3: Tester un appel spécifique
    if (callsResponse.data.data && callsResponse.data.data.length > 0) {
      const firstCall = callsResponse.data.data[0]
      console.log('\n3. Test GET /calls/:id')
      const callResponse = await axios.get(`${API_BASE_URL}/calls/${firstCall.id}`)
      console.log('✅ Statut:', callResponse.status)
      console.log('📞 Appel trouvé:', callResponse.data.id)
    }
    
    console.log('\n🎉 Tous les tests API sont passés avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Assurez-vous que le serveur backend est démarré sur le port 8000')
      console.log('   Commande: cd backend && npm start')
    }
  }
}

async function testDatabaseConnection() {
  console.log('\n🗄️ Test de connexion à la base de données...')
  
  try {
    const { Pool } = require('pg')
    require('dotenv').config({ path: './backend/config.env' })
    
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'hellojade',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    })
    
    const client = await pool.connect()
    
    // Test de connexion
    const result = await client.query('SELECT COUNT(*) as count FROM calls')
    console.log('✅ Connexion DB réussie')
    console.log('📊 Nombre d\'appels en base:', result.rows[0].count)
    
    client.release()
    await pool.end()
    
  } catch (error) {
    console.error('❌ Erreur de connexion DB:', error.message)
    console.log('\n💡 Assurez-vous que:')
    console.log('   1. PostgreSQL est démarré')
    console.log('   2. La base "hellojade" existe')
    console.log('   3. Les tables sont créées (node backend/create-calls-tables.js)')
  }
}

async function main() {
  console.log('🚀 Démarrage des tests de la page des appels...\n')
  
  await testDatabaseConnection()
  await testCallsAPI()
  
  console.log('\n✨ Tests terminés!')
  console.log('\n📋 Prochaines étapes:')
  console.log('   1. Démarrer le frontend: cd frontend && npm run dev')
  console.log('   2. Démarrer le backend: cd backend && npm start')
  console.log('   3. Ouvrir http://localhost:5173/calls')
}

if (require.main === module) {
  main().catch(console.error)
} 