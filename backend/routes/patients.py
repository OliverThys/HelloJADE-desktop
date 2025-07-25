#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HelloJADE v1.0 - Routes pour la gestion des patients
Gestion complète des patients avec CRUD et fonctionnalités avancées
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError, validate
from sqlalchemy import and_, or_, desc
from datetime import datetime, timezone
import logging

from core.auth import get_current_user, log_audit_event, require_staff
from core.database import get_db, Patient, User, MedicalRecord, Call
from core.monitoring import record_medical_record, update_patient_count

logger = logging.getLogger(__name__)

patients_bp = Blueprint('patients', __name__)

# Schémas de validation
class PatientSchema(Schema):
    patient_id = fields.Str(required=True, validate=validate.Length(min=1, max=20))
    first_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    last_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    date_of_birth = fields.Date(required=True)
    phone_number = fields.Str(required=True, validate=validate.Length(min=10, max=20))
    email = fields.Email(allow_none=True)
    address = fields.Str(allow_none=True)
    emergency_contact = fields.Str(allow_none=True, validate=validate.Length(max=100))
    emergency_phone = fields.Str(allow_none=True, validate=validate.Length(max=20))
    medical_history = fields.Str(allow_none=True)
    current_medications = fields.Str(allow_none=True)
    allergies = fields.Str(allow_none=True)
    assigned_user_id = fields.Int(allow_none=True)

class PatientUpdateSchema(Schema):
    first_name = fields.Str(validate=validate.Length(min=1, max=50))
    last_name = fields.Str(validate=validate.Length(min=1, max=50))
    phone_number = fields.Str(validate=validate.Length(min=10, max=20))
    email = fields.Email(allow_none=True)
    address = fields.Str(allow_none=True)
    emergency_contact = fields.Str(allow_none=True, validate=validate.Length(max=100))
    emergency_phone = fields.Str(allow_none=True, validate=validate.Length(max=20))
    medical_history = fields.Str(allow_none=True)
    current_medications = fields.Str(allow_none=True)
    allergies = fields.Str(allow_none=True)
    assigned_user_id = fields.Int(allow_none=True)
    is_active = fields.Bool()

class PatientSearchSchema(Schema):
    query = fields.Str(allow_none=True)
    status = fields.Str(allow_none=True, validate=validate.OneOf(['active', 'inactive', 'all']))
    assigned_user_id = fields.Int(allow_none=True)
    page = fields.Int(validate=validate.Range(min=1), missing=1)
    per_page = fields.Int(validate=validate.Range(min=1, max=100), missing=20)

