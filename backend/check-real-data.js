const { Pool } = require('pg')
require('dotenv').config({ path: './config.env' })

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function checkRealData() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Vérification des vraies données PostgreSQL...\n')
    
    // 1. Vérifier la table calls
    console.log('1️⃣ Table CALLS (données réelles):')
    const callsQuery = `
      SELECT 
        id, patient_id, nom, prenom, statut_appel, date_heure_reelle,
        service_hospitalisation, medecin_referent
      FROM calls 
      WHERE statut_appel = 'APPELE'
      ORDER BY date_heure_reelle DESC
      LIMIT 5
    `
    const callsResult = await client.query(callsQuery)
    console.log(`📊 ${callsResult.rows.length} patients appelés trouvés dans la vraie DB`)
    
    callsResult.rows.forEach((call, index) => {
      console.log(`${index + 1}. ${call.prenom} ${call.nom}`)
      console.log(`   - ID: ${call.id}, Patient ID: ${call.patient_id}`)
      console.log(`   - Statut: ${call.statut_appel}`)
      console.log(`   - Date appel: ${call.date_heure_reelle}`)
      console.log(`   - Service: ${call.service_hospitalisation || 'NULL'}`)
      console.log(`   - Médecin: ${call.medecin_referent || 'NULL'}`)
      console.log('')
    })
    
    // 2. Vérifier les alertes réelles
    console.log('2️⃣ Table PATIENT_ALERTS (données réelles):')
    const alertsQuery = `
      SELECT 
        id, patient_id, type_alerte, niveau_urgence, description, action_requise, date_creation
      FROM patient_alerts 
      WHERE statut = 'ACTIVE'
      ORDER BY date_creation DESC
      LIMIT 5
    `
    const alertsResult = await client.query(alertsQuery)
    console.log(`📊 ${alertsResult.rows.length} alertes actives trouvées dans la vraie DB`)
    
    alertsResult.rows.forEach((alert, index) => {
      console.log(`${index + 1}. Alerte ID: ${alert.id}`)
      console.log(`   - Patient ID: ${alert.patient_id}`)
      console.log(`   - Type: ${alert.type_alerte}`)
      console.log(`   - Urgence: ${alert.niveau_urgence}`)
      console.log(`   - Description: ${alert.description}`)
      console.log(`   - Date: ${alert.date_creation}`)
      console.log('')
    })
    
    // 3. Vérifier la satisfaction réelle
    console.log('3️⃣ Table PATIENT_SATISFACTION (données réelles):')
    const satisfactionQuery = `
      SELECT 
        id, patient_id, score_global, date_evaluation
      FROM patient_satisfaction 
      ORDER BY date_evaluation DESC
      LIMIT 5
    `
    const satisfactionResult = await client.query(satisfactionQuery)
    console.log(`📊 ${satisfactionResult.rows.length} évaluations de satisfaction trouvées`)
    
    satisfactionResult.rows.forEach((satisfaction, index) => {
      console.log(`${index + 1}. Satisfaction ID: ${satisfaction.id}`)
      console.log(`   - Patient ID: ${satisfaction.patient_id}`)
      console.log(`   - Score: ${satisfaction.score_global}/10`)
      console.log(`   - Date: ${satisfaction.date_evaluation}`)
      console.log('')
    })
    
    // 4. Vérifier les métriques de bien-être réelles
    console.log('4️⃣ Table PATIENT_WELLNESS_METRICS (données réelles):')
    const wellnessQuery = `
      SELECT 
        id, patient_id, niveau_douleur, etat_fatigue, niveau_anxiete, presence_infection
      FROM patient_wellness_metrics 
      ORDER BY id DESC
      LIMIT 5
    `
    const wellnessResult = await client.query(wellnessQuery)
    console.log(`📊 ${wellnessResult.rows.length} métriques de bien-être trouvées`)
    
    wellnessResult.rows.forEach((wellness, index) => {
      console.log(`${index + 1}. Wellness ID: ${wellness.id}`)
      console.log(`   - Patient ID: ${wellness.patient_id}`)
      console.log(`   - Douleur: ${wellness.niveau_douleur}/10`)
      console.log(`   - Fatigue: ${wellness.etat_fatigue}`)
      console.log(`   - Anxiété: ${wellness.niveau_anxiete}`)
      console.log(`   - Infection: ${wellness.presence_infection}`)
      console.log('')
    })
    
    // 5. Requête complète comme dans le dashboard
    console.log('5️⃣ Requête complète du dashboard (données réelles):')
    const dashboardQuery = `
      SELECT 
        c.id as call_id,
        c.patient_id,
        c.nom,
        c.prenom,
        c.statut_appel,
        c.date_heure_reelle,
        COALESCE(c.service_hospitalisation, 'Service inconnu') as service_hospitalisation,
        COALESCE(c.medecin_referent, 'Médecin non assigné') as medecin_nom,
        (ps.score_global * 10) as satisfaction_score,
        wm.niveau_douleur,
        pa.id as alerte_id,
        pa.type_alerte,
        pa.niveau_urgence
      FROM calls c
      LEFT JOIN patient_satisfaction ps ON c.patient_id = ps.patient_id
      LEFT JOIN patient_wellness_metrics wm ON c.patient_id = wm.patient_id
      LEFT JOIN patient_alerts pa ON c.patient_id = pa.patient_id AND pa.statut = 'ACTIVE'
      WHERE c.statut_appel = 'APPELE'
      ORDER BY c.date_heure_reelle DESC
      LIMIT 3
    `
    const dashboardResult = await client.query(dashboardQuery)
    console.log(`📊 ${dashboardResult.rows.length} patients pour le dashboard`)
    
    dashboardResult.rows.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.prenom} ${patient.nom}`)
      console.log(`   - Service: ${patient.service_hospitalisation}`)
      console.log(`   - Médecin: ${patient.medecin_nom}`)
      console.log(`   - Satisfaction: ${patient.satisfaction_score || 'Non évalué'}`)
      console.log(`   - Douleur: ${patient.niveau_douleur || 'Non évalué'}`)
      if (patient.alerte_id) {
        console.log(`   ⚠️  Alerte: ${patient.type_alerte} (${patient.niveau_urgence})`)
      }
      console.log('')
    })
    
    console.log('✅ Vérification terminée - Ce sont les VRAIES données PostgreSQL!')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

checkRealData() 