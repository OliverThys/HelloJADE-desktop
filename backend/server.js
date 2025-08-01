// Charger les variables d'environnement
require('dotenv').config({ path: './config.env' })

const express = require('express')
const cors = require('cors')
const path = require('path')
const authRoutes = require('./routes/auth')
const monitoringRoutes = require('./routes/monitoring')

const app = express()
const PORT = process.env.PORT || 8000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes API
app.use('/api/auth', authRoutes)
app.use('/api/monitoring', monitoringRoutes)

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