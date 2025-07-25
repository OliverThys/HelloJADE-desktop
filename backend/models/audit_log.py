"""
Modèle AuditLog pour l'audit trail HelloJADE
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from core.database import db

class AuditLog(db.Model):
    """Modèle pour l'audit trail des actions utilisateur"""
    
    __tablename__ = 'audit_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Relations
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    
    # Informations de l'action
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False, index=True)  # patient, call, user, etc.
    resource_id = Column(Integer, nullable=True, index=True)
    resource_path = Column(String(255), nullable=True)
    
    # Données de l'action
    old_values = Column(JSON, nullable=True)  # Valeurs avant modification
    new_values = Column(JSON, nullable=True)  # Valeurs après modification
    
    # Contexte de l'action
    ip_address = Column(String(45), nullable=True)  # IPv4 ou IPv6
    user_agent = Column(String(500), nullable=True)
    session_id = Column(String(100), nullable=True)
    
    # Métadonnées
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    
    # Relations
    user = relationship("User", back_populates="audit_logs")
    
    def __init__(self, action, resource_type, user_id=None, resource_id=None, 
                 resource_path=None, old_values=None, new_values=None, 
                 ip_address=None, user_agent=None, session_id=None):
        self.action = action
        self.resource_type = resource_type
        self.user_id = user_id
        self.resource_id = resource_id
        self.resource_path = resource_path
        self.old_values = old_values
        self.new_values = new_values
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.session_id = session_id
    
    def to_dict(self):
        """Convertit l'audit log en dictionnaire"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action': self.action,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'resource_path': self.resource_path,
            'old_values': self.old_values,
            'new_values': self.new_values,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'session_id': self.session_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<AuditLog {self.action} on {self.resource_type} by user {self.user_id}>' 