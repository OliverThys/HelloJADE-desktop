const express = require('express')
const { executeQuery } = require('../database')

const router = express.Router()

// Récupérer tous les patients
router.get('/', async (req, res) => {
  try {
    console.log('👥 API /patients appelée avec les paramètres:', req.query)
    
    const { page = 1, per_page = 50, search = '', status = '' } = req.query
    
    let sql = `
      SELECT 
        p.PATIENT_ID as id,
        p.NUMERO_PATIENT as numero_patient,
        p.NOM as nom,
        p.PRENOM as prenom,
        p.DATE_NAISSANCE as date_naissance,
        p.SEXE as sexe,
        p.TELEPHONE as telephone,
        p.EMAIL as email,
        p.DATE_CREATION as date_creation,
        p.STATUT as statut,
        p.ADRESSE as adresse,
        p.CODE_POSTAL as code_postal,
        p.VILLE as ville,
        p.MEDECIN_TRAITANT as medecin_traitant,
        p.PERSONNE_CONTACT as personne_contact,
        p.TEL_CONTACT as tel_contact,
        p.NUMERO_SECU as numero_secu,
        COALESCE(h.SERVICE, 'Pas hospitalisé') as service,
        h.MEDECIN as medecin_hospitalisation
      FROM PATIENTS p
      LEFT JOIN HOSPITALISATIONS h ON p.PATIENT_ID = h.PATIENT_ID AND h.STATUT = 'EN_COURS'
      WHERE 1=1
    `
    
    const binds = []
    
    if (search) {
      sql += ` AND (p.NOM LIKE '%' || ? || '%' OR p.PRENOM LIKE '%' || ? || '%' OR p.NUMERO_PATIENT LIKE '%' || ? || '%' OR p.TELEPHONE LIKE '%' || ? || '%')`
      binds.push(search, search, search, search)
    }
    
    if (status) {
      sql += ` AND p.STATUT = ?`
      binds.push(status)
    }
    
    sql += ` ORDER BY p.NOM, p.PRENOM`
    
    console.log('🔍 Exécution de la requête SQL...')
    console.log('📝 SQL:', sql)
    console.log('🔗 Binds:', binds)
    
    const patients = await executeQuery(sql, binds)
    
    console.log(`✅ ${patients.length} patients récupérés de la base de données`)
    console.log('📊 Premier patient:', patients[0])
    console.log('📊 Dernier patient:', patients[patients.length - 1])
    
    // Pagination
    const total = patients.length
    const startIndex = (page - 1) * per_page
    const endIndex = startIndex + parseInt(per_page)
    const paginatedPatients = patients.slice(startIndex, endIndex)
    
    console.log(`📊 Pagination: ${paginatedPatients.length} patients sur ${total} total`)
    
    // Transformer les données pour correspondre au format attendu par le frontend
    const transformedPatients = paginatedPatients.map(patient => ({
      id: patient.ID,
      numero_patient: patient.NUMERO_PATIENT,
      nom: patient.NOM ? patient.NOM.toString().trim() : null,
      prenom: patient.PRENOM ? patient.PRENOM.toString().trim() : null,
      date_naissance: patient.DATE_NAISSANCE ? new Date(patient.DATE_NAISSANCE).toISOString().split('T')[0] : null,
      sexe: patient.SEXE,
      telephone: patient.TELEPHONE,
      email: patient.EMAIL,
      date_creation: patient.DATE_CREATION ? new Date(patient.DATE_CREATION).toISOString().split('T')[0] : null,
      statut: patient.STATUT,
      adresse: patient.ADRESSE ? patient.ADRESSE.toString().trim() : null,
      code_postal: patient.CODE_POSTAL,
      ville: patient.VILLE ? patient.VILLE.toString().trim() : null,
      medecin_traitant: patient.MEDECIN_TRAITANT ? patient.MEDECIN_TRAITANT.toString().trim() : null,
      personne_contact: patient.PERSONNE_CONTACT ? patient.PERSONNE_CONTACT.toString().trim() : null,
      tel_contact: patient.TEL_CONTACT,
      numero_secu: patient.NUMERO_SECU,
      service: patient.SERVICE ? patient.SERVICE.toString().trim() : null,
      medecin_hospitalisation: patient.MEDECIN_HOSPITALISATION ? patient.MEDECIN_HOSPITALISATION.toString().trim() : null
    }))
    
    console.log('📤 Envoi de la réponse au frontend...')
    console.log('📋 Premier patient transformé:', transformedPatients[0])
    
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
  }
})

