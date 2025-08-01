// Charger les variables d'environnement
require('dotenv').config({ path: './config.env' })

const axios = require('axios')

const API_BASE_URL = 'http://localhost:8000/api/monitoring'

async function testMonitoringEndpoints() {
  console.log('🧪 Test des endpoints de monitoring...\n')

  const endpoints = [
    { name: 'Asterisk', url: '/asterisk' },
    { name: 'Base de données Hôpital', url: '/hospital-db' },
    { name: 'Base de données HelloJADE', url: '/hellojade-db' },
    { name: 'Active Directory', url: '/active-directory' },
    { name: 'Métriques système', url: '/system-metrics' }
  ]

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Test de ${endpoint.name}...`)
      const startTime = Date.now()
      
      const response = await axios.get(`${API_BASE_URL}${endpoint.url}`, {
        timeout: 10000
      })
      
      const responseTime = Date.now() - startTime
      
      console.log(`✅ ${endpoint.name}:`)
      console.log(`   Status: ${response.status}`)
      console.log(`   Temps de réponse: ${responseTime}ms`)
      console.log(`   Données:`, JSON.stringify(response.data, null, 2))
      console.log('')
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}:`)
      if (error.response) {
        console.log(`   Status: ${error.response.status}`)
        console.log(`   Erreur: ${error.response.data.error || error.response.data.message}`)
      } else if (error.request) {
        console.log(`   Erreur: Pas de réponse du serveur`)
      } else {
        console.log(`   Erreur: ${error.message}`)
      }
      console.log('')
    }
  }
}

// Test de performance
async function testPerformance() {
  console.log('📊 Test de performance...\n')
  
  try {
    const startTime = Date.now()
    const response = await axios.get(`${API_BASE_URL}/system-metrics`)
    const totalTime = Date.now() - startTime
    
    console.log(`✅ Métriques système récupérées en ${totalTime}ms`)
    console.log(`   Nombre de métriques: ${response.data.metrics.length}`)
    console.log(`   Données de performance: ${Object.keys(response.data.performance).length} séries`)
    console.log('')
    
  } catch (error) {
    console.log(`❌ Erreur lors du test de performance: ${error.message}`)
    console.log('')
  }
}

// Test de stress (simulation de plusieurs requêtes simultanées)
async function testStress() {
  console.log('🔥 Test de stress (10 requêtes simultanées)...\n')
  
  const promises = []
  for (let i = 0; i < 10; i++) {
    promises.push(
      axios.get(`${API_BASE_URL}/system-metrics`)
        .then(response => ({ success: true, time: Date.now() }))
        .catch(error => ({ success: false, error: error.message, time: Date.now() }))
    )
  }
  
  try {
    const results = await Promise.all(promises)
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    
    console.log(`✅ Test de stress terminé:`)
    console.log(`   Requêtes réussies: ${successful}/10`)
    console.log(`   Requêtes échouées: ${failed}/10`)
    console.log(`   Taux de succès: ${(successful / 10 * 100).toFixed(1)}%`)
    console.log('')
    
  } catch (error) {
    console.log(`❌ Erreur lors du test de stress: ${error.message}`)
    console.log('')
  }
}

// Fonction principale
async function runTests() {
  console.log('🚀 Démarrage des tests de monitoring...\n')
  
  await testMonitoringEndpoints()
  await testPerformance()
  await testStress()
  
  console.log('✅ Tous les tests sont terminés')
}

// Exécuter les tests
runTests()
  .then(() => {
    console.log('\n🎉 Tests terminés avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Erreur lors des tests:', error.message)
    process.exit(1)
  }) 