// Types pour le système d'appels HelloJADE avec architecture JSON

export interface CallPatient {
  id: string
  nom: string
  prenom: string
  date_naissance: string
  telephone: string
}

export interface HospitalData {
  site: string
  date_sortie: string
  medecin: string
  service: string
}

export interface CallData {
  date_prevue: string
  date_reelle: string
  duree_secondes: number
  statut: 'pending' | 'complete' | 'failed' | 'in_progress'
  tentatives: number
}

export interface DialogueResult {
  patient_confirme: boolean
  identite_verifiee: boolean
  douleur_niveau: number
  douleur_localisation?: string
  traitement_suivi: boolean
  transit_normal: boolean
  probleme_transit?: string
  moral_niveau: number
  moral_details?: string
  fievre: boolean
  temperature?: string
  autres_plaintes?: string
}

export interface CallRecord {
  call_id: string
  timestamp: string
  patient: CallPatient
  hospital_data: HospitalData
  call_data: CallData
  dialogue_result: DialogueResult
  score: number
  recording_path?: string
  transcription?: string
  analysis?: CallAnalysis
}

export interface CallAnalysis {
  urgency_level: 'low' | 'medium' | 'high' | 'critical'
  risk_factors: string[]
  recommendations: string[]
  follow_up_needed: boolean
  follow_up_priority: 'low' | 'medium' | 'high'
}

export interface CallFilters {
  search: string
  status: string
  site: string
  service: string
  fromDate: string
  toDate: string
  doctor: string
  scoreRange: {
    min: number
    max: number
  }
}

export interface CallIndex {
  month: string
  total_calls: number
  calls: {
    call_id: string
    timestamp: string
    patient_name: string
    status: string
    score: number
  }[]
}

export interface CallSummary {
  call_id: string
  patient_name: string
  call_date: string
  duration: string
  score: number
  status: string
  key_issues: string[]
  follow_up_required: boolean
}

export interface CallStatistics {
  total_calls: number
  completed_calls: number
  failed_calls: number
  pending_calls: number
  average_score: number
  average_duration: number
  calls_by_site: Record<string, number>
  calls_by_service: Record<string, number>
  calls_by_status: Record<string, number>
}

export interface JadeDialogueStep {
  step: number
  type: 'introduction' | 'identity_verification' | 'question' | 'closing'
  question: string
  expected_response?: string
  validation_rules?: any
  next_step: number
  fallback_step?: number
}

export interface JadeDialogueConfig {
  hospital_name: string
  call_duration_minutes: number
  steps: JadeDialogueStep[]
  retry_attempts: number
  timeout_seconds: number
}

export interface CallExportOptions {
  format: 'csv' | 'excel' | 'pdf'
  dateRange: {
    from: string
    to: string
  }
  filters: CallFilters
  includeDetails: boolean
}

export interface CallIssue {
  id: string
  call_id: string
  reported_at: string
  issue_type: 'technical' | 'medical' | 'communication' | 'other'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  assigned_to?: string
  resolution?: string
} 