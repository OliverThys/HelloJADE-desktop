const oracledb = require('oracledb')
require('dotenv').config({ path: './config.env' })

async function simpleTest() {
  console.log('🔍 Test simple de connexion Oracle...')
  
  // Configuration
  const config = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE}`
  }
  
  console.log('📋 Configuration:', {
    host: process.env.ORACLE_HOST,
    port: process.env.ORACLE_PORT,
    service: process.env.ORACLE_SERVICE,
    user: process.env.ORACLE_USER,
    connectString: config.connectString
  })
  
  try {
    console.log('🔄 Tentative de connexion...')
    
    // Test de connexion directe
    const connection = await oracledb.getConnection(config)
    console.log('✅ Connexion réussie!')
    
    // Test de requête simple
    const result = await connection.execute('SELECT 1 as test FROM DUAL')
    console.log('✅ Requête réussie:', result.rows[0])
    
    await connection.close()
    console.log('✅ Connexion fermée')
    
  } catch (error) {
    console.error('❌ Erreur de connexion:')
    console.error('   Code:', error.code)
    console.error('   Message:', error.message)
    console.error('   Stack:', error.stack)
  }
}

simpleTest() 