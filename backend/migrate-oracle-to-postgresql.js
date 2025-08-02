const oracledb = require('oracledb');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

// Configuration Oracle
const ORACLE_CONFIG = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTION_STRING
};

// Configuration PostgreSQL
const POSTGRES_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hellojade',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
};

// Mapping des types Oracle vers PostgreSQL
const TYPE_MAPPING = {
    'VARCHAR2': 'VARCHAR',
    'NVARCHAR2': 'VARCHAR',
    'CHAR': 'CHAR',
    'NCHAR': 'CHAR',
    'NUMBER': 'NUMERIC',
    'FLOAT': 'REAL',
    'DATE': 'TIMESTAMP',
    'TIMESTAMP': 'TIMESTAMP',
    'CLOB': 'TEXT',
    'BLOB': 'BYTEA',
    'LONG': 'TEXT',
    'RAW': 'BYTEA',
    'LONG RAW': 'BYTEA'
};

async function migrateOracleToPostgreSQL() {
    let oracleConnection, postgresPool;
    
    try {
        console.log('🚀 Début de la migration Oracle → PostgreSQL');
        console.log('='.repeat(60));
        
        // Initialisation Oracle
        console.log('🔍 Connexion à Oracle...');
        oracledb.initOracleClient();
        oracleConnection = await oracledb.getConnection(ORACLE_CONFIG);
        console.log('✅ Connexion Oracle établie');
        
        // Initialisation PostgreSQL
        console.log('🔍 Connexion à PostgreSQL...');
        postgresPool = new Pool(POSTGRES_CONFIG);
        const postgresClient = await postgresPool.connect();
        console.log('✅ Connexion PostgreSQL établie');
        
        // 1. Récupération de la structure des tables Oracle
        console.log('\n📊 Récupération de la structure des tables Oracle...');
        const tablesResult = await oracleConnection.execute(`
            SELECT table_name 
            FROM user_tables 
            ORDER BY table_name
        `);
        
        const oracleTables = tablesResult.rows.map(row => row[0]);
        console.log(`📋 Tables Oracle trouvées: ${oracleTables.join(', ')}`);
        
        // 2. Migration de chaque table
        for (const tableName of oracleTables) {
            console.log(`\n🔄 Migration de la table: ${tableName}`);
            
            // Récupération de la structure de la table
            const structureResult = await oracleConnection.execute(`
                SELECT 
                    column_name,
                    data_type,
                    data_length,
                    data_precision,
                    data_scale,
                    nullable,
                    column_id
                FROM user_tab_columns 
                WHERE table_name = :tableName
                ORDER BY column_id
            `, [tableName]);
            
            // Création de la table PostgreSQL
            const createTableSQL = generateCreateTableSQL(tableName, structureResult.rows);
            console.log(`📝 Création de la table PostgreSQL: ${tableName}_sync`);
            
            try {
                await postgresClient.query(`DROP TABLE IF EXISTS ${tableName.toLowerCase()}_sync CASCADE`);
                await postgresClient.query(createTableSQL);
                console.log(`✅ Table ${tableName}_sync créée`);
                
                // Migration des données
                console.log(`📥 Migration des données de ${tableName}...`);
                const dataResult = await oracleConnection.execute(`SELECT * FROM ${tableName}`);
                
                if (dataResult.rows.length > 0) {
                    const columns = dataResult.metaData.map(col => col.name.toLowerCase());
                    const placeholders = dataResult.rows[0].map((_, i) => `$${i + 1}`).join(', ');
                    const insertSQL = `INSERT INTO ${tableName.toLowerCase()}_sync (${columns.join(', ')}) VALUES (${placeholders})`;
                    
                    for (const row of dataResult.rows) {
                        await postgresClient.query(insertSQL, row);
                    }
                    console.log(`✅ ${dataResult.rows.length} enregistrements migrés`);
                } else {
                    console.log(`ℹ️ Aucune donnée à migrer pour ${tableName}`);
                }
                
            } catch (error) {
                console.error(`❌ Erreur lors de la migration de ${tableName}:`, error.message);
            }
        }
        
        // 3. Création des tables HelloJADE spécifiques
        console.log('\n🎯 Création des tables HelloJADE spécifiques...');
        await createHelloJADETables(postgresClient);
        
        // 4. Insertion de données simulées
        console.log('\n🎲 Insertion de données simulées...');
        await insertSimulatedData(postgresClient);
        
        postgresClient.release();
        
        console.log('\n🎉 Migration terminée avec succès !');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        throw error;
    } finally {
        if (oracleConnection) {
            try {
                await oracleConnection.close();
                console.log('🔒 Connexion Oracle fermée');
            } catch (error) {
                console.error('Erreur fermeture Oracle:', error);
            }
        }
        if (postgresPool) {
            await postgresPool.end();
            console.log('🔒 Connexion PostgreSQL fermée');
        }
    }
}

