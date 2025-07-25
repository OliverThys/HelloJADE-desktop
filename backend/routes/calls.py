#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HelloJADE v1.0 - Routes pour la gestion des appels téléphoniques
Gestion complète des appels avec planification, exécution et suivi
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError, validate
from sqlalchemy import and_, or_, desc
from datetime import datetime, timezone, timedelta
import logging
import uuid

from core.auth import get_current_user, log_audit_event, require_staff
from core.database import get_db, Call, Patient, User, AITranscription, AIAnalysis
from core.monitoring import record_call, record_call_duration, update_active_calls
from core.telephony import TelephonyManager

logger = logging.getLogger(__name__)

calls_bp = Blueprint('calls', __name__)

# Schémas de validation
class CallSchema(Schema):
    patient_id = fields.Int(required=True)
    call_type = fields.Str(required=True, validate=validate.OneOf(['scheduled', 'manual', 'follow_up']))
    direction = fields.Str(validate=validate.OneOf(['inbound', 'outbound']), missing='outbound')
    scheduled_time = fields.DateTime(allow_none=True)
    notes = fields.Str(allow_none=True)

class CallUpdateSchema(Schema):
    status = fields.Str(validate=validate.OneOf(['scheduled', 'in_progress', 'completed', 'failed', 'cancelled']))
    notes = fields.Str(allow_none=True)
    transcription_text = fields.Str(allow_none=True)
    ai_analysis = fields.Str(allow_none=True)

class CallSearchSchema(Schema):
    patient_id = fields.Int(allow_none=True)
    status = fields.Str(allow_none=True, validate=validate.OneOf(['scheduled', 'in_progress', 'completed', 'failed', 'cancelled', 'all']))
    call_type = fields.Str(allow_none=True, validate=validate.OneOf(['scheduled', 'manual', 'follow_up']))
    user_id = fields.Int(allow_none=True)
    date_from = fields.Date(allow_none=True)
    date_to = fields.Date(allow_none=True)
    page = fields.Int(validate=validate.Range(min=1), missing=1)
    per_page = fields.Int(validate=validate.Range(min=1, max=100), missing=20)

class CallScheduleSchema(Schema):
    patient_ids = fields.List(fields.Int(), required=True, validate=validate.Length(min=1))
    scheduled_time = fields.DateTime(required=True)
    call_type = fields.Str(validate=validate.OneOf(['scheduled', 'follow_up']), missing='scheduled')
    notes = fields.Str(allow_none=True)

