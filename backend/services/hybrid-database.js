const { Pool } = require('pg')
const oracledb = require('oracledb')

class HybridDatabaseService {
  constructor() {
    // Configuration Oracle (lecture seule - données hospitalières)
    this.oracleConfig = {
      host: 'localhost',
      port: '1522',
      service: 'XE',
      user: 'C##HELLOJADE',
      password: 'HelloJade123',
      connectString: 'localhost:1522/XE'
    }

    // Configuration PostgreSQL (écriture - données HelloJADE)
    this.postgresConfig = {
      host: 'localhost',
      port: 5432,
      database: 'hellojade',
      user: 'hellojade_user',
      password: 'hellojade_password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }

    // Pool PostgreSQL
    this.postgresPool = new Pool(this.postgresConfig)
    this.postgresPool.on('error', (err) => {
      console.error('❌ Erreur de connexion PostgreSQL:', err)
    })

    // Pool Oracle
    this.oraclePool = null
    this.oracleConnected = false
    
    // Synchronisation automatique
    this.syncInterval = null
  }

  // Vérifier la connexion Oracle
  async checkOracleConnection() {
    try {
      console.log('🔍 Vérification de la connexion Oracle...')
      
      // Test de connexion simple
      const connection = await oracledb.getConnection({
        user: this.oracleConfig.user,
        password: this.oracleConfig.password,
        connectString: this.oracleConfig.connectString
      })
      
      // Test d'une requête simple
      const result = await connection.execute('SELECT 1 FROM DUAL')
      await connection.close()
      
      this.oracleConnected = true
      console.log('✅ Connexion Oracle vérifiée avec succès')
      return true
      
    } catch (error) {
      console.error('❌ Impossible de se connecter à Oracle:', error.message)
      console.log('⚠️ Mode dégradé : utilisation des données PostgreSQL existantes')
      this.oracleConnected = false
      return false
    }
  }

  // Initialiser PostgreSQL et synchroniser
  async initialize() {
    try {
      console.log('🔄 Initialisation du système HelloJADE...')
      
      // 1. Vérifier Oracle
      const oracleOk = await this.checkOracleConnection()
      
      // 2. Vérifier PostgreSQL
      console.log('🔍 Vérification de PostgreSQL...')
      await this.postgresQuery('SELECT 1')
      console.log('✅ PostgreSQL connecté')
      
      // 3. Synchronisation initiale si Oracle est disponible
      if (oracleOk) {
        console.log('🔄 Synchronisation initiale depuis Oracle...')
        await this.syncFromOracle()
        
        // 4. Démarrer la synchronisation automatique
        this.startAutoSync()
      } else {
        console.log('⚠️ Oracle non disponible - utilisation des données PostgreSQL existantes')
      }
      
      console.log('✅ Système HelloJADE initialisé avec succès')
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error)
      throw error
    }
  }

  // Démarrer la synchronisation automatique
  startAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    
    console.log('🔄 Démarrage de la synchronisation automatique (toutes les 5 minutes)')
    
