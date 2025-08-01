const oracledb = require('oracledb')
require('dotenv').config({ path: './config.env' })

// Configuration Oracle depuis les variables d'environnement
const ORACLE_CONFIG = {
  user: process.env.ORACLE_USER || 'system',
  password: process.env.ORACLE_PASSWORD || 'oracle',
  connectString: process.env.ORACLE_CONNECTION_STRING || 'localhost:1521/XE'
}

async function testOracleConnection() {
  console.log('🔍 Test de connexion Oracle')
  console.log('Configuration:', {
    user: ORACLE_CONFIG.user,
    connectString: ORACLE_CONFIG.connectString
  })
  
  let connection
  
  try {
    console.log('📡 Tentative de connexion...')
    connection = await oracledb.getConnection(ORACLE_CONFIG)
    console.log('✅ Connexion établie avec succès!')
    
    // Test de base
    console.log('\n📊 Test de base...')
    const sysdateResult = await connection.execute('SELECT SYSDATE FROM DUAL')
    console.log('✅ SYSDATE:', sysdateResult.rows[0][0])
    
    // Test des tables de la simulation hôpital
    console.log('\n🏥 Test des tables de la simulation hôpital...')
    const tablesToCheck = [
      'PATIENTS',
      'MEDECINS', 
      'SERVICES',
      'CHAMBRES',
      'HOSPITALISATIONS',
      'RENDEZ_VOUS'
    ]
    
    for (const tableName of tablesToCheck) {
      try {
        const result = await connection.execute(`SELECT COUNT(*) as count FROM SIMULATIONHOPITAL.${tableName}`)
        const count = result.rows[0][0]
        console.log(`✅ Table ${tableName}: ${count} enregistrements`)
      } catch (error) {
        console.log(`❌ Table ${tableName}: Erreur - ${error.message}`)
      }
    }
    
    // Test des chambres occupées
    console.log('\n🛏️ Test des chambres...')
    try {
      const occupiedResult = await connection.execute(
        'SELECT COUNT(*) as count FROM SIMULATIONHOPITAL.CHAMBRES WHERE OCCUPEE = \'Y\''
      )
      const occupiedRooms = occupiedResult.rows[0][0]
      console.log(`✅ Chambres occupées: ${occupiedRooms}`)
      
      const totalRoomsResult = await connection.execute(
        'SELECT COUNT(*) as count FROM SIMULATIONHOPITAL.CHAMBRES'
      )
      const totalRooms = totalRoomsResult.rows[0][0]
      console.log(`✅ Total des chambres: ${totalRooms}`)
      console.log(`📊 Taux d'occupation: ${((occupiedRooms / totalRooms) * 100).toFixed(1)}%`)
    } catch (error) {
      console.log(`❌ Erreur lors du test des chambres: ${error.message}`)
    }
    
    // Test des hospitalisations en cours
    console.log('\n🏥 Test des hospitalisations...')
    try {
      const hospResult = await connection.execute(
        'SELECT COUNT(*) as count FROM SIMULATIONHOPITAL.HOSPITALISATIONS WHERE STATUT = \'En cours\''
      )
      const activeHospitalizations = hospResult.rows[0][0]
      console.log(`✅ Hospitalisations en cours: ${activeHospitalizations}`)
      
      const totalHospResult = await connection.execute(
        'SELECT COUNT(*) as count FROM SIMULATIONHOPITAL.HOSPITALISATIONS'
      )
      const totalHospitalizations = totalHospResult.rows[0][0]
      console.log(`✅ Total des hospitalisations: ${totalHospitalizations}`)
    } catch (error) {
      console.log(`❌ Erreur lors du test des hospitalisations: ${error.message}`)
    }
    
    // Test des rendez-vous
    console.log('\n📅 Test des rendez-vous...')
    try {
      const rdvResult = await connection.execute(
        'SELECT COUNT(*) as count FROM SIMULATIONHOPITAL.RENDEZ_VOUS WHERE STATUT = \'Programme\''
      )
      const plannedAppointments = rdvResult.rows[0][0]
      console.log(`✅ Rendez-vous programmés: ${plannedAppointments}`)
      
      const totalRdvResult = await connection.execute(
        'SELECT COUNT(*) as count FROM SIMULATIONHOPITAL.RENDEZ_VOUS'
      )
      const totalAppointments = totalRdvResult.rows[0][0]
      console.log(`✅ Total des rendez-vous: ${totalAppointments}`)
    } catch (error) {
      console.log(`❌ Erreur lors du test des rendez-vous: ${error.message}`)
    }
    
    console.log('\n🎉 Tous les tests sont passés avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur de connexion Oracle:', error.message)
    console.error('Détails:', error)
    
    // Suggestions de dépannage
    console.log('\n🔧 Suggestions de dépannage:')
    console.log('1. Vérifiez que Oracle Database est démarré')
    console.log('2. Vérifiez les paramètres de connexion dans config.env')
    console.log('3. Vérifiez que le schéma SIMULATIONHOPITAL existe')
    console.log('4. Vérifiez que l\'utilisateur a les droits d\'accès')
    
  } finally {
    if (connection) {
      try {
        await connection.close()
        console.log('\n✅ Connexion fermée')
      } catch (err) {
        console.error('❌ Erreur lors de la fermeture de la connexion:', err)
      }
    }
  }
}

// Exécution du test
testOracleConnection()
  .then(() => {
    console.log('\n🏁 Test terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error)
    process.exit(1)
  }) 