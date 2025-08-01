const oracledb = require('oracledb')
require('dotenv').config({ path: './config.env' })

console.log('🔍 Diagnostic Oracle')
console.log('===================')

// Vérifier la version d'oracledb
console.log('📦 Version oracledb:', oracledb.versionString)

// Vérifier si Oracle Client est disponible
console.log('🔧 Oracle Client disponible:', oracledb.oracleClientVersionString || 'Non disponible')

// Afficher la configuration
const config = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECTION_STRING
}

console.log('⚙️ Configuration:')
console.log('  User:', config.user)
console.log('  Password:', config.password ? '***' : 'Non défini')
console.log('  Connect String:', config.connectString)

// Test de connexion simple
async function testConnection() {
  try {
    console.log('\n📡 Test de connexion...')
    const connection = await oracledb.getConnection(config)
    console.log('✅ Connexion réussie!')
    
    // Test simple
    const result = await connection.execute('SELECT SYSDATE FROM DUAL')
    console.log('✅ SYSDATE:', result.rows[0][0])
    
    await connection.close()
    console.log('✅ Connexion fermée')
    
  } catch (error) {
    console.log('❌ Erreur de connexion:')
    console.log('  Code:', error.code)
    console.log('  Message:', error.message)
    console.log('  Numéro d\'erreur:', error.errorNum)
    
    if (error.code === 'DPI-1047') {
      console.log('\n💡 Solution: Installer Oracle Instant Client')
      console.log('   Télécharger depuis: https://www.oracle.com/database/technologies/instant-client/downloads.html')
    }
    
    if (error.code === 'ORA-01017') {
      console.log('\n💡 Solution: Vérifier les identifiants de connexion')
    }
    
    if (error.code === 'ORA-12541') {
      console.log('\n💡 Solution: Vérifier que Oracle Database est démarré')
    }
  }
}

testConnection() 