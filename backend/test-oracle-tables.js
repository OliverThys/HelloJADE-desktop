const oracledb = require('oracledb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

async function testOracleConnection() {
    let connection;
    
    try {
        console.log('🔍 Test de connexion à Oracle...');
        console.log('📋 Configuration:');
        console.log(`   - Utilisateur: ${process.env.ORACLE_USER}`);
        console.log(`   - Connexion: ${process.env.ORACLE_CONNECTION_STRING}`);
        console.log(`   - Service: XEPDB1`);
        
        // Configuration Oracle
        oracledb.initOracleClient();
        
        // Connexion à la base de données
        connection = await oracledb.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONNECTION_STRING
        });
        
        console.log('✅ Connexion Oracle réussie !');
        
        // Récupération de la liste des tables
        console.log('\n📊 Récupération de la liste des tables...');
        
        const result = await connection.execute(`
            SELECT table_name, tablespace_name, num_rows, last_analyzed
            FROM user_tables 
            ORDER BY table_name
        `);
        
        console.log(`\n📋 ${result.rows.length} tables trouvées dans le schéma ${process.env.ORACLE_USER}:`);
        console.log('='.repeat(80));
        console.log('TABLE_NAME'.padEnd(30) + 'TABLESPACE'.padEnd(15) + 'ROWS'.padEnd(10) + 'LAST_ANALYZED');
        console.log('='.repeat(80));
        
        result.rows.forEach(row => {
            const [tableName, tablespace, numRows, lastAnalyzed] = row;
            console.log(
                (tableName || 'N/A').padEnd(30) + 
                (tablespace || 'N/A').padEnd(15) + 
                (numRows || 'N/A').toString().padEnd(10) + 
                (lastAnalyzed ? lastAnalyzed.toISOString().split('T')[0] : 'N/A')
            );
        });
        
        // Récupération des vues également
        console.log('\n👁️  Récupération de la liste des vues...');
        
        const viewsResult = await connection.execute(`
            SELECT view_name, text
            FROM user_views 
            ORDER BY view_name
        `);
        
        if (viewsResult.rows.length > 0) {
            console.log(`\n👁️  ${viewsResult.rows.length} vues trouvées:`);
            console.log('-'.repeat(50));
            viewsResult.rows.forEach(row => {
                const [viewName, viewText] = row;
                console.log(`📋 ${viewName}`);
                console.log(`   SQL: ${viewText.substring(0, 100)}${viewText.length > 100 ? '...' : ''}`);
            });
        } else {
            console.log('\n👁️  Aucune vue trouvée.');
        }
        
        // Test de requête sur quelques tables pour vérifier l'accès
        console.log('\n🔍 Test d\'accès aux données...');
        
        for (const row of result.rows.slice(0, 3)) { // Test sur les 3 premières tables
            const tableName = row[0];
            try {
                const countResult = await connection.execute(
                    `SELECT COUNT(*) as count FROM ${tableName}`,
                    [],
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );
                console.log(`✅ Table ${tableName}: ${countResult.rows[0].COUNT} enregistrements`);
            } catch (error) {
                console.log(`❌ Erreur d'accès à ${tableName}: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur de connexion Oracle:', error.message);
        console.error('Détails:', error);
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('\n🔒 Connexion Oracle fermée.');
            } catch (error) {
                console.error('Erreur lors de la fermeture de la connexion:', error);
            }
        }
    }
}

// Exécution du test
testOracleConnection(); 