// Récupérer un patient par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const sql = `
      SELECT 
        p.PATIENT_ID as id,
        p.NUMERO_PATIENT as numero_patient,
        p.NOM as nom,
        p.PRENOM as prenom,
        p.DATE_NAISSANCE as date_naissance,
        p.SEXE as sexe,
        p.TELEPHONE as telephone,
        p.EMAIL as email,
        p.DATE_CREATION as date_creation,
        p.STATUT as statut,
        p.ADRESSE as adresse,
        p.CODE_POSTAL as code_postal,
        p.VILLE as ville,
        p.MEDECIN_TRAITANT as medecin_traitant,
        p.PERSONNE_CONTACT as personne_contact,
        p.TEL_CONTACT as tel_contact,
        p.NUMERO_SECU as numero_secu,
        h.SERVICE as service,
        h.MEDECIN as medecin_hospitalisation
      FROM PATIENTS p
      LEFT JOIN HOSPITALISATIONS h ON p.PATIENT_ID = h.PATIENT_ID AND h.STATUT = 'EN_COURS'
      WHERE p.PATIENT_ID = :id
    `
    
    const patients = await executeQuery(sql, [id])
    
    if (patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      })
    }
    
    // Transformer les données pour correspondre au format attendu par le frontend
    const patient = patients[0]
    const transformedPatient = {
      id: patient.ID,
      numero_patient: patient.NUMERO_PATIENT,
      nom: patient.NOM ? patient.NOM.toString().trim() : null,
      prenom: patient.PRENOM ? patient.PRENOM.toString().trim() : null,
      date_naissance: patient.DATE_NAISSANCE ? new Date(patient.DATE_NAISSANCE).toISOString().split('T')[0] : null,
      sexe: patient.SEXE,
      telephone: patient.TELEPHONE,
      email: patient.EMAIL,
      date_creation: patient.DATE_CREATION ? new Date(patient.DATE_CREATION).toISOString().split('T')[0] : null,
      statut: patient.STATUT,
      adresse: patient.ADRESSE ? patient.ADRESSE.toString().trim() : null,
      code_postal: patient.CODE_POSTAL,
      ville: patient.VILLE ? patient.VILLE.toString().trim() : null,
      medecin_traitant: patient.MEDECIN_TRAITANT ? patient.MEDECIN_TRAITANT.toString().trim() : null,
      personne_contact: patient.PERSONNE_CONTACT ? patient.PERSONNE_CONTACT.toString().trim() : null,
      tel_contact: patient.TEL_CONTACT,
      numero_secu: patient.NUMERO_SECU,
      service: patient.SERVICE ? patient.SERVICE.toString().trim() : null,
      medecin_hospitalisation: patient.MEDECIN_HOSPITALISATION ? patient.MEDECIN_HOSPITALISATION.toString().trim() : null
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
  }
})

// Rechercher un patient par téléphone
router.get('/search/phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params
    
    const sql = `
      SELECT 
        p.PATIENT_ID as id,
        p.NUMERO_PATIENT as numero_patient,
        p.NOM as nom,
        p.PRENOM as prenom,
        p.DATE_NAISSANCE as date_naissance,
        p.SEXE as sexe,
        p.TELEPHONE as telephone,
        p.EMAIL as email,
        p.DATE_CREATION as date_creation,
        p.STATUT as statut,
        p.ADRESSE as adresse,
        p.CODE_POSTAL as code_postal,
        p.VILLE as ville,
        p.MEDECIN_TRAITANT as medecin_traitant,
        p.PERSONNE_CONTACT as personne_contact,
        p.TEL_CONTACT as tel_contact,
        p.NUMERO_SECU as numero_secu,
        h.SERVICE as service,
        h.MEDECIN as medecin_hospitalisation
      FROM PATIENTS p
      LEFT JOIN HOSPITALISATIONS h ON p.PATIENT_ID = h.PATIENT_ID AND h.STATUT = 'EN_COURS'
      WHERE p.TELEPHONE = :phone
    `
    
    const patients = await executeQuery(sql, [phone])
    
    if (patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      })
    }
    
    // Transformer les données pour correspondre au format attendu par le frontend
    const patient = patients[0]
    const transformedPatient = {
      id: patient.ID,
      numero_patient: patient.NUMERO_PATIENT,
      nom: patient.NOM ? patient.NOM.toString().trim() : null,
      prenom: patient.PRENOM ? patient.PRENOM.toString().trim() : null,
      date_naissance: patient.DATE_NAISSANCE ? new Date(patient.DATE_NAISSANCE).toISOString().split('T')[0] : null,
      sexe: patient.SEXE,
      telephone: patient.TELEPHONE,
      email: patient.EMAIL,
      date_creation: patient.DATE_CREATION ? new Date(patient.DATE_CREATION).toISOString().split('T')[0] : null,
      statut: patient.STATUT,
      adresse: patient.ADRESSE ? patient.ADRESSE.toString().trim() : null,
      code_postal: patient.CODE_POSTAL,
      ville: patient.VILLE ? patient.VILLE.toString().trim() : null,
      medecin_traitant: patient.MEDECIN_TRAITANT ? patient.MEDECIN_TRAITANT.toString().trim() : null,
      personne_contact: patient.PERSONNE_CONTACT ? patient.PERSONNE_CONTACT.toString().trim() : null,
      tel_contact: patient.TEL_CONTACT,
      numero_secu: patient.NUMERO_SECU,
      service: patient.SERVICE ? patient.SERVICE.toString().trim() : null,
      medecin_hospitalisation: patient.MEDECIN_HOSPITALISATION ? patient.MEDECIN_HOSPITALISATION.toString().trim() : null
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
  }
})

// Récupérer les hospitalisations d'un patient
router.get('/:id/hospitalisations', async (req, res) => {
  try {
    const { id } = req.params
    
    const sql = `
      SELECT 
        h.HOSP_ID as id,
        h.PATIENT_ID as patient_id,
        h.NUMERO_SEJOUR as numero_sejour,
        h.SERVICE as service,
        h.MEDECIN as medecin,
        h.DATE_ENTREE as date_entree,
        h.DATE_SORTIE as date_sortie,
        h.DIAGNOSTIC as diagnostic,
        h.STATUT as statut,
        h.DATE_CREATION as date_creation
      FROM HOSPITALISATIONS h
      WHERE h.PATIENT_ID = :id
      ORDER BY h.DATE_ENTREE DESC
    `
    
    const hospitalisations = await executeQuery(sql, [id])
    
    // Transformer les données pour correspondre au format attendu par le frontend
    const transformedHospitalisations = hospitalisations.map(hosp => ({
      id: hosp.ID,
      patient_id: hosp.PATIENT_ID,
      numero_sejour: hosp.NUMERO_SEJOUR,
      service: hosp.SERVICE,
      medecin: hosp.MEDECIN,
      date_entree: hosp.DATE_ENTREE ? new Date(hosp.DATE_ENTREE).toISOString().split('T')[0] : null,
      date_sortie: hosp.DATE_SORTIE ? new Date(hosp.DATE_SORTIE).toISOString().split('T')[0] : null,
      diagnostic: hosp.DIAGNOSTIC,
      statut: hosp.STATUT,
      date_creation: hosp.DATE_CREATION ? new Date(hosp.DATE_CREATION).toISOString().split('T')[0] : null
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
  }
})

// Récupérer les consultations d'un patient
router.get('/:id/consultations', async (req, res) => {
  try {
    const { id } = req.params
    
    const sql = `
      SELECT 
        c.CONSULTATION_ID as id,
        c.HOSP_ID as hosp_id,
        c.PATIENT_ID as patient_id,
        c.DATE_CONSULTATION as date_consultation,
        c.TYPE_CONSULTATION as type_consultation,
        c.MEDECIN as medecin,
        c.STATUT as statut,
        c.NOTES as notes,
        c.DATE_CREATION as date_creation
      FROM CONSULTATIONS c
      WHERE c.PATIENT_ID = :id
      ORDER BY c.DATE_CONSULTATION DESC
    `
    
    const consultations = await executeQuery(sql, [id])
    
    // Transformer les données pour correspondre au format attendu par le frontend
    const transformedConsultations = consultations.map(consult => ({
      id: consult.ID,
      hosp_id: consult.HOSP_ID,
      patient_id: consult.PATIENT_ID,
      date_consultation: consult.DATE_CONSULTATION ? new Date(consult.DATE_CONSULTATION).toISOString().split('T')[0] : null,
      type_consultation: consult.TYPE_CONSULTATION,
      medecin: consult.MEDECIN,
      statut: consult.STATUT,
      notes: consult.NOTES,
      date_creation: consult.DATE_CREATION ? new Date(consult.DATE_CREATION).toISOString().split('T')[0] : null
    }))
    
    res.json({
      success: true,
      data: transformedConsultations
    })
    
  } catch (error) {
    console.error('Erreur lors de la récupération des consultations:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des consultations',
      error: error.message
    })
  }
})

// Récupérer les transcriptions d'un patient
router.get('/:id/transcriptions', async (req, res) => {
  try {
    const { id } = req.params
    
    const sql = `
      SELECT 
        t.TRANSCRIPTION_ID as id,
        t.CONSULTATION_ID as consultation_id,
        t.PATIENT_ID as patient_id,
        t.FICHIER_AUDIO as fichier_audio,
        t.TEXTE_TRANSCRIT as texte_transcrit,
        t.SCORE_CONFIANCE as score_confiance,
        t.DUREE_SECONDES as duree_secondes,
        t.STATUT as statut,
        t.DATE_TRANSCRIPTION as date_transcription
      FROM TRANSCRIPTIONS t
      WHERE t.PATIENT_ID = :id
      ORDER BY t.DATE_TRANSCRIPTION DESC
    `
    
    const transcriptions = await executeQuery(sql, [id])
    
    // Transformer les données pour correspondre au format attendu par le frontend
    const transformedTranscriptions = transcriptions.map(trans => ({
      id: trans.ID,
      consultation_id: trans.CONSULTATION_ID,
      patient_id: trans.PATIENT_ID,
      fichier_audio: trans.FICHIER_AUDIO,
      texte_transcrit: trans.TEXTE_TRANSCRIT,
      score_confiance: trans.SCORE_CONFIANCE,
      duree_secondes: trans.DUREE_SECONDES,
      statut: trans.STATUT,
      date_transcription: trans.DATE_TRANSCRIPTION ? new Date(trans.DATE_TRANSCRIPTION).toISOString().split('T')[0] : null
    }))
    
    res.json({
      success: true,
      data: transformedTranscriptions
    })
    
  } catch (error) {
    console.error('Erreur lors de la récupération des transcriptions:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des transcriptions',
      error: error.message
    })
  }
})

// Récupérer les analyses IA d'un patient
router.get('/:id/analyses', async (req, res) => {
  try {
    const { id } = req.params
    
    const sql = `
      SELECT 
        a.ANALYSE_ID as id,
        a.TRANSCRIPTION_ID as transcription_id,
        a.PATIENT_ID as patient_id,
        a.TYPE_ANALYSE as type_analyse,
        a.RESULTATS as resultats,
        a.MOTS_CLES as mots_cles,
        a.SENTIMENT as sentiment,
        a.SCORE_URGENCE as score_urgence,
        a.MODELE_IA as modele_ia,
        a.DATE_ANALYSE as date_analyse
      FROM ANALYSES_IA a
      WHERE a.PATIENT_ID = :id
      ORDER BY a.DATE_ANALYSE DESC
    `
    
    const analyses = await executeQuery(sql, [id])
    
    // Transformer les données pour correspondre au format attendu par le frontend
    const transformedAnalyses = analyses.map(analyse => ({
      id: analyse.ID,
      transcription_id: analyse.TRANSCRIPTION_ID,
      patient_id: analyse.PATIENT_ID,
      type_analyse: analyse.TYPE_ANALYSE,
      resultats: analyse.RESULTATS,
      mots_cles: analyse.MOTS_CLES,
      sentiment: analyse.SENTIMENT,
      score_urgence: analyse.SCORE_URGENCE,
      modele_ia: analyse.MODELE_IA,
      date_analyse: analyse.DATE_ANALYSE ? new Date(analyse.DATE_ANALYSE).toISOString().split('T')[0] : null
    }))
    
    res.json({
      success: true,
      data: transformedAnalyses
    })
    
  } catch (error) {
    console.error('Erreur lors de la récupération des analyses:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des analyses',
      error: error.message
    })
  }
})

module.exports = router