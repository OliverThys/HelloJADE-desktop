const express = require('express')
const router = express.Router()
const { Pool } = require('pg')

// Configuration PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hellojade',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
})

// GET /api/patients - Récupérer tous les patients avec pagination et filtres
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'nom',
      sortOrder = 'ASC',
      sexe = '',
      ageMin = '',
      ageMax = ''
    } = req.query

    const offset = (page - 1) * limit
    const searchTerm = `%${search}%`

    // Construction de la requête avec filtres
    let whereConditions = []
    let queryParams = []
    let paramIndex = 1

    if (search) {
      whereConditions.push(`(nom ILIKE $${paramIndex} OR prenom ILIKE $${paramIndex} OR numero_secu ILIKE $${paramIndex} OR telephone ILIKE $${paramIndex})`)
      queryParams.push(searchTerm)
      paramIndex++
    }

    if (sexe) {
      whereConditions.push(`sexe = $${paramIndex}`)
      queryParams.push(sexe)
      paramIndex++
    }

    if (ageMin || ageMax) {
      const currentDate = new Date()
      if (ageMin) {
        const maxBirthDate = new Date(currentDate.getFullYear() - parseInt(ageMin), currentDate.getMonth(), currentDate.getDate())
        whereConditions.push(`date_naissance <= $${paramIndex}`)
        queryParams.push(maxBirthDate)
        paramIndex++
      }
      if (ageMax) {
        const minBirthDate = new Date(currentDate.getFullYear() - parseInt(ageMax) - 1, currentDate.getMonth(), currentDate.getDate())
        whereConditions.push(`date_naissance > $${paramIndex}`)
        queryParams.push(minBirthDate)
        paramIndex++
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Requête pour le total
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM patients_sync 
      ${whereClause}
    `
    const countResult = await pool.query(countQuery, queryParams)
    const total = parseInt(countResult.rows[0].total)

    // Requête principale avec pagination
    const mainQuery = `
      SELECT 
        patient_id,
        nom,
        prenom,
        date_naissance,
        sexe,
        adresse,
        telephone,
        email,
        numero_secu,
        created_date,
        sync_timestamp,
        sync_source,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_naissance)) as age
      FROM patients_sync 
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    queryParams.push(parseInt(limit), offset)

    const result = await pool.query(mainQuery, queryParams)

    // Calcul des statistiques
    const statsQuery = `
      SELECT 
        COUNT(*) as total_patients,
        COUNT(CASE WHEN sexe = 'M' THEN 1 END) as male_count,
        COUNT(CASE WHEN sexe = 'F' THEN 1 END) as female_count,
        AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_naissance))) as avg_age,
        MIN(EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_naissance))) as min_age,
        MAX(EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_naissance))) as max_age
      FROM patients_sync
    `
    const statsResult = await pool.query(statsQuery)

    res.json({
      success: true,
      data: {
        patients: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        },
        statistics: statsResult.rows[0],
        filters: {
          search,
          sexe,
          ageMin,
          ageMax,
          sortBy,
          sortOrder
        }
      }
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des patients:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des patients',
      details: error.message
    })
  }
})

// GET /api/patients/:id - Récupérer un patient spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const query = `
      SELECT 
        patient_id,
        nom,
        prenom,
        date_naissance,
        sexe,
        adresse,
        telephone,
        email,
        numero_secu,
        created_date,
        sync_timestamp,
        sync_source,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_naissance)) as age
      FROM patients_sync 
      WHERE patient_id = $1
    `

    const result = await pool.query(query, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Patient non trouvé'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération du patient:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du patient',
      details: error.message
    })
  }
})

// PUT /api/patients/:id - Mettre à jour un patient
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      nom,
      prenom,
      date_naissance,
      adresse,
      telephone,
      email,
      numero_secu
    } = req.body

    // Vérifier que le patient existe
    const checkQuery = 'SELECT patient_id FROM patients_sync WHERE patient_id = $1'
    const checkResult = await pool.query(checkQuery, [id])

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Patient non trouvé'
      })
    }

    // Mettre à jour le patient
    const updateQuery = `
      UPDATE patients_sync 
      SET 
        nom = $1,
        prenom = $2,
        date_naissance = $3,
        adresse = $4,
        telephone = $5,
        email = $6,
        numero_secu = $7,
        sync_timestamp = CURRENT_TIMESTAMP
      WHERE patient_id = $8
      RETURNING 
        patient_id,
        nom,
        prenom,
        date_naissance,
        sexe,
        adresse,
        telephone,
        email,
        numero_secu,
        created_date,
        sync_timestamp,
        sync_source,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_naissance)) as age
    `

    const result = await pool.query(updateQuery, [
      nom,
      prenom,
      date_naissance,
      adresse || null,
      telephone || null,
      email || null,
      numero_secu || null,
      id
    ])

    console.log('✅ Patient mis à jour avec succès:', id)

    res.json({
      success: true,
      data: result.rows[0]
    })

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du patient:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du patient',
      details: error.message
    })
  }
})

// GET /api/patients/export/csv - Exporter les patients en CSV
router.get('/export/csv', async (req, res) => {
  try {
    const query = `
      SELECT 
        patient_id,
        nom,
        prenom,
        date_naissance,
        sexe,
        adresse,
        telephone,
        email,
        numero_secu,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_naissance)) as age
      FROM patients_sync 
      ORDER BY nom, prenom
    `

    const result = await pool.query(query)

    // Génération du CSV
    const headers = ['ID', 'Nom', 'Prénom', 'Date de naissance', 'Sexe', 'Adresse', 'Téléphone', 'Email', 'Numéro de sécurité sociale', 'Âge']
    const csvContent = [
      headers.join(','),
      ...result.rows.map(row => [
        row.patient_id,
        `"${row.nom}"`,
        `"${row.prenom}"`,
        row.date_naissance,
        row.sexe,
        `"${row.adresse || ''}"`,
        row.telephone || '',
        row.email || '',
        row.numero_secu || '',
        row.age
      ].join(','))
    ].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="patients.csv"')
    res.send(csvContent)

  } catch (error) {
    console.error('❌ Erreur lors de l\'export CSV:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'export CSV',
      details: error.message
    })
  }
})

module.exports = router 