const oracledb = require('oracledb')
require('dotenv').config({ path: './config.env' })

// Configuration Oracle
const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE}`,
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1,
  charset: 'AL32UTF8',
  // Augmenter les timeouts
  poolTimeout: 60,
  queueTimeout: 60000,
  // Timeouts de connexion
  connectTimeout: 60000,
  transportConnectTimeout: 60000,
  // Configuration de connexion
  events: false,
  externalAuth: false
}

// Log de la configuration (sans le mot de passe)
console.log('🔧 Configuration Oracle:', {
  host: process.env.ORACLE_HOST,
  port: process.env.ORACLE_PORT,
  service: process.env.ORACLE_SERVICE,
  user: process.env.ORACLE_USER,
  connectString: dbConfig.connectString
})

// Initialiser le pool de connexions
async function initialize() {
  try {
    console.log('🔄 Tentative de connexion à Oracle...')
    console.log('🔧 Configuration utilisée:', {
      host: process.env.ORACLE_HOST,
      port: process.env.ORACLE_PORT,
      service: process.env.ORACLE_SERVICE,
      user: process.env.ORACLE_USER,
      connectString: dbConfig.connectString
    })
    
    // Vérifier si un pool existe déjà de manière sécurisée
    try {
      const existingPool = oracledb.getPool()
      if (existingPool) {
        console.log('⚠️ Pool existant détecté, fermeture...')
        await existingPool.close(10)
        console.log('✅ Pool existant fermé')
      }
    } catch (poolError) {
      // Si getPool() échoue, c'est normal - aucun pool n'existe
      console.log('ℹ️ Aucun pool existant détecté')
    }
    
    console.log('🏗️ Création du nouveau pool...')
    await oracledb.createPool(dbConfig)
    console.log('✅ Pool de connexion Oracle créé avec succès')
    console.log(`📊 Connecté à ${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE}`)
  } catch (err) {
    console.error('❌ Erreur lors de la création du pool Oracle:', err)
    console.error('🔍 Stack trace:', err.stack)
    console.error('🔍 Vérifiez que:')
    console.error('   - La VM Windows Server est accessible sur 192.168.1.100')
    console.error('   - Oracle Database 21c XE est démarré')
    console.error('   - Le port 1521 est ouvert')
    console.error('   - L\'utilisateur hellojade existe')
    throw err
  }
}

// Obtenir une connexion du pool
async function getConnection() {
  try {
    console.log('🔗 Obtention d\'une connexion du pool...')
    
    // Vérifier si le pool existe
    const pool = oracledb.getPool()
    if (!pool) {
      throw new Error('Aucun pool de connexion disponible')
    }
    
    console.log('📊 Pool disponible, obtention de la connexion...')
    const connection = await oracledb.getConnection()
    console.log('✅ Connexion obtenue avec succès')
    return connection
  } catch (err) {
    console.error('❌ Erreur lors de l\'obtention d\'une connexion:', err)
    console.error('🔍 Stack trace:', err.stack)
    throw err
  }
}

// Fermer le pool
async function closePool() {
  try {
    await oracledb.getPool().close(10)
    console.log('✅ Pool Oracle fermé')
  } catch (err) {
    console.error('❌ Erreur lors de la fermeture du pool:', err)
  }
}

// Exécuter une requête
async function executeQuery(sql, binds = [], options = {}) {
  let connection
  try {
    console.log('🔍 Exécution de la requête SQL...')
    console.log('📝 SQL:', sql)
    console.log('🔗 Binds:', binds)
    console.log('⚙️ Options:', options)
    
    connection = await getConnection()
    
    const defaultOptions = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true
    }
    
    const finalOptions = { ...defaultOptions, ...options }
    console.log('⚙️ Options finales:', finalOptions)
    
    const result = await connection.execute(sql, binds, finalOptions)
    console.log(`✅ Requête exécutée avec succès. ${result.rows ? result.rows.length : 0} lignes retournées`)
    
    return result.rows || []
  } catch (err) {
    console.error('❌ Erreur lors de l\'exécution de la requête:', err)
    console.error('🔍 Stack trace:', err.stack)
    throw err
  } finally {
    if (connection) {
      try {
        await connection.close()
        console.log('🔗 Connexion fermée avec succès')
      } catch (err) {
        console.error('❌ Erreur lors de la fermeture de la connexion:', err)
      }
    }
  }
}

module.exports = {
  initialize,
  getConnection,
  closePool,
  executeQuery
} 