#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HelloJADE v1.0 - Module de téléphonie
Gestion des appels via Asterisk et intégration Zadarma
"""

import logging
import requests
import hashlib
import hmac
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
import json

from .database import get_db, Call, Patient
from .monitoring import record_call, record_call_duration

logger = logging.getLogger(__name__)

class AsteriskManager:
    """
    Gestionnaire pour les interactions avec Asterisk
    """
    
    def __init__(self, app=None):
        self.app = app
        self.config = {}
        self.session = requests.Session()
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialise la configuration Asterisk"""
        self.config = {
            'host': app.config.get('ASTERISK_HOST', 'localhost'),
            'port': app.config.get('ASTERISK_PORT', 5038),
            'username': app.config.get('ASTERISK_USER', 'hellojade'),
            'password': app.config.get('ASTERISK_PASSWORD', ''),
            'context': app.config.get('ASTERISK_CONTEXT', 'hellojade'),
            'extension_prefix': app.config.get('ASTERISK_EXTENSION_PREFIX', '8')
        }
        
        # Configuration de la session HTTP
        self.session.auth = (self.config['username'], self.config['password'])
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'HelloJADE/1.0'
        })
        
        logger.info("Gestionnaire Asterisk initialisé")
    
    def test_connection(self) -> bool:
        """Teste la connexion à Asterisk"""
        try:
            url = f"http://{self.config['host']}:{self.config['port']}/asterisk/rawman"
            response = self.session.get(url, params={'command': 'core show version'})
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Erreur de connexion Asterisk: {str(e)}")
            return False
    
    def originate_call(self, call_id: str, phone_number: str, context: str = None) -> bool:
        """
        Lance un appel sortant via Asterisk
        """
        try:
            if not context:
                context = self.config['context']
            
            # Construction de la commande AMI
            command = {
                'Action': 'Originate',
                'Channel': f"SIP/{phone_number}",
                'Context': context,
                'Exten': self.config['extension_prefix'],
                'Priority': 1,
                'Callerid': f"HelloJADE <{phone_number}>",
                'Variable': f"CALLID={call_id}",
                'Async': 'yes'
            }
            
            url = f"http://{self.config['host']}:{self.config['port']}/asterisk/rawman"
            response = self.session.post(url, data=command)
            
            if response.status_code == 200:
                logger.info(f"Appel lancé: {call_id} vers {phone_number}")
                return True
            else:
                logger.error(f"Erreur lors du lancement de l'appel: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Erreur lors du lancement de l'appel {call_id}: {str(e)}")
            return False
    
    def hangup_call(self, channel: str) -> bool:
        """
        Termine un appel en cours
        """
        try:
            command = {
                'Action': 'Hangup',
                'Channel': channel
            }
            
            url = f"http://{self.config['host']}:{self.config['port']}/asterisk/rawman"
            response = self.session.post(url, data=command)
            
            return response.status_code == 200
            
        except Exception as e:
            logger.error(f"Erreur lors de la terminaison de l'appel: {str(e)}")
            return False
    
    def get_channel_status(self, channel: str) -> Dict:
        """
        Récupère le statut d'un canal
        """
        try:
            command = {
                'Action': 'Status',
                'Channel': channel
            }
            
            url = f"http://{self.config['host']}:{self.config['port']}/asterisk/rawman"
            response = self.session.get(url, params=command)
            
            if response.status_code == 200:
                return self._parse_ami_response(response.text)
            else:
                return {}
                
        except Exception as e:
            logger.error(f"Erreur lors de la récupération du statut: {str(e)}")
            return {}
    
    def _parse_ami_response(self, response_text: str) -> Dict:
        """Parse une réponse AMI"""
        result = {}
        current_event = {}
        
        for line in response_text.split('\n'):
            if line.strip():
                if ':' in line:
                    key, value = line.split(':', 1)
                    current_event[key.strip()] = value.strip()
                elif line.strip() == '':
                    if current_event:
                        result.update(current_event)
                        current_event = {}
        
        if current_event:
            result.update(current_event)
        
        return result

