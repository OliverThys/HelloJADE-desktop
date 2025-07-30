// Service de gestion des fichiers JSON pour HelloJADE
import { CallRecord, CallIndex, CallFilters, CallStatistics } from '@/types/calls'

class JSONStorageService {
  private basePath = 'HelloJADE-data'
  private cache = new Map<string, any>()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  // Structure des dossiers
  private getCallsPath(year: number, month: number, day?: number): string {
    let path = `${this.basePath}/calls/${year}/${month.toString().padStart(2, '0')}`
    if (day) {
      path += `/${day.toString().padStart(2, '0')}`
    }
    return path
  }

  private getIndexPath(year: number, month: number): string {
    return `${this.getCallsPath(year, month)}/index.json`
  }

  private getSummariesPath(year: number, month: number, day?: number): string {
    let path = `${this.basePath}/call-summaries/${year}/${month.toString().padStart(2, '0')}`
    if (day) {
      path += `/${day.toString().padStart(2, '0')}`
    }
    return path
  }

  private getRecordingsPath(year: number, month: number, day: number): string {
    return `${this.basePath}/call-recordings/${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`
  }

  private getConfigPath(): string {
    return `${this.basePath}/config`
  }

  private getIssuesPath(): string {
    return `${this.basePath}/issues`
  }

  // Méthodes de base pour la gestion des fichiers
  private async ensureDirectory(path: string): Promise<void> {
    try {
      // Utiliser l'API Tauri pour créer les dossiers
      const { createDir, exists } = await import('@tauri-apps/api/fs')
      
      if (!(await exists(path))) {
        await createDir(path, { recursive: true })
      }
    } catch (error) {
      console.error(`Erreur lors de la création du dossier ${path}:`, error)
      throw error
    }
  }

  private async readJSON<T>(path: string): Promise<T | null> {
    try {
      const { readTextFile } = await import('@tauri-apps/api/fs')
      const content = await readTextFile(path)
      return JSON.parse(content) as T
    } catch (error) {
      console.warn(`Fichier non trouvé ou erreur de lecture: ${path}`)
      return null
    }
  }

