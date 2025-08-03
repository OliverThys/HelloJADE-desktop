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

    // Nombre d'alertes actives
    const alertesQuery = `
      SELECT COUNT(*) as alertes_actives
      FROM patient_alerts 
      WHERE statut = 'ACTIVE'
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
        c.score_calcule,
        c.resume_appel,
        COALESCE(c.service_hospitalisation, 'Service inconnu') as service_hospitalisation,
        COALESCE(c.medecin_referent, 'Médecin non assigné') as medecin_nom,
        NULL as medecin_prenom,
        0 as jours_post_sortie,
        (ps.score_global * 10) as satisfaction_score,
        wm.niveau_douleur,
        wm.etat_fatigue,
        wm.niveau_anxiete,
        wm.presence_infection,
        wm.type_infection,
        pa.id as alerte_id,
        pa.type_alerte,
        pa.niveau_urgence,
        pa.description as alerte_description,
        pa.action_requise
      FROM calls c
      LEFT JOIN patient_satisfaction ps ON c.patient_id = ps.patient_id
      LEFT JOIN patient_wellness_metrics wm ON c.patient_id = wm.patient_id
      LEFT JOIN patient_alerts pa ON c.patient_id = pa.patient_id AND pa.statut = 'ACTIVE'
      WHERE c.statut_appel = 'APPELE'
      ORDER BY c.date_heure_reelle DESC NULLS LAST, c.date_sortie_hospitalisation DESC
      LIMIT $1
    `
    
    console.log('🔍 Exécution de la requête SQL...')
    const patientsResult = await client.query(patientsQuery, [parseInt(limit)])
    console.log('✅ Requête SQL exécutée avec succès, nombre de résultats:', patientsResult.rows.length)
    
    console.log('🔍 Traitement des résultats...')
    const patients = patientsResult.rows.map(patient => {
      // Calcul du statut du patient
      let statut = 'STABLE'
      let statutColor = 'green'
      
      // Statut basé sur le statut d'appel et les alertes
      if (patient.alerte_id && patient.niveau_urgence === 'ELEVE') {
        statut = 'URGENCE'
        statutColor = 'red'
      } else if (patient.statut_appel === 'ECHEC') {
        statut = 'ATTENTION'
        statutColor = 'orange'
      } else if (patient.statut_appel === 'A_APPELER' || patient.statut_appel === null) {
        statut = 'EN_ATTENTE'
        statutColor = 'blue'
      } else if (patient.alerte_id) {
        statut = 'SURVEILLANCE'
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
        
        // Métriques de bien-être
        niveau_douleur: patient.niveau_douleur || 0,
        etat_fatigue: patient.etat_fatigue || 'NON_EVALUE',
        niveau_anxiete: patient.niveau_anxiete || 'NON_EVALUE',
        presence_infection: patient.presence_infection || false,
        type_infection: patient.type_infection,
        
        // Alertes
        alerte_id: patient.alerte_id,
        type_alerte: patient.type_alerte,
        niveau_urgence: patient.niveau_urgence,
        alerte_description: patient.alerte_description,
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
        COUNT(pa.id) as alertes_actives
      FROM calls c
      LEFT JOIN patient_satisfaction ps ON c.patient_id = ps.patient_id
      LEFT JOIN patient_alerts pa ON c.patient_id = pa.patient_id AND pa.statut = 'ACTIVE'
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

    // Statistiques des alertes par type
    const alertesStatsQuery = `
      SELECT 
        type_alerte,
        niveau_urgence,
        COUNT(*) as nombre_alertes
      FROM patient_alerts 
      WHERE statut = 'ACTIVE'
      GROUP BY type_alerte, niveau_urgence
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
        a.type_alerte,
        a.niveau_urgence,
        a.description,
        a.action_requise,
        a.date_creation,
        c.nom,
        c.prenom
      FROM patient_alerts a
      LEFT JOIN calls c ON a.patient_id = c.patient_id
      WHERE a.statut = 'ACTIVE'
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
      type_alerte: alert.type_alerte,
      niveau_urgence: alert.niveau_urgence,
      description: alert.description,
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