import type { Patient } from '../stores/patients'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

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
    // Créer un nouveau document PDF
    const doc = new jsPDF('p', 'mm', 'a4')
    
    // Configuration des couleurs et styles
    const primaryColor = [59, 130, 246] // #3b82f6
    const textColor = [30, 41, 59] // #1e293b
    const lightTextColor = [100, 116, 139] // #64748b
    
    // En-tête
    doc.setFontSize(24)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFont('helvetica', 'bold')
    doc.text('HelloJADE', 105, 20, { align: 'center' })
    
    doc.setFontSize(18)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFont('helvetica', 'bold')
    doc.text(options.title || 'Rapport des Patients', 105, 35, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2])
    doc.setFont('helvetica', 'normal')
    doc.text(options.subtitle || 'Liste détaillée des patients hospitaliers', 105, 45, { align: 'center' })
    
    if (options.includeTimestamp) {
      doc.setFontSize(10)
      doc.text(`Généré le ${formatDate(new Date())}`, 105, 55, { align: 'center' })
    }
    
    let yPosition = 70
    
    // Statistiques si demandées
    if (options.includeStats && patients.length > 0) {
      const stats = calculateStats(patients)
      
      doc.setFontSize(14)
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.setFont('helvetica', 'bold')
      doc.text('Statistiques', 20, yPosition)
      yPosition += 10
      
      // Tableau des statistiques
      const statsData = [
        ['Total Patients', stats.total.toString()],
        ['Âge Moyen', `${stats.avgAge} ans`],
        ['Âge Minimum', `${stats.minAge} ans`],
        ['Âge Maximum', `${stats.maxAge} ans`]
      ]
      
      doc.autoTable({
        startY: yPosition,
        head: [['Métrique', 'Valeur']],
        body: statsData,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 5
        },
        margin: { left: 20, right: 20 }
      })
      
      yPosition = (doc as any).lastAutoTable.finalY + 15
    }
    
    // Tableau des patients
    if (patients.length > 0) {
      doc.setFontSize(14)
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.setFont('helvetica', 'bold')
      doc.text(`Détails des Patients (${patients.length})`, 20, yPosition)
      yPosition += 10
      
      // Préparer les données du tableau
      const tableData = patients.map(patient => [
        `${patient.prenom} ${patient.nom}`,
        `${patient.age} ans`,
        patient.telephone || 'Non renseigné',
        patient.email || 'Non renseigné',
        patient.numero_secu || 'Non renseigné'
      ])
      
      doc.autoTable({
        startY: yPosition,
        head: [['Patient', 'Âge', 'Téléphone', 'Email', 'N° Sécurité']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 20 },
          2: { cellWidth: 35 },
          3: { cellWidth: 45 },
          4: { cellWidth: 35 }
        }
      })
    }
    
    // Pied de page
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2])
      doc.text(
        `Page ${i} sur ${pageCount} - HelloJADE - Système de gestion hospitalière`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      )
    }
    
    // Générer le nom du fichier
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `patients_hellojade_${timestamp}.pdf`
    
    // Télécharger le fichier avec une méthode plus robuste
    try {
      // Méthode 1: Essayer doc.save() d'abord
      doc.save(filename)
      console.log(`PDF généré avec succès pour ${patients.length} patients`)
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
      
      console.log(`PDF généré avec succès (méthode Blob) pour ${patients.length} patients`)
    }
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    throw new Error('Impossible de générer le PDF')
  }
}

// Fonction pour générer un PDF avec des options par défaut
export const generateDefaultPatientPDF = async (patients: Patient[]): Promise<void> => {
  return generatePatientPDF(patients, {
    title: 'Rapport des Patients - HelloJADE',
    subtitle: 'Liste détaillée des patients hospitaliers',
    includeStats: true,
    includeTimestamp: true
  })
}

// Fonction pour générer un PDF de statistiques uniquement
export const generateStatsPDF = async (patients: Patient[]): Promise<void> => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4')
    const primaryColor = [59, 130, 246] // #3b82f6
    const textColor = [30, 41, 59] // #1e293b
    const lightTextColor = [100, 116, 139] // #64748b
    
         // En-tête
     doc.setFontSize(24)
     doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
     doc.setFont('helvetica', 'bold')
     doc.text('HelloJADE', 105, 20, { align: 'center' })
     
     doc.setFontSize(18)
     doc.setTextColor(textColor[0], textColor[1], textColor[2])
     doc.setFont('helvetica', 'bold')
     doc.text('Statistiques des Patients', 105, 35, { align: 'center' })
     
     doc.setFontSize(10)
     doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2])
     doc.setFont('helvetica', 'normal')
     doc.text(`Généré le ${formatDate(new Date())}`, 105, 45, { align: 'center' })
    
    let yPosition = 60
    
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
    
    doc.autoTable({
      startY: yPosition,
      head: [['Métrique', 'Valeur']],
      body: statsData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 12,
        cellPadding: 8
      },
      margin: { left: 20, right: 20 }
    })
    
    yPosition = (doc as any).lastAutoTable.finalY + 20
    
    // Tableau de répartition par âge
    const ageData = ageGroups.map(group => [group.label, group.count.toString()])
    
         doc.setFontSize(14)
     doc.setTextColor(textColor[0], textColor[1], textColor[2])
     doc.setFont('helvetica', 'bold')
     doc.text('Répartition par âge', 20, yPosition)
    yPosition += 10
    
    doc.autoTable({
      startY: yPosition,
      head: [['Tranche d\'âge', 'Nombre de patients']],
      body: ageData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 12,
        cellPadding: 8
      },
      margin: { left: 20, right: 20 }
    })
    
         // Pied de page
     doc.setFontSize(8)
     doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2])
     doc.text(
       'HelloJADE - Système de gestion hospitalière',
       105,
       doc.internal.pageSize.height - 10,
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