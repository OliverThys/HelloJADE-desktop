const express = require('express')
const { Pool } = require('pg')

const router = express.Router()

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

// Récupérer tous les patients
router.get('/', async (req, res) => {
  const pool = new Pool(postgresConfig)
  
  try {
    console.log('👥 API /patients appelée avec les paramètres:', req.query)
    
    const { page = 1, per_page = 50, search = '', status = '' } = req.query
    
    let sql = `
      SELECT 
        p.project_patient_id as id,
        p.numero_patient,
        p.nom,
        p.prenom,
        p.date_naissance,
        p.telephone,
        p.date_creation,
        p.statut_sync as statut,
        COALESCE(h.service, 'Pas hospitalisé') as service,
        h.medecin as medecin_hospitalisation,
        h.site as site_hospitalisation
      FROM patients_sync p
      LEFT JOIN hospitalisations_sync h ON p.project_patient_id = h.project_patient_id AND h.statut = 'terminee'
      WHERE 1=1
    `
    
    const binds = []
    
    if (search) {
      sql += ` AND (p.nom ILIKE $${binds.length + 1} OR p.prenom ILIKE $${binds.length + 1} OR p.numero_patient ILIKE $${binds.length + 1} OR p.telephone ILIKE $${binds.length + 1})`
      binds.push(`%${search}%`)
    }
    
    if (status) {
      sql += ` AND p.statut_sync = $${binds.length + 1}`
      binds.push(status)
    }
    
    sql += ` ORDER BY p.nom, p.prenom`
    
    console.log('🔍 Exécution de la requête SQL...')
    console.log('📝 SQL:', sql)
    console.log('🔗 Binds:', binds)
    
    const patients = await pool.query(sql, binds)
    
    console.log(`✅ ${patients.rows.length} patients récupérés de la base de données`)
    if (patients.rows.length > 0) {
      console.log('📊 Premier patient:', patients.rows[0])
      console.log('📊 Dernier patient:', patients.rows[patients.rows.length - 1])
    }
    
    // Pagination
    const total = patients.rows.length
    const startIndex = (page - 1) * per_page
    const endIndex = startIndex + parseInt(per_page)
    const paginatedPatients = patients.rows.slice(startIndex, endIndex)
    
    console.log(`📊 Pagination: ${paginatedPatients.length} patients sur ${total} total`)
    
    // Transformer les données pour correspondre au format attendu par le frontend
    const transformedPatients = paginatedPatients.map(patient => ({
      id: patient.id,
      numero_patient: patient.numero_patient,
      nom: patient.nom ? patient.nom.toString().trim() : null,
      prenom: patient.prenom ? patient.prenom.toString().trim() : null,
      date_naissance: patient.date_naissance ? new Date(patient.date_naissance).toISOString().split('T')[0] : null,
      telephone: patient.telephone,
      date_creation: patient.date_creation ? new Date(patient.date_creation).toISOString().split('T')[0] : null,
      statut: patient.statut,
      service: patient.service ? patient.service.toString().trim() : null,
      medecin_hospitalisation: patient.medecin_hospitalisation ? patient.medecin_hospitalisation.toString().trim() : null,
      site_hospitalisation: patient.site_hospitalisation ? patient.site_hospitalisation.toString().trim() : null
    }))
    
    console.log('📤 Envoi de la réponse au frontend...')
    if (transformedPatients.length > 0) {
      console.log('📋 Premier patient transformé:', transformedPatients[0])
    }
    
    const response = {
      success: true,
      data: {
        items: transformedPatients,
        total,
        page: parseInt(page),
        per_page: parseInt(per_page),
        pages: Math.ceil(total / per_page)
      }
    }
    
    console.log('📤 Réponse JSON:', JSON.stringify(response, null, 2))
    
    res.json(response)
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des patients:', error)
    console.error('🔍 Stack trace:', error.stack)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des patients',
      error: error.message,
      stack: error.stack
    })
  } finally {
    await pool.end()
  }
})

