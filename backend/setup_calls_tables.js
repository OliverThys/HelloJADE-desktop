const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

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

async function setupCallsTables() {
  const pool = new Pool(postgresConfig)
  
  try {
    console.log('🔄 Configuration des tables d\'appels HelloJADE...')
    
    // Lire le script SQL
    const sqlPath = path.join(__dirname, 'create_calls_tables.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Exécuter le script SQL
    console.log('📊 Exécution du script SQL...')
    await pool.query(sqlContent)
    
    console.log('✅ Tables d\'appels créées avec succès')
    
    // Vérifier que les tables ont été créées
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('calls', 'call_history', 'scores', 'call_metadata', 'system_parameters')
      ORDER BY table_name
    `)
    
    console.log('📋 Tables créées:')
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`)
    })
    
    // Vérifier les vues
    const views = await pool.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'v_%'
      ORDER BY table_name
    `)
    
    console.log('👁️ Vues créées:')
    views.rows.forEach(row => {
      console.log(`  - ${row.table_name}`)
    })
    
    // Vérifier les fonctions
    const functions = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
      AND routine_name IN ('marquer_appel_echec', 'calculer_score_appel', 'audit_call_changes')
      ORDER BY routine_name
    `)
    
    console.log('⚙️ Fonctions créées:')
    functions.rows.forEach(row => {
      console.log(`  - ${row.routine_name}`)
    })
    
    // Vérifier les paramètres système
    const parameters = await pool.query(`
      SELECT cle_parametre, valeur_parametre 
      FROM system_parameters 
      ORDER BY cle_parametre
    `)
    
    console.log('🔧 Paramètres système configurés:')
    parameters.rows.forEach(row => {
      console.log(`  - ${row.cle_parametre}: ${row.valeur_parametre}`)
    })
    
    console.log('🎉 Configuration terminée avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration des tables:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  setupCallsTables()
    .then(() => {
      console.log('✅ Script terminé avec succès')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erreur lors de l\'exécution du script:', error)
      process.exit(1)
    })
}

module.exports = { setupCallsTables } 