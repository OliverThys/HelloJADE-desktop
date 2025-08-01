// Configuration pour utiliser Oracle Database Home
const oracleHome = 'C:\\app\\olive\\product\\21c\\dbhomeXE'
const oracleClientPath = 'C:\\Users\\olive\\Downloads\\instantclient-basic-windows.x64-23.9.0.25.07\\instantclient_23_9'

// Configurer les variables d'environnement Oracle
process.env.ORACLE_HOME = oracleHome
process.env.PATH = oracleClientPath + ';' + oracleHome + '\\bin;' + process.env.PATH

console.log('🔍 Test Oracle avec Oracle Home')
console.log('===============================')
console.log('Oracle Home:', process.env.ORACLE_HOME)
console.log('PATH Oracle:', oracleHome + '\\bin')

const oracledb = require('oracledb')
require('dotenv').config({ path: './config.env' })

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
      console.log('\n💡 Oracle Client non trouvé')
      console.log('   Oracle Home:', oracleHome)
      console.log('   Instant Client:', oracleClientPath)
    }
    
    if (error.code === 'ORA-01017') {
      console.log('\n💡 Erreur d\'authentification')
      console.log('   Vérifiez que l\'utilisateur SIMULATIONHOPITAL existe')
      console.log('   Vérifiez le mot de passe Hospital2024')
    }
  }
}

testConnection() 