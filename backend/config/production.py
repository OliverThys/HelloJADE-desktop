"""
Configuration de production pour HelloJADE
"""

import os
from datetime import timedelta

class ProductionConfig:
    """Configuration pour l'environnement de production"""
    
    # Configuration Flask
    SECRET_KEY = os.environ.get('HELLOJADE_SECRET_KEY', 'change-me-in-production')
    DEBUG = False
    TESTING = False
    
    # Configuration base de données Oracle
    ORACLE_HOST = os.environ.get('ORACLE_HOST', 'localhost')
    ORACLE_PORT = int(os.environ.get('ORACLE_PORT', 1521))
    ORACLE_SERVICE = os.environ.get('ORACLE_SERVICE', 'XE')
    ORACLE_USER = os.environ.get('ORACLE_USER', 'hellojade')
    ORACLE_PASSWORD = os.environ.get('ORACLE_PASSWORD', '')
    
    SQLALCHEMY_DATABASE_URI = f"oracle+cx_oracle://{ORACLE_USER}:{ORACLE_PASSWORD}@{ORACLE_HOST}:{ORACLE_PORT}/?service_name={ORACLE_SERVICE}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
        'max_overflow': 20
    }
    
    # Configuration JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'change-jwt-key-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_ERROR_MESSAGE_KEY = 'error'
    
    # Configuration LDAP
    LDAP_SERVER = os.environ.get('LDAP_SERVER', 'ldap.epicura.be')
    LDAP_PORT = int(os.environ.get('LDAP_PORT', 389))
    LDAP_BASE_DN = os.environ.get('LDAP_BASE_DN', 'dc=epicura,dc=be')
    LDAP_BIND_DN = os.environ.get('LDAP_BIND_DN', 'cn=hellojade,ou=services,dc=epicura,dc=be')
    LDAP_BIND_PASSWORD = os.environ.get('LDAP_BIND_PASSWORD', '')
    LDAP_USER_SEARCH_BASE = os.environ.get('LDAP_USER_SEARCH_BASE', 'ou=users,dc=epicura,dc=be')
    LDAP_USER_SEARCH_FILTER = os.environ.get('LDAP_USER_SEARCH_FILTER', '(uid={username})')
    
    # Configuration Redis
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    
    # Configuration CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:1420').split(',')
    
    # Configuration Rate Limiting
    RATE_LIMIT_DEFAULT = os.environ.get('RATE_LIMIT_DEFAULT', '100/minute')
    RATE_LIMIT_STORAGE_URL = os.environ.get('RATE_LIMIT_STORAGE_URL', 'redis://localhost:6379/1')
    
    # Configuration IA
    WHISPER_MODEL = os.environ.get('WHISPER_MODEL', 'base')
    PIPER_MODEL_PATH = os.environ.get('PIPER_MODEL_PATH', './ai/models/piper/fr_FR-amy-medium.onnx')
    OLLAMA_HOST = os.environ.get('OLLAMA_HOST', 'http://localhost:11434')
    OLLAMA_MODEL = os.environ.get('OLLAMA_MODEL', 'llama2')
    
    # Configuration téléphonie
    ASTERISK_HOST = os.environ.get('ASTERISK_HOST', 'localhost')
    ASTERISK_PORT = int(os.environ.get('ASTERISK_PORT', 5038))
    ASTERISK_USERNAME = os.environ.get('ASTERISK_USERNAME', 'hellojade')
    ASTERISK_PASSWORD = os.environ.get('ASTERISK_PASSWORD', '')
    
    ZADARMA_API_KEY = os.environ.get('ZADARMA_API_KEY', '')
    ZADARMA_SECRET_KEY = os.environ.get('ZADARMA_SECRET_KEY', '')
    
    # Configuration monitoring
    PROMETHEUS_MULTIPROC_DIR = os.environ.get('PROMETHEUS_MULTIPROC_DIR', '/tmp')
    
    # Configuration logs
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_FILE = os.environ.get('LOG_FILE', '/app/logs/hellojade.log')
    
    # Configuration fichiers
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', '/app/uploads')
    RECORDINGS_FOLDER = os.environ.get('RECORDINGS_FOLDER', '/app/recordings')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    
    # Configuration sécurité
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    
    # Configuration compression
    COMPRESS_MIMETYPES = [
        'text/html', 'text/css', 'text/xml',
        'application/json', 'application/javascript'
    ]
    COMPRESS_LEVEL = 6
    COMPRESS_MIN_SIZE = 500 