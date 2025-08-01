const { checkAsterisk } = require('./routes/monitoring-asterisk')

// Configuration depuis les variables d'environnement
require('dotenv').config({ path: './config.env' })

async function testAsteriskConnection() {
  console.log('🧪 Test de connexion Asterisk AMI')
  console.log('=====================================')
  
  try {
    console.log('📡 Tentative de connexion...')
    const result = await checkAsterisk()
    
    console.log('✅ Connexion réussie!')
    console.log('📊 Résultats:')
    console.log(`   - Statut: ${result.status}`)
    console.log(`   - Temps de réponse: ${result.responseTime}ms`)
    console.log(`   - Uptime: ${result.uptime}%`)
    console.log(`   - Appels actifs: ${result.activeCalls}`)
    console.log(`   - Statut Zadarma: ${result.zadarmaStatus}`)
    console.log(`   - Message: ${result.message}`)
    
  } catch (error) {
    console.error('❌ Échec de la connexion:')
    console.error(`   - Erreur: ${error.message}`)
    
    // Vérifier si le conteneur Docker est en cours d'exécution
    const { exec } = require('child_process')
    exec('docker ps --filter "name=hellojade-asterisk"', (err, stdout) => {
      if (err) {
        console.error('❌ Impossible de vérifier les conteneurs Docker')
        return
      }
      
      if (stdout.includes('hellojade-asterisk')) {
        console.log('✅ Conteneur Asterisk détecté')
        console.log('💡 Suggestions:')
        console.log('   1. Vérifiez que Asterisk est démarré dans le conteneur')
        console.log('   2. Vérifiez les logs: docker logs hellojade-asterisk')
        console.log('   3. Vérifiez la configuration AMI dans manager.conf')
      } else {
        console.log('❌ Conteneur Asterisk non trouvé')
        console.log('💡 Démarrez le conteneur: docker-compose up -d asterisk')
      }
    })
  }
}

// Exécuter le test
testAsteriskConnection() 