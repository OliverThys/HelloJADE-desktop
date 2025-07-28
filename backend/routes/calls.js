const express = require('express')
const { executeQuery } = require('../database')

const router = express.Router()

// Récupérer tous les appels (patients hospitalisés)
router.get('/', async (req, res) => {
  try {
    console.log('📞 API /calls appelée avec les paramètres:', req.query)
    
    const { page = 1, per_page = 10, search = '', status = '' } = req.query
    
    // Requête SQL pour récupérer les patients hospitalisés
    const sql = `
      SELECT 
        p.PATIENT_ID as id,
        p.NUMERO_REGISTRE_NATIONAL as patient_number,
        p.NOM as patient_last_name,
        p.PRENOM as patient_first_name,
        p.DATE_NAISSANCE as birth_date,
        p.TELEPHONE as phone,
        'CHU Liège' as hospital_site,
        h.DATE_SORTIE as discharge_date,
        h.DATE_SORTIE + 1 as scheduled_call,
        'pending' as status,
        m.NOM || ' ' || m.PRENOM as doctor,
        s.NOM_SERVICE as service,
        NULL as actual_call,
        NULL as duration,
        NULL as score
      FROM PATIENTS p
      INNER JOIN HOSPITALISATIONS h ON p.PATIENT_ID = h.PATIENT_ID
      INNER JOIN MEDECINS m ON h.MEDECIN_TRAITANT_ID = m.MEDECIN_ID
      INNER JOIN SERVICES s ON h.SERVICE_ID = s.SERVICE_ID
      WHERE h.DATE_SORTIE IS NOT NULL OR h.STATUT = 'EN_COURS'
      ${search ? "AND (p.NOM LIKE '%' || :search || '%' OR p.PRENOM LIKE '%' || :search || '%' OR p.NUMERO_REGISTRE_NATIONAL LIKE '%' || :search || '%')" : ''}
      ORDER BY h.DATE_SORTIE DESC
    `
    
    console.log('🔍 Exécution de la requête SQL...')
    console.log('📝 SQL:', sql)
    
    const binds = []
    if (search) binds.push(search)
    if (status) binds.push(status)
    
    console.log('🔗 Binds:', binds)
    
    const patients = await executeQuery(sql, binds)
    
    console.log(`✅ ${patients.length} patients récupérés de la base de données`)
    
    // Pagination
    const total = patients.length
    const startIndex = (page - 1) * per_page
    const endIndex = startIndex + parseInt(per_page)
    const paginatedPatients = patients.slice(startIndex, endIndex)
    
    console.log(`📊 Pagination: ${paginatedPatients.length} patients sur ${total} total`)
    
    // Transformer les données pour correspondre au format attendu par le frontend
    const transformedPatients = paginatedPatients.map(patient => ({
      id: patient.ID,
      patient_number: patient.PATIENT_NUMBER,
      patient_last_name: patient.PATIENT_LAST_NAME,
      patient_first_name: patient.PATIENT_FIRST_NAME,
      birth_date: patient.BIRTH_DATE ? new Date(patient.BIRTH_DATE).toISOString().split('T')[0] : null,
      phone: patient.PHONE,
      hospital_site: patient.HOSPITAL_SITE,
      discharge_date: patient.DISCHARGE_DATE ? new Date(patient.DISCHARGE_DATE).toISOString().split('T')[0] : null,
      scheduled_call: patient.SCHEDULED_CALL ? new Date(patient.SCHEDULED_CALL).toISOString() : null,
      status: patient.STATUS || 'pending',
      doctor: patient.DOCTOR,
      service: patient.SERVICE,
      actual_call: patient.ACTUAL_CALL ? new Date(patient.ACTUAL_CALL).toISOString() : null,
      duration: patient.DURATION,
      score: patient.SCORE
    }))
    
    console.log('📤 Envoi de la réponse au frontend...')
    console.log('📋 Premier patient transformé:', transformedPatients[0])
    
    res.json({
      success: true,
      data: {
        items: transformedPatients,
        total,
        page: parseInt(page),
        per_page: parseInt(per_page),
        pages: Math.ceil(total / per_page)
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des appels:', error)
    console.error('🔍 Stack trace:', error.stack)
    
    // Réponse d'erreur plus détaillée
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des appels',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// Récupérer un appel spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const sql = `
      SELECT 
        p.PATIENT_ID as id,
        p.NUMERO_REGISTRE_NATIONAL as patient_number,
        p.NOM as patient_last_name,
        p.PRENOM as patient_first_name,
        p.DATE_NAISSANCE as birth_date,
        p.TELEPHONE as phone,
        'CHU Liège' as hospital_site,
        h.DATE_SORTIE as discharge_date,
        h.DATE_SORTIE + 1 as scheduled_call,
        'pending' as status,
        m.NOM || ' ' || m.PRENOM as doctor,
        s.NOM_SERVICE as service,
        NULL as actual_call,
        NULL as duration,
        NULL as score
      FROM PATIENTS p
      INNER JOIN HOSPITALISATIONS h ON p.PATIENT_ID = h.PATIENT_ID
      INNER JOIN MEDECINS m ON h.MEDECIN_TRAITANT_ID = m.MEDECIN_ID
      INNER JOIN SERVICES s ON h.SERVICE_ID = s.SERVICE_ID
      WHERE p.PATIENT_ID = :id
    `
    
    const patients = await executeQuery(sql, [id])
    
    if (patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      })
    }
    
    const patient = patients[0]
    const transformedPatient = {
      id: patient.ID,
      patient_number: patient.PATIENT_NUMBER,
      patient_last_name: patient.PATIENT_LAST_NAME,
      patient_first_name: patient.PATIENT_FIRST_NAME,
      birth_date: patient.BIRTH_DATE ? new Date(patient.BIRTH_DATE).toISOString().split('T')[0] : null,
      phone: patient.PHONE,
      hospital_site: patient.HOSPITAL_SITE,
      discharge_date: patient.DISCHARGE_DATE ? new Date(patient.DISCHARGE_DATE).toISOString().split('T')[0] : null,
      scheduled_call: patient.SCHEDULED_CALL ? new Date(patient.SCHEDULED_CALL).toISOString() : null,
      status: patient.STATUS || 'pending',
      doctor: patient.DOCTOR,
      service: patient.SERVICE,
      actual_call: patient.ACTUAL_CALL ? new Date(patient.ACTUAL_CALL).toISOString() : null,
      duration: patient.DURATION,
      score: patient.SCORE
    }
    
    res.json({
      success: true,
      data: transformedPatient
    })
    
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'appel:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'appel',
      error: error.message
    })
  }
})

module.exports = router 