@patients_bp.route('/', methods=['GET'])
@jwt_required()
@require_staff
def get_patients():
    """
    Récupération de la liste des patients avec pagination et filtres
    """
    try:
        # Validation des paramètres de recherche
        schema = PatientSearchSchema()
        data = schema.load(request.args)
        
        db = get_db()
        current_user = get_current_user()
        
        # Construction de la requête de base
        query = db.query(Patient)
        
        # Filtres
        if data.get('query'):
            search_term = f"%{data['query']}%"
            query = query.filter(
                or_(
                    Patient.patient_id.ilike(search_term),
                    Patient.first_name.ilike(search_term),
                    Patient.last_name.ilike(search_term),
                    Patient.phone_number.ilike(search_term),
                    Patient.email.ilike(search_term)
                )
            )
        
        if data.get('status') and data['status'] != 'all':
            is_active = data['status'] == 'active'
            query = query.filter(Patient.is_active == is_active)
        
        if data.get('assigned_user_id'):
            query = query.filter(Patient.assigned_user_id == data['assigned_user_id'])
        
        # Tri par date de création décroissante
        query = query.order_by(desc(Patient.created_at))
        
        # Pagination
        page = data.get('page', 1)
        per_page = data.get('per_page', 20)
        offset = (page - 1) * per_page
        
        total = query.count()
        patients = query.offset(offset).limit(per_page).all()
        
        # Log de l'accès
        log_audit_event('READ', 'PATIENT', None, current_user.id)
        
        # Mise à jour des métriques
        update_patient_count('active', db.query(Patient).filter(Patient.is_active == True).count())
        update_patient_count('inactive', db.query(Patient).filter(Patient.is_active == False).count())
        
        return jsonify({
            'message': 'Patients récupérés avec succès',
            'data': {
                'patients': [{
                    'id': p.id,
                    'patient_id': p.patient_id,
                    'first_name': p.first_name,
                    'last_name': p.last_name,
                    'date_of_birth': p.date_of_birth.isoformat(),
                    'phone_number': p.phone_number,
                    'email': p.email,
                    'is_active': p.is_active,
                    'assigned_user': {
                        'id': p.assigned_user.id,
                        'name': f"{p.assigned_user.first_name} {p.assigned_user.last_name}"
                    } if p.assigned_user else None,
                    'created_at': p.created_at.isoformat(),
                    'updated_at': p.updated_at.isoformat()
                } for p in patients],
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
        logger.error(f"Erreur lors de la récupération des patients: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@patients_bp.route('/<int:patient_id>', methods=['GET'])
@jwt_required()
@require_staff
def get_patient(patient_id):
    """
    Récupération d'un patient spécifique avec ses détails complets
    """
    try:
        db = get_db()
        current_user = get_current_user()
        
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        
        if not patient:
            return jsonify({
                'error': 'Patient non trouvé'
            }), 404
        
        # Récupération des informations associées
        calls = db.query(Call).filter(Call.patient_id == patient_id).order_by(desc(Call.created_at)).limit(10).all()
        medical_records = db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient_id).order_by(desc(MedicalRecord.created_at)).limit(10).all()
        
        # Log de l'accès
        log_audit_event('READ', 'PATIENT', patient_id, current_user.id)
        
        return jsonify({
            'message': 'Patient récupéré avec succès',
            'data': {
                'id': patient.id,
                'patient_id': patient.patient_id,
                'first_name': patient.first_name,
                'last_name': patient.last_name,
                'date_of_birth': patient.date_of_birth.isoformat(),
                'phone_number': patient.phone_number,
                'email': patient.email,
                'address': patient.address,
                'emergency_contact': patient.emergency_contact,
                'emergency_phone': patient.emergency_phone,
                'medical_history': patient.medical_history,
                'current_medications': patient.current_medications,
                'allergies': patient.allergies,
                'is_active': patient.is_active,
                'assigned_user': {
                    'id': patient.assigned_user.id,
                    'name': f"{patient.assigned_user.first_name} {patient.assigned_user.last_name}",
                    'role': patient.assigned_user.role,
                    'department': patient.assigned_user.department
                } if patient.assigned_user else None,
                'created_at': patient.created_at.isoformat(),
                'updated_at': patient.updated_at.isoformat(),
                'recent_calls': [{
                    'id': call.id,
                    'call_id': call.call_id,
                    'status': call.status,
                    'call_type': call.call_type,
                    'scheduled_time': call.scheduled_time.isoformat() if call.scheduled_time else None,
                    'created_at': call.created_at.isoformat()
                } for call in calls],
                'recent_medical_records': [{
                    'id': record.id,
                    'record_type': record.record_type,
                    'title': record.title,
                    'severity': record.severity,
                    'created_at': record.created_at.isoformat()
                } for record in medical_records]
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du patient {patient_id}: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@patients_bp.route('/', methods=['POST'])
@jwt_required()
@require_staff
def create_patient():
    """
    Création d'un nouveau patient
    """
    try:
        # Validation des données
        schema = PatientSchema()
        data = schema.load(request.get_json())
        
        db = get_db()
        current_user = get_current_user()
        
        # Vérification de l'unicité du patient_id
        existing_patient = db.query(Patient).filter(Patient.patient_id == data['patient_id']).first()
        if existing_patient:
            return jsonify({
                'error': 'Patient ID déjà existant',
                'message': f"Un patient avec l'ID {data['patient_id']} existe déjà"
            }), 409
        
        # Vérification de l'utilisateur assigné si spécifié
        if data.get('assigned_user_id'):
            assigned_user = db.query(User).filter(User.id == data['assigned_user_id']).first()
            if not assigned_user:
                return jsonify({
                    'error': 'Utilisateur assigné non trouvé'
                }), 404
        
        # Création du patient
        patient = Patient(**data)
        db.add(patient)
        db.commit()
        db.refresh(patient)
        
        # Log de la création
        log_audit_event('CREATE', 'PATIENT', patient.id, current_user.id)
        
        logger.info(f"Nouveau patient créé: {patient.patient_id} par {current_user.username}")
        
        return jsonify({
            'message': 'Patient créé avec succès',
            'data': {
                'id': patient.id,
                'patient_id': patient.patient_id,
                'first_name': patient.first_name,
                'last_name': patient.last_name,
                'created_at': patient.created_at.isoformat()
            }
        }), 201
        
    except ValidationError as e:
        return jsonify({
            'error': 'Données invalides',
            'details': e.messages
        }), 400
        
    except Exception as e:
        logger.error(f"Erreur lors de la création du patient: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@patients_bp.route('/<int:patient_id>', methods=['PUT'])
@jwt_required()
@require_staff
def update_patient(patient_id):
    """
    Mise à jour d'un patient existant
    """
    try:
        # Validation des données
        schema = PatientUpdateSchema()
        data = schema.load(request.get_json())
        
        db = get_db()
        current_user = get_current_user()
        
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        
        if not patient:
            return jsonify({
                'error': 'Patient non trouvé'
            }), 404
        
        # Sauvegarde des anciennes valeurs pour l'audit
        old_values = {
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'phone_number': patient.phone_number,
            'email': patient.email,
            'assigned_user_id': patient.assigned_user_id
        }
        
        # Vérification de l'utilisateur assigné si spécifié
        if data.get('assigned_user_id'):
            assigned_user = db.query(User).filter(User.id == data['assigned_user_id']).first()
            if not assigned_user:
                return jsonify({
                    'error': 'Utilisateur assigné non trouvé'
                }), 404
        
        # Mise à jour des champs
        for field, value in data.items():
            if hasattr(patient, field):
                setattr(patient, field, value)
        
        patient.updated_at = datetime.now(timezone.utc)
        db.commit()
        
        # Log de la mise à jour
        log_audit_event('UPDATE', 'PATIENT', patient_id, current_user.id)
        
        logger.info(f"Patient mis à jour: {patient.patient_id} par {current_user.username}")
        
        return jsonify({
            'message': 'Patient mis à jour avec succès',
            'data': {
                'id': patient.id,
                'patient_id': patient.patient_id,
                'first_name': patient.first_name,
                'last_name': patient.last_name,
                'updated_at': patient.updated_at.isoformat()
            }
        }), 200
        
    except ValidationError as e:
        return jsonify({
            'error': 'Données invalides',
            'details': e.messages
        }), 400
        
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour du patient {patient_id}: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@patients_bp.route('/<int:patient_id>', methods=['DELETE'])
@jwt_required()
@require_staff
def delete_patient(patient_id):
    """
    Suppression logique d'un patient (désactivation)
    """
    try:
        db = get_db()
        current_user = get_current_user()
        
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        
        if not patient:
            return jsonify({
                'error': 'Patient non trouvé'
            }), 404
        
        # Vérification s'il y a des appels en cours
        active_calls = db.query(Call).filter(
            and_(
                Call.patient_id == patient_id,
                Call.status.in_(['scheduled', 'in_progress'])
            )
        ).count()
        
        if active_calls > 0:
            return jsonify({
                'error': 'Impossible de supprimer le patient',
                'message': f'Il y a {active_calls} appel(s) en cours pour ce patient'
            }), 400
        
        # Désactivation du patient
        patient.is_active = False
        patient.updated_at = datetime.now(timezone.utc)
        db.commit()
        
        # Log de la suppression
        log_audit_event('DELETE', 'PATIENT', patient_id, current_user.id)
        
        logger.info(f"Patient désactivé: {patient.patient_id} par {current_user.username}")
        
        return jsonify({
            'message': 'Patient supprimé avec succès'
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la suppression du patient {patient_id}: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@patients_bp.route('/<int:patient_id>/medical-records', methods=['GET'])
@jwt_required()
@require_staff
def get_patient_medical_records(patient_id):
    """
    Récupération des dossiers médicaux d'un patient
    """
    try:
        db = get_db()
        current_user = get_current_user()
        
        # Vérification de l'existence du patient
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            return jsonify({
                'error': 'Patient non trouvé'
            }), 404
        
        # Récupération des dossiers médicaux
        records = db.query(MedicalRecord).filter(
            MedicalRecord.patient_id == patient_id
        ).order_by(desc(MedicalRecord.created_at)).all()
        
        # Log de l'accès
        log_audit_event('READ', 'MEDICAL_RECORD', patient_id, current_user.id)
        
        return jsonify({
            'message': 'Dossiers médicaux récupérés avec succès',
            'data': {
                'patient': {
                    'id': patient.id,
                    'patient_id': patient.patient_id,
                    'name': f"{patient.first_name} {patient.last_name}"
                },
                'records': [{
                    'id': record.id,
                    'record_type': record.record_type,
                    'title': record.title,
                    'content': record.content,
                    'ai_generated': record.ai_generated,
                    'severity': record.severity,
                    'tags': record.tags,
                    'created_by': {
                        'id': record.created_by_user.id,
                        'name': f"{record.created_by_user.first_name} {record.created_by_user.last_name}"
                    },
                    'created_at': record.created_at.isoformat()
                } for record in records]
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des dossiers médicaux: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@patients_bp.route('/<int:patient_id>/calls', methods=['GET'])
@jwt_required()
@require_staff
def get_patient_calls(patient_id):
    """
    Récupération de l'historique des appels d'un patient
    """
    try:
        db = get_db()
        current_user = get_current_user()
        
        # Vérification de l'existence du patient
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            return jsonify({
                'error': 'Patient non trouvé'
            }), 404
        
        # Récupération des appels
        calls = db.query(Call).filter(
            Call.patient_id == patient_id
        ).order_by(desc(Call.created_at)).all()
        
        # Log de l'accès
        log_audit_event('READ', 'CALL', patient_id, current_user.id)
        
        return jsonify({
            'message': 'Historique des appels récupéré avec succès',
            'data': {
                'patient': {
                    'id': patient.id,
                    'patient_id': patient.patient_id,
                    'name': f"{patient.first_name} {patient.last_name}"
                },
                'calls': [{
                    'id': call.id,
                    'call_id': call.call_id,
                    'status': call.status,
                    'call_type': call.call_type,
                    'direction': call.direction,
                    'scheduled_time': call.scheduled_time.isoformat() if call.scheduled_time else None,
                    'start_time': call.start_time.isoformat() if call.start_time else None,
                    'end_time': call.end_time.isoformat() if call.end_time else None,
                    'duration': call.duration,
                    'user': {
                        'id': call.user.id,
                        'name': f"{call.user.first_name} {call.user.last_name}"
                    },
                    'created_at': call.created_at.isoformat()
                } for call in calls]
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération de l'historique des appels: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@patients_bp.route('/stats', methods=['GET'])
@jwt_required()
@require_staff
def get_patient_stats():
    """
    Récupération des statistiques des patients
    """
    try:
        db = get_db()
        current_user = get_current_user()
        
        # Statistiques de base
        total_patients = db.query(Patient).count()
        active_patients = db.query(Patient).filter(Patient.is_active == True).count()
        inactive_patients = db.query(Patient).filter(Patient.is_active == False).count()
        
        # Patients par utilisateur assigné
        patients_by_user = db.query(
            User.first_name,
            User.last_name,
            db.func.count(Patient.id).label('count')
        ).outerjoin(Patient, User.id == Patient.assigned_user_id).group_by(User.id).all()
        
        # Log de l'accès
        log_audit_event('READ', 'PATIENT', None, current_user.id)
        
        return jsonify({
            'message': 'Statistiques récupérées avec succès',
            'data': {
                'total_patients': total_patients,
                'active_patients': active_patients,
                'inactive_patients': inactive_patients,
                'patients_by_user': [{
                    'user_name': f"{user.first_name} {user.last_name}",
                    'count': user.count
                } for user in patients_by_user]
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des statistiques: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500 