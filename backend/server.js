const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const { initialize, closePool } = require('./database')

const app = express()
const PORT = process.env.PORT || 8000

// Middleware de sécurité
app.use(helmet())

// Middleware CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}))

// Middleware de logging
app.use(morgan('combined'))

// Middleware pour parser le JSON
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/calls', require('./routes/calls'))

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'HelloJADE API - Backend opérationnel',
    timestamp: new Date().toISOString(),
    database: 'Oracle connecté'
  })
})

// Route racine
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'HelloJADE Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      calls: '/api/calls'
    }
  })
})

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  })
})

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err)
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  })
})

// Initialiser la base de données et démarrer le serveur
async function startServer() {
  try {
    // Initialiser la connexion Oracle
    await initialize()
    
    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur HelloJADE démarré sur le port ${PORT}`)
      console.log(`📊 API disponible sur http://localhost:${PORT}`)
      console.log(`🔗 Frontend attendu sur ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`)
    })
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error)
    process.exit(1)
  }
}

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...')
  await closePool()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Arrêt du serveur...')
  await closePool()
  process.exit(0)
})

// Démarrer le serveur
startServer() 