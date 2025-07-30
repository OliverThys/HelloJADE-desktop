import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { patientsService, type Patient, type Hospitalisation, type Consultation, type Transcription, type AnalyseIA } from '@/utils/api'
import { useToast } from 'vue-toastification'

export const usePatientsStore = defineStore('patients', () => {
  const toast = useToast()
  
  // State
  const patients = ref<Patient[]>([])
  const currentPatient = ref<Patient | null>(null)
  const patientHospitalisations = ref<Hospitalisation[]>([])
  const patientConsultations = ref<Consultation[]>([])
  const patientTranscriptions = ref<Transcription[]>([])
  const patientAnalyses = ref<AnalyseIA[]>([])
  const isLoading = ref(false)
  const searchQuery = ref('')
  const selectedService = ref('')
  const selectedStatus = ref('')
  const selectedPatients = ref<Set<number>>(new Set())
  const isSelectionMode = ref(false)

  // Computed
  const filteredPatients = computed(() => {
    console.log('🔍 Calcul des patients filtrés...')
    console.log('📊 patients.value:', patients.value)
    console.log('🔍 searchQuery.value:', searchQuery.value)
    console.log('🔍 selectedStatus.value:', selectedStatus.value)
    console.log('🔍 selectedService.value:', selectedService.value)
    
    // S'assurer que patients.value est un tableau valide
    if (!Array.isArray(patients.value)) {
      console.warn('patients.value n\'est pas un tableau:', patients.value)
      return []
    }

    let filtered = patients.value.filter(patient => {
      // Vérifier que chaque patient a les propriétés requises
      const isValid = patient && typeof patient === 'object' && 
             patient.id !== undefined && 
             patient.nom !== undefined && 
             patient.prenom !== undefined
      
      if (!isValid) {
        console.warn('Patient invalide filtré:', patient)
      }
      
      return isValid
    })

    console.log(`✅ ${filtered.length} patients valides après filtrage initial`)

    // Filtre par recherche
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      const beforeSearch = filtered.length
      filtered = filtered.filter(patient => 
        (patient.nom && patient.nom.toLowerCase().includes(query)) ||
        (patient.prenom && patient.prenom.toLowerCase().includes(query)) ||
        (patient.telephone && patient.telephone.includes(query)) ||
        (patient.email && patient.email.toLowerCase().includes(query))
      )
      console.log(`🔍 Filtre recherche: ${beforeSearch} → ${filtered.length} patients`)
    }

    // Filtre par service (basé sur le champ service du patient)
    if (selectedService.value) {
      const beforeService = filtered.length
      filtered = filtered.filter(patient => {
        const patientService = patient.service?.toLowerCase()
        const filterService = selectedService.value.toLowerCase()
        return patientService === filterService
      })
      console.log(`🔍 Filtre service: ${beforeService} → ${filtered.length} patients`)
    }

    // Filtre par statut
    if (selectedStatus.value) {
      const beforeStatus = filtered.length
      filtered = filtered.filter(patient => {
        const patientStatus = patient.statut?.toLowerCase()
        const filterStatus = selectedStatus.value.toLowerCase()
        return patientStatus === filterStatus
      })
      console.log(`🔍 Filtre statut: ${beforeStatus} → ${filtered.length} patients`)
    }

    console.log(`✅ ${filtered.length} patients filtrés finaux`)
    return filtered
  })

  const patientsByService = computed(() => {
    const serviceMap = new Map<string, Patient[]>()
    
    patients.value.forEach(patient => {
      const hospitalisations = patientHospitalisations.value.filter(h => h.patient_id === patient.id)
      const services = [...new Set(hospitalisations.map(h => h.service))]
      
      services.forEach(service => {
        if (!serviceMap.has(service)) {
          serviceMap.set(service, [])
        }
        serviceMap.get(service)!.push(patient)
      })
    })
    
    return Object.fromEntries(serviceMap)
  })

  const patientsStats = computed(() => {
    const total = patients.value.length
    const actifs = patients.value.filter(p => p.statut === 'actif').length
    const hospitalises = patientHospitalisations.value.filter(h => h.statut === 'en_cours').length
    
    return {
      total,
      actifs,
      hospitalises,
      inactifs: total - actifs
    }
  })

  const availableServices = computed(() => {
    const services = new Set<string>()
    patientHospitalisations.value.forEach(h => services.add(h.service))
    return Array.from(services).sort()
  })

  // Actions
  const fetchPatients = async () => {
    try {
      isLoading.value = true
      const response = await patientsService.getAll({ per_page: 50 })
      
      console.log('📊 Response from patientsService.getAll():', response)
      
      // S'assurer que nous avons un tableau de patients
      if (Array.isArray(response)) {
        patients.value = response
      } else if (response && response.data && Array.isArray(response.data)) {
        patients.value = response.data
      } else if (response && response.success && Array.isArray(response.data)) {
        patients.value = response.data
      } else if (response && response.data && response.data.items && Array.isArray(response.data.items)) {
        patients.value = response.data.items
      } else {
        console.warn('Unexpected response format:', response)
        patients.value = []
      }
      
      // Vérifier que chaque patient a les propriétés requises
      patients.value = patients.value.filter(patient => {
        if (!patient || typeof patient !== 'object') {
          console.warn('Patient invalide:', patient)
          return false
        }
        if (!patient.id || !patient.nom || !patient.prenom) {
          console.warn('Patient manque de propriétés requises:', patient)
          return false
        }
        return true
      })
      
      console.log(`✅ ${patients.value.length} patients valides chargés`)
      toast.success(`${patients.value.length} patients chargés`)
    } catch (error) {
      console.error('Erreur lors du chargement des patients:', error)
      toast.error('Erreur lors du chargement des patients')
      patients.value = []
    } finally {
      isLoading.value = false
    }
  }

  const fetchPatientById = async (id: number) => {
    try {
      console.log('👤 Chargement du patient par ID:', id)
      isLoading.value = true
      const patient = await patientsService.getById(id)
      currentPatient.value = patient
      console.log('✅ Patient chargé avec succès:', patient)
      
      // Charger les données associées
      console.log('📊 Chargement des données associées...')
      await Promise.all([
        fetchPatientHospitalisations(id),
        fetchPatientConsultations(id),
        fetchPatientTranscriptions(id),
        fetchPatientAnalyses(id)
      ])
      console.log('✅ Toutes les données associées chargées')
      
      return patient
    } catch (error) {
      console.error('Erreur lors du chargement du patient:', error)
      toast.error('Erreur lors du chargement du patient')
      return null
    } finally {
      isLoading.value = false
    }
  }

  const searchPatientByPhone = async (phone: string) => {
    try {
      console.log('📞 Recherche du patient par téléphone:', phone)
      const patient = await patientsService.searchByPhone(phone)
      console.log('✅ Patient trouvé:', patient)
      return patient
    } catch (error) {
      console.error('Erreur lors de la recherche par téléphone:', error)
      return null
    }
  }

  const fetchPatientHospitalisations = async (patientId: number) => {
    try {
      console.log('🏥 Chargement des hospitalisations pour le patient:', patientId)
      const data = await patientsService.getHospitalisations(patientId)
      patientHospitalisations.value = data
      console.log(`✅ ${data.length} hospitalisations chargées`)
    } catch (error) {
      console.error('Erreur lors du chargement des hospitalisations:', error)
    }
  }

  const fetchPatientConsultations = async (patientId: number) => {
    try {
      console.log('👨‍⚕️ Chargement des consultations pour le patient:', patientId)
      const data = await patientsService.getConsultations(patientId)
      patientConsultations.value = data
      console.log(`✅ ${data.length} consultations chargées`)
    } catch (error) {
      console.error('Erreur lors du chargement des consultations:', error)
    }
  }

  const fetchPatientTranscriptions = async (patientId: number) => {
    try {
      console.log('🎤 Chargement des transcriptions pour le patient:', patientId)
      const data = await patientsService.getTranscriptions(patientId)
      patientTranscriptions.value = data
      console.log(`✅ ${data.length} transcriptions chargées`)
    } catch (error) {
      console.error('Erreur lors du chargement des transcriptions:', error)
    }
  }

  const fetchPatientAnalyses = async (patientId: number) => {
    try {
      console.log('🤖 Chargement des analyses IA pour le patient:', patientId)
      const data = await patientsService.getAnalyses(patientId)
      patientAnalyses.value = data
      console.log(`✅ ${data.length} analyses IA chargées`)
    } catch (error) {
      console.error('Erreur lors du chargement des analyses:', error)
    }
  }

  const createPatient = async (patientData: Omit<Patient, 'id' | 'date_creation' | 'date_modification'>) => {
    try {
      console.log('➕ Création d\'un nouveau patient:', patientData)
      isLoading.value = true
      const newPatient = await patientsService.create(patientData)
      patients.value.push(newPatient)
      console.log('✅ Patient créé avec succès:', newPatient)
      toast.success('Patient créé avec succès')
      return newPatient
    } catch (error) {
      console.error('Erreur lors de la création du patient:', error)
      toast.error('Erreur lors de la création du patient')
      return null
    } finally {
      isLoading.value = false
    }
  }

  const updatePatient = async (id: number, patientData: Partial<Patient>) => {
    try {
      console.log('✏️ Mise à jour du patient:', id, patientData)
      isLoading.value = true
      const updatedPatient = await patientsService.update(id, patientData)
      
      // Mettre à jour dans la liste
      const index = patients.value.findIndex(p => p.id === id)
      if (index !== -1) {
        patients.value[index] = updatedPatient
      }
      
      // Mettre à jour le patient courant si c'est le même
      if (currentPatient.value?.id === id) {
        currentPatient.value = updatedPatient
      }
      
      console.log('✅ Patient mis à jour avec succès:', updatedPatient)
      toast.success('Patient mis à jour avec succès')
      return updatedPatient
    } catch (error) {
      console.error('Erreur lors de la mise à jour du patient:', error)
      toast.error('Erreur lors de la mise à jour du patient')
      return null
    } finally {
      isLoading.value = false
    }
  }

  const deletePatient = async (id: number) => {
    try {
      console.log('🗑️ Suppression du patient:', id)
      isLoading.value = true
      await patientsService.delete(id)
      
      // Retirer de la liste
      patients.value = patients.value.filter(p => p.id !== id)
      
      // Vider le patient courant si c'est le même
      if (currentPatient.value?.id === id) {
        currentPatient.value = null
      }
      
      console.log('✅ Patient supprimé avec succès')
      toast.success('Patient supprimé avec succès')
    } catch (error) {
      console.error('Erreur lors de la suppression du patient:', error)
      toast.error('Erreur lors de la suppression du patient')
    } finally {
      isLoading.value = false
    }
  }

  const setSearchQuery = (query: string) => {
    console.log('🔍 setSearchQuery:', query)
    searchQuery.value = query
  }

  const setSelectedService = (service: string) => {
    console.log('🔍 setSelectedService:', service)
    selectedService.value = service
  }

  const setSelectedStatus = (status: string) => {
    console.log('🔍 setSelectedStatus:', status)
    selectedStatus.value = status
  }

  const clearFilters = () => {
    console.log('🧹 clearFilters appelé')
    searchQuery.value = ''
    selectedService.value = ''
    selectedStatus.value = ''
    console.log('✅ Filtres effacés')
  }

  const clearCurrentPatient = () => {
    console.log('🧹 clearCurrentPatient appelé')
    currentPatient.value = null
    patientHospitalisations.value = []
    patientConsultations.value = []
    patientTranscriptions.value = []
    patientAnalyses.value = []
    console.log('✅ Patient actuel et données associées effacés')
  }

  // Méthodes de gestion de la sélection
  const toggleSelectionMode = () => {
    isSelectionMode.value = !isSelectionMode.value
    if (!isSelectionMode.value) {
      selectedPatients.value.clear()
    }
    console.log('🔄 Mode sélection:', isSelectionMode.value ? 'activé' : 'désactivé')
  }

  const togglePatientSelection = (patientId: number) => {
    if (selectedPatients.value.has(patientId)) {
      selectedPatients.value.delete(patientId)
    } else {
      selectedPatients.value.add(patientId)
    }
    console.log('🔄 Sélection patient', patientId, ':', selectedPatients.value.has(patientId))
  }

  const selectAllPatients = () => {
    const currentFilteredIds = filteredPatients.value.map(p => p.id)
    currentFilteredIds.forEach(id => selectedPatients.value.add(id))
    console.log('✅ Tous les patients sélectionnés:', selectedPatients.value.size)
  }

  const deselectAllPatients = () => {
    selectedPatients.value.clear()
    console.log('✅ Tous les patients désélectionnés')
  }

  const getSelectedPatients = () => {
    return filteredPatients.value.filter(p => selectedPatients.value.has(p.id))
  }

  const isPatientSelected = (patientId: number) => {
    return selectedPatients.value.has(patientId)
  }

  return {
    // State
    patients,
    currentPatient,
    patientHospitalisations,
    patientConsultations,
    patientTranscriptions,
    patientAnalyses,
    isLoading,
    searchQuery,
    selectedService,
    selectedStatus,
    selectedPatients,
    isSelectionMode,

    // Computed
    filteredPatients,
    patientsByService,
    patientsStats,
    availableServices,

    // Actions
    fetchPatients,
    fetchPatientById,
    searchPatientByPhone,
    fetchPatientHospitalisations,
    fetchPatientConsultations,
    fetchPatientTranscriptions,
    fetchPatientAnalyses,
    createPatient,
    updatePatient,
    deletePatient,
    setSearchQuery,
    setSelectedService,
    setSelectedStatus,
    clearFilters,
    clearCurrentPatient,
    toggleSelectionMode,
    togglePatientSelection,
    selectAllPatients,
    deselectAllPatients,
    getSelectedPatients,
    isPatientSelected
  }
}) 