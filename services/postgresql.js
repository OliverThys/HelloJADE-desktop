const { Pool } = require('pg')

class PostgreSQLService {
  constructor() {
    this.pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'hellojade',
      user: 'hellojade_user',
      password: 'hellojade_password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

    // Gestion des erreurs de connexion
    this.pool.on('error', (err) => {
      console.error('❌ Erreur de connexion PostgreSQL:', err)
    })
  }

  async query(text, params) {
    const start = Date.now()
    try {
      const res = await this.pool.query(text, params)
      const duration = Date.now() - start
      console.log(`📊 Requête exécutée en ${duration}ms:`, text.substring(0, 100) + '...')
      return res
    } catch (error) {
      console.error('❌ Erreur requête PostgreSQL:', error)
      throw error
    }
  }

  async getCalls(filters = {}) {
    let query = `
      SELECT 
        c.project_call_id,
        p.numero_patient,
        p.nom,
        p.prenom,
        p.date_naissance,
        p.telephone,
        h.site,
        h.date_sortie,
        c.date_appel_prevue,
        c.statut,
        h.medecin,
        h.service,
        c.date_appel_reelle,
        c.duree_secondes,
        c.resume_appel,
        c.score,
        c.dialogue_result,
        c.recording_path
      FROM calls c
      JOIN patients_sync p ON c.project_patient_id = p.project_patient_id
      LEFT JOIN hospitalisations_sync h ON c.project_hospitalisation_id = h.project_hospitalisation_id
      WHERE 1=1
    `

    const params = []
    let paramIndex = 1

    if (filters.dateDebut) {
      query += ` AND c.date_appel_prevue >= $${paramIndex}`
      params.push(filters.dateDebut)
      paramIndex++
    }

    if (filters.dateFin) {
      query += ` AND c.date_appel_prevue <= $${paramIndex}`
      params.push(filters.dateFin)
      paramIndex++
    }

    if (filters.statut) {
      query += ` AND c.statut = $${paramIndex}`
      params.push(filters.statut)
      paramIndex++
    }

    if (filters.recherche) {
      query += ` AND (p.nom ILIKE $${paramIndex} OR p.prenom ILIKE $${paramIndex} OR p.numero_patient ILIKE $${paramIndex})`
      params.push(`%${filters.recherche}%`)
      paramIndex++
    }

    query += ` ORDER BY c.date_appel_prevue DESC`

    const result = await this.query(query, params)
    return result.rows
  }

  async getCallById(callId) {
    const query = `
      SELECT 
        c.*,
        p.numero_patient,
        p.nom,
        p.prenom,
        p.date_naissance,
        p.telephone,
        h.site,
        h.service,
        h.medecin,
        h.date_sortie
      FROM calls c
      JOIN patients_sync p ON c.project_patient_id = p.project_patient_id
      LEFT JOIN hospitalisations_sync h ON c.project_hospitalisation_id = h.project_hospitalisation_id
      WHERE c.project_call_id = $1
    `
    const result = await this.query(query, [callId])
    return result.rows[0]
  }

  async saveCall(callData) {
    const query = `
      INSERT INTO calls (
        project_patient_id, project_hospitalisation_id, statut,
        date_appel_prevue, date_appel_reelle, duree_secondes,
        score, resume_appel, dialogue_result, recording_path
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING project_call_id
    `

    const values = [
      callData.project_patient_id,
      callData.project_hospitalisation_id,
      callData.statut,
      callData.date_appel_prevue,
      callData.date_appel_reelle,
      callData.duree_secondes,
      callData.score,
      callData.resume_appel,
      callData.dialogue_result ? JSON.stringify(callData.dialogue_result) : null,
      callData.recording_path
    ]

    const result = await this.query(query, values)
    return result.rows[0]
  }

  async updateCall(callId, updateData) {
    const fields = []
    const values = []
    let paramIndex = 1

    for (const [key, value] of Object.entries(updateData)) {
      if (key === 'dialogue_result' && value) {
        fields.push(`${key} = $${paramIndex}`)
        values.push(JSON.stringify(value))
      } else {
        fields.push(`${key} = $${paramIndex}`)
        values.push(value)
      }
      paramIndex++
    }

    fields.push(`date_modification = $${paramIndex}`)
    values.push(new Date())
    paramIndex++

    values.push(callId)

    const query = `
      UPDATE calls 
      SET ${fields.join(', ')}
      WHERE project_call_id = $${paramIndex}
      RETURNING project_call_id
    `

    const result = await this.query(query, values)
    return result.rows[0]
  }

  async getPatients(filters = {}) {
    let query = `
      SELECT 
        p.*,
        h.site,
        h.service,
        h.medecin,
        h.date_sortie,
        h.statut as statut_hospitalisation
      FROM patients_sync p
      LEFT JOIN hospitalisations_sync h ON p.project_patient_id = h.project_patient_id
      WHERE 1=1
    `

    const params = []
    let paramIndex = 1

    if (filters.recherche) {
      query += ` AND (p.nom ILIKE $${paramIndex} OR p.prenom ILIKE $${paramIndex} OR p.numero_patient ILIKE $${paramIndex})`
      params.push(`%${filters.recherche}%`)
      paramIndex++
    }

    query += ` ORDER BY p.nom, p.prenom`

    const result = await this.query(query, params)
    return result.rows
  }

  async syncFromOracle(oracleData) {
    // Simulation de synchronisation depuis Oracle
    console.log('🔄 Synchronisation depuis Oracle...')
    
    // Ici vous intégreriez votre logique de connexion Oracle
    // Pour l'instant, on simule avec des données de test
    
    return {
      patients_sync: 5,
      hospitalisations_sync: 5,
      calls_created: 3
    }
  }

  async getStatistics() {
    const query = `
      SELECT 
        statut,
        COUNT(*) as nombre_appels,
        AVG(duree_secondes) as duree_moyenne,
        AVG(score) as score_moyen
      FROM calls 
      GROUP BY statut
    `
    const result = await this.query(query)
    return result.rows
  }

  async close() {
    await this.pool.end()
  }
}

module.exports = new PostgreSQLService() 