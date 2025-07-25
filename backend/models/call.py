"""
Modèle Call pour la gestion des appels HelloJADE
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Numeric, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from core.database import db

class Call(db.Model):
    """Modèle appel avec intégration téléphonie et IA"""
    
    __tablename__ = 'calls'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Relations
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    
    # Informations de l'appel
    phone_number = Column(String(20), nullable=False)
    call_type = Column(String(20), nullable=False, default='follow_up')  # follow_up, reminder, emergency
    status = Column(String(20), nullable=False, default='scheduled')  # scheduled, in_progress, completed, failed, cancelled
    
    # Planification
    scheduled_at = Column(DateTime, nullable=False, index=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    duration = Column(Integer, nullable=True)  # en secondes
    
    # Tentatives et retry
    attempt_count = Column(Integer, default=0, nullable=False)
    max_attempts = Column(Integer, default=3, nullable=False)
    retry_delay_minutes = Column(Integer, default=30, nullable=False)
    next_attempt = Column(DateTime, nullable=True)
    
    # Intégration téléphonie
    asterisk_call_id = Column(String(50), nullable=True, index=True)
    zadarma_call_id = Column(String(50), nullable=True, index=True)
    external_call_id = Column(String(100), nullable=True, index=True)
    
    # Enregistrement audio
    audio_file_path = Column(String(255), nullable=True)
    audio_duration = Column(Integer, nullable=True)  # en secondes
    audio_quality = Column(String(20), nullable=True)  # good, poor, failed
    
    # Transcription et analyse IA
    transcription_text = Column(Text, nullable=True)
    transcription_confidence = Column(Numeric(5, 2), nullable=True)  # 0.00 à 1.00
    transcription_model = Column(String(50), nullable=True)  # whisper model utilisé
    
    # Analyse de sentiment/contenu
    sentiment_score = Column(Numeric(3, 2), nullable=True)  # -1.00 à 1.00
    sentiment_label = Column(String(20), nullable=True)  # positive, negative, neutral
    key_topics = Column(Text, nullable=True)  # JSON des sujets détectés
    risk_indicators = Column(Text, nullable=True)  # JSON des indicateurs de risque
    
    # Notes et observations
    notes = Column(Text, nullable=True)
    follow_up_required = Column(Boolean, default=False, nullable=False)
    follow_up_notes = Column(Text, nullable=True)
    
    # Métadonnées
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relations
    patient = relationship("Patient", back_populates="calls")
    user = relationship("User", back_populates="calls")
    
    def __init__(self, patient_id, user_id, phone_number, scheduled_at, **kwargs):
        self.patient_id = patient_id
        self.user_id = user_id
        self.phone_number = phone_number
        self.scheduled_at = scheduled_at
        
        # Attributs optionnels
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def start_call(self):
        """Marque le début de l'appel"""
        from datetime import datetime
        self.status = 'in_progress'
        self.started_at = datetime.now()
        self.attempt_count += 1
    
    def end_call(self, status='completed', duration=None):
        """Marque la fin de l'appel"""
        from datetime import datetime
        self.status = status
        self.ended_at = datetime.now()
        
        if duration is None and self.started_at:
            self.duration = int((self.ended_at - self.started_at).total_seconds())
        else:
            self.duration = duration
    
    def mark_failed(self, reason=None):
        """Marque l'appel comme échoué"""
        self.status = 'failed'
        if reason:
            self.notes = f"Échec: {reason}\n{self.notes or ''}"
        
        # Planifier une nouvelle tentative si possible
        if self.attempt_count < self.max_attempts:
            from datetime import datetime, timedelta
            self.next_attempt = datetime.now() + timedelta(minutes=self.retry_delay_minutes)
            self.status = 'scheduled'
    
    def can_retry(self):
        """Vérifie si l'appel peut être retenté"""
        return self.attempt_count < self.max_attempts and self.status in ['failed', 'cancelled']
    
    def is_overdue(self):
        """Vérifie si l'appel est en retard"""
        from datetime import datetime
        return self.status == 'scheduled' and datetime.now() > self.scheduled_at
    
    def is_due(self):
        """Vérifie si l'appel est dû pour exécution"""
        from datetime import datetime
        return (self.status == 'scheduled' and 
                datetime.now() >= self.scheduled_at and
                (self.next_attempt is None or datetime.now() >= self.next_attempt))
    
    def set_transcription(self, text, confidence=None, model=None):
        """Définit la transcription de l'appel"""
        self.transcription_text = text
        self.transcription_confidence = confidence
        self.transcription_model = model
    
    def set_analysis(self, sentiment_score=None, sentiment_label=None, key_topics=None, risk_indicators=None):
        """Définit l'analyse IA de l'appel"""
        self.sentiment_score = sentiment_score
        self.sentiment_label = sentiment_label
        
        if key_topics:
            import json
            self.key_topics = json.dumps(key_topics)
        
        if risk_indicators:
            import json
            self.risk_indicators = json.dumps(risk_indicators)
    
    def get_analysis_data(self):
        """Récupère les données d'analyse au format dictionnaire"""
        data = {
            'sentiment_score': float(self.sentiment_score) if self.sentiment_score else None,
            'sentiment_label': self.sentiment_label,
            'key_topics': None,
            'risk_indicators': None
        }
        
        if self.key_topics:
            try:
                import json
                data['key_topics'] = json.loads(self.key_topics)
            except:
                pass
        
        if self.risk_indicators:
            try:
                import json
                data['risk_indicators'] = json.loads(self.risk_indicators)
            except:
                pass
        
        return data
    
    def to_dict(self, include_audio=False):
        """Convertit l'appel en dictionnaire"""
        data = {
            'id': self.id,
            'patient_id': self.patient_id,
            'user_id': self.user_id,
            'phone_number': self.phone_number,
            'call_type': self.call_type,
            'status': self.status,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'ended_at': self.ended_at.isoformat() if self.ended_at else None,
            'duration': self.duration,
            'attempt_count': self.attempt_count,
            'max_attempts': self.max_attempts,
            'next_attempt': self.next_attempt.isoformat() if self.next_attempt else None,
            'transcription_text': self.transcription_text,
            'transcription_confidence': float(self.transcription_confidence) if self.transcription_confidence else None,
            'transcription_model': self.transcription_model,
            'sentiment_score': float(self.sentiment_score) if self.sentiment_score else None,
            'sentiment_label': self.sentiment_label,
            'notes': self.notes,
            'follow_up_required': self.follow_up_required,
            'follow_up_notes': self.follow_up_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        # Données d'analyse
        analysis_data = self.get_analysis_data()
        data.update(analysis_data)
        
        # Informations audio (seulement si demandé)
        if include_audio:
            data.update({
                'audio_file_path': self.audio_file_path,
                'audio_duration': self.audio_duration,
                'audio_quality': self.audio_quality
            })
        
        return data
    
    def __repr__(self):
        return f'<Call {self.id} - {self.status} - {self.phone_number}>' 