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

async function checkDatabaseState() {
  const pool = new Pool(postgresConfig)
  
  try {
    console.log('🔍 Vérification de l\'état de la base de données...')
    
    // Vérifier les tables existantes
    const tables = await pool.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    console.log('\n📋 Tables existantes:')
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name} (${row.table_type})`)
    })
    
    // Vérifier les vues existantes
    const views = await pool.query(`
      SELECT table_name, view_definition
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log('\n👁️ Vues existantes:')
    views.rows.forEach(row => {
      console.log(`  - ${row.table_name}`)
      console.log(`    Définition: ${row.view_definition.substring(0, 100)}...`)
    })
    
    // Vérifier les fonctions existantes
    const functions = await pool.query(`
      SELECT routine_name, routine_type
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      ORDER BY routine_name
    `)
    
    console.log('\n⚙️ Fonctions existantes:')
    functions.rows.forEach(row => {
      console.log(`  - ${row.routine_name} (${row.routine_type})`)
    })
    
    // Vérifier les triggers existants
    const triggers = await pool.query(`
      SELECT trigger_name, event_object_table, action_statement
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      ORDER BY trigger_name
    `)
    
    console.log('\n🔔 Triggers existants:')
    triggers.rows.forEach(row => {
      console.log(`  - ${row.trigger_name} sur ${row.event_object_table}`)
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await pool.end()
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  checkDatabaseState()
    .then(() => {
      console.log('\n✅ Vérification terminée')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erreur:', error)
      process.exit(1)
    })
}

module.exports = { checkDatabaseState } 