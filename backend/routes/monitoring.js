const express = require('express')
const router = express.Router()
const ldap = require('ldapjs')
const { Pool } = require('pg')
const oracledb = require('oracledb')
const { checkAsterisk } = require('./monitoring-asterisk')

// Configuration depuis les variables d'environnement
require('dotenv').config({ path: './config.env' })

// Configuration LDAP
const LDAP_CONFIG = {
  server: process.env.LDAP_SERVER,
  baseDN: process.env.LDAP_BASE_DN,
  bindDN: process.env.LDAP_BIND_DN,
  bindPassword: process.env.LDAP_BIND_PASSWORD,
  userSearchBase: process.env.LDAP_USER_SEARCH_BASE
}

// Configuration PostgreSQL (HelloJADE)
const POSTGRES_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hellojade',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
}

// Configuration Oracle (Hôpital)
const ORACLE_CONFIG = {
  user: process.env.ORACLE_USER || 'SIMULATIONHOPITAL',
  password: process.env.ORACLE_PASSWORD || 'Hospital2024',
  connectString: process.env.ORACLE_CONNECTION_STRING || 'localhost:1521/XEPDB1'
}

// Fonction utilitaire pour mesurer le temps de réponse
const measureResponseTime = async (checkFunction) => {
  const startTime = Date.now()
  try {
    const result = await checkFunction()
    const responseTime = Date.now() - startTime
    return { success: true, responseTime, ...result }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return { success: false, responseTime, error: error.message }
  }
}

// Vérification Active Directory
const checkActiveDirectory = async () => {
  return new Promise((resolve, reject) => {
    console.log('🔍 Monitoring AD: Tentative de connexion à', `ldap://${LDAP_CONFIG.server}:389`)
    console.log('🔍 Monitoring AD: Bind DN:', LDAP_CONFIG.bindDN)
    console.log('🔍 Monitoring AD: User Search Base:', LDAP_CONFIG.userSearchBase)
    
    const client = ldap.createClient({
      url: `ldap://${LDAP_CONFIG.server}:389`
    })

    client.bind(LDAP_CONFIG.bindDN, LDAP_CONFIG.bindPassword, (err) => {
      if (err) {
        console.error('❌ Monitoring AD: Erreur de bind:', err.message)
        client.unbind()
        reject(new Error(`Erreur de connexion LDAP: ${err.message}`))
        return
      }

      console.log('✅ Monitoring AD: Bind réussi')

      // Test de recherche d'utilisateurs
      const searchOptions = {
        scope: 'sub',
        filter: '(objectClass=user)',
        attributes: ['cn']
      }

      console.log('🔍 Monitoring AD: Recherche d\'utilisateurs...')

      client.search(LDAP_CONFIG.userSearchBase, searchOptions, (err, res) => {
        if (err) {
          console.error('❌ Monitoring AD: Erreur de recherche:', err.message)
          client.unbind()
          reject(new Error(`Erreur de recherche LDAP: ${err.message}`))
          return
        }

        let userCount = 0
        res.on('searchEntry', () => {
          userCount++
        })

        res.on('error', (err) => {
          console.error('❌ Monitoring AD: Erreur lors de la recherche:', err.message)
          client.unbind()
          reject(new Error(`Erreur lors de la recherche: ${err.message}`))
        })

        res.on('end', () => {
          console.log(`✅ Monitoring AD: Recherche terminée, ${userCount} utilisateurs trouvés`)
          client.unbind()
          resolve({
            status: 'online',
            uptime: 99.5,
            userCount,
            message: `Active Directory opérationnel - ${userCount} utilisateurs trouvés`
          })
        })
      })
    })
  })
}

// Vérification base de données HelloJADE (PostgreSQL)
const checkHelloJADEDatabase = async () => {
  const pool = new Pool(POSTGRES_CONFIG)
  
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW() as current_time, version() as version')
    client.release()
    
    return {
      status: 'online',
      uptime: 99.7,
      version: result.rows[0].version.split(' ')[0],
      message: 'Base de données HelloJADE opérationnelle'
    }
  } catch (error) {
    throw new Error(`Erreur de connexion PostgreSQL: ${error.message}`)
  } finally {
    await pool.end()
  }
}

