#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HelloJADE v1.0 - Module de logging
Configuration du logging structuré avec intégration ELK Stack
"""

import logging
import logging.handlers
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from pythonjsonlogger import jsonlogger
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import ConnectionError as ESConnectionError

class HelloJADELogFormatter(jsonlogger.JsonFormatter):
    """
    Formateur JSON personnalisé pour HelloJADE
    """
    
    def add_fields(self, log_record, record, message_dict):
        super(HelloJADELogFormatter, self).add_fields(log_record, record, message_dict)
        
        # Ajout des champs personnalisés
        log_record['timestamp'] = datetime.now(timezone.utc).isoformat()
        log_record['level'] = record.levelname
        log_record['logger'] = record.name
        log_record['module'] = record.module
        log_record['function'] = record.funcName
        log_record['line'] = record.lineno
        
        # Ajout des informations de requête si disponibles
        if hasattr(record, 'request_id'):
            log_record['request_id'] = record.request_id
        if hasattr(record, 'user_id'):
            log_record['user_id'] = record.user_id
        if hasattr(record, 'ip_address'):
            log_record['ip_address'] = record.ip_address
        
        # Suppression des champs redondants
        if 'asctime' in log_record:
            del log_record['asctime']
        if 'created' in log_record:
            del log_record['created']
        if 'msecs' in log_record:
            del log_record['msecs']
        if 'relativeCreated' in log_record:
            del log_record['relativeCreated']
        if 'thread' in log_record:
            del log_record['thread']
        if 'threadName' in log_record:
            del log_record['threadName']
        if 'processName' in log_record:
            del log_record['processName']
        if 'process' in log_record:
            del log_record['process']

class ElasticsearchHandler(logging.Handler):
    """
    Handler pour envoyer les logs vers Elasticsearch
    """
    
    def __init__(self, es_host='localhost', es_port=9200, index_prefix='hellojade'):
        super().__init__()
        self.es_host = es_host
        self.es_port = es_port
        self.index_prefix = index_prefix
        self.es_client = None
        self._connect()
    
    def _connect(self):
        """Établit la connexion Elasticsearch"""
        try:
            self.es_client = Elasticsearch([{
                'host': self.es_host,
                'port': self.es_port
            }])
            
            # Test de connexion
            if self.es_client.ping():
                logging.getLogger(__name__).info("Connexion Elasticsearch établie")
            else:
                logging.getLogger(__name__).warning("Impossible de se connecter à Elasticsearch")
                self.es_client = None
                
        except ESConnectionError:
            logging.getLogger(__name__).warning("Elasticsearch non accessible")
            self.es_client = None
        except Exception as e:
            logging.getLogger(__name__).error(f"Erreur de connexion Elasticsearch: {str(e)}")
            self.es_client = None
    
    def emit(self, record):
        """Envoie le log vers Elasticsearch"""
        if not self.es_client:
            return
        
        try:
            # Création de l'index avec la date
            index_name = f"{self.index_prefix}-{datetime.now().strftime('%Y.%m.%d')}"
            
            # Préparation du document
            log_entry = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'level': record.levelname,
                'logger': record.name,
                'module': record.module,
                'function': record.funcName,
                'line': record.lineno,
                'message': record.getMessage()
            }
            
            # Ajout des informations de requête si disponibles
            if hasattr(record, 'request_id'):
                log_entry['request_id'] = record.request_id
            if hasattr(record, 'user_id'):
                log_entry['user_id'] = record.user_id
            if hasattr(record, 'ip_address'):
                log_entry['ip_address'] = record.ip_address
            
            # Ajout des données d'exception si présentes
            if record.exc_info:
                log_entry['exception'] = self.formatException(record.exc_info)
            
            # Envoi vers Elasticsearch
            self.es_client.index(
                index=index_name,
                body=log_entry,
                doc_type='_doc'
            )
            
        except Exception as e:
            # Log de l'erreur sans créer de boucle infinie
            sys.stderr.write(f"Erreur lors de l'envoi vers Elasticsearch: {str(e)}\n")

class StructuredLogger:
    """
    Logger structuré pour HelloJADE
    """
    
    def __init__(self, name, level=logging.INFO):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(level)
        self.name = name
    
    def _log_with_context(self, level, message, **kwargs):
        """Log avec contexte supplémentaire"""
        extra = {
            'request_id': getattr(g, 'request_id', None) if 'g' in globals() else None,
            'user_id': getattr(g, 'user_id', None) if 'g' in globals() else None,
            'ip_address': getattr(g, 'ip_address', None) if 'g' in globals() else None
        }
        extra.update(kwargs)
        
        self.logger.log(level, message, extra=extra)
    
    def debug(self, message, **kwargs):
        self._log_with_context(logging.DEBUG, message, **kwargs)
    
    def info(self, message, **kwargs):
        self._log_with_context(logging.INFO, message, **kwargs)
    
    def warning(self, message, **kwargs):
        self._log_with_context(logging.WARNING, message, **kwargs)
    
    def error(self, message, **kwargs):
        self._log_with_context(logging.ERROR, message, **kwargs)
    
    def critical(self, message, **kwargs):
        self._log_with_context(logging.CRITICAL, message, **kwargs)
    
    def exception(self, message, **kwargs):
        self._log_with_context(logging.ERROR, message, exc_info=True, **kwargs)

def setup_logging(app):
    """
    Configure le système de logging pour l'application Flask
    """
    # Configuration de base
    log_level = getattr(logging, app.config.get('LOG_LEVEL', 'INFO').upper())
    log_format = app.config.get('LOG_FORMAT', '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    log_file = app.config.get('LOG_FILE', './logs/hellojade.log')
    log_max_size = app.config.get('LOG_MAX_SIZE', '100MB')
    log_backup_count = app.config.get('LOG_BACKUP_COUNT', 5)
    
    # Création du dossier de logs
    log_path = Path(log_file)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Configuration du root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Suppression des handlers existants
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Handler pour la console (format JSON en production, standard en développement)
    console_handler = logging.StreamHandler(sys.stdout)
    if app.config.get('ENVIRONMENT') == 'production':
        console_formatter = HelloJADELogFormatter(
            '%(timestamp)s %(level)s %(name)s %(module)s %(function)s %(line)d %(message)s'
        )
    else:
        console_formatter = logging.Formatter(log_format)
    
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(log_level)
    root_logger.addHandler(console_handler)
    
    # Handler pour les fichiers (rotation automatique)
    file_handler = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=_parse_size(log_max_size),
        backupCount=log_backup_count,
        encoding='utf-8'
    )
    
    file_formatter = HelloJADELogFormatter(
        '%(timestamp)s %(level)s %(name)s %(module)s %(function)s %(line)d %(message)s'
    )
    file_handler.setFormatter(file_formatter)
    file_handler.setLevel(log_level)
    root_logger.addHandler(file_handler)
    
    # Handler pour les erreurs critiques (fichier séparé)
    error_log_file = log_path.parent / 'hellojade-error.log'
    error_handler = logging.handlers.RotatingFileHandler(
        error_log_file,
        maxBytes=_parse_size(log_max_size),
        backupCount=log_backup_count,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(file_formatter)
    root_logger.addHandler(error_handler)
    
    # Handler Elasticsearch si configuré
    if app.config.get('ELASTICSEARCH_HOST'):
        try:
            es_handler = ElasticsearchHandler(
                es_host=app.config.get('ELASTICSEARCH_HOST', 'localhost'),
                es_port=app.config.get('ELASTICSEARCH_PORT', 9200),
                index_prefix=app.config.get('ELASTICSEARCH_INDEX_PREFIX', 'hellojade')
            )
            es_handler.setLevel(logging.INFO)
            root_logger.addHandler(es_handler)
            app.logger.info("Handler Elasticsearch configuré")
        except Exception as e:
            app.logger.warning(f"Impossible de configurer Elasticsearch: {str(e)}")
    
    # Configuration des loggers spécifiques
    _configure_specific_loggers(app)
    
    # Log de démarrage
    app.logger.info(f"Logging configuré - Niveau: {app.config.get('LOG_LEVEL', 'INFO')}")
    app.logger.info(f"Fichier de log: {log_file}")
    app.logger.info(f"Environnement: {app.config.get('ENVIRONMENT', 'production')}")

def _configure_specific_loggers(app):
    """Configure les loggers spécifiques"""
    
    # Logger pour les requêtes HTTP
    http_logger = logging.getLogger('werkzeug')
    http_logger.setLevel(logging.INFO)
    
    # Logger pour SQLAlchemy
    sqlalchemy_logger = logging.getLogger('sqlalchemy.engine')
    if app.config.get('DEBUG'):
        sqlalchemy_logger.setLevel(logging.INFO)
    else:
        sqlalchemy_logger.setLevel(logging.WARNING)
    
    # Logger pour les requêtes Oracle
    oracle_logger = logging.getLogger('cx_Oracle')
    oracle_logger.setLevel(logging.WARNING)
    
    # Logger pour les requêtes LDAP
    ldap_logger = logging.getLogger('ldap')
    ldap_logger.setLevel(logging.WARNING)
    
    # Logger pour les requêtes HTTP
    requests_logger = logging.getLogger('urllib3')
    requests_logger.setLevel(logging.WARNING)
    
    # Logger pour les requêtes Elasticsearch
    es_logger = logging.getLogger('elasticsearch')
    es_logger.setLevel(logging.WARNING)

def _parse_size(size_str):
    """Parse une taille de fichier (ex: '100MB')"""
    size_str = size_str.upper()
    if size_str.endswith('KB'):
        return int(size_str[:-2]) * 1024
    elif size_str.endswith('MB'):
        return int(size_str[:-2]) * 1024 * 1024
    elif size_str.endswith('GB'):
        return int(size_str[:-2]) * 1024 * 1024 * 1024
    else:
        return int(size_str)

def get_logger(name):
    """
    Retourne un logger structuré
    """
    return StructuredLogger(name)

# Loggers spécialisés
def get_auth_logger():
    """Logger pour l'authentification"""
    return get_logger('hellojade.auth')

