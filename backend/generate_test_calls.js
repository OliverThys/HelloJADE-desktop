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

// Donnees de test pour les patients
const testPatients = [
  { numero_patient: 'P001', nom: 'Dupont', prenom: 'Marie', telephone: '0123456789', date_naissance: '1985-03-15' },
  { numero_patient: 'P002', nom: 'Martin', prenom: 'Jean', telephone: '0123456790', date_naissance: '1972-07-22' },
  { numero_patient: 'P003', nom: 'Bernard', prenom: 'Sophie', telephone: '0123456791', date_naissance: '1990-11-08' },
  { numero_patient: 'P004', nom: 'Petit', prenom: 'Pierre', telephone: '0123456792', date_naissance: '1968-04-30' },
  { numero_patient: 'P005', nom: 'Robert', prenom: 'Claire', telephone: '0123456793', date_naissance: '1982-09-12' },
  { numero_patient: 'P006', nom: 'Richard', prenom: 'Michel', telephone: '0123456794', date_naissance: '1975-12-25' },
  { numero_patient: 'P007', nom: 'Durand', prenom: 'Isabelle', telephone: '0123456795', date_naissance: '1988-06-18' },
  { numero_patient: 'P008', nom: 'Moreau', prenom: 'Francois', telephone: '0123456796', date_naissance: '1965-01-03' },
  { numero_patient: 'P009', nom: 'Simon', prenom: 'Nathalie', telephone: '0123456797', date_naissance: '1992-08-14' },
  { numero_patient: 'P010', nom: 'Michel', prenom: 'Philippe', telephone: '0123456798', date_naissance: '1979-05-27' }
]

// Donnees de test pour les hospitalisations
const testHospitalisations = [
  { service: 'Cardiologie', medecin: 'Dr. Dubois', site: 'Hopital Central' },
  { service: 'Neurologie', medecin: 'Dr. Leroy', site: 'Hopital Central' },
  { service: 'Orthopedie', medecin: 'Dr. Moreau', site: 'Clinique Saint-Jean' },
  { service: 'Medecine generale', medecin: 'Dr. Martin', site: 'Hopital Central' },
  { service: 'Chirurgie', medecin: 'Dr. Bernard', site: 'Clinique Saint-Jean' },
  { service: 'Pediatrie', medecin: 'Dr. Petit', site: 'Hopital Central' },
  { service: 'Geriatrie', medecin: 'Dr. Robert', site: 'Clinique Saint-Jean' },
  { service: 'Oncologie', medecin: 'Dr. Richard', site: 'Hopital Central' },
  { service: 'Pneumologie', medecin: 'Dr. Durand', site: 'Hopital Central' },
  { service: 'Endocrinologie', medecin: 'Dr. Simon', site: 'Clinique Saint-Jean' }
]

// Resumes d'appels de test
const testResumes = [
  "Patient en bonne forme, suit bien son traitement. Pas de complications signalees.",
  "Patient presente quelques difficultes avec la prise de medicaments. Recommendation de suivi renforce.",
  "Appel reussi, patient tres satisfait des soins recus. Aucun probleme a signaler.",
  "Patient difficile a joindre, plusieurs tentatives necessaires. Finalement contacte.",
  "Patient hospitalise a nouveau, transfert vers un autre service.",
  "Suivi post-operatoire satisfaisant, cicatrisation normale.",
  "Patient decede depuis la sortie, famille informee.",
  "Excellent suivi, patient autonome et compliant.",
  "Quelques questions sur les effets secondaires des medicaments.",
  "Patient en remission, tres positif sur son evolution."
]

// Dialogues de test
const testDialogues = [
  {
    "etapes": [
      { "type": "identification", "statut": "reussi", "duree": 15 },
      { "type": "questionnaire_sante", "statut": "reussi", "duree": 180 },
      { "type": "conclusion", "statut": "reussi", "duree": 45 }
    ],
    "score_global": 85,
    "qualite_communication": "excellente"
  },
  {
    "etapes": [
      { "type": "identification", "statut": "reussi", "duree": 30 },
      { "type": "questionnaire_sante", "statut": "partiel", "duree": 120 },
      { "type": "conclusion", "statut": "reussi", "duree": 60 }
    ],
    "score_global": 65,
    "qualite_communication": "bonne"
  },
  {
    "etapes": [
      { "type": "identification", "statut": "echec", "duree": 10 },
      { "type": "questionnaire_sante", "statut": "echec", "duree": 0 },
      { "type": "conclusion", "statut": "echec", "duree": 0 }
    ],
    "score_global": 0,
    "qualite_communication": "nulle"
  }
]

