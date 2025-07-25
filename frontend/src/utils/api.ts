import axios from 'axios'
import { useToast } from 'vue-toastification'

// Configuration de base de l'API
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const toast = useToast()
    
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Token expiré, essayer de rafraîchir
          const refreshToken = localStorage.getItem('refresh_token')
          if (refreshToken) {
            try {
              const refreshResponse = await api.post('/auth/refresh', {
                refresh_token: refreshToken
              })
              
              const { access_token } = refreshResponse.data.data.tokens
              localStorage.setItem('access_token', access_token)
              api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
              
              // Réessayer la requête originale
              error.config.headers.Authorization = `Bearer ${access_token}`
              return api.request(error.config)
            } catch (refreshError) {
              // Échec du refresh, déconnexion
              localStorage.removeItem('access_token')
              localStorage.removeItem('refresh_token')
              localStorage.removeItem('user')
              window.location.href = '/login'
            }
          } else {
            window.location.href = '/login'
          }
          break
          
        case 403:
          toast.error('Accès interdit')
          break
          
        case 404:
          toast.error('Ressource non trouvée')
          break
          
        case 422:
          // Erreur de validation
          const validationErrors = data.errors || {}
          Object.values(validationErrors).forEach((error: any) => {
            if (Array.isArray(error)) {
              error.forEach((msg: string) => toast.error(msg))
            } else {
              toast.error(error)
            }
          })
          break
          
        case 500:
          toast.error('Erreur serveur')
          break
          
        default:
          toast.error(data.message || 'Une erreur est survenue')
      }
    } else if (error.request) {
      toast.error('Erreur de connexion au serveur')
    } else {
      toast.error('Une erreur est survenue')
    }
    
    return Promise.reject(error)
  }
)

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T = any> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}

// Fonctions utilitaires pour les appels API
export const apiClient = {
  // Authentification
  auth: {
    login: (credentials: { email: string; password: string }) =>
      api.post<ApiResponse>('/auth/login', credentials),
    
    logout: () =>
      api.post<ApiResponse>('/auth/logout'),
    
    refresh: (refreshToken: string) =>
      api.post<ApiResponse>('/auth/refresh', { refresh_token: refreshToken }),
    
    profile: () =>
      api.get<ApiResponse>('/auth/profile'),
    
    changePassword: (data: {
      current_password: string
      new_password: string
      confirm_password: string
    }) =>
      api.post<ApiResponse>('/auth/change-password', data),
    
    forgotPassword: (email: string) =>
      api.post<ApiResponse>('/auth/forgot-password', { email }),
    
    resetPassword: (data: {
      token: string
      password: string
      confirm_password: string
    }) =>
      api.post<ApiResponse>('/auth/reset-password', data)
  },
  
  // Tableau de bord
  dashboard: {
    getKPIs: (params?: { from?: string; to?: string }) =>
      api.get<ApiResponse>('/dashboard/kpis', { params }),
    
    getChartData: (params?: { from?: string; to?: string; type?: string }) =>
      api.get<ApiResponse>('/dashboard/chart', { params })
  },
  
  // Appels
  calls: {
    getCalls: (params?: {
      page?: number
      per_page?: number
      search?: string
      status?: string
      from_date?: string
      to_date?: string
      sort_by?: string
      sort_order?: 'asc' | 'desc'
    }) =>
      api.get<ApiResponse<PaginatedResponse>>('/calls', { params }),
    
    getCall: (id: number) =>
      api.get<ApiResponse>(`/calls/${id}`),
    
    getCallSummary: (id: number) =>
      api.get<ApiResponse>(`/calls/${id}/summary`),
    
    exportCallPDF: (id: number) =>
      api.get(`/calls/${id}/export-pdf`, { responseType: 'blob' }),
    
    reportIssue: (id: number, issue: { description: string; type: string }) =>
      api.post<ApiResponse>(`/calls/${id}/report-issue`, issue)
  },
  
  // Utilisateurs (Admin)
  users: {
    getUsers: (params?: {
      page?: number
      per_page?: number
      search?: string
      role?: string
      status?: string
    }) =>
      api.get<ApiResponse<PaginatedResponse>>('/users', { params }),
    
    createUser: (userData: {
      email: string
      first_name: string
      last_name: string
      role: string
    }) =>
      api.post<ApiResponse>('/users', userData),
    
    updateUser: (id: number, userData: Partial<{
      email: string
      first_name: string
      last_name: string
      role: string
      is_active: boolean
    }>) =>
      api.put<ApiResponse>(`/users/${id}`, userData),
    
    deleteUser: (id: number) =>
      api.delete<ApiResponse>(`/users/${id}`),
    
    toggleUserStatus: (id: number) =>
      api.patch<ApiResponse>(`/users/${id}/toggle-status`)
  },
  
  // Paramètres système (Admin)
  system: {
    getSettings: () =>
      api.get<ApiResponse>('/system/settings'),
    
    updateSettings: (settings: {
      default_call_time?: string
      max_attempts?: number
      call_timing?: string
    }) =>
      api.put<ApiResponse>('/system/settings', settings),
    
    uploadKnowledgeBase: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.post<ApiResponse>('/system/knowledge-base', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    },
    
    getKnowledgeBase: () =>
      api.get<ApiResponse>('/system/knowledge-base')
  }
} 