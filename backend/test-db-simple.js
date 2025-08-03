const { Pool } = require('pg')
require('dotenv').config({ path: './config.env' })

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function testDatabase() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Test de connexion à la base de données...')
    
    // Test 1: Vérifier la connexion
    const testQuery = 'SELECT NOW() as current_time'
    const testResult = await client.query(testQuery)
    console.log('✅ Connexion OK:', testResult.rows[0])
    
    // Test 2: Vérifier si la table calls existe
    const tableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'calls'
      ) as table_exists
    `
    const tableResult = await client.query(tableQuery)
    console.log('✅ Table calls existe:', tableResult.rows[0].table_exists)
    
    if (tableResult.rows[0].table_exists) {
      // Test 3: Compter les enregistrements
      const countQuery = 'SELECT COUNT(*) as total FROM calls'
      const countResult = await client.query(countQuery)
      console.log('✅ Nombre d\'enregistrements dans calls:', countResult.rows[0].total)
      
      // Test 4: Voir la structure de la table
      const structureQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'calls' 
        ORDER BY ordinal_position
      `
      const structureResult = await client.query(structureQuery)
      console.log('✅ Structure de la table calls:')
      structureResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`)
      })
      
      // Test 5: Requête simple
      const simpleQuery = 'SELECT id, nom, prenom FROM calls LIMIT 3'
      const simpleResult = await client.query(simpleQuery)
      console.log('✅ Exemple de données:')
      simpleResult.rows.forEach(row => {
        console.log(`  - ID: ${row.id}, Nom: ${row.nom}, Prénom: ${row.prenom}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    client.release()
    await pool.end()
  }
}

testDatabase() 