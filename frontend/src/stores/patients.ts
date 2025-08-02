import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

// Configuration de base
const API_BASE_URL = 'http://localhost:8000'

// Instance axios avec configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interfaces
export interface Patient {
  patient_id: number
  nom: string
  prenom: string
  date_naissance: string
  adresse: string | null
  telephone: string | null
  email: string | null
  numero_secu: string | null
  created_date: string | null
  sync_timestamp: string | null
  sync_source: string | null
  age: number
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface Statistics {
  total_patients: number
  male_count: number
  female_count: number
  avg_age: number
  min_age: number
  max_age: number
}

export interface Filters {
  search: string
  ageMin: string
  ageMax: string
  sortBy: string
  sortOrder: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  details?: string
}

export interface PatientsData {
  patients: Patient[]
  pagination: Pagination
  statistics: Statistics
  filters: Filters
}

export const usePatientsStore = defineStore('patients', () => {
  // State
  const patients = ref<Patient[]>([])
  const currentPatient = ref<Patient | null>(null)
  const pagination = ref<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const statistics = ref<Statistics>({
    total_patients: 0,
    male_count: 0,
    female_count: 0,
    avg_age: 0,
    min_age: 0,
    max_age: 0
  })
  const filters = ref<Filters>({
    search: '',
    ageMin: '',
    ageMax: '',
    sortBy: 'nom',
    sortOrder: 'ASC'
  })
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const hasPatients = computed(() => patients.value.length > 0)
  const hasNextPage = computed(() => pagination.value.page < pagination.value.totalPages)
  const hasPrevPage = computed(() => pagination.value.page > 1)
  const currentPageInfo = computed(() => {
    const start = (pagination.value.page - 1) * pagination.value.limit + 1
    const end = Math.min(pagination.value.page * pagination.value.limit, pagination.value.total)
    return `${start}-${end} sur ${pagination.value.total}`
  })

  // Actions
  const fetchPatients = async (resetPage = false) => {
    try {
      isLoading.value = true
      error.value = null

      if (resetPage) {
        pagination.value.page = 1
      }

      const params = new URLSearchParams({
        page: pagination.value.page.toString(),
        limit: pagination.value.limit.toString(),
        sortBy: filters.value.sortBy,
        sortOrder: filters.value.sortOrder,
        ...(filters.value.search && { search: filters.value.search }),

        ...(filters.value.ageMin && { ageMin: filters.value.ageMin }),
        ...(filters.value.ageMax && { ageMax: filters.value.ageMax })
      })

                    const response = await api.get<ApiResponse<PatientsData>>(`/api/patients?${params}`)
        
       if (response.data.success && response.data.data) {
         patients.value = response.data.data.patients
         pagination.value = response.data.data.pagination
         statistics.value = response.data.data.statistics
         filters.value = response.data.data.filters
       } else {
         throw new Error(response.data.error || 'Erreur lors de la récupération des patients')
       }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur inconnue'
      console.error('Erreur fetchPatients:', err)
    } finally {
      isLoading.value = false
    }
  }

  const fetchPatient = async (id: number) => {
    try {
      isLoading.value = true
      error.value = null

             const response = await api.get<ApiResponse<Patient>>(`/api/patients/${id}`)
       
       if (response.data.success && response.data.data) {
         currentPatient.value = response.data.data
       } else {
         throw new Error(response.data.error || 'Patient non trouvé')
       }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur inconnue'
      console.error('Erreur fetchPatient:', err)
    } finally {
      isLoading.value = false
    }
  }

  const setFilters = (newFilters: Partial<Filters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const setPage = (page: number) => {
    pagination.value.page = page
  }

  const setLimit = (limit: number) => {
    pagination.value.limit = limit
    pagination.value.page = 1 // Reset to first page
  }

  const nextPage = () => {
    if (hasNextPage.value) {
      pagination.value.page++
    }
  }

  const prevPage = () => {
    if (hasPrevPage.value) {
      pagination.value.page--
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.value.totalPages) {
      pagination.value.page = page
    }
  }

  const clearFilters = () => {
    filters.value = {
      search: '',
      ageMin: '',
      ageMax: '',
      sortBy: 'nom',
      sortOrder: 'ASC'
    }
  }

  const exportCSV = async (selectedPatients?: Patient[]) => {
    try {
      // Si des patients spécifiques sont sélectionnés, créer un CSV personnalisé
      if (selectedPatients && selectedPatients.length > 0) {
        const csvContent = generateCSVContent(selectedPatients)
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `patients_selection_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } else {
        // Export de tous les patients via l'API
        const response = await api.get('/api/patients/export/csv', {
          responseType: 'blob'
        })
        
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'patients.csv')
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de l\'export'
      console.error('Erreur exportCSV:', err)
    }
  }

  const generateCSVContent = (patients: Patient[]): string => {
    const headers = [
      'ID Patient',
      'Nom',
      'Prénom',
      'Date de naissance',
      'Âge',
      
      'Téléphone',
      'Email',
      'Adresse',
      'Numéro de sécurité sociale'
    ]
    
    const csvRows = [
      headers.join(','),
      ...patients.map(patient => [
        patient.patient_id,
        `"${patient.nom}"`,
        `"${patient.prenom}"`,
        patient.date_naissance,
        patient.age,

        `"${patient.telephone || ''}"`,
        `"${patient.email || ''}"`,
        `"${patient.adresse || ''}"`,
        `"${patient.numero_secu || ''}"`
      ].join(','))
    ]
    
    return csvRows.join('\n')
  }

  const updatePatient = async (patientId: number, patientData: Partial<Patient>) => {
    try {
      isLoading.value = true
      error.value = null

      // Appel à l'API de mise à jour
      const response = await api.put(`/api/patients/${patientId}`, patientData)
      
      if (response.data.success) {
        const updatedPatient = response.data.data
        
        // Mettre à jour le patient dans la liste locale
        const index = patients.value.findIndex(p => p.patient_id === patientId)
        if (index !== -1) {
          patients.value[index] = updatedPatient
        }
        
        // Mettre à jour le patient courant si c'est le même
        if (currentPatient.value && currentPatient.value.patient_id === patientId) {
          currentPatient.value = updatedPatient
        }
        
        console.log('✅ Patient mis à jour avec succès:', patientId)
      } else {
        throw new Error(response.data.error || 'Erreur lors de la mise à jour')
      }
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
      console.error('Erreur updatePatient:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const initialize = () => {
    fetchPatients()
  }

  return {
    // State
    patients,
    currentPatient,
    pagination,
    statistics,
    filters,
    isLoading,
    error,
    
    // Computed
    hasPatients,
    hasNextPage,
    hasPrevPage,
    currentPageInfo,
    
    // Actions
    fetchPatients,
    fetchPatient,
    updatePatient,
    setFilters,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    goToPage,
    clearFilters,
    exportCSV,
    initialize
  }
}) 