// Service de gestion du dialogue JADE avec Rasa
import { JadeDialogueConfig, JadeDialogueStep, DialogueResult } from '@/types/calls'

class JadeDialogueService {
  private config: JadeDialogueConfig = {
    hospital_name: 'Hôpital Saint-Louis',
    call_duration_minutes: 3,
    retry_attempts: 3,
    timeout_seconds: 30,
    steps: [
      {
        step: 1,
        type: 'introduction',
        question: 'Bonjour, je suis Jade, votre assistant vocal de l\'hôpital {hospital_name}. Cet appel dure {duration} minutes et est transmis à votre équipe médicale. Je m\'adresse bien à {prenom} {nom} ?',
        next_step: 2,
        fallback_step: 1
      },
      {
        step: 2,
        type: 'identity_verification',
        question: 'Pour votre sécurité, confirmez votre date de naissance. Dites-moi : jour, mois, année.',
        expected_response: 'date_format',
        validation_rules: {
          type: 'date',
          format: 'DD/MM/YYYY'
        },
        next_step: 3,
        fallback_step: 2
      },
      {
        step: 3,
        type: 'question',
        question: 'Votre douleur aujourd\'hui, de 0 à 10 ?',
        expected_response: 'pain_scale',
        validation_rules: {
          type: 'number',
          min: 0,
          max: 10
        },
        next_step: 4,
        fallback_step: 3
      },
      {
        step: 4,
        type: 'question',
        question: 'Où avez-vous mal ?',
        expected_response: 'pain_location',
        validation_rules: {
          type: 'text',
          required: false,
          condition: 'previous_answer > 0'
        },
        next_step: 5,
        fallback_step: 5
      },
      {
        step: 5,
        type: 'question',
        question: 'Prenez-vous vos médicaments comme prescrit ? Répondez par oui ou non.',
        expected_response: 'medication_compliance',
        validation_rules: {
          type: 'boolean',
          keywords: {
            positive: ['oui', 'yes', 'correct', 'vrai'],
            negative: ['non', 'no', 'incorrect', 'faux']
          }
        },
        next_step: 6,
        fallback_step: 5
      },
      {
        step: 6,
        type: 'question',
        question: 'Allez-vous aux toilettes normalement ? Oui ou non ?',
        expected_response: 'transit_normal',
        validation_rules: {
          type: 'boolean',
          keywords: {
            positive: ['oui', 'yes', 'normal', 'correct'],
            negative: ['non', 'no', 'anormal', 'probleme']
          }
        },
        next_step: 7,
        fallback_step: 6
      },
      {
        step: 7,
        type: 'question',
        question: 'Quel est le problème ?',
        expected_response: 'transit_problem',
        validation_rules: {
          type: 'text',
          required: false,
          condition: 'previous_answer === false'
        },
        next_step: 8,
        fallback_step: 8
      },
      {
        step: 8,
        type: 'question',
        question: 'Votre moral aujourd\'hui, de 0 à 10 ?',
        expected_response: 'mood_scale',
        validation_rules: {
          type: 'number',
          min: 0,
          max: 10
        },
        next_step: 9,
        fallback_step: 8
      },
      {
        step: 9,
        type: 'question',
        question: 'Que ressentez-vous exactement ?',
        expected_response: 'mood_details',
        validation_rules: {
          type: 'text',
          required: false,
          condition: 'previous_answer < 7'
        },
        next_step: 10,
        fallback_step: 10
      },
      {
        step: 10,
        type: 'question',
        question: 'Avez-vous de la fièvre ? Oui ou non ?',
        expected_response: 'fever',
        validation_rules: {
          type: 'boolean',
          keywords: {
            positive: ['oui', 'yes', 'fièvre', 'fever'],
            negative: ['non', 'no', 'pas de fièvre']
          }
        },
        next_step: 11,
        fallback_step: 10
      },
      {
        step: 11,
        type: 'question',
        question: 'Quelle température ?',
        expected_response: 'temperature',
        validation_rules: {
          type: 'temperature',
          required: false,
          condition: 'previous_answer === true',
          format: 'XX.X°C'
        },
        next_step: 12,
        fallback_step: 12
      },
      {
        step: 12,
        type: 'question',
        question: 'Autre chose à signaler ? Une phrase suffit.',
        expected_response: 'other_complaints',
        validation_rules: {
          type: 'text',
          required: false,
          max_length: 200
        },
        next_step: 13,
        fallback_step: 13
      },
      {
        step: 13,
        type: 'closing',
        question: 'Merci {prenom}. Vos réponses sont transmises à votre médecin. Si besoin, vous serez recontacté dans les 24h. Bonne journée, c\'était Jade.',
        next_step: -1
      }
    ]
  }

