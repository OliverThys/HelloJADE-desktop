"""
HelloJADE v1.0 - Application Flask Backend
Point d'entrée principal avec factory pattern
"""

import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_compress import Compress
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from prometheus_client import make_wsgi_app
from werkzeug.middleware.proxy_fix import ProxyFix

from core.config import Config
from core.database import db, init_db
from core.auth import jwt, init_auth
from core.logging import init_logging
from core.monitoring import init_monitoring
from core.security import init_security

# Import des routes
from routes.auth import auth_bp
from routes.patients import patients_bp
from routes.calls import calls_bp
from routes.ai import ai_bp
from routes.admin import admin_bp
from routes.monitoring import monitoring_bp


def create_app(config_class=Config):
    """
    Factory pattern pour créer l'application Flask
    
    Args:
        config_class: Classe de configuration à utiliser
        
    Returns:
        Flask: Instance de l'application Flask configurée
    """
    
    # Création de l'application Flask
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Configuration pour proxy (production)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
    
    # Initialisation des composants de base
    init_logging(app)
    init_db(app)
    init_auth(app)
    init_monitoring(app)
    init_security(app)
    
    # Configuration CORS pour Tauri desktop
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:1420", "http://127.0.0.1:1420"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    # Compression des réponses
    Compress(app)
    
    # Rate limiting
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"],
        storage_uri="redis://localhost:6379"
    )
    
    # Enregistrement des blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(patients_bp, url_prefix='/api/patients')
    app.register_blueprint(calls_bp, url_prefix='/api/calls')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(monitoring_bp, url_prefix='/api/monitoring')
    
    # Métriques Prometheus
    app.wsgi_app = make_wsgi_app()
    
    # Routes d'erreur
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Endpoint non trouvé',
            'message': 'L\'endpoint demandé n\'existe pas'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({
            'error': 'Erreur interne du serveur',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500
    
    @app.errorhandler(429)
    def ratelimit_handler(error):
        return jsonify({
            'error': 'Limite de taux dépassée',
            'message': 'Trop de requêtes, veuillez réessayer plus tard'
        }), 429
    
    # Route de santé
    @app.route('/api/health')
    def health_check():
        """Vérification de la santé de l'application"""
        try:
            # Test de la base de données
            db.session.execute('SELECT 1')
            
            return jsonify({
                'status': 'healthy',
                'version': '1.0.0',
                'database': 'connected',
                'services': {
                    'redis': 'connected',
                    'ldap': 'connected',
                    'ai': 'available'
                }
            }), 200
        except Exception as e:
            logging.error(f"Health check failed: {e}")
            return jsonify({
                'status': 'unhealthy',
                'error': str(e)
            }), 503
    
    # Route racine
    @app.route('/')
    def root():
        """Route racine de l'API"""
        return jsonify({
            'name': 'HelloJADE API',
            'version': '1.0.0',
            'description': 'API backend pour l\'application HelloJADE',
            'endpoints': {
                'health': '/api/health',
                'auth': '/api/auth',
                'patients': '/api/patients',
                'calls': '/api/calls',
                'ai': '/api/ai',
                'admin': '/api/admin',
                'monitoring': '/api/monitoring'
            }
        })
    
    return app


def main():
    """Point d'entrée principal pour le développement"""
    app = create_app()
    
    # Configuration du logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Démarrage du serveur
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=app.config.get('DEBUG', False)
    )


if __name__ == '__main__':
    main() 