"""
HelloJADE v1.0 - Module de base de données
Configuration SQLAlchemy et modèles de données Oracle
"""

import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Float, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from sqlalchemy.pool import QueuePool
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Initialisation de SQLAlchemy
db = SQLAlchemy()
migrate = Migrate()

# Base pour les modèles
Base = declarative_base()

logger = logging.getLogger(__name__)


def init_db(app):
    """Initialisation de la base de données"""
    db.init_app(app)
    migrate.init_app(app, db)
    
    with app.app_context():
        try:
            # Test de connexion
            db.session.execute('SELECT 1 FROM DUAL')
            logger.info("Connexion à la base de données Oracle établie")
            
            # Création des tables si elles n'existent pas
            db.create_all()
            logger.info("Tables de base de données créées/mises à jour")
            
        except Exception as e:
            logger.error(f"Erreur lors de l'initialisation de la base de données: {e}")
            raise


class User(db.Model):
    """Modèle utilisateur avec rôles RBAC"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    role = Column(String(20), nullable=False, default='user')  # admin, doctor, nurse, secretary
    is_active = Column(Boolean, default=True)
    is_ldap_user = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # Relations
    calls = relationship("Call", back_populates="user")
    patients = relationship("Patient", back_populates="assigned_user")
    
    def __repr__(self):
        return f"<User {self.username}>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Conversion en dictionnaire"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role,
            'is_active': self.is_active,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def has_permission(self, permission: str) -> bool:
        """Vérification des permissions selon le rôle"""
        permissions = {
            'admin': ['all'],
            'doctor': ['read_patients', 'write_patients', 'read_calls', 'write_calls', 'ai_access'],
            'nurse': ['read_patients', 'read_calls', 'write_calls'],
            'secretary': ['read_patients', 'write_patients', 'read_calls']
        }
        
        user_permissions = permissions.get(self.role, [])
        return 'all' in user_permissions or permission in user_permissions


class Patient(db.Model):
    """Modèle patient avec informations médicales"""
    __tablename__ = 'patients'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String(20), unique=True, nullable=False, index=True)  # ID hospitalier
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    date_of_birth = Column(DateTime, nullable=False)
    gender = Column(String(10), nullable=False)  # M, F, Other
    phone_number = Column(String(20), nullable=False)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    emergency_phone = Column(String(20), nullable=True)
    
    # Informations médicales
    medical_history = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    medications = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=True)
    treatment_plan = Column(Text, nullable=True)
    
    # Statut et suivi
    status = Column(String(20), default='active')  # active, inactive, discharged
    assigned_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Métadonnées
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # Relations
    assigned_user = relationship("User", back_populates="patients")
    calls = relationship("Call", back_populates="patient")
    
    def __repr__(self):
        return f"<Patient {self.patient_id} - {self.first_name} {self.last_name}>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Conversion en dictionnaire"""
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'gender': self.gender,
            'phone_number': self.phone_number,
            'email': self.email,
            'address': self.address,
            'emergency_contact': self.emergency_contact,
            'emergency_phone': self.emergency_phone,
            'medical_history': self.medical_history,
            'allergies': self.allergies,
            'medications': self.medications,
            'diagnosis': self.diagnosis,
            'treatment_plan': self.treatment_plan,
            'status': self.status,
            'assigned_user_id': self.assigned_user_id,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Call(db.Model):
    """Modèle appel avec planification et suivi"""
    __tablename__ = 'calls'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    call_id = Column(String(50), unique=True, nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Planification
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, default=15)
    call_type = Column(String(20), default='follow_up')  # follow_up, reminder, emergency
    
    # Statut de l'appel
    status = Column(String(20), default='scheduled')  # scheduled, in_progress, completed, failed, cancelled
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    actual_duration = Column(Integer, nullable=True)  # en secondes
    
    # Informations téléphoniques
    phone_number = Column(String(20), nullable=False)
    call_recording_path = Column(String(255), nullable=True)
    call_log = Column(Text, nullable=True)
    
    # Résultats et notes
    transcription = Column(Text, nullable=True)
    analysis_result = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(DateTime(timezone=True), nullable=True)
    
    # Tentatives et retry
    attempt_count = Column(Integer, default=0)
    max_attempts = Column(Integer, default=3)
    last_attempt_at = Column(DateTime(timezone=True), nullable=True)
    failure_reason = Column(Text, nullable=True)
    
    # Métadonnées
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # Relations
    patient = relationship("Patient", back_populates="calls")
    user = relationship("User", back_populates="calls")
    
    def __repr__(self):
        return f"<Call {self.call_id} - {self.status}>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Conversion en dictionnaire"""
        return {
            'id': self.id,
            'call_id': self.call_id,
            'patient_id': self.patient_id,
            'user_id': self.user_id,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'duration_minutes': self.duration_minutes,
            'call_type': self.call_type,
            'status': self.status,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'ended_at': self.ended_at.isoformat() if self.ended_at else None,
            'actual_duration': self.actual_duration,
            'phone_number': self.phone_number,
            'call_recording_path': self.call_recording_path,
            'call_log': self.call_log,
            'transcription': self.transcription,
            'analysis_result': self.analysis_result,
            'notes': self.notes,
            'follow_up_required': self.follow_up_required,
            'follow_up_date': self.follow_up_date.isoformat() if self.follow_up_date else None,
            'attempt_count': self.attempt_count,
            'max_attempts': self.max_attempts,
            'last_attempt_at': self.last_attempt_at.isoformat() if self.last_attempt_at else None,
            'failure_reason': self.failure_reason,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def is_overdue(self) -> bool:
        """Vérifie si l'appel est en retard"""
        if self.status == 'scheduled' and self.scheduled_at:
            return datetime.now(timezone.utc) > self.scheduled_at
        return False
    
    def can_retry(self) -> bool:
        """Vérifie si l'appel peut être retenté"""
        return (
            self.status == 'failed' and 
            self.attempt_count < self.max_attempts
        )


class AITranscription(db.Model):
    """Modèle pour les transcriptions IA"""
    __tablename__ = 'ai_transcriptions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    call_id = Column(Integer, ForeignKey('calls.id'), nullable=False)
    audio_file_path = Column(String(255), nullable=False)
    transcription_text = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)
    language = Column(String(10), default='fr')
    processing_time = Column(Float, nullable=True)  # en secondes
    model_used = Column(String(50), nullable=True)
    status = Column(String(20), default='pending')  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    def __repr__(self):
        return f"<AITranscription {self.id} - {self.status}>"