  private currentStep = 1
  private dialogueState: Partial<DialogueResult> = {}
  private retryCount = 0
  private rasaEndpoint = 'http://localhost:5005'

  // Initialiser le dialogue
  async initializeDialogue(patientData: any): Promise<string> {
    this.currentStep = 1
    this.dialogueState = {}
    this.retryCount = 0

    const step = this.config.steps.find(s => s.step === this.currentStep)
    if (!step) throw new Error('Étape de dialogue non trouvée')

    return this.formatQuestion(step.question, patientData)
  }

  // Traiter une réponse du patient
  async processResponse(response: string, patientData: any): Promise<{
    nextQuestion: string
    isComplete: boolean
    dialogueResult: Partial<DialogueResult>
  }> {
    try {
      // Envoyer à Rasa pour traitement
      const rasaResponse = await this.sendToRasa(response)
      
      // Valider la réponse selon les règles
      const validation = this.validateResponse(response, this.currentStep)
      
      if (validation.isValid) {
        // Sauvegarder la réponse
        this.saveResponse(response, this.currentStep)
        
        // Passer à l'étape suivante
        const currentStepConfig = this.config.steps.find(s => s.step === this.currentStep)
        if (currentStepConfig) {
          this.currentStep = currentStepConfig.next_step
          this.retryCount = 0
        }
      } else {
        // Gérer les retry
        this.retryCount++
        if (this.retryCount >= this.config.retry_attempts) {
          // Passer à l'étape suivante malgré l'échec
          const currentStepConfig = this.config.steps.find(s => s.step === this.currentStep)
          if (currentStepConfig?.fallback_step) {
            this.currentStep = currentStepConfig.fallback_step
          } else {
            this.currentStep++
          }
          this.retryCount = 0
        }
      }

      // Vérifier si le dialogue est terminé
      if (this.currentStep === -1 || this.currentStep > this.config.steps.length) {
        return {
          nextQuestion: '',
          isComplete: true,
          dialogueResult: this.dialogueState as DialogueResult
        }
      }

      // Obtenir la prochaine question
      const nextStep = this.config.steps.find(s => s.step === this.currentStep)
      if (!nextStep) {
        throw new Error('Étape de dialogue non trouvée')
      }

      const nextQuestion = this.formatQuestion(nextStep.question, patientData)

      return {
        nextQuestion,
        isComplete: false,
        dialogueResult: this.dialogueState
      }

    } catch (error) {
      console.error('Erreur lors du traitement de la réponse:', error)
      throw error
    }
  }

