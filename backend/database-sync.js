const oracledb = require('oracledb')
const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: './config.env' })

// Charger la configuration
const configPath = path.join(__dirname, 'config', 'database.yml')
const config = yaml.load(fs.readFileSync(configPath, 'utf8'))

class DatabaseSync {
  constructor() {
    this.hospitalPool = null
    this.projectPool = null
    this.isInitialized = false
  }

  // Initialiser les pools de connexion
  async initialize() {
    try {
      console.log('🔄 Initialisation des pools de connexion...')

      // Pool pour la base hospitalière (source)
      const hospitalConfig = {
        user: config.hospital_db.user,
        password: process.env.HOSPITAL_DB_PASSWORD || config.hospital_db.password,
        connectString: `${config.hospital_db.host}:${config.hospital_db.port}/${config.hospital_db.service}`,
        poolMin: 2,
        poolMax: 5,
        poolIncrement: 1,
        charset: 'AL32UTF8'
      }

      // Pool pour la base projet (destination)
      const projectConfig = {
        user: config.project_db.user,
        password: process.env.PROJECT_DB_PASSWORD || config.project_db.password,
        connectString: `${config.project_db.host}:${config.project_db.port}/${config.project_db.service}`,
        poolMin: 2,
        poolMax: 10,
        poolIncrement: 1,
        charset: 'AL32UTF8'
      }

      // Créer les pools
      this.hospitalPool = await oracledb.createPool('hospital', hospitalConfig)
      this.projectPool = await oracledb.createPool('project', projectConfig)

      console.log('✅ Pools de connexion initialisés')
      this.isInitialized = true

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des pools:', error)
      throw error
    }
  }

  // Obtenir une connexion de la base hospitalière
  async getHospitalConnection() {
    if (!this.isInitialized) await this.initialize()
    return await this.hospitalPool.getConnection()
  }

  // Obtenir une connexion de la base projet
  async getProjectConnection() {
    if (!this.isInitialized) await this.initialize()
    return await this.projectPool.getConnection()
  }

