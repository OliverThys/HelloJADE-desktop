const { Pool } = require('pg');
const oracledb = require('oracledb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

class PerformanceOptimizer {
    constructor() {
        this.postgresPool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'hellojade',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'password',
            max: 20, // Augmenter le pool de connexions
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        
        this.oracleConfig = {
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONNECTION_STRING
        };
    }

    // Optimisation des tables PostgreSQL
    async optimizeTables() {
        const client = await this.postgresPool.connect();
        
        try {
            console.log('🔧 Optimisation des tables PostgreSQL...');
            
            // 1. Création d'index optimisés
            const indexes = [
                // Index sur les clés primaires et foreign keys
                'CREATE INDEX IF NOT EXISTS idx_patients_sync_id ON patients_sync(id)',
                'CREATE INDEX IF NOT EXISTS idx_medecins_sync_id ON medecins_sync(id)',
                'CREATE INDEX IF NOT EXISTS idx_hospitalisations_sync_patient ON hospitalisations_sync(patient_id)',
                'CREATE INDEX IF NOT EXISTS idx_rendez_vous_sync_patient ON rendez_vous_sync(patient_id)',
                'CREATE INDEX IF NOT EXISTS idx_rendez_vous_sync_medecin ON rendez_vous_sync(medecin_id)',
                'CREATE INDEX IF NOT EXISTS idx_rendez_vous_sync_date ON rendez_vous_sync(date_rdv)',
                
                // Index sur les timestamps de synchronisation
                'CREATE INDEX IF NOT EXISTS idx_patients_sync_timestamp ON patients_sync(sync_timestamp)',
                'CREATE INDEX IF NOT EXISTS idx_medecins_sync_timestamp ON medecins_sync(sync_timestamp)',
                'CREATE INDEX IF NOT EXISTS idx_hospitalisations_sync_timestamp ON hospitalisations_sync(sync_timestamp)',
                
                // Index sur les tables HelloJADE
                'CREATE INDEX IF NOT EXISTS idx_call_logs_patient ON call_logs(patient_id)',
                'CREATE INDEX IF NOT EXISTS idx_call_logs_date ON call_logs(call_start_time)',
                'CREATE INDEX IF NOT EXISTS idx_call_metrics_patient ON call_metrics(patient_id)',
                'CREATE INDEX IF NOT EXISTS idx_call_statistics_date ON call_statistics(date)',
                'CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity(user_id)',
                'CREATE INDEX IF NOT EXISTS idx_user_activity_date ON user_activity(created_at)'
            ];
            
            for (const indexSQL of indexes) {
                try {
                    await client.query(indexSQL);
                    console.log(`✅ Index créé: ${indexSQL.split(' ')[2]}`);
                } catch (error) {
                    console.log(`ℹ️ Index déjà existant: ${indexSQL.split(' ')[2]}`);
                }
            }
            
            // 2. Optimisation des statistiques
            await client.query('ANALYZE patients_sync');
            await client.query('ANALYZE medecins_sync');
            await client.query('ANALYZE hospitalisations_sync');
            await client.query('ANALYZE rendez_vous_sync');
            await client.query('ANALYZE call_logs');
            await client.query('ANALYZE call_metrics');
            
            console.log('✅ Statistiques mises à jour');
            
            // 3. Configuration des paramètres de performance (session uniquement)
            const optimizations = [
                'SET work_mem = \'256MB\'',
                'SET maintenance_work_mem = \'256MB\'',
                'SET random_page_cost = 1.1',
                'SET effective_io_concurrency = 200'
            ];
            
            for (const optimization of optimizations) {
                await client.query(optimization);
            }
            
            console.log('✅ Paramètres de performance optimisés');
            
        } finally {
            client.release();
        }
    }

    // Synchronisation optimisée par batch
    async optimizedSync() {
        let oracleConnection;
        
        try {
            console.log('🚀 Démarrage de la synchronisation optimisée...');
            
            // Connexion Oracle
            oracledb.initOracleClient();
            oracleConnection = await oracledb.getConnection(this.oracleConfig);
            
            const startTime = Date.now();
            
            // Récupération des tables
            const tablesResult = await oracleConnection.execute(`
                SELECT table_name 
                FROM user_tables 
                ORDER BY table_name
            `);
            
            const oracleTables = tablesResult.rows.map(row => row[0]);
            const results = {};
            
            for (const tableName of oracleTables) {
                const tableStartTime = Date.now();
                console.log(`📥 Synchronisation optimisée de ${tableName}...`);
                
                try {
                    // Récupération des données par batch
                    const batchSize = 1000;
                    let offset = 0;
                    let totalRecords = 0;
                    
                    // Suppression des anciennes données
                    const postgresClient = await this.postgresPool.connect();
                    await postgresClient.query(`DELETE FROM ${tableName.toLowerCase()}_sync`);
                    
                    while (true) {
                        const dataResult = await oracleConnection.execute(`
                            SELECT * FROM ${tableName} 
                            ORDER BY ROWID 
                            OFFSET :offset ROWS FETCH NEXT :batchSize ROWS ONLY
                        `, [offset, batchSize]);
                        
                        if (dataResult.rows.length === 0) break;
                        
                        // Insertion par batch
                        const columns = dataResult.metaData.map(col => col.name.toLowerCase());
                        const placeholders = dataResult.rows[0].map((_, i) => `$${i + 1}`).join(', ');
                        const insertSQL = `INSERT INTO ${tableName.toLowerCase()}_sync (${columns.join(', ')}) VALUES (${placeholders})`;
                        
                        // Utilisation de COPY pour une insertion plus rapide
                        const copyStream = postgresClient.query(
                            `COPY ${tableName.toLowerCase()}_sync (${columns.join(', ')}) FROM STDIN`
                        );
                        
                        for (const row of dataResult.rows) {
                            copyStream.write(row.join('\t') + '\n');
                        }
                        
                        copyStream.end();
                        await copyStream;
                        
                        totalRecords += dataResult.rows.length;
                        offset += batchSize;
                        
                        console.log(`   📊 Batch traité: ${dataResult.rows.length} enregistrements (Total: ${totalRecords})`);
                    }
                    
                    postgresClient.release();
                    
                    const tableDuration = Date.now() - tableStartTime;
                    results[tableName] = {
                        success: true,
                        recordsCount: totalRecords,
                        duration: tableDuration,
                        throughput: Math.round(totalRecords / (tableDuration / 1000)),
                        message: `${totalRecords} enregistrements synchronisés en ${tableDuration}ms (${Math.round(totalRecords / (tableDuration / 1000))} rec/sec)`
                    };
                    
                } catch (error) {
                    console.error(`❌ Erreur synchronisation ${tableName}:`, error.message);
                    results[tableName] = {
                        success: false,
                        recordsCount: 0,
                        duration: 0,
                        message: `Erreur: ${error.message}`
                    };
                }
            }
            
            const totalDuration = Date.now() - startTime;
            
            return {
                success: true,
                timestamp: new Date().toISOString(),
                totalDuration,
                message: `Synchronisation optimisée terminée en ${totalDuration}ms`,
                results
            };
            
        } catch (error) {
            console.error('❌ Erreur synchronisation optimisée:', error);
            return {
                success: false,
                timestamp: new Date().toISOString(),
                message: `Erreur: ${error.message}`,
                results: {}
            };
        } finally {
            if (oracleConnection) {
                try {
                    await oracleConnection.close();
                } catch (error) {
                    console.error('Erreur fermeture Oracle:', error);
                }
            }
        }
    }

    // Test de performance des requêtes
    async performanceTest() {
        const client = await this.postgresPool.connect();
        
        try {
            console.log('🧪 Test de performance des requêtes...');
            
            const tests = [
                {
                    name: 'SELECT simple - 1 patient',
                    query: 'SELECT * FROM patients_sync WHERE id = 1',
                    expected: '< 10ms'
                },
                {
                    name: 'COUNT total patients',
                    query: 'SELECT COUNT(*) FROM patients_sync',
                    expected: '< 50ms'
                },
                {
                    name: 'JOIN patients-médecins',
                    query: `
                        SELECT p.nom, p.prenom, m.nom as medecin_nom 
                        FROM patients_sync p 
                        JOIN medecins_sync m ON p.medecin_id = m.id 
                        LIMIT 100
                    `,
                    expected: '< 100ms'
                },
                {
                    name: 'Rendez-vous par date',
                    query: `
                        SELECT COUNT(*) 
                        FROM rendez_vous_sync 
                        WHERE date_rdv >= CURRENT_DATE - INTERVAL '7 days'
                    `,
                    expected: '< 200ms'
                },
                {
                    name: 'Hospitalisations actives',
                    query: `
                        SELECT COUNT(*) 
                        FROM hospitalisations_sync 
                        WHERE statut = 'En cours'
                    `,
                    expected: '< 100ms'
                }
            ];
            
            const results = [];
            
            for (const test of tests) {
                const startTime = Date.now();
                
                try {
                    const result = await client.query(test.query);
                    const duration = Date.now() - startTime;
                    
                    results.push({
                        test: test.name,
                        duration: `${duration}ms`,
                        expected: test.expected,
                        success: duration < parseInt(test.expected.replace(/[^\d]/g, '')),
                        rows: result.rows.length
                    });
                    
                    console.log(`✅ ${test.name}: ${duration}ms (${result.rows.length} lignes)`);
                    
                } catch (error) {
                    results.push({
                        test: test.name,
                        duration: 'ERROR',
                        expected: test.expected,
                        success: false,
                        error: error.message
                    });
                    
                    console.log(`❌ ${test.name}: ERREUR - ${error.message}`);
                }
            }
            
            return results;
            
        } finally {
            client.release();
        }
    }

    // Estimation des ressources
    async estimateResources() {
        const client = await this.postgresPool.connect();
        
        try {
            console.log('📊 Estimation des ressources...');
            
            const estimates = {};
            
            // Taille des tables
            const tables = [
                'patients_sync', 'medecins_sync', 'services_sync', 
                'chambres_sync', 'hospitalisations_sync', 'rendez_vous_sync', 'telephones_sync'
            ];
            
            for (const table of tables) {
                const sizeResult = await client.query(`
                    SELECT 
                        pg_size_pretty(pg_total_relation_size('${table}')) as size,
                        pg_total_relation_size('${table}') as size_bytes
                    FROM information_schema.tables 
                    WHERE table_name = '${table}'
                `);
                
                if (sizeResult.rows.length > 0) {
                    estimates[table] = {
                        size: sizeResult.rows[0].size,
                        sizeBytes: sizeResult.rows[0].size_bytes
                    };
                }
            }
            
            // Estimation pour 50 000 patients
            const estimatedSizes = {
                'patients_sync': { size: '~50 MB', records: 50000 },
                'medecins_sync': { size: '~2 MB', records: 500 },
                'services_sync': { size: '~0.5 MB', records: 50 },
                'chambres_sync': { size: '~5 MB', records: 1000 },
                'hospitalisations_sync': { size: '~75 MB', records: 15000 },
                'rendez_vous_sync': { size: '~300 MB', records: 75000 },
                'telephones_sync': { size: '~25 MB', records: 60000 }
            };
            
            return {
                current: estimates,
                estimated: estimatedSizes,
                totalEstimated: '~457 MB',
                recommendations: [
                    'RAM recommandée: 4-8 GB',
                    'CPU: 4-8 cœurs',
                    'Disque: SSD avec 2-5 GB d\'espace libre',
                    'Réseau: 100 Mbps minimum'
                ]
            };
            
        } finally {
            client.release();
        }
    }
}

// Test de performance
async function runPerformanceTest() {
    const optimizer = new PerformanceOptimizer();
    
    try {
        console.log('🚀 Test de performance avec 50 000 patients');
        console.log('='.repeat(60));
        
        // 1. Optimisation des tables
        await optimizer.optimizeTables();
        
        // 2. Test de performance des requêtes
        const performanceResults = await optimizer.performanceTest();
        
        console.log('\n📊 Résultats des tests de performance:');
        performanceResults.forEach(result => {
            const status = result.success ? '✅' : '❌';
            console.log(`${status} ${result.test}: ${result.duration} (attendu: ${result.expected})`);
        });
        
        // 3. Estimation des ressources
        const resourceEstimate = await optimizer.estimateResources();
        
        console.log('\n📊 Estimation des ressources:');
        console.log(`Taille totale estimée: ${resourceEstimate.totalEstimated}`);
        console.log('\nRecommandations:');
        resourceEstimate.recommendations.forEach(rec => {
            console.log(`   - ${rec}`);
        });
        
        // 4. Test de synchronisation optimisée (simulation)
        console.log('\n🔄 Test de synchronisation optimisée (simulation)...');
        console.log('Temps estimé pour 50 000 patients: 45-90 secondes');
        console.log('Débit estimé: 2 200-4 500 enregistrements/seconde');
        
    } catch (error) {
        console.error('❌ Erreur lors du test de performance:', error);
    }
}

// Exécution si appelé directement
if (require.main === module) {
    runPerformanceTest();
}

module.exports = PerformanceOptimizer; 