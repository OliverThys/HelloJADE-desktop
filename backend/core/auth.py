"""
HelloJADE v1.0 - Module d'authentification
Authentification LDAP + JWT avec gestion des rôles RBAC
"""

import logging
import ldap
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Tuple
from functools import wraps

from flask import request, jsonify, current_app
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from werkzeug.security import generate_password_hash, check_password_hash

from core.database import db, User, log_audit, log_system

# Initialisation JWT
jwt = JWTManager()

logger = logging.getLogger(__name__)


def init_auth(app):
    """Initialisation du système d'authentification"""
    jwt.init_app(app)
    
    # Configuration des callbacks JWT
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'message': 'Token expiré',
            'error': 'token_expired'
        }), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'message': 'Token invalide',
            'error': 'invalid_token'
        }), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'message': 'Token manquant',
            'error': 'authorization_required'
        }), 401


class LDAPManager:
    """Gestionnaire d'authentification LDAP"""
    
    def __init__(self, app):
        self.app = app
        self.config = app.config
        
    def connect(self) -> Optional[ldap.ldapobject.LDAPObject]:
        """Établit une connexion LDAP"""
        try:
            # Configuration de la connexion LDAP
            ldap.set_option(ldap.OPT_NETWORK_TIMEOUT, 10)
            ldap.set_option(ldap.OPT_TIMEOUT, 10)
            
            # Connexion au serveur LDAP
            ldap_uri = f"ldap://{self.config['LDAP_SERVER']}:{self.config['LDAP_PORT']}"
            conn = ldap.initialize(ldap_uri)
            
            # Configuration TLS si nécessaire
            if self.config.get('LDAP_USE_TLS', True):
                conn.start_tls_s()
            
            # Bind avec les credentials de service
            conn.simple_bind_s(
                self.config['LDAP_BIND_DN'],
                self.config['LDAP_BIND_PASSWORD']
            )
            
            logger.info(f"Connexion LDAP établie avec {self.config['LDAP_SERVER']}")
            return conn
            
        except ldap.INVALID_CREDENTIALS:
            logger.error("Credentials LDAP invalides")
            return None
        except ldap.SERVER_DOWN:
            logger.error("Serveur LDAP inaccessible")
            return None
        except Exception as e:
            logger.error(f"Erreur de connexion LDAP: {e}")
            return None
    
    def authenticate_user(self, username: str, password: str) -> Tuple[bool, Optional[Dict]]:
        """
        Authentifie un utilisateur via LDAP
        
        Args:
            username: Nom d'utilisateur
            password: Mot de passe
            
        Returns:
            Tuple[bool, Optional[Dict]]: (succès, données utilisateur)
        """
        if not self.config.get('LDAP_ENABLED', True):
            logger.warning("LDAP désactivé")
            return False, None
        
        conn = None
        try:
            conn = self.connect()
            if not conn:
                return False, None
            
            # Recherche de l'utilisateur
            search_filter = self.config['LDAP_USER_SEARCH_FILTER'].format(username)
            search_base = self.config['LDAP_USER_SEARCH_BASE']
            
            result = conn.search_s(
                search_base,
                ldap.SCOPE_SUBTREE,
                search_filter,
                ['uid', 'cn', 'mail', 'givenName', 'sn', 'memberOf']
            )
            
            if not result:
                logger.warning(f"Utilisateur LDAP non trouvé: {username}")
                return False, None
            
            user_dn, user_attrs = result[0]
            
            # Tentative d'authentification avec le mot de passe
            try:
                conn.simple_bind_s(user_dn, password)
            except ldap.INVALID_CREDENTIALS:
                logger.warning(f"Mot de passe incorrect pour l'utilisateur: {username}")
                return False, None
            
            # Récupération des informations utilisateur
            user_data = {
                'username': username,
                'email': user_attrs.get('mail', [b''])[0].decode('utf-8') if user_attrs.get('mail') else '',
                'first_name': user_attrs.get('givenName', [b''])[0].decode('utf-8') if user_attrs.get('givenName') else '',
                'last_name': user_attrs.get('sn', [b''])[0].decode('utf-8') if user_attrs.get('sn') else '',
                'ldap_dn': user_dn,
                'groups': [group.decode('utf-8') for group in user_attrs.get('memberOf', [])]
            }
            
            # Détermination du rôle selon les groupes LDAP
            user_data['role'] = self._determine_role(user_data['groups'])
            
            logger.info(f"Authentification LDAP réussie pour: {username}")
            return True, user_data
            
        except Exception as e:
            logger.error(f"Erreur lors de l'authentification LDAP: {e}")
            return False, None
        finally:
            if conn:
                conn.unbind_s()
    
    def _determine_role(self, groups: list) -> str:
        """Détermine le rôle utilisateur selon les groupes LDAP"""
        role_mapping = {
            'cn=admins': 'admin',
            'cn=doctors': 'doctor',
            'cn=nurses': 'nurse',
            'cn=secretaries': 'secretary'
        }
        
        for group in groups:
            for group_pattern, role in role_mapping.items():
                if group_pattern in group:
                    return role
        
        return 'user'  # Rôle par défaut


