const { checkAsterisk, startSimulator, stopSimulator } = require('./routes/monitoring-asterisk-simulator')

// Configuration depuis les variables d'environnement
require('dotenv').config({ path: './config.env' })

async function testSimulator() {
  console.log('🧪 Test du simulateur Asterisk')
  console.log('================================')
  
  try {
    console.log('🚀 Démarrage du simulateur...')
    await startSimulator()
    
    console.log('📡 Test de connexion AMI...')
    const result = await checkAsterisk()
    
    console.log('✅ Test réussi!')
    console.log('📊 Résultats:')
    console.log(`   - Statut: ${result.status}`)
    console.log(`   - Temps de réponse: ${result.responseTime}ms`)
    console.log(`   - Uptime: ${result.uptime}%`)
    console.log(`   - Appels actifs: ${result.activeCalls}`)
    console.log(`   - Statut Zadarma: ${result.zadarmaStatus}`)
    console.log(`   - Message: ${result.message}`)
    
    console.log('\n🎯 Test de l\'API de monitoring...')
    
    // Simuler une requête API
    const express = require('express')
    const app = express()
    const monitoringRouter = require('./routes/monitoring')
    
    app.use('/api/monitoring', monitoringRouter)
    
    // Test de la route Asterisk
    const request = require('supertest')
    const response = await request(app)
      .get('/api/monitoring/asterisk')
      .expect(200)
    
    console.log('✅ API de monitoring fonctionnelle!')
    console.log('📊 Réponse API:', response.body)
    
  } catch (error) {
    console.error('❌ Test échoué:')
    console.error(`   - Erreur: ${error.message}`)
  } finally {
    console.log('\n🛑 Arrêt du simulateur...')
    stopSimulator()
    console.log('✅ Test terminé')
  }
}

// Exécuter le test
testSimulator() 