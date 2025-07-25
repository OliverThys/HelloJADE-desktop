"""
Schémas de validation pour l'authentification HelloJADE
"""

from marshmallow import Schema, fields, validate

class LoginSchema(Schema):
    """Schéma pour la connexion utilisateur"""
    username = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    password = fields.Str(required=True, validate=validate.Length(min=1), load_only=True)

class RefreshSchema(Schema):
    """Schéma pour le renouvellement de token"""
    refresh_token = fields.Str(required=True)

class LogoutSchema(Schema):
    """Schéma pour la déconnexion"""
    refresh_token = fields.Str(required=True) 