function generateCreateTableSQL(tableName, columns) {
    const columnDefinitions = columns.map(col => {
        const columnName = col[0].toLowerCase();
        const dataType = col[1];
        const dataLength = col[2];
        const dataPrecision = col[3];
        const dataScale = col[4];
        const nullable = col[5];
        
        let postgresType = TYPE_MAPPING[dataType] || 'VARCHAR';
        
        // Gestion des types spécifiques
        if (dataType === 'NUMBER') {
            if (dataScale && dataScale > 0) {
                postgresType = `NUMERIC(${dataPrecision || 10}, ${dataScale})`;
            } else if (dataPrecision) {
                postgresType = `NUMERIC(${dataPrecision})`;
            } else {
                postgresType = 'NUMERIC';
            }
        } else if (dataType === 'VARCHAR2' || dataType === 'NVARCHAR2') {
            postgresType = `VARCHAR(${dataLength || 255})`;
        } else if (dataType === 'CHAR' || dataType === 'NCHAR') {
            postgresType = `CHAR(${dataLength || 1})`;
        }
        
        const nullableConstraint = nullable === 'N' ? 'NOT NULL' : '';
        return `${columnName} ${postgresType} ${nullableConstraint}`.trim();
    });
    
    return `CREATE TABLE ${tableName.toLowerCase()}_sync (
        ${columnDefinitions.join(',\n        ')},
        sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sync_source VARCHAR(50) DEFAULT 'oracle'
    )`;
}

