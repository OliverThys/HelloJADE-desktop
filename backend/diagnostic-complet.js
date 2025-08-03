const { Pool } = require('pg')
require('dotenv').config({ path: './config.env' })

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function diagnosticComplet() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 DIAGNOSTIC COMPLET DE LA BASE DE DONNÉES HELLOJADE')
    console.log('=' .repeat(60))
    
    // 1. Test de connexion
    console.log('\n1️⃣ TEST DE CONNEXION')
    const testQuery = 'SELECT NOW() as current_time, current_database() as db_name, current_user as user'
    const testResult = await client.query(testQuery)
    console.log('✅ Connexion OK:', testResult.rows[0])
    
    // 2. Lister toutes les tables
    console.log('\n2️⃣ TABLES DISPONIBLES')
    const tablesQuery = `
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    const tablesResult = await client.query(tablesQuery)
    console.log('📋 Tables trouvées:')
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name} (${row.table_type})`)
    })
    
    // 3. Structure détaillée de la table calls
    console.log('\n3️⃣ STRUCTURE DE LA TABLE CALLS')
    if (tablesResult.rows.some(row => row.table_name === 'calls')) {
      const structureQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'calls' 
        ORDER BY ordinal_position
      `
      const structureResult = await client.query(structureQuery)
      console.log('📊 Colonnes de la table calls:')
      structureResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`)
      })
      
      // 4. Données d'exemple de la table calls
      console.log('\n4️⃣ DONNÉES D\'EXEMPLE DE CALLS')
      const sampleQuery = 'SELECT * FROM calls LIMIT 3'
      const sampleResult = await client.query(sampleQuery)
      console.log('📄 Exemples de données:')
      sampleResult.rows.forEach((row, index) => {
        console.log(`  Enregistrement ${index + 1}:`)
        Object.entries(row).forEach(([key, value]) => {
          console.log(`    ${key}: ${value}`)
        })
        console.log('')
      })
      
      // 5. Statistiques de la table calls
      console.log('\n5️⃣ STATISTIQUES DE CALLS')
      const statsQuery = `
        SELECT 
          COUNT(*) as total_records,
          COUNT(CASE WHEN statut_appel = 'APPELE' THEN 1 END) as appeles,
          COUNT(CASE WHEN statut_appel = 'A_APPELER' THEN 1 END) as a_appeler,
          COUNT(CASE WHEN statut_appel = 'ECHEC' THEN 1 END) as echec,
          COUNT(CASE WHEN statut_appel IS NULL THEN 1 END) as null_status
        FROM calls
      `
      const statsResult = await client.query(statsQuery)
      console.log('📈 Statistiques:')
      console.log(`  - Total: ${statsResult.rows[0].total_records}`)
      console.log(`  - Appelés: ${statsResult.rows[0].appeles}`)
      console.log(`  - À appeler: ${statsResult.rows[0].a_appeler}`)
      console.log(`  - Échec: ${statsResult.rows[0].echec}`)
      console.log(`  - Statut NULL: ${statsResult.rows[0].null_status}`)
      
    } else {
      console.log('❌ La table calls n\'existe pas!')
    }
    
    // 6. Vérifier les tables de satisfaction
    console.log('\n6️⃣ TABLES DE SATISFACTION')
    const satisfactionTables = ['patient_satisfaction', 'patient_alerts', 'patient_wellness_metrics']
    
    for (const tableName of satisfactionTables) {
      const existsQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) as table_exists
      `
      const existsResult = await client.query(existsQuery, [tableName])
      
      if (existsResult.rows[0].table_exists) {
        console.log(`✅ ${tableName} existe`)
        
        // Compter les enregistrements
        const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`
        const countResult = await client.query(countQuery)
        console.log(`  - ${countResult.rows[0].count} enregistrements`)
        
        // Structure de la table
        const structureQuery = `
          SELECT column_name, data_type
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `
        const structureResult = await client.query(structureQuery, [tableName])
        console.log(`  - Colonnes: ${structureResult.rows.map(r => r.column_name).join(', ')}`)
      } else {
        console.log(`❌ ${tableName} n'existe pas`)
      }
    }
    
    // 7. Test des requêtes du dashboard
    console.log('\n7️⃣ TEST DES REQUÊTES DASHBOARD')
    
    // Test de la requête overview
    try {
      const overviewQuery = `
        SELECT 
          COUNT(*) as total_patients,
          COUNT(CASE WHEN c.statut_appel = 'APPELE' THEN 1 END) as patients_appeles,
          COUNT(CASE WHEN c.statut_appel = 'A_APPELER' OR c.statut_appel IS NULL THEN 1 END) as patients_a_appeler,
          COUNT(CASE WHEN c.statut_appel = 'ECHEC' THEN 1 END) as patients_echec,
          COUNT(CASE WHEN c.date_heure_reelle >= CURRENT_DATE THEN 1 END) as appels_aujourd_hui
        FROM calls c
      `
      const overviewResult = await client.query(overviewQuery)
      console.log('✅ Requête overview OK:', overviewResult.rows[0])
    } catch (error) {
      console.log('❌ Erreur requête overview:', error.message)
    }
    
    // Test de la requête recent-patients
    try {
      const recentQuery = `
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
          COALESCE(c.medecin_referent, 'Médecin non assigné') as medecin_nom
        FROM calls c
        ORDER BY c.date_heure_reelle DESC NULLS LAST, c.date_sortie_hospitalisation DESC
        LIMIT 3
      `
      const recentResult = await client.query(recentQuery)
      console.log('✅ Requête recent-patients OK:', recentResult.rows.length, 'résultats')
      recentResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.nom} ${row.prenom} - ${row.statut_appel}`)
      })
    } catch (error) {
      console.log('❌ Erreur requête recent-patients:', error.message)
    }
    
    // Test de la requête statistics
    try {
      const statsQuery = `
        SELECT 
          COALESCE(c.service_hospitalisation, 'Service inconnu') as nom_service,
          COUNT(c.id) as total_patients,
          COUNT(CASE WHEN c.statut_appel = 'APPELE' THEN 1 END) as patients_appeles
        FROM calls c
        GROUP BY c.service_hospitalisation
        ORDER BY total_patients DESC
        LIMIT 3
      `
      const statsResult = await client.query(statsQuery)
      console.log('✅ Requête statistics OK:', statsResult.rows.length, 'résultats')
      statsResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.nom_service}: ${row.total_patients} patients`)
      })
    } catch (error) {
      console.log('❌ Erreur requête statistics:', error.message)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    client.release()
    await pool.end()
  }
}

diagnosticComplet() 