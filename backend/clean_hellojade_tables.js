const { initialize, executeQuery } = require('./database')

async function cleanHelloJADETables() {
  try {
    console.log('🧹 Nettoyage des tables HelloJADE...')
    
    // Initialiser la base de données
    console.log('🔄 Initialisation de la base de données...')
    await initialize()
    
    // Liste des tables à supprimer (dans l'ordre pour éviter les problèmes de contraintes)
    const tablesToDrop = [
      'CALL_METADATA',
      'SCORES', 
      'CALL_HISTORY',
      'CALLS',
      'HOSPITALISATIONS_SYNC',
      'PATIENTS_SYNC'
    ]
    
    // Liste des séquences à supprimer
    const sequencesToDrop = [
      'PROJECT_CALL_SEQ',
      'PROJECT_HOSPITALISATION_SEQ',
      'PROJECT_PATIENT_SEQ'
    ]
    
    // Liste des vues à supprimer
    const viewsToDrop = [
      'V_STATISTIQUES_APPELS',
      'V_APPELS_EN_COURS'
    ]
    
    console.log('🗑️ Suppression des vues...')
    for (const view of viewsToDrop) {
      try {
        await executeQuery(`DROP VIEW ${view}`)
        console.log(`✅ Vue ${view} supprimée`)
      } catch (error) {
        if (error.message.includes('ORA-00942')) {
          console.log(`⚠️ Vue ${view} n'existe pas, ignorée`)
        } else {
          console.log(`⚠️ Erreur lors de la suppression de la vue ${view}: ${error.message}`)
        }
      }
    }
    
    console.log('🗑️ Suppression des tables...')
    for (const table of tablesToDrop) {
      try {
        await executeQuery(`DROP TABLE ${table} CASCADE CONSTRAINTS`)
        console.log(`✅ Table ${table} supprimée`)
      } catch (error) {
        if (error.message.includes('ORA-00942')) {
          console.log(`⚠️ Table ${table} n'existe pas, ignorée`)
        } else {
          console.log(`⚠️ Erreur lors de la suppression de la table ${table}: ${error.message}`)
        }
      }
    }
    
    console.log('🗑️ Suppression des séquences...')
    for (const sequence of sequencesToDrop) {
      try {
        await executeQuery(`DROP SEQUENCE ${sequence}`)
        console.log(`✅ Séquence ${sequence} supprimée`)
      } catch (error) {
        if (error.message.includes('ORA-02289')) {
          console.log(`⚠️ Séquence ${sequence} n'existe pas, ignorée`)
        } else {
          console.log(`⚠️ Erreur lors de la suppression de la séquence ${sequence}: ${error.message}`)
        }
      }
    }
    
    console.log('🎉 Nettoyage terminé ! Toutes les tables HelloJADE ont été supprimées.')
    console.log('📊 Vous pouvez maintenant relancer le script setup pour recréer les tables proprement.')
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
    throw error
  }
}

// Exécuter le script
cleanHelloJADETables()
  .then(() => {
    console.log('✅ Script de nettoyage terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script de nettoyage échoué:', error)
    process.exit(1)
  }) 