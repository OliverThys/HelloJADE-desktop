const fs = require('fs')
const path = require('path')
const { initialize, executeQuery } = require('./database')

async function setupProjectTables() {
  try {
    console.log('🏗️ Création des tables projet HelloJADE...')
    
    // Initialiser la base de données d'abord
    console.log('🔄 Initialisation de la base de données...')
    await initialize()
    
    // Lire le script SQL simplifié
    const sqlScriptPath = path.join(__dirname, 'create_project_tables_simple.sql')
    const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8')
    
    console.log('📖 Script SQL lu avec succès')
    
    // Diviser le script en commandes individuelles
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`🔧 ${commands.length} commandes SQL à exécuter`)
    
    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      
      // Ignorer les commentaires et les lignes vides
      if (command.startsWith('--') || command.length === 0) {
        continue
      }
      
      try {
        console.log(`📝 Exécution de la commande ${i + 1}/${commands.length}...`)
        console.log(`🔍 Commande: ${command.substring(0, 100)}...`)
        
        await executeQuery(command)
        console.log(`✅ Commande ${i + 1} exécutée avec succès`)
      } catch (error) {
        // Si c'est une erreur de table déjà existante, on continue
        if (error.message.includes('ORA-00955') || error.message.includes('already exists')) {
          console.log(`⚠️ Commande ${i + 1} ignorée (objet déjà existant)`)
        } else {
          console.error(`❌ Erreur lors de l'exécution de la commande ${i + 1}:`, error.message)
          throw error
        }
      }
    }
    
    console.log('🎉 Tables projet créées avec succès !')
    console.log('📊 Les tables sont maintenant prêtes pour stocker les données d\'appels')
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables projet:', error)
    console.error('🔍 Stack trace:', error.stack)
    throw error
  }
}

// Fonction pour synchroniser les données existantes
async function syncExistingData() {
  try {
    console.log('🔄 Synchronisation des données existantes...')
    
    // Initialiser la base de données si nécessaire
    try {
      await initialize()
    } catch (error) {
      console.log('⚠️ Base de données déjà initialisée')
    }
    
    // Synchroniser les patients
    await executeQuery(`
      INSERT INTO PATIENTS_SYNC (HOSPITAL_PATIENT_ID, NUMERO_PATIENT, NOM, PRENOM, DATE_NAISSANCE, TELEPHONE)
      SELECT PATIENT_ID, NUMERO_PATIENT, NOM, PRENOM, DATE_NAISSANCE, TELEPHONE
      FROM PATIENTS
      WHERE PATIENT_ID NOT IN (SELECT HOSPITAL_PATIENT_ID FROM PATIENTS_SYNC)
    `)
    
    console.log('✅ Patients synchronisés')
    
    // Synchroniser les hospitalisations
    await executeQuery(`
      INSERT INTO HOSPITALISATIONS_SYNC (HOSPITAL_HOSPITALISATION_ID, PROJECT_PATIENT_ID, SERVICE, MEDECIN, DATE_SORTIE, STATUT)
      SELECT 
        h.HOSPITALISATION_ID,
        ps.PROJECT_PATIENT_ID,
        h.SERVICE,
        h.MEDECIN,
        h.DATE_SORTIE,
        h.STATUT
      FROM HOSPITALISATIONS h
      JOIN PATIENTS_SYNC ps ON h.PATIENT_ID = ps.HOSPITAL_PATIENT_ID
      WHERE h.HOSPITALISATION_ID NOT IN (SELECT HOSPITAL_HOSPITALISATION_ID FROM HOSPITALISATIONS_SYNC)
    `)
    
    console.log('✅ Hospitalisations synchronisées')
    
    // Créer des appels pour les patients sortis
    await executeQuery(`
      INSERT INTO CALLS (PROJECT_PATIENT_ID, PROJECT_HOSPITALISATION_ID, STATUT, DATE_APPEL_PREVU, NOMBRE_TENTATIVES)
      SELECT 
        ps.PROJECT_PATIENT_ID,
        hs.PROJECT_HOSPITALISATION_ID,
        'pending',
        hs.DATE_SORTIE + 1,
        0
      FROM PATIENTS_SYNC ps
      JOIN HOSPITALISATIONS_SYNC hs ON ps.PROJECT_PATIENT_ID = hs.PROJECT_PATIENT_ID
      WHERE hs.DATE_SORTIE IS NOT NULL
      AND hs.STATUT = 'TERMINEE'
      AND NOT EXISTS (
        SELECT 1 FROM CALLS c 
        WHERE c.PROJECT_PATIENT_ID = ps.PROJECT_PATIENT_ID
      )
    `)
    
    console.log('✅ Appels créés pour les patients sortis')
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error)
    throw error
  }
}

// Fonction pour vérifier l'état des tables
async function checkTablesStatus() {
  try {
    console.log('📊 Vérification de l\'état des tables...')
    
    // Initialiser la base de données si nécessaire
    try {
      await initialize()
    } catch (error) {
      console.log('⚠️ Base de données déjà initialisée')
    }
    
    const tables = [
      'PATIENTS_SYNC',
      'HOSPITALISATIONS_SYNC', 
      'CALLS',
      'CALL_HISTORY',
      'SCORES',
      'CALL_METADATA'
    ]
    
    for (const table of tables) {
      try {
        const result = await executeQuery(`SELECT COUNT(*) as count FROM ${table}`)
        console.log(`   - ${table}: ${result[0].COUNT} enregistrements`)
      } catch (error) {
        console.log(`   - ${table}: ❌ Table non trouvée`)
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  try {
    switch (command) {
      case 'setup':
        await setupProjectTables()
        await syncExistingData()
        break
      case 'status':
        await checkTablesStatus()
        break
      case 'sync':
        await syncExistingData()
        break
      default:
        console.log('Usage:')
        console.log('  node setup_project_tables.js setup   - Créer les tables et synchroniser')
        console.log('  node setup_project_tables.js status  - Vérifier l\'état des tables')
        console.log('  node setup_project_tables.js sync    - Synchroniser les données existantes')
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
  setupProjectTables,
  syncExistingData,
  checkTablesStatus
} 