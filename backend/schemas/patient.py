"""
Schémas de validation pour les patients HelloJADE
"""

from marshmallow import Schema, fields, validate, validates, ValidationError
from datetime import datetime, date

class PatientSchema(Schema):
    """Schéma pour la sérialisation des patients"""
    id = fields.Int(dump_only=True)
    first_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    last_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    full_name = fields.Str(dump_only=True)
    date_of_birth = fields.Date(required=True)
    age = fields.Int(dump_only=True)
    gender = fields.Str(required=True, validate=validate.OneOf(['M', 'F', 'Other']))
    phone_number = fields.Str(required=True, validate=validate.Length(min=10, max=20))
    email = fields.Email(allow_none=True)
    
    # Adresse
    address_line1 = fields.Str(allow_none=True, validate=validate.Length(max=100))
    address_line2 = fields.Str(allow_none=True, validate=validate.Length(max=100))
    city = fields.Str(allow_none=True, validate=validate.Length(max=50))
    postal_code = fields.Str(allow_none=True, validate=validate.Length(max=10))
    country = fields.Str(allow_none=True, validate=validate.Length(max=50))
    
    # Informations médicales
    medical_record_number = fields.Str(required=True, validate=validate.Length(min=1, max=20))
    blood_type = fields.Str(allow_none=True, validate=validate.OneOf(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']))
    allergies = fields.Str(allow_none=True)
    chronic_conditions = fields.Str(allow_none=True)
    current_medications = fields.Str(allow_none=True)
    
    # Contact d'urgence
    emergency_contact_name = fields.Str(allow_none=True, validate=validate.Length(max=100))
    emergency_contact_phone = fields.Str(allow_none=True, validate=validate.Length(max=20))
    emergency_contact_relationship = fields.Str(allow_none=True, validate=validate.Length(max=50))
    
    # Statut
    is_active = fields.Bool(dump_only=True)
    discharge_date = fields.Date(allow_none=True)
    follow_up_required = fields.Bool(missing=True)
    follow_up_frequency_days = fields.Int(missing=7, validate=validate.Range(min=1, max=365))
    last_follow_up = fields.DateTime(dump_only=True)
    next_follow_up = fields.DateTime(dump_only=True)
    
    # Notes
    notes = fields.Str(allow_none=True)
    special_instructions = fields.Str(allow_none=True)
    
    # Métadonnées
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    created_by = fields.Int(required=True)

class PatientCreateSchema(Schema):
    """Schéma pour la création de patients"""
    first_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    last_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    date_of_birth = fields.Date(required=True)
    gender = fields.Str(required=True, validate=validate.OneOf(['M', 'F', 'Other']))
    phone_number = fields.Str(required=True, validate=validate.Length(min=10, max=20))
    email = fields.Email(allow_none=True)
    medical_record_number = fields.Str(required=True, validate=validate.Length(min=1, max=20))
    
    # Champs optionnels
    address_line1 = fields.Str(allow_none=True, validate=validate.Length(max=100))
    address_line2 = fields.Str(allow_none=True, validate=validate.Length(max=100))
    city = fields.Str(allow_none=True, validate=validate.Length(max=50))
    postal_code = fields.Str(allow_none=True, validate=validate.Length(max=10))
    country = fields.Str(allow_none=True, validate=validate.Length(max=50))
    blood_type = fields.Str(allow_none=True, validate=validate.OneOf(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']))
    allergies = fields.Str(allow_none=True)
    chronic_conditions = fields.Str(allow_none=True)
    current_medications = fields.Str(allow_none=True)
    emergency_contact_name = fields.Str(allow_none=True, validate=validate.Length(max=100))
    emergency_contact_phone = fields.Str(allow_none=True, validate=validate.Length(max=20))
    emergency_contact_relationship = fields.Str(allow_none=True, validate=validate.Length(max=50))
    follow_up_required = fields.Bool(missing=True)
    follow_up_frequency_days = fields.Int(missing=7, validate=validate.Range(min=1, max=365))
    notes = fields.Str(allow_none=True)
    special_instructions = fields.Str(allow_none=True)

class PatientUpdateSchema(Schema):
    """Schéma pour la mise à jour de patients"""
    first_name = fields.Str(validate=validate.Length(min=1, max=50))
    last_name = fields.Str(validate=validate.Length(min=1, max=50))
    date_of_birth = fields.Date()
    gender = fields.Str(validate=validate.OneOf(['M', 'F', 'Other']))
    phone_number = fields.Str(validate=validate.Length(min=10, max=20))
    email = fields.Email(allow_none=True)
    
    # Champs optionnels
    address_line1 = fields.Str(allow_none=True, validate=validate.Length(max=100))
    address_line2 = fields.Str(allow_none=True, validate=validate.Length(max=100))
    city = fields.Str(allow_none=True, validate=validate.Length(max=50))
    postal_code = fields.Str(allow_none=True, validate=validate.Length(max=10))
    country = fields.Str(allow_none=True, validate=validate.Length(max=50))
    blood_type = fields.Str(allow_none=True, validate=validate.OneOf(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']))
    allergies = fields.Str(allow_none=True)
    chronic_conditions = fields.Str(allow_none=True)
    current_medications = fields.Str(allow_none=True)
    emergency_contact_name = fields.Str(allow_none=True, validate=validate.Length(max=100))
    emergency_contact_phone = fields.Str(allow_none=True, validate=validate.Length(max=20))
    emergency_contact_relationship = fields.Str(allow_none=True, validate=validate.Length(max=50))
    is_active = fields.Bool()
    discharge_date = fields.Date(allow_none=True)
    follow_up_required = fields.Bool()
    follow_up_frequency_days = fields.Int(validate=validate.Range(min=1, max=365))
    notes = fields.Str(allow_none=True)
    special_instructions = fields.Str(allow_none=True)

    @validates('date_of_birth')
    def validate_date_of_birth(self, value):
        """Valide la date de naissance"""
        if value and value > date.today():
            raise ValidationError('La date de naissance ne peut pas être dans le futur')
        
        # Vérifier l'âge minimum (0 ans) et maximum (150 ans)
        age = (date.today() - value).days / 365.25
        if age < 0 or age > 150:
            raise ValidationError('L\'âge doit être entre 0 et 150 ans') 