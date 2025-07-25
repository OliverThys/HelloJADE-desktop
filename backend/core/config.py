"""
HelloJADE v1.0 - Configuration centralisée
Gestion des variables d'environnement et configuration de l'application
"""

import os
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Chargement des variables d'environnement
load_dotenv()


class Config:
    """Configuration de base pour l'application HelloJADE"""
    
    # Informations de base
    APP_NAME = "HelloJADE"
    VERSION = "1.0.0"
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    TESTING = os.getenv("TESTING", "False").lower() == "true"
    
    # Clés secrètes
    SECRET_KEY = os.getenv("HELLOJADE_SECRET_KEY", "dev-secret-key-change-in-production")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-key-change-in-production")
    
    # Base de données Oracle
    ORACLE_HOST = os.getenv("ORACLE_HOST", "localhost")
    ORACLE_PORT = int(os.getenv("ORACLE_PORT", "1521"))
    ORACLE_SERVICE = os.getenv("ORACLE_SERVICE", "XE")
    ORACLE_USER = os.getenv("ORACLE_USER", "hellojade")
    ORACLE_PASSWORD = os.getenv("ORACLE_PASSWORD", "password")
    
    # URL de connexion Oracle
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        """URL de connexion à la base de données Oracle"""
        return (
            f"oracle+cx_oracle://{self.ORACLE_USER}:{self.ORACLE_PASSWORD}"
            f"@{self.ORACLE_HOST}:{self.ORACLE_PORT}/?service_name={self.ORACLE_SERVICE}"
        )
    
    # Configuration SQLAlchemy
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": int(os.getenv("DB_POOL_SIZE", "10")),
        "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "3600")),
        "pool_pre_ping": True,
        "echo": DEBUG
    }
    
    # Configuration JWT
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv("JWT_ACCESS_EXPIRES", "3600"))  # 1 heure
    JWT_REFRESH_TOKEN_EXPIRES = int(os.getenv("JWT_REFRESH_EXPIRES", "86400"))  # 24 heures
    JWT_ERROR_MESSAGE_KEY = "message"
    
    # Configuration LDAP
    LDAP_ENABLED = os.getenv("LDAP_ENABLED", "True").lower() == "true"
    LDAP_SERVER = os.getenv("LDAP_SERVER", "ldap.epicura.be")
    LDAP_PORT = int(os.getenv("LDAP_PORT", "389"))
    LDAP_BASE_DN = os.getenv("LDAP_BASE_DN", "dc=epicura,dc=be")
    LDAP_BIND_DN = os.getenv("LDAP_BIND_DN", "cn=hellojade,ou=services,dc=epicura,dc=be")
    LDAP_BIND_PASSWORD = os.getenv("LDAP_BIND_PASSWORD", "")
    LDAP_USER_SEARCH_BASE = os.getenv("LDAP_USER_SEARCH_BASE", "ou=users,dc=epicura,dc=be")
    LDAP_USER_SEARCH_FILTER = os.getenv("LDAP_USER_SEARCH_FILTER", "(uid={})")
    LDAP_GROUP_SEARCH_BASE = os.getenv("LDAP_GROUP_SEARCH_BASE", "ou=groups,dc=epicura,dc=be")
    LDAP_GROUP_SEARCH_FILTER = os.getenv("LDAP_GROUP_SEARCH_FILTER", "(member={})")
    
    # Configuration Redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB = int(os.getenv("REDIS_DB", "0"))
    REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
    
    # Configuration IA
    AI_ENABLED = os.getenv("AI_ENABLED", "True").lower() == "true"
    WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")
    PIPER_MODEL_PATH = os.getenv("PIPER_MODEL_PATH", "./ai/models/piper/fr_FR-amy-medium.onnx")
    OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama2")
    
    # Configuration téléphonie
    TELEPHONY_ENABLED = os.getenv("TELEPHONY_ENABLED", "True").lower() == "true"
    ASTERISK_HOST = os.getenv("ASTERISK_HOST", "localhost")
    ASTERISK_PORT = int(os.getenv("ASTERISK_PORT", "5038"))
    ASTERISK_USERNAME = os.getenv("ASTERISK_USERNAME", "hellojade")
    ASTERISK_PASSWORD = os.getenv("ASTERISK_PASSWORD", "password")
    ZADARMA_API_KEY = os.getenv("ZADARMA_API_KEY", "")
    ZADARMA_SECRET_KEY = os.getenv("ZADARMA_SECRET_KEY", "")
    
    # Configuration monitoring
    MONITORING_ENABLED = os.getenv("MONITORING_ENABLED", "True").lower() == "true"
    PROMETHEUS_MULTIPROC_DIR = os.getenv("PROMETHEUS_MULTIPROC_DIR", "/tmp")
    GRAFANA_URL = os.getenv("GRAFANA_URL", "http://localhost:3000")
    GRAFANA_USERNAME = os.getenv("GRAFANA_USERNAME", "admin")
    GRAFANA_PASSWORD = os.getenv("GRAFANA_PASSWORD", "hellojade123")
    
    # Configuration logs
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT = os.getenv("LOG_FORMAT", "json")
    LOG_FILE = os.getenv("LOG_FILE", "logs/hellojade.log")
    LOG_MAX_SIZE = int(os.getenv("LOG_MAX_SIZE", "10485760"))  # 10MB
    LOG_BACKUP_COUNT = int(os.getenv("LOG_BACKUP_COUNT", "5"))
    
    # Configuration fichiers
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", "16777216"))  # 16MB
    ALLOWED_EXTENSIONS = {"wav", "mp3", "ogg", "flac", "m4a"}
    
    # Configuration sécurité
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:1420,http://127.0.0.1:1420").split(",")
    RATE_LIMIT_DEFAULT = os.getenv("RATE_LIMIT_DEFAULT", "200 per day, 50 per hour")
    RATE_LIMIT_STORAGE_URL = os.getenv("RATE_LIMIT_STORAGE_URL", "redis://localhost:6379")
    
    # Configuration pagination
    DEFAULT_PAGE_SIZE = int(os.getenv("DEFAULT_PAGE_SIZE", "20"))
    MAX_PAGE_SIZE = int(os.getenv("MAX_PAGE_SIZE", "100"))
    
    @classmethod
    def init_app(cls, app):
        """Initialisation de la configuration pour l'application Flask"""
        
        # Création des répertoires nécessaires
        Path(cls.UPLOAD_FOLDER).mkdir(exist_ok=True)
        Path("logs").mkdir(exist_ok=True)
        Path("cache").mkdir(exist_ok=True)
        
        # Configuration du logging
        logging.basicConfig(
            level=getattr(logging, cls.LOG_LEVEL),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(cls.LOG_FILE),
                logging.StreamHandler()
            ]
        )
        
        # Validation de la configuration
        cls.validate_config()
    
    @classmethod
    def validate_config(cls):
        """Validation de la configuration"""
        errors = []
        
        # Vérification des variables obligatoires
        if not cls.SECRET_KEY or cls.SECRET_KEY == "dev-secret-key-change-in-production":
            errors.append("SECRET_KEY doit être définie en production")
        
        if not cls.JWT_SECRET_KEY or cls.JWT_SECRET_KEY == "jwt-secret-key-change-in-production":
            errors.append("JWT_SECRET_KEY doit être définie en production")
        
        # Vérification de la base de données
        if not all([cls.ORACLE_HOST, cls.ORACLE_USER, cls.ORACLE_PASSWORD]):
            errors.append("Configuration Oracle incomplète")
        
        # Vérification LDAP
        if cls.LDAP_ENABLED and not all([cls.LDAP_SERVER, cls.LDAP_BASE_DN]):
            errors.append("Configuration LDAP incomplète")
        
        # Affichage des erreurs
        if errors:
            logging.error("Erreurs de configuration détectées:")
            for error in errors:
                logging.error(f"  - {error}")
            
            if cls.ENVIRONMENT == "production":
                raise ValueError("Configuration invalide en production")
            else:
                logging.warning("Configuration en mode développement - certaines erreurs sont ignorées")