@calls_bp.route('/', methods=['GET'])
@jwt_required()
@require_staff
def get_calls():
    """
    Récupération de la liste des appels avec pagination et filtres
    """
    try:
        # Validation des paramètres de recherche
        schema = CallSearchSchema()
        data = schema.load(request.args)
        
        db = get_db()
        current_user = get_current_user()
        
        # Construction de la requête de base
        query = db.query(Call).join(Patient).join(User)
        
        # Filtres
        if data.get('patient_id'):
            query = query.filter(Call.patient_id == data['patient_id'])
        
        if data.get('status') and data['status'] != 'all':
            query = query.filter(Call.status == data['status'])
        
        if data.get('call_type'):
            query = query.filter(Call.call_type == data['call_type'])
        
        if data.get('user_id'):
            query = query.filter(Call.user_id == data['user_id'])
        
        if data.get('date_from'):
            query = query.filter(Call.created_at >= data['date_from'])
        
        if data.get('date_to'):
            query = query.filter(Call.created_at <= data['date_to'] + timedelta(days=1))
        
        # Tri par date de création décroissante
        query = query.order_by(desc(Call.created_at))
        
        # Pagination
        page = data.get('page', 1)
        per_page = data.get('per_page', 20)
        offset = (page - 1) * per_page
        
        total = query.count()
        calls = query.offset(offset).limit(per_page).all()
        
        # Log de l'accès
        log_audit_event('READ', 'CALL', None, current_user.id)
        
        # Mise à jour des métriques
        active_calls = db.query(Call).filter(Call.status.in_(['scheduled', 'in_progress'])).count()
        update_active_calls(active_calls)
        
        return jsonify({
            'message': 'Appels récupérés avec succès',
            'data': {
                'calls': [{
                    'id': call.id,
                    'call_id': call.call_id,
                    'patient': {
                        'id': call.patient.id,
                        'patient_id': call.patient.patient_id,
                        'name': f"{call.patient.first_name} {call.patient.last_name}",
                        'phone_number': call.patient.phone_number
                    },
                    'user': {
                        'id': call.user.id,
                        'name': f"{call.user.first_name} {call.user.last_name}"
                    },
                    'call_type': call.call_type,
                    'status': call.status,
                    'direction': call.direction,
                    'scheduled_time': call.scheduled_time.isoformat() if call.scheduled_time else None,
                    'start_time': call.start_time.isoformat() if call.start_time else None,
                    'end_time': call.end_time.isoformat() if call.end_time else None,
                    'duration': call.duration,
                    'created_at': call.created_at.isoformat()
                } for call in calls],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page
                }
            }
        }), 200
        
    except ValidationError as e:
        return jsonify({
            'error': 'Paramètres invalides',
            'details': e.messages
        }), 400
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des appels: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@calls_bp.route('/<int:call_id>', methods=['GET'])
@jwt_required()
@require_staff
def get_call(call_id):
    """
    Récupération d'un appel spécifique avec ses détails complets
    """
    try:
        db = get_db()
        current_user = get_current_user()
        
        call = db.query(Call).filter(Call.id == call_id).first()
        
        if not call:
            return jsonify({
                'error': 'Appel non trouvé'
            }), 404
        
        # Récupération des transcriptions et analyses IA
        transcriptions = db.query(AITranscription).filter(AITranscription.call_id == call_id).all()
        analyses = db.query(AIAnalysis).filter(AIAnalysis.call_id == call_id).all()
        
        # Log de l'accès
        log_audit_event('READ', 'CALL', call_id, current_user.id)
        
        return jsonify({
            'message': 'Appel récupéré avec succès',
            'data': {
                'id': call.id,
                'call_id': call.call_id,
                'patient': {
                    'id': call.patient.id,
                    'patient_id': call.patient.patient_id,
                    'name': f"{call.patient.first_name} {call.patient.last_name}",
                    'phone_number': call.patient.phone_number,
                    'email': call.patient.email
                },
                'user': {
                    'id': call.user.id,
                    'name': f"{call.user.first_name} {call.user.last_name}",
                    'role': call.user.role
                },
                'call_type': call.call_type,
                'status': call.status,
                'direction': call.direction,
                'phone_number': call.phone_number,
                'scheduled_time': call.scheduled_time.isoformat() if call.scheduled_time else None,
                'start_time': call.start_time.isoformat() if call.start_time else None,
                'end_time': call.end_time.isoformat() if call.end_time else None,
                'duration': call.duration,
                'recording_path': call.recording_path,
                'transcription_text': call.transcription_text,
                'ai_analysis': call.ai_analysis,
                'notes': call.notes,
                'created_at': call.created_at.isoformat(),
                'updated_at': call.updated_at.isoformat(),
                'transcriptions': [{
                    'id': t.id,
                    'confidence_score': t.confidence_score,
                    'language': t.language,
                    'model_used': t.model_used,
                    'processing_time': t.processing_time,
                    'created_at': t.created_at.isoformat()
                } for t in transcriptions],
                'analyses': [{
                    'id': a.id,
                    'analysis_type': a.analysis_type,
                    'confidence_score': a.confidence_score,
                    'model_used': a.model_used,
                    'processing_time': a.processing_time,
                    'created_at': a.created_at.isoformat()
                } for a in analyses]
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération de l'appel {call_id}: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@calls_bp.route('/', methods=['POST'])
@jwt_required()
@require_staff
def create_call():
    """
    Création d'un nouvel appel
    """
    try:
        # Validation des données
        schema = CallSchema()
        data = schema.load(request.get_json())
        
        db = get_db()
        current_user = get_current_user()
        
        # Vérification de l'existence du patient
        patient = db.query(Patient).filter(Patient.id == data['patient_id']).first()
        if not patient:
            return jsonify({
                'error': 'Patient non trouvé'
            }), 404
        
        # Génération d'un ID d'appel unique
        call_id = f"CALL-{uuid.uuid4().hex[:8].upper()}"
        
        # Création de l'appel
        call_data = {
            'call_id': call_id,
            'patient_id': data['patient_id'],
            'user_id': current_user.id,
            'call_type': data['call_type'],
            'direction': data.get('direction', 'outbound'),
            'phone_number': patient.phone_number,
            'scheduled_time': data.get('scheduled_time'),
            'notes': data.get('notes'),
            'status': 'scheduled' if data.get('scheduled_time') else 'manual'
        }
        
        call = Call(**call_data)
        db.add(call)
        db.commit()
        db.refresh(call)
        
        # Log de la création
        log_audit_event('CREATE', 'CALL', call.id, current_user.id)
        
        # Métriques
        record_call(call.status, call.direction, call.call_type)
        
        logger.info(f"Nouvel appel créé: {call_id} pour le patient {patient.patient_id}")
        
        return jsonify({
            'message': 'Appel créé avec succès',
            'data': {
                'id': call.id,
                'call_id': call.call_id,
                'status': call.status,
                'scheduled_time': call.scheduled_time.isoformat() if call.scheduled_time else None
            }
        }), 201
        
    except ValidationError as e:
        return jsonify({
            'error': 'Données invalides',
            'details': e.messages
        }), 400
        
    except Exception as e:
        logger.error(f"Erreur lors de la création de l'appel: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@calls_bp.route('/schedule', methods=['POST'])
@jwt_required()
@require_staff
def schedule_calls():
    """
    Planification d'appels en lot pour plusieurs patients
    """
    try:
        # Validation des données
        schema = CallScheduleSchema()
        data = schema.load(request.get_json())
        
        db = get_db()
        current_user = get_current_user()
        
        # Vérification de l'existence des patients
        patients = db.query(Patient).filter(Patient.id.in_(data['patient_ids'])).all()
        if len(patients) != len(data['patient_ids']):
            return jsonify({
                'error': 'Un ou plusieurs patients non trouvés'
            }), 404
        
        created_calls = []
        
        for patient in patients:
            # Génération d'un ID d'appel unique
            call_id = f"CALL-{uuid.uuid4().hex[:8].upper()}"
            
            # Création de l'appel
            call = Call(
                call_id=call_id,
                patient_id=patient.id,
                user_id=current_user.id,
                call_type=data['call_type'],
                direction='outbound',
                phone_number=patient.phone_number,
                scheduled_time=data['scheduled_time'],
                notes=data.get('notes'),
                status='scheduled'
            )
            
            db.add(call)
            created_calls.append(call)
        
        db.commit()
        
        # Log de la création
        log_audit_event('CREATE', 'CALL', None, current_user.id)
        
        # Métriques
        for call in created_calls:
            record_call(call.status, call.direction, call.call_type)
        
        logger.info(f"{len(created_calls)} appels planifiés par {current_user.username}")
        
        return jsonify({
            'message': f'{len(created_calls)} appels planifiés avec succès',
            'data': {
                'scheduled_calls': len(created_calls),
                'scheduled_time': data['scheduled_time'].isoformat()
            }
        }), 201
        
    except ValidationError as e:
        return jsonify({
            'error': 'Données invalides',
            'details': e.messages
        }), 400
        
    except Exception as e:
        logger.error(f"Erreur lors de la planification des appels: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@calls_bp.route('/<int:call_id>/start', methods=['POST'])
@jwt_required()
@require_staff
def start_call(call_id):
    """
    Démarrage d'un appel téléphonique
    """
    try:
        db = get_db()
        current_user = get_current_user()
        
        call = db.query(Call).filter(Call.id == call_id).first()
        
        if not call:
            return jsonify({
                'error': 'Appel non trouvé'
            }), 404
        
        if call.status not in ['scheduled', 'manual']:
            return jsonify({
                'error': 'Appel non démarré',
                'message': f"L'appel est déjà en statut {call.status}"
            }), 400
        
        # Mise à jour du statut
        call.status = 'in_progress'
        call.start_time = datetime.now(timezone.utc)
        call.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        
        # Log de l'action
        log_audit_event('UPDATE', 'CALL', call_id, current_user.id)
        
        # Métriques
        record_call(call.status, call.direction, call.call_type)
        
        logger.info(f"Appel démarré: {call.call_id} par {current_user.username}")
        
        return jsonify({
            'message': 'Appel démarré avec succès',
            'data': {
                'id': call.id,
                'call_id': call.call_id,
                'status': call.status,
                'start_time': call.start_time.isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors du démarrage de l'appel {call_id}: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@calls_bp.route('/<int:call_id>/end', methods=['POST'])
@jwt_required()
@require_staff
def end_call(call_id):
    """
    Fin d'un appel téléphonique
    """
    try:
        db = get_db()
        current_user = get_current_user()
        
        call = db.query(Call).filter(Call.id == call_id).first()
        
        if not call:
            return jsonify({
                'error': 'Appel non trouvé'
            }), 404
        
        if call.status != 'in_progress':
            return jsonify({
                'error': 'Appel non en cours',
                'message': f"L'appel est en statut {call.status}"
            }), 400
        
        # Calcul de la durée
        end_time = datetime.now(timezone.utc)
        duration = int((end_time - call.start_time).total_seconds()) if call.start_time else 0
        
        # Mise à jour du statut
        call.status = 'completed'
        call.end_time = end_time
        call.duration = duration
        call.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        
        # Log de l'action
        log_audit_event('UPDATE', 'CALL', call_id, current_user.id)
        
        # Métriques
        record_call(call.status, call.direction, call.call_type)
        record_call_duration(call.status, duration)
        
        logger.info(f"Appel terminé: {call.call_id} - Durée: {duration}s")
        
        return jsonify({
            'message': 'Appel terminé avec succès',
            'data': {
                'id': call.id,
                'call_id': call.call_id,
                'status': call.status,
                'end_time': call.end_time.isoformat(),
                'duration': call.duration
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la fin de l'appel {call_id}: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@calls_bp.route('/<int:call_id>', methods=['PUT'])
@jwt_required()
@require_staff
def update_call(call_id):
    """
    Mise à jour d'un appel
    """
    try:
        # Validation des données
        schema = CallUpdateSchema()
        data = schema.load(request.get_json())
        
        db = get_db()
        current_user = get_current_user()
        
        call = db.query(Call).filter(Call.id == call_id).first()
        
        if not call:
            return jsonify({
                'error': 'Appel non trouvé'
            }), 404
        
        # Mise à jour des champs
        for field, value in data.items():
            if hasattr(call, field):
                setattr(call, field, value)
        
        call.updated_at = datetime.now(timezone.utc)
        db.commit()
        
        # Log de la mise à jour
        log_audit_event('UPDATE', 'CALL', call_id, current_user.id)
        
        logger.info(f"Appel mis à jour: {call.call_id} par {current_user.username}")
        
        return jsonify({
            'message': 'Appel mis à jour avec succès',
            'data': {
                'id': call.id,
                'call_id': call.call_id,
                'status': call.status,
                'updated_at': call.updated_at.isoformat()
            }
        }), 200
        
    except ValidationError as e:
        return jsonify({
            'error': 'Données invalides',
            'details': e.messages
        }), 400
        
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour de l'appel {call_id}: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@calls_bp.route('/<int:call_id>', methods=['DELETE'])
@jwt_required()
@require_staff
def cancel_call(call_id):
    """
    Annulation d'un appel
    """
    try:
        db = get_db()
        current_user = get_current_user()
        
        call = db.query(Call).filter(Call.id == call_id).first()
        
        if not call:
            return jsonify({
                'error': 'Appel non trouvé'
            }), 404
        
        if call.status in ['completed', 'failed']:
            return jsonify({
                'error': 'Appel non annulable',
                'message': f"L'appel est déjà en statut {call.status}"
            }), 400
        
        # Annulation de l'appel
        call.status = 'cancelled'
        call.updated_at = datetime.now(timezone.utc)
        db.commit()
        
        # Log de l'annulation
        log_audit_event('DELETE', 'CALL', call_id, current_user.id)
        
        # Métriques
        record_call(call.status, call.direction, call.call_type)
        
        logger.info(f"Appel annulé: {call.call_id} par {current_user.username}")
        
        return jsonify({
            'message': 'Appel annulé avec succès'
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de l'annulation de l'appel {call_id}: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@calls_bp.route('/stats', methods=['GET'])
@jwt_required()
@require_staff
def get_call_stats():
    """
    Récupération des statistiques des appels
    """
    try:
        db = get_db()
        current_user = get_current_user()
        
        # Statistiques de base
        total_calls = db.query(Call).count()
        completed_calls = db.query(Call).filter(Call.status == 'completed').count()
        failed_calls = db.query(Call).filter(Call.status == 'failed').count()
        scheduled_calls = db.query(Call).filter(Call.status == 'scheduled').count()
        
        # Appels par type
        calls_by_type = db.query(
            Call.call_type,
            db.func.count(Call.id).label('count')
        ).group_by(Call.call_type).all()
        
        # Appels par utilisateur
        calls_by_user = db.query(
            User.first_name,
            User.last_name,
            db.func.count(Call.id).label('count')
        ).join(Call, User.id == Call.user_id).group_by(User.id).all()
        
        # Log de l'accès
        log_audit_event('READ', 'CALL', None, current_user.id)
        
        return jsonify({
            'message': 'Statistiques récupérées avec succès',
            'data': {
                'total_calls': total_calls,
                'completed_calls': completed_calls,
                'failed_calls': failed_calls,
                'scheduled_calls': scheduled_calls,
                'success_rate': (completed_calls / total_calls * 100) if total_calls > 0 else 0,
                'calls_by_type': [{
                    'type': call_type,
                    'count': count
                } for call_type, count in calls_by_type],
                'calls_by_user': [{
                    'user_name': f"{user.first_name} {user.last_name}",
                    'count': count
                } for user, count in calls_by_user]
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des statistiques: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500 