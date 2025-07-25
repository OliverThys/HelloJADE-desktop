#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HelloJADE v1.0 - Module de monitoring
Configuration Prometheus et métriques personnalisées
"""

import time
import psutil
import threading
from datetime import datetime, timezone
from prometheus_client import (
    Counter, Histogram, Gauge, Summary, generate_latest,
    CONTENT_TYPE_LATEST, REGISTRY
)
from flask import Response, request, g
import logging

logger = logging.getLogger(__name__)

class HelloJADEMetrics:
    """
    Métriques personnalisées pour HelloJADE
    """
    
    def __init__(self):
        # Métriques HTTP
        self.http_requests_total = Counter(
            'hellojade_http_requests_total',
            'Total des requêtes HTTP',
            ['method', 'endpoint', 'status']
        )
        
        self.http_request_duration_seconds = Histogram(
            'hellojade_http_request_duration_seconds',
            'Durée des requêtes HTTP',
            ['method', 'endpoint'],
            buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0]
        )
        
        # Métriques d'authentification
        self.auth_attempts_total = Counter(
            'hellojade_auth_attempts_total',
            'Total des tentatives d\'authentification',
            ['status', 'method']
        )
        
        self.active_sessions = Gauge(
            'hellojade_active_sessions',
            'Nombre de sessions actives'
        )
        
        # Métriques de base de données
        self.db_connections_active = Gauge(
            'hellojade_db_connections_active',
            'Nombre de connexions actives à la base de données'
        )
        
        self.db_query_duration_seconds = Histogram(
            'hellojade_db_query_duration_seconds',
            'Durée des requêtes de base de données',
            ['operation'],
            buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0]
        )
        
        # Métriques de téléphonie
        self.calls_total = Counter(
            'hellojade_calls_total',
            'Total des appels téléphoniques',
            ['status', 'direction', 'type']
        )
        
        self.calls_active = Gauge(
            'hellojade_calls_active',
            'Nombre d\'appels actifs'
        )
        
        self.calls_duration_seconds = Histogram(
            'hellojade_calls_duration_seconds',
            'Durée des appels téléphoniques',
            ['status'],
            buckets=[30, 60, 120, 300, 600, 1800, 3600]
        )
        
        # Métriques IA
        self.ai_transcriptions_total = Counter(
            'hellojade_ai_transcriptions_total',
            'Total des transcriptions IA',
            ['model', 'status']
        )
        
        self.ai_transcription_duration_seconds = Histogram(
            'hellojade_ai_transcription_duration_seconds',
            'Durée des transcriptions IA',
            ['model'],
            buckets=[1, 5, 10, 30, 60, 120, 300]
        )
        
        self.ai_analyses_total = Counter(
            'hellojade_ai_analyses_total',
            'Total des analyses IA',
            ['type', 'model', 'status']
        )
        
        self.ai_analysis_duration_seconds = Histogram(
            'hellojade_ai_analysis_duration_seconds',
            'Durée des analyses IA',
            ['type', 'model'],
            buckets=[1, 5, 10, 30, 60, 120, 300]
        )
        
        # Métriques système
        self.system_cpu_usage = Gauge(
            'hellojade_system_cpu_usage_percent',
            'Utilisation CPU du système'
        )
        
        self.system_memory_usage = Gauge(
            'hellojade_system_memory_usage_bytes',
            'Utilisation mémoire du système'
        )
        
        self.system_disk_usage = Gauge(
            'hellojade_system_disk_usage_bytes',
            'Utilisation disque du système',
            ['mount_point']
        )
        
        self.system_uptime_seconds = Gauge(
            'hellojade_system_uptime_seconds',
            'Temps de fonctionnement du système'
        )
        
        # Métriques métier
        self.patients_total = Gauge(
            'hellojade_patients_total',
            'Nombre total de patients',
            ['status']
        )
        
        self.medical_records_total = Counter(
            'hellojade_medical_records_total',
            'Total des dossiers médicaux',
            ['type', 'severity']
        )
        
        self.audit_events_total = Counter(
            'hellojade_audit_events_total',
            'Total des événements d\'audit',
            ['action', 'resource_type']
        )
        
        # Métriques de sécurité
        self.security_events_total = Counter(
            'hellojade_security_events_total',
            'Total des événements de sécurité',
            ['type', 'severity']
        )
        
        self.failed_login_attempts = Counter(
            'hellojade_failed_login_attempts_total',
            'Total des tentatives de connexion échouées',
            ['ip_address']
        )
        
        # Métriques de performance
        self.cache_hits_total = Counter(
            'hellojade_cache_hits_total',
            'Total des hits de cache',
            ['cache_type']
        )
        
        self.cache_misses_total = Counter(
            'hellojade_cache_misses_total',
            'Total des misses de cache',
            ['cache_type']
        )
        
        # Thread pour la collecte des métriques système
        self.monitoring_thread = None
        self.stop_monitoring = False

# Instance globale des métriques
metrics = HelloJADEMetrics()

def setup_monitoring(app):
    """
    Configure le monitoring pour l'application Flask
    """
    if not app.config.get('PROMETHEUS_ENABLED', True):
        return
    
    # Route pour les métriques Prometheus
    @app.route('/metrics')
    def prometheus_metrics():
        """Endpoint pour les métriques Prometheus"""
        try:
            return Response(
                generate_latest(REGISTRY),
                mimetype=CONTENT_TYPE_LATEST
            )
        except Exception as e:
            logger.error(f"Erreur lors de la génération des métriques: {str(e)}")
            return Response("Erreur interne", status=500)
    
    # Middleware pour collecter les métriques HTTP
    @app.before_request
    def before_request():
        g.start_time = time.time()
    
    @app.after_request
    def after_request(response):
        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time
            
            # Métriques HTTP
            metrics.http_requests_total.labels(
                method=request.method,
                endpoint=request.endpoint or 'unknown',
                status=response.status_code
            ).inc()
            
            metrics.http_request_duration_seconds.labels(
                method=request.method,
                endpoint=request.endpoint or 'unknown'
            ).observe(duration)
        
        return response
    
    # Démarrage du monitoring système
    start_system_monitoring()
    
    logger.info("Monitoring Prometheus configuré")

def start_system_monitoring():
    """Démarre le monitoring système en arrière-plan"""
    if metrics.monitoring_thread and metrics.monitoring_thread.is_alive():
        return
    
    metrics.stop_monitoring = False
    metrics.monitoring_thread = threading.Thread(
        target=_system_monitoring_loop,
        daemon=True
    )
    metrics.monitoring_thread.start()
    logger.info("Monitoring système démarré")

def stop_system_monitoring():
    """Arrête le monitoring système"""
    metrics.stop_monitoring = True
    if metrics.monitoring_thread:
        metrics.monitoring_thread.join(timeout=5)
    logger.info("Monitoring système arrêté")

def _system_monitoring_loop():
    """Boucle de collecte des métriques système"""
    while not metrics.stop_monitoring:
        try:
            # Métriques CPU
            cpu_percent = psutil.cpu_percent(interval=1)
            metrics.system_cpu_usage.set(cpu_percent)
            
            # Métriques mémoire
            memory = psutil.virtual_memory()
            metrics.system_memory_usage.set(memory.used)
            
            # Métriques disque
            for partition in psutil.disk_partitions():
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    metrics.system_disk_usage.labels(
                        mount_point=partition.mountpoint
                    ).set(usage.used)
                except PermissionError:
                    continue
            
            # Métriques uptime
            uptime = time.time() - psutil.boot_time()
            metrics.system_uptime_seconds.set(uptime)
            
            # Pause entre les collectes
            time.sleep(30)  # Collecte toutes les 30 secondes
            
        except Exception as e:
            logger.error(f"Erreur lors de la collecte des métriques système: {str(e)}")
            time.sleep(60)  # Pause plus longue en cas d'erreur

# Fonctions utilitaires pour les métriques

def record_auth_attempt(status, method='ldap'):
    """Enregistre une tentative d'authentification"""
    metrics.auth_attempts_total.labels(status=status, method=method).inc()

