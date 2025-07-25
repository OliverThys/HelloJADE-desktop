#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HelloJADE v1.0 - Routes pour l'IA
API pour transcription, analyse et synthèse vocale
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError, validate
from werkzeug.utils import secure_filename
import os
import tempfile
import logging
from datetime import datetime, timezone

from core.auth import get_current_user, log_audit_event, require_staff
from core.database import get_db, Call, Patient, AITranscription, AIAnalysis
from core.ai import ai_manager
from core.monitoring import record_ai_operation

logger = logging.getLogger(__name__)

ai_bp = Blueprint('ai', __name__)

# Schémas de validation
class TranscriptionSchema(Schema):
    audio_file = fields.Raw(required=True)
    language = fields.Str(validate=validate.OneOf(['fr', 'en', 'nl']), missing='fr')

class AnalysisSchema(Schema):
    text = fields.Str(required=True, validate=validate.Length(min=10))
    patient_context = fields.Dict(allow_none=True)

class TTSSchema(Schema):
    text = fields.Str(required=True, validate=validate.Length(min=1, max=1000))
    voice = fields.Str(allow_none=True)

class CallProcessingSchema(Schema):
    call_id = fields.Int(required=True)
    audio_path = fields.Str(required=True)

@ai_bp.route('/transcribe', methods=['POST'])
@jwt_required()
@require_staff
def transcribe_audio():
    """
    Transcription d'un fichier audio
    """
    try:
        # Validation des données
        schema = TranscriptionSchema()
        data = schema.load(request.form)
        
        current_user = get_current_user()
        
        # Vérifier qu'un fichier a été uploadé
        if 'audio_file' not in request.files:
            return jsonify({
                'error': 'Aucun fichier audio fourni'
            }), 400
        
        audio_file = request.files['audio_file']
        if audio_file.filename == '':
            return jsonify({
                'error': 'Aucun fichier sélectionné'
            }), 400
        
        # Vérifier l'extension
        allowed_extensions = {'wav', 'mp3', 'm4a', 'flac', 'ogg'}
        if not audio_file.filename.lower().endswith(tuple(f'.{ext}' for ext in allowed_extensions)):
            return jsonify({
                'error': 'Format de fichier non supporté'
            }), 400
        
        # Sauvegarder temporairement
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            audio_file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Transcription
            if not ai_manager.whisper_manager:
                return jsonify({
                    'error': 'Service de transcription non disponible'
                }), 503
            
            transcription = ai_manager.whisper_manager.transcribe_audio(temp_path)
            
            # Log de l'action
            log_audit_event('CREATE', 'AI_TRANSCRIPTION', None, current_user.id)
            
            return jsonify({
                'message': 'Transcription terminée avec succès',
                'data': {
                    'text': transcription.text,
                    'confidence': transcription.confidence,
                    'language': transcription.language,
                    'duration': transcription.duration,
                    'processing_time': transcription.processing_time,
                    'model_used': transcription.model_used
                }
            }), 200
            
        finally:
            # Nettoyer le fichier temporaire
            if os.path.exists(temp_path):
                os.unlink(temp_path)
        
    except ValidationError as e:
        return jsonify({
            'error': 'Données invalides',
            'details': e.messages
        }), 400
        
    except Exception as e:
        logger.error(f"Erreur lors de la transcription: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@ai_bp.route('/analyze', methods=['POST'])
@jwt_required()
@require_staff
def analyze_text():
    """
    Analyse de texte avec IA
    """
    try:
        # Validation des données
        schema = AnalysisSchema()
        data = schema.load(request.get_json())
        
        current_user = get_current_user()
        
        # Analyse IA
        if not ai_manager.ollama_manager:
            return jsonify({
                'error': 'Service d\'analyse IA non disponible'
            }), 503
        
        analysis = ai_manager.ollama_manager.analyze_transcription(
            data['text'], 
            data.get('patient_context')
        )
        
        # Log de l'action
        log_audit_event('CREATE', 'AI_ANALYSIS', None, current_user.id)
        
        return jsonify({
            'message': 'Analyse terminée avec succès',
            'data': {
                'summary': analysis.summary,
                'key_points': analysis.key_points,
                'sentiment': analysis.sentiment,
                'urgency_level': analysis.urgency_level,
                'medical_notes': analysis.medical_notes,
                'recommendations': analysis.recommendations,
                'confidence': analysis.confidence,
                'processing_time': analysis.processing_time,
                'model_used': analysis.model_used
            }
        }), 200
        
    except ValidationError as e:
        return jsonify({
            'error': 'Données invalides',
            'details': e.messages
        }), 400
        
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@ai_bp.route('/synthesize', methods=['POST'])
@jwt_required()
@require_staff
def synthesize_speech():
    """
    Synthèse vocale à partir de texte
    """
    try:
        # Validation des données
        schema = TTSSchema()
        data = schema.load(request.get_json())
        
        current_user = get_current_user()
        
        # Synthèse vocale
        if not ai_manager.piper_manager:
            return jsonify({
                'error': 'Service de synthèse vocale non disponible'
            }), 503
        
        tts_result = ai_manager.generate_tts_message(data['text'])
        
        # Log de l'action
        log_audit_event('CREATE', 'AI_TTS', None, current_user.id)
        
        return jsonify({
            'message': 'Synthèse vocale terminée avec succès',
            'data': {
                'audio_path': tts_result.audio_path,
                'duration': tts_result.duration,
                'text_length': tts_result.text_length,
                'quality_score': tts_result.quality_score,
                'processing_time': tts_result.processing_time,
                'voice_used': tts_result.voice_used
            }
        }), 200
        
    except ValidationError as e:
        return jsonify({
            'error': 'Données invalides',
            'details': e.messages
        }), 400
        
    except Exception as e:
        logger.error(f"Erreur lors de la synthèse vocale: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@ai_bp.route('/process-call', methods=['POST'])
@jwt_required()
@require_staff
def process_call_recording():
    """
    Traitement complet d'un enregistrement d'appel
    """
    try:
        # Validation des données
        schema = CallProcessingSchema()
        data = schema.load(request.get_json())
        
        current_user = get_current_user()
        
        # Vérifier que l'appel existe
        db = get_db()
        call = db.query(Call).filter(Call.id == data['call_id']).first()
        
        if not call:
            return jsonify({
                'error': 'Appel non trouvé'
            }), 404
        
        # Vérifier que le fichier audio existe
        if not os.path.exists(data['audio_path']):
            return jsonify({
                'error': 'Fichier audio non trouvé'
            }), 404
        
        # Récupérer le contexte patient
        patient = db.query(Patient).filter(Patient.id == call.patient_id).first()
        patient_context = None
        
        if patient:
            patient_context = {
                'name': f"{patient.first_name} {patient.last_name}",
                'age': patient.date_of_birth.year if patient.date_of_birth else None,
                'diagnosis': patient.medical_history,
                'medications': patient.current_medications,
                'allergies': patient.allergies
            }
        
        # Traitement IA complet
        results = ai_manager.process_call_recording(
            data['audio_path'],
            data['call_id'],
            patient_context
        )
        
        if not results['success']:
            return jsonify({
                'error': 'Échec du traitement IA',
                'message': results.get('error', 'Erreur inconnue')
            }), 500
        
        # Log de l'action
        log_audit_event('CREATE', 'AI_CALL_PROCESSING', data['call_id'], current_user.id)
        
        return jsonify({
            'message': 'Traitement IA terminé avec succès',
            'data': {
                'call_id': data['call_id'],
                'transcription': {
                    'text': results['transcription'].text if results['transcription'] else None,
                    'confidence': results['transcription'].confidence if results['transcription'] else None,
                    'language': results['transcription'].language if results['transcription'] else None
                },
                'analysis': {
                    'summary': results['analysis'].summary if results['analysis'] else None,
                    'sentiment': results['analysis'].sentiment if results['analysis'] else None,
                    'urgency_level': results['analysis'].urgency_level if results['analysis'] else None,
                    'medical_notes': results['analysis'].medical_notes if results['analysis'] else None,
                    'recommendations': results['analysis'].recommendations if results['analysis'] else None
                },
                'tts_summary': {
                    'audio_path': results['tts_summary'].audio_path if results['tts_summary'] else None,
                    'duration': results['tts_summary'].duration if results['tts_summary'] else None
                },
                'processing_time': results['processing_time']
            }
        }), 200
        
    except ValidationError as e:
        return jsonify({
            'error': 'Données invalides',
            'details': e.messages
        }), 400
        
    except Exception as e:
        logger.error(f"Erreur lors du traitement d'appel: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@ai_bp.route('/call/<int:call_id>/transcription', methods=['GET'])
@jwt_required()
@require_staff
def get_call_transcription(call_id):
    """
    Récupère la transcription d'un appel
    """
    try:
        db = get_db()
        current_user = get_current_user()
        
        # Vérifier que l'appel existe
        call = db.query(Call).filter(Call.id == call_id).first()
        if not call:
            return jsonify({
                'error': 'Appel non trouvé'
            }), 404
        
        # Récupérer la transcription
        transcription = db.query(AITranscription).filter(AITranscription.call_id == call_id).first()
        
        if not transcription:
            return jsonify({
                'error': 'Transcription non trouvée'
            }), 404
        
        # Log de l'accès
        log_audit_event('READ', 'AI_TRANSCRIPTION', call_id, current_user.id)
        
        return jsonify({
            'message': 'Transcription récupérée avec succès',
            'data': {
                'call_id': call_id,
                'text': transcription.text,
                'confidence': transcription.confidence,
                'language': transcription.language,
                'duration': transcription.duration,
                'model_used': transcription.model_used,
                'processing_time': transcription.processing_time,
                'created_at': transcription.created_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération de la transcription: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@ai_bp.route('/call/<int:call_id>/analysis', methods=['GET'])
@jwt_required()
@require_staff
def get_call_analysis(call_id):
    """
    Récupère l'analyse IA d'un appel
    """
    try:
        db = get_db()
        current_user = get_current_user()
        
        # Vérifier que l'appel existe
        call = db.query(Call).filter(Call.id == call_id).first()
        if not call:
            return jsonify({
                'error': 'Appel non trouvé'
            }), 404
        
        # Récupérer l'analyse
        analysis = db.query(AIAnalysis).filter(AIAnalysis.call_id == call_id).first()
        
        if not analysis:
            return jsonify({
                'error': 'Analyse non trouvée'
            }), 404
        
        # Log de l'accès
        log_audit_event('READ', 'AI_ANALYSIS', call_id, current_user.id)
        
        return jsonify({
            'message': 'Analyse récupérée avec succès',
            'data': {
                'call_id': call_id,
                'summary': analysis.summary,
                'sentiment': analysis.sentiment,
                'urgency_level': analysis.urgency_level,
                'medical_notes': analysis.medical_notes,
                'recommendations': analysis.recommendations,
                'confidence': analysis.confidence,
                'model_used': analysis.model_used,
                'processing_time': analysis.processing_time,
                'created_at': analysis.created_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération de l'analyse: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@ai_bp.route('/status', methods=['GET'])
@jwt_required()
@require_staff
def get_ai_status():
    """
    Récupère le statut des services IA
    """
    try:
        current_user = get_current_user()
        
        # Récupérer le statut
        status = ai_manager.get_health_status()
        
        # Log de l'accès
        log_audit_event('READ', 'AI_STATUS', None, current_user.id)
        
        return jsonify({
            'message': 'Statut IA récupéré avec succès',
            'data': status
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du statut IA: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@ai_bp.route('/generate-summary/<int:patient_id>', methods=['POST'])
@jwt_required()
@require_staff
def generate_medical_summary(patient_id):
    """
    Génère un résumé médical pour un patient
    """
    try:
        current_user = get_current_user()
        
        db = get_db()
        
        # Récupérer les données patient
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            return jsonify({
                'error': 'Patient non trouvé'
            }), 404
        
        # Récupérer l'historique des appels
        calls = db.query(Call).filter(Call.patient_id == patient_id).order_by(Call.created_at.desc()).limit(10).all()
        
        # Préparer les données
        patient_data = {
            'name': f"{patient.first_name} {patient.last_name}",
            'age': patient.date_of_birth.year if patient.date_of_birth else None,
            'medical_history': patient.medical_history,
            'current_medications': patient.current_medications,
            'allergies': patient.allergies
        }
        
        call_history = []
        for call in calls:
            analysis = db.query(AIAnalysis).filter(AIAnalysis.call_id == call.id).first()
            if analysis:
                call_history.append({
                    'date': call.created_at.isoformat(),
                    'summary': analysis.summary,
                    'urgency_level': analysis.urgency_level,
                    'sentiment': analysis.sentiment
                })
        
        # Générer le résumé
        if not ai_manager.ollama_manager:
            return jsonify({
                'error': 'Service d\'analyse IA non disponible'
            }), 503
        
        summary = ai_manager.ollama_manager.generate_medical_summary(patient_data, call_history)
        
        # Log de l'action
        log_audit_event('CREATE', 'AI_MEDICAL_SUMMARY', patient_id, current_user.id)
        
        return jsonify({
            'message': 'Résumé médical généré avec succès',
            'data': {
                'patient_id': patient_id,
                'summary': summary,
                'generated_at': datetime.now(timezone.utc).isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la génération du résumé médical: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@ai_bp.route('/cleanup', methods=['POST'])
@jwt_required()
@require_staff
def cleanup_temp_files():
    """
    Nettoie les fichiers temporaires IA
    """
    try:
        current_user = get_current_user()
        
        # Nettoyer les fichiers temporaires
        ai_manager.cleanup_temp_files()
        
        # Log de l'action
        log_audit_event('UPDATE', 'AI_CLEANUP', None, current_user.id)
        
        return jsonify({
            'message': 'Nettoyage terminé avec succès'
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors du nettoyage: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500 