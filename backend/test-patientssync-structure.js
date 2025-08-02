const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'hellojade',
  user: 'postgres',
  password: 'password'
});

async function checkPatientsSyncStructure() {
  try {
    console.log('🔍 Vérification de la structure de la table patients_sync...\n');
    
    // Structure de la table
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'patients_sync' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Structure de la table patients_sync:');
    structureResult.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? 'nullable' : 'NOT NULL';
      const length = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
      console.log(`  - ${row.column_name}: ${row.data_type}${length} (${nullable})`);
    });
    
    console.log('\n📊 Aperçu des données:');
    const dataResult = await pool.query('SELECT * FROM patients_sync LIMIT 3');
    console.log('Premiers enregistrements:');
    dataResult.rows.forEach((row, index) => {
      console.log(`\n  Enregistrement ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        console.log(`    ${key}: ${value}`);
      });
    });
    
    console.log('\n📈 Statistiques:');
    const countResult = await pool.query('SELECT COUNT(*) as total FROM patients_sync');
    console.log(`  Total d'enregistrements: ${countResult.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkPatientsSyncStructure(); 