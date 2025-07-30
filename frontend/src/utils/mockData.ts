// Données de test pour le système d'appels HelloJADE
import type { CallRecord } from '@/types/calls'

export const mockCalls: CallRecord[] = [
  {
    call_id: 'call_1704067200000',
    timestamp: '2025-01-01T10:00:00Z',
    patient: {
      id: 'P001',
      nom: 'DUPONT',
      prenom: 'Marie',
      date_naissance: '1970-03-15',
      telephone: '+33612345678'
    },
    hospital_data: {
      site: 'Hôpital Saint-Louis',
      date_sortie: '2024-12-28',
      medecin: 'Dr Martin',
      service: 'Cardiologie'
    },
    call_data: {
      date_prevue: '2025-01-01T10:00:00Z',
      date_reelle: '2025-01-01T10:05:00Z',
      duree_secondes: 185,
      statut: 'complete',
      tentatives: 1
    },
    dialogue_result: {
      patient_confirme: true,
      identite_verifiee: true,
      douleur_niveau: 3,
      douleur_localisation: 'poitrine légère',
      traitement_suivi: true,
      transit_normal: true,
      probleme_transit: null,
      moral_niveau: 7,
      moral_details: null,
      fievre: false,
      temperature: null,
      autres_plaintes: 'fatigue le soir'
    },
    score: 85,
    recording_path: 'call-recordings/2025/01/01/call_1704067200000.wav',
    transcription: 'Bonjour, je suis Jade, votre assistant vocal de l\'hôpital Saint-Louis. Cet appel dure 3 minutes et est transmis à votre équipe médicale. Je m\'adresse bien à Marie DUPONT ? Oui, c\'est moi. Pour votre sécurité, confirmez votre date de naissance. Dites-moi : jour, mois, année. 15 mars 1970. Votre douleur aujourd\'hui, de 0 à 10 ? 3. Où avez-vous mal ? Poitrine légère. Prenez-vous vos médicaments comme prescrit ? Répondez par oui ou non. Oui. Allez-vous aux toilettes normalement ? Oui ou non ? Oui. Votre moral aujourd\'hui, de 0 à 10 ? 7. Avez-vous de la fièvre ? Oui ou non ? Non. Autre chose à signaler ? Une phrase suffit. Fatigue le soir. Merci Marie. Vos réponses sont transmises à votre médecin. Si besoin, vous serez recontacté dans les 24h. Bonne journée, c\'était Jade.',
    analysis: {
      urgency_level: 'low',
      risk_factors: ['Fatigue persistante'],
      recommendations: ['Surveiller la fatigue', 'Maintenir le traitement prescrit'],
      follow_up_needed: false,
      follow_up_priority: 'low'
    }
  },
  {
    call_id: 'call_1704153600000',
    timestamp: '2025-01-02T10:00:00Z',
    patient: {
      id: 'P002',
      nom: 'MARTIN',
      prenom: 'Jean',
      date_naissance: '1955-08-22',
      telephone: '+33623456789'
    },
    hospital_data: {
      site: 'Hôpital Saint-Louis',
      date_sortie: '2024-12-29',
      medecin: 'Dr Dubois',
      service: 'Pneumologie'
    },
    call_data: {
      date_prevue: '2025-01-02T10:00:00Z',
      date_reelle: '2025-01-02T10:15:00Z',
      duree_secondes: 245,
      statut: 'complete',
      tentatives: 2
    },
    dialogue_result: {
      patient_confirme: true,
      identite_verifiee: true,
      douleur_niveau: 7,
      douleur_localisation: 'poitrine droite',
      traitement_suivi: false,
      transit_normal: false,
      probleme_transit: 'constipation',
      moral_niveau: 4,
      moral_details: 'anxiété due à la douleur',
      fievre: true,
      temperature: '38.2°C',
      autres_plaintes: 'essoufflement à l\'effort'
    },
    score: 35,
    recording_path: 'call-recordings/2025/01/02/call_1704153600000.wav',
    transcription: 'Bonjour, je suis Jade, votre assistant vocal de l\'hôpital Saint-Louis. Cet appel dure 3 minutes et est transmis à votre équipe médicale. Je m\'adresse bien à Jean MARTIN ? Oui. Pour votre sécurité, confirmez votre date de naissance. Dites-moi : jour, mois, année. 22 août 1955. Votre douleur aujourd\'hui, de 0 à 10 ? 7. Où avez-vous mal ? Poitrine droite. Prenez-vous vos médicaments comme prescrit ? Répondez par oui ou non. Non, j\'ai oublié hier. Allez-vous aux toilettes normalement ? Oui ou non ? Non. Quel est le problème ? Constipation. Votre moral aujourd\'hui, de 0 à 10 ? 4. Que ressentez-vous exactement ? Anxiété due à la douleur. Avez-vous de la fièvre ? Oui ou non ? Oui. Quelle température ? 38.2°C. Autre chose à signaler ? Une phrase suffit. Essoufflement à l\'effort. Merci Jean. Vos réponses sont transmises à votre médecin. Si besoin, vous serez recontacté dans les 24h. Bonne journée, c\'était Jade.',
    analysis: {
      urgency_level: 'high',
      risk_factors: ['Douleur thoracique', 'Fièvre', 'Non-respect du traitement', 'Essoufflement'],
      recommendations: ['Consultation médicale urgente', 'Reprise immédiate du traitement', 'Surveillance de la température'],
      follow_up_needed: true,
      follow_up_priority: 'high'
    }
  },
  {
    call_id: 'call_1704240000000',
    timestamp: '2025-01-03T10:00:00Z',
    patient: {
      id: 'P003',
      nom: 'BERNARD',
      prenom: 'Sophie',
      date_naissance: '1982-11-10',
      telephone: '+33634567890'
    },
    hospital_data: {
      site: 'Hôpital Saint-Louis',
      date_sortie: '2024-12-30',
      medecin: 'Dr Leroy',
      service: 'Gastro-entérologie'
    },
    call_data: {
      date_prevue: '2025-01-03T10:00:00Z',
      date_reelle: '2025-01-03T10:00:00Z',
      duree_secondes: 0,
      statut: 'pending',
      tentatives: 0
    },
    dialogue_result: {
      patient_confirme: false,
      identite_verifiee: false,
      douleur_niveau: 0,
      traitement_suivi: false,
      transit_normal: false,
      moral_niveau: 0,
      fievre: false
    },
    score: 100
  },
  {
    call_id: 'call_1704326400000',
    timestamp: '2025-01-04T10:00:00Z',
    patient: {
      id: 'P004',
      nom: 'PETIT',
      prenom: 'Pierre',
      date_naissance: '1968-05-18',
      telephone: '+33645678901'
    },
    hospital_data: {
      site: 'Hôpital Saint-Louis',
      date_sortie: '2024-12-31',
      medecin: 'Dr Moreau',
      service: 'Neurologie'
    },
    call_data: {
      date_prevue: '2025-01-04T10:00:00Z',
      date_reelle: '2025-01-04T10:30:00Z',
      duree_secondes: 0,
      statut: 'failed',
      tentatives: 3
    },
    dialogue_result: {
      patient_confirme: false,
      identite_verifiee: false,
      douleur_niveau: 0,
      traitement_suivi: false,
      transit_normal: false,
      moral_niveau: 0,
      fievre: false
    },
    score: 100
  },
  {
    call_id: 'call_1704412800000',
    timestamp: '2025-01-05T10:00:00Z',
    patient: {
      id: 'P005',
      nom: 'ROBERT',
      prenom: 'Claire',
      date_naissance: '1975-12-03',
      telephone: '+33656789012'
    },
    hospital_data: {
      site: 'Hôpital Saint-Louis',
      date_sortie: '2025-01-01',
      medecin: 'Dr Simon',
      service: 'Endocrinologie'
    },
    call_data: {
      date_prevue: '2025-01-05T10:00:00Z',
      date_reelle: '2025-01-05T10:02:00Z',
      duree_secondes: 165,
      statut: 'complete',
      tentatives: 1
    },
    dialogue_result: {
      patient_confirme: true,
      identite_verifiee: true,
      douleur_niveau: 1,
      douleur_localisation: null,
      traitement_suivi: true,
      transit_normal: true,
      probleme_transit: null,
      moral_niveau: 8,
      moral_details: null,
      fievre: false,
      temperature: null,
      autres_plaintes: null
    },
    score: 95,
    recording_path: 'call-recordings/2025/01/05/call_1704412800000.wav',
    transcription: 'Bonjour, je suis Jade, votre assistant vocal de l\'hôpital Saint-Louis. Cet appel dure 3 minutes et est transmis à votre équipe médicale. Je m\'adresse bien à Claire ROBERT ? Oui, c\'est moi. Pour votre sécurité, confirmez votre date de naissance. Dites-moi : jour, mois, année. 3 décembre 1975. Votre douleur aujourd\'hui, de 0 à 10 ? 1. Prenez-vous vos médicaments comme prescrit ? Répondez par oui ou non. Oui. Allez-vous aux toilettes normalement ? Oui ou non ? Oui. Votre moral aujourd\'hui, de 0 à 10 ? 8. Avez-vous de la fièvre ? Oui ou non ? Non. Autre chose à signaler ? Une phrase suffit. Non, tout va bien. Merci Claire. Vos réponses sont transmises à votre médecin. Si besoin, vous serez recontacté dans les 24h. Bonne journée, c\'était Jade.',
    analysis: {
      urgency_level: 'low',
      risk_factors: [],
      recommendations: ['Continuer le suivi actuel'],
      follow_up_needed: false,
      follow_up_priority: 'low'
    }
  }
]