class ZadarmaManager:
    """
    Gestionnaire pour l'intégration Zadarma
    """
    
    def __init__(self, app=None):
        self.app = app
        self.config = {}
        self.session = requests.Session()
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialise la configuration Zadarma"""
        self.config = {
            'api_key': app.config.get('ZADARMA_API_KEY', ''),
            'api_secret': app.config.get('ZADARMA_API_SECRET', ''),
            'webhook_url': app.config.get('ZADARMA_WEBHOOK_URL', ''),
            'call_timeout': app.config.get('ZADARMA_CALL_TIMEOUT', 60),
            'retry_attempts': app.config.get('ZADARMA_RETRY_ATTEMPTS', 3)
        }
        
        logger.info("Gestionnaire Zadarma initialisé")
    
    def make_call(self, call_id: str, phone_number: str, callback_url: str = None) -> Dict:
        """
        Lance un appel via l'API Zadarma
        """
        try:
            if not self.config['api_key'] or not self.config['api_secret']:
                raise ValueError("Configuration Zadarma incomplète")
            
            # Préparation des paramètres
            params = {
                'from': self.config.get('from_number', ''),
                'to': phone_number,
                'call_id': call_id,
                'timeout': self.config['call_timeout']
            }
            
            if callback_url:
                params['callback_url'] = callback_url
            
            # Signature de la requête
            signature = self._generate_signature(params)
            params['signature'] = signature
            
            # Appel à l'API Zadarma
            url = "https://api.zadarma.com/v1/request/callback/"
            response = self.session.post(url, data=params)
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Appel Zadarma lancé: {call_id} vers {phone_number}")
                return result
            else:
                logger.error(f"Erreur API Zadarma: {response.text}")
                return {'error': response.text}
                
        except Exception as e:
            logger.error(f"Erreur lors de l'appel Zadarma {call_id}: {str(e)}")
            return {'error': str(e)}
    
    def get_call_status(self, call_id: str) -> Dict:
        """
        Récupère le statut d'un appel
        """
        try:
            params = {
                'call_id': call_id
            }
            
            signature = self._generate_signature(params)
            params['signature'] = signature
            
            url = "https://api.zadarma.com/v1/request/callback/"
            response = self.session.get(url, params=params)
            
            if response.status_code == 200:
                return response.json()
            else:
                return {'error': response.text}
                
        except Exception as e:
            logger.error(f"Erreur lors de la récupération du statut: {str(e)}")
            return {'error': str(e)}
    
    def _generate_signature(self, params: Dict) -> str:
        """Génère la signature pour l'API Zadarma"""
        # Tri des paramètres par clé
        sorted_params = sorted(params.items())
        
        # Construction de la chaîne à signer
        sign_string = '&'.join([f"{key}={value}" for key, value in sorted_params])
        
        # Ajout de la clé secrète
        sign_string += self.config['api_secret']
        
        # Génération du hash MD5
        return hashlib.md5(sign_string.encode('utf-8')).hexdigest()
    
    def verify_webhook_signature(self, data: Dict, signature: str) -> bool:
        """Vérifie la signature d'un webhook Zadarma"""
        try:
            # Construction de la chaîne à vérifier
            sorted_data = sorted(data.items())
            sign_string = '&'.join([f"{key}={value}" for key, value in sorted_data])
            sign_string += self.config['api_secret']
            
            expected_signature = hashlib.md5(sign_string.encode('utf-8')).hexdigest()
            return signature == expected_signature
            
        except Exception as e:
            logger.error(f"Erreur lors de la vérification de signature: {str(e)}")
            return False

