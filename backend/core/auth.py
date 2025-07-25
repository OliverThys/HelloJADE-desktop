#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HelloJADE v1.0 - Module d'authentification
Gestion de l'authentification LDAP et des tokens JWT
"""

import logging
import ldap
import re
from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import request, jsonify, current_app, g
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required, get_jwt_identity,
    get_jwt, verify_jwt_in_request
)
from werkzeug.security import generate_password_hash, check_password_hash
import json

from .database import get_db, User, AuditLog, SystemLog

logger = logging.getLogger(__name__)

class LDAPManager:
    """
    Gestionnaire d'authentification LDAP pour HelloJADE
    """
    
    def __init__(self, app=None):
        self.app = app
        self.connection = None
        self.config = {}
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialise la connexion LDAP"""
        self.config = {
            'server': app.config.get('LDAP_SERVER', 'ldap.epicura.be'),
            'port': app.config.get('LDAP_PORT', 389),
            'use_ssl': app.config.get('LDAP_USE_SSL', False),
            'use_tls': app.config.get('LDAP_USE_TLS', True),
            'base_dn': app.config.get('LDAP_BASE_DN', 'dc=epicura,dc=be'),
            'bind_dn': app.config.get('LDAP_BIND_DN', ''),
            'bind_password': app.config.get('LDAP_BIND_PASSWORD', ''),
            'user_search_base': app.config.get('LDAP_USER_SEARCH_BASE', 'ou=users,dc=epicura,dc=be'),
            'group_search_base': app.config.get('LDAP_GROUP_SEARCH_BASE', 'ou=groups,dc=epicura,dc=be'),
            'timeout': app.config.get('LDAP_TIMEOUT', 10),
            'retries': app.config.get('LDAP_RETRIES', 3)
        }
        
        # Test de connexion LDAP
        if app.config.get('LDAP_ENABLED', True):
            try:
                self.test_connection()
                app.logger.info("Connexion LDAP initialisée avec succès")
            except Exception as e:
                app.logger.error(f"Erreur lors de l'initialisation LDAP: {str(e)}")
                raise
    
    def connect(self):
        """Établit une connexion LDAP"""
        try:
            # Configuration de la connexion
            ldap.set_option(ldap.OPT_NETWORK_TIMEOUT, self.config['timeout'])
            ldap.set_option(ldap.OPT_TIMEOUT, self.config['timeout'])
            
            # Création de la connexion
            if self.config['use_ssl']:
                uri = f"ldaps://{self.config['server']}:{self.config['port']}"
            else:
                uri = f"ldap://{self.config['server']}:{self.config['port']}"
            
            self.connection = ldap.initialize(uri)
            
            # Configuration TLS si nécessaire
            if self.config['use_tls'] and not self.config['use_ssl']:
                self.connection.start_tls_s()
            
            # Bind avec les credentials de service
            self.connection.simple_bind_s(self.config['bind_dn'], self.config['bind_password'])
            
            return True
            
        except ldap.INVALID_CREDENTIALS:
            logger.error("Credentials LDAP invalides")
            raise
        except ldap.SERVER_DOWN:
            logger.error("Serveur LDAP inaccessible")
            raise
        except Exception as e:
            logger.error(f"Erreur de connexion LDAP: {str(e)}")
            raise
    
    def disconnect(self):
        """Ferme la connexion LDAP"""
        if self.connection:
            try:
                self.connection.unbind_s()
            except:
                pass
            finally:
                self.connection = None
    
    def test_connection(self):
        """Teste la connexion LDAP"""
        try:
            self.connect()
            self.disconnect()
            return True
        except Exception as e:
            logger.error(f"Test de connexion LDAP échoué: {str(e)}")
            raise
    
    def authenticate_user(self, username, password):
        """
        Authentifie un utilisateur via LDAP
        """
        if not self.config.get('bind_dn'):
            logger.error("Configuration LDAP incomplète")
            return None
        
        try:
            # Connexion LDAP
            self.connect()
            
            # Recherche de l'utilisateur
            user_dn = self._find_user_dn(username)
            if not user_dn:
                logger.warning(f"Utilisateur LDAP non trouvé: {username}")
                return None
            
            # Authentification de l'utilisateur
            try:
                self.connection.simple_bind_s(user_dn, password)
                logger.info(f"Authentification LDAP réussie pour: {username}")
                
                # Récupération des informations utilisateur
                user_info = self._get_user_info(user_dn)
                if user_info:
                    # Synchronisation avec la base de données locale
                    user = self._sync_user_to_db(user_info)
                    return user
                
            except ldap.INVALID_CREDENTIALS:
                logger.warning(f"Authentification LDAP échouée pour: {username}")
                return None
            
        except Exception as e:
            logger.error(f"Erreur lors de l'authentification LDAP: {str(e)}")
            return None
        finally:
            self.disconnect()
        
        return None
    
    def _find_user_dn(self, username):
        """Trouve le DN d'un utilisateur"""
        try:
            # Recherche par sAMAccountName ou uid
            search_filter = f"(|(sAMAccountName={username})(uid={username})(mail={username}))"
            attrs = ['distinguishedName', 'sAMAccountName', 'uid', 'mail']
            
            result = self.connection.search_s(
                self.config['user_search_base'],
                ldap.SCOPE_SUBTREE,
                search_filter,
                attrs
            )
            
            if result and len(result) > 0:
                return result[0][0]  # Retourne le DN
            
            return None
            
        except Exception as e:
            logger.error(f"Erreur lors de la recherche utilisateur: {str(e)}")
            return None
    
    def _get_user_info(self, user_dn):
        """Récupère les informations d'un utilisateur"""
        try:
            attrs = [
                'distinguishedName', 'sAMAccountName', 'uid', 'mail',
                'givenName', 'sn', 'cn', 'department', 'title',
                'memberOf', 'userPrincipalName'
            ]
            
            result = self.connection.search_s(
                user_dn,
                ldap.SCOPE_BASE,
                '(objectClass=*)',
                attrs
            )
            
            if result and len(result) > 0:
                user_data = result[0][1]
                
                # Extraction des informations
                username = self._get_attr_value(user_data, ['sAMAccountName', 'uid'])
                email = self._get_attr_value(user_data, ['mail', 'userPrincipalName'])
                first_name = self._get_attr_value(user_data, ['givenName'])
                last_name = self._get_attr_value(user_data, ['sn'])
                department = self._get_attr_value(user_data, ['department'])
                
                # Détermination du rôle basé sur les groupes
                role = self._determine_role(user_data.get('memberOf', []))
                
                return {
                    'username': username,
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name,
                    'department': department,
                    'role': role,
                    'ldap_dn': user_dn
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des infos utilisateur: {str(e)}")
            return None
    
    def _get_attr_value(self, user_data, attr_names):
        """Récupère la valeur d'un attribut avec fallback"""
        for attr in attr_names:
            if attr in user_data and user_data[attr]:
                value = user_data[attr][0]
                if isinstance(value, bytes):
                    return value.decode('utf-8')
                return value
        return None
    
    def _determine_role(self, groups):
        """Détermine le rôle utilisateur basé sur les groupes LDAP"""
        if not groups:
            return 'user'
        
        # Mapping des groupes LDAP vers les rôles HelloJADE
        role_mapping = {
            'CN=HelloJADE-Admins': 'admin',
            'CN=HelloJADE-Medecins': 'medecin',
            'CN=HelloJADE-Infirmiers': 'infirmier',
            'CN=HelloJADE-Secretaires': 'secretaire'
        }
        
        for group in groups:
            if isinstance(group, bytes):
                group = group.decode('utf-8')
            
            for ldap_group, role in role_mapping.items():
                if ldap_group.lower() in group.lower():
                    return role
        
        return 'user'
    
    def _sync_user_to_db(self, user_info):
        """Synchronise les informations utilisateur avec la base de données"""
        db = get_db()
        
        try:
            # Recherche de l'utilisateur existant
            user = db.query(User).filter(User.username == user_info['username']).first()
            
            if user:
                # Mise à jour des informations
                user.email = user_info['email']
                user.first_name = user_info['first_name']
                user.last_name = user_info['last_name']
                user.department = user_info['department']
                user.role = user_info['role']
                user.ldap_dn = user_info['ldap_dn']
                user.last_login = datetime.now(timezone.utc)
                user.updated_at = datetime.now(timezone.utc)
            else:
                # Création d'un nouvel utilisateur
                user = User(
                    username=user_info['username'],
                    email=user_info['email'],
                    first_name=user_info['first_name'],
                    last_name=user_info['last_name'],
                    department=user_info['department'],
                    role=user_info['role'],
                    ldap_dn=user_info['ldap_dn'],
                    last_login=datetime.now(timezone.utc)
                )
                db.add(user)
            
            db.commit()
            logger.info(f"Utilisateur synchronisé: {user_info['username']}")
            return user
            
        except Exception as e:
            db.rollback()
            logger.error(f"Erreur lors de la synchronisation utilisateur: {str(e)}")
            return None

# Instance globale du gestionnaire LDAP
ldap_manager = LDAPManager()

def init_auth(app):
    """Initialise l'authentification pour l'application Flask"""
    ldap_manager.init_app(app)

def ldap_auth(username, password):
    """Authentifie un utilisateur via LDAP"""
    return ldap_manager.authenticate_user(username, password)

# Décorateurs pour la gestion des rôles
def require_role(*roles):
    """Décorateur pour vérifier les rôles utilisateur"""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            
            db = get_db()
            user = db.query(User).filter(User.id == current_user_id).first()
            
            if not user or not user.is_active:
                return jsonify({'error': 'Utilisateur non autorisé'}), 401
            
            if user.role not in roles:
                return jsonify({'error': 'Permissions insuffisantes'}), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def require_admin(fn):
    """Décorateur pour les administrateurs"""
    return require_role('admin')(fn)

def require_medical_staff(fn):
    """Décorateur pour le personnel médical"""
    return require_role('admin', 'medecin', 'infirmier')(fn)

def require_staff(fn):
    """Décorateur pour tout le personnel"""
    return require_role('admin', 'medecin', 'infirmier', 'secretaire')(fn)

# Fonctions d'authentification
def authenticate_user(username, password):
    """
    Authentifie un utilisateur et retourne les tokens JWT
    """
    try:
        # Authentification LDAP
        user = ldap_auth(username, password)
        
        if not user:
            return None, "Identifiants invalides"
        
        if not user.is_active:
            return None, "Compte utilisateur désactivé"
        
        # Création des tokens JWT
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                'username': user.username,
                'role': user.role,
                'email': user.email
            }
        )
        
        refresh_token = create_refresh_token(
            identity=user.id,
            additional_claims={
                'username': user.username,
                'role': user.role
            }
        )
        
        # Log d'audit
        log_audit_event('LOGIN', 'USER', user.id, user.id)
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'department': user.department
            }
        }, None
        
    except Exception as e:
        logger.error(f"Erreur lors de l'authentification: {str(e)}")
        return None, "Erreur d'authentification"

