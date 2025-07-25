"""
Modèle SystemLog pour les logs système HelloJADE
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func

from core.database import db

class SystemLog(db.Model):
    """Modèle pour les logs système structurés"""
    
    __tablename__ = 'system_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Informations du log
    level = Column(String(10), nullable=False, index=True)  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    message = Column(Text, nullable=False)
    module = Column(String(100), nullable=True, index=True)  # Nom du module/component
    
    # Contexte utilisateur
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    
    # Données supplémentaires structurées
    additional_data = Column(JSON, nullable=True)
    
    # Contexte système
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    request_id = Column(String(100), nullable=True, index=True)  # Pour tracer les requêtes
    
    # Métadonnées
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    
    def __init__(self, level, message, module=None, user_id=None, additional_data=None,
                 ip_address=None, user_agent=None, request_id=None):
        self.level = level.upper()
        self.message = message
        self.module = module
        self.user_id = user_id
        self.additional_data = additional_data
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.request_id = request_id
    
    def to_dict(self):
        """Convertit le log système en dictionnaire"""
        return {
            'id': self.id,
            'level': self.level,
            'message': self.message,
            'module': self.module,
            'user_id': self.user_id,
            'additional_data': self.additional_data,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'request_id': self.request_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<SystemLog {self.level} - {self.message[:50]}...>' 