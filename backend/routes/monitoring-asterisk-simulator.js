// Simulateur Asterisk pour tests sans Docker
const net = require('net')

// Configuration AMI simulée
const AMI_CONFIG = {
  host: process.env.ASTERISK_HOST || 'localhost',
  port: process.env.ASTERISK_AMI_PORT || 5038,
  username: process.env.ASTERISK_AMI_USERNAME || 'hellojade',
  password: process.env.ASTERISK_AMI_PASSWORD || 'hellojade123',
  timeout: 5000
}

class AsteriskSimulator {
  constructor(config = AMI_CONFIG) {
    this.config = config
    this.server = null
    this.isRunning = false
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => {
        console.log('📞 Simulateur: Connexion AMI reçue')
        
        socket.on('data', (data) => {
          const request = data.toString()
          console.log('📨 Simulateur: Requête reçue:', request.trim())
          
          if (request.includes('Action: Login')) {
            // Simuler l'authentification
            const response = [
              'Response: Success',
              'Message: Authentication accepted',
              '',
              ''
            ].join('\r\n')
            
            socket.write(response)
            console.log('✅ Simulateur: Authentification réussie')
          } else if (request.includes('Action: Command')) {
            // Simuler les commandes
            let response = ''
            
            if (request.includes('sip show peers')) {
              response = [
                'Response: Follows',
                'Privilege: Command',
                '--END COMMAND--',
                'zadarma/514666 (Unspecified) D  A  0        OK (50 ms)',
                '1 sip peers [Monitored: 1 online, 0 offline Unmonitored: 0 online, 0 offline]',
                '',
                ''
              ].join('\r\n')
            } else if (request.includes('core show channels count')) {
              response = [
                'Response: Follows',
                'Privilege: Command',
                '--END COMMAND--',
                '0 active calls',
                '',
                ''
              ].join('\r\n')
            }
            
            socket.write(response)
            console.log('📊 Simulateur: Commande exécutée')
          }
        })
        
        socket.on('close', () => {
          console.log('📞 Simulateur: Connexion fermée')
        })
      })
      
      this.server.listen(this.config.port, this.config.host, () => {
        this.isRunning = true
        console.log(`🚀 Simulateur Asterisk démarré sur ${this.config.host}:${this.config.port}`)
        resolve()
      })
      
      this.server.on('error', (err) => {
        console.error('❌ Simulateur: Erreur:', err.message)
        reject(err)
      })
    })
  }

  stop() {
    if (this.server) {
      this.server.close()
      this.isRunning = false
      console.log('🛑 Simulateur Asterisk arrêté')
    }
  }

  isRunning() {
    return this.isRunning
  }
}

// Instance globale du simulateur
let simulator = null

// Fonction pour démarrer le simulateur
async function startSimulator() {
  if (!simulator) {
    simulator = new AsteriskSimulator()
    await simulator.start()
  }
  return simulator
}

// Fonction pour vérifier Asterisk (utilise le simulateur si Docker n'est pas disponible)
async function checkAsterisk() {
  try {
    // Démarrer le simulateur si pas déjà fait
    await startSimulator()
    
    // Simuler un délai de connexion
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return {
      status: 'online',
      uptime: 99.8,
      activeCalls: 0,
      zadarmaStatus: 'online',
      message: 'Asterisk simulé opérationnel',
      responseTime: 45
    }
  } catch (error) {
    throw new Error(`Simulateur Asterisk inaccessible: ${error.message}`)
  }
}

// Fonction pour arrêter le simulateur
function stopSimulator() {
  if (simulator) {
    simulator.stop()
    simulator = null
  }
}

module.exports = {
  AsteriskSimulator,
  checkAsterisk,
  startSimulator,
  stopSimulator,
  AMI_CONFIG
} 