class AIAnalysis(db.Model):
    """Modèle pour les analyses IA"""
    __tablename__ = 'ai_analyses'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    call_id = Column(Integer, ForeignKey('calls.id'), nullable=False)
    transcription_id = Column(Integer, ForeignKey('ai_transcriptions.id'), nullable=True)
    
    analysis_type = Column(String(50), nullable=False)  # sentiment, medical, compliance
    input_text = Column(Text, nullable=False)
    analysis_result = Column(JSON, nullable=True)
    confidence_score = Column(Float, nullable=True)
    processing_time = Column(Float, nullable=True)
    model_used = Column(String(50), nullable=True)
    status = Column(String(20), default='pending')
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    def __repr__(self):
        return f"<AIAnalysis {self.id} - {self.analysis_type}>"


class SystemLog(db.Model):
    """Modèle pour les logs système"""
    __tablename__ = 'system_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    level = Column(String(10), nullable=False)  # INFO, WARNING, ERROR, DEBUG
    module = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    request_data = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    
    def __repr__(self):
        return f"<SystemLog {self.level} - {self.module}>"


class AuditLog(db.Model):
    """Modèle pour les logs d'audit"""
    __tablename__ = 'audit_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    action = Column(String(50), nullable=False)  # CREATE, READ, UPDATE, DELETE
    resource_type = Column(String(50), nullable=False)  # patient, call, user, etc.
    resource_id = Column(String(50), nullable=True)
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    
    def __repr__(self):
        return f"<AuditLog {self.action} - {self.resource_type}>"


# Fonctions utilitaires pour la base de données
def get_session() -> Session:
    """Récupère une session de base de données"""
    return db.session


def commit_session():
    """Valide la session en cours"""
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur lors de la validation de la session: {e}")
        raise


def rollback_session():
    """Annule la session en cours"""
    db.session.rollback() 