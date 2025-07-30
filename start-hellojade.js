const { exec } = require('child_process')
const { spawn } = require('child_process')
const path = require('path')

console.log('🚀 Démarrage de HelloJADE...')

async function startHelloJADE() {
  try {
    // 1. Démarrer Docker Compose
    console.log('📦 Démarrage des conteneurs Docker...')
    await runCommand('docker-compose up -d')
    
    // 2. Attendre que PostgreSQL soit prêt
    console.log('⏳ Attente du démarrage de PostgreSQL...')
    await wait(10000) // 10 secondes
    
    // 3. Installer les dépendances si nécessaire
    console.log('📦 Vérification des dépendances...')
    await runCommand('npm install')
    
    // 4. Démarrer le serveur backend
    console.log('🔧 Démarrage du serveur backend...')
    const backendProcess = spawn('node', ['server.js'], {
      stdio: 'inherit',
      cwd: path.join(__dirname, 'backend')
    })
    
    // 5. Attendre un peu puis démarrer le frontend
    await wait(3000)
    console.log('🎨 Démarrage du frontend...')
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '../frontend')
    })
    
    console.log('✅ HelloJADE démarré avec succès!')
    console.log('📊 Backend: http://localhost:8000')
    console.log('🌐 Frontend: http://localhost:5173')
    console.log('📊 Page Appels: http://localhost:5173/calls')
    console.log('🗄️ PostgreSQL: localhost:5432')
    
    // Gestion de l'arrêt propre
    process.on('SIGINT', () => {
      console.log('\n🛑 Arrêt de HelloJADE...')
      backendProcess.kill()
      frontendProcess.kill()
      process.exit(0)
    })
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error)
    process.exit(1)
  }
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Erreur: ${error.message}`)
        reject(error)
        return
      }
      if (stderr) {
        console.warn(`⚠️ Avertissement: ${stderr}`)
      }
      if (stdout) {
        console.log(`📝 ${stdout}`)
      }
      resolve()
    })
  })
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

startHelloJADE() 