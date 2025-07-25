#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HelloJADE v1.0 - Module de base de données
Gestion de la connexion Oracle et des modèles SQLAlchemy
"""

import logging
from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, Float, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, scoped_session
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import SQLAlchemyError, OperationalError
from contextlib import contextmanager
import cx_Oracle

# Configuration du logging Oracle
cx_Oracle.init_oracle_client()
logging.getLogger('cx_Oracle').setLevel(logging.WARNING)

Base = declarative_base()

class DatabaseManager:
    """
    Gestionnaire de base de données Oracle pour HelloJADE
    """
    
    def __init__(self, app=None):
        self.app = app
        self.engine = None
        self.SessionLocal = None
        self._session = None
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialise la connexion à la base de données"""
        try:
            # Configuration de l'engine Oracle
            self.engine = create_engine(
                app.config['SQLALCHEMY_DATABASE_URI'],
                poolclass=QueuePool,
                pool_size=app.config.get('SQLALCHEMY_ENGINE_OPTIONS', {}).get('pool_size', 10),
                max_overflow=app.config.get('SQLALCHEMY_ENGINE_OPTIONS', {}).get('max_overflow', 20),
                pool_timeout=app.config.get('SQLALCHEMY_ENGINE_OPTIONS', {}).get('pool_timeout', 30),
                pool_recycle=app.config.get('SQLALCHEMY_ENGINE_OPTIONS', {}).get('pool_recycle', 3600),
                echo=app.config.get('DEBUG', False)
            )
            
            # Création de la session factory
            self.SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.engine
            )
            
            # Session thread-local
            self._session = scoped_session(self.SessionLocal)
            
            app.logger.info("Base de données Oracle initialisée avec succès")
            
        except Exception as e:
            app.logger.error(f"Erreur lors de l'initialisation de la base de données: {str(e)}")
            raise
    
    def get_session(self):
        """Retourne la session de base de données"""
        return self._session()
    
    @contextmanager
    def session_scope(self):
        """Context manager pour la gestion des sessions"""
        session = self.get_session()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            raise
        finally:
            session.close()
    
    def create_tables(self):
        """Crée toutes les tables de la base de données"""
        try:
            Base.metadata.create_all(bind=self.engine)
            logging.info("Tables créées avec succès")
        except Exception as e:
            logging.error(f"Erreur lors de la création des tables: {str(e)}")
            raise
    
    def drop_tables(self):
        """Supprime toutes les tables de la base de données"""
        try:
            Base.metadata.drop_all(bind=self.engine)
            logging.info("Tables supprimées avec succès")
        except Exception as e:
            logging.error(f"Erreur lors de la suppression des tables: {str(e)}")
            raise

# Instance globale du gestionnaire de base de données
db_manager = DatabaseManager()

def init_db(app):
    """Initialise la base de données pour l'application Flask"""
    db_manager.init_app(app)
    
    # Création des tables si elles n'existent pas
    with app.app_context():
        try:
            db_manager.create_tables()
        except Exception as e:
            app.logger.error(f"Erreur lors de la création des tables: {str(e)}")
            raise

def get_db():
    """Retourne une session de base de données"""
    return db_manager.get_session()

# Modèles SQLAlchemy

class User(Base):
    """
    Modèle utilisateur avec authentification LDAP
    """
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    role = Column(String(20), nullable=False, default='user')  # admin, medecin, infirmier, secretaire
    department = Column(String(100), nullable=True)
    ldap_dn = Column(String(200), unique=True, nullable=True)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relations
    calls = relationship("Call", back_populates="user")
    patients = relationship("Patient", back_populates="assigned_user")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"

class Patient(Base):
    """
    Modèle patient
    """
    __tablename__ = 'patients'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String(20), unique=True, nullable=False, index=True)  # ID hospitalier
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    date_of_birth = Column(DateTime, nullable=False)
    phone_number = Column(String(20), nullable=False)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    emergency_phone = Column(String(20), nullable=True)
    medical_history = Column(Text, nullable=True)
    current_medications = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    assigned_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relations
    assigned_user = relationship("User", back_populates="patients")
    calls = relationship("Call", back_populates="patient")
    medical_records = relationship("MedicalRecord", back_populates="patient")
    
    def __repr__(self):
        return f"<Patient(id={self.id}, patient_id='{self.patient_id}', name='{self.first_name} {self.last_name}')>"

