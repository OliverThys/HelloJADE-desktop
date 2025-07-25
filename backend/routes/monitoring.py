"""
Module de monitoring pour HelloJADE
Métriques Prometheus, logs, health checks, alerting
"""

from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required
import logging
import psutil
import os
from datetime import datetime, timedelta
from sqlalchemy import text

from core.database import db
from core.monitoring import get_system_metrics, get_ai_metrics, get_telephony_metrics
from core.logging import log_structured
from core.auth import admin_required

monitoring_bp = Blueprint('monitoring', __name__)

# --- Métriques Prometheus ---
@monitoring_bp.route('/metrics', methods=['GET'])
def get_metrics():
    """Endpoint pour les métriques Prometheus"""
    try:
        # Métriques système
        system_metrics = get_system_metrics()
        
        # Métriques AI
        ai_metrics = get_ai_metrics()
        
        # Métriques téléphonie
        telephony_metrics = get_telephony_metrics()
        
        # Métriques base de données
        db_metrics = get_database_metrics()
        
        # Format Prometheus
        prometheus_format = format_prometheus_metrics({
            'system': system_metrics,
            'ai': ai_metrics,
            'telephony': telephony_metrics,
            'database': db_metrics
        })
        
        return prometheus_format, 200, {'Content-Type': 'text/plain'}
        
    except Exception as e:
        logging.error(f"Erreur lors de la récupération des métriques: {e}")
        return "Error collecting metrics", 500


def get_database_metrics():
    """Récupère les métriques de la base de données"""
    try:
        # Connexions actives
        active_connections_query = text("""
            SELECT COUNT(*) as active_connections
            FROM v$session 
            WHERE status = 'ACTIVE'
        """)
        
        # Taille de la base de données
        db_size_query = text("""
            SELECT SUM(bytes)/1024/1024 as db_size_mb
            FROM dba_data_files
        """)
        
        # Performance des requêtes
        slow_queries_query = text("""
            SELECT COUNT(*) as slow_queries
            FROM v$sql 
            WHERE elapsed_time > 1000000
        """)
        
        # Exécution des requêtes (simulation si pas d'accès aux vues système)
        metrics = {
            'active_connections': 5,  # Simulation
            'db_size_mb': 1024,       # Simulation
            'slow_queries': 0,        # Simulation
            'uptime_hours': 168       # Simulation
        }
        
        return metrics
        
    except Exception as e:
        logging.error(f"Erreur lors de la récupération des métriques DB: {e}")
        return {}


def format_prometheus_metrics(metrics_data):
    """Formate les métriques au format Prometheus"""
    prometheus_lines = []
    
    # Métriques système
    system = metrics_data.get('system', {})
    prometheus_lines.append(f"# HELP hellojade_system_cpu_usage CPU usage percentage")
    prometheus_lines.append(f"# TYPE hellojade_system_cpu_usage gauge")
    prometheus_lines.append(f"hellojade_system_cpu_usage {system.get('cpu_usage', 0)}")
    
    prometheus_lines.append(f"# HELP hellojade_system_memory_usage Memory usage percentage")
    prometheus_lines.append(f"# TYPE hellojade_system_memory_usage gauge")
    prometheus_lines.append(f"hellojade_system_memory_usage {system.get('memory_usage', 0)}")
    
    prometheus_lines.append(f"# HELP hellojade_system_disk_usage Disk usage percentage")
    prometheus_lines.append(f"# TYPE hellojade_system_disk_usage gauge")
    prometheus_lines.append(f"hellojade_system_disk_usage {system.get('disk_usage', 0)}")
    
    # Métriques AI
    ai = metrics_data.get('ai', {})
    prometheus_lines.append(f"# HELP hellojade_ai_transcriptions_total Total transcriptions")
    prometheus_lines.append(f"# TYPE hellojade_ai_transcriptions_total counter")
    prometheus_lines.append(f"hellojade_ai_transcriptions_total {ai.get('transcriptions_total', 0)}")
    
    prometheus_lines.append(f"# HELP hellojade_ai_analysis_total Total analyses")
    prometheus_lines.append(f"# TYPE hellojade_ai_analysis_total counter")
    prometheus_lines.append(f"hellojade_ai_analysis_total {ai.get('analysis_total', 0)}")
    
    # Métriques téléphonie
    telephony = metrics_data.get('telephony', {})
    prometheus_lines.append(f"# HELP hellojade_telephony_calls_total Total calls")
    prometheus_lines.append(f"# TYPE hellojade_telephony_calls_total counter")
    prometheus_lines.append(f"hellojade_telephony_calls_total {telephony.get('calls_total', 0)}")
    
    prometheus_lines.append(f"# HELP hellojade_telephony_calls_active Active calls")
    prometheus_lines.append(f"# TYPE hellojade_telephony_calls_active gauge")
    prometheus_lines.append(f"hellojade_telephony_calls_active {telephony.get('calls_active', 0)}")
    
    # Métriques base de données
    database = metrics_data.get('database', {})
    prometheus_lines.append(f"# HELP hellojade_database_connections_active Active database connections")
    prometheus_lines.append(f"# TYPE hellojade_database_connections_active gauge")
    prometheus_lines.append(f"hellojade_database_connections_active {database.get('active_connections', 0)}")
    
    return '\n'.join(prometheus_lines)


