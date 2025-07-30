import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { callsService, patientsService, type Patient } from '@/utils/api'
import { useToast } from 'vue-toastification'

export interface Call {
  id: number
  numero_appelant: string
  numero_appele: string
  date_debut: string
  date_fin?: string
  duree?: number
  statut: 'en_cours' | 'termine' | 'rate' | 'en_attente'
  type: 'entrant' | 'sortant'
  patient_id?: number
  notes?: string
  transcription_id?: number
  analyse_id?: number
}

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
    calls.value.filter(call => call.statut === 'en_cours')
  )

  const incomingCalls = computed(() => 
    calls.value.filter(call => call.type === 'entrant' && call.statut === 'en_attente')
  )

  const todayCalls = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return calls.value.filter(call => 
      call.date_debut.startsWith(today)
    )
  })

  const callsByPatient = computed(() => {
    const patientMap = new Map<number, Call[]>()
    
    calls.value.forEach(call => {
      if (call.patient_id) {
        if (!patientMap.has(call.patient_id)) {
          patientMap.set(call.patient_id, [])
        }
        patientMap.get(call.patient_id)!.push(call)
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
      const response = await callsService.getAll()
      
      // Gérer différents formats de réponse
      let data: Call[] = []
      if (Array.isArray(response)) {
        data = response
      } else if (response && response.data && Array.isArray(response.data)) {
        data = response.data
      } else if (response && response.success && response.data && Array.isArray(response.data)) {
        data = response.data
      } else {
        console.warn('Unexpected response format:', response)
        data = []
      }
      
      calls.value = data
      
      // Séparer les appels en attente
      pendingCalls.value = data.filter(call => call.statut === 'en_attente')
      
      // Historique des appels terminés
      callHistory.value = data.filter(call => call.statut === 'termine')
      
    } catch (error) {
      console.error('Erreur lors du chargement des appels:', error)
      toast.error('Erreur lors du chargement des appels')
      calls.value = []
      pendingCalls.value = []
      callHistory.value = []
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
    clearSession
  }
}) 