class Call(Base):
    """
    Modèle appel téléphonique
    """
    __tablename__ = 'calls'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    call_id = Column(String(50), unique=True, nullable=False, index=True)  # ID Asterisk/Zadarma
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    call_type = Column(String(20), nullable=False)  # scheduled, manual, follow_up
    status = Column(String(20), nullable=False, default='scheduled')  # scheduled, in_progress, completed, failed, cancelled
    direction = Column(String(10), nullable=False, default='outbound')  # inbound, outbound
    phone_number = Column(String(20), nullable=False)
    scheduled_time = Column(DateTime(timezone=True), nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration = Column(Integer, nullable=True)  # en secondes
    recording_path = Column(String(500), nullable=True)
    transcription_text = Column(Text, nullable=True)
    ai_analysis = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relations
    patient = relationship("Patient", back_populates="calls")
    user = relationship("User", back_populates="calls")
    medical_records = relationship("MedicalRecord", back_populates="call")
    
    def __repr__(self):
        return f"<Call(id={self.id}, call_id='{self.call_id}', status='{self.status}')>"

class MedicalRecord(Base):
    """
    Modèle dossier médical
    """
    __tablename__ = 'medical_records'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    call_id = Column(Integer, ForeignKey('calls.id'), nullable=True)
    record_type = Column(String(50), nullable=False)  # call_summary, medical_note, prescription, test_result
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    ai_generated = Column(Boolean, default=False)
    severity = Column(String(20), nullable=True)  # low, medium, high, critical
    tags = Column(Text, nullable=True)  # JSON array de tags
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relations
    patient = relationship("Patient", back_populates="medical_records")
    call = relationship("Call", back_populates="medical_records")
    created_by_user = relationship("User")
    
    def __repr__(self):
        return f"<MedicalRecord(id={self.id}, type='{self.record_type}', title='{self.title}')>"

class AITranscription(Base):
    """
    Modèle transcription IA
    """
    __tablename__ = 'ai_transcriptions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    call_id = Column(Integer, ForeignKey('calls.id'), nullable=False)
    audio_file_path = Column(String(500), nullable=False)
    transcription_text = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=True)
    language = Column(String(10), nullable=False, default='fr')
    model_used = Column(String(50), nullable=False, default='whisper-base')
    processing_time = Column(Float, nullable=True)  # en secondes
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relations
    call = relationship("Call")
    
    def __repr__(self):
        return f"<AITranscription(id={self.id}, call_id={self.call_id}, confidence={self.confidence_score})>"

class AIAnalysis(Base):
    """
    Modèle analyse IA
    """
    __tablename__ = 'ai_analyses'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    call_id = Column(Integer, ForeignKey('calls.id'), nullable=False)
    transcription_id = Column(Integer, ForeignKey('ai_transcriptions.id'), nullable=False)
    analysis_type = Column(String(50), nullable=False)  # sentiment, medical_summary, risk_assessment
    analysis_result = Column(Text, nullable=False)  # JSON
    confidence_score = Column(Float, nullable=True)
    model_used = Column(String(50), nullable=False, default='ollama-llama2')
    processing_time = Column(Float, nullable=True)  # en secondes
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relations
    call = relationship("Call")
    transcription = relationship("AITranscription")
    
    def __repr__(self):
        return f"<AIAnalysis(id={self.id}, call_id={self.call_id}, type='{self.analysis_type}')>"

class SystemLog(Base):
    """
    Modèle log système
    """
    __tablename__ = 'system_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    level = Column(String(10), nullable=False)  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    module = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    details = Column(Text, nullable=True)  # JSON
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relations
    user = relationship("User")
    
    def __repr__(self):
        return f"<SystemLog(id={self.id}, level='{self.level}', module='{self.module}')>"

class AuditLog(Base):
    """
    Modèle log d'audit pour conformité RGPD/ISO 27001
    """
    __tablename__ = 'audit_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    action = Column(String(50), nullable=False)  # CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT
    resource_type = Column(String(50), nullable=False)  # USER, PATIENT, CALL, MEDICAL_RECORD
    resource_id = Column(Integer, nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    ip_address = Column(String(45), nullable=False)
    user_agent = Column(String(500), nullable=True)
    old_values = Column(Text, nullable=True)  # JSON
    new_values = Column(Text, nullable=True)  # JSON
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relations
    user = relationship("User")
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, action='{self.action}', resource='{self.resource_type}')>"

# Index pour optimiser les performances
Index('idx_patients_patient_id', Patient.patient_id)
Index('idx_calls_call_id', Call.call_id)
Index('idx_calls_scheduled_time', Call.scheduled_time)
Index('idx_calls_status', Call.status)
Index('idx_medical_records_patient_type', MedicalRecord.patient_id, MedicalRecord.record_type)
Index('idx_system_logs_level_created', SystemLog.level, SystemLog.created_at)
Index('idx_audit_logs_action_created', AuditLog.action, AuditLog.created_at)
Index('idx_users_username', User.username)
Index('idx_users_role', User.role) 