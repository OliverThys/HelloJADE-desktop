const { Pool } = require('pg')
require('dotenv').config({ path: './config.env' })

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function testCompleteScoreSystem() {
  try {
    console.log('🧪 Test complet du système de score...\n')
    
    // 1. Vérifier les tables créées
    console.log('1. Vérification des tables...')
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('patient_score_metrics', 'patient_score_alerts')
      ORDER BY table_name
    `
    const tables = await pool.query(tablesQuery)
    console.log(`✅ Tables trouvées: ${tables.rows.map(t => t.table_name).join(', ')}`)
    
    // 2. Vérifier les fonctions créées
    console.log('\n2. Vérification des fonctions...')
    const functionsQuery = `
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name IN ('calculer_score_patient', 'trigger_creer_alerte_score')
      ORDER BY routine_name
    `
    const functions = await pool.query(functionsQuery)
    console.log(`✅ Fonctions trouvées: ${functions.rows.map(f => f.routine_name).join(', ')}`)
    
    // 3. Tester la fonction de calcul de score
    console.log('\n3. Test de la fonction de calcul de score...')
    const testScores = [
      { douleur: 8, traitement_suivi: false, transit_normal: false, moral: 2, fievre: true, mots_cles: ['urgent'] },
      { douleur: 6, traitement_suivi: true, transit_normal: false, moral: 4, fievre: false, mots_cles: ['fatigue'] },
      { douleur: 4, traitement_suivi: true, transit_normal: true, moral: 6, fievre: false, mots_cles: [] },
      { douleur: 2, traitement_suivi: true, transit_normal: true, moral: 8, fievre: false, mots_cles: [] },
      { douleur: 1, traitement_suivi: true, transit_normal: true, moral: 9, fievre: false, mots_cles: [] }
    ]
    
    for (const test of testScores) {
      const result = await pool.query(`
        SELECT calculer_score_patient($1, $2, $3, $4, $5, $6) as score
      `, [test.douleur, test.traitement_suivi, test.transit_normal, test.moral, test.fievre, test.mots_cles])
      
      const score = result.rows[0].score
      console.log(`   Douleur: ${test.douleur}, Traitement: ${test.traitement_suivi}, Transit: ${test.transit_normal}, Moral: ${test.moral}, Fièvre: ${test.fievre}, Mots-clés: [${test.mots_cles.join(', ')}] → Score: ${score}/100`)
    }
    
    // 4. Vérifier les données de test insérées
    console.log('\n4. Vérification des données de test...')
    const metricsQuery = `
      SELECT 
        psm.id,
        p.nom,
        p.prenom,
        p.statut_appel,
        psm.douleur,
        psm.traitement_suivi,
        psm.transit_normal,
        psm.moral,
        psm.fievre,
        psm.mots_cles_urgents,
        psm.score_calcule
      FROM patient_score_metrics psm
      JOIN patients p ON psm.patient_id = p.id
      ORDER BY psm.score_calcule ASC
    `
    const metrics = await pool.query(metricsQuery)
    console.log(`✅ ${metrics.rows.length} métriques de score trouvées:`)
    metrics.rows.forEach(m => {
      console.log(`   ${m.prenom} ${m.nom} (${m.statut_appel}): Score ${m.score_calcule}/100`)
    })
    
    // 5. Vérifier les alertes générées
    console.log('\n5. Vérification des alertes...')
    const alertsQuery = `
      SELECT 
        psa.id,
        p.nom,
        p.prenom,
        psa.score_calcule,
        psa.niveau_urgence,
        psa.raison_alerte,
        psa.statut
      FROM patient_score_alerts psa
      JOIN patients p ON psa.patient_id = p.id
      ORDER BY psa.score_calcule ASC
    `
    const alerts = await pool.query(alertsQuery)
    console.log(`✅ ${alerts.rows.length} alertes trouvées:`)
    alerts.rows.forEach(a => {
      console.log(`   ${a.prenom} ${a.nom}: Score ${a.score_calcule}/100 (${a.niveau_urgence}) - ${a.raison_alerte}`)
    })
    
    // 6. Tester l'API dashboard avec des requêtes simulées
    console.log('\n6. Test des requêtes API dashboard...')
    
    // Test de la requête recent-patients
    const recentPatientsQuery = `
      SELECT 
        c.id as call_id,
        c.patient_id,
        c.nom,
        c.prenom,
        c.date_sortie_hospitalisation,
        c.statut_appel,
        c.date_heure_reelle,
        c.resume_appel,
        COALESCE(c.service_hospitalisation, 'Service inconnu') as service_hospitalisation,
        COALESCE(c.medecin_referent, 'Médecin non assigné') as medecin_nom,
        NULL as medecin_prenom,
        0 as jours_post_sortie,
        (ps.score_global * 10) as satisfaction_score,
        psm.douleur,
        psm.traitement_suivi,
        psm.transit_normal,
        psm.moral,
        psm.fievre,
        psm.mots_cles_urgents,
        psm.score_calcule,
        psm.date_evaluation,
        psa.id as alerte_id,
        psa.niveau_urgence,
        psa.raison_alerte,
        psa.action_requise
      FROM calls c
      LEFT JOIN patient_satisfaction ps ON c.patient_id = ps.patient_id
      LEFT JOIN patient_score_metrics psm ON c.patient_id = psm.patient_id
      LEFT JOIN patient_score_alerts psa ON c.patient_id = psa.patient_id AND psa.statut = 'ACTIVE'
      ORDER BY 
        CASE 
          WHEN c.statut_appel = 'APPELE' THEN 1
          WHEN c.statut_appel = 'SUCCES' THEN 2
          WHEN c.statut_appel = 'ECHEC' THEN 3
          ELSE 4
        END,
        c.date_heure_reelle DESC NULLS LAST, 
        c.date_sortie_hospitalisation DESC
      LIMIT 10
    `
    const recentPatients = await pool.query(recentPatientsQuery)
    console.log(`✅ Requête recent-patients: ${recentPatients.rows.length} patients trouvés`)
    
    // Analyser les résultats
    const patientsWithScore = recentPatients.rows.filter(p => p.score_calcule !== null)
    const patientsWithoutScore = recentPatients.rows.filter(p => p.score_calcule === null)
    const patientsWithAlerts = recentPatients.rows.filter(p => p.alerte_id !== null)
    
    console.log(`   - Patients avec score: ${patientsWithScore.length}`)
    console.log(`   - Patients sans score (non appelés): ${patientsWithoutScore.length}`)
    console.log(`   - Patients avec alertes: ${patientsWithAlerts.length}`)
    
    // Afficher quelques exemples
    console.log('\n   Exemples de patients:')
    recentPatients.rows.slice(0, 3).forEach(p => {
      const status = p.score_calcule !== null ? 
        (p.score_calcule <= 30 ? 'URGENCE' : p.score_calcule <= 60 ? 'ATTENTION' : 'STABLE') :
        (p.statut_appel === 'ECHEC' ? 'ECHEC' : p.statut_appel === 'A_APPELER' ? 'EN_ATTENTE' : 'EN_COURS')
      
      console.log(`   - ${p.prenom} ${p.nom} (${p.statut_appel}): ${status}${p.score_calcule !== null ? ` - Score: ${p.score_calcule}/100` : ''}`)
    })
    
    // 7. Test de la requête alertes
    console.log('\n7. Test de la requête alertes...')
    const alertsApiQuery = `
      SELECT 
        a.id as alerte_id,
        a.patient_id,
        p.nom as patient_nom,
        p.prenom as patient_prenom,
        a.score_calcule,
        a.niveau_urgence,
        a.raison_alerte,
        a.action_requise,
        a.date_creation
      FROM patient_score_alerts a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.statut = 'ACTIVE' AND a.score_calcule <= 60
      ORDER BY a.score_calcule ASC
    `
    const alertsApi = await pool.query(alertsApiQuery)
    console.log(`✅ Requête alertes: ${alertsApi.rows.length} alertes actives trouvées`)
    
    alertsApi.rows.forEach(alert => {
      console.log(`   - ${alert.patient_prenom} ${alert.patient_nom}: Score ${alert.score_calcule}/100 - ${alert.raison_alerte}`)
    })
    
    console.log('\n✅ Test complet terminé avec succès!')
    console.log('\n📋 Résumé:')
    console.log(`- Tables créées: ${tables.rows.length}`)
    console.log(`- Fonctions créées: ${functions.rows.length}`)
    console.log(`- Métriques de test: ${metrics.rows.length}`)
    console.log(`- Alertes générées: ${alerts.rows.length}`)
    console.log(`- Patients dans l'API: ${recentPatients.rows.length}`)
    console.log(`- Alertes actives: ${alertsApi.rows.length}`)
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Exécution du test
testCompleteScoreSystem()
  .then(() => {
    console.log('\n🎉 Test terminé avec succès!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Test échoué:', error)
    process.exit(1)
  }) 