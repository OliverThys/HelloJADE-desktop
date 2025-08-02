const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'hellojade',
  user: 'postgres',
  password: 'password'
});

async function checkPatientsInconsistencies() {
  try {
    console.log('🔍 Vérification des incohérences dans les données patients...\n');
    
    // Récupérer tous les patients
    const result = await pool.query(`
      SELECT patient_id, nom, prenom, sexe, date_naissance
      FROM patients_sync 
      ORDER BY nom, prenom
    `);
    
    console.log('📋 Tous les patients:');
    console.log('ID | Nom | Prénom | Sexe | Date de naissance');
    console.log('---|-----|--------|------|------------------');
    
    result.rows.forEach(row => {
      const { patient_id, nom, prenom, sexe, date_naissance } = row;
      console.log(`${patient_id} | ${nom} | ${prenom} | ${sexe} | ${date_naissance}`);
    });
    
    console.log(`\n📊 Total: ${result.rows.length} patients`);
    
    // Analyse des incohérences
    console.log('\n🔍 Analyse des incohérences potentielles:');
    const incohérences = [];
    
    result.rows.forEach(row => {
      const { patient_id, nom, prenom, sexe, date_naissance } = row;
      const sexeClean = sexe ? sexe.trim() : '';
      
      // Noms typiquement masculins avec sexe F
      const nomsMasculins = ['Oliver', 'Michael', 'Christopher', 'David', 'Paul', 'Carlos', 'Roberto', 'Ryan', 'Jean', 'Lucas', 'Antoine', 'Michel'];
      if (nomsMasculins.includes(prenom) && sexeClean === 'F') {
        incohérences.push(`${patient_id}: ${prenom} ${nom} - Nom masculin avec sexe F`);
      }
      
      // Noms typiquement féminins avec sexe M
      const nomsFeminins = ['Claire', 'Marie', 'Julie', 'Jennifer', 'Carmen', 'Isabella', 'Amanda', 'Lisa'];
      if (nomsFeminins.includes(prenom) && sexeClean === 'M') {
        incohérences.push(`${patient_id}: ${prenom} ${nom} - Nom féminin avec sexe M`);
      }
    });
    
    if (incohérences.length > 0) {
      console.log('❌ Incohérences détectées:');
      incohérences.forEach(inc => console.log(`  - ${inc}`));
    } else {
      console.log('✅ Aucune incohérence détectée');
    }
    
    // Statistiques par sexe
    console.log('\n📊 Statistiques par sexe:');
    const stats = result.rows.reduce((acc, row) => {
      const sexe = row.sexe ? row.sexe.trim() : 'Non défini';
      acc[sexe] = (acc[sexe] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(stats).forEach(([sexe, count]) => {
      console.log(`  ${sexe}: ${count} patients`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkPatientsInconsistencies(); 