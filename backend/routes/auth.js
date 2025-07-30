const express = require('express')
const ldap = require('ldapjs')
const jwt = require('jsonwebtoken')
const router = express.Router()

// Configuration LDAP depuis les variables d'environnement
const LDAP_CONFIG = {
  server: process.env.LDAP_SERVER,
  baseDN: process.env.LDAP_BASE_DN,
  bindDN: process.env.LDAP_BIND_DN,
  bindPassword: process.env.LDAP_BIND_PASSWORD,
  userSearchBase: process.env.LDAP_USER_SEARCH_BASE,
  groupSearchBase: process.env.LDAP_GROUP_SEARCH_BASE
}

// Route de connexion LDAP
router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Nom d\'utilisateur et mot de passe requis'
    })
  }

  try {
    // Créer le client LDAP
    console.log('🔍 Tentative de connexion LDAP à:', `ldap://${LDAP_CONFIG.server}:389`)
    console.log('🔍 Recherche utilisateur:', username)
    console.log('🔍 Base de recherche:', LDAP_CONFIG.userSearchBase)
    
    const client = ldap.createClient({
      url: `ldap://${LDAP_CONFIG.server}:389`
    })

    // Fonction pour se connecter à LDAP
    const authenticateUser = () => {
      return new Promise((resolve, reject) => {
        // Essayer de se connecter avec l'utilisateur
        client.bind(username, password, (err) => {
          if (err) {
            console.error('Erreur d\'authentification LDAP:', err.message)
            reject(new Error('Identifiants invalides'))
            return
          }

          // Rechercher les informations de l'utilisateur
          const searchOptions = {
            scope: 'sub',
            filter: `(&(objectClass=user)(userPrincipalName=${username}))`,
            attributes: ['cn', 'mail', 'memberOf', 'userPrincipalName', 'sAMAccountName', 'name']
          }

          client.search(LDAP_CONFIG.userSearchBase, searchOptions, (err, res) => {
            if (err) {
              reject(new Error('Erreur lors de la recherche utilisateur'))
              return
            }

            let userFound = false
            let userInfo = {}

            res.on('searchEntry', (entry) => {
              userFound = true
              console.log('LDAP Entry trouvée')
              
              // Gérer la structure LDAP de manière sécurisée
              const userData = entry.object || entry.attributes || {}
              
              userInfo = {
                cn: userData.cn || userData.name || 'Unknown',
                mail: userData.mail || userData.userPrincipalName || '',
                userPrincipalName: userData.userPrincipalName || username,
                sAMAccountName: userData.sAMAccountName || userData.samAccountName || username.split('@')[0],
                memberOf: userData.memberOf || []
              }
              
              console.log('UserInfo extrait:', {
                cn: userInfo.cn,
                upn: userInfo.userPrincipalName,
                sam: userInfo.sAMAccountName,
                memberOfCount: userInfo.memberOf.length
              })
            })

            res.on('error', (err) => {
              console.error('Erreur LDAP search:', err.message)
              reject(new Error('Erreur lors de la recherche'))
            })

            res.on('end', () => {
              if (userFound) {
                resolve(userInfo)
              } else {
                reject(new Error('Utilisateur non trouvé'))
              }
            })
          })
        })
      })
    }

    // Authentifier l'utilisateur
    const userInfo = await authenticateUser()

    // Déterminer le rôle basé sur les groupes
    let role = 'user'
    if (userInfo.memberOf) {
      const groups = Array.isArray(userInfo.memberOf) ? userInfo.memberOf : [userInfo.memberOf]
      console.log('Groupes de l\'utilisateur:', groups)
      if (groups.some(group => group.includes('HelloJADE-Admins'))) {
        role = 'admin'
        console.log('Utilisateur détecté comme admin')
      }
    }

    // Créer le token JWT
    const token = jwt.sign(
      {
        id: userInfo.sAMAccountName,
        username: userInfo.userPrincipalName,
        role: role,
        cn: userInfo.cn
      },
      process.env.JWT_SECRET_KEY || 'your-secret-key',
      { expiresIn: '24h' }
    )

    // Réponse de succès
    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        token: token,
        user: {
          id: userInfo.sAMAccountName,
          username: userInfo.userPrincipalName,
          email: userInfo.mail || userInfo.userPrincipalName,
          first_name: userInfo.cn ? userInfo.cn.split(' ')[0] : '',
          last_name: userInfo.cn ? userInfo.cn.split(' ').slice(1).join(' ') : '',
          role: role
        }
      }
    })

    // Fermer la connexion LDAP
    client.unbind()

  } catch (error) {
    console.error('Erreur d\'authentification:', error.message)
    console.error('Stack trace:', error.stack)
    res.status(401).json({
      success: false,
      message: 'Email ou mot de passe incorrect',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Route de vérification de token
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token manquant'
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || 'your-secret-key')
    res.json({
      success: true,
      data: {
        user: decoded
      }
    })
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token invalide'
    })
  }
})

// Route de déconnexion
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  })
})

module.exports = router 