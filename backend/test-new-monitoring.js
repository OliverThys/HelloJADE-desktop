const { checkHelloJADEDatabase, performManualSync } = require('./routes/monitoring');

async function testNewMonitoring() {
    try {
        console.log('🧪 Test de la nouvelle logique de monitoring PostgreSQL...');
        console.log('='.repeat(60));
        
        // Test 1: Vérification du statut PostgreSQL
        console.log('\n📊 Test 1: Vérification du statut PostgreSQL...');
        const statusResult = await checkHelloJADEDatabase();
        
        console.log('✅ Statut PostgreSQL:');
        console.log(`   - Status: ${statusResult.status}`);
        console.log(`   - Version: ${statusResult.version}`);
        console.log(`   - Message: ${statusResult.message}`);
        
        if (statusResult.syncStatus) {
            console.log('\n🔄 Statut de synchronisation:');
            console.log(`   - À jour: ${statusResult.syncStatus.isUpToDate}`);
            console.log(`   - Dernière sync: ${statusResult.syncStatus.lastSyncTime}`);
            console.log(`   - Âge: ${statusResult.syncStatus.syncAgeMinutes} minutes`);
            console.log(`   - Message: ${statusResult.syncStatus.message}`);
        }
        
        if (statusResult.hellojadeTables) {
            console.log('\n📋 Tables HelloJADE:');
            Object.entries(statusResult.hellojadeTables).forEach(([table, count]) => {
                console.log(`   - ${table}: ${count} enregistrements`);
            });
        }
        
        // Test 2: Synchronisation manuelle
        console.log('\n🔄 Test 2: Synchronisation manuelle...');
        const syncResult = await performManualSync();
        
        console.log('✅ Résultat synchronisation:');
        console.log(`   - Succès: ${syncResult.success}`);
        console.log(`   - Timestamp: ${syncResult.timestamp}`);
        console.log(`   - Message: ${syncResult.message}`);
        
        if (syncResult.results) {
            console.log('\n📊 Détails par table:');
            Object.entries(syncResult.results).forEach(([table, result]) => {
                console.log(`   - ${table}: ${result.success ? '✅' : '❌'} ${result.message}`);
            });
        }
        
        // Test 3: Vérification après synchronisation
        console.log('\n📊 Test 3: Vérification après synchronisation...');
        const statusAfterSync = await checkHelloJADEDatabase();
        
        console.log('✅ Statut après synchronisation:');
        console.log(`   - Status: ${statusAfterSync.status}`);
        console.log(`   - Message: ${statusAfterSync.message}`);
        
        if (statusAfterSync.syncStatus) {
            console.log(`   - À jour: ${statusAfterSync.syncStatus.isUpToDate}`);
            console.log(`   - Dernière sync: ${statusAfterSync.syncStatus.lastSyncTime}`);
        }
        
        console.log('\n🎉 Tests terminés avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors des tests:', error);
    }
}

// Exécution des tests
testNewMonitoring(); 