const fs = require('fs')
const path = require('path')
const DatabaseSync = require('./database-sync')

async function setupProjectDatabase() {
  const dbSync = new DatabaseSync()
  
  try {
    console.log('🏗️ Configuration de la base de données projet HelloJADE...')
    
    // 1. Créer le schéma projet
    console.log('📋 Étape 1: Création du schéma projet...')
    await createProjectSchema()
    
    // 2. Initialiser la synchronisation
    console.log('📋 Étape 2: Initialisation de la synchronisation...')
    await dbSync.initialize()
    
    // 3. Synchronisation initiale
    console.log('📋 Étape 3: Synchronisation initiale des données...')
    await dbSync.fullSync()
    
    console.log('🎉 Configuration de la base de données projet terminée avec succès !')
    console.log('📊 Votre application peut maintenant utiliser la base projet séparée')
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error)
    throw error
  } finally {
    await dbSync.close()
  }
}

async function createProjectSchema() {
  try {
    console.log('🔧 Création du schéma projet...')
    
    // Lire le script SQL
    const sqlScriptPath = path.join(__dirname, 'create_project_schema.sql')
    const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8')
    
    // Diviser le script en commandes
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`📝 ${commands.length} commandes SQL à exécuter`)
    
    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      
      if (command.startsWith('--') || command.length === 0) {
        continue
      }
      
      try {
        console.log(`🔍 Exécution de la commande ${i + 1}/${commands.length}...`)
        
        // Utiliser la connexion système pour créer le schéma
        const oracledb = require('oracledb')
        const connection = await oracledb.getConnection({
          user: process.env.ORACLE_USER,
          password: process.env.ORACLE_PASSWORD,
          connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE}`
        })
        
        await connection.execute(command)
        await connection.close()
        
        console.log(`✅ Commande ${i + 1} exécutée avec succès`)
      } catch (error) {
        if (error.message.includes('ORA-00955') || error.message.includes('already exists')) {
          console.log(`⚠️ Commande ${i + 1} ignorée (objet déjà existant)`)
        } else {
          console.error(`❌ Erreur lors de l'exécution de la commande ${i + 1}:`, error.message)
          throw error
        }
      }
    }
    
    console.log('✅ Schéma projet créé avec succès')
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du schéma:', error)
    throw error
  }
}

// Fonction pour vérifier l'état de la synchronisation
async function checkSyncStatus() {
  const dbSync = new DatabaseSync()
  
  try {
    await dbSync.initialize()
    
    const projectConn = await dbSync.getProjectConnection()
    
    // Vérifier le nombre de patients synchronisés
    const patientsResult = await projectConn.execute(`
      SELECT COUNT(*) as count FROM HELLOJADE_PROJECT.PATIENTS_SYNC
    `)
    
    // Vérifier le nombre d'hospitalisations synchronisées
    const hospResult = await projectConn.execute(`
      SELECT COUNT(*) as count FROM HELLOJADE_PROJECT.HOSPITALISATIONS_SYNC
    `)
    
    // Vérifier le nombre d'appels
    const callsResult = await projectConn.execute(`
      SELECT COUNT(*) as count FROM HELLOJADE_PROJECT.CALLS
    `)
    
    console.log('📊 État de la synchronisation:')
    console.log(`   - Patients synchronisés: ${patientsResult.rows[0][0]}`)
    console.log(`   - Hospitalisations synchronisées: ${hospResult.rows[0][0]}`)
    console.log(`   - Appels créés: ${callsResult.rows[0][0]}`)
    
    await projectConn.close()
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await dbSync.close()
  }
}

// Fonction pour forcer une synchronisation
async function forceSync() {
  const dbSync = new DatabaseSync()
  
  try {
    console.log('🔄 Synchronisation forcée...')
    await dbSync.initialize()
    await dbSync.fullSync()
    console.log('✅ Synchronisation forcée terminée')
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation forcée:', error)
  } finally {
    await dbSync.close()
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  try {
    switch (command) {
      case 'setup':
        await setupProjectDatabase()
        break
      case 'status':
        await checkSyncStatus()
        break
      case 'sync':
        await forceSync()
        break
      default:
        console.log('Usage:')
        console.log('  node setup_project_database.js setup   - Configuration complète')
        console.log('  node setup_project_database.js status  - Vérifier l\'état')
        console.log('  node setup_project_database.js sync    - Synchronisation forcée')
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main()
}

module.exports = {
  setupProjectDatabase,
  checkSyncStatus,
  forceSync
} 