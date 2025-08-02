// Charger les variables d'environnement
require('dotenv').config({ path: './config.env' })

const express = require('express')
const cors = require('cors')
const path = require('path')
const authRoutes = require('./routes/auth')
const { router: monitoringRoutes } = require('./routes/monitoring')
const patientsRoutes = require('./routes/patients')
const syncService = require('./sync-service')

const app = express()
const PORT = process.env.PORT || 8000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes API
app.use('/api/auth', authRoutes)
app.use('/api/monitoring', monitoringRoutes)
app.use('/api/patients', patientsRoutes)

// Routes de synchronisation
app.get('/api/sync/status', (req, res) => {
  try {
    const status = syncService.getStatus()
    res.json({
      success: true,
      ...status
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

app.post('/api/sync/start', (req, res) => {
  try {
    syncService.start()
    res.json({
      success: true,
      message: 'Service de synchronisation démarré',
      status: syncService.getStatus()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

app.post('/api/sync/stop', (req, res) => {
  try {
    syncService.stop()
    res.json({
      success: true,
      message: 'Service de synchronisation arrêté',
      status: syncService.getStatus()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

app.post('/api/sync/force', async (req, res) => {
  try {
    await syncService.forceSync()
    res.json({
      success: true,
      message: 'Synchronisation forcée terminée',
      status: syncService.getStatus()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

app.post('/api/sync/interval', (req, res) => {
  try {
    const { minutes } = req.body
    if (!minutes || minutes < 1 || minutes > 60) {
      return res.status(400).json({
        success: false,
        error: 'Intervalle doit être entre 1 et 60 minutes'
      })
    }
    
    syncService.setInterval(minutes)
    res.json({
      success: true,
      message: `Intervalle modifié à ${minutes} minutes`,
      status: syncService.getStatus()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Route pour tester les performances
app.get('/api/performance/test', async (req, res) => {
  try {
    const PerformanceOptimizer = require('./performance-optimization')
    const optimizer = new PerformanceOptimizer()
    
    // Test de performance des requêtes
    const performanceResults = await optimizer.performanceTest()
    
    // Estimation des ressources
    const resourceEstimate = await optimizer.estimateResources()
    
    res.json({
      success: true,
      performance: performanceResults,
      resources: resourceEstimate,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Route de test
app.get('/api/health', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'HelloJADE API - Backend opérationnel',
      timestamp: new Date().toISOString(),
      status: 'OK',
      ldap_server: process.env.LDAP_SERVER,
      ldap_base_dn: process.env.LDAP_BASE_DN,
      port: PORT,
      env: process.env.NODE_ENV
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'HelloJADE API - Erreur serveur',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
})

// Route de test simple
app.get('/api/test', (req, res) => {
  res.json({ message: 'API accessible', timestamp: new Date().toISOString() })
})

// Gestion des erreurs
app.use((error, req, res, next) => {
  console.error('❌ Erreur serveur:', error)
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur',
    details: error.message
  })
})

// Démarrage du serveur
async function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Serveur HelloJADE démarré sur le port ${PORT}`)
      console.log(`📊 API disponible sur http://localhost:${PORT}/api`)
      console.log(`🌐 Frontend disponible sur http://localhost:${PORT}`)
      
      // Démarrage du service de synchronisation automatique
      console.log('🔄 Démarrage du service de synchronisation automatique...')
      syncService.start().catch(error => {
        console.error('❌ Erreur lors du démarrage du service de synchronisation:', error)
      })
    })
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error)
    process.exit(1)
  }
}

startServer()

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...')
  process.exit(0)
})

module.exports = app