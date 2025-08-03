const express = require('express')
const { Pool } = require('pg')
require('dotenv').config({ path: '../config.env' })

const router = express.Router()

// Configuration de la base de données
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

// GET /api/calls - Récupérer tous les patients avec leurs appels
router.get('/', async (req, res) => {
  const client = await pool.connect()
  
  try {
    const {
      search,
      date_debut,
      date_fin,
      statut,
      site,
      service,
      page = 1,
      limit = 50,
      sort_by = 'date_heure_prevue',
      sort_order = 'DESC'
    } = req.query

    let whereConditions = []
    let queryParams = []
    let paramIndex = 1

    // Filtre de recherche globale
    if (search) {
      whereConditions.push(`(
        p.numero_secu ILIKE $${paramIndex} OR 
        p.nom ILIKE $${paramIndex} OR 
        p.prenom ILIKE $${paramIndex} OR 
        p.telephone ILIKE $${paramIndex}
      )`)
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    // Filtre par date - seulement si on a des dates de début et fin
    if (date_debut && date_fin) {
      whereConditions.push(`c.date_heure_prevue >= $${paramIndex} AND c.date_heure_prevue <= $${paramIndex + 1}`)
      queryParams.push(date_debut, date_fin)
      paramIndex += 2
    } else if (date_debut) {
      whereConditions.push(`c.date_heure_prevue >= $${paramIndex}`)
      queryParams.push(date_debut)
      paramIndex++
    } else if (date_fin) {
      whereConditions.push(`c.date_heure_prevue <= $${paramIndex}`)
      queryParams.push(date_fin)
      paramIndex++
    }

    // Filtre par statut
    if (statut) {
      if (statut === 'A_APPELER') {
        whereConditions.push(`(c.statut_appel = 'A_APPELER' OR c.statut_appel IS NULL)`)
      } else {
        whereConditions.push(`c.statut_appel = $${paramIndex}`)
        queryParams.push(statut)
        paramIndex++
      }
    }

    // Filtre par service
    if (service) {
      whereConditions.push(`s.nom_service = $${paramIndex}`)
      queryParams.push(service)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Validation du tri - ajuster les noms de colonnes pour les JOIN
    const allowedSortFields = [
      'numero_patient', 'nom', 'prenom', 'date_naissance', 'telephone',
      'site_hospitalisation', 'date_sortie_hospitalisation', 'date_heure_prevue',
      'statut_appel', 'medecin_referent', 'service_hospitalisation',
      'date_heure_reelle', 'duree_appel', 'score_calcule'
    ]
    
    let sortField = allowedSortFields.includes(sort_by) ? sort_by : 'date_heure_prevue'
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    
    // Ajuster les noms de colonnes pour les JOIN
    if (['numero_secu', 'nom', 'prenom', 'date_naissance', 'telephone'].includes(sortField)) {
      sortField = `p.${sortField}`
    } else if (['service_hospitalisation', 'medecin_referent'].includes(sortField)) {
      if (sortField === 'service_hospitalisation') {
        sortField = `s.nom_service`
      } else {
        sortField = `CONCAT(m.prenom, ' ', m.nom)`
      }
    } else {
      sortField = `c.${sortField}`
    }

    // Requête pour le total - compter tous les patients
    const countQuery = `
      SELECT COUNT(*) as total
      FROM patients_sync p
      LEFT JOIN hospitalisations_sync h ON p.patient_id = h.patient_id
      LEFT JOIN medecins_sync m ON h.medecin_id = m.medecin_id
      LEFT JOIN services_sync s ON m.service_id = s.service_id
      LEFT JOIN calls c ON p.patient_id = c.patient_id
      ${whereClause}
    `
    const countResult = await client.query(countQuery, queryParams)
    const total = parseInt(countResult.rows[0].total)

    // Requête principale avec pagination - récupérer tous les patients avec leurs appels
    const offset = (page - 1) * limit
    const mainQuery = `
      SELECT 
        COALESCE(c.id, 0) as id,
        p.patient_id,
        p.numero_secu as numero_patient,
        p.nom,
        p.prenom,
        p.date_naissance,
        p.telephone,
        s.nom_service as site_hospitalisation,
        h.date_sortie as date_sortie_hospitalisation,
        c.date_heure_prevue,
        COALESCE(c.statut_appel, 'A_APPELER') as statut_appel,
        CONCAT(m.prenom, ' ', m.nom) as medecin_referent,
        s.nom_service as service_hospitalisation,
        c.date_heure_reelle,
        c.duree_appel,
        c.resume_appel,
        c.score_calcule,
        COALESCE(c.nombre_tentatives, 0) as nombre_tentatives,
        COALESCE(c.max_tentatives, 3) as max_tentatives,
        c.dialogue_result,
        c.audio_file_path,
        COALESCE(c.created_at, p.created_date) as created_at,
        COALESCE(c.updated_at, p.sync_timestamp) as updated_at
      FROM patients_sync p
      LEFT JOIN hospitalisations_sync h ON p.patient_id = h.patient_id
      LEFT JOIN medecins_sync m ON h.medecin_id = m.medecin_id
      LEFT JOIN services_sync s ON m.service_id = s.service_id
      LEFT JOIN calls c ON p.patient_id = c.patient_id
      ${whereClause}
      ORDER BY COALESCE(${sortField}, p.created_date) ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    queryParams.push(parseInt(limit), offset)
    const result = await client.query(mainQuery, queryParams)

    // Récupérer les options de filtres depuis les patients ET les appels
    const filtersQuery = `
      SELECT 
        DISTINCT 
        s.nom_service as service,
        c.statut_appel as statut
      FROM patients_sync p
      LEFT JOIN hospitalisations_sync h ON p.patient_id = h.patient_id
      LEFT JOIN medecins_sync m ON h.medecin_id = m.medecin_id
      LEFT JOIN services_sync s ON m.service_id = s.service_id
      LEFT JOIN calls c ON p.patient_id = c.patient_id
      WHERE s.nom_service IS NOT NULL 
         OR c.statut_appel IS NOT NULL
    `
    const filtersResult = await client.query(filtersQuery)

    const services = [...new Set(filtersResult.rows.map(r => r.service).filter(Boolean))]
    const statuts = [...new Set(filtersResult.rows.map(r => r.statut).filter(Boolean))]

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        services,
        statuts
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des appels:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des appels'
    })
  } finally {
    client.release()
  }
})

// GET /api/calls/:id - Récupérer un patient avec son appel
router.get('/:id', async (req, res) => {
  const client = await pool.connect()
  
  try {
    const { id } = req.params
    
    // Si l'ID est 0, c'est un patient sans appel
    if (id === '0') {
      return res.status(404).json({
        success: false,
        error: 'Patient sans appel'
      })
    }
    
                                       const query = `
         SELECT 
           COALESCE(c.id, 0) as id,
           p.patient_id,
           p.numero_secu as numero_patient,
           p.nom,
           p.prenom,
           p.date_naissance,
           p.telephone,
           s.nom_service as site_hospitalisation,
           h.date_sortie as date_sortie_hospitalisation,
           c.date_heure_prevue,
           COALESCE(c.statut_appel, 'A_APPELER') as statut_appel,
           CONCAT(m.prenom, ' ', m.nom) as medecin_referent,
           s.nom_service as service_hospitalisation,
           c.date_heure_reelle,
           c.duree_appel,
           c.resume_appel,
           c.score_calcule,
           COALESCE(c.nombre_tentatives, 0) as nombre_tentatives,
           COALESCE(c.max_tentatives, 3) as max_tentatives,
           c.dialogue_result,
           c.audio_file_path,
           COALESCE(c.created_at, p.created_date) as created_at,
           COALESCE(c.updated_at, p.sync_timestamp) as updated_at,
           ci.id as issue_id,
           ci.type_probleme,
           ci.description as issue_description,
           ci.priorite,
           ci.statut as issue_statut
         FROM patients_sync p
         LEFT JOIN hospitalisations_sync h ON p.patient_id = h.patient_id
         LEFT JOIN medecins_sync m ON h.medecin_id = m.medecin_id
         LEFT JOIN services_sync s ON m.service_id = s.service_id
         LEFT JOIN calls c ON p.patient_id = c.patient_id
         LEFT JOIN call_issues ci ON c.id = ci.call_id
         WHERE p.patient_id = $1 OR c.id = $1
       `
    
    const result = await client.query(query, [id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Patient ou appel non trouvé'
      })
    }

    // Organiser les données
    const call = result.rows[0]
    const issues = result.rows
      .filter(row => row.issue_id)
      .map(row => ({
        id: row.issue_id,
        type_probleme: row.type_probleme,
        description: row.issue_description,
        priorite: row.priorite,
        statut: row.issue_statut
      }))

    call.issues = issues

    res.json({
      success: true,
      data: call
    })

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'appel:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'appel'
    })
  } finally {
    client.release()
  }
})

// POST /api/calls/:id/start - Démarrer un appel manuel
router.post('/:id/start', async (req, res) => {
  const client = await pool.connect()
  
  try {
    const { id } = req.params
    
    // Vérifier si c'est un patient sans appel (id = 0) ou un appel existant
    let call, patientId
    
    if (id === '0') {
      return res.status(400).json({
        success: false,
        error: 'Impossible de démarrer un appel pour un patient sans appel'
      })
    }
    
    // Vérifier que l'appel existe et peut être démarré
    const checkQuery = `
      SELECT c.*, p.id as patient_id 
      FROM calls c 
      JOIN patients p ON c.patient_id = p.id 
      WHERE c.id = $1 AND c.statut_appel = 'A_APPELER'
    `
    const checkResult = await client.query(checkQuery, [id])
    
    if (checkResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Appel non trouvé ou déjà traité'
      })
    }

    call = checkResult.rows[0]
    patientId = call.patient_id

    // Simuler le démarrage d'un appel
    // En production, cela déclencherait Asterisk
    const updateQuery = `
      UPDATE calls 
      SET 
        statut_appel = 'EN_COURS',
        nombre_tentatives = nombre_tentatives + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `
    
    const updateResult = await client.query(updateQuery, [id])
    
    // Simuler les données d'appel après quelques secondes
    setTimeout(async () => {
      try {
        const simulatedData = {
          date_heure_reelle: new Date().toISOString(),
          duree_appel: 180 + Math.floor(Math.random() * 420), // 3-10 minutes
          statut_appel: Math.random() > 0.2 ? 'APPELE' : 'ECHEC',
          score_calcule: Math.random() > 0.2 ? 60 + Math.floor(Math.random() * 40) : 0,
          resume_appel: Math.random() > 0.2 ? 
            'Appel réussi, patient satisfait, douleur contrôlée.' : 
            'Échec de l\'appel, patient injoignable.',
          dialogue_result: Math.random() > 0.2 ? {
            patient_confirme: true,
            identite_verifiee: true,
            douleur_niveau: Math.floor(Math.random() * 6),
            douleur_localisation: ['Aucune', 'Épaule', 'Dos', 'Jambe'][Math.floor(Math.random() * 4)],
            traitement_suivi: Math.random() > 0.2,
            transit_normal: Math.random() > 0.15,
            probleme_transit: '',
            moral_niveau: 6 + Math.floor(Math.random() * 4),
            moral_details: '',
            fievre: Math.random() > 0.8,
            temperature: 36.5 + Math.random() * 2,
            autres_plaintes: ''
          } : null
        }

        const finalUpdateQuery = `
          UPDATE calls 
          SET 
            date_heure_reelle = $1,
            duree_appel = $2,
            statut_appel = $3,
            score_calcule = $4,
            resume_appel = $5,
            dialogue_result = $6,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $7
        `
        
        await client.query(finalUpdateQuery, [
          simulatedData.date_heure_reelle,
          simulatedData.duree_appel,
          simulatedData.statut_appel,
          simulatedData.score_calcule,
          simulatedData.resume_appel,
          simulatedData.dialogue_result,
          id
        ])
        
        console.log(`✅ Appel ${id} simulé terminé`)
      } catch (error) {
        console.error(`❌ Erreur lors de la simulation de l'appel ${id}:`, error)
      }
    }, 2000) // Simuler un appel de 2 secondes

    res.json({
      success: true,
      message: 'Appel démarré avec succès',
      data: updateResult.rows[0]
    })

  } catch (error) {
    console.error('Erreur lors du démarrage de l\'appel:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors du démarrage de l\'appel'
    })
  } finally {
    client.release()
  }
})

