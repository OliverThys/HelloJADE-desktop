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

async function checkTablesStructure() {
  const pool = new Pool(postgresConfig)
  
  try {
    console.log('Verification de la structure des tables...')
    
    // Verifier si patients_sync existe
    const patientsExist = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'patients_sync'
      )
    `)
    
    if (patientsExist.rows[0].exists) {
      console.log('\nTable patients_sync existe. Structure:')
      const patientsColumns = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'patients_sync' 
        ORDER BY ordinal_position
      `)
      patientsColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`)
      })
    } else {
      console.log('\nTable patients_sync n\'existe pas')
    }
    
    // Verifier si hospitalisations_sync existe
    const hospitalisationsExist = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'hospitalisations_sync'
      )
    `)
    
    if (hospitalisationsExist.rows[0].exists) {
      console.log('\nTable hospitalisations_sync existe. Structure:')
      const hospitalisationsColumns = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'hospitalisations_sync' 
        ORDER BY ordinal_position
      `)
      hospitalisationsColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`)
      })
    } else {
      console.log('\nTable hospitalisations_sync n\'existe pas')
    }
    
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  checkTablesStructure()
    .then(() => {
      console.log('\nVerification terminee')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Erreur:', error)
      process.exit(1)
    })
}

module.exports = { checkTablesStructure } 