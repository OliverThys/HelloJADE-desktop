import { translateCallStatus, getAllCallStatuses } from './statusTranslations'
import type { CallStatus } from './statusTranslations'

export interface CallStats {
  total: number
  byStatus: Record<CallStatus, number>
  byStatusTranslated: Record<string, number>
  successRate: number
  averageScore: number
  averageDuration: number
}

export interface Call {
  statut: CallStatus
  score?: number
  duree_secondes?: number
  date_appel_reelle?: string
}

export function calculateCallStats(calls: Call[]): CallStats {
  const total = calls.length
  
  // Statistiques par statut
  const byStatus: Record<CallStatus, number> = {
    pending: 0,
    called: 0,
    failed: 0,
    in_progress: 0
  }
  
  // Statistiques par statut traduit
  const byStatusTranslated: Record<string, number> = {}
  
  // Autres métriques
  let totalScore = 0
  let totalDuration = 0
  let completedCalls = 0
  let successfulCalls = 0
  
  calls.forEach(call => {
    // Compter par statut
    if (call.statut in byStatus) {
      byStatus[call.statut]++
    }
    
    // Compter par statut traduit
    const translatedStatus = translateCallStatus(call.statut)
    byStatusTranslated[translatedStatus] = (byStatusTranslated[translatedStatus] || 0) + 1
    
    // Calculer les scores
    if (call.score !== undefined && call.score !== null) {
      totalScore += call.score
      completedCalls++
    }
    
    // Calculer les durées
    if (call.duree_secondes !== undefined && call.duree_secondes !== null) {
      totalDuration += call.duree_secondes
    }
    
    // Compter les appels réussis
    if (call.statut === 'called') {
      successfulCalls++
    }
  })
  
  return {
    total,
    byStatus,
    byStatusTranslated,
    successRate: total > 0 ? Math.round((successfulCalls / total) * 100) : 0,
    averageScore: completedCalls > 0 ? Math.round(totalScore / completedCalls) : 0,
    averageDuration: total > 0 ? Math.round(totalDuration / total) : 0
  }
}

export function getStatusDistribution(calls: Call[]) {
  const stats = calculateCallStats(calls)
  
  return getAllCallStatuses().map(status => ({
    status,
    label: translateCallStatus(status),
    count: stats.byStatus[status],
    percentage: stats.total > 0 ? Math.round((stats.byStatus[status] / stats.total) * 100) : 0
  }))
}

export function getCallTrends(calls: Call[], days: number = 7) {
  const today = new Date()
  const trends = []
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const dayCalls = calls.filter(call => 
      call.date_appel_reelle && call.date_appel_reelle.startsWith(dateStr)
    )
    
    const dayStats = calculateCallStats(dayCalls)
    
    trends.push({
      date: dateStr,
      label: date.toLocaleDateString('fr-FR', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      total: dayStats.total,
      successful: dayStats.byStatus.called,
      failed: dayStats.byStatus.failed,
      pending: dayStats.byStatus.pending
    })
  }
  
  return trends
} 