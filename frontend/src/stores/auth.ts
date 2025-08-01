import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'medecin' | 'infirmier' | 'secretaire' | 'user'
  is_active: boolean
  last_login?: string
  avatar?: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
}

// Données simulées pour le développement
const MOCK_ADMIN_USER: User = {
  id: 1,
  username: 'admin',
  email: 'admin@hellojade.fr',
  first_name: 'Administrateur',
  last_name: 'HelloJADE',
  role: 'admin',
  is_active: true,
  last_login: new Date().toISOString(),
  avatar: undefined
}

const MOCK_TOKENS: AuthTokens = {
  access_token: 'mock_access_token_admin',
  refresh_token: 'mock_refresh_token_admin',
  expires_in: 3600
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const tokens = ref<AuthTokens | null>(null)
  const isLoading = ref(false)

  // Computed properties
  const isAuthenticated = computed(() => !!user.value && !!tokens.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isMedicalStaff = computed(() => 
    ['medecin', 'infirmier'].includes(user.value?.role || '')
  )
  const userRole = computed(() => user.value?.role || 'user')

  // Actions
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      isLoading.value = true
      
      console.log('🔐 Store: Tentative de connexion LDAP')
      console.log('🔐 Store: Credentials:', { username: credentials.username })
      
      // Appel API LDAP
      const response = await api.post('/api/auth/login', {
        username: credentials.username,
        password: credentials.password
      })
      
      console.log('🔐 Store: Réponse API:', response.data)
      
      if (response.data.success) {
        const { token, user: userData } = response.data.data
        
        // Stocker les tokens
        tokens.value = {
          access_token: token,
          refresh_token: token, // Pour simplifier, on utilise le même token
          expires_in: 3600
        }
        
        // Stocker l'utilisateur
        user.value = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          is_active: true,
          avatar: '/default-avatar.png'
        }
        
        // Stocker en localStorage
        localStorage.setItem('access_token', token)
        localStorage.setItem('refresh_token', token)
        localStorage.setItem('user', JSON.stringify(user.value))
        
        // Configurer l'API
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        console.log(`Connexion réussie - Bienvenue ${userData.first_name} !`)
        return true
        
      } else {
        console.error('🔐 Store: Échec de connexion:', response.data.message || 'Email ou mot de passe incorrect')
        throw new Error(response.data.message || 'Identifiants invalides')
      }
      
    } catch (error: any) {
      console.error('🔐 Store: Erreur de connexion:', error)
      console.error('🔐 Store: Erreur response:', error.response?.data)
      
      // Propager l'erreur avec plus de détails
      if (error.response?.status === 401) {
        throw new Error('Email ou mot de passe incorrect')
      } else if (error.response?.status === 0 || error.code === 'NETWORK_ERROR') {
        throw new Error('Impossible de se connecter au serveur')
      } else if (error.response?.status >= 500) {
        throw new Error('Erreur serveur')
      } else {
        throw new Error(error.response?.data?.message || 'Erreur de connexion')
      }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    } finally {
      // Nettoyer le store
      user.value = null
      tokens.value = null
      
      // Nettoyer le localStorage
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      
      // Nettoyer les headers API
      delete api.defaults.headers.common['Authorization']
      
      console.log('Déconnexion réussie')
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        return false
      }
      
      // Simulation de refresh
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Renouveler les tokens
      const newTokens: AuthTokens = {
        access_token: `mock_access_token_${Date.now()}`,
        refresh_token: `mock_refresh_token_${Date.now()}`,
        expires_in: 3600
      }
      
      tokens.value = newTokens
      localStorage.setItem('access_token', newTokens.access_token)
      localStorage.setItem('refresh_token', newTokens.refresh_token)
      
      api.defaults.headers.common['Authorization'] = `Bearer ${newTokens.access_token}`
      
      return true
      
    } catch (error) {
      console.error('Erreur lors du refresh token:', error)
      await logout()
      return false
    }
  }

  const checkAuth = async (): Promise<boolean> => {
    try {
      console.log('🔐 Vérification de l\'authentification...')
      
      // Vérifier si on a des tokens en localStorage
      const accessToken = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')
      const userData = localStorage.getItem('user')
      
      if (!accessToken || !refreshToken || !userData) {
        console.log('❌ Aucun token ou données utilisateur trouvés')
        return false
      }
      
      // Restaurer les données
      tokens.value = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 3600
      }
      user.value = JSON.parse(userData)
      
      // Configurer l'API
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      
      // Vérifier la validité du token avec l'API
      try {
        const response = await api.get('/api/auth/verify')
        if (response.data.success) {
          console.log('✅ Token valide, authentification confirmée')
          return true
        } else {
          console.log('❌ Token invalide, tentative de refresh')
          return await refreshToken()
        }
      } catch (error: any) {
        console.log('❌ Erreur lors de la vérification du token:', error.response?.status)
        
        // Si erreur 401, essayer de refresh
        if (error.response?.status === 401) {
          console.log('🔄 Tentative de refresh du token...')
          return await refreshToken()
        }
        
        // Pour les erreurs réseau, considérer comme authentifié si on a des données locales
        if (error.code === 'NETWORK_ERROR' || error.response?.status === 0) {
          console.log('⚠️ Erreur réseau, utilisation des données locales')
          return true
        }
        
        return false
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification d\'authentification:', error)
      return false
    }
  }

  const updateProfile = async (profileData: Partial<User>): Promise<boolean> => {
    try {
      isLoading.value = true
      
      // Simulation d'un délai réseau
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mettre à jour l'utilisateur
      if (user.value) {
        user.value = { ...user.value, ...profileData }
        localStorage.setItem('user', JSON.stringify(user.value))
      }
      
      console.log('Profil mis à jour avec succès')
      return true
      
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error)
      console.error('Erreur lors de la mise à jour')
      return false
    } finally {
      isLoading.value = false
    }
  }

  const changePassword = async (passwordData: {
    current_password: string
    new_password: string
    confirm_password: string
  }): Promise<boolean> => {
    try {
      isLoading.value = true
      
      // Simulation d'un délai réseau
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Vérification simulée
      if (passwordData.new_password !== passwordData.confirm_password) {
        console.error('Les mots de passe ne correspondent pas')
        return false
      }
      
      if (passwordData.new_password.length < 6) {
        console.error('Le mot de passe doit contenir au moins 6 caractères')
        return false
      }
      
      console.log('Mot de passe modifié avec succès')
      return true
      
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error)
      console.error('Erreur lors du changement de mot de passe')
      return false
    } finally {
      isLoading.value = false
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!user.value) return false
    
    const permissions = {
      admin: [
        'users:read', 'users:write', 'users:delete',
        'patients:read', 'patients:write', 'patients:delete',
        'calls:read', 'calls:write', 'calls:delete',
        'admin:read', 'admin:write',
        'monitoring:read', 'monitoring:write'
      ],
      medecin: [
        'patients:read', 'patients:write',
        'calls:read', 'calls:write',
        'medical_records:read', 'medical_records:write'
      ],
      infirmier: [
        'patients:read', 'patients:write',
        'calls:read', 'calls:write',
        'medical_records:read', 'medical_records:write'
      ],
      secretaire: [
        'patients:read', 'patients:write',
        'calls:read', 'calls:write'
      ],
      user: [
        'patients:read',
        'calls:read'
      ]
    }
    
    const userPermissions = permissions[user.value.role] || permissions.user
    return userPermissions.includes(permission)
  }

  return {
    // State
    user,
    tokens,
    isLoading,
    
    // Computed
    isAuthenticated,
    isAdmin,
    isMedicalStaff,
    userRole,
    
    // Actions
    login,
    logout,
    refreshToken,
    checkAuth,
    updateProfile,
    changePassword,
    hasPermission
  }
}) 