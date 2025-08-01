// Configuration manuelle du chemin Oracle Instant Client
// Remplacez le chemin par celui où vous avez installé Oracle Instant Client
const oracleClientPath = 'C:\\Users\\olive\\Downloads\\instantclient-basic-windows.x64-23.9.0.25.07\\instantclient_23_9' // Chemin fourni par l'utilisateur

// Ajouter le chemin au PATH si Oracle Client n'est pas trouvé
if (!process.env.PATH.includes('instantclient')) {
  process.env.PATH = oracleClientPath + ';' + process.env.PATH
}

const oracledb = require('oracledb')
require('dotenv').config({ path: './config.env' })

console.log('🔍 Test Oracle avec chemin manuel')
console.log('================================')

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

// Test de connexion
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
    
    if (error.code === 'DPI-1047') {
      console.log('\n💡 Oracle Instant Client non trouvé dans:', oracleClientPath)
      console.log('   Vérifiez le chemin et modifiez la variable oracleClientPath')
    }
  }
}

testConnection() 