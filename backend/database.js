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
  charset: 'AL32UTF8'
}

// Initialiser le pool de connexions
async function initialize() {
  try {
    await oracledb.createPool(dbConfig)
    console.log('✅ Pool de connexion Oracle créé avec succès')
  } catch (err) {
    console.error('❌ Erreur lors de la création du pool Oracle:', err)
    throw err
  }
}

// Obtenir une connexion du pool
async function getConnection() {
  try {
    const connection = await oracledb.getConnection()
    return connection
  } catch (err) {
    console.error('❌ Erreur lors de l\'obtention d\'une connexion:', err)
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
    connection = await getConnection()
    
    const defaultOptions = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true
    }
    
    const result = await connection.execute(sql, binds, { ...defaultOptions, ...options })
    return result.rows || []
  } catch (err) {
    console.error('❌ Erreur lors de l\'exécution de la requête:', err)
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

module.exports = {
  initialize,
  getConnection,
  closePool,
  executeQuery
} 