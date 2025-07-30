const { Pool } = require('pg')

// Configuration PostgreSQL
const postgresConfig = {
  host: 'localhost',
  port: 5432,
  database: 'hellojade',
  user: 'hellojade_user',
  password: 'hellojade_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}

async function cleanTestData() {
  const pool = new Pool(postgresConfig)
  
  try {
    console.log('🧹 Nettoyage des données de test...')
    
    // Compter les données avant suppression
    const countsBefore = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM calls) as calls_count,
        (SELECT COUNT(*) FROM patients_sync) as patients_count,
        (SELECT COUNT(*) FROM hospitalisations_sync) as hospitalisations_count,
        (SELECT COUNT(*) FROM scores) as scores_count,
        (SELECT COUNT(*) FROM call_metadata) as metadata_count
    `)
    
    console.log('📊 Données avant nettoyage:')
    console.log(`  - Appels: ${countsBefore.rows[0].calls_count}`)
    console.log(`  - Patients: ${countsBefore.rows[0].patients_count}`)
    console.log(`  - Hospitalisations: ${countsBefore.rows[0].hospitalisations_count}`)
    console.log(`  - Scores: ${countsBefore.rows[0].scores_count}`)
    console.log(`  - Métadonnées: ${countsBefore.rows[0].metadata_count}`)
    
    // Supprimer dans l'ordre pour respecter les contraintes de clés étrangères
    console.log('\n🗑️ Suppression des données...')
    
    // Supprimer les métadonnées
    await pool.query('DELETE FROM call_metadata')
    console.log('  ✅ Métadonnées supprimées')
    
    // Supprimer les scores
    await pool.query('DELETE FROM scores')
    console.log('  ✅ Scores supprimés')
    
    // Supprimer l'historique des appels
    await pool.query('DELETE FROM call_history')
    console.log('  ✅ Historique des appels supprimé')
    
    // Supprimer les appels
    await pool.query('DELETE FROM calls')
    console.log('  ✅ Appels supprimés')
    
    // Supprimer les hospitalisations
    await pool.query('DELETE FROM hospitalisations_sync')
    console.log('  ✅ Hospitalisations supprimées')
    
    // Supprimer les patients
    await pool.query('DELETE FROM patients_sync')
    console.log('  ✅ Patients supprimés')
    
    // Compter les données après suppression
    const countsAfter = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM calls) as calls_count,
        (SELECT COUNT(*) FROM patients_sync) as patients_count,
        (SELECT COUNT(*) FROM hospitalisations_sync) as hospitalisations_count,
        (SELECT COUNT(*) FROM scores) as scores_count,
        (SELECT COUNT(*) FROM call_metadata) as metadata_count
    `)
    
    console.log('\n📊 Données après nettoyage:')
    console.log(`  - Appels: ${countsAfter.rows[0].calls_count}`)
    console.log(`  - Patients: ${countsAfter.rows[0].patients_count}`)
    console.log(`  - Hospitalisations: ${countsAfter.rows[0].hospitalisations_count}`)
    console.log(`  - Scores: ${countsAfter.rows[0].scores_count}`)
    console.log(`  - Métadonnées: ${countsAfter.rows[0].metadata_count}`)
    
    console.log('\n✅ Nettoyage terminé avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  cleanTestData()
    .then(() => {
      console.log('✅ Script terminé avec succès')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erreur:', error)
      process.exit(1)
    })
}

module.exports = { cleanTestData } 