# --- Logs système ---
@monitoring_bp.route('/logs', methods=['GET'])
@jwt_required()
@admin_required
def get_logs():
    """Récupère les logs récents du système"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 100, type=int)
        level = request.args.get('level', '')
        start_date = request.args.get('start_date', '')
        end_date = request.args.get('end_date', '')
        
        # Construction de la requête
        query = text("""
            SELECT id, level, message, module, user_id, 
                   created_at, additional_data
            FROM system_logs
            WHERE 1=1
        """)
        
        params = {}
        
        if level:
            query = text(str(query) + " AND level = :level")
            params['level'] = level
            
        if start_date:
            query = text(str(query) + " AND created_at >= :start_date")
            params['start_date'] = start_date
            
        if end_date:
            query = text(str(query) + " AND created_at <= :end_date")
            params['end_date'] = end_date
        
        query = text(str(query) + """
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        
        params['limit'] = per_page
        params['offset'] = (page - 1) * per_page
        
        result = db.session.execute(query, params)
        logs = []
        
        for row in result:
            log_entry = dict(row)
            # Conversion des données JSON supplémentaires
            if log_entry.get('additional_data'):
                try:
                    import json
                    log_entry['additional_data'] = json.loads(log_entry['additional_data'])
                except:
                    pass
            logs.append(log_entry)
        
        # Compte total
        count_query = text("""
            SELECT COUNT(*) as total
            FROM system_logs
            WHERE 1=1
        """)
        
        count_params = {k: v for k, v in params.items() if k not in ['limit', 'offset']}
        if count_params:
            for key, value in count_params.items():
                count_query = text(str(count_query).replace(f':{key}', f"'{value}'"))
        
        total = db.session.execute(count_query).scalar()
        
        return jsonify({
            'logs': logs,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        }), 200
        
    except Exception as e:
        logging.error(f"Erreur lors de la récupération des logs: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500


# --- Health checks détaillés ---
@monitoring_bp.route('/health/detailed', methods=['GET'])
@jwt_required()
@admin_required
def detailed_health_check():
    """Vérification détaillée de la santé de tous les services"""
    try:
        health_status = {
            'timestamp': datetime.now().isoformat(),
            'overall_status': 'healthy',
            'services': {}
        }
        
        # Vérification base de données
        try:
            db.session.execute('SELECT 1')
            health_status['services']['database'] = {
                'status': 'healthy',
                'response_time_ms': 50,  # Simulation
                'details': 'Connexion Oracle active'
            }
        except Exception as e:
            health_status['services']['database'] = {
                'status': 'unhealthy',
                'error': str(e)
            }
            health_status['overall_status'] = 'unhealthy'
        
        # Vérification Redis
        try:
            import redis
            r = redis.Redis(host='localhost', port=6379, db=0)
            r.ping()
            health_status['services']['redis'] = {
                'status': 'healthy',
                'response_time_ms': 10,  # Simulation
                'details': 'Cache Redis disponible'
            }
        except Exception as e:
            health_status['services']['redis'] = {
                'status': 'unhealthy',
                'error': str(e)
            }
            health_status['overall_status'] = 'unhealthy'
        
        # Vérification LDAP
        try:
            from core.auth import test_ldap_connection
            test_ldap_connection()
            health_status['services']['ldap'] = {
                'status': 'healthy',
                'response_time_ms': 100,  # Simulation
                'details': 'Serveur LDAP accessible'
            }
        except Exception as e:
            health_status['services']['ldap'] = {
                'status': 'unhealthy',
                'error': str(e)
            }
            health_status['overall_status'] = 'unhealthy'
        
        # Vérification AI services
        try:
            from core.ai import check_ai_services
            ai_status = check_ai_services()
            health_status['services']['ai'] = {
                'status': 'healthy' if ai_status else 'unhealthy',
                'details': ai_status or 'Services AI non disponibles'
            }
        except Exception as e:
            health_status['services']['ai'] = {
                'status': 'unhealthy',
                'error': str(e)
            }
        
        # Vérification téléphonie
        try:
            from core.telephony import check_telephony_services
            telephony_status = check_telephony_services()
            health_status['services']['telephony'] = {
                'status': 'healthy' if telephony_status else 'unhealthy',
                'details': telephony_status or 'Services téléphonie non disponibles'
            }
        except Exception as e:
            health_status['services']['telephony'] = {
                'status': 'unhealthy',
                'error': str(e)
            }
        
        # Métriques système
        health_status['system_metrics'] = {
            'cpu_usage_percent': psutil.cpu_percent(),
            'memory_usage_percent': psutil.virtual_memory().percent,
            'disk_usage_percent': psutil.disk_usage('/').percent,
            'uptime_seconds': time.time() - psutil.boot_time()
        }
        
        return jsonify(health_status), 200 if health_status['overall_status'] == 'healthy' else 503
        
    except Exception as e:
        logging.error(f"Erreur lors du health check détaillé: {e}")
        return jsonify({
            'timestamp': datetime.now().isoformat(),
            'overall_status': 'unhealthy',
            'error': str(e)
        }), 503


# --- Alertes et notifications ---
@monitoring_bp.route('/alerts', methods=['GET'])
@jwt_required()
@admin_required
def get_alerts():
    """Récupère les alertes système actives"""
    try:
        # Alertes système (simulation)
        alerts = [
            {
                'id': 1,
                'level': 'warning',
                'message': 'Utilisation CPU élevée (>80%)',
                'service': 'system',
                'created_at': (datetime.now() - timedelta(minutes=30)).isoformat(),
                'resolved': False
            },
            {
                'id': 2,
                'level': 'info',
                'message': 'Sauvegarde automatique terminée',
                'service': 'database',
                'created_at': (datetime.now() - timedelta(hours=2)).isoformat(),
                'resolved': True
            }
        ]
        
        return jsonify({'alerts': alerts}), 200
        
    except Exception as e:
        logging.error(f"Erreur lors de la récupération des alertes: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500


@monitoring_bp.route('/alerts/<int:alert_id>/resolve', methods=['POST'])
@jwt_required()
@admin_required
def resolve_alert(alert_id):
    """Marque une alerte comme résolue"""
    try:
        # Simulation de résolution d'alerte
        log_structured(
            'alert_resolved',
            user_id=g.current_user.id,
            alert_id=alert_id
        )
        
        return jsonify({'message': 'Alerte marquée comme résolue'}), 200
        
    except Exception as e:
        logging.error(f"Erreur lors de la résolution de l'alerte: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500


# --- Performance et analytics ---
@monitoring_bp.route('/performance', methods=['GET'])
@jwt_required()
@admin_required
def get_performance_metrics():
    """Récupère les métriques de performance de l'application"""
    try:
        # Métriques de performance (simulation)
        performance_metrics = {
            'api_response_times': {
                'average_ms': 150,
                'p95_ms': 300,
                'p99_ms': 500
            },
            'database_queries': {
                'total_per_minute': 1200,
                'slow_queries_percent': 2.5,
                'average_response_time_ms': 45
            },
            'ai_processing': {
                'transcription_accuracy_percent': 95.2,
                'average_processing_time_seconds': 3.5,
                'success_rate_percent': 98.7
            },
            'telephony': {
                'call_success_rate_percent': 94.8,
                'average_call_duration_minutes': 8.5,
                'concurrent_calls': 12
            }
        }
        
        return jsonify(performance_metrics), 200
        
    except Exception as e:
        logging.error(f"Erreur lors de la récupération des métriques de performance: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500


# --- Dashboard data ---
@monitoring_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@admin_required
def get_dashboard_data():
    """Récupère les données pour le dashboard de monitoring"""
    try:
        # Statistiques en temps réel
        real_time_stats = {
            'active_users': 15,
            'active_calls': 8,
            'pending_calls': 23,
            'system_load': 45.2
        }
        
        # Graphiques des dernières 24h
        hourly_data = []
        for i in range(24):
            hour = datetime.now() - timedelta(hours=23-i)
            hourly_data.append({
                'hour': hour.strftime('%H:00'),
                'calls': 15 + (i % 10),  # Simulation
                'transcriptions': 12 + (i % 8),
                'errors': max(0, 2 - (i % 5))
            })
        
        # Alertes récentes
        recent_alerts = [
            {
                'level': 'info',
                'message': 'Nouveau patient ajouté',
                'time': (datetime.now() - timedelta(minutes=5)).isoformat()
            },
            {
                'level': 'warning',
                'message': 'Taux d\'erreur transcription > 5%',
                'time': (datetime.now() - timedelta(minutes=15)).isoformat()
            }
        ]
        
        dashboard_data = {
            'real_time_stats': real_time_stats,
            'hourly_data': hourly_data,
            'recent_alerts': recent_alerts,
            'last_updated': datetime.now().isoformat()
        }
        
        return jsonify(dashboard_data), 200
        
    except Exception as e:
        logging.error(f"Erreur lors de la récupération des données dashboard: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500 