class DevelopmentConfig(Config):
    """Configuration pour le développement"""
    DEBUG = True
    TESTING = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 5,
        "pool_recycle": 3600,
        "pool_pre_ping": True,
        "echo": True
    }


class TestingConfig(Config):
    """Configuration pour les tests"""
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_ACCESS_TOKEN_EXPIRES = 300  # 5 minutes pour les tests
    LDAP_ENABLED = False
    AI_ENABLED = False
    TELEPHONY_ENABLED = False


class ProductionConfig(Config):
    """Configuration pour la production"""
    DEBUG = False
    TESTING = False
    
    # Configuration plus stricte pour la production
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 20,
        "pool_recycle": 3600,
        "pool_pre_ping": True,
        "echo": False,
        "connect_args": {
            "encoding": "UTF-8",
            "nencoding": "UTF-8"
        }
    }
    
    # Logs plus détaillés en production
    LOG_LEVEL = "INFO"
    LOG_FORMAT = "json"


# Dictionnaire des configurations disponibles
config = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig
}


def get_config(config_name: Optional[str] = None) -> Config:
    """
    Récupération de la configuration selon l'environnement
    
    Args:
        config_name: Nom de la configuration à utiliser
        
    Returns:
        Config: Instance de configuration
    """
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "default")
    
    return config.get(config_name, config["default"]) 