const axios = require('axios')
const { Pool } = require('pg')
require('dotenv').config({ path: './backend/config.env' })

const API_BASE_URL = 'http://localhost:8000/api'

async function testAllPatients() {
  console.log('🧪 Test du chargement de tous les patients...\n')
  
  try {
    // Test 1: Récupérer tous les patients via l'API
    console.log('1. Test GET /calls (tous les patients)')
    const callsResponse = await axios.get(`${API_BASE_URL}/calls`)
    console.log('✅ Statut:', callsResponse.status)
    console.log('📊 Nombre de patients chargés:', callsResponse.data.data?.length || 0)
    console.log('📄 Pagination:', callsResponse.data.pagination ? 'OK' : 'MANQUANT')
    
    if (callsResponse.data.pagination) {
      console.log('   - Page:', callsResponse.data.pagination.page)
      console.log('   - Total patients:', callsResponse.data.pagination.total)
      console.log('   - TotalPages:', callsResponse.data.pagination.totalPages)
    }
    
    // Test 2: Vérifier les statistiques
    console.log('\n2. Test GET /calls/stats/overview')
    const statsResponse = await axios.get(`${API_BASE_URL}/calls/stats/overview`)
    console.log('✅ Statut:', statsResponse.status)
    console.log('📈 Statistiques:', statsResponse.data.data.overview)
    
    // Test 3: Compter les patients en base
    console.log('\n3. Vérification en base de données')
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'hellojade',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    })
    
    const client = await pool.connect()
    
    // Compter tous les patients
    const patientsCount = await client.query('SELECT COUNT(*) as count FROM patients')
    console.log('📊 Total patients en base:', patientsCount.rows[0].count)
    
    // Compter les appels
    const callsCount = await client.query('SELECT COUNT(*) as count FROM calls')
    console.log('📞 Total appels en base:', callsCount.rows[0].count)
    
    // Vérifier quelques patients sans appel
    const patientsWithoutCalls = await client.query(`
      SELECT COUNT(*) as count 
      FROM patients p 
      LEFT JOIN calls c ON p.id = c.patient_id 
      WHERE c.id IS NULL
    `)
    console.log('👥 Patients sans appel:', patientsWithoutCalls.rows[0].count)
    
    client.release()
    await pool.end()
    
    // Test 4: Vérifier que les filtres fonctionnent
    console.log('\n4. Test des filtres')
    const filtersResponse = await axios.get(`${API_BASE_URL}/calls?limit=10`)
    console.log('✅ Filtres disponibles:', filtersResponse.data.filters)
    
    console.log('\n🎉 Test terminé avec succès!')
    console.log('\n📋 Résumé:')
    console.log(`   - Patients en base: ${patientsCount.rows[0].count}`)
    console.log(`   - Patients chargés via API: ${callsResponse.data.data?.length || 0}`)
    console.log(`   - Appels en base: ${callsCount.rows[0].count}`)
    console.log(`   - Patients sans appel: ${patientsWithoutCalls.rows[0].count}`)
    
    if (callsResponse.data.data?.length === parseInt(patientsCount.rows[0].count)) {
      console.log('✅ Tous les patients sont bien chargés!')
    } else {
      console.log('⚠️ Il y a une différence entre les patients en base et ceux chargés')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Assurez-vous que le serveur backend est démarré sur le port 8000')
      console.log('   Commande: cd backend && npm start')
    }
  }
}

if (require.main === module) {
  testAllPatients().catch(console.error)
} 