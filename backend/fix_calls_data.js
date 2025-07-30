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

async function fixCallsData() {
  const pool = new Pool(postgresConfig)
  
  try {
    console.log('🔍 Vérification des données existantes dans la table calls...')
    
    // Vérifier les statuts existants
    const statuts = await pool.query(`
      SELECT DISTINCT statut, COUNT(*) as nombre
      FROM calls 
      GROUP BY statut
      ORDER BY statut
    `)
    
    console.log('\n📊 Statuts existants:')
    statuts.rows.forEach(row => {
      console.log(`  - "${row.statut}": ${row.nombre} enregistrements`)
    })
    
    // Vérifier les valeurs problématiques
    const problematiques = await pool.query(`
      SELECT statut, COUNT(*) as nombre
      FROM calls 
      WHERE statut NOT IN ('pending', 'called', 'failed', 'in_progress')
      GROUP BY statut
    `)
    
    if (problematiques.rows.length > 0) {
      console.log('\n⚠️ Statuts problématiques détectés:')
      problematiques.rows.forEach(row => {
        console.log(`  - "${row.statut}": ${row.nombre} enregistrements`)
      })
      
      // Proposer des corrections
      console.log('\n🔄 Correction des statuts problématiques...')
      
      // Mapper les valeurs françaises vers les valeurs anglaises
      const mapping = {
        'en_attente': 'pending',
        'appelé': 'called',
        'échoué': 'failed',
        'en_cours': 'in_progress',
        'termine': 'called',
        'reussi': 'called',
        'annule': 'failed',
        'annulé': 'failed'
      }
      
      for (const [ancien, nouveau] of Object.entries(mapping)) {
        const result = await pool.query(`
          UPDATE calls 
          SET statut = $1, date_modification = CURRENT_TIMESTAMP
          WHERE statut = $2
        `, [nouveau, ancien])
        
        if (result.rowCount > 0) {
          console.log(`  ✅ "${ancien}" → "${nouveau}": ${result.rowCount} enregistrements mis à jour`)
        }
      }
      
      // Pour les autres valeurs non reconnues, les mettre en 'pending'
      const autres = await pool.query(`
        UPDATE calls 
        SET statut = 'pending', date_modification = CURRENT_TIMESTAMP
        WHERE statut NOT IN ('pending', 'called', 'failed', 'in_progress')
      `)
      
      if (autres.rowCount > 0) {
        console.log(`  ✅ Autres valeurs → "pending": ${autres.rowCount} enregistrements mis à jour`)
      }
    } else {
      console.log('\n✅ Aucun statut problématique détecté')
    }
    
    // Vérification finale
    const statutsFinaux = await pool.query(`
      SELECT DISTINCT statut, COUNT(*) as nombre
      FROM calls 
      GROUP BY statut
      ORDER BY statut
    `)
    
    console.log('\n📊 Statuts après correction:')
    statutsFinaux.rows.forEach(row => {
      console.log(`  - "${row.statut}": ${row.nombre} enregistrements`)
    })
    
    console.log('\n✅ Correction terminée avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  fixCallsData()
    .then(() => {
      console.log('✅ Script terminé avec succès')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erreur:', error)
      process.exit(1)
    })
}

module.exports = { fixCallsData } 