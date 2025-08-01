const net = require('net')
require('dotenv').config({ path: './config.env' })

const AMI_CONFIG = {
  host: process.env.ASTERISK_HOST || 'localhost',
  port: process.env.ASTERISK_AMI_PORT || 5038,
  username: process.env.ASTERISK_AMI_USERNAME || 'hellojade',
  password: process.env.ASTERISK_AMI_PASSWORD || 'hellojade123',
  timeout: 5000
}

async function testAsteriskConnection() {
  console.log('🔍 Test de connexion AMI Asterisk...')
  console.log(`📍 Hôte: ${AMI_CONFIG.host}:${AMI_CONFIG.port}`)
  console.log(`👤 Utilisateur: ${AMI_CONFIG.username}`)
  
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    socket.setTimeout(AMI_CONFIG.timeout)
    
    let responseBuffer = ''
    let loginSent = false
    
    socket.on('connect', () => {
      console.log('✅ Connecté au serveur Asterisk')
    })
    
    socket.on('data', (data) => {
      responseBuffer += data.toString()
      console.log('📨 Données reçues:', data.toString().trim())
      
      // Envoyer le login après avoir reçu le message de bienvenue
      if (responseBuffer.includes('Asterisk Call Manager') && !loginSent) {
        loginSent = true
        const loginCommand = [
          'Action: Login',
          `Username: ${AMI_CONFIG.username}`,
          `Secret: ${AMI_CONFIG.password}`,
          '',
          ''
        ].join('\r\n')
        
        console.log('🔐 Envoi des identifiants...')
        socket.write(loginCommand)
      }
      
      // Vérifier la réponse de login
      if (responseBuffer.includes('Response: Success') && responseBuffer.includes('Authentication accepted')) {
        console.log('✅ Authentification réussie!')
        socket.destroy()
        resolve({ success: true, message: 'Connexion AMI réussie' })
      }
      
      // Vérifier les erreurs
      if (responseBuffer.includes('Response: Error') || responseBuffer.includes('Authentication failed')) {
        console.log('❌ Échec de l\'authentification')
        socket.destroy()
        reject(new Error('Authentification AMI échouée'))
      }
    })
    
    socket.on('timeout', () => {
      console.log('⏰ Timeout de connexion')
      socket.destroy()
      reject(new Error('Timeout de connexion AMI'))
    })
    
    socket.on('error', (err) => {
      console.log('❌ Erreur de connexion:', err.message)
      socket.destroy()
      reject(new Error(`Erreur de connexion AMI: ${err.message}`))
    })
    
    socket.on('close', () => {
      console.log('🔌 Connexion fermée')
    })
    
    // Se connecter
    socket.connect(AMI_CONFIG.port, AMI_CONFIG.host)
  })
}

// Exécuter le test
testAsteriskConnection()
  .then(result => {
    console.log('🎉 Test réussi:', result.message)
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Test échoué:', error.message)
    process.exit(1)
  }) 