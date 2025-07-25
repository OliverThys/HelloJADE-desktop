#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HelloJADE v1.0 - Application principale Flask
Application desktop SaaS pour les appels post-hospitalisation
"""

import os
import sys
import logging
import argparse
from datetime import datetime, timezone
from pathlib import Path

# Ajout du répertoire parent au path pour les imports
sys.path.append(str(Path(__file__).parent.parent))

from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_compress import Compress
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
import yaml
from dotenv import load_dotenv

# Import des modules HelloJADE
from core.config import Config
from core.database import init_db, get_db
from core.auth import init_auth, ldap_auth
from core.logging import setup_logging
from core.monitoring import setup_monitoring
from core.security import SecurityManager
from core.telephony import TelephonyManager
from core.ai import AIManager

# Import des routes
from routes.auth import auth_bp
from routes.patients import patients_bp
from routes.calls import calls_bp
from routes.ai import ai_bp
from routes.admin import admin_bp
from routes.monitoring import monitoring_bp

# Chargement des variables d'environnement
load_dotenv()

def create_app(config_class=Config):
    """
    Factory pattern pour créer l'application Flask
    """
    app = Flask(__name__)
    
    # Configuration de l'application
    app.config.from_object(config_class)
    
    # Configuration CORS pour Tauri
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "tauri://localhost"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Configuration de la compression
    Compress(app)
    
    # Configuration du rate limiting
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"]
    )
    
    # Configuration JWT
    jwt = JWTManager(app)
    
    # Configuration du logging
    setup_logging(app)
    
    # Configuration du monitoring
    setup_monitoring(app)
    
    # Initialisation de la base de données
    with app.app_context():
        init_db(app)
    
    # Initialisation de l'authentification
    init_auth(app)
    
    # Initialisation des managers
    app.security_manager = SecurityManager(app)
    app.telephony_manager = TelephonyManager(app)
    app.ai_manager = AIManager(app)
    
    # Enregistrement des blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(patients_bp, url_prefix='/api/patients')
    app.register_blueprint(calls_bp, url_prefix='/api/calls')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(monitoring_bp, url_prefix='/api/monitoring')
    
    # Middleware pour le logging des requêtes
    @app.before_request
    def before_request():
        g.start_time = datetime.now(timezone.utc)
        g.request_id = request.headers.get('X-Request-ID', 'unknown')
        
        # Log de la requête
        app.logger.info(
            f"Request started - {request.method} {request.path} - "
            f"IP: {request.remote_addr} - User: {get_jwt_identity() if request.endpoint else 'anonymous'}"
        )
    
    @app.after_request
    def after_request(response):
        # Calcul du temps de réponse
        if hasattr(g, 'start_time'):
            duration = (datetime.now(timezone.utc) - g.start_time).total_seconds()
            response.headers['X-Response-Time'] = str(duration)
            
            # Log de la réponse
            app.logger.info(
                f"Request completed - {request.method} {request.path} - "
                f"Status: {response.status_code} - Duration: {duration:.3f}s"
            )
        
        return response
    
    # Gestionnaire d'erreurs global
    @app.errorhandler(Exception)
    def handle_exception(e):
        app.logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Internal server error',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Not found',
            'message': 'La ressource demandée n\'existe pas'
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            'error': 'Method not allowed',
            'message': 'Méthode HTTP non autorisée'
        }), 405
    
    # Route de santé
    @app.route('/api/health')
    def health_check():
        """Route de vérification de la santé de l'application"""
        try:
            # Vérification de la base de données
            db = get_db()
            db.execute("SELECT 1 FROM DUAL")
            
            # Vérification des services
            services_status = {
                'database': 'healthy',
                'ldap': 'healthy' if app.config.get('LDAP_ENABLED', False) else 'disabled',
                'telephony': 'healthy' if app.config.get('TELEPHONY_ENABLED', False) else 'disabled',
                'ai': 'healthy' if app.config.get('AI_ENABLED', False) else 'disabled'
            }
            
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'version': app.config.get('VERSION', '1.0.0'),
                'environment': app.config.get('ENVIRONMENT', 'production'),
                'services': services_status
            }), 200
            
        except Exception as e:
            app.logger.error(f"Health check failed: {str(e)}")
            return jsonify({
                'status': 'unhealthy',
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'error': str(e)
            }), 503
    
    # Route racine
    @app.route('/')
    def root():
        """Route racine de l'API"""
        return jsonify({
            'name': 'HelloJADE API',
            'version': app.config.get('VERSION', '1.0.0'),
            'description': 'API pour l\'application HelloJADE - Gestion post-hospitalisation',
            'documentation': '/api/docs',
            'health': '/api/health'
        })
    
    # Route de documentation
    @app.route('/api/docs')
    def api_docs():
        """Documentation de l'API"""
        return jsonify({
            'title': 'HelloJADE API Documentation',
            'version': app.config.get('VERSION', '1.0.0'),
            'endpoints': {
                'auth': {
                    'login': 'POST /api/auth/login',
                    'logout': 'POST /api/auth/logout',
                    'refresh': 'POST /api/auth/refresh',
                    'profile': 'GET /api/auth/profile'
                },
                'patients': {
                    'list': 'GET /api/patients',
                    'get': 'GET /api/patients/<id>',
                    'create': 'POST /api/patients',
                    'update': 'PUT /api/patients/<id>',
                    'delete': 'DELETE /api/patients/<id>'
                },
                'calls': {
                    'list': 'GET /api/calls',
                    'get': 'GET /api/calls/<id>',
                    'create': 'POST /api/calls',
                    'update': 'PUT /api/calls/<id>',
                    'delete': 'DELETE /api/calls/<id>',
                    'schedule': 'POST /api/calls/schedule',
                    'start': 'POST /api/calls/<id>/start'
                },
                'ai': {
                    'transcribe': 'POST /api/ai/transcribe',
                    'analyze': 'POST /api/ai/analyze',
                    'synthesize': 'POST /api/ai/synthesize'
                },
                'admin': {
                    'users': 'GET /api/admin/users',
                    'stats': 'GET /api/admin/stats',
                    'logs': 'GET /api/admin/logs'
                },
                'monitoring': {
                    'metrics': 'GET /api/monitoring/metrics',
                    'health': 'GET /api/health'
                }
            }
        })
    
    return app

def main():
    """Fonction principale pour démarrer l'application"""
    parser = argparse.ArgumentParser(description='HelloJADE Flask Application')
    parser.add_argument('--host', default='127.0.0.1', help='Host to bind to')
    parser.add_argument('--port', type=int, default=5000, help='Port to bind to')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    parser.add_argument('--test', action='store_true', help='Run tests')
    parser.add_argument('--config', help='Path to config file')
    
    args = parser.parse_args()
    
    if args.test:
        # Mode test
        import pytest
        pytest.main(['tests/'])
        return
    
    # Création de l'application
    app = create_app()
    
    # Configuration du mode debug
    if args.debug:
        app.config['DEBUG'] = True
        app.config['TESTING'] = True
    
    # Démarrage de l'application
    app.logger.info(f"Starting HelloJADE v{app.config.get('VERSION', '1.0.0')}")
    app.logger.info(f"Environment: {app.config.get('ENVIRONMENT', 'production')}")
    app.logger.info(f"Debug mode: {app.config.get('DEBUG', False)}")
    
    app.run(
        host=args.host,
        port=args.port,
        debug=app.config.get('DEBUG', False),
        threaded=True
    )

if __name__ == '__main__':
    main() 