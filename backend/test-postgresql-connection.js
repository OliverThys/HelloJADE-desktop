const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

async function testPostgreSQLConnection() {
    let pool;
    
    try {
        console.log('🔍 Test de connexion à PostgreSQL...');
        console.log('📋 Configuration:');
        console.log(`   - Host: ${process.env.DB_HOST}`);
        console.log(`   - Port: ${process.env.DB_PORT}`);
        console.log(`   - Database: ${process.env.DB_NAME}`);
        console.log(`   - User: ${process.env.DB_USER}`);
        
        // Configuration PostgreSQL
        const postgresConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'hellojade',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'password'
        };
        
        pool = new Pool(postgresConfig);
        
        // Test de connexion
        const client = await pool.connect();
        console.log('✅ Connexion PostgreSQL réussie !');
        
        // Vérification de la version
        const versionResult = await client.query('SELECT version()');
        console.log(`📊 Version PostgreSQL: ${versionResult.rows[0].version.split(' ')[0]}`);
        
        // Récupération de la liste des tables
        console.log('\n📊 Récupération de la liste des tables...');
        
        const tablesResult = await client.query(`
            SELECT 
                table_name,
                table_type,
                table_schema
            FROM information_schema.tables 
            WHERE table_schema IN ('public', 'hellojade')
            ORDER BY table_schema, table_name
        `);
        
        console.log(`\n📋 ${tablesResult.rows.length} tables trouvées dans la base ${process.env.DB_NAME}:`);
        console.log('='.repeat(80));
        console.log('SCHEMA'.padEnd(15) + 'TABLE_NAME'.padEnd(30) + 'TYPE');
        console.log('='.repeat(80));
        
        tablesResult.rows.forEach(row => {
            const { table_schema, table_name, table_type } = row;
            console.log(
                (table_schema || 'N/A').padEnd(15) + 
                (table_name || 'N/A').padEnd(30) + 
                (table_type || 'N/A')
            );
        });
        
        // Vérification des schémas disponibles
        console.log('\n📁 Récupération des schémas...');
        
        const schemasResult = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
            ORDER BY schema_name
        `);
        
        if (schemasResult.rows.length > 0) {
            console.log(`\n📁 Schémas disponibles:`);
            schemasResult.rows.forEach(row => {
                console.log(`   - ${row.schema_name}`);
            });
        } else {
            console.log('\n📁 Aucun schéma personnalisé trouvé.');
        }
        
        // Test de création d'une table de test si aucune table n'existe
        if (tablesResult.rows.length === 0) {
            console.log('\n🔧 Aucune table trouvée. Test de création d\'une table de test...');
            
            try {
                await client.query(`
                    CREATE TABLE IF NOT EXISTS test_connection (
                        id SERIAL PRIMARY KEY,
                        message VARCHAR(100),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
                await client.query(`
                    INSERT INTO test_connection (message) VALUES ('Test de connexion HelloJADE')
                `);
                
                const testResult = await client.query('SELECT * FROM test_connection');
                console.log('✅ Table de test créée et accessible !');
                console.log(`   - Enregistrement: ${testResult.rows[0].message}`);
                
                // Nettoyage
                await client.query('DROP TABLE test_connection');
                console.log('🧹 Table de test supprimée.');
                
            } catch (error) {
                console.log(`❌ Erreur lors du test de création: ${error.message}`);
            }
        }
        
        // Vérification des privilèges
        console.log('\n🔐 Vérification des privilèges...');
        
        const privilegesResult = await client.query(`
            SELECT 
                table_name,
                privilege_type
            FROM information_schema.table_privileges 
            WHERE grantee = current_user
            AND table_schema = 'public'
            ORDER BY table_name, privilege_type
        `);
        
        if (privilegesResult.rows.length > 0) {
            console.log(`\n🔐 Privilèges sur les tables:`);
            privilegesResult.rows.forEach(row => {
                console.log(`   - ${row.table_name}: ${row.privilege_type}`);
            });
        } else {
            console.log('\n🔐 Aucun privilège spécifique trouvé (droits par défaut).');
        }
        
        client.release();
        
    } catch (error) {
        console.error('❌ Erreur de connexion PostgreSQL:', error.message);
        console.error('Détails:', error);
        
        // Suggestions de résolution
        console.log('\n💡 Suggestions de résolution:');
        console.log('   1. Vérifiez que PostgreSQL est installé et démarré');
        console.log('   2. Vérifiez les paramètres de connexion dans config.env');
        console.log('   3. Vérifiez que la base de données "hellojade" existe');
        console.log('   4. Vérifiez les permissions de l\'utilisateur postgres');
        
    } finally {
        if (pool) {
            await pool.end();
            console.log('\n🔒 Connexion PostgreSQL fermée.');
        }
    }
}

// Exécution du test
testPostgreSQLConnection(); 