  // Synchroniser les patients
  async syncPatients() {
    let hospitalConn = null
    let projectConn = null

    try {
      console.log('🔄 Début de la synchronisation des patients...')

      hospitalConn = await this.getHospitalConnection()
      projectConn = await this.getProjectConnection()

      // Récupérer tous les patients de l'hôpital
      const hospitalPatients = await hospitalConn.execute(`
        SELECT 
          PATIENT_ID,
          NUMERO_PATIENT,
          NOM,
          PRENOM,
          DATE_NAISSANCE,
          TELEPHONE
        FROM ${config.hospital_db.schema}.${config.hospital_db.tables.patients}
        ORDER BY PATIENT_ID
      `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT })

      console.log(`📊 ${hospitalPatients.rows.length} patients récupérés de l'hôpital`)

      // Insérer/mettre à jour dans la base projet
      for (const patient of hospitalPatients.rows) {
        await projectConn.execute(`
          MERGE INTO ${config.project_db.schema}.${config.project_db.tables.patients_sync} p
          USING (SELECT :hospital_id as HOSPITAL_PATIENT_ID FROM DUAL) s
          ON (p.HOSPITAL_PATIENT_ID = s.HOSPITAL_PATIENT_ID)
          WHEN MATCHED THEN
            UPDATE SET
              p.NUMERO_PATIENT = :number,
              p.NOM = :last_name,
              p.PRENOM = :first_name,
              p.DATE_NAISSANCE = :birth_date,
              p.TELEPHONE = :phone,
              p.DATE_MODIFICATION = SYSDATE
          WHEN NOT MATCHED THEN
            INSERT (
              PROJECT_PATIENT_ID,
              HOSPITAL_PATIENT_ID,
              NUMERO_PATIENT,
              NOM,
              PRENOM,
              DATE_NAISSANCE,
              TELEPHONE,
              DATE_CREATION,
              DATE_MODIFICATION
            ) VALUES (
              PROJECT_PATIENT_SEQ.NEXTVAL,
              :hospital_id,
              :number,
              :last_name,
              :first_name,
              :birth_date,
              :phone,
              SYSDATE,
              SYSDATE
            )
        `, {
          hospital_id: patient.PATIENT_ID,
          number: patient.NUMERO_PATIENT,
          last_name: patient.NOM,
          first_name: patient.PRENOM,
          birth_date: patient.DATE_NAISSANCE,
          phone: patient.TELEPHONE
        })
      }

      await projectConn.commit()
      console.log('✅ Synchronisation des patients terminée')

    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation des patients:', error)
      if (projectConn) await projectConn.rollback()
      throw error
    } finally {
      if (hospitalConn) await hospitalConn.close()
      if (projectConn) await projectConn.close()
    }
  }

  // Synchroniser les hospitalisations
  async syncHospitalisations() {
    let hospitalConn = null
    let projectConn = null

    try {
      console.log('🔄 Début de la synchronisation des hospitalisations...')

      hospitalConn = await this.getHospitalConnection()
      projectConn = await this.getProjectConnection()

      // Récupérer toutes les hospitalisations de l'hôpital
      const hospitalisations = await hospitalConn.execute(`
        SELECT 
          h.HOSPITALISATION_ID,
          h.PATIENT_ID,
          h.SERVICE,
          h.MEDECIN,
          h.DATE_SORTIE,
          h.STATUT
        FROM ${config.hospital_db.schema}.${config.hospital_db.tables.hospitalisations} h
        ORDER BY h.HOSPITALISATION_ID
      `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT })

      console.log(`📊 ${hospitalisations.rows.length} hospitalisations récupérées de l'hôpital`)

      // Insérer/mettre à jour dans la base projet
      for (const hosp of hospitalisations.rows) {
        await projectConn.execute(`
          MERGE INTO ${config.project_db.schema}.${config.project_db.tables.hospitalisations_sync} h
          USING (SELECT :hospital_id as HOSPITAL_HOSPITALISATION_ID FROM DUAL) s
          ON (h.HOSPITAL_HOSPITALISATION_ID = s.HOSPITAL_HOSPITALISATION_ID)
          WHEN MATCHED THEN
            UPDATE SET
              h.PROJECT_PATIENT_ID = (SELECT PROJECT_PATIENT_ID FROM ${config.project_db.schema}.${config.project_db.tables.patients_sync} WHERE HOSPITAL_PATIENT_ID = :patient_id),
              h.SERVICE = :service,
              h.MEDECIN = :doctor,
              h.DATE_SORTIE = :discharge_date,
              h.STATUT = :status,
              h.DATE_MODIFICATION = SYSDATE
          WHEN NOT MATCHED THEN
            INSERT (
              PROJECT_HOSPITALISATION_ID,
              HOSPITAL_HOSPITALISATION_ID,
              PROJECT_PATIENT_ID,
              SERVICE,
              MEDECIN,
              DATE_SORTIE,
              STATUT,
              DATE_CREATION,
              DATE_MODIFICATION
            ) VALUES (
              PROJECT_HOSPITALISATION_SEQ.NEXTVAL,
              :hospital_id,
              (SELECT PROJECT_PATIENT_ID FROM ${config.project_db.schema}.${config.project_db.tables.patients_sync} WHERE HOSPITAL_PATIENT_ID = :patient_id),
              :service,
              :doctor,
              :discharge_date,
              :status,
              SYSDATE,
              SYSDATE
            )
        `, {
          hospital_id: hosp.HOSPITALISATION_ID,
          patient_id: hosp.PATIENT_ID,
          service: hosp.SERVICE,
          doctor: hosp.MEDECIN,
          discharge_date: hosp.DATE_SORTIE,
          status: hosp.STATUT
        })
      }

      await projectConn.commit()
      console.log('✅ Synchronisation des hospitalisations terminée')

    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation des hospitalisations:', error)
      if (projectConn) await projectConn.rollback()
      throw error
    } finally {
      if (hospitalConn) await hospitalConn.close()
      if (projectConn) await projectConn.close()
    }
  }

  // Synchronisation complète
  async fullSync() {
    try {
      console.log('🚀 Début de la synchronisation complète...')
      
      await this.syncPatients()
      await this.syncHospitalisations()
      
      console.log('🎉 Synchronisation complète terminée avec succès')
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation complète:', error)
      throw error
    }
  }

  // Fermer les pools
  async close() {
    try {
      if (this.hospitalPool) {
        await this.hospitalPool.close()
        console.log('✅ Pool hospitalier fermé')
      }
      if (this.projectPool) {
        await this.projectPool.close()
        console.log('✅ Pool projet fermé')
      }
    } catch (error) {
      console.error('❌ Erreur lors de la fermeture des pools:', error)
    }
  }
}

module.exports = DatabaseSync 