"""
HelloJADE v1.0 - Module de monitoring
Métriques Prometheus et health checks pour l'observabilité
"""

import time
import psutil
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from functools import wraps

from prometheus_client import (
    Counter, Histogram, Gauge, Summary, generate_latest,
    CONTENT_TYPE_LATEST, REGISTRY
)
from flask import request, Response, jsonify

from core.database import db
from core.logging import get_logger

logger = get_logger('monitoring')

# Métriques Prometheus
REQUEST_COUNT = Counter(
    'hellojade_http_requests_total',
    'Total des requêtes HTTP',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'hellojade_http_request_duration_seconds',
    'Durée des requêtes HTTP',
    ['method', 'endpoint']
)

ACTIVE_USERS = Gauge(
    'hellojade_active_users',
    'Nombre d\'utilisateurs actifs'
)

DATABASE_CONNECTIONS = Gauge(
    'hellojade_database_connections',
    'Nombre de connexions actives à la base de données'
)

CALL_COUNT = Counter(
    'hellojade_calls_total',
    'Total des appels',
    ['status', 'type']
)

AI_PROCESSING_TIME = Histogram(
    'hellojade_ai_processing_duration_seconds',
    'Temps de traitement IA',
    ['type', 'model']
)

AI_SUCCESS_RATE = Counter(
    'hellojade_ai_operations_total',
    'Total des opérations IA',
    ['type', 'status']
)

ERROR_COUNT = Counter(
    'hellojade_errors_total',
    'Total des erreurs',
    ['type', 'module']
)

SYSTEM_MEMORY = Gauge(
    'hellojade_system_memory_bytes',
    'Utilisation mémoire système'
)

SYSTEM_CPU = Gauge(
    'hellojade_system_cpu_percent',
    'Utilisation CPU système'
)

SYSTEM_DISK = Gauge(
    'hellojade_system_disk_usage_percent',
    'Utilisation disque système'
)


def init_monitoring(app):
    """Initialisation du système de monitoring"""
    
    # Middleware pour les métriques HTTP
    @app.before_request
    def before_request():
        request.start_time = time.time()
    
    @app.after_request
    def after_request(response):
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            
            # Métriques de requête
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.endpoint or 'unknown',
                status=response.status_code
            ).inc()
            
            REQUEST_DURATION.labels(
                method=request.method,
                endpoint=request.endpoint or 'unknown'
            ).observe(duration)
            
            # Log de performance
            if duration > 1.0:  # Requêtes lentes
                logger.warning(
                    "Requête lente détectée",
                    method=request.method,
                    endpoint=request.endpoint,
                    duration=duration,
                    status_code=response.status_code
                )
        
        return response
    
    # Route pour les métriques Prometheus
    @app.route('/metrics')
    def metrics():
        """Endpoint pour les métriques Prometheus"""
        try:
            # Mise à jour des métriques système
            update_system_metrics()
            
            return Response(
                generate_latest(REGISTRY),
                mimetype=CONTENT_TYPE_LATEST
            )
        except Exception as e:
            logger.error(f"Erreur lors de la génération des métriques: {e}")
            return jsonify({'error': 'Erreur métriques'}), 500
    
    logger.info("Système de monitoring initialisé")


def update_system_metrics():
    """Met à jour les métriques système"""
    try:
        # Métriques mémoire
        memory = psutil.virtual_memory()
        SYSTEM_MEMORY.set(memory.used)
        
        # Métriques CPU
        cpu_percent = psutil.cpu_percent(interval=1)
        SYSTEM_CPU.set(cpu_percent)
        
        # Métriques disque
        disk = psutil.disk_usage('/')
        SYSTEM_DISK.set(disk.percent)
        
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour des métriques système: {e}")


