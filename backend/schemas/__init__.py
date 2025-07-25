"""
Schémas de validation Marshmallow pour HelloJADE
"""

from .user import UserSchema, UserCreateSchema, UserUpdateSchema
from .patient import PatientSchema, PatientCreateSchema, PatientUpdateSchema
from .call import CallSchema, CallCreateSchema, CallUpdateSchema
from .auth import LoginSchema, RefreshSchema

__all__ = [
    'UserSchema',
    'UserCreateSchema', 
    'UserUpdateSchema',
    'PatientSchema',
    'PatientCreateSchema',
    'PatientUpdateSchema',
    'CallSchema',
    'CallCreateSchema',
    'CallUpdateSchema',
    'LoginSchema',
    'RefreshSchema'
] 