  // Envoyer à Rasa
  private async sendToRasa(message: string): Promise<any> {
    try {
      const response = await fetch(`${this.rasaEndpoint}/webhooks/rest/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: 'patient',
          message: message
        })
      })

      if (!response.ok) {
        throw new Error(`Erreur Rasa: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur de communication avec Rasa:', error)
      // Retourner une réponse par défaut en cas d'erreur
      return [{ text: 'Je n\'ai pas compris, pouvez-vous répéter ?' }]
    }
  }

  // Valider une réponse
  private validateResponse(response: string, stepNumber: number): { isValid: boolean; error?: string } {
    const step = this.config.steps.find(s => s.step === stepNumber)
    if (!step || !step.validation_rules) {
      return { isValid: true }
    }

    const rules = step.validation_rules
    const cleanResponse = response.toLowerCase().trim()

    switch (rules.type) {
      case 'number':
        const num = parseInt(cleanResponse)
        if (isNaN(num) || num < rules.min || num > rules.max) {
          return { 
            isValid: false, 
            error: `Veuillez donner un nombre entre ${rules.min} et ${rules.max}` 
          }
        }
        break

      case 'boolean':
        const positiveKeywords = rules.keywords.positive || []
        const negativeKeywords = rules.keywords.negative || []
        
        const isPositive = positiveKeywords.some(keyword => cleanResponse.includes(keyword))
        const isNegative = negativeKeywords.some(keyword => cleanResponse.includes(keyword))
        
        if (!isPositive && !isNegative) {
          return { 
            isValid: false, 
            error: 'Veuillez répondre par oui ou non' 
          }
        }
        break

      case 'date':
        // Validation basique du format date
        const dateRegex = /(\d{1,2})\/(\d{1,2})\/(\d{4})/
        if (!dateRegex.test(cleanResponse)) {
          return { 
            isValid: false, 
            error: 'Veuillez donner votre date de naissance au format JJ/MM/AAAA' 
          }
        }
        break

      case 'temperature':
        const tempRegex = /(\d{1,2}[,.]?\d*)\s*°?[Cc]/
        if (!tempRegex.test(cleanResponse)) {
          return { 
            isValid: false, 
            error: 'Veuillez donner la température au format XX.X°C' 
          }
        }
        break

      case 'text':
        if (rules.required && !cleanResponse) {
          return { 
            isValid: false, 
            error: 'Une réponse est requise' 
          }
        }
        if (rules.max_length && cleanResponse.length > rules.max_length) {
          return { 
            isValid: false, 
            error: `Réponse trop longue (max ${rules.max_length} caractères)` 
          }
        }
        break
    }

    return { isValid: true }
  }

  // Sauvegarder une réponse
  private saveResponse(response: string, stepNumber: number): void {
    const step = this.config.steps.find(s => s.step === stepNumber)
    if (!step) return

    const cleanResponse = response.toLowerCase().trim()

    switch (step.expected_response) {
      case 'pain_scale':
        this.dialogueState.douleur_niveau = parseInt(cleanResponse)
        break

      case 'pain_location':
        this.dialogueState.douleur_localisation = response
        break

      case 'medication_compliance':
        const medKeywords = step.validation_rules?.keywords
        if (medKeywords) {
          const isPositive = medKeywords.positive.some(keyword => cleanResponse.includes(keyword))
          this.dialogueState.traitement_suivi = isPositive
        }
        break

      case 'transit_normal':
        const transitKeywords = step.validation_rules?.keywords
        if (transitKeywords) {
          const isPositive = transitKeywords.positive.some(keyword => cleanResponse.includes(keyword))
          this.dialogueState.transit_normal = isPositive
        }
        break

      case 'transit_problem':
        this.dialogueState.probleme_transit = response
        break

      case 'mood_scale':
        this.dialogueState.moral_niveau = parseInt(cleanResponse)
        break

      case 'mood_details':
        this.dialogueState.moral_details = response
        break

      case 'fever':
        const feverKeywords = step.validation_rules?.keywords
        if (feverKeywords) {
          const isPositive = feverKeywords.positive.some(keyword => cleanResponse.includes(keyword))
          this.dialogueState.fievre = isPositive
        }
        break

      case 'temperature':
        const tempMatch = cleanResponse.match(/(\d{1,2}[,.]?\d*)/)
        if (tempMatch) {
          this.dialogueState.temperature = tempMatch[1]
        }
        break

      case 'other_complaints':
        this.dialogueState.autres_plaintes = response
        break

      case 'date_format':
        // Validation de l'identité
        this.dialogueState.identite_verifiee = true
        break
    }
  }

  // Formater une question avec les données du patient
  private formatQuestion(question: string, patientData: any): string {
    return question
      .replace('{hospital_name}', this.config.hospital_name)
      .replace('{duration}', this.config.call_duration_minutes.toString())
      .replace('{prenom}', patientData.prenom || '')
      .replace('{nom}', patientData.nom || '')
  }

  // Calculer le score de l'appel
  calculateScore(dialogueResult: DialogueResult): number {
    let score = 100

    // Réductions basées sur les réponses
    if (dialogueResult.douleur_niveau > 5) score -= 20
    if (!dialogueResult.traitement_suivi) score -= 15
    if (!dialogueResult.transit_normal) score -= 10
    if (dialogueResult.moral_niveau < 5) score -= 15
    if (dialogueResult.fievre) score -= 20

    // Analyse des mots-clés urgents
    const urgentKeywords = this.detectUrgency(dialogueResult.autres_plaintes || '')
    if (urgentKeywords.found) score -= 20

    return Math.max(0, score)
  }

  // Détecter l'urgence dans les plaintes
  private detectUrgency(complaints: string): { found: boolean; keywords: string[] } {
    const urgentKeywords = [
      'douleur', 'saignement', 'fièvre', 'essoufflement', 'douleur thoracique',
      'perte de conscience', 'paralysie', 'convulsion', 'œdème', 'infection'
    ]

    const foundKeywords = urgentKeywords.filter(keyword => 
      complaints.toLowerCase().includes(keyword)
    )

    return {
      found: foundKeywords.length > 0,
      keywords: foundKeywords
    }
  }

  // Obtenir la configuration du dialogue
  getConfig(): JadeDialogueConfig {
    return this.config
  }

  // Mettre à jour la configuration
  updateConfig(newConfig: Partial<JadeDialogueConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

export const jadeDialogueService = new JadeDialogueService() 