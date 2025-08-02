import type { Patient } from '../stores/patients'
import jsPDF from 'jspdf'

// Import dynamique de jspdf-autotable pour éviter les problèmes de build
let autoTable: any = null

// Fonction pour charger autoTable de manière asynchrone
const loadAutoTable = async () => {
  if (!autoTable) {
    try {
      const autoTableModule = await import('jspdf-autotable')
      autoTable = autoTableModule.default
    } catch (error) {
      console.error('Erreur lors du chargement de jspdf-autotable:', error)
      throw new Error('Impossible de charger le module jspdf-autotable')
    }
  }
  return autoTable
}

// Extension de type pour jsPDF avec autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

// Interface pour les options de génération PDF
interface PDFOptions {
  title?: string
  subtitle?: string
  includeStats?: boolean
  includeTimestamp?: boolean
}

// Fonction pour formater une date
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Fonction pour calculer les statistiques
const calculateStats = (patients: Patient[]) => {
  const total = patients.length
  const avgAge = Math.round(patients.reduce((sum, p) => sum + p.age, 0) / total)
  const minAge = Math.min(...patients.map(p => p.age))
  const maxAge = Math.max(...patients.map(p => p.age))

  return { total, avgAge, minAge, maxAge }
}

// Fonction pour générer un PDF avec jsPDF
export const generatePatientPDF = async (patients: Patient[], options: PDFOptions = {}): Promise<void> => {
  try {
    console.log('Début de la génération PDF pour', patients.length, 'patients')
    
    // Validation des données
    if (!patients || patients.length === 0) {
      throw new Error('Aucun patient fourni pour la génération du PDF')
    }
    
    // Vérifier que les patients ont les propriétés requises
    const invalidPatients = patients.filter(p => !p.nom || !p.prenom)
    if (invalidPatients.length > 0) {
      console.warn('Certains patients ont des données manquantes:', invalidPatients)
    }
    
    // Charger autoTable
    const autoTable = await loadAutoTable()
    
    // Créer un nouveau document PDF
    const doc = new jsPDF('p', 'mm', 'a4')
    
    // Configuration des couleurs et styles
    const primaryColor = [59, 130, 246] // #3b82f6
    const textColor = [30, 41, 59] // #1e293b
    const lightTextColor = [100, 116, 139] // #64748b
    
    // En-tête
    doc.setFontSize(28)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFont('times', 'bold')
    doc.text('HelloJADE', 105, 25, { align: 'center' })
    
    doc.setFontSize(20)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFont('times', 'bold')
    doc.text(options.title || 'Rapport des Patients', 105, 40, { align: 'center' })
    
    doc.setFontSize(11)
    doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2])
    doc.setFont('times', 'italic')
    doc.text(options.subtitle || 'Liste détaillée des patients hospitaliers', 105, 50, { align: 'center' })
    
    if (options.includeTimestamp) {
      doc.setFontSize(9)
      doc.setFont('times', 'normal')
      doc.text(`Document généré le ${formatDate(new Date())}`, 105, 60, { align: 'center' })
    }
    
    let yPosition = 75
    
    // Section des statistiques supprimée
    
    // Tableau des patients
    if (patients.length > 0) {
      doc.setFontSize(16)
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.setFont('times', 'bold')
      doc.text(`Détails des Patients (${patients.length})`, 20, yPosition)
      yPosition += 12
      
      // Préparer les données du tableau
      const tableData = patients.map(patient => [
        `${patient.prenom} ${patient.nom}`,
        `${patient.age} ans`,
        patient.telephone || 'Non renseigné',
        patient.email || 'Non renseigné',
        patient.numero_secu || 'Non renseigné'
      ])
      
             autoTable(doc, {
         startY: yPosition,
         head: [['Patient', 'Âge', 'Téléphone', 'Email', 'N° Sécurité']],
         body: tableData,
         theme: 'grid',
         headStyles: {
           fillColor: [44, 62, 80] as [number, number, number], // Gris foncé professionnel
           textColor: [255, 255, 255],
           fontStyle: 'bold',
           fontSize: 10,
           fontFamily: 'times'
         },
         styles: {
           fontSize: 9,
           cellPadding: 4,
           fontFamily: 'times',
           lineColor: [200, 200, 200],
           lineWidth: 0.1
         },
         alternateRowStyles: {
           fillColor: [248, 249, 250] // Gris très clair pour alterner
         },
         margin: { left: 20, right: 20 },
         columnStyles: {
           0: { cellWidth: 42, fontStyle: 'bold' }, // Nom en gras
           1: { cellWidth: 18, halign: 'center' },
           2: { cellWidth: 35, halign: 'center' },
           3: { cellWidth: 45 },
           4: { cellWidth: 35, fontFamily: 'courier' } // Numéro de sécurité en police monospace
         }
       })
    }
    
    // Pied de page
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont('times', 'normal')
      doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2])
      
      // Ligne de séparation
      doc.setDrawColor(200, 200, 200)
      doc.line(20, doc.internal.pageSize.height - 20, 190, doc.internal.pageSize.height - 20)
      
      doc.text(
        `Page ${i} sur ${pageCount} | HelloJADE - Système de gestion hospitalière | Document confidentiel`,
        105,
        doc.internal.pageSize.height - 12,
        { align: 'center' }
      )
    }
    
    // Générer le nom du fichier
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `patients_hellojade_${timestamp}.pdf`
    
    console.log('Tentative de téléchargement du fichier:', filename)
    
    // Méthode de téléchargement améliorée
    try {
      // Méthode 1: Utiliser doc.save() directement
      console.log('Tentative avec doc.save()')
      doc.save(filename)
      console.log('PDF généré avec succès (méthode doc.save)')
    } catch (saveError) {
      console.warn('doc.save() a échoué, tentative avec Blob:', saveError)
      
      // Méthode 2: Utiliser Blob et URL.createObjectURL
      try {
        console.log('Tentative avec Blob')
        const pdfBlob = doc.output('blob')
        const url = URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.style.display = 'none'
        
        // Ajouter le lien au DOM
        document.body.appendChild(link)
        
        // Déclencher le clic
        link.click()
        
        // Nettoyer
        setTimeout(() => {
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }, 100)
        
        console.log('PDF généré avec succès (méthode Blob)')
      } catch (blobError) {
        console.error('Méthode Blob a aussi échoué:', blobError)
        
        // Méthode 3: Utiliser file-saver si disponible
        try {
          console.log('Tentative avec file-saver')
          const { saveAs } = await import('file-saver')
          const pdfBlob = doc.output('blob')
          saveAs(pdfBlob, filename)
          console.log('PDF généré avec succès (méthode file-saver)')
        } catch (fileSaverError) {
          console.error('Toutes les méthodes ont échoué:', fileSaverError)
          throw new Error('Impossible de télécharger le PDF. Vérifiez les paramètres de votre navigateur.')
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    throw new Error(`Impossible de générer le PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
  }
}

// Fonction pour générer un PDF avec des options par défaut
export const generateDefaultPatientPDF = async (patients: Patient[]): Promise<void> => {
  return generatePatientPDF(patients, {
    title: 'Rapport des Patients - HelloJADE',
    subtitle: 'Liste détaillée des patients hospitaliers',
    includeStats: false,
    includeTimestamp: true
  })
}

// Fonction pour générer un PDF de statistiques uniquement
export const generateStatsPDF = async (patients: Patient[]): Promise<void> => {
  try {
    // Charger autoTable
    const autoTable = await loadAutoTable()
    
    const doc = new jsPDF('p', 'mm', 'a4')
    const primaryColor = [59, 130, 246] // #3b82f6
    const textColor = [30, 41, 59] // #1e293b
    const lightTextColor = [100, 116, 139] // #64748b
    
         // En-tête
     doc.setFontSize(28)
     doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
     doc.setFont('times', 'bold')
     doc.text('HelloJADE', 105, 25, { align: 'center' })
     
     doc.setFontSize(20)
     doc.setTextColor(textColor[0], textColor[1], textColor[2])
     doc.setFont('times', 'bold')
     doc.text('Statistiques des Patients', 105, 40, { align: 'center' })
     
     doc.setFontSize(11)
     doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2])
     doc.setFont('times', 'italic')
     doc.text('Analyse démographique et répartition par âge', 105, 50, { align: 'center' })
     
     doc.setFontSize(9)
     doc.setFont('times', 'normal')
     doc.text(`Document généré le ${formatDate(new Date())}`, 105, 60, { align: 'center' })
    
         let yPosition = 75
    
    // Statistiques principales
    const stats = calculateStats(patients)
    
    // Répartition par âge
    const ageGroups = [
      { label: '0-25 ans', count: patients.filter(p => p.age >= 0 && p.age <= 25).length },
      { label: '26-50 ans', count: patients.filter(p => p.age >= 26 && p.age <= 50).length },
      { label: '51-75 ans', count: patients.filter(p => p.age >= 51 && p.age <= 75).length },
      { label: '76+ ans', count: patients.filter(p => p.age >= 76).length }
    ]
    
    // Tableau des statistiques générales
    const statsData = [
      ['Total Patients', stats.total.toString()],
      ['Âge Moyen', `${stats.avgAge} ans`],
      ['Âge Minimum', `${stats.minAge} ans`],
      ['Âge Maximum', `${stats.maxAge} ans`]
    ]
    
         autoTable(doc, {
       startY: yPosition,
       head: [['Métrique', 'Valeur']],
       body: statsData,
       theme: 'grid',
       headStyles: {
         fillColor: [44, 62, 80] as [number, number, number], // Gris foncé professionnel
         textColor: [255, 255, 255],
         fontStyle: 'bold',
         fontSize: 11,
         fontFamily: 'times'
       },
       styles: {
         fontSize: 10,
         cellPadding: 6,
         fontFamily: 'times',
         lineColor: [200, 200, 200],
         lineWidth: 0.1
       },
       alternateRowStyles: {
         fillColor: [248, 249, 250] // Gris très clair pour alterner
       },
       margin: { left: 20, right: 20 }
     })
    
    yPosition = (doc as any).lastAutoTable?.finalY + 20 || yPosition + 60
    
    // Tableau de répartition par âge
    const ageData = ageGroups.map(group => [group.label, group.count.toString()])
    
                   doc.setFontSize(16)
     doc.setTextColor(textColor[0], textColor[1], textColor[2])
     doc.setFont('times', 'bold')
     doc.text('Répartition par âge', 20, yPosition)
    yPosition += 12
    
         autoTable(doc, {
       startY: yPosition,
       head: [['Tranche d\'âge', 'Nombre de patients']],
       body: ageData,
       theme: 'grid',
       headStyles: {
         fillColor: [44, 62, 80] as [number, number, number], // Gris foncé professionnel
         textColor: [255, 255, 255],
         fontStyle: 'bold',
         fontSize: 11,
         fontFamily: 'times'
       },
       styles: {
         fontSize: 10,
         cellPadding: 6,
         fontFamily: 'times',
         lineColor: [200, 200, 200],
         lineWidth: 0.1
       },
       alternateRowStyles: {
         fillColor: [248, 249, 250] // Gris très clair pour alterner
       },
       margin: { left: 20, right: 20 }
     })
    
                   // Pied de page
     doc.setFontSize(8)
     doc.setFont('times', 'normal')
     doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2])
     
     // Ligne de séparation
     doc.setDrawColor(200, 200, 200)
     doc.line(20, doc.internal.pageSize.height - 20, 190, doc.internal.pageSize.height - 20)
     
     doc.text(
       'HelloJADE - Système de gestion hospitalière | Document confidentiel',
       105,
       doc.internal.pageSize.height - 12,
       { align: 'center' }
     )
    
         // Télécharger le fichier avec une méthode plus robuste
     const timestamp = new Date().toISOString().split('T')[0]
     const filename = `statistiques_patients_hellojade_${timestamp}.pdf`
     
     try {
       // Méthode 1: Essayer doc.save() d'abord
       doc.save(filename)
       console.log(`PDF de statistiques généré avec succès`)
     } catch (saveError) {
       console.warn('doc.save() a échoué, tentative avec Blob:', saveError)
       
       // Méthode 2: Utiliser Blob et URL.createObjectURL
       const pdfBlob = doc.output('blob')
       const url = URL.createObjectURL(pdfBlob)
       const link = document.createElement('a')
       link.href = url
       link.download = filename
       link.style.display = 'none'
       
       document.body.appendChild(link)
       link.click()
       document.body.removeChild(link)
       
       // Nettoyer l'URL
       setTimeout(() => {
         URL.revokeObjectURL(url)
       }, 100)
       
       console.log(`PDF de statistiques généré avec succès (méthode Blob)`)
     }
    
  } catch (error) {
    console.error('Erreur lors de la génération du PDF de statistiques:', error)
    throw new Error('Impossible de générer le PDF de statistiques')
  }
} 