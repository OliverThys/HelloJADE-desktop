const express = require('express')
const { Pool } = require('pg')
require('dotenv').config({ path: '../config.env' })

const router = express.Router()

// Route de test simple
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Route dashboard accessible' })
})

// Configuration de la base de données
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

// GET /api/dashboard/overview - Vue d'ensemble du dashboard
router.get('/overview', async (req, res) => {
  const client = await pool.connect()
  
  try {
    // Statistiques générales
    const statsQuery = `
      SELECT 
        COUNT(*) as total_patients,
        COUNT(CASE WHEN c.statut_appel = 'APPELE' THEN 1 END) as patients_appeles,
        COUNT(CASE WHEN c.statut_appel = 'A_APPELER' OR c.statut_appel IS NULL THEN 1 END) as patients_a_appeler,
        COUNT(CASE WHEN c.statut_appel = 'ECHEC' THEN 1 END) as patients_echec,
        COUNT(CASE WHEN c.date_heure_reelle >= CURRENT_DATE THEN 1 END) as appels_aujourd_hui
      FROM calls c
    `
    const statsResult = await client.query(statsQuery)
    const stats = statsResult.rows[0]

    // Score de satisfaction moyen (multiplié par 10 pour affichage en pourcentage)
    const satisfactionQuery = `
      SELECT 
        ROUND(AVG(score_global * 10), 1) as satisfaction_moyenne,
        COUNT(*) as total_evaluations
      FROM patient_satisfaction 
      WHERE date_evaluation >= CURRENT_DATE - INTERVAL '30 days'
    `
    const satisfactionResult = await client.query(satisfactionQuery)
    const satisfaction = satisfactionResult.rows[0]

    // Nombre d'alertes actives basées sur le score
    const alertesQuery = `
      SELECT COUNT(*) as alertes_actives
      FROM patient_score_alerts 
      WHERE statut = 'ACTIVE' AND score_calcule <= 60
    `
    const alertesResult = await client.query(alertesQuery)
    const alertes = alertesResult.rows[0]

    res.json({
      success: true,
      data: {
        patients_suivis: parseInt(stats.total_patients),
        patients_appeles: parseInt(stats.patients_appeles),
        patients_a_appeler: parseInt(stats.patients_a_appeler),
        patients_echec: parseInt(stats.patients_echec),
        appels_aujourd_hui: parseInt(stats.appels_aujourd_hui),
        satisfaction_moyenne: parseFloat(satisfaction.satisfaction_moyenne) || 0,
        total_evaluations: parseInt(satisfaction.total_evaluations),
        alertes_actives: parseInt(alertes.alertes_actives)
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  } finally {
    client.release()
  }
})

// GET /api/dashboard/recent-patients - Patients appelés avec détails
router.get('/recent-patients', async (req, res) => {
  const client = await pool.connect()
  
  try {
    const { limit = 10 } = req.query

    console.log('🔍 Début de la requête patients-appeles avec limit:', limit)

    const patientsQuery = `
      SELECT 
        c.id as call_id,
        c.patient_id,
        c.nom,
        c.prenom,
        c.date_sortie_hospitalisation,
        c.statut_appel,
        c.date_heure_reelle,
        c.resume_appel,
        COALESCE(c.service_hospitalisation, 'Service inconnu') as service_hospitalisation,
        COALESCE(c.medecin_referent, 'Médecin non assigné') as medecin_nom,
        NULL as medecin_prenom,
        0 as jours_post_sortie,
        (ps.score_global * 10) as satisfaction_score,
        -- Nouvelles métriques de score
        psm.douleur,
        psm.traitement_suivi,
        psm.transit_normal,
        psm.moral,
        psm.fievre,
        psm.mots_cles_urgents,
        psm.score_calcule,
        psm.date_evaluation,
        -- Alertes basées sur le score
        psa.id as alerte_id,
        psa.niveau_urgence,
        psa.raison_alerte,
        psa.action_requise
      FROM calls c
      LEFT JOIN patient_satisfaction ps ON c.patient_id = ps.patient_id
      LEFT JOIN patient_score_metrics psm ON c.patient_id = psm.patient_id
      LEFT JOIN patient_score_alerts psa ON c.patient_id = psa.patient_id AND psa.statut = 'ACTIVE'
      ORDER BY 
        CASE 
          WHEN c.statut_appel = 'APPELE' THEN 1
          WHEN c.statut_appel = 'SUCCES' THEN 2
          WHEN c.statut_appel = 'ECHEC' THEN 3
          ELSE 4
        END,
        c.date_heure_reelle DESC NULLS LAST, 
        c.date_sortie_hospitalisation DESC
      LIMIT $1
    `
    
    console.log('🔍 Exécution de la requête SQL...')
    const patientsResult = await client.query(patientsQuery, [parseInt(limit)])
    console.log('✅ Requête SQL exécutée avec succès, nombre de résultats:', patientsResult.rows.length)
    
    console.log('🔍 Traitement des résultats...')
    const patients = patientsResult.rows.map(patient => {
      // Calcul du statut du patient basé sur le nouveau score
      let statut = 'STABLE'
      let statutColor = 'green'
      
      // Statut basé sur le statut d'appel d'abord
      if (patient.statut_appel === 'ECHEC') {
        statut = 'ECHEC'
        statutColor = 'red'
      } else if (patient.statut_appel === 'A_APPELER' || patient.statut_appel === null) {
        statut = 'EN_ATTENTE'
        statutColor = 'blue'
      } else if (patient.statut_appel === 'SUCCES') {
        // Pour les patients appelés avec succès, utiliser le score calculé
        if (patient.score_calcule !== null && patient.score_calcule <= 30) {
          statut = 'URGENCE'
          statutColor = 'red'
        } else if (patient.score_calcule !== null && patient.score_calcule <= 60) {
          statut = 'ATTENTION'
          statutColor = 'orange'
        } else {
          statut = 'STABLE'
          statutColor = 'green'
        }
      } else if (patient.statut_appel === 'APPELE') {
        // Pour les patients en cours d'appel
        statut = 'EN_COURS'
        statutColor = 'yellow'
      }

      // Calcul du temps écoulé depuis l'appel
      let temps_appel = null
      if (patient.date_heure_reelle) {
        const maintenant = new Date()
        const appel = new Date(patient.date_heure_reelle)
        const diffMs = maintenant - appel
        const diffHeures = Math.floor(diffMs / (1000 * 60 * 60))
        
        if (diffHeures < 1) {
          temps_appel = 'À l\'instant'
        } else if (diffHeures === 1) {
          temps_appel = 'Il y a 1h'
        } else if (diffHeures < 24) {
          temps_appel = `Il y a ${diffHeures}h`
        } else {
          const diffJours = Math.floor(diffHeures / 24)
          temps_appel = `Il y a ${diffJours}j`
        }
      }

      return {
        call_id: patient.call_id,
        patient_id: patient.patient_id,
        nom: patient.nom,
        prenom: patient.prenom,
        service: patient.service_hospitalisation,
        medecin: patient.medecin_nom,
        date_sortie: patient.date_sortie_hospitalisation,
        jours_post_sortie: patient.jours_post_sortie,
        statut_appel: patient.statut_appel,
        date_appel: patient.date_heure_reelle,
        temps_appel: temps_appel,
        score_calcule: patient.score_calcule,
        satisfaction_score: patient.satisfaction_score,
        resume_appel: patient.resume_appel,
        
        // Nouvelles métriques de score (null pour les patients non encore appelés)
        douleur: patient.douleur,
        traitement_suivi: patient.traitement_suivi,
        transit_normal: patient.transit_normal,
        moral: patient.moral,
        fievre: patient.fievre,
        mots_cles_urgents: patient.mots_cles_urgents || [],
        
        // Alertes basées sur le score
        alerte_id: patient.alerte_id,
        niveau_urgence: patient.niveau_urgence,
        raison_alerte: patient.raison_alerte,
        action_requise: patient.action_requise,
        
        // Statut calculé
        statut: statut,
        statut_color: statutColor
      }
    })
    
    console.log('✅ Traitement terminé, nombre de patients:', patients.length)

    res.json({
      success: true,
      data: patients
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des patients récents:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  } finally {
    client.release()
  }
})

// GET /api/dashboard/statistics - Statistiques détaillées
router.get('/statistics', async (req, res) => {
  const client = await pool.connect()
  
  try {
    // Statistiques par service
    const serviceStatsQuery = `
      SELECT 
        COALESCE(c.service_hospitalisation, 'Service inconnu') as nom_service,
        COUNT(c.id) as total_patients,
        COUNT(CASE WHEN c.statut_appel = 'APPELE' THEN 1 END) as patients_appeles,
                 ROUND(AVG(ps.score_global * 10), 1) as satisfaction_moyenne,
        COUNT(psa.id) as alertes_actives
      FROM calls c
      LEFT JOIN patient_satisfaction ps ON c.patient_id = ps.patient_id
      LEFT JOIN patient_score_alerts psa ON c.patient_id = psa.patient_id AND psa.statut = 'ACTIVE'
      GROUP BY c.service_hospitalisation
      ORDER BY total_patients DESC
    `
    const serviceStatsResult = await client.query(serviceStatsQuery)

    // Statistiques de satisfaction par période
    const satisfactionStatsQuery = `
      SELECT 
        DATE_TRUNC('week', date_evaluation) as semaine,
                 ROUND(AVG(score_global * 10), 1) as satisfaction_moyenne,
        COUNT(*) as nombre_evaluations
      FROM patient_satisfaction 
      WHERE date_evaluation >= CURRENT_DATE - INTERVAL '12 weeks'
      GROUP BY DATE_TRUNC('week', date_evaluation)
      ORDER BY semaine DESC
    `
    const satisfactionStatsResult = await client.query(satisfactionStatsQuery)

    // Statistiques des alertes par type (basées sur le score)
    const alertesStatsQuery = `
      SELECT 
        'SCORE_FAIBLE' as type_alerte,
        niveau_urgence,
        COUNT(*) as nombre_alertes
      FROM patient_score_alerts 
      WHERE statut = 'ACTIVE'
      GROUP BY niveau_urgence
      ORDER BY nombre_alertes DESC
    `
    const alertesStatsResult = await client.query(alertesStatsQuery)

    res.json({
      success: true,
      data: {
        par_service: serviceStatsResult.rows,
        satisfaction_evolution: satisfactionStatsResult.rows,
        alertes: alertesStatsResult.rows
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  } finally {
    client.release()
  }
})

// GET /api/dashboard/alerts - Alertes actives
router.get('/alerts', async (req, res) => {
  const client = await pool.connect()
  
  try {
    const { limit = 10 } = req.query
    
    const alertsQuery = `
      SELECT 
        a.id as alerte_id,
        a.patient_id,
        a.score_calcule,
        a.niveau_urgence,
        a.raison_alerte,
        a.action_requise,
        a.date_creation,
        c.nom,
        c.prenom
      FROM patient_score_alerts a
      LEFT JOIN calls c ON a.patient_id = c.patient_id
      WHERE a.statut = 'ACTIVE' AND a.score_calcule <= 60
      ORDER BY 
        CASE a.niveau_urgence 
          WHEN 'ELEVE' THEN 1 
          WHEN 'MOYEN' THEN 2 
          WHEN 'FAIBLE' THEN 3 
        END,
        a.date_creation DESC
      LIMIT $1
    `
    
    const alertsResult = await client.query(alertsQuery, [parseInt(limit)])
    
    const alerts = alertsResult.rows.map(alert => ({
      alerte_id: alert.alerte_id,
      patient_id: alert.patient_id,
      patient_nom: alert.nom || 'Patient inconnu',
      patient_prenom: alert.prenom || '',
      score_calcule: alert.score_calcule,
      niveau_urgence: alert.niveau_urgence,
      raison_alerte: alert.raison_alerte,
      action_requise: alert.action_requise,
      date_creation: alert.date_creation
    }))
    
    res.json({
      success: true,
      data: alerts
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error)
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  } finally {
    client.release()
  }
})

module.exports = router 