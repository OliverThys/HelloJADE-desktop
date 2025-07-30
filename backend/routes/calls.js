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

// GET /api/calls - Récupérer tous les appels avec filtres et pagination
router.get('/', async (req, res) => {
  const pool = new Pool(postgresConfig)
  
  try {
    const {
      page = 1,
      perPage = 20,
      recherche = '',
      statut = '',
      service = '',
      dateAppelDebut = '',
      dateAppelFin = '',
      dateSortieDebut = '',
      dateSortieFin = '',
      scoreMin = '',
      scoreMax = '',
      orderBy = 'date_appel_prevue',
      orderDirection = 'DESC'
    } = req.query

    let sql = `
      SELECT 
        c.project_call_id as id,
        c.project_patient_id,
        c.project_hospitalisation_id,
        c.statut,
        c.date_appel_prevue,
        c.date_appel_reelle,
        c.duree_secondes,
        c.score,
        c.resume_appel,
        c.dialogue_result,
        c.nombre_tentatives,
        c.date_creation,
        c.date_modification,
        p.numero_patient,
        p.nom,
        p.prenom,
        p.date_naissance,
        p.telephone,
        h.service,
        h.medecin,
        h.site,
        h.date_sortie
      FROM calls c
      LEFT JOIN patients_sync p ON c.project_patient_id = p.project_patient_id
      LEFT JOIN hospitalisations_sync h ON c.project_hospitalisation_id = h.project_hospitalisation_id
      WHERE 1=1
    `
    
    const binds = []
    
    if (recherche) {
      sql += ` AND (p.nom ILIKE $${binds.length + 1} OR p.prenom ILIKE $${binds.length + 1} OR p.numero_patient ILIKE $${binds.length + 1} OR p.telephone ILIKE $${binds.length + 1})`
      binds.push(`%${recherche}%`)
    }
    
    if (statut) {
      sql += ` AND c.statut = $${binds.length + 1}`
      binds.push(statut)
    }
    
    if (service) {
      sql += ` AND h.service ILIKE $${binds.length + 1}`
      binds.push(`%${service}%`)
    }
    
    if (dateAppelDebut) {
      sql += ` AND c.date_appel_prevue >= $${binds.length + 1}`
      binds.push(dateAppelDebut)
    }
    
    if (dateAppelFin) {
      sql += ` AND c.date_appel_prevue <= $${binds.length + 1}`
      binds.push(dateAppelFin)
    }
    
    if (dateSortieDebut) {
      sql += ` AND h.date_sortie >= $${binds.length + 1}`
      binds.push(dateSortieDebut)
    }
    
    if (dateSortieFin) {
      sql += ` AND h.date_sortie <= $${binds.length + 1}`
      binds.push(dateSortieFin)
    }
    
    if (scoreMin) {
      sql += ` AND c.score >= $${binds.length + 1}`
      binds.push(parseInt(scoreMin))
    }
    
    if (scoreMax) {
      sql += ` AND c.score <= $${binds.length + 1}`
      binds.push(parseInt(scoreMax))
    }
    
    // Compter le total
    const countSql = sql.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM')
    const countResult = await pool.query(countSql, binds)
    const total = parseInt(countResult.rows[0].total)
    
    // Ajouter l'ordre et la pagination
    sql += ` ORDER BY c.${orderBy} ${orderDirection}`
    sql += ` LIMIT $${binds.length + 1} OFFSET $${binds.length + 2}`
    binds.push(parseInt(perPage), (parseInt(page) - 1) * parseInt(perPage))
    
    console.log('🔍 Exécution de la requête SQL...')
    console.log('📝 SQL:', sql)
    console.log('🔗 Binds:', binds)
    
    const calls = await pool.query(sql, binds)
    
    console.log(`✅ ${calls.rows.length} appels récupérés de la base de données`)
    
    // Transformer les données pour correspondre au format attendu par le frontend
    const transformedCalls = calls.rows.map(call => ({
      id: call.id,
      project_patient_id: call.project_patient_id,
      project_hospitalisation_id: call.project_hospitalisation_id,
      statut: call.statut,
      date_appel_prevue: call.date_appel_prevue ? new Date(call.date_appel_prevue).toISOString().split('T')[0] : null,
      date_appel_reelle: call.date_appel_reelle ? new Date(call.date_appel_reelle).toISOString().split('T')[0] : null,
      duree_secondes: call.duree_secondes,
      score: call.score,
      resume_appel: call.resume_appel,
      dialogue_result: call.dialogue_result,
      nombre_tentatives: call.nombre_tentatives,
      date_creation: call.date_creation ? new Date(call.date_creation).toISOString().split('T')[0] : null,
      date_modification: call.date_modification ? new Date(call.date_modification).toISOString().split('T')[0] : null,
      numero_patient: call.numero_patient,
      nom: call.nom ? call.nom.toString().trim() : null,
      prenom: call.prenom ? call.prenom.toString().trim() : null,
      date_naissance: call.date_naissance ? new Date(call.date_naissance).toISOString().split('T')[0] : null,
      telephone: call.telephone,
      service: call.service ? call.service.toString().trim() : null,
      medecin: call.medecin ? call.medecin.toString().trim() : null,
      site: call.site ? call.site.toString().trim() : null,
      date_sortie: call.date_sortie ? new Date(call.date_sortie).toISOString().split('T')[0] : null
    }))

    res.json({
      success: true,
      data: {
        items: transformedCalls,
        total: total,
        page: parseInt(page),
        perPage: parseInt(perPage),
        totalPages: Math.ceil(total / parseInt(perPage))
      }
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des appels:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des appels',
      details: error.message
    })
  } finally {
    await pool.end()
  }
})

