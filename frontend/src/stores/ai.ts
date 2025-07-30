import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { aiService, type Transcription, type AnalyseIA } from '@/utils/api'
import { useToast } from 'vue-toastification'

export interface AIModel {
  name: string
  version: string
  type: 'transcription' | 'analysis' | 'both'
  accuracy: number
  speed: number
  isDefault: boolean
}

export interface TranscriptionJob {
  id: string
  patientId: number
  file: File
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  result?: Transcription
  error?: string
  createdAt: Date
}

export interface AnalysisJob {
  id: string
  transcriptionId: number
  patientId: number
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  result?: AnalyseIA
  error?: string
  createdAt: Date
}

export const useAIStore = defineStore('ai', () => {
  const toast = useToast()
  
  // State
  const transcriptions = ref<Transcription[]>([])
  const analyses = ref<AnalyseIA[]>([])
  const availableModels = ref<AIModel[]>([])
  const transcriptionJobs = ref<TranscriptionJob[]>([])
  const analysisJobs = ref<AnalysisJob[]>([])
  const isLoading = ref(false)
  const selectedModel = ref<string>('')
  const isProcessing = ref(false)

  // Computed
  const pendingTranscriptions = computed(() => 
    transcriptions.value.filter(t => t.statut === 'en_cours')
  )

  const completedTranscriptions = computed(() => 
    transcriptions.value.filter(t => t.statut === 'terminee')
  )

  const failedTranscriptions = computed(() => 
    transcriptions.value.filter(t => t.statut === 'erreur')
  )

  const urgentAnalyses = computed(() => 
    analyses.value.filter(a => a.niveau_urgence === 'eleve' || a.niveau_urgence === 'critique')
  )

  const analysesBySentiment = computed(() => {
    const grouped = {
      positif: [] as AnalyseIA[],
      negatif: [] as AnalyseIA[],
      neutre: [] as AnalyseIA[]
    }
    
    analyses.value.forEach(analysis => {
      grouped[analysis.sentiment].push(analysis)
    })
    
    return grouped
  })

  const analysesByUrgency = computed(() => {
    const grouped = {
      faible: [] as AnalyseIA[],
      moyen: [] as AnalyseIA[],
      eleve: [] as AnalyseIA[],
      critique: [] as AnalyseIA[]
    }
    
    analyses.value.forEach(analysis => {
      grouped[analysis.niveau_urgence].push(analysis)
    })
    
    return grouped
  })

  const transcriptionStats = computed(() => {
    const total = transcriptions.value.length
    const completed = completedTranscriptions.value.length
    const pending = pendingTranscriptions.value.length
    const failed = failedTranscriptions.value.length
    
    return {
      total,
      completed,
      pending,
      failed,
      successRate: total > 0 ? (completed / total) * 100 : 0
    }
  })

  const analysisStats = computed(() => {
    const total = analyses.value.length
    const urgent = urgentAnalyses.value.length
    const positive = analysesBySentiment.value.positif.length
    const negative = analysesBySentiment.value.negatif.length
    const neutral = analysesBySentiment.value.neutre.length
    
    return {
      total,
      urgent,
      positive,
      negative,
      neutral
    }
  })

  const activeJobs = computed(() => {
    const activeTranscriptions = transcriptionJobs.value.filter(job => 
      job.status === 'pending' || job.status === 'processing'
    )
    const activeAnalyses = analysisJobs.value.filter(job => 
      job.status === 'pending' || job.status === 'processing'
    )
    
    return {
      transcriptions: activeTranscriptions,
      analyses: activeAnalyses,
      total: activeTranscriptions.length + activeAnalyses.length
    }
  })

  const defaultModel = computed(() => 
    availableModels.value.find(model => model.isDefault) || availableModels.value[0]
  )

  // Actions
  const fetchAvailableModels = async () => {
    try {
      const modelNames = await aiService.getModels()
      
      // Créer des modèles fictifs pour la démo
      availableModels.value = modelNames.map((name, index) => ({
        name,
        version: '1.0',
        type: index % 2 === 0 ? 'transcription' : 'analysis',
        accuracy: 85 + Math.random() * 15,
        speed: 70 + Math.random() * 30,
        isDefault: index === 0
      }))
      
      if (availableModels.value.length > 0 && !selectedModel.value) {
        selectedModel.value = defaultModel.value?.name || ''
      }
    } catch (error) {
      console.error('Erreur lors du chargement des modèles:', error)
    }
  }

  const transcribeAudio = async (file: File, patientId: number) => {
    try {
      isProcessing.value = true
      
      // Créer un job de transcription
      const jobId = `transcription_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const job: TranscriptionJob = {
        id: jobId,
        patientId,
        file,
        status: 'pending',
        progress: 0,
        createdAt: new Date()
      }
      
      transcriptionJobs.value.push(job)
      
      // Simuler le traitement
      job.status = 'processing'
      
      // Simuler la progression
      const progressInterval = setInterval(() => {
        if (job.progress < 90) {
          job.progress += Math.random() * 20
        }
      }, 500)
      
      // Appeler l'API de transcription
      const result = await aiService.transcribeAudio(file, patientId)
      
      clearInterval(progressInterval)
      job.progress = 100
      job.status = 'completed'
      job.result = result
      
      // Ajouter à la liste des transcriptions
      transcriptions.value.push(result)
      
      toast.success('Transcription terminée avec succès')
      return result
      
    } catch (error) {
      console.error('Erreur lors de la transcription:', error)
      toast.error('Erreur lors de la transcription')
      
      // Marquer le job comme échoué
      const job = transcriptionJobs.value.find(j => j.patientId === patientId)
      if (job) {
        job.status = 'error'
        job.error = error instanceof Error ? error.message : 'Erreur inconnue'
      }
      
      return null
    } finally {
      isProcessing.value = false
    }
  }

  const analyzeTranscription = async (transcriptionId: number, patientId: number) => {
    try {
      isProcessing.value = true
      
      // Créer un job d'analyse
      const jobId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const job: AnalysisJob = {
        id: jobId,
        transcriptionId,
        patientId,
        status: 'pending',
        progress: 0,
        createdAt: new Date()
      }
      
      analysisJobs.value.push(job)
      
      // Simuler le traitement
      job.status = 'processing'
      
      // Simuler la progression
      const progressInterval = setInterval(() => {
        if (job.progress < 90) {
          job.progress += Math.random() * 15
        }
      }, 300)
      
      // Appeler l'API d'analyse
      const result = await aiService.analyzeTranscription(transcriptionId)
      
      clearInterval(progressInterval)
      job.progress = 100
      job.status = 'completed'
      job.result = result
      
      // Ajouter à la liste des analyses
      analyses.value.push(result)
      
      toast.success('Analyse IA terminée avec succès')
      return result
      
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error)
      toast.error('Erreur lors de l\'analyse IA')
      
      // Marquer le job comme échoué
      const job = analysisJobs.value.find(j => j.transcriptionId === transcriptionId)
      if (job) {
        job.status = 'error'
        job.error = error instanceof Error ? error.message : 'Erreur inconnue'
      }
      
      return null
    } finally {
      isProcessing.value = false
    }
  }

  const batchTranscribe = async (files: File[], patientId: number) => {
    const results: (Transcription | null)[] = []
    
    for (const file of files) {
      const result = await transcribeAudio(file, patientId)
      results.push(result)
      
      // Pause entre les transcriptions pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    return results
  }

  const batchAnalyze = async (transcriptionIds: number[], patientId: number) => {
    const results: (AnalyseIA | null)[] = []
    
    for (const transcriptionId of transcriptionIds) {
      const result = await analyzeTranscription(transcriptionId, patientId)
      results.push(result)
      
      // Pause entre les analyses
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    return results
  }

  const getTranscriptionById = (id: number) => {
    return transcriptions.value.find(t => t.id === id)
  }

  const getAnalysisById = (id: number) => {
    return analyses.value.find(a => a.id === id)
  }

  const getTranscriptionsByPatient = (patientId: number) => {
    return transcriptions.value.filter(t => t.patient_id === patientId)
  }

  const getAnalysesByPatient = (patientId: number) => {
    return analyses.value.filter(a => a.patient_id === patientId)
  }

  const getAnalysesByTranscription = (transcriptionId: number) => {
    return analyses.value.filter(a => a.transcription_id === transcriptionId)
  }

  const setSelectedModel = (modelName: string) => {
    selectedModel.value = modelName
  }

  const clearJobs = () => {
    // Garder seulement les jobs des dernières 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    transcriptionJobs.value = transcriptionJobs.value.filter(job => 
      job.createdAt > oneDayAgo
    )
    
    analysisJobs.value = analysisJobs.value.filter(job => 
      job.createdAt > oneDayAgo
    )
  }

  const retryJob = async (jobId: string, type: 'transcription' | 'analysis') => {
    if (type === 'transcription') {
      const job = transcriptionJobs.value.find(j => j.id === jobId)
      if (job && job.status === 'error') {
        job.status = 'pending'
        job.progress = 0
        job.error = undefined
        
        const result = await transcribeAudio(job.file, job.patientId)
        return result
      }
    } else {
      const job = analysisJobs.value.find(j => j.id === jobId)
      if (job && job.status === 'error') {
        job.status = 'pending'
        job.progress = 0
        job.error = undefined
        
        const result = await analyzeTranscription(job.transcriptionId, job.patientId)
        return result
      }
    }
    
    return null
  }

  const deleteTranscription = (id: number) => {
    const index = transcriptions.value.findIndex(t => t.id === id)
    if (index !== -1) {
      transcriptions.value.splice(index, 1)
      toast.success('Transcription supprimée')
    }
  }

  const deleteAnalysis = (id: number) => {
    const index = analyses.value.findIndex(a => a.id === id)
    if (index !== -1) {
      analyses.value.splice(index, 1)
      toast.success('Analyse supprimée')
    }
  }

  const clearData = () => {
    transcriptions.value = []
    analyses.value = []
    transcriptionJobs.value = []
    analysisJobs.value = []
  }

  return {
    // State
    transcriptions,
    analyses,
    availableModels,
    transcriptionJobs,
    analysisJobs,
    isLoading,
    selectedModel,
    isProcessing,

    // Computed
    pendingTranscriptions,
    completedTranscriptions,
    failedTranscriptions,
    urgentAnalyses,
    analysesBySentiment,
    analysesByUrgency,
    transcriptionStats,
    analysisStats,
    activeJobs,
    defaultModel,

    // Actions
    fetchAvailableModels,
    transcribeAudio,
    analyzeTranscription,
    batchTranscribe,
    batchAnalyze,
    getTranscriptionById,
    getAnalysisById,
    getTranscriptionsByPatient,
    getAnalysesByPatient,
    getAnalysesByTranscription,
    setSelectedModel,
    clearJobs,
    retryJob,
    deleteTranscription,
    deleteAnalysis,
    clearData
  }
}) 