const { Pool } = require('pg')

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

async function checkHospitalisations() {
  const pool = new Pool(postgresConfig)
  
  try {
    console.log('Structure de hospitalisations_sync:')
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'hospitalisations_sync' 
      ORDER BY ordinal_position
    `)
    
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    await pool.end()
  }
}

checkHospitalisations() 