// Fonction pour générer des données de test supplémentaires
export function generateMockCalls(count: number): CallRecord[] {
  const calls: CallRecord[] = []
  const sites = ['Hôpital Saint-Louis', 'Hôpital Central', 'Clinique Sud', 'Centre Médical Nord']
  const services = ['Cardiologie', 'Pneumologie', 'Gastro-entérologie', 'Neurologie', 'Endocrinologie', 'Dermatologie']
  const medecins = ['Dr Martin', 'Dr Dubois', 'Dr Leroy', 'Dr Moreau', 'Dr Simon', 'Dr Durand', 'Dr Petit', 'Dr Roux']
  const noms = ['DUPONT', 'MARTIN', 'BERNARD', 'PETIT', 'ROBERT', 'RICHARD', 'DURAND', 'MOREAU', 'SIMON', 'MICHEL']
  const prenoms = ['Marie', 'Jean', 'Sophie', 'Pierre', 'Claire', 'Paul', 'Anne', 'Michel', 'Isabelle', 'François']

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(2025, 0, 1 + i, 10, 0, 0).toISOString()
    const callId = `call_${Date.now() + i}`
    const patientId = `P${String(i + 6).padStart(3, '0')}`
    const nom = noms[Math.floor(Math.random() * noms.length)]
    const prenom = prenoms[Math.floor(Math.random() * prenoms.length)]
    const site = sites[Math.floor(Math.random() * sites.length)]
    const service = services[Math.floor(Math.random() * services.length)]
    const medecin = medecins[Math.floor(Math.random() * medecins.length)]
    const statut = ['pending', 'complete', 'failed'][Math.floor(Math.random() * 3)]
    const score = Math.floor(Math.random() * 100) + 1

    const call: CallRecord = {
      call_id: callId,
      timestamp,
      patient: {
        id: patientId,
        nom,
        prenom,
        date_naissance: `${1950 + Math.floor(Math.random() * 50)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        telephone: `+336${Math.floor(Math.random() * 90000000) + 10000000}`
      },
      hospital_data: {
        site,
        date_sortie: new Date(new Date(timestamp).getTime() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        medecin,
        service
      },
      call_data: {
        date_prevue: timestamp,
        date_reelle: statut === 'pending' ? timestamp : new Date(new Date(timestamp).getTime() + Math.floor(Math.random() * 30) * 60 * 1000).toISOString(),
        duree_secondes: statut === 'complete' ? Math.floor(Math.random() * 300) + 60 : 0,
        statut: statut as any,
        tentatives: Math.floor(Math.random() * 3) + 1
      },
      dialogue_result: {
        patient_confirme: statut === 'complete',
        identite_verifiee: statut === 'complete',
        douleur_niveau: statut === 'complete' ? Math.floor(Math.random() * 11) : 0,
        douleur_localisation: statut === 'complete' && Math.random() > 0.5 ? ['poitrine', 'tête', 'dos', 'ventre'][Math.floor(Math.random() * 4)] : null,
        traitement_suivi: statut === 'complete' ? Math.random() > 0.2 : false,
        transit_normal: statut === 'complete' ? Math.random() > 0.3 : false,
        probleme_transit: statut === 'complete' && Math.random() > 0.7 ? ['constipation', 'diarrhée'][Math.floor(Math.random() * 2)] : null,
        moral_niveau: statut === 'complete' ? Math.floor(Math.random() * 11) : 0,
        moral_details: statut === 'complete' && Math.random() > 0.8 ? 'anxiété' : null,
        fievre: statut === 'complete' ? Math.random() > 0.8 : false,
        temperature: statut === 'complete' && Math.random() > 0.8 ? `${37 + Math.random() * 2}`.slice(0, 4) + '°C' : null,
        autres_plaintes: statut === 'complete' && Math.random() > 0.6 ? ['fatigue', 'insomnie', 'perte d\'appétit'][Math.floor(Math.random() * 3)] : null
      },
      score
    }

    calls.push(call)
  }

  return calls
} 