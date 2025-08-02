const syncService = require('./sync-service');
const { checkHelloJADEDatabase } = require('./routes/monitoring');

async function testCompleteSystem() {
    try {
        console.log('🧪 Test du système complet de synchronisation...');
        console.log('='.repeat(60));
        
        // Test 1: Statut initial du service
        console.log('\n📊 Test 1: Statut initial du service de synchronisation...');
        const initialStatus = syncService.getStatus();
        console.log('✅ Statut initial:');
        console.log(`   - En cours: ${initialStatus.isRunning}`);
        console.log(`   - Dernière sync: ${initialStatus.lastSyncTime || 'Aucune'}`);
        console.log(`   - Intervalle: ${initialStatus.syncIntervalMinutes} minutes`);
        
        // Test 2: Démarrage du service
        console.log('\n🚀 Test 2: Démarrage du service de synchronisation...');
        syncService.start();
        
        const statusAfterStart = syncService.getStatus();
        console.log('✅ Statut après démarrage:');
        console.log(`   - En cours: ${statusAfterStart.isRunning}`);
        console.log(`   - Dernière sync: ${statusAfterStart.lastSyncTime || 'Aucune'}`);
        console.log(`   - Prochaine sync: ${statusAfterStart.nextSyncTime || 'Non définie'}`);
        
        // Test 3: Vérification PostgreSQL après démarrage
        console.log('\n📊 Test 3: Vérification PostgreSQL après démarrage...');
        const postgresStatus = await checkHelloJADEDatabase();
        
        console.log('✅ Statut PostgreSQL:');
        console.log(`   - Status: ${postgresStatus.status}`);
        console.log(`   - Message: ${postgresStatus.message}`);
        
        if (postgresStatus.syncStatus) {
            console.log(`   - À jour: ${postgresStatus.syncStatus.isUpToDate}`);
            console.log(`   - Dernière sync: ${postgresStatus.syncStatus.lastSyncTime}`);
            console.log(`   - Âge: ${postgresStatus.syncStatus.syncAgeMinutes} minutes`);
        }
        
        // Test 4: Synchronisation forcée
        console.log('\n🔄 Test 4: Synchronisation forcée...');
        await syncService.forceSync();
        
        const statusAfterForce = syncService.getStatus();
        console.log('✅ Statut après synchronisation forcée:');
        console.log(`   - Dernière sync: ${statusAfterForce.lastSyncTime}`);
        console.log(`   - Prochaine sync: ${statusAfterForce.nextSyncTime}`);
        
        // Test 5: Vérification PostgreSQL après synchronisation forcée
        console.log('\n📊 Test 5: Vérification PostgreSQL après synchronisation forcée...');
        const postgresStatusAfter = await checkHelloJADEDatabase();
        
        console.log('✅ Statut PostgreSQL après sync:');
        console.log(`   - Status: ${postgresStatusAfter.status}`);
        console.log(`   - Message: ${postgresStatusAfter.message}`);
        
        if (postgresStatusAfter.syncStatus) {
            console.log(`   - À jour: ${postgresStatusAfter.syncStatus.isUpToDate}`);
            console.log(`   - Dernière sync: ${postgresStatusAfter.syncStatus.lastSyncTime}`);
        }
        
        // Test 6: Modification de l'intervalle
        console.log('\n⚙️ Test 6: Modification de l\'intervalle à 5 minutes...');
        syncService.setInterval(5);
        
        const statusAfterInterval = syncService.getStatus();
        console.log('✅ Statut après modification intervalle:');
        console.log(`   - Nouvel intervalle: ${statusAfterInterval.syncIntervalMinutes} minutes`);
        console.log(`   - Prochaine sync: ${statusAfterInterval.nextSyncTime}`);
        
        // Test 7: Logs de synchronisation
        console.log('\n📋 Test 7: Logs de synchronisation...');
        const logs = syncService.getStatus().logs;
        
        if (logs.length > 0) {
            console.log(`✅ ${logs.length} logs disponibles:`);
            logs.forEach((log, index) => {
                console.log(`   ${index + 1}. ${log.timestamp} - ${log.success ? '✅' : '❌'} ${log.message} (${log.duration}ms)`);
            });
        } else {
            console.log('ℹ️ Aucun log disponible');
        }
        
        // Test 8: Arrêt du service
        console.log('\n🛑 Test 8: Arrêt du service...');
        syncService.stop();
        
        const finalStatus = syncService.getStatus();
        console.log('✅ Statut final:');
        console.log(`   - En cours: ${finalStatus.isRunning}`);
        console.log(`   - Dernière sync: ${finalStatus.lastSyncTime}`);
        
        console.log('\n🎉 Tests du système complet terminés avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors des tests:', error);
    }
}

// Exécution des tests
testCompleteSystem(); 