async function generateTestCalls() {
  const pool = new Pool(postgresConfig)
  
  try {
    console.log('Generation d\'appels de test artificiels...')
    
    // Verifier que les tables patients_sync et hospitalisations_sync existent
    const patientsExist = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'patients_sync'
      )
    `)
    
    if (!patientsExist.rows[0].exists) {
      console.log('Creation de la table patients_sync...')
      await pool.query(`
        CREATE TABLE IF NOT EXISTS patients_sync (
          project_patient_id SERIAL PRIMARY KEY,
          hospital_patient_id INTEGER NOT NULL,
          numero_patient VARCHAR(20) UNIQUE NOT NULL,
          nom VARCHAR(100) NOT NULL,
          prenom VARCHAR(100) NOT NULL,
          telephone VARCHAR(20),
          date_naissance DATE,
          date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          statut_sync VARCHAR(20) DEFAULT 'ACTIVE'
        )
      `)
    }
    
    const hospitalisationsExist = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'hospitalisations_sync'
      )
    `)
    
    if (!hospitalisationsExist.rows[0].exists) {
      console.log('Creation de la table hospitalisations_sync...')
      await pool.query(`
        CREATE TABLE IF NOT EXISTS hospitalisations_sync (
          project_hospitalisation_id SERIAL PRIMARY KEY,
          hospital_hospitalisation_id INTEGER NOT NULL,
          project_patient_id INTEGER REFERENCES patients_sync(project_patient_id),
          service VARCHAR(100),
          medecin VARCHAR(100),
          site VARCHAR(100),
          date_sortie DATE,
          statut VARCHAR(20),
          date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          diagnostic VARCHAR(255)
        )
      `)
    }
    
    // Inserer les patients de test
    console.log('Insertion des patients de test...')
    for (const patient of testPatients) {
      try {
        await pool.query(`
          INSERT INTO patients_sync (hospital_patient_id, numero_patient, nom, prenom, telephone, date_naissance)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [1000 + Math.floor(Math.random() * 9000), patient.numero_patient, patient.nom, patient.prenom, patient.telephone, patient.date_naissance])
      } catch (error) {
        // Ignorer les erreurs de doublon
        if (error.code !== '23505') {
          throw error
        }
      }
    }
    
    // Recuperer les IDs des patients
    const patients = await pool.query('SELECT project_patient_id, numero_patient FROM patients_sync ORDER BY project_patient_id')
    
    // Inserer les hospitalisations de test
    console.log('Insertion des hospitalisations de test...')
    for (let i = 0; i < patients.rows.length; i++) {
      const patient = patients.rows[i]
      const hosp = testHospitalisations[i % testHospitalisations.length]
      
      const dateSortie = new Date()
      dateSortie.setDate(dateSortie.getDate() - Math.floor(Math.random() * 30) - 1)
      
      try {
        await pool.query(`
          INSERT INTO hospitalisations_sync (hospital_hospitalisation_id, project_patient_id, service, medecin, site, date_sortie, statut)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [2000 + Math.floor(Math.random() * 8000), patient.project_patient_id, hosp.service, hosp.medecin, hosp.site, dateSortie, 'terminee'])
      } catch (error) {
        // Ignorer les erreurs de doublon
        if (error.code !== '23505') {
          throw error
        }
      }
    }
    
    // Recuperer les hospitalisations
    const hospitalisations = await pool.query(`
      SELECT h.project_hospitalisation_id, h.project_patient_id, h.service, h.medecin, h.site, h.date_sortie
      FROM hospitalisations_sync h
      ORDER BY h.project_hospitalisation_id
    `)
    
    // Desactiver temporairement le trigger audit_call_changes
    console.log('Desactivation du trigger audit_call_changes...')
    await pool.query('DROP TRIGGER IF EXISTS trigger_audit_calls ON calls')
    
    // Generer les appels de test
    console.log('Generation des appels de test...')
    const statuts = ['pending', 'called', 'failed', 'in_progress']
    const scores = [null, 25, 45, 60, 75, 85, 95]
    
    for (let i = 0; i < 50; i++) {
      const hosp = hospitalisations.rows[i % hospitalisations.rows.length]
      const statut = statuts[Math.floor(Math.random() * statuts.length)]
      const score = scores[Math.floor(Math.random() * scores.length)]
      
      // Date d'appel prevue (3-7 jours apres la sortie)
      const dateAppelPrevue = new Date(hosp.date_sortie)
      dateAppelPrevue.setDate(dateAppelPrevue.getDate() + 3 + Math.floor(Math.random() * 5))
      
      // Date d'appel reelle (si appele)
      let dateAppelReelle = null
      let dureeSecondes = null
      let resumeAppel = null
      let dialogueResult = null
      let nombreTentatives = 0
      
      if (statut === 'called') {
        dateAppelReelle = new Date(dateAppelPrevue)
        dateAppelReelle.setHours(9 + Math.floor(Math.random() * 8))
        dateAppelReelle.setMinutes(Math.floor(Math.random() * 60))
        
        dureeSecondes = 60 + Math.floor(Math.random() * 600) // 1-10 minutes
        resumeAppel = testResumes[Math.floor(Math.random() * testResumes.length)]
        dialogueResult = testDialogues[Math.floor(Math.random() * testDialogues.length)]
        nombreTentatives = 1 + Math.floor(Math.random() * 3)
      } else if (statut === 'failed') {
        nombreTentatives = 3 + Math.floor(Math.random() * 2)
      } else if (statut === 'pending') {
        nombreTentatives = 0
      } else if (statut === 'in_progress') {
        nombreTentatives = 1 + Math.floor(Math.random() * 2)
      }
      
      await pool.query(`
        INSERT INTO calls (
          project_patient_id,
          project_hospitalisation_id,
          statut,
          date_appel_prevue,
          date_appel_reelle,
          duree_secondes,
          score,
          resume_appel,
          dialogue_result,
          nombre_tentatives,
          date_creation,
          date_modification
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        hosp.project_patient_id,
        hosp.project_hospitalisation_id,
        statut,
        dateAppelPrevue,
        dateAppelReelle,
        dureeSecondes,
        score,
        resumeAppel,
        dialogueResult ? JSON.stringify(dialogueResult) : null,
        nombreTentatives,
        new Date(),
        new Date()
      ])
    }
    
    // Generer quelques scores detailles
    console.log('Generation des scores detailles...')
    const callsWithScores = await pool.query(`
      SELECT project_call_id FROM calls 
      WHERE statut = 'called' AND score IS NOT NULL 
      LIMIT 20
    `)
    
    for (const call of callsWithScores.rows) {
      const typesScores = ['qualite_communication', 'comprehension_patient', 'satisfaction', 'suivi_traitement']
      
      for (const typeScore of typesScores) {
        const valeurScore = 20 + Math.floor(Math.random() * 80)
        const poidsScore = 1 + Math.floor(Math.random() * 5) // Valeur entiere entre 1 et 5
        
        await pool.query(`
          INSERT INTO scores (project_call_id, type_score, valeur_score, poids_score, commentaire)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          call.project_call_id,
          typeScore,
          valeurScore,
          poidsScore,
          `Score ${typeScore} genere automatiquement`
        ])
      }
    }
    
    // Generer quelques metadonnees
    console.log('Generation des metadonnees...')
    const callsForMetadata = await pool.query(`
      SELECT project_call_id FROM calls 
      WHERE statut = 'called' 
      LIMIT 15
    `)
    
    const metadonnees = [
      { cle: 'type_appel', valeur: 'post_hospitalisation' },
      { cle: 'priorite', valeur: Math.random() > 0.5 ? 'normale' : 'elevee' },
      { cle: 'langue', valeur: Math.random() > 0.8 ? 'anglais' : 'francais' },
      { cle: 'accessibilite', valeur: Math.random() > 0.9 ? 'handicap_auditif' : 'standard' },
      { cle: 'urgence', valeur: Math.random() > 0.95 ? 'oui' : 'non' }
    ]
    
    for (const call of callsForMetadata.rows) {
      const metadonnee = metadonnees[Math.floor(Math.random() * metadonnees.length)]
      
      await pool.query(`
        INSERT INTO call_metadata (project_call_id, cle_metadonnee, valeur_metadonnee, type_donnee)
        VALUES ($1, $2, $3, $4)
      `, [
        call.project_call_id,
        metadonnee.cle,
        metadonnee.valeur,
        'TEXT'
      ])
    }
    
    // Statistiques finales
    const stats = await pool.query(`
      SELECT 
        statut,
        COUNT(*) as nombre,
        AVG(score) as score_moyen,
        AVG(duree_secondes) as duree_moyenne
      FROM calls 
      GROUP BY statut
      ORDER BY statut
    `)
    
    console.log('\nStatistiques des appels generes:')
    stats.rows.forEach(row => {
      console.log(`  - ${row.statut}: ${row.nombre} appels (score moyen: ${Math.round(row.score_moyen || 0)}, duree moyenne: ${Math.round(row.duree_moyenne || 0)}s)`)
    })
    
    const totalCalls = await pool.query('SELECT COUNT(*) as total FROM calls')
    const totalPatients = await pool.query('SELECT COUNT(*) as total FROM patients_sync')
    const totalHospitalisations = await pool.query('SELECT COUNT(*) as total FROM hospitalisations_sync')
    
    console.log('\nGeneration terminee avec succes!')
    console.log(`Resume:`)
    console.log(`  - ${totalPatients.rows[0].total} patients crees`)
    console.log(`  - ${totalHospitalisations.rows[0].total} hospitalisations creees`)
    console.log(`  - ${totalCalls.rows[0].total} appels generes`)
    console.log(`  - Scores detailles ajoutes`)
    console.log(`  - Metadonnees ajoutees`)
    
  } catch (error) {
    console.error('Erreur lors de la generation:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Executer si le script est appele directement
if (require.main === module) {
  generateTestCalls()
    .then(() => {
      console.log('Script termine avec succes')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Erreur:', error)
      process.exit(1)
    })
}

module.exports = { generateTestCalls } 