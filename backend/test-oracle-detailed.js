const oracledb = require('oracledb')
require('dotenv').config({ path: './config.env' })

async function testOracleConnection() {
  console.log('🔍 Diagnostic détaillé de la connexion Oracle...')
  console.log('=' * 50)
  
  // 1. Vérifier les variables d'environnement
  console.log('📋 Configuration détectée:')
  console.log(`   - HOST: ${process.env.ORACLE_HOST}`)
  console.log(`   - PORT: ${process.env.ORACLE_PORT}`)
  console.log(`   - SERVICE: ${process.env.ORACLE_SERVICE}`)
  console.log(`   - USER: ${process.env.ORACLE_USER}`)
  console.log(`   - PASSWORD: ${process.env.ORACLE_PASSWORD ? '***' : 'NON DÉFINI'}`)
  
  // 2. Tester la connectivité réseau
  console.log('\n🌐 Test de connectivité réseau...')
  const net = require('net')
  
  try {
    const socket = new net.Socket()
    const connectPromise = new Promise((resolve, reject) => {
      socket.setTimeout(5000)
      socket.on('connect', () => {
        console.log('✅ Port 1521 accessible sur la VM')
        socket.destroy()
        resolve(true)
      })
      socket.on('timeout', () => {
        console.log('❌ Timeout - Port 1521 non accessible')
        socket.destroy()
        reject(new Error('Timeout'))
      })
      socket.on('error', (err) => {
        console.log('❌ Erreur de connexion réseau:', err.message)
        reject(err)
      })
    })
    
    await connectPromise
  } catch (error) {
    console.log('⚠️ Problème de connectivité réseau détecté')
  }
  
  // 3. Configuration Oracle
  const dbConfig = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE}`,
    poolMin: 1,
    poolMax: 2,
    poolIncrement: 1,
    charset: 'AL32UTF8',
    poolTimeout: 30,
    queueTimeout: 30000,
    connectTimeout: 30000,
    transportConnectTimeout: 30000,
    events: false,
    externalAuth: false
  }
  
  console.log('\n🔧 Configuration Oracle:')
  console.log(`   - Connect String: ${dbConfig.connectString}`)
  console.log(`   - Pool Min: ${dbConfig.poolMin}`)
  console.log(`   - Pool Max: ${dbConfig.poolMax}`)
  console.log(`   - Connect Timeout: ${dbConfig.connectTimeout}ms`)
  
  // 4. Test de connexion Oracle
  console.log('\n🔄 Test de connexion Oracle...')
  
  try {
    // Test avec thin mode d'abord
    console.log('📡 Test en mode thin...')
    oracledb.initOracleClient()
    
    await oracledb.createPool(dbConfig)
    console.log('✅ Pool créé avec succès')
    
    const connection = await oracledb.getConnection()
    console.log('✅ Connexion obtenue avec succès')
    
    // Test de requête simple
    const result = await connection.execute('SELECT 1 as test FROM DUAL')
    console.log('✅ Requête de test réussie:', result.rows[0])
    
    // Test de requête sur les tables
    try {
      const tables = await connection.execute(`
        SELECT table_name 
        FROM user_tables 
        WHERE table_name IN ('PATIENTS', 'HOSPITALISATIONS', 'MEDECINS', 'SERVICES')
        ORDER BY table_name
      `)
      console.log('📊 Tables trouvées:', tables.rows.map(row => row.TABLE_NAME))
    } catch (tableError) {
      console.log('⚠️ Erreur lors de la vérification des tables:', tableError.message)
    }
    
    await connection.close()
    await oracledb.getPool().close()
    console.log('✅ Connexion fermée proprement')
    
  } catch (error) {
    console.log('❌ Erreur de connexion Oracle:')
    console.log(`   - Code: ${error.code}`)
    console.log(`   - Message: ${error.message}`)
    
    // Suggestions selon le type d'erreur
    if (error.code === 'NJS-518') {
      console.log('\n💡 Suggestions pour l\'erreur NJS-518:')
      console.log('   1. Vérifiez que Oracle Database est démarré sur la VM')
      console.log('   2. Vérifiez que le service XE est enregistré: lsnrctl services')
      console.log('   3. Vérifiez le statut du listener: lsnrctl status')
      console.log('   4. Vérifiez le pare-feu Windows sur la VM')
      console.log('   5. Essayez de redémarrer le service Oracle: net stop OracleServiceXE && net start OracleServiceXE')
    } else if (error.code === 'NJS-040') {
      console.log('\n💡 Suggestions pour l\'erreur NJS-040:')
      console.log('   1. Vérifiez les identifiants de connexion')
      console.log('   2. Vérifiez que l\'utilisateur hellojade existe')
      console.log('   3. Vérifiez les permissions de l\'utilisateur')
    } else if (error.code === 'NJS-047') {
      console.log('\n💡 Suggestions pour l\'erreur NJS-047:')
      console.log('   1. Vérifiez que le client Oracle est installé')
      console.log('   2. Vérifiez les variables d\'environnement ORACLE_HOME et PATH')
    }
  }
  
  console.log('\n🎯 Résumé du diagnostic:')
  console.log('   - Si vous voyez "✅ Connexion obtenue avec succès", la connexion fonctionne')
  console.log('   - Si vous voyez des erreurs, suivez les suggestions ci-dessus')
  console.log('   - Vérifiez les logs Oracle sur la VM pour plus de détails')
}

// Exécuter le diagnostic
testOracleConnection().catch(console.error) 