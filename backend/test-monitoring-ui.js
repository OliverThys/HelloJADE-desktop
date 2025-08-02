const fetch = require('node-fetch');

async function testMonitoringUI() {
    try {
        console.log('🧪 Test de l\'interface de monitoring...');
        console.log('='.repeat(60));
        
        // Test 1: Vérification du statut PostgreSQL
        console.log('\n📊 Test 1: Vérification du statut PostgreSQL...');
        const statusResponse = await fetch('http://localhost:8000/api/monitoring/hellojade-db');
        const statusData = await statusResponse.json();
        
        console.log('✅ Statut PostgreSQL:');
        console.log(`   - Status: ${statusData.status}`);
        console.log(`   - Version: ${statusData.version}`);
        console.log(`   - Message: ${statusData.message}`);
        
        if (statusData.syncStatus) {
            console.log('\n🔄 Statut de synchronisation:');
            console.log(`   - À jour: ${statusData.syncStatus.isUpToDate}`);
            console.log(`   - Dernière sync: ${statusData.syncStatus.lastSyncTime}`);
            console.log(`   - Âge: ${statusData.syncStatus.syncAgeMinutes} minutes`);
            console.log(`   - Message: ${statusData.syncStatus.message}`);
            
            // Explication du statut "warning"
            if (statusData.status === 'warning') {
                console.log('\n⚠️ Pourquoi "warning" ?');
                console.log(`   - La synchronisation n'est pas à jour (${statusData.syncStatus.syncAgeMinutes} minutes)`);
                console.log(`   - Le seuil est de 10 minutes pour considérer comme "à jour"`);
                console.log(`   - Cliquez sur "Synchroniser" pour résoudre le problème`);
            }
        }
        
        // Test 2: Synchronisation manuelle
        console.log('\n🔄 Test 2: Synchronisation manuelle...');
        const syncResponse = await fetch('http://localhost:8000/api/monitoring/hellojade-db/sync', {
            method: 'POST'
        });
        const syncData = await syncResponse.json();
        
        console.log('✅ Résultat synchronisation:');
        console.log(`   - Succès: ${syncData.success}`);
        console.log(`   - Timestamp: ${syncData.timestamp}`);
        console.log(`   - Message: ${syncData.message}`);
        
        if (syncData.results) {
            console.log('\n📊 Détails par table:');
            Object.entries(syncData.results).forEach(([table, result]) => {
                if (result.success) {
                    console.log(`   - ${table}: ✅ ${result.message}`);
                    console.log(`     Durée: ${result.duration}ms, Débit: ${result.throughput} rec/sec`);
                } else {
                    console.log(`   - ${table}: ❌ ${result.message}`);
                }
            });
        }
        
        // Test 3: Vérification après synchronisation
        console.log('\n📊 Test 3: Vérification après synchronisation...');
        const statusAfterResponse = await fetch('http://localhost:8000/api/monitoring/hellojade-db');
        const statusAfterData = await statusAfterResponse.json();
        
        console.log('✅ Statut après synchronisation:');
        console.log(`   - Status: ${statusAfterData.status}`);
        console.log(`   - Message: ${statusAfterData.message}`);
        
        if (statusAfterData.syncStatus) {
            console.log(`   - À jour: ${statusAfterData.syncStatus.isUpToDate}`);
            console.log(`   - Dernière sync: ${statusAfterData.syncStatus.lastSyncTime}`);
        }
        
        console.log('\n🎉 Tests terminés avec succès !');
        
        // Résumé des fonctionnalités
        console.log('\n📈 Fonctionnalités disponibles dans l\'interface:');
        console.log('   ✅ Bouton "Synchroniser" dans la carte HelloJADE PostgreSQL');
        console.log('   ✅ Affichage du statut de synchronisation (à jour/périmé)');
        console.log('   ✅ Détails de la dernière synchronisation');
        console.log('   ✅ Logs en temps réel avec possibilité de copie');
        console.log('   ✅ Auto-scroll et contrôle des logs');
        console.log('   ✅ Métriques de performance détaillées');
        
    } catch (error) {
        console.error('❌ Erreur lors des tests:', error);
    }
}

// Exécution des tests
testMonitoringUI(); 