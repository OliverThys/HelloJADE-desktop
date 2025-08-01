const { spawn } = require('child_process')
const path = require('path')

console.log('🚀 Démarrage de HelloJADE...')

async function startHelloJADE() {
  try {
    // 1. Installer les dépendances backend si nécessaire
    console.log('📦 Vérification des dépendances backend...')
    await runCommand('npm install', 'backend')
    
    // 2. Installer les dépendances frontend si nécessaire
    console.log('📦 Vérification des dépendances frontend...')
    await runCommand('npm install', 'frontend')
    
    // 3. Démarrer le serveur backend
    console.log('🔧 Démarrage du serveur backend...')
    const backendProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      cwd: path.join(__dirname, 'backend')
    })
    
    // 4. Attendre un peu puis démarrer le frontend
    await wait(3000)
    console.log('🎨 Démarrage du frontend...')
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      cwd: path.join(__dirname, 'frontend')
    })
    
    console.log('✅ HelloJADE démarré avec succès!')
    console.log('📊 Backend: http://localhost:8000')
    console.log('🌐 Frontend: http://localhost:5173')
    
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

function runCommand(command, cwd = '.') {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process')
    exec(command, { cwd: path.join(__dirname, cwd) }, (error, stdout, stderr) => {
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