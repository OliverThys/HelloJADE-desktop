"""
Modèle User pour la gestion des utilisateurs HelloJADE
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash

from core.database import db

class User(db.Model):
    """Modèle utilisateur avec authentification LDAP et rôles RBAC"""
    
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # Pour les utilisateurs locaux
    role = Column(String(20), nullable=False, default='user')  # admin, doctor, nurse, secretary
    is_active = Column(Boolean, default=True, nullable=False)
    is_ldap_user = Column(Boolean, default=False, nullable=False)
    ldap_dn = Column(String(255), nullable=True)  # DN LDAP de l'utilisateur
    
    # Informations de session
    last_login = Column(DateTime, nullable=True)
    password_reset_required = Column(Boolean, default=False, nullable=False)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime, nullable=True)
    
    # Métadonnées
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(Integer, nullable=True)
    
    # Relations
    calls = relationship("Call", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    
    def __init__(self, username, email, role='user', is_ldap_user=False, ldap_dn=None):
        self.username = username
        self.email = email
        self.role = role
        self.is_ldap_user = is_ldap_user
        self.ldap_dn = ldap_dn
    
    def set_password(self, password):
        """Hash et définit le mot de passe"""
        self.password_hash = generate_password_hash(password)
        self.password_reset_required = False
    
    def check_password(self, password):
        """Vérifie le mot de passe"""
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)
    
    def is_admin(self):
        """Vérifie si l'utilisateur est administrateur"""
        return self.role == 'admin'
    
    def is_doctor(self):
        """Vérifie si l'utilisateur est médecin"""
        return self.role == 'doctor'
    
    def is_nurse(self):
        """Vérifie si l'utilisateur est infirmier"""
        return self.role == 'nurse'
    
    def is_secretary(self):
        """Vérifie si l'utilisateur est secrétaire"""
        return self.role == 'secretary'
    
    def has_permission(self, permission):
        """Vérifie si l'utilisateur a une permission spécifique"""
        permissions = {
            'admin': ['all'],
            'doctor': ['view_patients', 'edit_patients', 'view_calls', 'manage_calls'],
            'nurse': ['view_patients', 'edit_patients', 'view_calls'],
            'secretary': ['view_patients', 'view_calls', 'schedule_calls']
        }
        
        user_permissions = permissions.get(self.role, [])
        return 'all' in user_permissions or permission in user_permissions
    
    def increment_failed_login(self):
        """Incrémente le compteur d'échecs de connexion"""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            from datetime import datetime, timedelta
            self.locked_until = datetime.now() + timedelta(minutes=30)
    
    def reset_failed_login(self):
        """Réinitialise le compteur d'échecs de connexion"""
        self.failed_login_attempts = 0
        self.locked_until = None
    
    def is_locked(self):
        """Vérifie si le compte est verrouillé"""
        if not self.locked_until:
            return False
        from datetime import datetime
        return datetime.now() < self.locked_until
    
    def to_dict(self):
        """Convertit l'utilisateur en dictionnaire"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'is_ldap_user': self.is_ldap_user,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<User {self.username}>' 