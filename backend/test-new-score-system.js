const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

// Configuration PostgreSQL
const POSTGRES_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hellojade',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
};

async function testNewScoreSystem() {
    const pool = new Pool(POSTGRES_CONFIG);
    const client = await pool.connect();
    
    try {
        console.log('🧪 Test du nouveau système de score...');
        
        // 1. Tester l'insertion de nouvelles métriques de score
        console.log('\n📊 Test 1: Insertion de métriques de score...');
        
        const testMetrics = [
            {
                patient_id: 1,
                douleur: 8,
                traitement_suivi: false,
                transit_normal: true,
                moral: 2,
                fievre: true,
                mots_cles_urgents: ['urgence', 'douleur intense', 'fièvre']
            },
            {
                patient_id: 2,
                douleur: 3,
                traitement_suivi: true,
                transit_normal: false,
                moral: 7,
                fievre: false,
                mots_cles_urgents: []
            },
            {
                patient_id: 3,
                douleur: 1,
                traitement_suivi: true,
                transit_normal: true,
                moral: 9,
                fievre: false,
                mots_cles_urgents: []
            }
        ];
        
        for (const metric of testMetrics) {
            const result = await client.query(`
                INSERT INTO patient_score_metrics (
                    patient_id, douleur, traitement_suivi, transit_normal, moral, fievre, mots_cles_urgents
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, score_calcule
            `, [
                metric.patient_id,
                metric.douleur,
                metric.traitement_suivi,
                metric.transit_normal,
                metric.moral,
                metric.fievre,
                metric.mots_cles_urgents
            ]);
            
            console.log(`✅ Patient ${metric.patient_id}: Score calculé = ${result.rows[0].score_calcule}/100`);
        }
        
        // 2. Vérifier les alertes générées automatiquement
        console.log('\n🚨 Test 2: Vérification des alertes générées...');
        
        const alertsResult = await client.query(`
            SELECT 
                psa.id,
                psa.patient_id,
                psa.score_calcule,
                psa.niveau_urgence,
                psa.raison_alerte,
                psa.action_requise
            FROM patient_score_alerts psa
            WHERE psa.statut = 'ACTIVE'
            ORDER BY psa.score_calcule ASC
        `);
        
        console.log(`📋 ${alertsResult.rows.length} alertes actives trouvées:`);
        alertsResult.rows.forEach(alert => {
            console.log(`  - Patient ${alert.patient_id}: Score ${alert.score_calcule}/100 (${alert.niveau_urgence})`);
        });
        
        // 3. Tester l'API du dashboard
        console.log('\n🌐 Test 3: Test de l\'API dashboard...');
        
        // Simuler une requête pour les patients récents
        const patientsResult = await client.query(`
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
                (ps.score_global * 10) as satisfaction_score,
                psm.douleur,
                psm.traitement_suivi,
                psm.transit_normal,
                psm.moral,
                psm.fievre,
                psm.mots_cles_urgents,
                psm.score_calcule,
                psa.id as alerte_id,
                psa.niveau_urgence,
                psa.raison_alerte,
                psa.action_requise
            FROM calls c
            LEFT JOIN patient_satisfaction ps ON c.patient_id = ps.patient_id
            LEFT JOIN patient_score_metrics psm ON c.patient_id = psm.patient_id
            LEFT JOIN patient_score_alerts psa ON c.patient_id = psa.patient_id AND psa.statut = 'ACTIVE'
            WHERE c.statut_appel = 'APPELE'
            ORDER BY c.date_heure_reelle DESC NULLS LAST
            LIMIT 5
        `);
        
        console.log(`📋 ${patientsResult.rows.length} patients récents avec métriques de score:`);
        patientsResult.rows.forEach(patient => {
            const statut = patient.score_calcule <= 30 ? 'URGENCE' : 
                          patient.score_calcule <= 60 ? 'ATTENTION' : 'STABLE';
            console.log(`  - ${patient.prenom} ${patient.nom}: Score ${patient.score_calcule || 'N/A'}/100 (${statut})`);
        });
        
        // 4. Tester l'API des alertes
        console.log('\n🚨 Test 4: Test de l\'API des alertes...');
        
        const apiAlertsResult = await client.query(`
            SELECT 
                a.id as alerte_id,
                a.patient_id,
                a.score_calcule,
                a.niveau_urgence,
                a.raison_alerte,
                a.action_requise,
                a.date_creation,
                c.nom,
                c.prenom
            FROM patient_score_alerts a
            LEFT JOIN calls c ON a.patient_id = c.patient_id
            WHERE a.statut = 'ACTIVE' AND a.score_calcule <= 60
            ORDER BY 
                CASE a.niveau_urgence 
                    WHEN 'ELEVE' THEN 1 
                    WHEN 'MOYEN' THEN 2 
                    WHEN 'FAIBLE' THEN 3 
                END,
                a.date_creation DESC
            LIMIT 10
        `);
        
        console.log(`📋 ${apiAlertsResult.rows.length} alertes pour l'API:`);
        apiAlertsResult.rows.forEach(alert => {
            console.log(`  - ${alert.prenom} ${alert.nom}: Score ${alert.score_calcule}/100 (${alert.niveau_urgence})`);
        });
        
        console.log('\n✅ Tests terminés avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors des tests:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Exécution du script
if (require.main === module) {
    testNewScoreSystem()
        .then(() => {
            console.log('🎉 Tests terminés avec succès !');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Erreur fatale:', error);
            process.exit(1);
        });
}

module.exports = { testNewScoreSystem }; 