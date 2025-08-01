const axios = require('axios')

async function testOracleAPI() {
  console.log('🔍 Test de l\'API Oracle')
  console.log('========================')
  
  try {
    console.log('📡 Test de l\'endpoint /api/monitoring/hospital-db...')
    const response = await axios.get('http://localhost:8000/api/monitoring/hospital-db')
    
    console.log('✅ Réponse reçue:')
    console.log('  Status:', response.status)
    console.log('  Status DB:', response.data.status)
    console.log('  Temps de réponse:', response.data.responseTime + 'ms')
    console.log('  Uptime:', response.data.uptime + '%')
    console.log('  Message:', response.data.message)
    
    if (response.data.totalRecords) {
      console.log('  Enregistrements totaux:', response.data.totalRecords)
      console.log('  Chambres occupées:', response.data.occupiedRooms)
      console.log('  Hospitalisations actives:', response.data.activeHospitalizations)
      
      if (response.data.tableStats) {
        console.log('  Statistiques par table:')
        Object.entries(response.data.tableStats).forEach(([table, count]) => {
          console.log(`    ${table}: ${count} enregistrements`)
        })
      }
    }
    
    console.log('\n🎉 Test réussi ! L\'API Oracle fonctionne parfaitement.')
    
  } catch (error) {
    console.log('❌ Erreur lors du test de l\'API:')
    if (error.response) {
      console.log('  Status:', error.response.status)
      console.log('  Données:', error.response.data)
    } else {
      console.log('  Erreur:', error.message)
    }
  }
}

testOracleAPI() 