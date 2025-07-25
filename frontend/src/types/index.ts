// Types globaux pour l'application HelloJADE

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'user'
  is_active: boolean
  last_login?: string
  avatar?: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface Call {
  id: number
  patient_number: string
  patient_last_name: string
  patient_first_name: string
  birth_date: string
  phone: string
  hospital_site: string
  discharge_date: string
  scheduled_call: string
  status: 'pending' | 'called' | 'failed'
  doctor: string
  service: string
  actual_call?: string
  duration?: number
  score?: number
}

export interface KPI {
  id: number
  label: string
  value: string
  icon: any
  iconColor: string
  change?: number
}

export interface SystemSettings {
  default_call_time: string
  max_attempts: number
  call_timing: string
}

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

// Extension de l'interface ImportMeta pour les variables d'environnement
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL: string
    readonly VITE_APP_TITLE: string
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
} 