// Récupérer un patient par ID
router.get('/:id', async (req, res) => {
  const pool = new Pool(postgresConfig)
  
  try {
    const { id } = req.params
    
    const sql = `
      SELECT 
        p.project_patient_id as id,
        p.numero_patient,
        p.nom,
        p.prenom,
        p.date_naissance,
        p.telephone,
        p.date_creation,
        p.statut_sync as statut,
        h.service,
        h.medecin as medecin_hospitalisation,
        h.site as site_hospitalisation
      FROM patients_sync p
      LEFT JOIN hospitalisations_sync h ON p.project_patient_id = h.project_patient_id AND h.statut = 'terminee'
      WHERE p.project_patient_id = $1
    `
    
    const patients = await pool.query(sql, [id])
    
    if (patients.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      })
    }
    
    // Transformer les données pour correspondre au format attendu par le frontend
    const patient = patients.rows[0]
    const transformedPatient = {
      id: patient.id,
      numero_patient: patient.numero_patient,
      nom: patient.nom ? patient.nom.toString().trim() : null,
      prenom: patient.prenom ? patient.prenom.toString().trim() : null,
      date_naissance: patient.date_naissance ? new Date(patient.date_naissance).toISOString().split('T')[0] : null,
      telephone: patient.telephone,
      date_creation: patient.date_creation ? new Date(patient.date_creation).toISOString().split('T')[0] : null,
      statut: patient.statut,
      service: patient.service ? patient.service.toString().trim() : null,
      medecin_hospitalisation: patient.medecin_hospitalisation ? patient.medecin_hospitalisation.toString().trim() : null,
      site_hospitalisation: patient.site_hospitalisation ? patient.site_hospitalisation.toString().trim() : null
    }
    
    res.json({
      success: true,
      data: transformedPatient
    })
    
  } catch (error) {
    console.error('Erreur lors de la récupération du patient:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du patient',
      error: error.message
    })
  } finally {
    await pool.end()
  }
})

// Rechercher un patient par téléphone
router.get('/search/phone/:phone', async (req, res) => {
  const pool = new Pool(postgresConfig)
  
  try {
    const { phone } = req.params
    
    const sql = `
      SELECT 
        p.project_patient_id as id,
        p.numero_patient,
        p.nom,
        p.prenom,
        p.date_naissance,
        p.telephone,
        p.date_creation,
        p.statut_sync as statut,
        h.service,
        h.medecin as medecin_hospitalisation,
        h.site as site_hospitalisation
      FROM patients_sync p
      LEFT JOIN hospitalisations_sync h ON p.project_patient_id = h.project_patient_id AND h.statut = 'terminee'
      WHERE p.telephone = $1
    `
    
    const patients = await pool.query(sql, [phone])
    
    if (patients.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      })
    }
    
    // Transformer les données pour correspondre au format attendu par le frontend
    const patient = patients.rows[0]
    const transformedPatient = {
      id: patient.id,
      numero_patient: patient.numero_patient,
      nom: patient.nom ? patient.nom.toString().trim() : null,
      prenom: patient.prenom ? patient.prenom.toString().trim() : null,
      date_naissance: patient.date_naissance ? new Date(patient.date_naissance).toISOString().split('T')[0] : null,
      telephone: patient.telephone,
      date_creation: patient.date_creation ? new Date(patient.date_creation).toISOString().split('T')[0] : null,
      statut: patient.statut,
      service: patient.service ? patient.service.toString().trim() : null,
      medecin_hospitalisation: patient.medecin_hospitalisation ? patient.medecin_hospitalisation.toString().trim() : null,
      site_hospitalisation: patient.site_hospitalisation ? patient.site_hospitalisation.toString().trim() : null
    }
    
    res.json({
      success: true,
      data: transformedPatient
    })
    
  } catch (error) {
    console.error('Erreur lors de la recherche du patient:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche du patient',
      error: error.message
    })
  } finally {
    await pool.end()
  }
})

// Récupérer les hospitalisations d'un patient
router.get('/:id/hospitalisations', async (req, res) => {
  const pool = new Pool(postgresConfig)
  
  try {
    const { id } = req.params
    
    const sql = `
      SELECT 
        h.project_hospitalisation_id as id,
        h.project_patient_id as patient_id,
        h.service,
        h.medecin,
        h.site,
        h.date_sortie,
        h.statut,
        h.date_creation,
        h.diagnostic
      FROM hospitalisations_sync h
      WHERE h.project_patient_id = $1
      ORDER BY h.date_sortie DESC
    `
    
    const hospitalisations = await pool.query(sql, [id])
    
    // Transformer les données pour correspondre au format attendu par le frontend
    const transformedHospitalisations = hospitalisations.rows.map(hosp => ({
      id: hosp.id,
      patient_id: hosp.patient_id,
      service: hosp.service,
      medecin: hosp.medecin,
      site: hosp.site,
      date_sortie: hosp.date_sortie ? new Date(hosp.date_sortie).toISOString().split('T')[0] : null,
      statut: hosp.statut,
      date_creation: hosp.date_creation ? new Date(hosp.date_creation).toISOString().split('T')[0] : null,
      diagnostic: hosp.diagnostic
    }))
    
    res.json({
      success: true,
      data: transformedHospitalisations
    })
    
  } catch (error) {
    console.error('Erreur lors de la récupération des hospitalisations:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des hospitalisations',
      error: error.message
    })
  } finally {
    await pool.end()
  }
})

module.exports = router