const { initialize, executeQuery, closePool } = require('./database')

async function testConnection() {
  try {
    console.log('🧪 Test de connexion à Oracle Database...')
    
    // Initialiser la connexion
    await initialize()
    
    // Test 1: Vérifier la connexion
    console.log('✅ Connexion établie avec succès')
    
    // Test 2: Compter les patients
    const patientCount = await executeQuery('SELECT COUNT(*) as count FROM PATIENTS')
    console.log(`📊 Nombre de patients dans la base: ${patientCount[0].COUNT}`)
    
    // Test 3: Récupérer Oliver Thys
    const oliverThys = await executeQuery(`
      SELECT 
        p.PATIENT_ID,
        p.NOM,
        p.PRENOM,
        p.TELEPHONE,
        p.EMAIL,
        h.DATE_SORTIE,
        h.STATUT,
        m.NOM || ' ' || m.PRENOM as MEDECIN,
        s.NOM_SERVICE as SERVICE
      FROM PATIENTS p
      LEFT JOIN HOSPITALISATIONS h ON p.PATIENT_ID = h.PATIENT_ID
      LEFT JOIN MEDECINS m ON h.MEDECIN_TRAITANT_ID = m.MEDECIN_ID
      LEFT JOIN SERVICES s ON h.SERVICE_ID = s.SERVICE_ID
      WHERE p.NOM = 'Thys' AND p.PRENOM = 'Oliver'
    `)
    
    if (oliverThys.length > 0) {
      const patient = oliverThys[0]
      console.log('✅ Oliver Thys trouvé:')
      console.log(`   - ID: ${patient.PATIENT_ID}`)
      console.log(`   - Nom: ${patient.NOM} ${patient.PRENOM}`)
      console.log(`   - Téléphone: ${patient.TELEPHONE}`)
      console.log(`   - Email: ${patient.EMAIL}`)
      console.log(`   - Date de sortie: ${patient.DATE_SORTIE}`)
      console.log(`   - Statut: ${patient.STATUT}`)
      console.log(`   - Médecin: ${patient.MEDECIN}`)
      console.log(`   - Service: ${patient.SERVICE}`)
    } else {
      console.log('⚠️ Oliver Thys non trouvé dans la base')
    }
    
    // Test 4: Lister tous les patients
    const allPatients = await executeQuery(`
      SELECT 
        p.PATIENT_ID,
        p.NOM,
        p.PRENOM,
        p.TELEPHONE,
        h.DATE_SORTIE,
        h.STATUT
      FROM PATIENTS p
      LEFT JOIN HOSPITALISATIONS h ON p.PATIENT_ID = h.PATIENT_ID
      ORDER BY p.PATIENT_ID
    `)
    
    console.log('📋 Liste des patients:')
    allPatients.forEach(patient => {
      console.log(`   - ${patient.PATIENT_ID}: ${patient.NOM} ${patient.PRENOM} (${patient.TELEPHONE}) - ${patient.STATUT || 'Pas d\'hospitalisation'}`)
    })
    
    console.log('🎉 Tous les tests de connexion sont réussis !')
    
  } catch (error) {
    console.error('❌ Erreur lors du test de connexion:', error)
  } finally {
    await closePool()
    process.exit(0)
  }
}

// Exécuter le test
testConnection() 