// Vérification base de données Hôpital (Oracle)
const checkHospitalDatabase = async () => {
  let connection
  
  try {
    console.log('🔍 Monitoring Oracle: Tentative de connexion à', ORACLE_CONFIG.connectString)
    connection = await oracledb.getConnection(ORACLE_CONFIG)
    console.log('✅ Monitoring Oracle: Connexion établie')
    
    // Vérification de base
    const sysdateResult = await connection.execute('SELECT SYSDATE FROM DUAL')
    console.log('✅ Monitoring Oracle: SYSDATE récupéré')
    
    // Vérification des tables principales de la simulation hôpital
    const tablesToCheck = [
      'PATIENTS',
      'MEDECINS', 
      'SERVICES',
      'CHAMBRES',
      'HOSPITALISATIONS',
      'RENDEZ_VOUS'
    ]
    
    const tableStats = {}
    let totalRecords = 0
    
    for (const tableName of tablesToCheck) {
      try {
        const result = await connection.execute(`SELECT COUNT(*) as count FROM SIMULATIONHOPITAL.${tableName}`)
        const count = result.rows[0][0]
        tableStats[tableName] = count
        totalRecords += count
        console.log(`✅ Monitoring Oracle: Table ${tableName} - ${count} enregistrements`)
      } catch (error) {
        console.warn(`⚠️ Monitoring Oracle: Impossible de compter les enregistrements de ${tableName}:`, error.message)
        tableStats[tableName] = 0
      }
    }
    
    // Vérification des chambres occupées
    let occupiedRooms = 0
    try {
      const occupiedResult = await connection.execute(
        'SELECT COUNT(*) as count FROM SIMULATIONHOPITAL.CHAMBRES WHERE OCCUPEE = \'Y\''
      )
      occupiedRooms = occupiedResult.rows[0][0]
      console.log(`✅ Monitoring Oracle: ${occupiedRooms} chambres occupées`)
    } catch (error) {
      console.warn('⚠️ Monitoring Oracle: Impossible de compter les chambres occupées:', error.message)
    }
    
    // Vérification des hospitalisations en cours
    let activeHospitalizations = 0
    try {
      const hospResult = await connection.execute(
        'SELECT COUNT(*) as count FROM SIMULATIONHOPITAL.HOSPITALISATIONS WHERE STATUT = \'En cours\''
      )
      activeHospitalizations = hospResult.rows[0][0]
      console.log(`✅ Monitoring Oracle: ${activeHospitalizations} hospitalisations en cours`)
    } catch (error) {
      console.warn('⚠️ Monitoring Oracle: Impossible de compter les hospitalisations:', error.message)
    }
    
    return {
      status: 'online',
      uptime: 99.9,
      currentTime: sysdateResult.rows[0][0],
      totalRecords,
      tableStats,
      occupiedRooms,
      activeHospitalizations,
      message: `Base de données Hôpital (Oracle) opérationnelle - ${totalRecords} enregistrements au total`
    }
  } catch (error) {
    console.error('❌ Monitoring Oracle: Erreur de connexion:', error.message)
    throw new Error(`Erreur de connexion Oracle: ${error.message}`)
  } finally {
    if (connection) {
      try {
        await connection.close()
        console.log('✅ Monitoring Oracle: Connexion fermée')
      } catch (err) {
        console.error('❌ Monitoring Oracle: Erreur lors de la fermeture de la connexion:', err)
      }
    }
  }
}

// Route pour vérifier le statut d'Asterisk
router.get('/asterisk', async (req, res) => {
  try {
    console.log('📡 Monitoring Asterisk: Requête reçue')
    
    const result = await measureResponseTime(checkAsterisk)
    console.log('📊 Monitoring Asterisk: Résultat:', result)
    
    if (result.success) {
      res.json({
        status: result.status,
        responseTime: result.responseTime,
        uptime: result.uptime,
        activeCalls: result.activeCalls,
        zadarmaStatus: result.zadarmaStatus,
        message: result.message
      })
    } else {
      res.status(503).json({
        status: 'offline',
        responseTime: result.responseTime,
        error: result.error,
        message: 'Service Asterisk non disponible'
      })
    }
  } catch (error) {
    console.error('💥 Monitoring Asterisk: Erreur non gérée:', error.message)
    res.status(500).json({
      status: 'offline',
      error: error.message,
      message: 'Erreur lors de la vérification d\'Asterisk'
    })
  }
})

// Route pour vérifier la base de données Hôpital
router.get('/hospital-db', async (req, res) => {
  try {
    console.log('📡 Monitoring Oracle: Requête reçue')
    const result = await measureResponseTime(checkHospitalDatabase)
    
    if (result.success) {
      console.log('✅ Monitoring Oracle: Succès, envoi de la réponse')
      res.json({
        status: result.status,
        responseTime: result.responseTime,
        uptime: result.uptime,
        currentTime: result.currentTime,
        totalRecords: result.totalRecords,
        tableStats: result.tableStats,
        occupiedRooms: result.occupiedRooms,
        activeHospitalizations: result.activeHospitalizations,
        message: result.message
      })
    } else {
      console.log('❌ Monitoring Oracle: Échec, envoi de l\'erreur 503')
      res.status(503).json({
        status: 'offline',
        responseTime: result.responseTime,
        error: result.error
      })
    }
  } catch (error) {
    console.error('💥 Monitoring Oracle: Erreur non gérée:', error.message)
    res.status(500).json({
      status: 'offline',
      error: error.message
    })
  }
})

