const express = require('express')
const { executeQuery } = require('../database')

const router = express.Router()

// Récupérer les statistiques générales
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 API /dashboard/stats appelée')
    
    // Statistiques des patients
    const patientsStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_patients,
        COUNT(CASE WHEN STATUT = 'ACTIF' THEN 1 END) as active_patients,
        COUNT(CASE WHEN STATUT = 'INACTIF' THEN 1 END) as inactive_patients
      FROM PATIENTS
    `)
    
    // Statistiques des hospitalisations
    const hospitalisationsStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_hospitalisations,
        COUNT(CASE WHEN STATUT = 'EN_COURS' THEN 1 END) as current_hospitalisations,
        COUNT(CASE WHEN STATUT = 'TERMINE' THEN 1 END) as completed_hospitalisations
      FROM HOSPITALISATIONS
    `)
    
    // Statistiques des consultations
    const consultationsStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_consultations,
        COUNT(CASE WHEN STATUT = 'PLANIFIE' THEN 1 END) as scheduled_consultations,
        COUNT(CASE WHEN STATUT = 'TERMINE' THEN 1 END) as completed_consultations
      FROM CONSULTATIONS
    `)
    
    // Statistiques des transcriptions
    const transcriptionsStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_transcriptions,
        COUNT(CASE WHEN STATUT = 'EN_COURS' THEN 1 END) as pending_transcriptions,
        COUNT(CASE WHEN STATUT = 'TERMINE' THEN 1 END) as completed_transcriptions,
        AVG(SCORE_CONFIANCE) as avg_confidence_score
      FROM TRANSCRIPTIONS
    `)
    
    // Statistiques des analyses IA
    const analysesStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_analyses,
        COUNT(CASE WHEN TYPE_ANALYSE = 'SENTIMENT' THEN 1 END) as sentiment_analyses,
        COUNT(CASE WHEN TYPE_ANALYSE = 'URGENCE' THEN 1 END) as urgency_analyses,
        AVG(SCORE_URGENCE) as avg_urgency_score
      FROM ANALYSES_IA
    `)
    
    const stats = {
      patients: {
        total: patientsStats[0].TOTAL_PATIENTS || 0,
        active: patientsStats[0].ACTIVE_PATIENTS || 0,
        inactive: patientsStats[0].INACTIVE_PATIENTS || 0
      },
      hospitalisations: {
        total: hospitalisationsStats[0].TOTAL_HOSPITALISATIONS || 0,
        current: hospitalisationsStats[0].CURRENT_HOSPITALISATIONS || 0,
        completed: hospitalisationsStats[0].COMPLETED_HOSPITALISATIONS || 0
      },
      consultations: {
        total: consultationsStats[0].TOTAL_CONSULTATIONS || 0,
        scheduled: consultationsStats[0].SCHEDULED_CONSULTATIONS || 0,
        completed: consultationsStats[0].COMPLETED_CONSULTATIONS || 0
      },
      transcriptions: {
        total: transcriptionsStats[0].TOTAL_TRANSCRIPTIONS || 0,
        pending: transcriptionsStats[0].PENDING_TRANSCRIPTIONS || 0,
        completed: transcriptionsStats[0].COMPLETED_TRANSCRIPTIONS || 0,
        avgConfidence: transcriptionsStats[0].AVG_CONFIDENCE_SCORE || 0
      },
      analyses: {
        total: analysesStats[0].TOTAL_ANALYSES || 0,
        sentiment: analysesStats[0].SENTIMENT_ANALYSES || 0,
        urgency: analysesStats[0].URGENCY_ANALYSES || 0,
        avgUrgency: analysesStats[0].AVG_URGENCY_SCORE || 0
      }
    }
    
    console.log('✅ Statistiques récupérées avec succès')
    
    res.json({
      success: true,
      data: stats
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    })
  }
})

// Récupérer l'activité récente
router.get('/recent-activity', async (req, res) => {
  try {
    console.log('📈 API /dashboard/recent-activity appelée')
    console.log('🔍 Paramètres de requête:', req.query)
    
    // Activité récente des hospitalisations
    console.log('🏥 Exécution de la requête des hospitalisations...')
    const recentHospitalisations = await executeQuery(`
      SELECT 
        'hospitalisation' as type,
        h.HOSP_ID as id,
        p.NOM || ' ' || p.PRENOM as patient_name,
        h.SERVICE as service,
        h.MEDECIN as doctor,
        h.DATE_ENTREE as date,
        h.STATUT as status,
        'Nouvelle hospitalisation' as description
      FROM HOSPITALISATIONS h
      JOIN PATIENTS p ON h.PATIENT_ID = p.PATIENT_ID
      WHERE h.DATE_ENTREE >= TRUNC(SYSDATE) - 7
      ORDER BY h.DATE_ENTREE DESC
    `)
    console.log(`✅ ${recentHospitalisations.length} hospitalisations récupérées`)
    
    // Activité récente des consultations
    console.log('👨‍⚕️ Exécution de la requête des consultations...')
    const recentConsultations = await executeQuery(`
      SELECT 
        'consultation' as type,
        c.CONSULTATION_ID as id,
        p.NOM || ' ' || p.PRENOM as patient_name,
        c.TYPE_CONSULTATION as service,
        c.MEDECIN as doctor,
        c.DATE_CONSULTATION as date,
        c.STATUT as status,
        'Nouvelle consultation' as description
      FROM CONSULTATIONS c
      JOIN PATIENTS p ON c.PATIENT_ID = p.PATIENT_ID
      WHERE c.DATE_CONSULTATION >= TRUNC(SYSDATE) - 7
      ORDER BY c.DATE_CONSULTATION DESC
    `)
    console.log(`✅ ${recentConsultations.length} consultations récupérées`)
    
    // Activité récente des transcriptions
    console.log('🎤 Exécution de la requête des transcriptions...')
    const recentTranscriptions = await executeQuery(`
      SELECT 
        'transcription' as type,
        t.TRANSCRIPTION_ID as id,
        p.NOM || ' ' || p.PRENOM as patient_name,
        'Transcription' as service,
        'IA' as doctor,
        t.DATE_TRANSCRIPTION as date,
        t.STATUT as status,
        'Nouvelle transcription' as description
      FROM TRANSCRIPTIONS t
      JOIN PATIENTS p ON t.PATIENT_ID = p.PATIENT_ID
      WHERE t.DATE_TRANSCRIPTION >= TRUNC(SYSDATE) - 7
      ORDER BY t.DATE_TRANSCRIPTION DESC
    `)
    console.log(`✅ ${recentTranscriptions.length} transcriptions récupérées`)
    
    // Activité récente des analyses IA
    console.log('🤖 Exécution de la requête des analyses IA...')
    const recentAnalyses = await executeQuery(`
      SELECT 
        'analyse' as type,
        a.ANALYSE_ID as id,
        p.NOM || ' ' || p.PRENOM as patient_name,
        a.TYPE_ANALYSE as service,
        a.MODELE_IA as doctor,
        a.DATE_ANALYSE as date,
        'TERMINE' as status,
        'Nouvelle analyse IA' as description
      FROM ANALYSES_IA a
      JOIN PATIENTS p ON a.PATIENT_ID = p.PATIENT_ID
      WHERE a.DATE_ANALYSE >= TRUNC(SYSDATE) - 7
      ORDER BY a.DATE_ANALYSE DESC
    `)
    console.log(`✅ ${recentAnalyses.length} analyses IA récupérées`)
    
    // Combiner toutes les activités et trier par date
    console.log('🔄 Combinaison des activités...')
    const allActivities = [
      ...recentHospitalisations,
      ...recentConsultations,
      ...recentTranscriptions,
      ...recentAnalyses
    ]
    
    console.log(`📊 Total des activités combinées: ${allActivities.length}`)
    
    // Trier par date
    const sortedActivities = allActivities.sort((a, b) => {
      const dateA = new Date(a.DATE || a.date)
      const dateB = new Date(b.DATE || b.date)
      return dateB.getTime() - dateA.getTime()
    })
    
    // Limiter à 20 activités
    const recentActivity = sortedActivities.slice(0, 20)
    
    console.log(`✅ ${recentActivity.length} activités récentes récupérées`)
    console.log('📊 Première activité:', recentActivity[0])
    console.log('📊 Dernière activité:', recentActivity[recentActivity.length - 1])
    
    const response = {
      success: true,
      data: recentActivity
    }
    
    console.log('📤 Réponse JSON dashboard:', JSON.stringify(response, null, 2))
    
    res.json(response)
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'activité récente:', error)
    console.error('🔍 Stack trace:', error.stack)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'activité récente',
      error: error.message,
      stack: error.stack
    })
  }
})

module.exports = router