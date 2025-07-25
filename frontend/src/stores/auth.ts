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
      
      const response = await api.post('/auth/login', credentials)
      const { user: userData, tokens: authTokens } = response.data.data
      
      // Stocker les tokens
      tokens.value = authTokens
      localStorage.setItem('access_token', authTokens.access_token)
      localStorage.setItem('refresh_token', authTokens.refresh_token)
      
      // Stocker les données utilisateur
      user.value = userData
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Configurer l'API avec le token
      api.defaults.headers.common['Authorization'] = `Bearer ${authTokens.access_token}`
      
      toast.success('Connexion réussie')
      return true
      
    } catch (error: any) {
      console.error('Erreur de connexion:', error)
      
      const message = error.response?.data?.message || 'Erreur de connexion'
      toast.error(message)
      
      return false
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      if (tokens.value?.access_token) {
        await api.post('/auth/logout')
      }
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
      
      const response = await api.post('/auth/refresh', {
        refresh_token: refreshToken
      })
      
      const { tokens: newTokens } = response.data.data
      
      // Mettre à jour les tokens
      tokens.value = newTokens
      localStorage.setItem('access_token', newTokens.access_token)
      localStorage.setItem('refresh_token', newTokens.refresh_token)
      
      // Mettre à jour les headers API
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
        expires_in: 3600 // Valeur par défaut
      }
      user.value = JSON.parse(userData)
      
      // Configurer l'API
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      
      // Vérifier la validité du token
      const response = await api.get('/auth/profile')
      user.value = response.data.data
      
      return true
      
    } catch (error) {
      console.error('Erreur lors de la vérification d\'authentification:', error)
      
      // Essayer de rafraîchir le token
      return await refreshToken()
    }
  }

  const updateProfile = async (profileData: Partial<User>): Promise<boolean> => {
    try {
      isLoading.value = true
      
      const response = await api.put('/auth/profile', profileData)
      user.value = response.data.data
      
      // Mettre à jour le localStorage
      localStorage.setItem('user', JSON.stringify(user.value))
      
      toast.success('Profil mis à jour avec succès')
      return true
      
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error)
      
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour'
      toast.error(message)
      
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
      
      await api.post('/auth/change-password', passwordData)
      
      toast.success('Mot de passe modifié avec succès')
      return true
      
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error)
      
      const message = error.response?.data?.message || 'Erreur lors du changement de mot de passe'
      toast.error(message)
      
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