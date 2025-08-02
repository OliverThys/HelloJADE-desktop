const { performManualSync } = require('./routes/monitoring');
const PerformanceOptimizer = require('./performance-optimization');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

class SyncService {
    constructor() {
        this.isRunning = false;
        this.lastSyncTime = null;
        this.syncInterval = null;
        this.syncIntervalMinutes = parseInt(process.env.SYNC_INTERVAL_MINUTES) || 10;
        this.logs = [];
    }

    // Démarrer le service de synchronisation
    async start() {
        if (this.isRunning) {
            console.log('⚠️ Service de synchronisation déjà en cours...');
            return;
        }

        console.log(`🚀 Démarrage du service de synchronisation automatique (intervalle: ${this.syncIntervalMinutes} minutes)`);
        
        // Optimisation des tables au démarrage
        try {
            console.log('🔧 Optimisation des tables PostgreSQL...');
            const optimizer = new PerformanceOptimizer();
            await optimizer.optimizeTables();
            console.log('✅ Tables optimisées');
        } catch (error) {
            console.warn('⚠️ Erreur lors de l\'optimisation des tables:', error.message);
        }
        
        this.isRunning = true;
        
        // Première synchronisation immédiate
        this.performSync();
        
        // Synchronisation périodique
        this.syncInterval = setInterval(() => {
            this.performSync();
        }, this.syncIntervalMinutes * 60 * 1000);
        
        console.log(`✅ Service de synchronisation démarré - Prochaine sync dans ${this.syncIntervalMinutes} minutes`);
    }

    // Arrêter le service de synchronisation
    stop() {
        if (!this.isRunning) {
            console.log('⚠️ Service de synchronisation déjà arrêté...');
            return;
        }

        console.log('🛑 Arrêt du service de synchronisation...');
        
        this.isRunning = false;
        
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        
        console.log('✅ Service de synchronisation arrêté');
    }

    // Effectuer une synchronisation
    async performSync() {
        if (!this.isRunning) {
            return;
        }

        const startTime = Date.now();
        console.log(`🔄 Début de la synchronisation automatique - ${new Date().toLocaleString('fr-FR')}`);
        
        try {
            const result = await performManualSync();
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            this.lastSyncTime = new Date();
            
            // Log du résultat
            const logEntry = {
                timestamp: this.lastSyncTime.toISOString(),
                success: result.success,
                duration: duration,
                message: result.message,
                results: result.results
            };
            
            this.logs.push(logEntry);
            
            // Garder seulement les 100 derniers logs
            if (this.logs.length > 100) {
                this.logs = this.logs.slice(-100);
            }
            
            if (result.success) {
                console.log(`✅ Synchronisation réussie en ${duration}ms - ${result.message}`);
                
                // Log des résultats par table
                if (result.results) {
                    Object.entries(result.results).forEach(([table, tableResult]) => {
                        if (tableResult.success) {
                            console.log(`   📊 ${table}: ${tableResult.recordsCount} enregistrements`);
                        } else {
                            console.log(`   ❌ ${table}: ${tableResult.message}`);
                        }
                    });
                }
            } else {
                console.error(`❌ Synchronisation échouée en ${duration}ms - ${result.message}`);
            }
            
        } catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.error(`❌ Erreur lors de la synchronisation (${duration}ms):`, error.message);
            
            // Log de l'erreur
            const logEntry = {
                timestamp: new Date().toISOString(),
                success: false,
                duration: duration,
                message: `Erreur: ${error.message}`,
                results: {}
            };
            
            this.logs.push(logEntry);
        }
    }

    // Obtenir le statut du service
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastSyncTime: this.lastSyncTime,
            syncIntervalMinutes: this.syncIntervalMinutes,
            nextSyncTime: this.isRunning && this.lastSyncTime 
                ? new Date(this.lastSyncTime.getTime() + this.syncIntervalMinutes * 60 * 1000)
                : null,
            logs: this.logs.slice(-10) // 10 derniers logs
        };
    }

    // Forcer une synchronisation immédiate
    async forceSync() {
        console.log('🔄 Synchronisation forcée demandée...');
        await this.performSync();
    }

    // Modifier l'intervalle de synchronisation
    setInterval(minutes) {
        if (minutes < 1 || minutes > 60) {
            throw new Error('Intervalle doit être entre 1 et 60 minutes');
        }
        
        this.syncIntervalMinutes = minutes;
        
        if (this.isRunning) {
            // Redémarrer avec le nouvel intervalle
            this.stop();
            this.start();
        }
        
        console.log(`⚙️ Intervalle de synchronisation modifié à ${minutes} minutes`);
    }
}

// Instance globale du service
const syncService = new SyncService();

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du service de synchronisation...');
    syncService.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Arrêt du service de synchronisation...');
    syncService.stop();
    process.exit(0);
});

// Export pour utilisation dans d'autres modules
module.exports = syncService;

// Démarrage automatique si le script est exécuté directement
if (require.main === module) {
    console.log('🚀 Démarrage du service de synchronisation autonome...');
    syncService.start();
    
    // Garder le processus en vie
    process.stdin.resume();
} 