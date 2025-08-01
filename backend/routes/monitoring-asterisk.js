const net = require('net')
const { exec } = require('child_process')

// Configuration AMI (Asterisk Manager Interface)
const AMI_CONFIG = {
  host: process.env.ASTERISK_HOST || 'localhost',
  port: process.env.ASTERISK_AMI_PORT || 5038,
  username: process.env.ASTERISK_AMI_USERNAME || 'hellojade',
  password: process.env.ASTERISK_AMI_PASSWORD || 'hellojade123',
  timeout: 5000
}

class AsteriskMonitor {
  constructor(config = AMI_CONFIG) {
    this.config = config
    this.socket = null
    this.connected = false
    this.loginSent = false
    this.responseBuffer = ''
  }

  connect() {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      
      this.socket = new net.Socket()
      this.socket.setTimeout(this.config.timeout)

      this.socket.on('connect', () => {
        console.log('✅ AMI: Connecté au serveur Asterisk')
        this.connected = true
      })

      this.socket.on('data', (data) => {
        this.responseBuffer += data.toString()
        
        // Vérifier si on a reçu le message de bienvenue
        if (this.responseBuffer.includes('Asterisk Call Manager') && !this.loginSent) {
          this.loginSent = true
          this.sendLogin()
        }
        
        // Vérifier la réponse de login
        if (this.responseBuffer.includes('Response: Success') && this.responseBuffer.includes('Message: Authentication accepted')) {
          const responseTime = Date.now() - startTime
          this.disconnect()
          resolve({
            status: 'online',
            responseTime,
            message: 'Asterisk opérationnel et authentifié'
          })
        }
        
        // Vérifier les erreurs d'authentification
        if (this.responseBuffer.includes('Response: Error') || this.responseBuffer.includes('Authentication failed')) {
          this.disconnect()
          reject(new Error('Authentification AMI échouée'))
        }
      })

      this.socket.on('timeout', () => {
        this.disconnect()
        reject(new Error('Timeout de connexion AMI'))
      })

      this.socket.on('error', (err) => {
        this.disconnect()
        reject(new Error(`Erreur de connexion AMI: ${err.message}`))
      })

      this.socket.connect(this.config.port, this.config.host)
    })
  }

  sendLogin() {
    const loginCommand = [
      'Action: Login',
      `Username: ${this.config.username}`,
      `Secret: ${this.config.password}`,
      '',
      ''
    ].join('\r\n')
    
    console.log('🔐 AMI: Envoi des identifiants')
    this.socket.write(loginCommand)
  }

  disconnect() {
    if (this.socket) {
      this.socket.destroy()
      this.socket = null
    }
    this.connected = false
    this.loginSent = false
    this.responseBuffer = ''
  }

  async getStatus() {
    try {
      const result = await this.connect()
      
      // Essayer de récupérer plus d'informations via une nouvelle connexion
      const detailedInfo = await this.getDetailedStatus()
      
      return {
        ...result,
        ...detailedInfo,
        uptime: 99.8 // Vous pouvez calculer cela basé sur vos logs
      }
    } catch (error) {
      throw error
    }
  }

  async getDetailedStatus() {
    return new Promise((resolve) => {
      const socket = new net.Socket()
      socket.setTimeout(this.config.timeout)
      
      let responseBuffer = ''
      let loginSent = false
      let commandSent = false
      let sipPeers = []
      let activeCalls = 0
      
      socket.on('data', (data) => {
        responseBuffer += data.toString()
        
        // Envoyer le login
        if (responseBuffer.includes('Asterisk Call Manager') && !loginSent) {
          loginSent = true
          const loginCommand = [
            'Action: Login',
            `Username: ${this.config.username}`,
            `Secret: ${this.config.password}`,
            '',
            ''
          ].join('\r\n')
          socket.write(loginCommand)
        }
        
        // Une fois authentifié, envoyer les commandes
        if (responseBuffer.includes('Authentication accepted') && !commandSent) {
          commandSent = true
          
          // Commande pour obtenir le statut des peers SIP
          const sipCommand = [
            'Action: Command',
            'Command: sip show peers',
            '',
            ''
          ].join('\r\n')
          socket.write(sipCommand)
          
          // Commande pour obtenir les appels actifs
          setTimeout(() => {
            const callsCommand = [
              'Action: Command',
              'Command: core show channels count',
              '',
              ''
            ].join('\r\n')
            socket.write(callsCommand)
          }, 100)
          
          // Fermer après un délai
          setTimeout(() => {
            socket.destroy()
          }, 500)
        }
        
        // Parser les résultats
        if (responseBuffer.includes('sip show peers')) {
          const lines = responseBuffer.split('\n')
          lines.forEach(line => {
            if (line.includes('zadarma') && line.includes('OK')) {
              sipPeers.push({
                name: 'zadarma',
                status: 'online',
                latency: line.match(/\((\d+) ms\)/)?.[1] || 'N/A'
              })
            }
          })
        }
        
        if (responseBuffer.includes('active calls')) {
          const match = responseBuffer.match(/(\d+) active calls?/)
          if (match) {
            activeCalls = parseInt(match[1])
          }
        }
      })
      
      socket.on('close', () => {
        resolve({
          sipPeers,
          activeCalls,
          zadarmaStatus: sipPeers.find(p => p.name === 'zadarma')?.status || 'offline'
        })
      })
      
      socket.on('error', () => {
        resolve({
          sipPeers: [],
          activeCalls: 0,
          zadarmaStatus: 'unknown'
        })
      })
      
      socket.connect(this.config.port, this.config.host)
    })
  }
}

// Fonction pour vérifier Asterisk
async function checkAsterisk() {
  const monitor = new AsteriskMonitor()
  
  try {
    const status = await monitor.getStatus()
    return {
      status: status.status,
      uptime: status.uptime,
      activeCalls: status.activeCalls || 0,
      zadarmaStatus: status.zadarmaStatus || 'checking',
      message: status.message,
      responseTime: status.responseTime
    }
  } catch (error) {
    // Si Asterisk n'est pas accessible, vérifier si le conteneur Docker est en cours d'exécution
    const isDockerRunning = await checkDockerContainer()
    
    if (!isDockerRunning) {
      throw new Error('Conteneur Asterisk non démarré')
    } else {
      throw new Error(`Asterisk inaccessible: ${error.message}`)
    }
  }
}

// Vérifier si le conteneur Docker est en cours d'exécution
async function checkDockerContainer() {
  return new Promise((resolve) => {
    exec('docker ps --filter "name=hellojade-asterisk" --format "{{.Status}}"', (error, stdout) => {
      if (error || !stdout.includes('Up')) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

module.exports = {
  AsteriskMonitor,
  checkAsterisk,
  AMI_CONFIG
}