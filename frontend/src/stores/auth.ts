import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'
import { useToast } from 'vue-toastification'

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
  const toast = useToast()

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
      
      // Simulation d'un délai réseau
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Authentification simulée
      if (credentials.username === 'admin@hellojade.fr' && credentials.password === 'admin123') {
        // Connexion réussie - Admin
        tokens.value = MOCK_TOKENS
        user.value = MOCK_ADMIN_USER
        
        // Stocker en localStorage
        localStorage.setItem('access_token', MOCK_TOKENS.access_token)
        localStorage.setItem('refresh_token', MOCK_TOKENS.refresh_token)
        localStorage.setItem('user', JSON.stringify(MOCK_ADMIN_USER))
        
        // Configurer l'API
        api.defaults.headers.common['Authorization'] = `Bearer ${MOCK_TOKENS.access_token}`
        
        toast.success('Connexion réussie - Bienvenue Administrateur !')
        return true
        
      } else if (credentials.username === 'user@hellojade.fr' && credentials.password === 'user123') {
        // Connexion réussie - Utilisateur standard
        const standardUser: User = {
          ...MOCK_ADMIN_USER,
          id: 2,
          username: 'user',
          email: 'user@hellojade.fr',
          first_name: 'Utilisateur',
          last_name: 'Standard',
          role: 'user'
        }
        
        tokens.value = MOCK_TOKENS
        user.value = standardUser
        
        localStorage.setItem('access_token', MOCK_TOKENS.access_token)
        localStorage.setItem('refresh_token', MOCK_TOKENS.refresh_token)
        localStorage.setItem('user', JSON.stringify(standardUser))
        
        api.defaults.headers.common['Authorization'] = `Bearer ${MOCK_TOKENS.access_token}`
        
        toast.success('Connexion réussie - Bienvenue !')
        return true
        
      } else {
        // Échec de connexion
        toast.error('Email ou mot de passe incorrect')
        return false
      }
      
    } catch (error: any) {
      console.error('Erreur de connexion:', error)
      toast.error('Erreur de connexion')
      return false
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
      
      toast.success('Déconnexion réussie')
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
      // Vérifier si on a des tokens en localStorage
      const accessToken = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')
      const userData = localStorage.getItem('user')
      
      if (!accessToken || !refreshToken || !userData) {
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
      
      // Simulation de vérification
      await new Promise(resolve => setTimeout(resolve, 200))
      
      return true
      
    } catch (error) {
      console.error('Erreur lors de la vérification d\'authentification:', error)
      return await refreshToken()
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
      
      toast.success('Profil mis à jour avec succès')
      return true
      
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error)
      toast.error('Erreur lors de la mise à jour')
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
        toast.error('Les mots de passe ne correspondent pas')
        return false
      }
      
      if (passwordData.new_password.length < 6) {
        toast.error('Le mot de passe doit contenir au moins 6 caractères')
        return false
      }
      
      toast.success('Mot de passe modifié avec succès')
      return true
      
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error)
      toast.error('Erreur lors du changement de mot de passe')
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
        'ai:read', 'ai:write',
        'admin:read', 'admin:write',
        'monitoring:read', 'monitoring:write'
      ],
      medecin: [
        'patients:read', 'patients:write',
        'calls:read', 'calls:write',
        'ai:read', 'ai:write',
        'medical_records:read', 'medical_records:write'
      ],
      infirmier: [
        'patients:read', 'patients:write',
        'calls:read', 'calls:write',
        'ai:read',
        'medical_records:read', 'medical_records:write'
      ],
      secretaire: [
        'patients:read', 'patients:write',
        'calls:read', 'calls:write',
        'ai:read'
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