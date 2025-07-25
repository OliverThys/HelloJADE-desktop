"""
Schémas de validation pour les appels HelloJADE
"""

from marshmallow import Schema, fields, validate, validates, ValidationError
from datetime import datetime, timedelta

class CallSchema(Schema):
    """Schéma pour la sérialisation des appels"""
    id = fields.Int(dump_only=True)
    patient_id = fields.Int(required=True)
    user_id = fields.Int(required=True)
    phone_number = fields.Str(required=True, validate=validate.Length(min=10, max=20))
    call_type = fields.Str(required=True, validate=validate.OneOf(['follow_up', 'reminder', 'emergency']))
    status = fields.Str(dump_only=True, validate=validate.OneOf(['scheduled', 'in_progress', 'completed', 'failed', 'cancelled']))
    
    # Planification
    scheduled_at = fields.DateTime(required=True)
    started_at = fields.DateTime(dump_only=True)
    ended_at = fields.DateTime(dump_only=True)
    duration = fields.Int(dump_only=True)
    
    # Tentatives
    attempt_count = fields.Int(dump_only=True)
    max_attempts = fields.Int(missing=3, validate=validate.Range(min=1, max=10))
    retry_delay_minutes = fields.Int(missing=30, validate=validate.Range(min=5, max=1440))
    next_attempt = fields.DateTime(dump_only=True)
    
    # Intégration téléphonie
    asterisk_call_id = fields.Str(dump_only=True)
    zadarma_call_id = fields.Str(dump_only=True)
    external_call_id = fields.Str(dump_only=True)
    
    # Audio
    audio_file_path = fields.Str(dump_only=True)
    audio_duration = fields.Int(dump_only=True)
    audio_quality = fields.Str(dump_only=True, validate=validate.OneOf(['good', 'poor', 'failed']))
    
    # Transcription et analyse
    transcription_text = fields.Str(dump_only=True)
    transcription_confidence = fields.Decimal(dump_only=True, places=2)
    transcription_model = fields.Str(dump_only=True)
    sentiment_score = fields.Decimal(dump_only=True, places=2)
    sentiment_label = fields.Str(dump_only=True, validate=validate.OneOf(['positive', 'negative', 'neutral']))
    key_topics = fields.Dict(dump_only=True)
    risk_indicators = fields.Dict(dump_only=True)
    
    # Notes
    notes = fields.Str(allow_none=True)
    follow_up_required = fields.Bool(dump_only=True)
    follow_up_notes = fields.Str(dump_only=True)
    
    # Métadonnées
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class CallCreateSchema(Schema):
    """Schéma pour la création d'appels"""
    patient_id = fields.Int(required=True)
    phone_number = fields.Str(required=True, validate=validate.Length(min=10, max=20))
    call_type = fields.Str(required=True, validate=validate.OneOf(['follow_up', 'reminder', 'emergency']))
    scheduled_at = fields.DateTime(required=True)
    max_attempts = fields.Int(missing=3, validate=validate.Range(min=1, max=10))
    retry_delay_minutes = fields.Int(missing=30, validate=validate.Range(min=5, max=1440))
    notes = fields.Str(allow_none=True)

    @validates('scheduled_at')
    def validate_scheduled_at(self, value):
        """Valide la date de planification"""
        if value and value < datetime.now():
            raise ValidationError('La date de planification ne peut pas être dans le passé')

class CallUpdateSchema(Schema):
    """Schéma pour la mise à jour d'appels"""
    phone_number = fields.Str(validate=validate.Length(min=10, max=20))
    call_type = fields.Str(validate=validate.OneOf(['follow_up', 'reminder', 'emergency']))
    scheduled_at = fields.DateTime()
    max_attempts = fields.Int(validate=validate.Range(min=1, max=10))
    retry_delay_minutes = fields.Int(validate=validate.Range(min=5, max=1440))
    notes = fields.Str(allow_none=True)
    follow_up_notes = fields.Str(allow_none=True)

    @validates('scheduled_at')
    def validate_scheduled_at(self, value):
        """Valide la date de planification"""
        if value and value < datetime.now():
            raise ValidationError('La date de planification ne peut pas être dans le passé')

class CallScheduleSchema(Schema):
    """Schéma pour la planification d'appels"""
    patient_id = fields.Int(required=True)
    call_type = fields.Str(required=True, validate=validate.OneOf(['follow_up', 'reminder', 'emergency']))
    scheduled_date = fields.Date(required=True)
    scheduled_time = fields.Time(required=True)
    max_attempts = fields.Int(missing=3, validate=validate.Range(min=1, max=10))
    retry_delay_minutes = fields.Int(missing=30, validate=validate.Range(min=5, max=1440))
    notes = fields.Str(allow_none=True)

    @validates('scheduled_date')
    def validate_scheduled_date(self, value):
        """Valide la date de planification"""
        if value and value < datetime.now().date():
            raise ValidationError('La date de planification ne peut pas être dans le passé')

class CallStartSchema(Schema):
    """Schéma pour le démarrage d'un appel"""
    call_id = fields.Int(required=True)

class CallEndSchema(Schema):
    """Schéma pour la fin d'un appel"""
    call_id = fields.Int(required=True)
    status = fields.Str(required=True, validate=validate.OneOf(['completed', 'failed', 'cancelled']))
    duration = fields.Int(allow_none=True, validate=validate.Range(min=0))
    notes = fields.Str(allow_none=True) 