// Charger les variables d'environnement
require('dotenv').config({ path: './config.env' })

const express = require('express')
const cors = require('cors')
const path = require('path')
const callsRoutes = require('./routes/calls')
const patientsRoutes = require('./routes/patients')
const authRoutes = require('./routes/auth')

const app = express()
const PORT = process.env.PORT || 8000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes API
app.use('/api/auth', authRoutes)
app.use('/api/calls', callsRoutes)
app.use('/api/patients', patientsRoutes)

// Route de test
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'HelloJADE API - Backend opérationnel',
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL'
  })
})

// Servir les fichiers statiques du frontend (pour le développement)
app.use(express.static(path.join(__dirname, '../frontend/dist')))

// Route catch-all pour SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
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
app.listen(PORT, () => {
  console.log(`🚀 Serveur HelloJADE démarré sur le port ${PORT}`)
  console.log(`📊 API disponible sur http://localhost:${PORT}/api`)
  console.log(`🌐 Frontend disponible sur http://localhost:${PORT}`)
})

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...')
  process.exit(0)
})

module.exports = app