async function createHelloJADETables(client) {
    const tables = [
        // Table des logs d'appels
        `CREATE TABLE IF NOT EXISTS call_logs (
            id SERIAL PRIMARY KEY,
            patient_id INTEGER,
            medecin_id INTEGER,
            call_start_time TIMESTAMP,
            call_end_time TIMESTAMP,
            call_duration INTEGER, -- en secondes
            call_status VARCHAR(20), -- 'completed', 'missed', 'failed'
            phone_number VARCHAR(20),
            call_type VARCHAR(20), -- 'incoming', 'outgoing'
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Table des métriques d'appels
        `CREATE TABLE IF NOT EXISTS call_metrics (
            id SERIAL PRIMARY KEY,
            patient_id INTEGER,
            total_calls INTEGER DEFAULT 0,
            successful_calls INTEGER DEFAULT 0,
            failed_calls INTEGER DEFAULT 0,
            total_duration INTEGER DEFAULT 0, -- en secondes
            average_duration NUMERIC(5,2) DEFAULT 0,
            last_call_date TIMESTAMP,
            call_frequency VARCHAR(20), -- 'low', 'medium', 'high'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Table des statistiques d'appels
        `CREATE TABLE IF NOT EXISTS call_statistics (
            id SERIAL PRIMARY KEY,
            date DATE,
            total_calls INTEGER DEFAULT 0,
            successful_calls INTEGER DEFAULT 0,
            failed_calls INTEGER DEFAULT 0,
            average_duration NUMERIC(5,2) DEFAULT 0,
            peak_hour INTEGER, -- heure de pointe (0-23)
            most_active_service VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Table de l'activité utilisateur
        `CREATE TABLE IF NOT EXISTS user_activity (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(50),
            action_type VARCHAR(50), -- 'login', 'call_initiated', 'call_completed', 'data_viewed'
            action_details JSONB,
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Table des paramètres système
        `CREATE TABLE IF NOT EXISTS system_settings (
            id SERIAL PRIMARY KEY,
            setting_key VARCHAR(100) UNIQUE NOT NULL,
            setting_value TEXT,
            setting_type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
            description TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];
    
    for (const tableSQL of tables) {
        try {
            await client.query(tableSQL);
            console.log(`✅ Table HelloJADE créée`);
        } catch (error) {
            console.error(`❌ Erreur création table HelloJADE:`, error.message);
        }
    }
}

async function insertSimulatedData(client) {
    console.log('🎲 Insertion de données simulées...');
    
    // Données simulées pour call_logs
    const callLogsData = [
        [1, 1, '2024-01-15 09:30:00', '2024-01-15 09:45:00', 900, 'completed', '0123456789', 'outgoing', 'Appel de suivi'],
        [2, 3, '2024-01-15 10:15:00', '2024-01-15 10:20:00', 300, 'completed', '0987654321', 'incoming', 'Demande de rendez-vous'],
        [3, 2, '2024-01-15 11:00:00', null, 0, 'missed', '0555666777', 'outgoing', 'Appel non répondu'],
        [4, 5, '2024-01-15 14:30:00', '2024-01-15 14:42:00', 720, 'completed', '0123456789', 'outgoing', 'Résultats d\'analyses'],
        [5, 1, '2024-01-15 16:00:00', '2024-01-15 16:15:00', 900, 'completed', '0987654321', 'incoming', 'Question médicale']
    ];
    
    for (const callData of callLogsData) {
        await client.query(`
            INSERT INTO call_logs (patient_id, medecin_id, call_start_time, call_end_time, call_duration, call_status, phone_number, call_type, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, callData);
    }
    console.log(`✅ ${callLogsData.length} logs d'appels simulés insérés`);
    
    // Données simulées pour call_metrics
    const callMetricsData = [
        [1, 5, 4, 1, 2520, 504.0, '2024-01-15 16:00:00', 'medium'],
        [2, 3, 2, 1, 1200, 400.0, '2024-01-15 10:15:00', 'low'],
        [3, 8, 6, 2, 3600, 450.0, '2024-01-15 14:30:00', 'high'],
        [4, 2, 1, 1, 900, 900.0, '2024-01-15 09:30:00', 'low'],
        [5, 4, 3, 1, 1800, 600.0, '2024-01-15 11:00:00', 'medium']
    ];
    
    for (const metricData of callMetricsData) {
        await client.query(`
            INSERT INTO call_metrics (patient_id, total_calls, successful_calls, failed_calls, total_duration, average_duration, last_call_date, call_frequency)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, metricData);
    }
    console.log(`✅ ${callMetricsData.length} métriques d'appels simulées insérées`);
    
    // Données simulées pour call_statistics
    const callStatsData = [
        ['2024-01-15', 25, 20, 5, 420.5, 14, 'Cardiologie'],
        ['2024-01-14', 30, 25, 5, 380.2, 10, 'Pédiatrie'],
        ['2024-01-13', 22, 18, 4, 450.8, 16, 'Neurologie']
    ];
    
    for (const statData of callStatsData) {
        await client.query(`
            INSERT INTO call_statistics (date, total_calls, successful_calls, failed_calls, average_duration, peak_hour, most_active_service)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, statData);
    }
    console.log(`✅ ${callStatsData.length} statistiques d'appels simulées insérées`);
    
    // Données simulées pour system_settings
    const settingsData = [
        ['sync_interval_minutes', '15', 'number', 'Intervalle de synchronisation en minutes'],
        ['max_call_duration', '3600', 'number', 'Durée maximale d\'appel en secondes'],
        ['enable_call_logging', 'true', 'boolean', 'Activer la journalisation des appels'],
        ['notification_email', 'admin@hellojade.local', 'string', 'Email pour les notifications'],
        ['call_retry_attempts', '3', 'number', 'Nombre de tentatives de rappel']
    ];
    
    for (const settingData of settingsData) {
        await client.query(`
            INSERT INTO system_settings (setting_key, setting_value, setting_type, description)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (setting_key) DO UPDATE SET 
            setting_value = EXCLUDED.setting_value,
            updated_at = CURRENT_TIMESTAMP
        `, settingData);
    }
    console.log(`✅ ${settingsData.length} paramètres système insérés`);
}

// Exécution de la migration
if (require.main === module) {
    migrateOracleToPostgreSQL()
        .then(() => {
            console.log('\n🎉 Migration terminée avec succès !');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Migration échouée:', error);
            process.exit(1);
        });
}

module.exports = { migrateOracleToPostgreSQL }; 