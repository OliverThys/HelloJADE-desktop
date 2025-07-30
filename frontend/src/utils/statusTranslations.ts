// Traductions des statuts d'appels
export const callStatusTranslations = {
  pending: 'En attente',
  called: 'Appelé',
  failed: 'Échoué',
  in_progress: 'En cours'
} as const

// Types TypeScript pour les statuts
export type CallStatus = keyof typeof callStatusTranslations
export type CallStatusFrench = typeof callStatusTranslations[CallStatus]

// Fonction pour traduire un statut
export function translateCallStatus(status: CallStatus): CallStatusFrench {
  return callStatusTranslations[status] || 'Inconnu'
}

// Fonction pour obtenir la couleur d'un statut
export function getCallStatusColor(status: CallStatus): string {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    called: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200'
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

// Fonction pour obtenir l'icône d'un statut
export function getCallStatusIcon(status: CallStatus): string {
  const icons = {
    pending: '⏳',
    called: '✅',
    failed: '❌',
    in_progress: '📞'
  }
  return icons[status] || '❓'
}

// Fonction pour obtenir la description d'un statut
export function getCallStatusDescription(status: CallStatus): string {
  const descriptions = {
    pending: 'Appel programmé, en attente d\'exécution',
    called: 'Appel effectué avec succès',
    failed: 'Appel échoué ou annulé',
    in_progress: 'Appel en cours d\'exécution'
  }
  return descriptions[status] || 'Statut inconnu'
}

// Fonction pour filtrer les statuts valides
export function isValidCallStatus(status: string): status is CallStatus {
  return status in callStatusTranslations
}

// Fonction pour obtenir tous les statuts disponibles
export function getAllCallStatuses(): CallStatus[] {
  return Object.keys(callStatusTranslations) as CallStatus[]
}

// Fonction pour obtenir toutes les traductions
export function getAllCallStatusTranslations(): Record<CallStatus, CallStatusFrench> {
  return callStatusTranslations
} 