def get_db_logger():
    """Logger pour la base de données"""
    return get_logger('hellojade.database')

def get_telephony_logger():
    """Logger pour la téléphonie"""
    return get_logger('hellojade.telephony')

def get_ai_logger():
    """Logger pour l'IA"""
    return get_logger('hellojade.ai')

def get_api_logger():
    """Logger pour l'API"""
    return get_logger('hellojade.api')

def get_security_logger():
    """Logger pour la sécurité"""
    return get_logger('hellojade.security')

def get_monitoring_logger():
    """Logger pour le monitoring"""
    return get_logger('hellojade.monitoring')

# Fonctions utilitaires pour le logging
def log_request_start(request, user_id=None):
    """Log le début d'une requête"""
    logger = get_api_logger()
    logger.info(
        f"Request started - {request.method} {request.path}",
        request_id=getattr(g, 'request_id', None),
        user_id=user_id,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent', ''),
        method=request.method,
        path=request.path,
        query_string=request.query_string.decode('utf-8') if request.query_string else None
    )

def log_request_end(request, response, duration, user_id=None):
    """Log la fin d'une requête"""
    logger = get_api_logger()
    logger.info(
        f"Request completed - {request.method} {request.path}",
        request_id=getattr(g, 'request_id', None),
        user_id=user_id,
        ip_address=request.remote_addr,
        method=request.method,
        path=request.path,
        status_code=response.status_code,
        duration=duration,
        content_length=len(response.get_data()) if response else 0
    )

def log_security_event(event_type, details, user_id=None, ip_address=None):
    """Log un événement de sécurité"""
    logger = get_security_logger()
    logger.warning(
        f"Security event: {event_type}",
        event_type=event_type,
        user_id=user_id,
        ip_address=ip_address,
        details=details
    )

def log_performance_metric(metric_name, value, unit=None, tags=None):
    """Log une métrique de performance"""
    logger = get_monitoring_logger()
    logger.info(
        f"Performance metric: {metric_name}",
        metric_name=metric_name,
        value=value,
        unit=unit,
        tags=tags or {}
    )

def log_business_event(event_type, details, user_id=None):
    """Log un événement métier"""
    logger = get_logger('hellojade.business')
    logger.info(
        f"Business event: {event_type}",
        event_type=event_type,
        user_id=user_id,
        details=details
    ) 