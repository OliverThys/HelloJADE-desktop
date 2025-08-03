import { ref } from 'vue'
import { useNotifications } from '@/composables/useNotifications'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ExportOptions {
  format: 'json' | 'csv' | 'excel' | 'pdf'
  filename?: string
  includeHeaders?: boolean
  dateFormat?: string
  locale?: string
}

export interface ImportOptions {
  format: 'json' | 'csv' | 'excel'
  validateData?: boolean
  onProgress?: (progress: number) => void
}

export function useExport() {
  const { showSuccess, showError } = useNotifications()
  const isExporting = ref(false)
  const isImporting = ref(false)

  // Fonction pour convertir une date en format localisé
  const formatDate = (date: string | Date, format: string = 'fr-FR') => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString(format, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Fonction pour convertir des données en CSV
  const convertToCSV = (data: any[], headers?: string[]) => {
    if (data.length === 0) return ''

    const csvHeaders = headers || Object.keys(data[0])
    const csvRows = [csvHeaders.join(',')]

    data.forEach(row => {
      const values = csvHeaders.map(header => {
        const value = row[header]
        if (value == null) return ''
        
        // Échapper les virgules et guillemets
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })
      csvRows.push(values.join(','))
    })

    return csvRows.join('\n')
  }

  // Fonction pour convertir des données en JSON
  const convertToJSON = (data: any[], pretty: boolean = true) => {
    return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)
  }

  // Fonction pour télécharger un fichier
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Fonction pour exporter en Excel (compatibilité)
  const exportToExcel = (data: any[], filename: string = 'export.xlsx') => {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, filename)
  }

  // Fonction d'export principal
  const exportData = async (
    data: any[],
    options: ExportOptions
  ) => {
    try {
      isExporting.value = true
      
      const {
        format,
        filename = `export_${new Date().toISOString().split('T')[0]}`,
        includeHeaders = true,
        dateFormat = 'fr-FR',
        locale = 'fr-FR'
      } = options

      let content: string
      let finalFilename: string
      let mimeType: string

      switch (format) {
        case 'json':
          content = convertToJSON(data)
          finalFilename = `${filename}.json`
          mimeType = 'application/json'
          break

        case 'csv':
          const headers = includeHeaders ? Object.keys(data[0] || {}) : []
          content = convertToCSV(data, headers)
          finalFilename = `${filename}.csv`
          mimeType = 'text/csv'
          break

        case 'excel':
          // Pour Excel, on utilise CSV avec l'extension .xlsx
          const excelHeaders = includeHeaders ? Object.keys(data[0] || {}) : []
          content = convertToCSV(data, excelHeaders)
          finalFilename = `${filename}.xlsx`
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          break

        case 'pdf':
          // Pour PDF, on génère d'abord du HTML puis on le convertit
          content = generatePDFContent(data, dateFormat, locale)
          finalFilename = `${filename}.html` // Temporaire, à convertir en PDF
          mimeType = 'text/html'
          break

        default:
          throw new Error(`Format d'export non supporté: ${format}`)
      }

      downloadFile(content, finalFilename, mimeType)
      showSuccess('Export réussi', `Export ${format.toUpperCase()} réussi`)
      
      return finalFilename
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      showError('Erreur d\'export', 'Erreur lors de l\'export')
      throw error
    } finally {
      isExporting.value = false
    }
  }

  // Fonction pour générer le contenu HTML pour PDF
  const generatePDFContent = (data: any[], dateFormat: string, locale: string) => {
    const tableRows = data.map(row => {
      const cells = Object.values(row).map(value => {
        if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) {
          return `<td>${formatDate(value, dateFormat)}</td>`
        }
        return `<td>${value || ''}</td>`
      })
      return `<tr>${cells.join('')}</tr>`
    }).join('')

    const headers = Object.keys(data[0] || {})
    const headerCells = headers.map(header => `<th>${header}</th>`).join('')

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Export HelloJADE</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HelloJADE - Export de données</h1>
            <p>Généré le ${formatDate(new Date(), dateFormat)}</p>
          </div>
          
          <table>
            <thead>
              <tr>${headerCells}</tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <div class="footer">
            <p>HelloJADE - Gestion Post-Hospitalisation</p>
          </div>
        </body>
      </html>
    `
  }

  // Fonction pour importer des données
  const importData = async (
    file: File,
    options: ImportOptions = { format: 'json' }
  ) => {
    try {
      isImporting.value = true
      
      const {
        format = 'json',
        validateData = true,
        onProgress
      } = options

      const content = await readFileContent(file)
      let data: any[]

      switch (format) {
        case 'json':
          data = JSON.parse(content)
          break

        case 'csv':
          data = parseCSV(content)
          break

        case 'excel':
          // Pour Excel, on traite comme CSV
          data = parseCSV(content)
          break

        default:
          throw new Error(`Format d'import non supporté: ${format}`)
      }

      if (validateData) {
        data = validateImportedData(data)
      }

      if (onProgress) {
        onProgress(100)
      }

      showSuccess('Import réussi', `${data.length} enregistrements importés`)
      return data
    } catch (error) {
      console.error('Erreur lors de l\'import:', error)
      showError('Erreur d\'import', 'Erreur lors de l\'import')
      throw error
    } finally {
      isImporting.value = false
    }
  }

  // Fonction pour lire le contenu d'un fichier
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target?.result as string)
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  // Fonction pour parser du CSV
  const parseCSV = (content: string): any[] => {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length === 0) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const data: any[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const row: any = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      
      data.push(row)
    }

    return data
  }

  // Fonction pour parser une ligne CSV
  const parseCSVLine = (line: string): string[] => {
    const values: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++ // Skip next quote
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    values.push(current.trim())
    return values
  }

  // Fonction pour valider les données importées
  const validateImportedData = (data: any[]): any[] => {
    return data.filter(row => {
      // Vérifier que la ligne n'est pas vide
      if (!row || Object.keys(row).length === 0) return false
      
      // Vérifier que tous les champs requis sont présents
      const requiredFields = ['id', 'nom', 'prenom']
      const hasRequiredFields = requiredFields.every(field => 
        row[field] != null && row[field] !== ''
      )
      
      return hasRequiredFields
    })
  }

  // Fonction pour exporter des patients
  const exportPatients = (patients: any[], options: ExportOptions) => {
    const formattedPatients = patients.map(patient => ({
      ID: patient.id,
      Nom: patient.nom,
      Prénom: patient.prenom,
      'Date de naissance': formatDate(patient.date_naissance),
      Téléphone: patient.telephone,
      Email: patient.email || '',
      Adresse: patient.adresse || '',
      'Numéro de sécurité sociale': patient.numero_securite_sociale,
      'Groupe sanguin': patient.groupe_sanguin || '',
      Allergies: patient.allergies || '',
      Statut: patient.statut,
      'Date de création': formatDate(patient.date_creation),
      'Date de modification': formatDate(patient.date_modification)
    }))

    return exportData(formattedPatients, options)
  }

  // Fonction pour exporter des hospitalisations
  const exportHospitalisations = (hospitalisations: any[], options: ExportOptions) => {
    const formattedHospitalisations = hospitalisations.map(hosp => ({
      ID: hosp.id,
      'ID Patient': hosp.patient_id,
      'Date d\'admission': formatDate(hosp.date_admission),
      'Date de sortie': hosp.date_sortie ? formatDate(hosp.date_sortie) : '',
      Service: hosp.service,
      'Diagnostic principal': hosp.diagnostic_principal,
      'Diagnostic secondaire': hosp.diagnostic_secondaire || '',
      Traitement: hosp.traitement,
      Statut: hosp.statut,
      'Médecin responsable': hosp.medecin_responsable,
      Chambre: hosp.chambre || '',
      Notes: hosp.notes || ''
    }))

    return exportData(formattedHospitalisations, options)
  }

  // Fonction pour exporter des consultations
  const exportConsultations = (consultations: any[], options: ExportOptions) => {
    const formattedConsultations = consultations.map(consult => ({
      ID: consult.id,
      'ID Patient': consult.patient_id,
      'Date de consultation': formatDate(consult.date_consultation),
      Type: consult.type,
      Motif: consult.motif,
      Diagnostic: consult.diagnostic,
      'Traitement prescrit': consult.traitement_prescrit,
      Médecin: consult.medecin,
      Notes: consult.notes || '',
      Statut: consult.statut
    }))

    return exportData(formattedConsultations, options)
  }

  // Fonction pour exporter des transcriptions
  const exportTranscriptions = (transcriptions: any[], options: ExportOptions) => {
    const formattedTranscriptions = transcriptions.map(trans => ({
      ID: trans.id,
      'ID Patient': trans.patient_id,
      'Date de création': formatDate(trans.date_creation),
      'Fichier audio': trans.fichier_audio,
      'Texte transcrit': trans.texte_transcrit,
      'Score de confiance': `${trans.score_confiance}%`,
      'Durée audio': `${trans.duree_audio}s`,
      Statut: trans.statut,
      'Modèle utilisé': trans.modele_utilise
    }))

    return exportData(formattedTranscriptions, options)
  }

  // Fonction pour exporter des analyses IA
  const exportAnalyses = (analyses: any[], options: ExportOptions) => {
    const formattedAnalyses = analyses.map(analysis => ({
      ID: analysis.id,
      'ID Patient': analysis.patient_id,
      'ID Transcription': analysis.transcription_id || '',
      'Date d\'analyse': formatDate(analysis.date_analyse),
      Sentiment: analysis.sentiment,
      'Niveau d\'urgence': analysis.niveau_urgence,
      'Mots-clés': analysis.mots_cles.join(', '),
      Résumé: analysis.resume,
      Recommandations: analysis.recommandations.join('; '),
      'Score de confiance': `${analysis.score_confiance}%`,
      'Modèle utilisé': analysis.modele_utilise
    }))

    return exportData(formattedAnalyses, options)
  }

  const exportToPDF = (data: any[], filename: string = 'export.pdf') => {
    const doc = new jsPDF('landscape')
    
    // Titre du document avec logo/icône
    doc.setFontSize(20)
    doc.setTextColor(59, 130, 246) // Bleu
    doc.text('HelloJADE', 14, 20)
    
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0) // Noir
    doc.text('Liste des Patients', 14, 32)
    
    // Informations sur l'export
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128) // Gris
    doc.text(`Export généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 14, 42)
    doc.text(`${data.length} patient(s) sélectionné(s)`, 14, 48)
    
    // Ligne de séparation
    doc.setDrawColor(229, 231, 235)
    doc.line(14, 55, 277, 55)
    
    // Préparation des données pour le tableau
    const tableData = data.map(patient => [
      patient.ID || patient.id || '',
      patient['N° Patient'] || patient.numero_patient || '',
      `${patient.Nom || patient.nom || ''} ${patient.Prénom || patient.prenom || ''}`.trim() || 'N/A',
      patient['Date Naissance'] || (patient.date_naissance ? new Date(patient.date_naissance).toLocaleDateString('fr-FR') : ''),
      patient.Sexe || patient.sexe || '',
      patient.Téléphone || patient.telephone || '',
      patient.Email || patient.email || '',
      patient.Service || patient.service || 'Pas hospitalisé',
      patient.Statut || patient.statut || ''
    ])

    // Configuration du tableau améliorée
    autoTable(doc, {
      head: [['ID', 'N° Patient', 'Nom Complet', 'Date Naissance', 'Sexe', 'Téléphone', 'Email', 'Service', 'Statut']],
      body: tableData,
      startY: 65,
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: [229, 231, 235],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [59, 130, 246], // Bleu
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Gris très clair
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' }, // ID
        1: { cellWidth: 25, halign: 'center' }, // N° Patient
        2: { cellWidth: 40 }, // Nom Complet
        3: { cellWidth: 25, halign: 'center' }, // Date Naissance
        4: { cellWidth: 15, halign: 'center' }, // Sexe
        5: { cellWidth: 25, halign: 'center' }, // Téléphone
        6: { cellWidth: 35 }, // Email
        7: { cellWidth: 30 }, // Service
        8: { cellWidth: 20, halign: 'center' }  // Statut
      },
      margin: { top: 65, right: 14, bottom: 20, left: 14 },
      didDrawPage: function (data) {
        // Pied de page
        const pageHeight = doc.internal.pageSize.height
        
        doc.setFontSize(8)
        doc.setTextColor(107, 114, 128)
        doc.text(`Page ${data.pageNumber}`, 14, pageHeight - 10)
        doc.text('HelloJADE - Gestion Post-Hospitalisation', 200, pageHeight - 10)
      }
    })

    // Sauvegarde du PDF
    doc.save(filename)
  }

  return {
    // State
    isExporting,
    isImporting,

    // Actions
    exportData,
    importData,
    exportToExcel,
    exportToPDF,
    exportPatients,
    exportHospitalisations,
    exportConsultations,
    exportTranscriptions,
    exportAnalyses,
    formatDate,
    convertToCSV,
    convertToJSON,
    downloadFile
  }
} 