def record_db_query(operation, duration):
    """Enregistre une requête de base de données"""
    metrics.db_query_duration_seconds.labels(operation=operation).observe(duration)

def record_call(status, direction='outbound', call_type='scheduled'):
    """Enregistre un appel téléphonique"""
    metrics.calls_total.labels(status=status, direction=direction, type=call_type).inc()

def record_call_duration(status, duration):
    """Enregistre la durée d'un appel"""
    metrics.calls_duration_seconds.labels(status=status).observe(duration)

def record_transcription(model, status, duration=None):
    """Enregistre une transcription IA"""
    metrics.ai_transcriptions_total.labels(model=model, status=status).inc()
    if duration:
        metrics.ai_transcription_duration_seconds.labels(model=model).observe(duration)

def record_analysis(analysis_type, model, status, duration=None):
    """Enregistre une analyse IA"""
    metrics.ai_analyses_total.labels(type=analysis_type, model=model, status=status).inc()
    if duration:
        metrics.ai_analysis_duration_seconds.labels(type=analysis_type, model=model).observe(duration)

def record_security_event(event_type, severity='medium'):
    """Enregistre un événement de sécurité"""
    metrics.security_events_total.labels(type=event_type, severity=severity).inc()

def record_failed_login(ip_address):
    """Enregistre une tentative de connexion échouée"""
    metrics.failed_login_attempts.labels(ip_address=ip_address).inc()

