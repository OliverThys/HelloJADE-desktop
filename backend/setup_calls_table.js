const fs = require('fs')
const path = require('path')
const { executeQuery } = require('./database')

async function setupCallsTable() {
  try {
    console.log('🏗️ Début de la création de la table CALLS...')
    
    // Lire le script SQL
    const sqlScriptPath = path.join(__dirname, 'create_calls_table.sql')
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
    
    console.log('🎉 Table CALLS créée avec succès !')
    console.log('📊 La table est maintenant prête pour stocker les données d\'appels')
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table CALLS:', error)
    console.error('🔍 Stack trace:', error.stack)
    throw error
  }
}

// Fonction pour vérifier si la table existe
async function checkCallsTableExists() {
  try {
    const result = await executeQuery(`
      SELECT COUNT(*) as count 
      FROM USER_TABLES 
      WHERE TABLE_NAME = 'CALLS'
    `)
    
    return result[0]?.COUNT > 0
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de la table CALLS:', error)
    return false
  }
}

// Fonction principale
async function main() {
  try {
    console.log('🔍 Vérification de l\'existence de la table CALLS...')
    
    const tableExists = await checkCallsTableExists()
    
    if (tableExists) {
      console.log('✅ La table CALLS existe déjà')
      console.log('💡 Pour la recréer, supprimez-la d\'abord avec: DROP TABLE CALLS CASCADE CONSTRAINTS;')
    } else {
      console.log('❌ La table CALLS n\'existe pas, création en cours...')
      await setupCallsTable()
    }
    
    console.log('✅ Script terminé avec succès')
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du script:', error)
    process.exit(1)
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main()
}

module.exports = {
  setupCallsTable,
  checkCallsTableExists
} 