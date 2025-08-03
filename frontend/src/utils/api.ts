import axios from 'axios'

// Configuration de base
const API_BASE_URL = 'http://localhost:8000'

// Instance axios avec configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    console.log('📤 Requête API:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data,
      params: config.params
    })
    
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('❌ Erreur de requête API:', error)
    return Promise.reject(error)
  }
)

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => {
    console.log('📥 Réponse API:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    })
    return response
  },
  (error) => {
    console.error('❌ Erreur de réponse API:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    })
    
    if (error.response) {
      // Erreur de réponse du serveur
      const message = error.response.data?.message || 'Erreur serveur'
      console.error('Erreur serveur:', message)
    } else if (error.request) {
      // Erreur de réseau
      console.error('Erreur de connexion au serveur')
    } else {
      // Autre erreur
      console.error('Une erreur est survenue')
    }
    
    return Promise.reject(error)
  }
)

// Interfaces basées sur votre structure de base de données

export interface Patient {
  id_patient: number
  numero_patient: string
  nom: string
  prenom: string
  date_naissance: string
  sexe: string
  telephone: string
  email: string
  date_creation: string
  statut: string
  adresse: string
  code_postal: string
  ville: string
  medecin_traitant: string
  personne_contact: string
  tel_contact: string
  numero_secu: string
  service?: string
  medecin?: string
  date_admission?: string
  date_sortie?: string
}

export interface Hospitalisation {
  id: number
  patient_id: number
  numero_sejour: string
  service: string
  medecin: string
  date_entree: string
  date_sortie: string
  diagnostic: string
  statut: string
  date_creation: string
}

export interface Consultation {
  id: number
  hosp_id: number
  patient_id: number
  date_consultation: string
  type_consultation: string
  medecin: string
  statut: string
  notes: string
  date_creation: string
}




export interface Utilisateur {
  id: number
  username: string
  email: string
  password_hash: string
  nom: string
  prenom: string
  role: string
  derniere_connexion: string
  statut: string
  date_creation: string
}

export interface Call {
  id: number
  patient_id: number
  numero_patient: string
  nom: string
  prenom: string
  date_naissance: string
  telephone: string
  site_hospitalisation: string | null
  date_sortie_hospitalisation: string | null
  date_heure_prevue: string
  statut_appel: string
  medecin_referent: string | null
  service_hospitalisation: string | null
  date_heure_reelle: string | null
  duree_appel: number | null
  resume_appel: string | null
  score_calcule: number | null
  nombre_tentatives: number
  max_tentatives: number
  dialogue_result: any | null
  audio_file_path: string | null
  created_at: string
  updated_at: string
  issues?: CallIssue[]
}

export interface CallIssue {
  id: number
  type_probleme: string
  description: string
  priorite: string
  statut: string
  created_at: string
}

export interface CallFilters {
  search?: string
  date_debut?: string
  date_fin?: string
  statut?: string
  site?: string
  service?: string
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'ASC' | 'DESC'
}

export interface CallStats {
  overview: {
    total_calls: number
    successful_calls: number
    failed_calls: number
    pending_calls: number
    success_rate: number
    avg_duration: number
    avg_score: number
  }
  daily_stats: Array<{
    date: string
    total: number
    successful: number
    failed: number
  }>
}

export interface DashboardStats {
  patients: {
    total: number
    active: number
    inactive: number
  }
  hospitalisations: {
    total: number
    current: number
    completed: number
  }
  consultations: {
    total: number
    scheduled: number
    completed: number
  }

}

export interface RecentActivity {
  type: string
  id: number
  patient_name: string
  service: string
  doctor: string
  date: string
  status: string
  description: string
}

// Services API
export const patientsService = {
  // Récupérer tous les patients
  getAll: async (params?: any): Promise<Patient[]> => {
    try {
      const response = await api.get('/api/patients', { params })
      console.log('🔍 API Response:', response.data)
      
      // Gérer différents formats de réponse
      if (response.data && response.data.success && response.data.data && response.data.data.items) {
        console.log('✅ Format 1: response.data.data.items')
        return response.data.data.items
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log('✅ Format 2: response.data.data')
        return response.data.data
      } else if (response.data && Array.isArray(response.data)) {
        console.log('✅ Format 3: response.data')
        return response.data
      } else if (response.data && response.data.items && Array.isArray(response.data.items)) {
        console.log('✅ Format 4: response.data.items')
        return response.data.items
      } else {
        console.warn('❌ Format de réponse inattendu:', response.data)
        return []
      }
    } catch (error) {
      console.error('❌ Erreur dans patientsService.getAll:', error)
      throw error
    }
  },

  // Récupérer un patient par ID
  getById: async (id: number): Promise<Patient> => {
    const response = await api.get(`/api/patients/${id}`)
    return response.data.data
  },

  // Rechercher un patient par téléphone
  searchByPhone: async (phone: string): Promise<Patient> => {
    const response = await api.get(`/api/patients/search/phone/${phone}`)
    return response.data.data
  },

  // Récupérer les hospitalisations d'un patient
  getHospitalisations: async (id: number): Promise<Hospitalisation[]> => {
    const response = await api.get(`/api/patients/${id}/hospitalisations`)
    return response.data.data
  },

  // Récupérer les consultations d'un patient
  getConsultations: async (id: number): Promise<Consultation[]> => {
    const response = await api.get(`/api/patients/${id}/consultations`)
    return response.data.data
  },



  // Créer un nouveau patient
  create: async (patient: Omit<Patient, 'id_patient' | 'date_creation'>): Promise<Patient> => {
    const response = await api.post('/api/patients', patient)
    return response.data.data
  },

  // Mettre à jour un patient
  update: async (id: number, patient: Partial<Patient>): Promise<Patient> => {
    const response = await api.put(`/api/patients/${id}`, patient)
    return response.data.data
  },

  // Supprimer un patient
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/patients/${id}`)
  }
}

export const dashboardService = {
  // Récupérer les statistiques
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/api/dashboard/stats')
    return response.data.data
  },

  // Récupérer l'activité récente
  getRecentActivity: async (): Promise<RecentActivity[]> => {
    const response = await api.get('/api/dashboard/recent-activity')
    return response.data.data
  }
}

export const callsService = {
  // Récupérer tous les appels avec filtres et pagination
  getAll: async (filters?: CallFilters): Promise<{ data: Call[], pagination: any, filters: any }> => {
    try {
      const response = await api.get('/api/calls', { params: filters })
      console.log('🔍 API Calls Response:', response.data)
      
      if (response.data && response.data.success) {
        return {
          data: response.data.data || [],
          pagination: response.data.pagination || {},
          filters: response.data.filters || {}
        }
      } else {
        console.warn('❌ Format de réponse inattendu:', response.data)
        return { data: [], pagination: {}, filters: {} }
      }
    } catch (error) {
      console.error('❌ Erreur dans callsService.getAll:', error)
      throw error
    }
  },

  // Récupérer un appel par ID
  getById: async (id: number): Promise<Call> => {
    const response = await api.get(`/api/calls/${id}`)
    return response.data.data
  },

  // Démarrer un appel manuel
  startCall: async (id: number): Promise<Call> => {
    const response = await api.post(`/api/calls/${id}/start`)
    return response.data.data
  },

  // Signaler un problème
  reportIssue: async (id: number, issueData: { type_probleme: string, description: string, priorite?: string }): Promise<CallIssue> => {
    const response = await api.post(`/api/calls/${id}/issues`, issueData)
    return response.data.data
  },

  // Récupérer les statistiques
  getStats: async (): Promise<CallStats> => {
    const response = await api.get('/api/calls/stats/overview')
    return response.data.data
  },

  // Exporter en CSV
  exportCSV: async (filters?: CallFilters): Promise<Blob> => {
    const response = await api.get('/api/calls/export/csv', { 
      params: filters,
      responseType: 'blob'
    })
    return response.data
  }
}



// Utilitaires
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatPhoneNumber = (phone: string): string => {
  // Format: 0471034785 -> 04 71 03 47 85
  return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
}

export const getStatusColor = (status: string): string => {
  const colors = {
    'EN_COURS': 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300',
    'TERMINE': 'text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-300',
    'PLANIFIE': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300',
    'ANNULE': 'text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-300',
    'ACTIF': 'text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-300',
    'INACTIF': 'text-gray-600 bg-gray-100 dark:bg-gray-900/50 dark:text-gray-300'
  }
  return colors[status as keyof typeof colors] || colors.INACTIF
}

export const getUrgencyColor = (urgence: string): string => {
  const colors = {
    'FAIBLE': 'text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-300',
    'MOYEN': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300',
    'ELEVE': 'text-orange-600 bg-orange-100 dark:bg-orange-900/50 dark:text-orange-300',
    'CRITIQUE': 'text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-300'
  }
  return colors[urgence as keyof typeof colors] || colors.FAIBLE
}

export default api 