// POST /api/calls/:id/issues - Signaler un problème
router.post('/:id/issues', async (req, res) => {
  const client = await pool.connect()
  
  try {
    const { id } = req.params
    const { type_probleme, description, priorite = 'MEDIUM' } = req.body
    
    if (!type_probleme || !description) {
      return res.status(400).json({
        success: false,
        error: 'Type de problème et description requis'
      })
    }

    // Vérifier si l'appel existe
    if (id === '0') {
      return res.status(400).json({
        success: false,
        error: 'Impossible de signaler un problème pour un patient sans appel'
      })
    }

    // Vérifier que l'appel existe
    const checkQuery = `SELECT id FROM calls WHERE id = $1`
    const checkResult = await client.query(checkQuery, [id])
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Appel non trouvé'
      })
    }

    const query = `
      INSERT INTO call_issues (call_id, type_probleme, description, priorite)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `
    
    const result = await client.query(query, [
      id,
      type_probleme,
      description,
      priorite
    ])

    res.json({
      success: true,
      message: 'Problème signalé avec succès',
      data: result.rows[0]
    })

  } catch (error) {
    console.error('Erreur lors du signalement du problème:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors du signalement du problème'
    })
  } finally {
    client.release()
  }
})

// GET /api/calls/stats - Statistiques des appels
router.get('/stats/overview', async (req, res) => {
  const client = await pool.connect()
  
  try {
         const statsQuery = `
       SELECT 
         COUNT(p.patient_id) as total_patients,
         COUNT(c.id) as total_calls,
         COUNT(CASE WHEN c.statut_appel = 'APPELE' THEN 1 END) as successful_calls,
         COUNT(CASE WHEN c.statut_appel = 'ECHEC' THEN 1 END) as failed_calls,
         COUNT(CASE WHEN c.statut_appel = 'A_APPELER' THEN 1 END) as pending_calls,
         COUNT(CASE WHEN c.id IS NULL THEN 1 END) as patients_sans_appel,
         AVG(CASE WHEN c.duree_appel IS NOT NULL THEN c.duree_appel END) as avg_duration,
         AVG(CASE WHEN c.score_calcule IS NOT NULL THEN c.score_calcule END) as avg_score
       FROM patients_sync p
       LEFT JOIN calls c ON p.patient_id = c.patient_id
     `
    
    const statsResult = await client.query(statsQuery)
    const stats = statsResult.rows[0]

    // Statistiques par jour (7 derniers jours)
    const dailyStatsQuery = `
      SELECT 
        DATE(date_heure_prevue) as date,
        COUNT(*) as total,
        COUNT(CASE WHEN statut_appel = 'APPELE' THEN 1 END) as successful,
        COUNT(CASE WHEN statut_appel = 'ECHEC' THEN 1 END) as failed
      FROM calls
      WHERE date_heure_prevue >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(date_heure_prevue)
      ORDER BY date DESC
    `
    
    const dailyStatsResult = await client.query(dailyStatsQuery)

    res.json({
      success: true,
      data: {
        overview: {
          total_patients: parseInt(stats.total_patients),
          total_calls: parseInt(stats.total_calls),
          successful_calls: parseInt(stats.successful_calls),
          failed_calls: parseInt(stats.failed_calls),
          pending_calls: parseInt(stats.pending_calls),
          patients_sans_appel: parseInt(stats.patients_sans_appel),
          success_rate: stats.total_calls > 0 ? 
            Math.round((stats.successful_calls / stats.total_calls) * 100) : 0,
          avg_duration: Math.round(stats.avg_duration || 0),
          avg_score: Math.round(stats.avg_score || 0)
        },
        daily_stats: dailyStatsResult.rows
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    })
  } finally {
    client.release()
  }
})

// GET /api/calls/export - Exporter les appels
router.get('/export/csv', async (req, res) => {
  const client = await pool.connect()
  
  try {
    const { search, date_debut, date_fin, statut, site, service } = req.query

    let whereConditions = []
    let queryParams = []
    let paramIndex = 1

    // Appliquer les mêmes filtres que pour la liste
    if (search) {
      whereConditions.push(`(
        p.numero_secu ILIKE $${paramIndex} OR 
        p.nom ILIKE $${paramIndex} OR 
        p.prenom ILIKE $${paramIndex} OR 
        p.telephone ILIKE $${paramIndex}
      )`)
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (date_debut) {
      whereConditions.push(`c.date_heure_prevue >= $${paramIndex}`)
      queryParams.push(date_debut)
      paramIndex++
    }

    if (date_fin) {
      whereConditions.push(`c.date_heure_prevue <= $${paramIndex}`)
      queryParams.push(date_fin)
      paramIndex++
    }

    if (statut) {
      whereConditions.push(`c.statut_appel = $${paramIndex}`)
      queryParams.push(statut)
      paramIndex++
    }

    if (service) {
      whereConditions.push(`s.nom_service = $${paramIndex}`)
      queryParams.push(service)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

                                       const query = `
         SELECT 
           p.numero_secu as numero_patient,
           p.nom,
           p.prenom,
           p.date_naissance,
           p.telephone,
           s.nom_service as site_hospitalisation,
           h.date_sortie as date_sortie_hospitalisation,
           c.date_heure_prevue,
           COALESCE(c.statut_appel, 'A_APPELER') as statut_appel,
           CONCAT(m.prenom, ' ', m.nom) as medecin_referent,
           s.nom_service as service_hospitalisation,
           c.date_heure_reelle,
           c.duree_appel,
           c.resume_appel,
           c.score_calcule,
           COALESCE(c.nombre_tentatives, 0) as nombre_tentatives
         FROM patients_sync p
         LEFT JOIN hospitalisations_sync h ON p.patient_id = h.patient_id
         LEFT JOIN medecins_sync m ON h.medecin_id = m.medecin_id
         LEFT JOIN services_sync s ON m.service_id = s.service_id
         LEFT JOIN calls c ON p.patient_id = c.patient_id
         ${whereClause}
         ORDER BY COALESCE(c.date_heure_prevue, p.created_date) DESC
       `
    
    const result = await client.query(query, queryParams)

    // Générer le CSV
    const headers = [
      'Numéro Patient', 'Nom', 'Prénom', 'Date de naissance', 'Téléphone',
      'Site', 'Date de sortie', 'Appel prévu', 'Statut', 'Médecin',
      'Service', 'Appel réel', 'Durée (sec)', 'Résumé', 'Score', 'Tentatives'
    ]

    let csv = headers.join(',') + '\n'

    result.rows.forEach(row => {
             const values = [
         `"${row.numero_patient}"`,
         `"${row.nom}"`,
         `"${row.prenom}"`,
         `"${row.date_naissance}"`,
         `"${row.telephone}"`,
         `"${row.site_hospitalisation || ''}"`,
         `"${row.date_sortie_hospitalisation || ''}"`,
         `"${row.date_heure_prevue || ''}"`,
         `"${row.statut_appel}"`,
         `"${row.medecin_referent || ''}"`,
         `"${row.service_hospitalisation || ''}"`,
         `"${row.date_heure_reelle || ''}"`,
         `"${row.duree_appel || ''}"`,
         `"${row.resume_appel || ''}"`,
         `"${row.score_calcule || ''}"`,
         `"${row.nombre_tentatives}"`
       ]
      csv += values.join(',') + '\n'
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="appels_export.csv"')
    res.send(csv)

  } catch (error) {
    console.error('Erreur lors de l\'export:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'export'
    })
  } finally {
    client.release()
  }
})

module.exports = router 