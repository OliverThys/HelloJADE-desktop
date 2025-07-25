"""
HelloJADE v1.0 - Module de logging
Système de logs structurés compatible ELK Stack
"""

import logging
import logging.handlers
import json
import sys
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from pathlib import Path

import structlog
from pythonjsonlogger import jsonlogger


def init_logging(app):
    """Initialisation du système de logging"""
    
    # Configuration de base
    log_level = getattr(logging, app.config.get('LOG_LEVEL', 'INFO'))
    log_format = app.config.get('LOG_FORMAT', 'json')
    log_file = app.config.get('LOG_FILE', 'logs/hellojade.log')
    
    # Création du répertoire de logs
    Path(log_file).parent.mkdir(parents=True, exist_ok=True)
    
    # Configuration structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Configuration des handlers
    handlers = []
    
    # Handler console
    if app.config.get('DEBUG', False):
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(log_level)
        
        if log_format == 'json':
            console_handler.setFormatter(jsonlogger.JsonFormatter())
        else:
            console_handler.setFormatter(logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            ))
        
        handlers.append(console_handler)
    
    # Handler fichier
    file_handler = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=app.config.get('LOG_MAX_SIZE', 10485760),  # 10MB
        backupCount=app.config.get('LOG_BACKUP_COUNT', 5)
    )
    file_handler.setLevel(log_level)
    
    if log_format == 'json':
        file_handler.setFormatter(jsonlogger.JsonFormatter())
    else:
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
    
    handlers.append(file_handler)
    
    # Configuration du logger racine
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Suppression des handlers existants
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Ajout des nouveaux handlers
    for handler in handlers:
        root_logger.addHandler(handler)
    
    # Configuration des loggers spécifiques
    _configure_specific_loggers(app)
    
    app.logger.info("Système de logging initialisé")


def _configure_specific_loggers(app):
    """Configuration des loggers spécifiques"""
    
    # Logger pour les requêtes HTTP
    http_logger = logging.getLogger('werkzeug')
    http_logger.setLevel(logging.INFO)
    
    # Logger pour SQLAlchemy
    sqlalchemy_logger = logging.getLogger('sqlalchemy.engine')
    if app.config.get('DEBUG', False):
        sqlalchemy_logger.setLevel(logging.INFO)
    else:
        sqlalchemy_logger.setLevel(logging.WARNING)
    
    # Logger pour les requêtes Oracle
    oracle_logger = logging.getLogger('cx_Oracle')
    oracle_logger.setLevel(logging.WARNING)
    
    # Logger pour LDAP
    ldap_logger = logging.getLogger('ldap')
    ldap_logger.setLevel(logging.WARNING)
    
    # Logger pour les requêtes HTTP externes
    requests_logger = logging.getLogger('urllib3')
    requests_logger.setLevel(logging.WARNING)
    
    # Logger pour les tâches en arrière-plan
    celery_logger = logging.getLogger('celery')
    celery_logger.setLevel(logging.INFO)


