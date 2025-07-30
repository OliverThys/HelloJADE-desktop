// Charger les variables d'environnement
require('dotenv').config({ path: './config.env' })

const ldap = require('ldapjs')

// Configuration LDAP depuis les variables d'environnement
const LDAP_CONFIG = {
  server: process.env.LDAP_SERVER,
  baseDN: process.env.LDAP_BASE_DN,
  bindDN: process.env.LDAP_BIND_DN,
  bindPassword: process.env.LDAP_BIND_PASSWORD,
  userSearchBase: process.env.LDAP_USER_SEARCH_BASE,
  groupSearchBase: process.env.LDAP_GROUP_SEARCH_BASE
}

console.log('🔍 Configuration LDAP:')
console.log('  Serveur:', LDAP_CONFIG.server)
console.log('  Base DN:', LDAP_CONFIG.baseDN)
console.log('  Bind DN:', LDAP_CONFIG.bindDN)
console.log('  User Search Base:', LDAP_CONFIG.userSearchBase)
console.log('')

async function testLDAPConnection() {
  console.log('🧪 Test de connexion LDAP...')
  
  try {
    // Créer le client LDAP
    const client = ldap.createClient({
      url: `ldap://${LDAP_CONFIG.server}:389`
    })

    // Test 1: Connexion avec l'utilisateur de service
    console.log('📡 Test 1: Connexion avec l\'utilisateur de service...')
    await new Promise((resolve, reject) => {
      client.bind(LDAP_CONFIG.bindDN, LDAP_CONFIG.bindPassword, (err) => {
        if (err) {
          console.error('❌ Erreur de connexion avec l\'utilisateur de service:', err.message)
          reject(err)
        } else {
          console.log('✅ Connexion avec l\'utilisateur de service réussie')
          resolve()
        }
      })
    })

    // Test 2: Recherche d'utilisateurs
    console.log('🔍 Test 2: Recherche d\'utilisateurs...')
    await new Promise((resolve, reject) => {
      const searchOptions = {
        scope: 'sub',
        filter: '(objectClass=user)',
        attributes: ['cn', 'userPrincipalName', 'sAMAccountName', 'name', 'mail']
      }

      client.search(LDAP_CONFIG.userSearchBase, searchOptions, (err, res) => {
        if (err) {
          console.error('❌ Erreur de recherche:', err.message)
          reject(err)
          return
        }

        let userCount = 0
        res.on('searchEntry', (entry) => {
          userCount++
          // Afficher les données de manière sécurisée
          const userData = entry.object || entry.attributes || {}
          const cn = userData.cn || userData.name || 'N/A'
          const upn = userData.userPrincipalName || 'N/A'
          const sam = userData.sAMAccountName || 'N/A'
          
          console.log(`  - ${cn} (UPN: ${upn}, SAM: ${sam})`)
        })

        res.on('error', (err) => {
          console.error('❌ Erreur lors de la recherche:', err.message)
          reject(err)
        })

        res.on('end', () => {
          console.log(`✅ ${userCount} utilisateurs trouvés`)
          resolve()
        })
      })
    })

    // Test 3: Test d'authentification avec admin
    console.log('🔐 Test 3: Authentification avec admin@hellojade.local...')
    await new Promise((resolve, reject) => {
      client.bind('admin@hellojade.local', 'MotDePasse123!', (err) => {
        if (err) {
          console.error('❌ Erreur d\'authentification admin:', err.message)
          reject(err)
        } else {
          console.log('✅ Authentification admin réussie')
          resolve()
        }
      })
    })

    // Test 4: Test d'authentification avec user
    console.log('🔐 Test 4: Authentification avec user@hellojade.local...')
    await new Promise((resolve, reject) => {
      client.bind('user@hellojade.local', 'MotDePasse123!', (err) => {
        if (err) {
          console.error('❌ Erreur d\'authentification user:', err.message)
          reject(err)
        } else {
          console.log('✅ Authentification user réussie')
          resolve()
        }
      })
    })

    // Test 5: Recherche spécifique de l'utilisateur admin
    console.log('🔍 Test 5: Recherche spécifique de l\'utilisateur admin...')
    await new Promise((resolve, reject) => {
      const searchOptions = {
        scope: 'sub',
        filter: '(&(objectClass=user)(userPrincipalName=admin@hellojade.local))',
        attributes: ['cn', 'userPrincipalName', 'sAMAccountName', 'name', 'memberOf']
      }

      client.search(LDAP_CONFIG.userSearchBase, searchOptions, (err, res) => {
        if (err) {
          console.error('❌ Erreur de recherche admin:', err.message)
          reject(err)
          return
        }

        res.on('searchEntry', (entry) => {
          console.log('✅ Utilisateur admin trouvé:')
          const userData = entry.object || entry.attributes || {}
          console.log('  - CN:', userData.cn || 'N/A')
          console.log('  - UPN:', userData.userPrincipalName || 'N/A')
          console.log('  - SAM:', userData.sAMAccountName || 'N/A')
          console.log('  - MemberOf:', userData.memberOf ? userData.memberOf.length : 0, 'groupes')
        })

        res.on('error', (err) => {
          console.error('❌ Erreur lors de la recherche admin:', err.message)
          reject(err)
        })

        res.on('end', () => {
          resolve()
        })
      })
    })

    client.unbind()
    console.log('\n🎉 Tous les tests LDAP sont réussis !')

  } catch (error) {
    console.error('\n💥 Erreur lors des tests LDAP:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

// Exécuter les tests
testLDAPConnection()
  .then(() => {
    console.log('\n✅ Tests terminés')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Tests échoués:', error.message)
    process.exit(1)
  }) 