class HealthChecker:
    """Vérificateur de santé des services"""
    
    def __init__(self, app):
        self.app = app
        self.logger = get_logger('health')
    
    def check_database(self) -> Dict[str, Any]:
        """Vérifie la santé de la base de données"""
        try:
            start_time = time.time()
            db.session.execute('SELECT 1 FROM DUAL')
            duration = time.time() - start_time
            
            return {
                'status': 'healthy',
                'response_time': duration,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            self.logger.error(f"Erreur de santé base de données: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    def check_redis(self) -> Dict[str, Any]:
        """Vérifie la santé de Redis"""
        try:
            import redis
            r = redis.Redis.from_url(self.app.config['REDIS_URL'])
            
            start_time = time.time()
            r.ping()
            duration = time.time() - start_time
            
            return {
                'status': 'healthy',
                'response_time': duration,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            self.logger.error(f"Erreur de santé Redis: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    def check_ldap(self) -> Dict[str, Any]:
        """Vérifie la santé du serveur LDAP"""
        if not self.app.config.get('LDAP_ENABLED', True):
            return {
                'status': 'disabled',
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        
        try:
            from core.auth import LDAPManager
            ldap_manager = LDAPManager(self.app)
            
            start_time = time.time()
            conn = ldap_manager.connect()
            duration = time.time() - start_time
            
            if conn:
                conn.unbind_s()
                return {
                    'status': 'healthy',
                    'response_time': duration,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            else:
                return {
                    'status': 'unhealthy',
                    'error': 'Impossible de se connecter au serveur LDAP',
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
        except Exception as e:
            self.logger.error(f"Erreur de santé LDAP: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    def check_ai_services(self) -> Dict[str, Any]:
        """Vérifie la santé des services IA"""
        if not self.app.config.get('AI_ENABLED', True):
            return {
                'status': 'disabled',
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        
        services = {}
        
        # Vérification Ollama
        try:
            import requests
            start_time = time.time()
            response = requests.get(f"{self.app.config['OLLAMA_HOST']}/api/tags", timeout=5)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                services['ollama'] = {
                    'status': 'healthy',
                    'response_time': duration
                }
            else:
                services['ollama'] = {
                    'status': 'unhealthy',
                    'error': f"Status code: {response.status_code}"
                }
        except Exception as e:
            services['ollama'] = {
                'status': 'unhealthy',
                'error': str(e)
            }
        
        # Vérification Whisper
        try:
            import whisper
            start_time = time.time()
            model = whisper.load_model(self.app.config['WHISPER_MODEL'])
            duration = time.time() - start_time
            
            services['whisper'] = {
                'status': 'healthy',
                'response_time': duration
            }
        except Exception as e:
            services['whisper'] = {
                'status': 'unhealthy',
                'error': str(e)
            }
        
        # Vérification Piper
        try:
            import piper
            start_time = time.time()
            model_path = self.app.config['PIPER_MODEL_PATH']
            piper.PiperVoice.load(model_path)
            duration = time.time() - start_time
            
            services['piper'] = {
                'status': 'healthy',
                'response_time': duration
            }
        except Exception as e:
            services['piper'] = {
                'status': 'unhealthy',
                'error': str(e)
            }
        
        return {
            'status': 'healthy' if all(s['status'] == 'healthy' for s in services.values()) else 'degraded',
            'services': services,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    def check_telephony(self) -> Dict[str, Any]:
        """Vérifie la santé des services téléphoniques"""
        if not self.app.config.get('TELEPHONY_ENABLED', True):
            return {
                'status': 'disabled',
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        
        services = {}
        
        # Vérification Asterisk
        try:
            import pyst2
            start_time = time.time()
            manager = pyst2.Manager(
                host=self.app.config['ASTERISK_HOST'],
                port=self.app.config['ASTERISK_PORT'],
                username=self.app.config['ASTERISK_USERNAME'],
                secret=self.app.config['ASTERISK_PASSWORD']
            )
            manager.connect()
            duration = time.time() - start_time
            
            services['asterisk'] = {
                'status': 'healthy',
                'response_time': duration
            }
            manager.close()
        except Exception as e:
            services['asterisk'] = {
                'status': 'unhealthy',
                'error': str(e)
            }
        
        return {
            'status': 'healthy' if all(s['status'] == 'healthy' for s in services.values()) else 'degraded',
            'services': services,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    def comprehensive_health_check(self) -> Dict[str, Any]:
        """Vérification complète de la santé de l'application"""
        checks = {
            'database': self.check_database(),
            'redis': self.check_redis(),
            'ldap': self.check_ldap(),
            'ai_services': self.check_ai_services(),
            'telephony': self.check_telephony()
        }
        
        # Statut global
        all_healthy = all(
            check['status'] in ['healthy', 'disabled'] 
            for check in checks.values()
        )
        
        overall_status = 'healthy' if all_healthy else 'unhealthy'
        
        return {
            'status': overall_status,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'version': self.app.config.get('VERSION', '1.0.0'),
            'environment': self.app.config.get('ENVIRONMENT', 'production'),
            'checks': checks
        }


# Décorateurs pour les métriques
def track_ai_operation(operation_type: str, model: str = 'unknown'):
    """Décorateur pour tracker les opérations IA"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                
                # Métriques de succès
                AI_SUCCESS_RATE.labels(type=operation_type, status='success').inc()
                AI_PROCESSING_TIME.labels(type=operation_type, model=model).observe(duration)
                
                return result
            except Exception as e:
                duration = time.time() - start_time
                
                # Métriques d'erreur
                AI_SUCCESS_RATE.labels(type=operation_type, status='error').inc()
                AI_PROCESSING_TIME.labels(type=operation_type, model=model).observe(duration)
                
                # Log de l'erreur
                logger.error(
                    f"Erreur opération IA {operation_type}",
                    operation_type=operation_type,
                    model=model,
                    duration=duration,
                    error=str(e)
                )
                
                raise
        return wrapper
    return decorator


def track_call_operation(call_type: str = 'unknown'):
    """Décorateur pour tracker les opérations d'appel"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                result = func(*args, **kwargs)
                CALL_COUNT.labels(status='success', type=call_type).inc()
                return result
            except Exception as e:
                CALL_COUNT.labels(status='error', type=call_type).inc()
                ERROR_COUNT.labels(type='call', module='telephony').inc()
                raise
        return wrapper
    return decorator


def track_database_operation(operation_type: str = 'unknown'):
    """Décorateur pour tracker les opérations de base de données"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                
                # Log des requêtes lentes
                if duration > 1.0:
                    logger.warning(
                        f"Requête lente détectée: {operation_type}",
                        operation_type=operation_type,
                        duration=duration
                    )
                
                return result
            except Exception as e:
                duration = time.time() - start_time
                ERROR_COUNT.labels(type='database', module=operation_type).inc()
                
                logger.error(
                    f"Erreur base de données: {operation_type}",
                    operation_type=operation_type,
                    duration=duration,
                    error=str(e)
                )
                raise
        return wrapper
    return decorator


# Fonctions utilitaires
def increment_error_counter(error_type: str, module: str):
    """Incrémente le compteur d'erreurs"""
    ERROR_COUNT.labels(type=error_type, module=module).inc()


def update_active_users(count: int):
    """Met à jour le nombre d'utilisateurs actifs"""
    ACTIVE_USERS.set(count)


def update_database_connections(count: int):
    """Met à jour le nombre de connexions à la base de données"""
    DATABASE_CONNECTIONS.set(count)


def get_metrics_summary() -> Dict[str, Any]:
    """Récupère un résumé des métriques"""
    return {
        'request_count': REQUEST_COUNT._value.sum(),
        'active_users': ACTIVE_USERS._value.get(),
        'database_connections': DATABASE_CONNECTIONS._value.get(),
        'call_count': CALL_COUNT._value.sum(),
        'error_count': ERROR_COUNT._value.sum(),
        'system_memory': SYSTEM_MEMORY._value.get(),
        'system_cpu': SYSTEM_CPU._value.get(),
        'system_disk': SYSTEM_DISK._value.get()
    } 