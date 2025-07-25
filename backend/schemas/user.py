"""
Schémas de validation pour les utilisateurs HelloJADE
"""

from marshmallow import Schema, fields, validate, validates, ValidationError
from datetime import datetime

class UserSchema(Schema):
    """Schéma pour la sérialisation des utilisateurs"""
    id = fields.Int(dump_only=True)
    username = fields.Str(required=True, validate=validate.Length(min=3, max=50))
    email = fields.Email(required=True)
    role = fields.Str(validate=validate.OneOf(['admin', 'doctor', 'nurse', 'secretary']))
    is_active = fields.Bool(dump_only=True)
    is_ldap_user = fields.Bool(dump_only=True)
    last_login = fields.DateTime(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class UserCreateSchema(Schema):
    """Schéma pour la création d'utilisateurs"""
    username = fields.Str(required=True, validate=validate.Length(min=3, max=50))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8, max=128), load_only=True)
    role = fields.Str(required=True, validate=validate.OneOf(['admin', 'doctor', 'nurse', 'secretary']))
    is_ldap_user = fields.Bool(missing=False)
    ldap_dn = fields.Str(allow_none=True)

class UserUpdateSchema(Schema):
    """Schéma pour la mise à jour d'utilisateurs"""
    email = fields.Email()
    role = fields.Str(validate=validate.OneOf(['admin', 'doctor', 'nurse', 'secretary']))
    is_active = fields.Bool()
    password = fields.Str(validate=validate.Length(min=8, max=128), load_only=True)

class UserLoginSchema(Schema):
    """Schéma pour la connexion utilisateur"""
    username = fields.Str(required=True)
    password = fields.Str(required=True, load_only=True) 