def refresh_token():
    """
    Rafraîchit un token JWT
    """
    try:
        current_user_id = get_jwt_identity()
        
        db = get_db()
        user = db.query(User).filter(User.id == current_user_id).first()
        
        if not user or not user.is_active:
            return None, "Utilisateur non autorisé"
        
        # Création d'un nouveau token d'accès
        new_access_token = create_access_token(
            identity=user.id,
            additional_claims={
                'username': user.username,
                'role': user.role,
                'email': user.email
            }
        )
        
        return {'access_token': new_access_token}, None
        
    except Exception as e:
        logger.error(f"Erreur lors du rafraîchissement du token: {str(e)}")
        return None, "Erreur de rafraîchissement"

def logout_user():
    """
    Déconnecte un utilisateur
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Log d'audit
        log_audit_event('LOGOUT', 'USER', current_user_id, current_user_id)
        
        return True, None
        
    except Exception as e:
        logger.error(f"Erreur lors de la déconnexion: {str(e)}")
        return False, "Erreur de déconnexion"

def get_current_user():
    """
    Récupère l'utilisateur actuel
    """
    try:
        current_user_id = get_jwt_identity()
        
        db = get_db()
        user = db.query(User).filter(User.id == current_user_id).first()
        
        if not user or not user.is_active:
            return None
        
        return user
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération de l'utilisateur: {str(e)}")
        return None

def log_audit_event(action, resource_type, resource_id, user_id):
    """
    Enregistre un événement d'audit
    """
    try:
        db = get_db()
        
        audit_log = AuditLog(
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            user_id=user_id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')
        )
        
        db.add(audit_log)
        db.commit()
        
    except Exception as e:
        logger.error(f"Erreur lors de l'enregistrement de l'audit: {str(e)}")

def log_system_event(level, module, message, details=None, user_id=None):
    """
    Enregistre un événement système
    """
    try:
        db = get_db()
        
        system_log = SystemLog(
            level=level,
            module=module,
            message=message,
            details=json.dumps(details) if details else None,
            user_id=user_id,
            ip_address=request.remote_addr if request else None,
            user_agent=request.headers.get('User-Agent', '') if request else None
        )
        
        db.add(system_log)
        db.commit()
        
    except Exception as e:
        logger.error(f"Erreur lors de l'enregistrement du log système: {str(e)}")

# Middleware pour la gestion des tokens expirés
def handle_token_expired():
    """Gestionnaire pour les tokens expirés"""
    return jsonify({
        'error': 'Token expiré',
        'message': 'Votre session a expiré. Veuillez vous reconnecter.'
    }), 401

def handle_invalid_token():
    """Gestionnaire pour les tokens invalides"""
    return jsonify({
        'error': 'Token invalide',
        'message': 'Token d\'authentification invalide.'
    }), 401 