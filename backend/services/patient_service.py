"""
Service de gestion des patients HelloJADE
"""

from typing import List, Dict, Optional, Tuple
from datetime import datetime, date, timedelta
from sqlalchemy import and_, or_, func
import logging

from core.database import db
from models.patient import Patient
from models.call import Call
from core.logging import log_structured
from core.security import enforce_strict_validation

class PatientService:
    """Service pour la gestion des patients"""
    
    @staticmethod
    def create_patient(data: Dict, created_by: int) -> Patient:
        """Crée un nouveau patient"""
        try:
            # Validation des données
            if not enforce_strict_validation(data):
                raise ValueError("Données de patient invalides")
            
            # Vérification de l'unicité du numéro de dossier médical
            existing_patient = Patient.query.filter_by(
                medical_record_number=data['medical_record_number']
            ).first()
            
            if existing_patient:
                raise ValueError(f"Un patient avec le numéro de dossier {data['medical_record_number']} existe déjà")
            
            # Création du patient
            patient = Patient(
                first_name=data['first_name'],
                last_name=data['last_name'],
                date_of_birth=data['date_of_birth'],
                gender=data['gender'],
                phone_number=data['phone_number'],
                medical_record_number=data['medical_record_number'],
                created_by=created_by,
                **{k: v for k, v in data.items() if k not in [
                    'first_name', 'last_name', 'date_of_birth', 'gender', 
                    'phone_number', 'medical_record_number'
                ]}
            )
            
            db.session.add(patient)
            db.session.commit()
            
            log_structured(
                'patient_created',
                user_id=created_by,
                patient_id=patient.id,
                medical_record_number=patient.medical_record_number
            )
            
            return patient
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"Erreur lors de la création du patient: {e}")
            raise
    
    @staticmethod
    def get_patient(patient_id: int, include_sensitive: bool = False) -> Optional[Patient]:
        """Récupère un patient par son ID"""
        try:
            patient = Patient.query.get(patient_id)
            if not patient:
                return None
            
            return patient
            
        except Exception as e:
            logging.error(f"Erreur lors de la récupération du patient {patient_id}: {e}")
            raise
    
    @staticmethod
    def update_patient(patient_id: int, data: Dict, updated_by: int) -> Optional[Patient]:
        """Met à jour un patient"""
        try:
            # Validation des données
            if not enforce_strict_validation(data):
                raise ValueError("Données de mise à jour invalides")
            
            patient = Patient.query.get(patient_id)
            if not patient:
                return None
            
            # Vérification de l'unicité du numéro de dossier si modifié
            if 'medical_record_number' in data and data['medical_record_number'] != patient.medical_record_number:
                existing_patient = Patient.query.filter_by(
                    medical_record_number=data['medical_record_number']
                ).first()
                
                if existing_patient:
                    raise ValueError(f"Un patient avec le numéro de dossier {data['medical_record_number']} existe déjà")
            
            # Mise à jour des champs
            for key, value in data.items():
                if hasattr(patient, key):
                    setattr(patient, key, value)
            
            db.session.commit()
            
            log_structured(
                'patient_updated',
                user_id=updated_by,
                patient_id=patient.id,
                changes=data
            )
            
            return patient
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"Erreur lors de la mise à jour du patient {patient_id}: {e}")
            raise
    
    @staticmethod
    def delete_patient(patient_id: int, deleted_by: int) -> bool:
        """Supprime un patient (soft delete)"""
        try:
            patient = Patient.query.get(patient_id)
            if not patient:
                return False
            
            # Soft delete - marquer comme inactif
            patient.is_active = False
            db.session.commit()
            
            log_structured(
                'patient_deleted',
                user_id=deleted_by,
                patient_id=patient.id
            )
            
            return True
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"Erreur lors de la suppression du patient {patient_id}: {e}")
            raise
    
    @staticmethod
    def search_patients(
        search_term: str = None,
        status: str = None,
        follow_up_required: bool = None,
        page: int = 1,
        per_page: int = 20,
        include_sensitive: bool = False
    ) -> Tuple[List[Patient], int]:
        """Recherche des patients avec filtres"""
        try:
            query = Patient.query
            
            # Filtres de recherche
            if search_term:
                search_filter = or_(
                    Patient.first_name.ilike(f'%{search_term}%'),
                    Patient.last_name.ilike(f'%{search_term}%'),
                    Patient.medical_record_number.ilike(f'%{search_term}%'),
                    Patient.phone_number.ilike(f'%{search_term}%')
                )
                query = query.filter(search_filter)
            
            if status == 'active':
                query = query.filter(Patient.is_active == True)
            elif status == 'inactive':
                query = query.filter(Patient.is_active == False)
            
            if follow_up_required is not None:
                query = query.filter(Patient.follow_up_required == follow_up_required)
            
            # Tri par nom
            query = query.order_by(Patient.last_name, Patient.first_name)
            
            # Pagination
            total = query.count()
            patients = query.offset((page - 1) * per_page).limit(per_page).all()
            
            return patients, total
            
        except Exception as e:
            logging.error(f"Erreur lors de la recherche de patients: {e}")
            raise
    
    @staticmethod
    def get_patients_due_for_follow_up(limit: int = 50) -> List[Patient]:
        """Récupère les patients dus pour un suivi"""
        try:
            patients = Patient.query.filter(
                and_(
                    Patient.is_active == True,
                    Patient.follow_up_required == True,
                    or_(
                        Patient.next_follow_up.is_(None),
                        Patient.next_follow_up <= datetime.now()
                    )
                )
            ).order_by(Patient.next_follow_up.asc().nullsfirst()).limit(limit).all()
            
            return patients
            
        except Exception as e:
            logging.error(f"Erreur lors de la récupération des patients dus pour suivi: {e}")
            raise
    
    @staticmethod
    def get_patient_statistics(patient_id: int) -> Dict:
        """Récupère les statistiques d'un patient"""
        try:
            patient = Patient.query.get(patient_id)
            if not patient:
                return {}
            
            # Statistiques des appels
            call_stats = patient.get_call_statistics()
            
            # Statistiques de suivi
            follow_up_stats = db.session.query(
                func.count(Call.id).label('total_follow_ups'),
                func.count(Call.id).filter(Call.status == 'completed').label('completed_follow_ups'),
                func.avg(Call.duration).label('avg_call_duration')
            ).filter(
                and_(
                    Call.patient_id == patient_id,
                    Call.call_type == 'follow_up'
                )
            ).first()
            
            # Dernier appel
            last_call = Call.query.filter_by(patient_id=patient_id)\
                                 .order_by(Call.created_at.desc())\
                                 .first()
            
            stats = {
                'patient_id': patient_id,
                'call_statistics': call_stats,
                'follow_up_statistics': {
                    'total_follow_ups': follow_up_stats.total_follow_ups or 0,
                    'completed_follow_ups': follow_up_stats.completed_follow_ups or 0,
                    'avg_call_duration': float(follow_up_stats.avg_call_duration) if follow_up_stats.avg_call_duration else 0
                },
                'last_call': last_call.to_dict() if last_call else None,
                'is_due_for_follow_up': patient.is_due_for_follow_up(),
                'days_since_last_follow_up': None
            }
            
            # Calcul des jours depuis le dernier suivi
            if patient.last_follow_up:
                days_since = (datetime.now() - patient.last_follow_up).days
                stats['days_since_last_follow_up'] = days_since
            
            return stats
            
        except Exception as e:
            logging.error(f"Erreur lors de la récupération des statistiques du patient {patient_id}: {e}")
            raise
    
    @staticmethod
    def schedule_next_follow_up(patient_id: int, days: int = None, scheduled_by: int = None) -> bool:
        """Planifie le prochain suivi d'un patient"""
        try:
            patient = Patient.query.get(patient_id)
            if not patient:
                return False
            
            patient.schedule_next_follow_up(days)
            db.session.commit()
            
            if scheduled_by:
                log_structured(
                    'follow_up_scheduled',
                    user_id=scheduled_by,
                    patient_id=patient_id,
                    next_follow_up=patient.next_follow_up.isoformat() if patient.next_follow_up else None
                )
            
            return True
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"Erreur lors de la planification du suivi du patient {patient_id}: {e}")
            raise 