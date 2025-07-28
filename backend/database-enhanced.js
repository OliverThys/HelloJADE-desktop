const oracledb = require('oracledb')
require('dotenv').config({ path: './config.env' })

// Configuration Oracle avec retry
const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE}`,
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1,
  charset: 'AL32UTF8',
  // Timeouts plus longs pour la VM
  poolTimeout: 120,
  queueTimeout: 120000,
  connectTimeout: 60000,
  transportConnectTimeout: 60000,
  // Configuration de connexion
  events: false,
  externalAuth: false,
  // Retry configuration
  retryCount: 3,
  retryDelay: 2000
}

let pool = null
let isInitialized = false

// Log de la configuration (sans le mot de passe)
console.log('🔧 Configuration Oracle:', {
  host: process.env.ORACLE_HOST,
  port: process.env.ORACLE_PORT,
  service: process.env.ORACLE_SERVICE,
  user: process.env.ORACLE_USER,
  connectString: dbConfig.connectString
})

// Fonction de retry avec délai
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Initialiser le pool de connexions avec retry
async function initialize() {
  if (isInitialized) {
    console.log('ℹ️ Pool déjà initialisé')
    return
  }

  for (let attempt = 1; attempt <= dbConfig.retryCount; attempt++) {
    try {
      console.log(`🔄 Tentative de connexion à Oracle (${attempt}/${dbConfig.retryCount})...`)
      
      // Vérifier si un pool existe déjà
      try {
        const existingPool = oracledb.getPool()
        if (existingPool) {
          console.log('⚠️ Pool existant détecté, fermeture...')
          await existingPool.close(10)
        }
      } catch (poolError) {
        console.log('ℹ️ Aucun pool existant détecté')
      }
      
      // Initialiser le client Oracle
      try {
        oracledb.initOracleClient()
        console.log('✅ Client Oracle initialisé')
      } catch (clientError) {
        console.log('⚠️ Client Oracle déjà initialisé ou non nécessaire')
      }
      
      pool = await oracledb.createPool(dbConfig)
      isInitialized = true
      
      console.log('✅ Pool de connexion Oracle créé avec succès')
      console.log(`📊 Connecté à ${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE}`)
      
      // Test de connexion immédiat
      const testConnection = await pool.getConnection()
      await testConnection.execute('SELECT 1 FROM DUAL')
      await testConnection.close()
      console.log('✅ Test de connexion réussi')
      
      return
      
    } catch (err) {
      console.error(`❌ Tentative ${attempt} échouée:`, err.message)
      
      if (attempt < dbConfig.retryCount) {
        console.log(`⏳ Nouvelle tentative dans ${dbConfig.retryDelay}ms...`)
        await delay(dbConfig.retryDelay)
      } else {
        console.error('❌ Toutes les tentatives de connexion ont échoué')
        console.error('🔍 Vérifiez que:')
        console.error('   - La VM Windows Server est accessible sur', process.env.ORACLE_HOST)
        console.error('   - Oracle Database 21c XE est démarré')
        console.error('   - Le port 1521 est ouvert')
        console.error('   - L\'utilisateur', process.env.ORACLE_USER, 'existe')
        console.error('   - Le service', process.env.ORACLE_SERVICE, 'est enregistré')
        throw err
      }
    }
  }
}

// Obtenir une connexion du pool avec retry
async function getConnection() {
  if (!isInitialized) {
    await initialize()
  }
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`🔗 Obtention d'une connexion (${attempt}/3)...`)
      const connection = await pool.getConnection()
      console.log('✅ Connexion obtenue avec succès')
      return connection
    } catch (err) {
      console.error(`❌ Tentative ${attempt} d'obtention de connexion échouée:`, err.message)
      
      if (attempt < 3) {
        console.log('⏳ Nouvelle tentative...')
        await delay(1000)
      } else {
        console.error('❌ Impossible d\'obtenir une connexion après 3 tentatives')
        throw err
      }
    }
  }
}

// Fermer le pool
async function closePool() {
  try {
    if (pool) {
      await pool.close(10)
      pool = null
      isInitialized = false
      console.log('✅ Pool Oracle fermé')
    }
  } catch (err) {
    console.error('❌ Erreur lors de la fermeture du pool:', err)
  }
}

// Exécuter une requête avec gestion d'erreur améliorée
async function executeQuery(sql, binds = [], options = {}) {
  let connection
  try {
    connection = await getConnection()
    
    const defaultOptions = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true
    }
    
    console.log('🔍 Exécution de la requête SQL...')
    console.log('📝 SQL:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''))
    console.log('🔗 Binds:', binds)
    
    const result = await connection.execute(sql, binds, { ...defaultOptions, ...options })
    
    console.log(`✅ Requête exécutée avec succès - ${result.rows?.length || 0} lignes retournées`)
    return result.rows || []
    
  } catch (err) {
    console.error('❌ Erreur lors de l\'exécution de la requête:', err)
    console.error('🔍 Code d\'erreur:', err.code)
    console.error('🔍 Message:', err.message)
    
    // Gestion spécifique des erreurs Oracle
    if (err.code === 'NJS-518') {
      throw new Error('Service Oracle non accessible. Vérifiez que la base de données est démarrée.')
    } else if (err.code === 'ORA-00942') {
      throw new Error('Table ou vue inexistante. Vérifiez la structure de la base de données.')
    } else if (err.code === 'ORA-00904') {
      throw new Error('Colonne inexistante. Vérifiez la structure de la table.')
    } else if (err.code === 'ORA-01017') {
      throw new Error('Identifiants de connexion invalides.')
    }
    
    throw err
  } finally {
    if (connection) {
      try {
        await connection.close()
      } catch (err) {
        console.error('❌ Erreur lors de la fermeture de la connexion:', err)
      }
    }
  }
}

// Vérifier la santé de la base de données
async function checkHealth() {
  try {
    const result = await executeQuery('SELECT 1 as health FROM DUAL')
    return {
      status: 'healthy',
      message: 'Base de données accessible',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

module.exports = {
  initialize,
  getConnection,
  closePool,
  executeQuery,
  checkHealth,
  isInitialized: () => isInitialized
} 