  private async writeJSON<T>(path: string, data: T): Promise<void> {
    try {
      const { writeTextFile } = await import('@tauri-apps/api/fs')
      await this.ensureDirectory(path.substring(0, path.lastIndexOf('/')))
      await writeTextFile(path, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error(`Erreur lors de l'écriture du fichier ${path}:`, error)
      throw error
    }
  }

  // Gestion du cache
  private getCacheKey(path: string): string {
    return `file_${path}`
  }

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCached<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  // Sauvegarde d'un appel
  async saveCall(callData: CallRecord): Promise<void> {
    const date = new Date(callData.timestamp)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    // Chemin du fichier d'appel
    const callsPath = this.getCallsPath(year, month, day)
    const filename = `call_${callData.call_id}_${date.toISOString().slice(0, 19).replace(/:/g, '')}.json`
    const filePath = `${callsPath}/${filename}`

    // Sauvegarder l'appel
    await this.writeJSON(filePath, callData)

    // Mettre à jour l'index mensuel
    await this.updateIndex(year, month, callData)

    // Invalider le cache
    this.cache.clear()
  }

  // Mise à jour de l'index mensuel
  private async updateIndex(year: number, month: number, callData: CallRecord): Promise<void> {
    const indexPath = this.getIndexPath(year, month)
    const existingIndex = await this.readJSON<CallIndex>(indexPath) || {
      month: `${year}-${month.toString().padStart(2, '0')}`,
      total_calls: 0,
      calls: []
    }

    // Ajouter ou mettre à jour l'appel dans l'index
    const existingCallIndex = existingIndex.calls.findIndex(c => c.call_id === callData.call_id)
    const callEntry = {
      call_id: callData.call_id,
      timestamp: callData.timestamp,
      patient_name: `${callData.patient.prenom} ${callData.patient.nom}`,
      status: callData.call_data.statut,
      score: callData.score
    }

    if (existingCallIndex >= 0) {
      existingIndex.calls[existingCallIndex] = callEntry
    } else {
      existingIndex.calls.push(callEntry)
      existingIndex.total_calls++
    }

    // Trier par timestamp décroissant
    existingIndex.calls.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    await this.writeJSON(indexPath, existingIndex)
  }

  // Recherche d'appels avec filtres
  async searchCalls(filters: CallFilters): Promise<CallRecord[]> {
    const results: CallRecord[] = []
    
    // Déterminer la plage de dates
    const fromDate = filters.fromDate ? new Date(filters.fromDate) : new Date(new Date().getFullYear(), 0, 1)
    const toDate = filters.toDate ? new Date(filters.toDate) : new Date()
    
    // Parcourir les mois dans la plage
    const currentDate = new Date(fromDate)
    while (currentDate <= toDate) {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      
      const index = await this.readJSON<CallIndex>(this.getIndexPath(year, month))
      if (index) {
        // Filtrer les appels dans l'index
        const filteredCalls = index.calls.filter(call => {
          const callDate = new Date(call.timestamp)
          return callDate >= fromDate && callDate <= toDate
        })

        // Charger les détails complets des appels filtrés
        for (const callIndex of filteredCalls) {
          const callDate = new Date(callIndex.timestamp)
          const day = callDate.getDate()
          const callsPath = this.getCallsPath(year, month, day)
          const filename = `call_${callIndex.call_id}_${callDate.toISOString().slice(0, 19).replace(/:/g, '')}.json`
          const filePath = `${callsPath}/${filename}`
          
          const callData = await this.readJSON<CallRecord>(filePath)
          if (callData && this.matchesFilters(callData, filters)) {
            results.push(callData)
          }
        }
      }
      
      // Passer au mois suivant
      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    return results
  }

  // Filtrage des appels
  private matchesFilters(call: CallRecord, filters: CallFilters): boolean {
    // Recherche textuelle
    if (filters.search) {
      const search = filters.search.toLowerCase()
      const searchableText = [
        call.patient.nom,
        call.patient.prenom,
        call.patient.telephone,
        call.hospital_data.site,
        call.hospital_data.medecin,
        call.hospital_data.service
      ].join(' ').toLowerCase()
      
      if (!searchableText.includes(search)) {
        return false
      }
    }

    // Filtre par statut
    if (filters.status && call.call_data.statut !== filters.status) {
      return false
    }

    // Filtre par site
    if (filters.site && call.hospital_data.site !== filters.site) {
      return false
    }

    // Filtre par service
    if (filters.service && call.hospital_data.service !== filters.service) {
      return false
    }

    // Filtre par médecin
    if (filters.doctor && call.hospital_data.medecin !== filters.doctor) {
      return false
    }

    // Filtre par score
    if (filters.scoreRange) {
      if (call.score < filters.scoreRange.min || call.score > filters.scoreRange.max) {
        return false
      }
    }

    return true
  }

  // Récupération d'un appel par ID
  async getCallById(callId: string): Promise<CallRecord | null> {
    // Rechercher dans tous les index pour trouver l'appel
    const currentYear = new Date().getFullYear()
    
    for (let year = currentYear - 2; year <= currentYear; year++) {
      for (let month = 1; month <= 12; month++) {
        const index = await this.readJSON<CallIndex>(this.getIndexPath(year, month))
        if (index) {
          const callIndex = index.calls.find(c => c.call_id === callId)
          if (callIndex) {
            const callDate = new Date(callIndex.timestamp)
            const day = callDate.getDate()
            const callsPath = this.getCallsPath(year, month, day)
            const filename = `call_${callId}_${callDate.toISOString().slice(0, 19).replace(/:/g, '')}.json`
            const filePath = `${callsPath}/${filename}`
            
            return await this.readJSON<CallRecord>(filePath)
          }
        }
      }
    }
    
    return null
  }

  // Statistiques des appels
  async getCallStatistics(dateRange?: { from: string; to: string }): Promise<CallStatistics> {
    const fromDate = dateRange?.from ? new Date(dateRange.from) : new Date(new Date().getFullYear(), 0, 1)
    const toDate = dateRange?.to ? new Date(dateRange.to) : new Date()
    
    const calls = await this.searchCalls({
      search: '',
      status: '',
      site: '',
      service: '',
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0],
      doctor: '',
      scoreRange: { min: 0, max: 100 }
    })

    const stats: CallStatistics = {
      total_calls: calls.length,
      completed_calls: calls.filter(c => c.call_data.statut === 'complete').length,
      failed_calls: calls.filter(c => c.call_data.statut === 'failed').length,
      pending_calls: calls.filter(c => c.call_data.statut === 'pending').length,
      average_score: calls.length > 0 ? calls.reduce((sum, c) => sum + c.score, 0) / calls.length : 0,
      average_duration: calls.length > 0 ? calls.reduce((sum, c) => sum + c.call_data.duree_secondes, 0) / calls.length : 0,
      calls_by_site: {},
      calls_by_service: {},
      calls_by_status: {}
    }

    // Calculer les répartitions
    calls.forEach(call => {
      // Par site
      const site = call.hospital_data.site
      stats.calls_by_site[site] = (stats.calls_by_site[site] || 0) + 1

      // Par service
      const service = call.hospital_data.service
      stats.calls_by_service[service] = (stats.calls_by_service[service] || 0) + 1

      // Par statut
      const status = call.call_data.statut
      stats.calls_by_status[status] = (stats.calls_by_status[status] || 0) + 1
    })

    return stats
  }

  // Sauvegarde d'un résumé d'appel
  async saveCallSummary(callId: string, summary: any): Promise<void> {
    const call = await this.getCallById(callId)
    if (!call) throw new Error(`Appel ${callId} non trouvé`)

    const date = new Date(call.timestamp)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    const summariesPath = this.getSummariesPath(year, month, day)
    const filename = `summary_${callId}.json`
    const filePath = `${summariesPath}/${filename}`

    await this.writeJSON(filePath, {
      call_id: callId,
      timestamp: new Date().toISOString(),
      ...summary
    })
  }

  // Sauvegarde d'un problème signalé
  async saveIssue(issue: any): Promise<void> {
    const currentYear = new Date().getFullYear()
    const issuesPath = this.getIssuesPath()
    const filename = `reported_issues_${currentYear}.json`
    const filePath = `${issuesPath}/${filename}`

    const existingIssues = await this.readJSON<any[]>(filePath) || []
    existingIssues.push({
      id: `issue_${Date.now()}`,
      reported_at: new Date().toISOString(),
      ...issue
    })

    await this.writeJSON(filePath, existingIssues)
  }

  // Configuration des paramètres d'appel
  async getCallParameters(): Promise<any> {
    const configPath = `${this.getConfigPath()}/call_parameters.json`
    return await this.readJSON(configPath) || {
      retry_attempts: 3,
      call_timeout: 180,
      default_call_time: '14:00',
      max_daily_calls: 100
    }
  }

  async saveCallParameters(parameters: any): Promise<void> {
    const configPath = `${this.getConfigPath()}/call_parameters.json`
    await this.writeJSON(configPath, parameters)
  }

  // Nettoyage du cache
  clearCache(): void {
    this.cache.clear()
  }

  // Export des données
  async exportCalls(filters: CallFilters, format: 'csv' | 'json'): Promise<string> {
    const calls = await this.searchCalls(filters)
    
    if (format === 'json') {
      return JSON.stringify(calls, null, 2)
    } else if (format === 'csv') {
      const headers = [
        'ID Appel',
        'Timestamp',
        'Nom Patient',
        'Prénom Patient',
        'Date Naissance',
        'Téléphone',
        'Site',
        'Date Sortie',
        'Médecin',
        'Service',
        'Date Prévue',
        'Date Réelle',
        'Durée (s)',
        'Statut',
        'Score'
      ].join(',')

      const rows = calls.map(call => [
        call.call_id,
        call.timestamp,
        call.patient.nom,
        call.patient.prenom,
        call.patient.date_naissance,
        call.patient.telephone,
        call.hospital_data.site,
        call.hospital_data.date_sortie,
        call.hospital_data.medecin,
        call.hospital_data.service,
        call.call_data.date_prevue,
        call.call_data.date_reelle,
        call.call_data.duree_secondes,
        call.call_data.statut,
        call.score
      ].join(','))

      return [headers, ...rows].join('\n')
    }
    
    throw new Error(`Format d'export non supporté: ${format}`)
  }
}

export const jsonStorageService = new JSONStorageService() 