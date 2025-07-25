"""
Modèle Patient pour la gestion des patients HelloJADE
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Date, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from core.database import db

class Patient(db.Model):
    """Modèle patient avec informations médicales sécurisées"""
    
    __tablename__ = 'patients'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Informations personnelles
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(10), nullable=False)  # M, F, Other
    phone_number = Column(String(20), nullable=False, index=True)
    email = Column(String(120), nullable=True)
    
    # Adresse
    address_line1 = Column(String(100), nullable=True)
    address_line2 = Column(String(100), nullable=True)
    city = Column(String(50), nullable=True)
    postal_code = Column(String(10), nullable=True)
    country = Column(String(50), nullable=True, default='Belgique')
    
    # Informations médicales
    medical_record_number = Column(String(20), unique=True, nullable=False, index=True)
    blood_type = Column(String(5), nullable=True)  # A+, B-, etc.
    allergies = Column(Text, nullable=True)
    chronic_conditions = Column(Text, nullable=True)
    current_medications = Column(Text, nullable=True)
    
    # Informations de contact d'urgence
    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    emergency_contact_relationship = Column(String(50), nullable=True)
    
    # Statut et suivi
    is_active = Column(Boolean, default=True, nullable=False)
    discharge_date = Column(Date, nullable=True)
    follow_up_required = Column(Boolean, default=True, nullable=False)
    follow_up_frequency_days = Column(Integer, default=7, nullable=False)
    last_follow_up = Column(DateTime, nullable=True)
    next_follow_up = Column(DateTime, nullable=True)
    
    # Notes et observations
    notes = Column(Text, nullable=True)
    special_instructions = Column(Text, nullable=True)
    
    # Métadonnées
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(Integer, nullable=False)
    
    # Relations
    calls = relationship("Call", back_populates="patient", cascade="all, delete-orphan")
    
    def __init__(self, first_name, last_name, date_of_birth, gender, phone_number, 
                 medical_record_number, created_by, **kwargs):
        self.first_name = first_name
        self.last_name = last_name
        self.date_of_birth = date_of_birth
        self.gender = gender
        self.phone_number = phone_number
        self.medical_record_number = medical_record_number
        self.created_by = created_by
        
        # Attributs optionnels
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    @property
    def full_name(self):
        """Retourne le nom complet du patient"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def age(self):
        """Calcule l'âge du patient"""
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
    
    def is_due_for_follow_up(self):
        """Vérifie si le patient est dû pour un suivi"""
        if not self.follow_up_required:
            return False
        
        if not self.next_follow_up:
            return True
        
        from datetime import datetime
        return datetime.now() >= self.next_follow_up
    
    def schedule_next_follow_up(self, days=None):
        """Planifie le prochain suivi"""
        from datetime import datetime, timedelta
        
        if days is None:
            days = self.follow_up_frequency_days
        
        self.next_follow_up = datetime.now() + timedelta(days=days)
        self.last_follow_up = datetime.now()
    
    def get_recent_calls(self, limit=10):
        """Récupère les appels récents du patient"""
        return Call.query.filter_by(patient_id=self.id)\
                        .order_by(Call.created_at.desc())\
                        .limit(limit).all()
    
    def get_call_statistics(self):
        """Récupère les statistiques des appels du patient"""
        from sqlalchemy import func
        
        stats = db.session.query(
            func.count(Call.id).label('total_calls'),
            func.count(Call.id).filter(Call.status == 'completed').label('completed_calls'),
            func.count(Call.id).filter(Call.status == 'failed').label('failed_calls'),
            func.avg(Call.duration).label('avg_duration')
        ).filter(Call.patient_id == self.id).first()
        
        return {
            'total_calls': stats.total_calls or 0,
            'completed_calls': stats.completed_calls or 0,
            'failed_calls': stats.failed_calls or 0,
            'avg_duration': float(stats.avg_duration) if stats.avg_duration else 0
        }
    
    def to_dict(self, include_sensitive=False):
        """Convertit le patient en dictionnaire"""
        data = {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'age': self.age,
            'gender': self.gender,
            'phone_number': self.phone_number,
            'email': self.email,
            'medical_record_number': self.medical_record_number,
            'is_active': self.is_active,
            'discharge_date': self.discharge_date.isoformat() if self.discharge_date else None,
            'follow_up_required': self.follow_up_required,
            'next_follow_up': self.next_follow_up.isoformat() if self.next_follow_up else None,
            'last_follow_up': self.last_follow_up.isoformat() if self.last_follow_up else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        # Informations sensibles (seulement si autorisé)
        if include_sensitive:
            data.update({
                'address_line1': self.address_line1,
                'address_line2': self.address_line2,
                'city': self.city,
                'postal_code': self.postal_code,
                'country': self.country,
                'blood_type': self.blood_type,
                'allergies': self.allergies,
                'chronic_conditions': self.chronic_conditions,
                'current_medications': self.current_medications,
                'emergency_contact_name': self.emergency_contact_name,
                'emergency_contact_phone': self.emergency_contact_phone,
                'emergency_contact_relationship': self.emergency_contact_relationship,
                'notes': self.notes,
                'special_instructions': self.special_instructions
            })
        
        return data
    
    def __repr__(self):
        return f'<Patient {self.full_name} ({self.medical_record_number})>' 