// Route pour vérifier la base de données HelloJADE
router.get('/hellojade-db', async (req, res) => {
  try {
    const result = await measureResponseTime(checkHelloJADEDatabase)
    
    if (result.success) {
      res.json({
        status: result.status,
        responseTime: result.responseTime,
        uptime: result.uptime,
        version: result.version,
        message: result.message
      })
    } else {
      res.status(503).json({
        status: 'offline',
        responseTime: result.responseTime,
        error: result.error
      })
    }
  } catch (error) {
    res.status(500).json({
      status: 'offline',
      error: error.message
    })
  }
})

// Route pour vérifier Active Directory
router.get('/active-directory', async (req, res) => {
  console.log('📡 Monitoring AD: Requête reçue')
  
  try {
    console.log('🔍 Monitoring AD: Début de la vérification')
    const result = await measureResponseTime(checkActiveDirectory)
    console.log('📊 Monitoring AD: Résultat:', result)
    
    if (result.success) {
      console.log('✅ Monitoring AD: Succès, envoi de la réponse')
      res.json({
        status: result.status,
        responseTime: result.responseTime,
        uptime: result.uptime,
        userCount: result.userCount,
        message: result.message
      })
    } else {
      console.log('❌ Monitoring AD: Échec, envoi de l\'erreur 503')
      res.status(503).json({
        status: 'offline',
        responseTime: result.responseTime,
        error: result.error
      })
    }
  } catch (error) {
    console.error('💥 Monitoring AD: Erreur non gérée:', error.message)
    res.status(500).json({
      status: 'offline',
      error: error.message
    })
  }
})

// Route pour obtenir les métriques système
router.get('/system-metrics', async (req, res) => {
  try {
    // Simulation de métriques système
    const metrics = [
      {
        key: 'cpu',
        title: 'CPU',
        description: 'Utilisation du processeur',
        value: (Math.random() * 30 + 30).toFixed(1), // 30-60%
        unit: '%',
        icon: 'CpuChipIcon',
        colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
        progressColorClass: 'bg-blue-500',
        showProgress: true,
        percentage: Math.floor(Math.random() * 30 + 30),
        trend: Math.floor(Math.random() * 10 - 5) // -5 à +5
      },
      {
        key: 'memory',
        title: 'Mémoire',
        description: 'Utilisation de la RAM',
        value: (Math.random() * 2 + 2).toFixed(1), // 2-4 GB
        unit: 'GB',
        icon: 'ServerIcon',
        colorClass: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
        progressColorClass: 'bg-green-500',
        showProgress: true,
        percentage: Math.floor(Math.random() * 20 + 60), // 60-80%
        trend: Math.floor(Math.random() * 10 - 5)
      },
      {
        key: 'network',
        title: 'Réseau',
        description: 'Trafic réseau',
        value: Math.floor(Math.random() * 100 + 100), // 100-200 Mbps
        unit: 'Mbps',
        icon: 'WifiIcon',
        colorClass: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
        progressColorClass: 'bg-purple-500',
        showProgress: true,
        percentage: Math.floor(Math.random() * 40 + 40), // 40-80%
        trend: Math.floor(Math.random() * 15 - 5)
      },
      {
        key: 'response',
        title: 'Temps de réponse',
        description: 'Latence moyenne',
        value: Math.floor(Math.random() * 20 + 40), // 40-60ms
        unit: 'ms',
        icon: 'ClockIcon',
        colorClass: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300',
        progressColorClass: 'bg-orange-500',
        showProgress: false,
        trend: Math.floor(Math.random() * 10 - 5)
      },
      {
        key: 'database',
        title: 'Base de données',
        description: 'Connexions actives',
        value: Math.floor(Math.random() * 10 + 20), // 20-30 connexions
        unit: 'connexions',
        icon: 'DatabaseIcon',
        colorClass: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300',
        progressColorClass: 'bg-indigo-500',
        showProgress: false,
        trend: Math.floor(Math.random() * 6 - 3)
      },
      {
        key: 'users',
        title: 'Utilisateurs',
        description: 'Utilisateurs connectés',
        value: Math.floor(Math.random() * 8 + 8), // 8-16 utilisateurs
        unit: 'actifs',
        icon: 'UserGroupIcon',
        colorClass: 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300',
        progressColorClass: 'bg-pink-500',
        showProgress: false,
        trend: Math.floor(Math.random() * 6 - 3)
      }
    ]

    // Données de performance simulées
    const performance = {
      cpu: Array.from({ length: 12 }, () => Math.floor(Math.random() * 30 + 30)),
      memory: Array.from({ length: 12 }, () => Math.floor(Math.random() * 20 + 60)),
      network: Array.from({ length: 12 }, () => Math.floor(Math.random() * 100 + 100)),
      responseTime: Array.from({ length: 12 }, () => Math.floor(Math.random() * 20 + 40))
    }

    res.json({
      metrics,
      performance
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
})

module.exports = router