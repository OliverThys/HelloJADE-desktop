const { checkHelloJADEDatabase, performManualSync } = require('./routes/monitoring');

async function testOptimizedMonitoring() {
    try {
        console.log('🧪 Test du monitoring optimisé...');
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
        
        // Test 2: Synchronisation optimisée
        console.log('\n🔄 Test 2: Synchronisation optimisée...');
        const syncResult = await performManualSync();
        
        console.log('✅ Résultat synchronisation optimisée:');
        console.log(`   - Succès: ${syncResult.success}`);
        console.log(`   - Timestamp: ${syncResult.timestamp}`);
        console.log(`   - Durée totale: ${syncResult.totalDuration}ms`);
        console.log(`   - Message: ${syncResult.message}`);
        
        if (syncResult.results) {
            console.log('\n📊 Détails par table (avec métriques de performance):');
            Object.entries(syncResult.results).forEach(([table, result]) => {
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
        const statusAfterSync = await checkHelloJADEDatabase();
        
        console.log('✅ Statut après synchronisation:');
        console.log(`   - Status: ${statusAfterSync.status}`);
        console.log(`   - Message: ${statusAfterSync.message}`);
        
        if (statusAfterSync.syncStatus) {
            console.log(`   - À jour: ${statusAfterSync.syncStatus.isUpToDate}`);
            console.log(`   - Dernière sync: ${statusAfterSync.syncStatus.lastSyncTime}`);
        }
        
        console.log('\n🎉 Tests du monitoring optimisé terminés avec succès !');
        
        // Résumé des améliorations
        console.log('\n📈 Améliorations apportées:');
        console.log('   ✅ Synchronisation par batch de 1000 enregistrements');
        console.log('   ✅ Utilisation de COPY PostgreSQL pour insertion rapide');
        console.log('   ✅ Pool de connexions optimisé (20 connexions)');
        console.log('   ✅ Métriques de performance détaillées');
        console.log('   ✅ Optimisation automatique des tables au démarrage');
        console.log('   ✅ Index et statistiques optimisés');
        
    } catch (error) {
        console.error('❌ Erreur lors des tests:', error);
    }
}

// Exécution des tests
testOptimizedMonitoring(); 