    this.syncInterval = setInterval(async () => {
      try {
        if (this.oracleConnected) {
          console.log('🔄 Synchronisation automatique en cours...')
          await this.syncFromOracle()
          console.log('✅ Synchronisation automatique terminée')
        }
      } catch (error) {
        console.error('❌ Erreur lors de la synchronisation automatique:', error)
      }
    }, 5 * 60 * 1000) // 5 minutes
  }

  // Arrêter la synchronisation automatique
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
      console.log('🛑 Synchronisation automatique arrêtée')
    }
  }

  // Requête PostgreSQL
  async postgresQuery(text, params) {
    const start = Date.now()
    try {
      const res = await this.postgresPool.query(text, params)
      const duration = Date.now() - start
      console.log(`📊 Requête PostgreSQL exécutée en ${duration}ms:`, text.substring(0, 100) + '...')
      return res
    } catch (error) {
      console.error('❌ Erreur requête PostgreSQL:', error)
      throw error
    }
  }

  // Synchroniser depuis Oracle vers PostgreSQL
  async syncFromOracle() {
    try {
      if (!this.oracleConnected) {
        console.log('⚠️ Oracle non connecté - synchronisation ignorée')
        return { patients_sync: 0, hospitalisations_sync: 0, calls_created: 0 }
      }

      console.log('🔄 Synchronisation depuis Oracle...')
      
      // Créer un pool Oracle temporaire pour la synchronisation
      const oraclePool = await oracledb.createPool({
        user: this.oracleConfig.user,
        password: this.oracleConfig.password,
        connectString: this.oracleConfig.connectString,
        poolMin: 1,
        poolMax: 5,
        poolIncrement: 1
      })

      // 1. Récupérer les patients depuis Oracle
      const connection = await oraclePool.getConnection()
      const oraclePatients = await connection.execute(`
        SELECT 
          PATIENT_ID,
          NUMERO_PATIENT,
          NOM,
          PRENOM,
          DATE_NAISSANCE,
          TELEPHONE
        FROM PATIENTS 
        WHERE PATIENT_ID IN (
          SELECT DISTINCT PATIENT_ID 
          FROM HOSPITALISATIONS 
          WHERE DATE_SORTIE >= SYSDATE - 30
        )
      `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT })

      console.log(`📊 ${oraclePatients.rows.length} patients trouvés dans Oracle`)

      // 2. Insérer/mettre à jour dans PostgreSQL
      for (const patient of oraclePatients.rows) {
        await this.postgresQuery(`
          INSERT INTO patients_sync (
            hospital_patient_id, numero_patient, nom, prenom, 
            date_naissance, telephone, date_modification
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          ON CONFLICT (hospital_patient_id) 
          DO UPDATE SET 
            numero_patient = EXCLUDED.numero_patient,
            nom = EXCLUDED.nom,
            prenom = EXCLUDED.prenom,
            date_naissance = EXCLUDED.date_naissance,
            telephone = EXCLUDED.telephone,
            date_modification = CURRENT_TIMESTAMP
        `, [
          patient.PATIENT_ID,
          patient.NUMERO_PATIENT,
          patient.NOM,
          patient.PRENOM,
          patient.DATE_NAISSANCE,
          patient.TELEPHONE
        ])
      }

             // 3. Récupérer les hospitalisations depuis Oracle
       const oracleHospitalisations = await connection.execute(`
         SELECT 
           HOSP_ID as HOSPITALISATION_ID,
           PATIENT_ID,
           SERVICE,
           MEDECIN,
           DATE_SORTIE,
           STATUT,
           DIAGNOSTIC
         FROM HOSPITALISATIONS 
         WHERE DATE_SORTIE >= SYSDATE - 30
       `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT })

      console.log(`📊 ${oracleHospitalisations.rows.length} hospitalisations trouvées dans Oracle`)

             // 4. Insérer/mettre à jour les hospitalisations
       for (const hosp of oracleHospitalisations.rows) {
         await this.postgresQuery(`
           INSERT INTO hospitalisations_sync (
             hospital_hospitalisation_id, project_patient_id, service,
             medecin, date_sortie, statut, diagnostic, date_modification
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
           ON CONFLICT (hospital_hospitalisation_id) 
           DO UPDATE SET 
             service = EXCLUDED.service,
             medecin = EXCLUDED.medecin,
             date_sortie = EXCLUDED.date_sortie,
             statut = EXCLUDED.statut,
             diagnostic = EXCLUDED.diagnostic,
             date_modification = CURRENT_TIMESTAMP
         `, [
           hosp.HOSPITALISATION_ID,
           hosp.PATIENT_ID,
           hosp.SERVICE,
           hosp.MEDECIN,
           hosp.DATE_SORTIE,
           hosp.STATUT,
           hosp.DIAGNOSTIC
         ])
       }

      // 5. Créer les appels pour les nouvelles hospitalisations
      const newCalls = await this.postgresQuery(`
        INSERT INTO calls (
          project_patient_id, project_hospitalisation_id, statut, date_appel_prevue
        )
        SELECT 
          h.project_patient_id,
          h.project_hospitalisation_id,
          'pending',
          h.date_sortie + INTERVAL '3 days'
        FROM hospitalisations_sync h
        LEFT JOIN calls c ON h.project_hospitalisation_id = c.project_hospitalisation_id
        WHERE c.project_call_id IS NULL
        AND h.date_sortie >= CURRENT_DATE - INTERVAL '30 days'
        RETURNING project_call_id
      `)

      await connection.close()
      await oraclePool.close()

      console.log(`📊 ${newCalls.rows.length} nouveaux appels créés`)

      return {
        patients_sync: oraclePatients.rows.length,
        hospitalisations_sync: oracleHospitalisations.rows.length,
        calls_created: newCalls.rows.length
      }

    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error)
      throw error
    }
  }

  // Récupérer les appels depuis PostgreSQL avec pagination et filtres avancés
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
        c.recording_path,
        c.nombre_tentatives,
        c.derniere_tentative,
        c.date_creation,
        c.date_modification
      FROM calls c
      JOIN patients_sync p ON c.project_patient_id = p.project_patient_id
      LEFT JOIN hospitalisations_sync h ON c.project_hospitalisation_id = h.project_hospitalisation_id
      WHERE 1=1
    `

    const params = []
    let paramIndex = 1

    // Filtres de recherche
    if (filters.recherche) {
      query += ` AND (p.nom ILIKE $${paramIndex} OR p.prenom ILIKE $${paramIndex} OR p.numero_patient ILIKE $${paramIndex} OR p.telephone ILIKE $${paramIndex})`
      params.push(`%${filters.recherche}%`)
      paramIndex++
    }

    // Filtres de statut
    if (filters.statut) {
      query += ` AND c.statut = $${paramIndex}`
      params.push(filters.statut)
      paramIndex++
    }

    // Filtres de service
    if (filters.service) {
      query += ` AND h.service = $${paramIndex}`
      params.push(filters.service)
      paramIndex++
    }

    // Filtres de date d'appel prévu
    if (filters.dateAppelDebut) {
      query += ` AND c.date_appel_prevue >= $${paramIndex}`
      params.push(filters.dateAppelDebut)
      paramIndex++
    }

    if (filters.dateAppelFin) {
      query += ` AND c.date_appel_prevue <= $${paramIndex}`
      params.push(filters.dateAppelFin)
      paramIndex++
    }

    // Filtres de date de sortie
    if (filters.dateSortieDebut) {
      query += ` AND h.date_sortie >= $${paramIndex}`
      params.push(filters.dateSortieDebut)
      paramIndex++
    }

    if (filters.dateSortieFin) {
      query += ` AND h.date_sortie <= $${paramIndex}`
      params.push(filters.dateSortieFin)
      paramIndex++
    }

    // Filtres de score
    if (filters.scoreMin !== undefined) {
      query += ` AND c.score >= $${paramIndex}`
      params.push(filters.scoreMin)
      paramIndex++
    }

    if (filters.scoreMax !== undefined) {
      query += ` AND c.score <= $${paramIndex}`
      params.push(filters.scoreMax)
      paramIndex++
    }

    // Tri
    const orderBy = filters.orderBy || 'date_appel_prevue'
    const orderDirection = filters.orderDirection || 'DESC'
    query += ` ORDER BY c.${orderBy} ${orderDirection}`

    // Pagination
    if (filters.page && filters.perPage) {
      const offset = (filters.page - 1) * filters.perPage
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(filters.perPage, offset)
    }

    const result = await this.postgresQuery(query, params)
    return result.rows
  }

  // Compter le nombre total d'appels avec les mêmes filtres
  async getCallsCount(filters = {}) {
    let query = `
      SELECT COUNT(*) as total
      FROM calls c
      JOIN patients_sync p ON c.project_patient_id = p.project_patient_id
      LEFT JOIN hospitalisations_sync h ON c.project_hospitalisation_id = h.project_hospitalisation_id
      WHERE 1=1
    `

    const params = []
    let paramIndex = 1

    // Appliquer les mêmes filtres que getCalls
    if (filters.recherche) {
      query += ` AND (p.nom ILIKE $${paramIndex} OR p.prenom ILIKE $${paramIndex} OR p.numero_patient ILIKE $${paramIndex} OR p.telephone ILIKE $${paramIndex})`
      params.push(`%${filters.recherche}%`)
      paramIndex++
    }

    if (filters.statut) {
      query += ` AND c.statut = $${paramIndex}`
      params.push(filters.statut)
      paramIndex++
    }

    if (filters.service) {
      query += ` AND h.service = $${paramIndex}`
      params.push(filters.service)
      paramIndex++
    }

    if (filters.dateAppelDebut) {
      query += ` AND c.date_appel_prevue >= $${paramIndex}`
      params.push(filters.dateAppelDebut)
      paramIndex++
    }

    if (filters.dateAppelFin) {
      query += ` AND c.date_appel_prevue <= $${paramIndex}`
      params.push(filters.dateAppelFin)
      paramIndex++
    }

    if (filters.dateSortieDebut) {
      query += ` AND h.date_sortie >= $${paramIndex}`
      params.push(filters.dateSortieDebut)
      paramIndex++
    }

    if (filters.dateSortieFin) {
      query += ` AND h.date_sortie <= $${paramIndex}`
      params.push(filters.dateSortieFin)
      paramIndex++
    }

    if (filters.scoreMin !== undefined) {
      query += ` AND c.score >= $${paramIndex}`
      params.push(filters.scoreMin)
      paramIndex++
    }

    if (filters.scoreMax !== undefined) {
      query += ` AND c.score <= $${paramIndex}`
      params.push(filters.scoreMax)
      paramIndex++
    }

    const result = await this.postgresQuery(query, params)
    return parseInt(result.rows[0].total)
  }

  // Autres méthodes PostgreSQL
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
    const result = await this.postgresQuery(query, [callId])
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

    const result = await this.postgresQuery(query, values)
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

    const result = await this.postgresQuery(query, values)
    return result.rows[0]
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
    const result = await this.postgresQuery(query)
    return result.rows
  }

  // Récupérer les services disponibles
  async getServices() {
    const query = `
      SELECT DISTINCT service 
      FROM hospitalisations_sync 
      WHERE service IS NOT NULL AND service != ''
      ORDER BY service
    `
    const result = await this.postgresQuery(query)
    return result.rows.map(row => row.service)
  }

  // Récupérer les paramètres système
  async getSystemParameters() {
    const query = `
      SELECT cle_parametre, valeur_parametre, description, type_parametre
      FROM system_parameters
      ORDER BY cle_parametre
    `
    const result = await this.postgresQuery(query)
    return result.rows
  }

  // Mettre à jour un paramètre système
  async updateSystemParameter(key, value) {
    const query = `
      UPDATE system_parameters 
      SET valeur_parametre = $1, date_modification = CURRENT_TIMESTAMP
      WHERE cle_parametre = $2
      RETURNING *
    `
    const result = await this.postgresQuery(query, [value, key])
    return result.rows[0]
  }

  // Calculer le score d'un appel
  async calculateCallScore(callId) {
    const query = `SELECT calculer_score_appel($1) as score`
    const result = await this.postgresQuery(query, [callId])
    return result.rows[0].score
  }

  // Marquer un appel comme échec
  async markCallAsFailed(patientId, maxAttempts = 3) {
    const query = `SELECT marquer_appel_echec($1, $2)`
    await this.postgresQuery(query, [patientId, maxAttempts])
  }

  // Récupérer l'historique d'un appel
  async getCallHistory(callId) {
    const query = `
      SELECT 
        action,
        ancien_statut,
        nouveau_statut,
        donnees_avant,
        donnees_apres,
        utilisateur,
        date_action
      FROM call_history
      WHERE project_call_id = $1
      ORDER BY date_action DESC
    `
    const result = await this.postgresQuery(query, [callId])
    return result.rows
  }

  // Récupérer les scores détaillés d'un appel
  async getCallScores(callId) {
    const query = `
      SELECT 
        type_score,
        valeur_score,
        poids_score,
        commentaire,
        date_calcul
      FROM scores
      WHERE project_call_id = $1
      ORDER BY date_calcul DESC
    `
    const result = await this.postgresQuery(query, [callId])
    return result.rows
  }

  // Ajouter un score détaillé
  async addCallScore(callId, scoreData) {
    const query = `
      INSERT INTO scores (
        project_call_id, type_score, valeur_score, poids_score, commentaire
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    const result = await this.postgresQuery(query, [
      callId,
      scoreData.type_score,
      scoreData.valeur_score,
      scoreData.poids_score || 1.0,
      scoreData.commentaire
    ])
    return result.rows[0]
  }

  // Récupérer les métadonnées d'un appel
  async getCallMetadata(callId) {
    const query = `
      SELECT 
        cle_metadonnee,
        valeur_metadonnee,
        type_donnee,
        date_creation
      FROM call_metadata
      WHERE project_call_id = $1
      ORDER BY cle_metadonnee
    `
    const result = await this.postgresQuery(query, [callId])
    return result.rows
  }

  // Ajouter ou mettre à jour une métadonnée
  async setCallMetadata(callId, key, value, type = 'TEXT') {
    const query = `
      INSERT INTO call_metadata (
        project_call_id, cle_metadonnee, valeur_metadonnee, type_donnee
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (project_call_id, cle_metadonnee) 
      DO UPDATE SET 
        valeur_metadonnee = EXCLUDED.valeur_metadonnee,
        type_donnee = EXCLUDED.type_donnee,
        date_creation = CURRENT_TIMESTAMP
      RETURNING *
    `
    const result = await this.postgresQuery(query, [callId, key, value, type])
    return result.rows[0]
  }

  async close() {
    this.stopAutoSync()
    if (this.postgresPool) {
      await this.postgresPool.end()
    }
    if (this.oraclePool) {
      await this.oraclePool.close()
    }
  }
}

module.exports = new HybridDatabaseService() 