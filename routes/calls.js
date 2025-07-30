const express = require('express')
const router = express.Router()
const hybridService = require('../services/hybrid-database')

// GET /api/calls - Récupérer tous les appels avec filtres
router.get('/', async (req, res) => {
  try {
    const filters = {
      recherche: req.query.recherche,
      dateDebut: req.query.dateDebut,
      dateFin: req.query.dateFin,
      statut: req.query.statut
    }

    const calls = await hybridService.getCalls(filters)
    res.json({
      success: true,
      data: calls,
      count: calls.length
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des appels:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des appels',
      details: error.message
    })
  }
})

// GET /api/calls/:id - Récupérer un appel par ID
router.get('/:id', async (req, res) => {
  try {
    const callId = parseInt(req.params.id)
    const call = await hybridService.getCallById(callId)
    
    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Appel non trouvé'
      })
    }

    res.json({
      success: true,
      data: call
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'appel:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'appel',
      details: error.message
    })
  }
})

// POST /api/calls - Créer un nouvel appel
router.post('/', async (req, res) => {
  try {
    const callData = req.body
    const newCall = await hybridService.saveCall(callData)
    
    res.status(201).json({
      success: true,
      data: newCall,
      message: 'Appel créé avec succès'
    })
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'appel:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'appel',
      details: error.message
    })
  }
})

// PUT /api/calls/:id - Mettre à jour un appel
router.put('/:id', async (req, res) => {
  try {
    const callId = parseInt(req.params.id)
    const updateData = req.body
    
    const updatedCall = await hybridService.updateCall(callId, updateData)
    
    if (!updatedCall) {
      return res.status(404).json({
        success: false,
        error: 'Appel non trouvé'
      })
    }

    res.json({
      success: true,
      data: updatedCall,
      message: 'Appel mis à jour avec succès'
    })
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'appel:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de l\'appel',
      details: error.message
    })
  }
})

// GET /api/calls/statistics - Récupérer les statistiques
router.get('/statistics/overview', async (req, res) => {
  try {
    const statistics = await hybridService.getStatistics()
    res.json({
      success: true,
      data: statistics
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      details: error.message
    })
  }
})

// POST /api/calls/sync-oracle - Synchroniser depuis Oracle
router.post('/sync-oracle', async (req, res) => {
  try {
    const syncResult = await hybridService.syncFromOracle()
    res.json({
      success: true,
      data: syncResult,
      message: 'Synchronisation terminée avec succès'
    })
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation Oracle:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la synchronisation Oracle',
      details: error.message
    })
  }
})

// GET /api/calls/export/csv - Exporter en CSV
router.get('/export/csv', async (req, res) => {
  try {
    const filters = {
      recherche: req.query.recherche,
      dateDebut: req.query.dateDebut,
      dateFin: req.query.dateFin,
      statut: req.query.statut
    }

    const calls = await hybridService.getCalls(filters)
    
    // Générer le CSV
    const csvHeader = 'Numéro Patient,Nom,Prénom,Date naissance,Téléphone,Site,Date sortie,Appel prévu,Statut,Médecin,Service,Appel réel,Durée,Score\n'
    const csvRows = calls.map(call => {
      return [
        call.numero_patient,
        call.nom,
        call.prenom,
        call.date_naissance,
        call.telephone,
        call.site,
        call.date_sortie,
        call.date_appel_prevue,
        call.statut,
        call.medecin,
        call.service,
        call.date_appel_reelle,
        call.duree_secondes,
        call.score
      ].map(field => `"${field || ''}"`).join(',')
    }).join('\n')

    const csvContent = csvHeader + csvRows

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="appels_export.csv"')
    res.send(csvContent)
  } catch (error) {
    console.error('❌ Erreur lors de l\'export CSV:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'export CSV',
      details: error.message
    })
  }
})

module.exports = router 