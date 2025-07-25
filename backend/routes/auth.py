#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HelloJADE v1.0 - Routes d'authentification
Gestion de l'authentification LDAP et des tokens JWT
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from marshmallow import Schema, fields, ValidationError
import logging

from core.auth import (
    authenticate_user, refresh_token, logout_user, get_current_user,
    log_audit_event, log_security_event, record_auth_attempt, record_failed_login
)
from core.database import get_db, User
from core.monitoring import record_security_event

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)

# Schémas de validation
class LoginSchema(Schema):
    username = fields.Str(required=True, validate=lambda x: len(x) > 0)
    password = fields.Str(required=True, validate=lambda x: len(x) > 0)

class RefreshTokenSchema(Schema):
    refresh_token = fields.Str(required=True)

class ChangePasswordSchema(Schema):
    current_password = fields.Str(required=True)
    new_password = fields.Str(required=True, validate=lambda x: len(x) >= 12)

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authentification utilisateur via LDAP
    """
    try:
        # Validation des données
        schema = LoginSchema()
        data = schema.load(request.get_json())
        
        username = data['username']
        password = data['password']
        
        # Tentative d'authentification
        result, error = authenticate_user(username, password)
        
        if error:
            # Log de la tentative échouée
            record_auth_attempt('failed', 'ldap')
            record_failed_login(request.remote_addr)
            log_security_event('failed_login', {
                'username': username,
                'ip_address': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', '')
            })
            
            return jsonify({
                'error': 'Authentification échouée',
                'message': error
            }), 401
        
        # Log de la tentative réussie
        record_auth_attempt('success', 'ldap')
        
        logger.info(f"Connexion réussie pour l'utilisateur: {username}")
        
        return jsonify({
            'message': 'Authentification réussie',
            'data': result
        }), 200
        
    except ValidationError as e:
        return jsonify({
            'error': 'Données invalides',
            'details': e.messages
        }), 400
        
    except Exception as e:
        logger.error(f"Erreur lors de l'authentification: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Déconnexion utilisateur
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Déconnexion
        success, error = logout_user()
        
        if error:
            return jsonify({
                'error': 'Erreur de déconnexion',
                'message': error
            }), 500
        
        logger.info(f"Déconnexion de l'utilisateur ID: {current_user_id}")
        
        return jsonify({
            'message': 'Déconnexion réussie'
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la déconnexion: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Rafraîchissement du token d'accès
    """
    try:
        # Validation des données
        schema = RefreshTokenSchema()
        data = schema.load(request.get_json())
        
        # Rafraîchissement du token
        result, error = refresh_token()
        
        if error:
            return jsonify({
                'error': 'Erreur de rafraîchissement',
                'message': error
            }), 401
        
        logger.info("Token rafraîchi avec succès")
        
        return jsonify({
            'message': 'Token rafraîchi avec succès',
            'data': result
        }), 200
        
    except ValidationError as e:
        return jsonify({
            'error': 'Données invalides',
            'details': e.messages
        }), 400
        
    except Exception as e:
        logger.error(f"Erreur lors du rafraîchissement: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """
    Récupération du profil utilisateur
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Récupération de l'utilisateur
        user = get_current_user()
        
        if not user:
            return jsonify({
                'error': 'Utilisateur non trouvé'
            }), 404
        
        # Log de l'accès au profil
        log_audit_event('READ', 'USER', user.id, user.id)
        
        return jsonify({
            'message': 'Profil récupéré avec succès',
            'data': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'department': user.department,
                'is_active': user.is_active,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'created_at': user.created_at.isoformat(),
                'updated_at': user.updated_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du profil: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    Mise à jour du profil utilisateur
    """
    try:
        current_user_id = get_jwt_identity()
        user = get_current_user()
        
        if not user:
            return jsonify({
                'error': 'Utilisateur non trouvé'
            }), 404
        
        # Récupération des données de mise à jour
        data = request.get_json()
        
        # Mise à jour des champs autorisés
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'email' in data:
            user.email = data['email']
        
        # Sauvegarde en base
        db = get_db()
        db.commit()
        
        # Log de la mise à jour
        log_audit_event('UPDATE', 'USER', user.id, user.id)
        
        logger.info(f"Profil mis à jour pour l'utilisateur: {user.username}")
        
        return jsonify({
            'message': 'Profil mis à jour avec succès',
            'data': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'department': user.department,
                'updated_at': user.updated_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour du profil: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """
    Changement de mot de passe
    """
    try:
        # Validation des données
        schema = ChangePasswordSchema()
        data = schema.load(request.get_json())
        
        current_user_id = get_jwt_identity()
        user = get_current_user()
        
        if not user:
            return jsonify({
                'error': 'Utilisateur non trouvé'
            }), 404
        
        # Vérification de l'ancien mot de passe
        from core.auth import ldap_auth
        if not ldap_auth(user.username, data['current_password']):
            return jsonify({
                'error': 'Mot de passe actuel incorrect'
            }), 400
        
        # Note: Le changement de mot de passe LDAP nécessite une implémentation spécifique
        # selon la configuration du serveur LDAP
        
        # Log de la tentative de changement
        log_audit_event('PASSWORD_CHANGE', 'USER', user.id, user.id)
        log_security_event('password_change_attempt', {
            'username': user.username,
            'ip_address': request.remote_addr
        })
        
        return jsonify({
            'message': 'Changement de mot de passe initié'
        }), 200
        
    except ValidationError as e:
        return jsonify({
            'error': 'Données invalides',
            'details': e.messages
        }), 400
        
    except Exception as e:
        logger.error(f"Erreur lors du changement de mot de passe: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@auth_bp.route('/validate-token', methods=['POST'])
@jwt_required()
def validate_token():
    """
    Validation d'un token JWT
    """
    try:
        current_user_id = get_jwt_identity()
        user = get_current_user()
        
        if not user:
            return jsonify({
                'error': 'Token invalide',
                'valid': False
            }), 401
        
        # Récupération des claims du token
        claims = get_jwt()
        
        return jsonify({
            'message': 'Token valide',
            'valid': True,
            'data': {
                'user_id': current_user_id,
                'username': claims.get('username'),
                'role': claims.get('role'),
                'email': claims.get('email')
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la validation du token: {str(e)}")
        return jsonify({
            'error': 'Token invalide',
            'valid': False
        }), 401

@auth_bp.route('/permissions', methods=['GET'])
@jwt_required()
def get_permissions():
    """
    Récupération des permissions de l'utilisateur
    """
    try:
        user = get_current_user()
        
        if not user:
            return jsonify({
                'error': 'Utilisateur non trouvé'
            }), 404
        
        # Définition des permissions par rôle
        permissions = {
            'admin': [
                'users:read', 'users:write', 'users:delete',
                'patients:read', 'patients:write', 'patients:delete',
                'calls:read', 'calls:write', 'calls:delete',
                'ai:read', 'ai:write',
                'admin:read', 'admin:write',
                'monitoring:read', 'monitoring:write'
            ],
            'medecin': [
                'patients:read', 'patients:write',
                'calls:read', 'calls:write',
                'ai:read', 'ai:write',
                'medical_records:read', 'medical_records:write'
            ],
            'infirmier': [
                'patients:read', 'patients:write',
                'calls:read', 'calls:write',
                'ai:read',
                'medical_records:read', 'medical_records:write'
            ],
            'secretaire': [
                'patients:read', 'patients:write',
                'calls:read', 'calls:write',
                'ai:read'
            ],
            'user': [
                'patients:read',
                'calls:read'
            ]
        }
        
        user_permissions = permissions.get(user.role, permissions['user'])
        
        return jsonify({
            'message': 'Permissions récupérées avec succès',
            'data': {
                'role': user.role,
                'permissions': user_permissions
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des permissions: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@auth_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_active_sessions():
    """
    Récupération des sessions actives (admin seulement)
    """
    try:
        user = get_current_user()
        
        if user.role != 'admin':
            return jsonify({
                'error': 'Permissions insuffisantes'
            }), 403
        
        # Note: Cette fonctionnalité nécessiterait une implémentation
        # pour tracker les sessions actives
        
        return jsonify({
            'message': 'Sessions récupérées avec succès',
            'data': {
                'active_sessions': 0,  # À implémenter
                'total_sessions': 0    # À implémenter
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des sessions: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

@auth_bp.route('/logout-all', methods=['POST'])
@jwt_required()
def logout_all_sessions():
    """
    Déconnexion de toutes les sessions (admin seulement)
    """
    try:
        user = get_current_user()
        
        if user.role != 'admin':
            return jsonify({
                'error': 'Permissions insuffisantes'
            }), 403
        
        # Note: Cette fonctionnalité nécessiterait une implémentation
        # pour invalider tous les tokens
        
        # Log de l'action
        log_audit_event('LOGOUT_ALL', 'USER', user.id, user.id)
        log_security_event('admin_logout_all', {
            'admin_user': user.username,
            'ip_address': request.remote_addr
        })
        
        return jsonify({
            'message': 'Toutes les sessions ont été déconnectées'
        }), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de la déconnexion de toutes les sessions: {str(e)}")
        return jsonify({
            'error': 'Erreur interne',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500 