class HelloJADELogger:
    """Logger personnalisé pour HelloJADE"""
    
    def __init__(self, name: str):
        self.logger = structlog.get_logger(name)
    
    def info(self, message: str, **kwargs):
        """Log niveau INFO"""
        self.logger.info(message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        """Log niveau WARNING"""
        self.logger.warning(message, **kwargs)
    
    def error(self, message: str, **kwargs):
        """Log niveau ERROR"""
        self.logger.error(message, **kwargs)
    
    def debug(self, message: str, **kwargs):
        """Log niveau DEBUG"""
        self.logger.debug(message, **kwargs)
    
    def critical(self, message: str, **kwargs):
        """Log niveau CRITICAL"""
        self.logger.critical(message, **kwargs)
    
    def exception(self, message: str, **kwargs):
        """Log d'exception avec traceback"""
        self.logger.exception(message, **kwargs)


def get_logger(name: str) -> HelloJADELogger:
    """Récupère un logger HelloJADE"""
    return HelloJADELogger(name)


class RequestLogger:
    """Logger pour les requêtes HTTP"""
    
    def __init__(self, app):
        self.app = app
        self.logger = get_logger('http')
    
    def log_request(self, request, response=None, duration=None):
        """Log d'une requête HTTP"""
        log_data = {
            'method': request.method,
            'path': request.path,
            'remote_addr': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', ''),
            'content_length': request.content_length,
            'status_code': response.status_code if response else None,
            'duration_ms': duration * 1000 if duration else None,
            'user_id': self._get_user_id(request),
            'request_id': request.headers.get('X-Request-ID', ''),
        }
        
        # Ajout des paramètres de requête (sans données sensibles)
        if request.args:
            log_data['query_params'] = dict(request.args)
        
        # Ajout des headers (sans données sensibles)
        safe_headers = {}
        for key, value in request.headers.items():
            if key.lower() not in ['authorization', 'cookie', 'x-api-key']:
                safe_headers[key] = value
        log_data['headers'] = safe_headers
        
        # Niveau de log selon le statut de réponse
        if response and response.status_code >= 400:
            self.logger.warning("Requête HTTP", **log_data)
        else:
            self.logger.info("Requête HTTP", **log_data)
    
    def log_error(self, request, error, duration=None):
        """Log d'une erreur HTTP"""
        log_data = {
            'method': request.method,
            'path': request.path,
            'remote_addr': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', ''),
            'error_type': type(error).__name__,
            'error_message': str(error),
            'duration_ms': duration * 1000 if duration else None,
            'user_id': self._get_user_id(request),
            'request_id': request.headers.get('X-Request-ID', ''),
        }
        
        self.logger.error("Erreur HTTP", **log_data)
    
    def _get_user_id(self, request) -> Optional[int]:
        """Récupère l'ID utilisateur depuis le token JWT"""
        try:
            from flask_jwt_extended import get_jwt_identity
            identity = get_jwt_identity()
            return identity.get('user_id') if identity else None
        except Exception:
            return None


class DatabaseLogger:
    """Logger pour les opérations de base de données"""
    
    def __init__(self):
        self.logger = get_logger('database')
    
    def log_query(self, query: str, params: Dict = None, duration: float = None):
        """Log d'une requête SQL"""
        log_data = {
            'query': query,
            'params': params,
            'duration_ms': duration * 1000 if duration else None,
        }
        
        self.logger.debug("Requête SQL", **log_data)
    
    def log_connection(self, action: str, success: bool, error: str = None):
        """Log d'une connexion à la base de données"""
        log_data = {
            'action': action,
            'success': success,
            'error': error,
        }
        
        if success:
            self.logger.info("Connexion base de données", **log_data)
        else:
            self.logger.error("Erreur connexion base de données", **log_data)


class SecurityLogger:
    """Logger pour les événements de sécurité"""
    
    def __init__(self):
        self.logger = get_logger('security')
    
    def log_auth_attempt(self, username: str, success: bool, ip_address: str = None, error: str = None):
        """Log d'une tentative d'authentification"""
        log_data = {
            'username': username,
            'success': success,
            'ip_address': ip_address,
            'error': error,
            'timestamp': datetime.now(timezone.utc).isoformat(),
        }
        
        if success:
            self.logger.info("Authentification réussie", **log_data)
        else:
            self.logger.warning("Tentative d'authentification échouée", **log_data)
    
    def log_permission_denied(self, user_id: int, resource: str, action: str, ip_address: str = None):
        """Log d'un accès refusé"""
        log_data = {
            'user_id': user_id,
            'resource': resource,
            'action': action,
            'ip_address': ip_address,
            'timestamp': datetime.now(timezone.utc).isoformat(),
        }
        
        self.logger.warning("Accès refusé", **log_data)
    
    def log_suspicious_activity(self, activity_type: str, details: Dict, ip_address: str = None):
        """Log d'une activité suspecte"""
        log_data = {
            'activity_type': activity_type,
            'details': details,
            'ip_address': ip_address,
            'timestamp': datetime.now(timezone.utc).isoformat(),
        }
        
        self.logger.warning("Activité suspecte détectée", **log_data)


class AILogger:
    """Logger pour les opérations IA"""
    
    def __init__(self):
        self.logger = get_logger('ai')
    
    def log_transcription(self, call_id: int, model: str, duration: float, success: bool, error: str = None):
        """Log d'une transcription IA"""
        log_data = {
            'call_id': call_id,
            'model': model,
            'duration_ms': duration * 1000,
            'success': success,
            'error': error,
            'timestamp': datetime.now(timezone.utc).isoformat(),
        }
        
        if success:
            self.logger.info("Transcription IA réussie", **log_data)
        else:
            self.logger.error("Erreur transcription IA", **log_data)
    
    def log_analysis(self, call_id: int, analysis_type: str, model: str, duration: float, success: bool, error: str = None):
        """Log d'une analyse IA"""
        log_data = {
            'call_id': call_id,
            'analysis_type': analysis_type,
            'model': model,
            'duration_ms': duration * 1000,
            'success': success,
            'error': error,
            'timestamp': datetime.now(timezone.utc).isoformat(),
        }
        
        if success:
            self.logger.info("Analyse IA réussie", **log_data)
        else:
            self.logger.error("Erreur analyse IA", **log_data)


class TelephonyLogger:
    """Logger pour les opérations téléphoniques"""
    
    def __init__(self):
        self.logger = get_logger('telephony')
    
    def log_call_start(self, call_id: str, phone_number: str, user_id: int):
        """Log du démarrage d'un appel"""
        log_data = {
            'call_id': call_id,
            'phone_number': phone_number,
            'user_id': user_id,
            'timestamp': datetime.now(timezone.utc).isoformat(),
        }
        
        self.logger.info("Démarrage appel", **log_data)
    
    def log_call_end(self, call_id: str, duration: int, status: str):
        """Log de la fin d'un appel"""
        log_data = {
            'call_id': call_id,
            'duration_seconds': duration,
            'status': status,
            'timestamp': datetime.now(timezone.utc).isoformat(),
        }
        
        self.logger.info("Fin appel", **log_data)
    
    def log_call_error(self, call_id: str, error: str, phone_number: str = None):
        """Log d'une erreur d'appel"""
        log_data = {
            'call_id': call_id,
            'error': error,
            'phone_number': phone_number,
            'timestamp': datetime.now(timezone.utc).isoformat(),
        }
        
        self.logger.error("Erreur appel", **log_data)


# Instances globales des loggers
request_logger = RequestLogger(None)
db_logger = DatabaseLogger()
security_logger = SecurityLogger()
ai_logger = AILogger()
telephony_logger = TelephonyLogger()


def log_structured(level: str, message: str, **kwargs):
    """Log structuré générique"""
    logger = get_logger('application')
    
    # Ajout du timestamp
    kwargs['timestamp'] = datetime.now(timezone.utc).isoformat()
    
    # Log selon le niveau
    if level.upper() == 'INFO':
        logger.info(message, **kwargs)
    elif level.upper() == 'WARNING':
        logger.warning(message, **kwargs)
    elif level.upper() == 'ERROR':
        logger.error(message, **kwargs)
    elif level.upper() == 'DEBUG':
        logger.debug(message, **kwargs)
    elif level.upper() == 'CRITICAL':
        logger.critical(message, **kwargs) 