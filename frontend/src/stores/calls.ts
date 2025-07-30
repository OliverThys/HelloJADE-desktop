import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { callsService, patientsService, type Patient, type Call } from '@/utils/api'
import { useToast } from 'vue-toastification'

export interface CallSession {
  isActive: boolean
  currentCall: Call | null
  identifiedPatient: Patient | null
  startTime: Date | null
  duration: number
  notes: string
  isRecording: boolean
  recordingBlob: Blob | null
}

export const useCallsStore = defineStore('calls', () => {
  const toast = useToast()
  
  // State
  const calls = ref<Call[]>([])
  const currentSession = ref<CallSession>({
    isActive: false,
    currentCall: null,
    identifiedPatient: null,
    startTime: null,
    duration: 0,
    notes: '',
    isRecording: false,
    recordingBlob: null
  })
  const isLoading = ref(false)
  const pendingCalls = ref<Call[]>([])
  const callHistory = ref<Call[]>([])

  // Computed
  const activeCalls = computed(() => 
    calls.value.filter(call => call.statut === 'in_progress')
  )

  const incomingCalls = computed(() => 
    calls.value.filter(call => call.statut === 'pending')
  )

  const todayCalls = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return calls.value.filter(call => 
      call.date_appel_prevue && call.date_appel_prevue.startsWith(today)
    )
  })

  const callsByPatient = computed(() => {
    const patientMap = new Map<number, Call[]>()
    
    calls.value.forEach(call => {
      if (call.project_patient_id) {
        if (!patientMap.has(call.project_patient_id)) {
          patientMap.set(call.project_patient_id, [])
        }
        patientMap.get(call.project_patient_id)!.push(call)
      }
    })
    
    return Object.fromEntries(patientMap)
  })

  const callStats = computed(() => {
    const total = calls.value.length
    const today = todayCalls.value.length
    const active = activeCalls.value.length
    const pending = pendingCalls.value.length
    
    return {
      total,
      today,
      active,
      pending,
      completed: total - active - pending
    }
  })

  const currentCallDuration = computed(() => {
    if (!currentSession.value.startTime) return 0
    
    const now = new Date()
    const diff = now.getTime() - currentSession.value.startTime.getTime()
    return Math.floor(diff / 1000)
  })

  // Actions
  const fetchCalls = async (params?: any) => {
    try {
      isLoading.value = true
      console.log('📞 Chargement des appels avec params:', params)
      
      const data = await callsService.getAll(params)
      console.log('✅ Appels chargés:', data.length, 'appels')
      
      calls.value = data
      
      // Séparer les appels en attente
      pendingCalls.value = data.filter(call => call.statut === 'pending')
      
      // Historique des appels terminés
      callHistory.value = data.filter(call => call.statut === 'called')
      
      toast.success(`${data.length} appels chargés`)
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des appels:', error)
      toast.error('Erreur lors du chargement des appels')
      calls.value = []
      pendingCalls.value = []
      callHistory.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Nouvelle méthode pour récupérer les appels avec pagination et filtres avancés
  const fetchCallsEnhanced = async (params?: any) => {
    try {
      isLoading.value = true
      
      const queryParams = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString())
          }
        })
      }
      
      const response = await fetch(`/api/calls?${queryParams}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des appels')
      }
      
      const result = await response.json()
      
      if (result.success) {
        return result
      } else {
        throw new Error(result.error || 'Erreur lors de la récupération des appels')
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des appels:', error)
      toast.error('Erreur lors du chargement des appels')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const startCall = async (callData: Partial<Call>) => {
    try {
      const newCall = await callsService.create({
        ...callData,
        date_debut: new Date().toISOString(),
        statut: 'en_cours'
      })
      
      calls.value.push(newCall)
      
      // Démarrer la session
      currentSession.value = {
        isActive: true,
        currentCall: newCall,
        identifiedPatient: null,
        startTime: new Date(),
        duration: 0,
        notes: '',
        isRecording: false,
        recordingBlob: null
      }
      
      // Essayer d'identifier le patient
      if (newCall.numero_appelant) {
        await identifyPatientByPhone(newCall.numero_appelant)
      }
      
      toast.success('Appel démarré')
      return newCall
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'appel:', error)
      toast.error('Erreur lors du démarrage de l\'appel')
      return null
    }
  }

  const endCall = async (callId: number, notes?: string) => {
    try {
      const endTime = new Date()
      const duration = currentSession.value.startTime 
        ? Math.floor((endTime.getTime() - currentSession.value.startTime.getTime()) / 1000)
        : 0
      
      const updatedCall = await callsService.update(callId, {
        date_fin: endTime.toISOString(),
        duree: duration,
        statut: 'termine',
        notes: notes || currentSession.value.notes
      })
      
      // Mettre à jour dans la liste
      const index = calls.value.findIndex(c => c.id === callId)
      if (index !== -1) {
        calls.value[index] = updatedCall
      }
      
      // Arrêter la session
      currentSession.value = {
        isActive: false,
        currentCall: null,
        identifiedPatient: null,
        startTime: null,
        duration: 0,
        notes: '',
        isRecording: false,
        recordingBlob: null
      }
      
      toast.success('Appel terminé')
      return updatedCall
    } catch (error) {
      console.error('Erreur lors de la fin de l\'appel:', error)
      toast.error('Erreur lors de la fin de l\'appel')
      return null
    }
  }

  const identifyPatientByPhone = async (phoneNumber: string) => {
    try {
      const patient = await patientsService.searchByPhone(phoneNumber)
      if (patient) {
        currentSession.value.identifiedPatient = patient
        
        // Mettre à jour l'appel avec l'ID du patient
        if (currentSession.value.currentCall) {
          await callsService.update(currentSession.value.currentCall.id, {
            patient_id: patient.id
          })
        }
        
        toast.success(`Patient identifié: ${patient.prenom} ${patient.nom}`)
        return patient
      }
      return null
    } catch (error) {
      console.error('Erreur lors de l\'identification du patient:', error)
      return null
    }
  }

  const updateCallNotes = (notes: string) => {
    currentSession.value.notes = notes
  }

  const startRecording = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const mediaRecorder = new MediaRecorder(stream)
          const chunks: BlobPart[] = []
          
          mediaRecorder.ondataavailable = (event) => {
            chunks.push(event.data)
          }
          
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/wav' })
            currentSession.value.recordingBlob = blob
            currentSession.value.isRecording = false
          }
          
          mediaRecorder.start()
          currentSession.value.isRecording = true
          
          toast.success('Enregistrement démarré')
        })
        .catch(error => {
          console.error('Erreur lors du démarrage de l\'enregistrement:', error)
          toast.error('Impossible de démarrer l\'enregistrement')
        })
    } else {
      toast.error('Enregistrement audio non supporté')
    }
  }

  const stopRecording = () => {
    currentSession.value.isRecording = false
    toast.success('Enregistrement arrêté')
  }

  const handleIncomingCall = async (callData: Partial<Call>) => {
    try {
      const newCall = await callsService.create({
        ...callData,
        type: 'entrant',
        statut: 'en_attente',
        date_debut: new Date().toISOString()
      })
      
      calls.value.push(newCall)
      pendingCalls.value.push(newCall)
      
      // Notification d'appel entrant
      toast.info(`Appel entrant de ${callData.numero_appelant}`)
      
      // Essayer d'identifier le patient
      if (callData.numero_appelant) {
        const patient = await identifyPatientByPhone(callData.numero_appelant)
        if (patient) {
          // Mettre à jour l'appel avec l'ID du patient
          await callsService.update(newCall.id, {
            patient_id: patient.id
          })
        }
      }
      
      return newCall
    } catch (error) {
      console.error('Erreur lors de la réception de l\'appel:', error)
      return null
    }
  }

  const acceptCall = async (callId: number) => {
    try {
      const call = calls.value.find(c => c.id === callId)
      if (!call) return null
      
      const updatedCall = await callsService.update(callId, {
        statut: 'en_cours'
      })
      
      // Mettre à jour dans les listes
      const index = calls.value.findIndex(c => c.id === callId)
      if (index !== -1) {
        calls.value[index] = updatedCall
      }
      
      pendingCalls.value = pendingCalls.value.filter(c => c.id !== callId)
      
      // Démarrer la session
      currentSession.value = {
        isActive: true,
        currentCall: updatedCall,
        identifiedPatient: null,
        startTime: new Date(),
        duration: 0,
        notes: '',
        isRecording: false,
        recordingBlob: null
      }
      
      // Identifier le patient si pas déjà fait
      if (updatedCall.patient_id) {
        // Le patient est déjà identifié
      } else if (updatedCall.numero_appelant) {
        await identifyPatientByPhone(updatedCall.numero_appelant)
      }
      
      toast.success('Appel accepté')
      return updatedCall
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de l\'appel:', error)
      toast.error('Erreur lors de l\'acceptation de l\'appel')
      return null
    }
  }

  const rejectCall = async (callId: number) => {
    try {
      const updatedCall = await callsService.update(callId, {
        statut: 'rate',
        date_fin: new Date().toISOString()
      })
      
      // Mettre à jour dans les listes
      const index = calls.value.findIndex(c => c.id === callId)
      if (index !== -1) {
        calls.value[index] = updatedCall
      }
      
      pendingCalls.value = pendingCalls.value.filter(c => c.id !== callId)
      
      toast.success('Appel rejeté')
      return updatedCall
    } catch (error) {
      console.error('Erreur lors du rejet de l\'appel:', error)
      toast.error('Erreur lors du rejet de l\'appel')
      return null
    }
  }

  const getCallById = async (id: number) => {
    try {
      const call = await callsService.getById(id)
      return call
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'appel:', error)
      return null
    }
  }

  const clearSession = () => {
    currentSession.value = {
      isActive: false,
      currentCall: null,
      identifiedPatient: null,
      startTime: null,
      duration: 0,
      notes: '',
      isRecording: false,
      recordingBlob: null
    }
  }

  // Mettre à jour le statut d'un appel
  const updateCallStatus = async (callId: number, callData: any) => {
    try {
      const response = await fetch(`/api/calls/${callId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(callData)
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      const result = await response.json()
      
      if (result.success) {
        // Mettre à jour l'appel dans la liste locale
        const callIndex = calls.value.findIndex(c => c.id === callId)
        if (callIndex !== -1) {
          calls.value[callIndex] = { ...calls.value[callIndex], ...callData }
        }
        
        toast.success('Statut de l\'appel mis à jour')
        return result
      } else {
        throw new Error(result.message || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      toast.error('Erreur lors de la mise à jour du statut')
      throw error
    }
  }

  // Exporter les appels en CSV
  const exportCalls = async (filters: any) => {
    try {
      const params = new URLSearchParams()
      
      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)
      if (filters.service) params.append('service', filters.service)
      if (filters.fromDate) params.append('from_date', filters.fromDate)
      if (filters.toDate) params.append('to_date', filters.toDate)
      params.append('export', 'csv')

      const response = await fetch(`/api/calls/export?${params}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'export')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `appels_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Export CSV généré avec succès')
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error)
      toast.error('Erreur lors de l\'export CSV')
      throw error
    }
  }

  // Exporter les appels en PDF
  const exportCallsPDF = async (filters: any) => {
    try {
      const params = new URLSearchParams()
      
      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)
      if (filters.service) params.append('service', filters.service)
      if (filters.fromDate) params.append('from_date', filters.fromDate)
      if (filters.toDate) params.append('to_date', filters.toDate)
      params.append('export', 'pdf')

      const response = await fetch(`/api/calls/export?${params}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'export PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `appels_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Export PDF généré avec succès')
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error)
      toast.error('Erreur lors de l\'export PDF')
      throw error
    }
  }

  // Exporter le résumé d'un appel en PDF
  const exportCallSummaryPDF = async (callId: number) => {
    try {
      const response = await fetch(`/api/calls/${callId}/summary/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'export du résumé')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resume_appel_${callId}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Résumé PDF généré avec succès')
    } catch (error) {
      console.error('Erreur lors de l\'export du résumé:', error)
      toast.error('Erreur lors de l\'export du résumé')
      throw error
    }
  }

  // Récupérer les services disponibles
  const fetchServices = async () => {
    try {
      const response = await fetch('/api/calls/services')
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des services')
      }
      
      const result = await response.json()
      
      if (result.success) {
        return result.data
      } else {
        throw new Error(result.error || 'Erreur lors de la récupération des services')
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération des services:', error)
      // Ne pas afficher de toast d'erreur pour les services, juste retourner un tableau vide
      return []
    }
  }

  // Récupérer les statistiques des appels
  const fetchCallStats = async () => {
    try {
      const response = await fetch('/api/calls/statistics/overview')
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des statistiques')
      }
      
      const result = await response.json()
      
      if (result.success) {
        return result.data
      } else {
        throw new Error(result.error || 'Erreur lors de la récupération des statistiques')
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      toast.error('Erreur lors de la récupération des statistiques')
      return null
    }
  }

  // Récupérer les scores détaillés d'un appel
  const fetchCallScores = async (callId: number) => {
    try {
      const response = await fetch(`/api/calls/${callId}/scores`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des scores')
      }
      
      const result = await response.json()
      
      if (result.success) {
        return result.data
      } else {
        throw new Error(result.error || 'Erreur lors de la récupération des scores')
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération des scores:', error)
      toast.error('Erreur lors de la récupération des scores')
      return []
    }
  }

  return {
    // State
    calls,
    currentSession,
    isLoading,
    pendingCalls,
    callHistory,

    // Computed
    activeCalls,
    incomingCalls,
    todayCalls,
    callsByPatient,
    callStats,
    currentCallDuration,

    // Actions
    fetchCalls,
    fetchCallsEnhanced,
    startCall,
    endCall,
    identifyPatientByPhone,
    updateCallNotes,
    startRecording,
    stopRecording,
    handleIncomingCall,
    acceptCall,
    rejectCall,
    getCallById,
    clearSession,
    updateCallStatus,
    exportCalls,
    exportCallsPDF,
    exportCallSummaryPDF,
    fetchServices,
    fetchCallStats,
    fetchCallScores
  }
}) 