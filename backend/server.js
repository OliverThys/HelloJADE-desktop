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
app.use('/api/auth', require('./routes/auth'))
app.use('/api/calls', require('./routes/calls'))
app.use('/api/patients', require('./routes/patients'))
app.use('/api/dashboard', require('./routes/dashboard'))

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
      calls: '/api/calls',
      patients: '/api/patients',
      dashboard: '/api/dashboard'
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
  console.error('❌ Erreur serveur:', err)
  console.error('🔍 Stack trace:', err.stack)
  console.error('📝 URL:', req.url)
  console.error('📝 Méthode:', req.method)
  console.error('📝 Headers:', req.headers)
  
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

// Initialiser la base de données et démarrer le serveur
async function startServer() {
  try {
    console.log('🔄 Démarrage du serveur HelloJADE...')
    
    // Initialiser la connexion Oracle
    console.log('🗄️ Initialisation de la base de données Oracle...')
    await initialize()
    console.log('✅ Base de données Oracle initialisée avec succès')
    
    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur HelloJADE démarré sur le port ${PORT}`)
      console.log(`📊 API disponible sur http://localhost:${PORT}`)
      console.log(`🔗 Frontend attendu sur ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`)
      console.log(`\n📋 Endpoints disponibles:`)
      console.log(`   • GET  /api/health - Santé du serveur`)
      console.log(`   • GET  /api/patients - Liste des patients`)
      console.log(`   • GET  /api/patients/:id - Détails d'un patient`)
      console.log(`   • GET  /api/patients/search/phone/:phone - Recherche par téléphone`)
      console.log(`   • GET  /api/patients/:id/hospitalisations - Hospitalisations d'un patient`)
      console.log(`   • GET  /api/patients/:id/consultations - Consultations d'un patient`)
      console.log(`   • GET  /api/patients/:id/transcriptions - Transcriptions d'un patient`)
      console.log(`   • GET  /api/patients/:id/analyses - Analyses IA d'un patient`)
      console.log(`   • GET  /api/dashboard/stats - Statistiques générales`)
      console.log(`   • GET  /api/dashboard/recent-activity - Activité récente`)
      console.log(`   • *    /api/calls - Routes téléphonie existantes`)
    })
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error)
    console.error('🔍 Stack trace:', error.stack)
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