def record_audit_event(action, resource_type):
    """Enregistre un événement d'audit"""
    metrics.audit_events_total.labels(action=action, resource_type=resource_type).inc()

def record_medical_record(record_type, severity='low'):
    """Enregistre un dossier médical"""
    metrics.medical_records_total.labels(type=record_type, severity=severity).inc()

def update_patient_count(status, count):
    """Met à jour le nombre de patients"""
    metrics.patients_total.labels(status=status).set(count)

def update_active_sessions(count):
    """Met à jour le nombre de sessions actives"""
    metrics.active_sessions.set(count)

def update_active_calls(count):
    """Met à jour le nombre d'appels actifs"""
    metrics.calls_active.set(count)

def update_db_connections(count):
    """Met à jour le nombre de connexions actives à la base de données"""
    metrics.db_connections_active.set(count)

def record_cache_hit(cache_type):
    """Enregistre un hit de cache"""
    metrics.cache_hits_total.labels(cache_type=cache_type).inc()

def record_cache_miss(cache_type):
    """Enregistre un miss de cache"""
    metrics.cache_misses_total.labels(cache_type=cache_type).inc()

# Décorateurs pour automatiser la collecte de métriques

def monitor_function(metric_name, labels=None):
    """Décorateur pour monitorer une fonction"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                
                # Enregistrement de la métrique
                if hasattr(metrics, metric_name):
                    metric = getattr(metrics, metric_name)
                    if labels:
                        metric.labels(**labels).observe(duration)
                    else:
                        metric.observe(duration)
                
                return result
            except Exception as e:
                duration = time.time() - start_time
                logger.error(f"Erreur dans {func.__name__}: {str(e)}")
                raise
        return wrapper
    return decorator

def monitor_db_operation(operation):
    """Décorateur pour monitorer les opérations de base de données"""
    return monitor_function('db_query_duration_seconds', {'operation': operation})

def monitor_ai_operation(operation_type, model):
    """Décorateur pour monitorer les opérations IA"""
    if operation_type == 'transcription':
        return monitor_function('ai_transcription_duration_seconds', {'model': model})
    elif operation_type == 'analysis':
        return monitor_function('ai_analysis_duration_seconds', {'type': 'general', 'model': model})
    else:
        return monitor_function('ai_analysis_duration_seconds', {'type': operation_type, 'model': model})

# Fonctions de diagnostic

def get_system_health():
    """Retourne l'état de santé du système"""
    try:
        health = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'cpu_usage': psutil.cpu_percent(),
            'memory_usage': psutil.virtual_memory().percent,
            'disk_usage': {},
            'uptime': time.time() - psutil.boot_time(),
            'status': 'healthy'
        }
        
        # Vérification disque
        for partition in psutil.disk_partitions():
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                health['disk_usage'][partition.mountpoint] = {
                    'used_percent': usage.percent,
                    'free_gb': usage.free / (1024**3)
                }
                
                if usage.percent > 90:
                    health['status'] = 'warning'
            except PermissionError:
                continue
        
        # Vérification CPU et mémoire
        if health['cpu_usage'] > 80 or health['memory_usage'] > 80:
            health['status'] = 'warning'
        
        return health
        
    except Exception as e:
        logger.error(f"Erreur lors de la vérification de santé: {str(e)}")
        return {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'status': 'error',
            'error': str(e)
        }

def get_metrics_summary():
    """Retourne un résumé des métriques principales"""
    try:
        summary = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'http_requests': {
                'total': metrics.http_requests_total._value.sum(),
                'rate_1m': 0  # À calculer si nécessaire
            },
            'calls': {
                'total': metrics.calls_total._value.sum(),
                'active': metrics.calls_active._value.sum()
            },
            'ai_operations': {
                'transcriptions': metrics.ai_transcriptions_total._value.sum(),
                'analyses': metrics.ai_analyses_total._value.sum()
            },
            'system': {
                'cpu_usage': psutil.cpu_percent(),
                'memory_usage': psutil.virtual_memory().percent,
                'uptime': time.time() - psutil.boot_time()
            }
        }
        
        return summary
        
    except Exception as e:
        logger.error(f"Erreur lors de la génération du résumé: {str(e)}")
        return {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'error': str(e)
        } 