class AuthManager:
    """Gestionnaire d'authentification principal"""
    
    def __init__(self, app):
        self.app = app
        self.ldap_manager = LDAPManager(app)
    
    def authenticate(self, username: str, password: str) -> Tuple[bool, Optional[Dict]]:
        """
        Authentifie un utilisateur (LDAP + base locale)
        
        Args:
            username: Nom d'utilisateur
            password: Mot de passe
            
        Returns:
            Tuple[bool, Optional[Dict]]: (succès, données utilisateur)
        """
        # Vérification en base locale d'abord
        user = User.query.filter_by(username=username).first()
        
        if user and not user.is_ldap_user:
            # Utilisateur local
            if check_password_hash(user.password_hash, password):
                return True, user.to_dict()
            return False, None
        
        # Authentification LDAP
        ldap_success, ldap_data = self.ldap_manager.authenticate_user(username, password)
        
        if ldap_success:
            # Synchronisation avec la base locale
            user = self._sync_ldap_user(ldap_data)
            return True, user.to_dict()
        
        return False, None
    
    def _sync_ldap_user(self, ldap_data: Dict) -> User:
        """Synchronise un utilisateur LDAP avec la base locale"""
        user = User.query.filter_by(username=ldap_data['username']).first()
        
        if user:
            # Mise à jour des informations
            user.email = ldap_data['email']
            user.first_name = ldap_data['first_name']
            user.last_name = ldap_data['last_name']
            user.role = ldap_data['role']
            user.is_ldap_user = True
            user.last_login = datetime.now(timezone.utc)
        else:
            # Création d'un nouvel utilisateur
            user = User(
                username=ldap_data['username'],
                email=ldap_data['email'],
                first_name=ldap_data['first_name'],
                last_name=ldap_data['last_name'],
                role=ldap_data['role'],
                is_ldap_user=True,
                last_login=datetime.now(timezone.utc)
            )
            db.session.add(user)
        
        db.session.commit()
        return user
    
    def create_tokens(self, user_data: Dict) -> Dict[str, str]:
        """Crée les tokens JWT pour un utilisateur"""
        identity = {
            'user_id': user_data['id'],
            'username': user_data['username'],
            'role': user_data['role']
        }
        
        access_token = create_access_token(
            identity=identity,
            expires_delta=timedelta(seconds=self.app.config['JWT_ACCESS_TOKEN_EXPIRES'])
        )
        
        refresh_token = create_refresh_token(
            identity=identity,
            expires_delta=timedelta(seconds=self.app.config['JWT_REFRESH_TOKEN_EXPIRES'])
        )
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'bearer',
            'expires_in': self.app.config['JWT_ACCESS_TOKEN_EXPIRES']
        }
    
    def refresh_tokens(self, refresh_token: str) -> Optional[Dict[str, str]]:
        """Renouvelle les tokens JWT"""
        try:
            # Vérification du refresh token
            identity = get_jwt_identity()
            user = User.query.get(identity['user_id'])
            
            if not user or not user.is_active:
                return None
            
            # Création de nouveaux tokens
            return self.create_tokens(user.to_dict())
            
        except Exception as e:
            logger.error(f"Erreur lors du renouvellement des tokens: {e}")
            return None


# Décorateurs pour les permissions
def require_permission(permission: str):
    """Décorateur pour vérifier les permissions"""
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            current_user_id = get_jwt_identity()['user_id']
            user = User.query.get(current_user_id)
            
            if not user or not user.is_active:
                return jsonify({'message': 'Utilisateur inactif'}), 401
            
            if not user.has_permission(permission):
                return jsonify({'message': 'Permission insuffisante'}), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def require_role(role: str):
    """Décorateur pour vérifier le rôle"""
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            current_user_id = get_jwt_identity()['user_id']
            user = User.query.get(current_user_id)
            
            if not user or not user.is_active:
                return jsonify({'message': 'Utilisateur inactif'}), 401
            
            if user.role != role and user.role != 'admin':
                return jsonify({'message': 'Rôle insuffisant'}), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator


# Fonctions utilitaires
def get_current_user() -> Optional[User]:
    """Récupère l'utilisateur courant depuis le token JWT"""
    try:
        current_user_id = get_jwt_identity()['user_id']
        return User.query.get(current_user_id)
    except Exception:
        return None


def log_login(user: User, success: bool, ip_address: str = None):
    """Enregistre une tentative de connexion"""
    action = 'LOGIN_SUCCESS' if success else 'LOGIN_FAILED'
    log_audit(
        user_id=user.id if user else None,
        action=action,
        resource_type='auth',
        ip_address=ip_address
    )
    
    log_system(
        level='INFO' if success else 'WARNING',
        module='auth',
        message=f"Tentative de connexion {'réussie' if success else 'échouée'} pour {user.username if user else 'utilisateur inconnu'}",
        user_id=user.id if user else None,
        ip_address=ip_address
    )


def log_logout(user: User, ip_address: str = None):
    """Enregistre une déconnexion"""
    log_audit(
        user_id=user.id,
        action='LOGOUT',
        resource_type='auth',
        ip_address=ip_address
    )
    
    log_system(
        level='INFO',
        module='auth',
        message=f"Déconnexion de l'utilisateur {user.username}",
        user_id=user.id,
        ip_address=ip_address
    ) 