// GET /api/calls/:id - Récupérer un appel par ID
router.get('/:id', async (req, res) => {
  const pool = new Pool(postgresConfig)
  
  try {
    const callId = parseInt(req.params.id)
    
    const sql = `
      SELECT 
        c.project_call_id as id,
        c.project_patient_id,
        c.project_hospitalisation_id,
        c.statut,
        c.date_appel_prevue,
        c.date_appel_reelle,
        c.duree_secondes,
        c.score,
        c.resume_appel,
        c.dialogue_result,
        c.nombre_tentatives,
        c.date_creation,
        c.date_modification,
        p.numero_patient,
        p.nom,
        p.prenom,
        p.date_naissance,
        p.telephone,
        h.service,
        h.medecin,
        h.site,
        h.date_sortie
      FROM calls c
      LEFT JOIN patients_sync p ON c.project_patient_id = p.project_patient_id
      LEFT JOIN hospitalisations_sync h ON c.project_hospitalisation_id = h.project_hospitalisation_id
      WHERE c.project_call_id = $1
    `
    
    const calls = await pool.query(sql, [callId])
    
    if (calls.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Appel non trouvé'
      })
    }

    const call = calls.rows[0]
    const transformedCall = {
      id: call.id,
      project_patient_id: call.project_patient_id,
      project_hospitalisation_id: call.project_hospitalisation_id,
      statut: call.statut,
      date_appel_prevue: call.date_appel_prevue ? new Date(call.date_appel_prevue).toISOString().split('T')[0] : null,
      date_appel_reelle: call.date_appel_reelle ? new Date(call.date_appel_reelle).toISOString().split('T')[0] : null,
      duree_secondes: call.duree_secondes,
      score: call.score,
      resume_appel: call.resume_appel,
      dialogue_result: call.dialogue_result,
      nombre_tentatives: call.nombre_tentatives,
      date_creation: call.date_creation ? new Date(call.date_creation).toISOString().split('T')[0] : null,
      date_modification: call.date_modification ? new Date(call.date_modification).toISOString().split('T')[0] : null,
      numero_patient: call.numero_patient,
      nom: call.nom ? call.nom.toString().trim() : null,
      prenom: call.prenom ? call.prenom.toString().trim() : null,
      date_naissance: call.date_naissance ? new Date(call.date_naissance).toISOString().split('T')[0] : null,
      telephone: call.telephone,
      service: call.service ? call.service.toString().trim() : null,
      medecin: call.medecin ? call.medecin.toString().trim() : null,
      site: call.site ? call.site.toString().trim() : null,
      date_sortie: call.date_sortie ? new Date(call.date_sortie).toISOString().split('T')[0] : null
    }

    res.json({
      success: true,
      data: transformedCall
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'appel:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'appel',
      details: error.message
    })
  } finally {
    await pool.end()
  }
})

// GET /api/calls/statistics/overview - Récupérer les statistiques
router.get('/statistics/overview', async (req, res) => {
  const pool = new Pool(postgresConfig)
  
  try {
    const sql = `
      SELECT 
        statut,
        COUNT(*) as nombre,
        AVG(score) as score_moyen,
        AVG(duree_secondes) as duree_moyenne
      FROM calls 
      GROUP BY statut
      ORDER BY statut
    `
    
    const stats = await pool.query(sql)
    
    const totalCalls = await pool.query('SELECT COUNT(*) as total FROM calls')
    const totalPatients = await pool.query('SELECT COUNT(*) as total FROM patients_sync')
    const totalHospitalisations = await pool.query('SELECT COUNT(*) as total FROM hospitalisations_sync')
    
    const statistics = {
      total_appels: parseInt(totalCalls.rows[0].total),
      total_patients: parseInt(totalPatients.rows[0].total),
      total_hospitalisations: parseInt(totalHospitalisations.rows[0].total),
      repartition_statuts: stats.rows.map(row => ({
        statut: row.statut,
        nombre: parseInt(row.nombre),
        score_moyen: Math.round(row.score_moyen || 0),
        duree_moyenne: Math.round(row.duree_moyenne || 0)
      }))
    }
    
    res.json({
      success: true,
      data: statistics
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      details: error.message
    })
  } finally {
    await pool.end()
  }
})

// GET /api/calls/services - Récupérer les services disponibles
router.get('/services', async (req, res) => {
  const pool = new Pool(postgresConfig)
  
  try {
    const sql = `
      SELECT DISTINCT service 
      FROM hospitalisations_sync 
      WHERE service IS NOT NULL 
      ORDER BY service
    `
    
    const services = await pool.query(sql)
    
    res.json({
      success: true,
      data: services.rows.map(row => row.service)
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des services:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des services',
      details: error.message
    })
  } finally {
    await pool.end()
  }
})

// GET /api/calls/:id/scores - Récupérer les scores détaillés d'un appel
router.get('/:id/scores', async (req, res) => {
  const pool = new Pool(postgresConfig)
  
  try {
    const callId = parseInt(req.params.id)
    
    const sql = `
      SELECT 
        score_id,
        project_call_id,
        type_score,
        valeur_score,
        poids_score,
        commentaire,
        date_calcul
      FROM scores 
      WHERE project_call_id = $1
      ORDER BY type_score
    `
    
    const scores = await pool.query(sql, [callId])
    
    const transformedScores = scores.rows.map(score => ({
      id: score.score_id,
      project_call_id: score.project_call_id,
      type_score: score.type_score,
      valeur_score: score.valeur_score,
      poids_score: score.poids_score,
      commentaire: score.commentaire,
      date_calcul: score.date_calcul ? new Date(score.date_calcul).toISOString().split('T')[0] : null
    }))
    
    res.json({
      success: true,
      data: transformedScores
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des scores:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des scores',
      details: error.message
    })
  } finally {
    await pool.end()
  }
})

module.exports = router 