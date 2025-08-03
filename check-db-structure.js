const { Pool } = require('pg')
require('dotenv').config({ path: './backend/config.env' })

async function checkDBStructure() {
  console.log('🔍 Vérification de la structure de la base de données...\n')
  
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hellojade',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  })
  
  try {
    const client = await pool.connect()
    
    // Vérifier la structure de la table patients
    console.log('📋 Structure de la table patients:')
    const patientsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'patients'
      ORDER BY ordinal_position
    `)
    
    patientsStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    console.log('\n📋 Structure de la table calls:')
    const callsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'calls'
      ORDER BY ordinal_position
    `)
    
    callsStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    // Vérifier quelques données
    console.log('\n📊 Données d\'exemple:')
    const patientsCount = await client.query('SELECT COUNT(*) as count FROM patients')
    const callsCount = await client.query('SELECT COUNT(*) as count FROM calls')
    
    console.log(`  - Patients: ${patientsCount.rows[0].count}`)
    console.log(`  - Appels: ${callsCount.rows[0].count}`)
    
    // Vérifier un patient d'exemple
    const patientExample = await client.query('SELECT * FROM patients LIMIT 1')
    if (patientExample.rows.length > 0) {
      console.log('\n👤 Exemple de patient:')
      console.log(patientExample.rows[0])
    }
    
    client.release()
    await pool.end()
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}

if (require.main === module) {
  checkDBStructure().catch(console.error)
} 