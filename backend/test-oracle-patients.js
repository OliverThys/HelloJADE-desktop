const oracledb = require('oracledb');

async function checkOraclePatients() {
  let connection;
  
  try {
    console.log('🔍 Vérification des données PATIENTS dans Oracle...\n');
    
    // Configuration de la connexion
    const config = {
      user: 'SIMULATIONHOPITAL',
      password: 'password',
      connectString: 'localhost:1521/XEPDB1'
    };
    
    // Connexion à Oracle
    connection = await oracledb.getConnection(config);
    console.log('✅ Connexion Oracle établie');
    
    // Requête pour récupérer tous les patients avec leur sexe
    const result = await connection.execute(`
      SELECT PATIENT_ID, NOM, PRENOM, SEXE, DATE_NAISSANCE
      FROM PATIENTS 
      ORDER BY NOM, PRENOM
    `);
    
    console.log('📋 Données PATIENTS dans Oracle:');
    console.log('ID | Nom | Prénom | Sexe | Date de naissance');
    console.log('---|-----|--------|------|------------------');
    
    result.rows.forEach(row => {
      const [id, nom, prenom, sexe, dateNaissance] = row;
      console.log(`${id} | ${nom} | ${prenom} | ${sexe} | ${dateNaissance}`);
    });
    
    console.log(`\n📊 Total: ${result.rows.length} patients`);
    
    // Analyse des incohérences potentielles
    console.log('\n🔍 Analyse des incohérences potentielles:');
    const incohérences = [];
    
    result.rows.forEach(row => {
      const [id, nom, prenom, sexe, dateNaissance] = row;
      
      // Noms typiquement masculins avec sexe F
      const nomsMasculins = ['Oliver', 'Michael', 'Christopher', 'David', 'Paul', 'Carlos', 'Roberto', 'Ryan'];
      if (nomsMasculins.includes(prenom) && sexe.trim() === 'F') {
        incohérences.push(`${prenom} ${nom} - Nom masculin avec sexe F`);
      }
      
      // Noms typiquement féminins avec sexe M
      const nomsFeminins = ['Claire', 'Marie', 'Julie', 'Jennifer', 'Carmen', 'Isabella', 'Amanda', 'Lisa'];
      if (nomsFeminins.includes(prenom) && sexe.trim() === 'M') {
        incohérences.push(`${prenom} ${nom} - Nom féminin avec sexe M`);
      }
    });
    
    if (incohérences.length > 0) {
      console.log('❌ Incohérences détectées:');
      incohérences.forEach(inc => console.log(`  - ${inc}`));
    } else {
      console.log('✅ Aucune incohérence détectée');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('✅ Connexion Oracle fermée');
      } catch (err) {
        console.error('❌ Erreur fermeture connexion:', err.message);
      }
    }
  }
}

checkOraclePatients(); 