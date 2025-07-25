#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HelloJADE v1.0 - Module de configuration
Gestion centralisée de la configuration de l'application
"""

import os
import yaml
from pathlib import Path
from dotenv import load_dotenv

# Chargement des variables d'environnement
load_dotenv()

class Config:
    """
    Classe de configuration principale pour HelloJADE
    """
    
    # Configuration de base de l'application
    APP_NAME = "HelloJADE"
    VERSION = "1.0.0"
    ENVIRONMENT = os.getenv('ENVIRONMENT', 'production')
    DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'
    SECRET_KEY = os.getenv('HELLOJADE_SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Configuration de la base de données Oracle
    ORACLE_HOST = os.getenv('ORACLE_HOST', 'localhost')
    ORACLE_PORT = int(os.getenv('ORACLE_PORT', '1521'))
    ORACLE_SERVICE = os.getenv('ORACLE_SERVICE', 'XE')
    ORACLE_USER = os.getenv('ORACLE_USER', 'hellojade')
    ORACLE_PASSWORD = os.getenv('ORACLE_PASSWORD', '')
    
    # URL de connexion Oracle
    @property
    def SQLALCHEMY_DATABASE_URI(self):
        return f"oracle+cx_oracle://{self.ORACLE_USER}:{self.ORACLE_PASSWORD}@{self.ORACLE_HOST}:{self.ORACLE_PORT}/?service_name={self.ORACLE_SERVICE}"
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': int(os.getenv('DB_POOL_SIZE', '10')),
        'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', '20')),
        'pool_timeout': int(os.getenv('DB_POOL_TIMEOUT', '30')),
        'pool_recycle': int(os.getenv('DB_POOL_RECYCLE', '3600'))
    }
    
    # Configuration LDAP
    LDAP_ENABLED = os.getenv('LDAP_ENABLED', 'true').lower() == 'true'
    LDAP_SERVER = os.getenv('LDAP_SERVER', 'ldap.epicura.be')
    LDAP_PORT = int(os.getenv('LDAP_PORT', '389'))
    LDAP_USE_SSL = os.getenv('LDAP_USE_SSL', 'false').lower() == 'true'
    LDAP_USE_TLS = os.getenv('LDAP_USE_TLS', 'true').lower() == 'true'
    LDAP_BASE_DN = os.getenv('LDAP_BASE_DN', 'dc=epicura,dc=be')
    LDAP_BIND_DN = os.getenv('LDAP_BIND_DN', 'cn=hellojade,ou=services,dc=epicura,dc=be')
    LDAP_BIND_PASSWORD = os.getenv('LDAP_BIND_PASSWORD', '')
    LDAP_USER_SEARCH_BASE = os.getenv('LDAP_USER_SEARCH_BASE', 'ou=users,dc=epicura,dc=be')
    LDAP_GROUP_SEARCH_BASE = os.getenv('LDAP_GROUP_SEARCH_BASE', 'ou=groups,dc=epicura,dc=be')
    LDAP_TIMEOUT = int(os.getenv('LDAP_TIMEOUT', '10'))
    LDAP_RETRIES = int(os.getenv('LDAP_RETRIES', '3'))
    
    # Configuration JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES_HOURS', '24')) * 3600  # 24 heures
    JWT_REFRESH_TOKEN_EXPIRES = int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES_DAYS', '7')) * 86400  # 7 jours
    JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
    
    # Configuration téléphonie
    TELEPHONY_ENABLED = os.getenv('TELEPHONY_ENABLED', 'true').lower() == 'true'
    
    # Configuration Asterisk
    ASTERISK_HOST = os.getenv('ASTERISK_HOST', 'localhost')
    ASTERISK_PORT = int(os.getenv('ASTERISK_PORT', '5038'))
    ASTERISK_USER = os.getenv('ASTERISK_USER', 'hellojade')
    ASTERISK_PASSWORD = os.getenv('ASTERISK_PASSWORD', '')
    ASTERISK_CONTEXT = os.getenv('ASTERISK_CONTEXT', 'hellojade')
    ASTERISK_EXTENSION_PREFIX = os.getenv('ASTERISK_EXTENSION_PREFIX', '8')
    
    # Configuration Zadarma
    ZADARMA_API_KEY = os.getenv('ZADARMA_API_KEY', '')
    ZADARMA_API_SECRET = os.getenv('ZADARMA_API_SECRET', '')
    ZADARMA_WEBHOOK_URL = os.getenv('ZADARMA_WEBHOOK_URL', '')
    ZADARMA_CALL_TIMEOUT = int(os.getenv('ZADARMA_CALL_TIMEOUT', '60'))
    ZADARMA_RETRY_ATTEMPTS = int(os.getenv('ZADARMA_RETRY_ATTEMPTS', '3'))
    
    # Configuration IA
    AI_ENABLED = os.getenv('AI_ENABLED', 'true').lower() == 'true'
    
    # Configuration Whisper
    WHISPER_MODEL = os.getenv('WHISPER_MODEL', 'base')
    WHISPER_LANGUAGE = os.getenv('WHISPER_LANGUAGE', 'fr')
    WHISPER_DEVICE = os.getenv('WHISPER_DEVICE', 'cpu')
    WHISPER_BATCH_SIZE = int(os.getenv('WHISPER_BATCH_SIZE', '16'))
    
    # Configuration Piper
    PIPER_MODEL_PATH = os.getenv('PIPER_MODEL_PATH', './ai/models/piper/fr_FR-amy-medium.onnx')
    PIPER_CONFIG_PATH = os.getenv('PIPER_CONFIG_PATH', './ai/models/piper/fr_FR-amy-medium.onnx.json')
    PIPER_DEVICE = os.getenv('PIPER_DEVICE', 'cpu')
    PIPER_SPEED = float(os.getenv('PIPER_SPEED', '1.0'))
    
    # Configuration Ollama
    OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
    OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama2:7b')
    OLLAMA_TEMPERATURE = float(os.getenv('OLLAMA_TEMPERATURE', '0.7'))
    OLLAMA_MAX_TOKENS = int(os.getenv('OLLAMA_MAX_TOKENS', '2048'))
    OLLAMA_TIMEOUT = int(os.getenv('OLLAMA_TIMEOUT', '30'))
    
    # Configuration sécurité
    PASSWORD_MIN_LENGTH = int(os.getenv('PASSWORD_MIN_LENGTH', '12'))
    PASSWORD_REQUIRE_UPPERCASE = os.getenv('PASSWORD_REQUIRE_UPPERCASE', 'true').lower() == 'true'
    PASSWORD_REQUIRE_LOWERCASE = os.getenv('PASSWORD_REQUIRE_LOWERCASE', 'true').lower() == 'true'
    PASSWORD_REQUIRE_NUMBERS = os.getenv('PASSWORD_REQUIRE_NUMBERS', 'true').lower() == 'true'
    PASSWORD_REQUIRE_SPECIAL = os.getenv('PASSWORD_REQUIRE_SPECIAL', 'true').lower() == 'true'
    
    # Configuration logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = os.getenv('LOG_FORMAT', '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    LOG_FILE = os.getenv('LOG_FILE', './logs/hellojade.log')
    LOG_MAX_SIZE = os.getenv('LOG_MAX_SIZE', '100MB')
    LOG_BACKUP_COUNT = int(os.getenv('LOG_BACKUP_COUNT', '5'))
    LOG_SYSLOG = os.getenv('LOG_SYSLOG', 'false').lower() == 'true'
    
    # Configuration monitoring
    PROMETHEUS_ENABLED = os.getenv('PROMETHEUS_ENABLED', 'true').lower() == 'true'
    PROMETHEUS_PORT = int(os.getenv('PROMETHEUS_PORT', '9090'))
    PROMETHEUS_METRICS_PATH = os.getenv('PROMETHEUS_METRICS_PATH', '/metrics')
    
    # Configuration Grafana
    GRAFANA_ENABLED = os.getenv('GRAFANA_ENABLED', 'true').lower() == 'true'
    GRAFANA_PORT = int(os.getenv('GRAFANA_PORT', '3000'))
    GRAFANA_ADMIN_USER = os.getenv('GRAFANA_ADMIN_USER', 'admin')
    GRAFANA_ADMIN_PASSWORD = os.getenv('GRAFANA_ADMIN_PASSWORD', '')
    
    # Configuration ELK Stack
    ELASTICSEARCH_HOST = os.getenv('ELASTICSEARCH_HOST', 'localhost')
    ELASTICSEARCH_PORT = int(os.getenv('ELASTICSEARCH_PORT', '9200'))
    ELASTICSEARCH_INDEX_PREFIX = os.getenv('ELASTICSEARCH_INDEX_PREFIX', 'hellojade')
    
    LOGSTASH_HOST = os.getenv('LOGSTASH_HOST', 'localhost')
    LOGSTASH_PORT = int(os.getenv('LOGSTASH_PORT', '5044'))
    
    KIBANA_HOST = os.getenv('KIBANA_HOST', 'localhost')
    KIBANA_PORT = int(os.getenv('KIBANA_PORT', '5601'))
    
    # Configuration notifications
    EMAIL_ENABLED = os.getenv('EMAIL_ENABLED', 'false').lower() == 'true'
    SMTP_HOST = os.getenv('SMTP_HOST', '')
    SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
    SMTP_USER = os.getenv('SMTP_USER', '')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
    EMAIL_FROM_ADDRESS = os.getenv('EMAIL_FROM_ADDRESS', 'noreply@hellojade.com')
    
    SMS_ENABLED = os.getenv('SMS_ENABLED', 'false').lower() == 'true'
    TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
    TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
    TWILIO_FROM_NUMBER = os.getenv('TWILIO_FROM_NUMBER', '')
    
    # Configuration backup
    BACKUP_ENABLED = os.getenv('BACKUP_ENABLED', 'true').lower() == 'true'
    BACKUP_SCHEDULE = os.getenv('BACKUP_SCHEDULE', '0 2 * * *')  # Tous les jours à 2h
    BACKUP_RETENTION_DAYS = int(os.getenv('BACKUP_RETENTION_DAYS', '30'))
    BACKUP_STORAGE_PATH = os.getenv('BACKUP_STORAGE_PATH', './backups')
    BACKUP_INCLUDE_DATABASE = os.getenv('BACKUP_INCLUDE_DATABASE', 'true').lower() == 'true'
    BACKUP_INCLUDE_LOGS = os.getenv('BACKUP_INCLUDE_LOGS', 'true').lower() == 'true'
    BACKUP_INCLUDE_CONFIG = os.getenv('BACKUP_INCLUDE_CONFIG', 'true').lower() == 'true'
    
    # Configuration performance
    MAX_CONCURRENT_CALLS = int(os.getenv('MAX_CONCURRENT_CALLS', '10'))
    MAX_CONCURRENT_TRANSCRIPTIONS = int(os.getenv('MAX_CONCURRENT_TRANSCRIPTIONS', '5'))
    CACHE_TTL = int(os.getenv('CACHE_TTL', '3600'))
    SESSION_TIMEOUT = int(os.getenv('SESSION_TIMEOUT', '1800'))
    
    # Rate limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE = int(os.getenv('RATE_LIMIT_REQUESTS_PER_MINUTE', '100'))
    RATE_LIMIT_BURST_SIZE = int(os.getenv('RATE_LIMIT_BURST_SIZE', '20'))
    
    # Chemins des dossiers
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', './uploads')
    TEMP_FOLDER = os.getenv('TEMP_FOLDER', './temp')
    AI_MODELS_FOLDER = os.getenv('AI_MODELS_FOLDER', './ai/models')
    
    @classmethod
    def load_from_file(cls, config_file=None):
        """
        Charge la configuration depuis un fichier YAML
        """
        if config_file is None:
            config_file = Path(__file__).parent.parent.parent / 'config' / 'config.yml'
        
        if config_file.exists():
            with open(config_file, 'r', encoding='utf-8') as f:
                config_data = yaml.safe_load(f)
            
            # Mise à jour des attributs de classe avec les données du fichier
            for section, values in config_data.items():
                if isinstance(values, dict):
                    for key, value in values.items():
                        env_key = f"{section.upper()}_{key.upper()}"
                        if isinstance(value, str) and value.startswith('${') and value.endswith('}'):
                            # Variable d'environnement
                            env_var = value[2:-1]
                            setattr(cls, env_key, os.getenv(env_var, ''))
                        else:
                            setattr(cls, env_key, value)
        
        return cls
    
    @classmethod
    def validate(cls):
        """
        Valide la configuration et retourne les erreurs
        """
        errors = []
        
        # Vérification des variables obligatoires
        required_vars = [
            ('HELLOJADE_SECRET_KEY', cls.SECRET_KEY),
            ('ORACLE_PASSWORD', cls.ORACLE_PASSWORD),
            ('JWT_SECRET_KEY', cls.JWT_SECRET_KEY)
        ]
        
        for var_name, var_value in required_vars:
            if not var_value or var_value == 'dev-secret-key-change-in-production':
                errors.append(f"Variable d'environnement {var_name} manquante ou invalide")
        
        # Vérification LDAP
        if cls.LDAP_ENABLED:
            if not cls.LDAP_BIND_PASSWORD:
                errors.append("LDAP_BIND_PASSWORD requis quand LDAP est activé")
        
        # Vérification téléphonie
        if cls.TELEPHONY_ENABLED:
            if not cls.ASTERISK_PASSWORD:
                errors.append("ASTERISK_PASSWORD requis quand la téléphonie est activée")
            if not cls.ZADARMA_API_KEY:
                errors.append("ZADARMA_API_KEY requis quand la téléphonie est activée")
        
        # Vérification IA
        if cls.AI_ENABLED:
            if not Path(cls.PIPER_MODEL_PATH).exists():
                errors.append(f"Modèle Piper non trouvé: {cls.PIPER_MODEL_PATH}")
        
        return errors
    
    @classmethod
    def get_database_url(cls):
        """
        Retourne l'URL de connexion à la base de données
        """
        return cls.SQLALCHEMY_DATABASE_URI
    
    @classmethod
    def get_ldap_config(cls):
        """
        Retourne la configuration LDAP
        """
        return {
            'server': cls.LDAP_SERVER,
            'port': cls.LDAP_PORT,
            'use_ssl': cls.LDAP_USE_SSL,
            'use_tls': cls.LDAP_USE_TLS,
            'base_dn': cls.LDAP_BASE_DN,
            'bind_dn': cls.LDAP_BIND_DN,
            'bind_password': cls.LDAP_BIND_PASSWORD,
            'user_search_base': cls.LDAP_USER_SEARCH_BASE,
            'group_search_base': cls.LDAP_GROUP_SEARCH_BASE,
            'timeout': cls.LDAP_TIMEOUT,
            'retries': cls.LDAP_RETRIES
        }
    
    @classmethod
    def get_asterisk_config(cls):
        """
        Retourne la configuration Asterisk
        """
        return {
            'host': cls.ASTERISK_HOST,
            'port': cls.ASTERISK_PORT,
            'username': cls.ASTERISK_USER,
            'password': cls.ASTERISK_PASSWORD,
            'context': cls.ASTERISK_CONTEXT,
            'extension_prefix': cls.ASTERISK_EXTENSION_PREFIX
        }
    
    @classmethod
    def get_ai_config(cls):
        """
        Retourne la configuration IA
        """
        return {
            'whisper': {
                'model': cls.WHISPER_MODEL,
                'language': cls.WHISPER_LANGUAGE,
                'device': cls.WHISPER_DEVICE,
                'batch_size': cls.WHISPER_BATCH_SIZE
            },
            'piper': {
                'model_path': cls.PIPER_MODEL_PATH,
                'config_path': cls.PIPER_CONFIG_PATH,
                'device': cls.PIPER_DEVICE,
                'speed': cls.PIPER_SPEED
            },
            'ollama': {
                'host': cls.OLLAMA_HOST,
                'model': cls.OLLAMA_MODEL,
                'temperature': cls.OLLAMA_TEMPERATURE,
                'max_tokens': cls.OLLAMA_MAX_TOKENS,
                'timeout': cls.OLLAMA_TIMEOUT
            }
        }

# Configuration de développement
class DevelopmentConfig(Config):
    DEBUG = True
    ENVIRONMENT = 'development'
    LOG_LEVEL = 'DEBUG'

# Configuration de test
class TestingConfig(Config):
    TESTING = True
    ENVIRONMENT = 'testing'
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

# Configuration de production
class ProductionConfig(Config):
    DEBUG = False
    ENVIRONMENT = 'production'
    LOG_LEVEL = 'WARNING'

# Dictionnaire des configurations
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': Config
} 