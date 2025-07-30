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

async function checkCallsStructure() {
  const pool = new Pool(postgresConfig)
  
  try {
    console.log('Debut de la verification...')
    
    // Verifier si la table calls existe
    const callsExist = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'calls'
      )
    `)
    
    console.log('Resultat de la verification:', callsExist.rows[0])
    
    if (callsExist.rows[0].exists) {
      console.log('Table calls existe. Structure:')
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'calls' 
        ORDER BY ordinal_position
      `)
      
      columns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
      })
    } else {
      console.log('Table calls n\'existe pas')
    }
    
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    await pool.end()
  }
}

checkCallsStructure() 