class TelephonyManager:
    """
    Gestionnaire principal de téléphonie
    """
    
    def __init__(self, app=None):
        self.app = app
        self.asterisk = None
        self.zadarma = None
        self.active_calls = {}
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialise les gestionnaires de téléphonie"""
        self.asterisk = AsteriskManager(app)
        self.zadarma = ZadarmaManager(app)
        
        logger.info("Gestionnaire de téléphonie initialisé")
    
    def start_call(self, call_id: int, patient_id: int) -> Tuple[bool, str]:
        """
        Démarre un appel pour un patient
        """
        try:
            db = get_db()
            
            # Récupération de l'appel et du patient
            call = db.query(Call).filter(Call.id == call_id).first()
            patient = db.query(Patient).filter(Patient.id == patient_id).first()
            
            if not call or not patient:
                return False, "Appel ou patient non trouvé"
            
            if call.status != 'scheduled':
                return False, f"Appel en statut {call.status}"
            
            # Mise à jour du statut
            call.status = 'in_progress'
            call.start_time = datetime.now(timezone.utc)
            call.updated_at = datetime.now(timezone.utc)
            
            # Lancement de l'appel selon la configuration
            success = False
            if self.asterisk and self.asterisk.test_connection():
                success = self.asterisk.originate_call(
                    call.call_id, 
                    patient.phone_number
                )
            elif self.zadarma and self.zadarma.config['api_key']:
                result = self.zadarma.make_call(
                    call.call_id,
                    patient.phone_number,
                    f"{self.zadarma.config['webhook_url']}/api/webhooks/zadarma"
                )
                success = 'error' not in result
            else:
                return False, "Aucun service de téléphonie configuré"
            
            if success:
                # Enregistrement de l'appel actif
                self.active_calls[call.call_id] = {
                    'call_id': call.id,
                    'patient_id': patient_id,
                    'start_time': call.start_time,
                    'provider': 'asterisk' if self.asterisk else 'zadarma'
                }
                
                db.commit()
                
                # Métriques
                record_call(call.status, call.direction, call.call_type)
                
                logger.info(f"Appel démarré: {call.call_id} vers {patient.phone_number}")
                return True, "Appel démarré avec succès"
            else:
                # Restauration du statut en cas d'échec
                call.status = 'scheduled'
                call.start_time = None
                db.commit()
                return False, "Échec du lancement de l'appel"
                
        except Exception as e:
            logger.error(f"Erreur lors du démarrage de l'appel {call_id}: {str(e)}")
            return False, f"Erreur: {str(e)}"
    
    def end_call(self, call_id: int) -> Tuple[bool, str]:
        """
        Termine un appel
        """
        try:
            db = get_db()
            
            call = db.query(Call).filter(Call.id == call_id).first()
            if not call:
                return False, "Appel non trouvé"
            
            if call.status != 'in_progress':
                return False, f"Appel en statut {call.status}"
            
            # Calcul de la durée
            end_time = datetime.now(timezone.utc)
            duration = int((end_time - call.start_time).total_seconds()) if call.start_time else 0
            
            # Mise à jour du statut
            call.status = 'completed'
            call.end_time = end_time
            call.duration = duration
            call.updated_at = datetime.now(timezone.utc)
            
            # Suppression de l'appel actif
            if call.call_id in self.active_calls:
                del self.active_calls[call.call_id]
            
            db.commit()
            
            # Métriques
            record_call(call.status, call.direction, call.call_type)
            record_call_duration(call.status, duration)
            
            logger.info(f"Appel terminé: {call.call_id} - Durée: {duration}s")
            return True, "Appel terminé avec succès"
            
        except Exception as e:
            logger.error(f"Erreur lors de la fin de l'appel {call_id}: {str(e)}")
            return False, f"Erreur: {str(e)}"
    
    def cancel_call(self, call_id: int) -> Tuple[bool, str]:
        """
        Annule un appel
        """
        try:
            db = get_db()
            
            call = db.query(Call).filter(Call.id == call_id).first()
            if not call:
                return False, "Appel non trouvé"
            
            if call.status in ['completed', 'failed']:
                return False, f"Appel en statut {call.status}"
            
            # Annulation de l'appel
            call.status = 'cancelled'
            call.updated_at = datetime.now(timezone.utc)
            
            # Suppression de l'appel actif si nécessaire
            if call.call_id in self.active_calls:
                del self.active_calls[call.call_id]
            
            db.commit()
            
            # Métriques
            record_call(call.status, call.direction, call.call_type)
            
            logger.info(f"Appel annulé: {call.call_id}")
            return True, "Appel annulé avec succès"
            
        except Exception as e:
            logger.error(f"Erreur lors de l'annulation de l'appel {call_id}: {str(e)}")
            return False, f"Erreur: {str(e)}"
    
    def get_active_calls(self) -> List[Dict]:
        """Récupère la liste des appels actifs"""
        return list(self.active_calls.values())
    
    def process_webhook(self, provider: str, data: Dict) -> bool:
        """
        Traite les webhooks des fournisseurs de téléphonie
        """
        try:
            if provider == 'zadarma':
                return self._process_zadarma_webhook(data)
            elif provider == 'asterisk':
                return self._process_asterisk_webhook(data)
            else:
                logger.warning(f"Fournisseur de webhook non supporté: {provider}")
                return False
                
        except Exception as e:
            logger.error(f"Erreur lors du traitement du webhook {provider}: {str(e)}")
            return False
    
    def _process_zadarma_webhook(self, data: Dict) -> bool:
        """Traite un webhook Zadarma"""
        try:
            # Vérification de la signature
            signature = data.get('signature', '')
            if not self.zadarma.verify_webhook_signature(data, signature):
                logger.warning("Signature webhook Zadarma invalide")
                return False
            
            call_id = data.get('call_id')
            event = data.get('event')
            
            if not call_id:
                return False
            
            db = get_db()
            call = db.query(Call).filter(Call.call_id == call_id).first()
            
            if not call:
                logger.warning(f"Appel non trouvé pour le webhook: {call_id}")
                return False
            
            # Traitement selon le type d'événement
            if event == 'call_started':
                call.status = 'in_progress'
                call.start_time = datetime.now(timezone.utc)
            elif event == 'call_ended':
                call.status = 'completed'
                call.end_time = datetime.now(timezone.utc)
                if call.start_time:
                    call.duration = int((call.end_time - call.start_time).total_seconds())
            elif event == 'call_failed':
                call.status = 'failed'
            
            call.updated_at = datetime.now(timezone.utc)
            db.commit()
            
            logger.info(f"Webhook Zadarma traité: {call_id} - {event}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors du traitement du webhook Zadarma: {str(e)}")
            return False
    
    def _process_asterisk_webhook(self, data: Dict) -> bool:
        """Traite un webhook Asterisk"""
        try:
            # Implémentation spécifique pour Asterisk
            # À adapter selon la configuration Asterisk
            logger.info(f"Webhook Asterisk reçu: {data}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors du traitement du webhook Asterisk: {str(e)}")
            return False 