"""
Utilitaires de validation pour HelloJADE
"""

import re
from typing import Optional

def validate_phone_number(phone: str) -> bool:
    """
    Valide un numéro de téléphone belge
    
    Args:
        phone: Numéro de téléphone à valider
        
    Returns:
        bool: True si le numéro est valide
    """
    if not phone:
        return False
    
    # Nettoyage du numéro
    phone = re.sub(r'[\s\-\(\)\.]', '', phone)
    
    # Formats acceptés pour la Belgique
    patterns = [
        r'^(\+32|0032|32)?(4[0-9]{8})$',  # Mobile
        r'^(\+32|0032|32)?([0-9]{1,2}[0-9]{7})$',  # Fixe
        r'^0([0-9]{1,2}[0-9]{7})$',  # Fixe avec 0
    ]
    
    for pattern in patterns:
        if re.match(pattern, phone):
            return True
    
    return False

def validate_medical_record_number(record_number: str) -> bool:
    """
    Valide un numéro de dossier médical
    
    Args:
        record_number: Numéro de dossier à valider
        
    Returns:
        bool: True si le numéro est valide
    """
    if not record_number:
        return False
    
    # Format: lettres et chiffres, 3-20 caractères
    pattern = r'^[A-Z0-9]{3,20}$'
    return bool(re.match(pattern, record_number.upper()))

def validate_email(email: str) -> bool:
    """
    Valide une adresse email
    
    Args:
        email: Email à valider
        
    Returns:
        bool: True si l'email est valide
    """
    if not email:
        return False
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_postal_code(postal_code: str) -> bool:
    """
    Valide un code postal belge
    
    Args:
        postal_code: Code postal à valider
        
    Returns:
        bool: True si le code postal est valide
    """
    if not postal_code:
        return False
    
    # Format belge: 4 chiffres
    pattern = r'^[0-9]{4}$'
    return bool(re.match(pattern, postal_code))

def sanitize_input(text: str, max_length: int = 1000) -> Optional[str]:
    """
    Nettoie et valide une entrée texte
    
    Args:
        text: Texte à nettoyer
        max_length: Longueur maximale autorisée
        
    Returns:
        str: Texte nettoyé ou None si invalide
    """
    if not text or not isinstance(text, str):
        return None
    
    # Suppression des caractères dangereux
    dangerous_chars = ['<', '>', '"', "'", '&', ';', '--', '/*', '*/']
    for char in dangerous_chars:
        text = text.replace(char, '')
    
    # Limitation de la longueur
    if len(text) > max_length:
        text = text[:max_length]
    
    # Suppression des espaces multiples
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text if text else None 