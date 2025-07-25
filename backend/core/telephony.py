"""
HelloJADE v1.0 - Module de téléphonie
Gestion des appels avec Asterisk et Zadarma
"""

import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from pathlib import Path

import pyst2
import requests
from flask import current_app

from core.database import db, Call, log_audit
from core.logging import get_logger, telephony_logger
from core.monitoring import track_call_operation

logger = get_logger('telephony')


class AsteriskManager:
    """Gestionnaire pour Asterisk"""
    
    def __init__(self, app):
        self.app = app
        self.config = app.config
        self.manager = None
        self.logger = get_logger('asterisk')
    
    def connect(self) -> bool:
        """Établit la connexion avec Asterisk"""
        try:
            self.manager = pyst2.Manager(
                host=self.config['ASTERISK_HOST'],
                port=self.config['ASTERISK_PORT'],
                username=self.config['ASTERISK_USERNAME'],
                secret=self.config['ASTERISK_PASSWORD']
            )
            self.manager.connect()
            self.logger.info("Connexion Asterisk établie")
            return True
        except Exception as e:
            self.logger.error(f"Erreur de connexion Asterisk: {e}")
            return False
    
    def disconnect(self):
        """Ferme la connexion Asterisk"""
        if self.manager:
            try:
                self.manager.close()
                self.logger.info("Connexion Asterisk fermée")
            except Exception as e:
                self.logger.error(f"Erreur lors de la fermeture Asterisk: {e}")
    
    def originate_call(self, call_id: str, phone_number: str, context: str = "hellojade") -> bool:
        """Initie un appel sortant"""
        try:
            if not self.manager:
                if not self.connect():
                    return False
            
            # Création de l'extension unique
            extension = f"8{call_id[-6:]}"
            
            # Origination de l'appel
            result = self.manager.originate(
                channel=f"SIP/{phone_number}",
                exten=extension,
                context=context,
                priority=1,
                timeout=30000,
                callerid=f"HelloJADE <{extension}>",
                variables={
                    'CALLID': call_id,
                    'PHONENUMBER': phone_number
                }
            )
            
            self.logger.info(f"Appel initié: {call_id} vers {phone_number}")
            return True
            
        except Exception as e:
            self.logger.error(f"Erreur lors de l'initiation d'appel: {e}")
            return False
    
    def hangup_call(self, channel: str) -> bool:
        """Raccroche un appel"""
        try:
            if not self.manager:
                return False
            
            result = self.manager.hangup(channel)
            self.logger.info(f"Appel raccroché: {channel}")
            return True
            
        except Exception as e:
            self.logger.error(f"Erreur lors du raccrochage: {e}")
            return False
    
    def get_channel_status(self, channel: str) -> Optional[str]:
        """Récupère le statut d'un canal"""
        try:
            if not self.manager:
                return None
            
            result = self.manager.status(channel)
            return result.get('Status', 'Unknown')
            
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération du statut: {e}")
            return None
    
    def get_active_calls(self) -> List[Dict[str, Any]]:
        """Récupère la liste des appels actifs"""
        try:
            if not self.manager:
                return []
            
            result = self.manager.status()
            active_calls = []
            
            for channel_info in result:
                if channel_info.get('Status') == 'Up':
                    active_calls.append({
                        'channel': channel_info.get('Channel'),
                        'caller_id': channel_info.get('CallerID'),
                        'duration': channel_info.get('Duration'),
                        'context': channel_info.get('Context')
                    })
            
            return active_calls
            
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération des appels actifs: {e}")
            return []


class ZadarmaManager:
    """Gestionnaire pour Zadarma"""
    
    def __init__(self, app):
        self.app = app
        self.config = app.config
        self.api_key = self.config['ZADARMA_API_KEY']
        self.secret_key = self.config['ZADARMA_SECRET_KEY']
        self.base_url = "https://api.zadarma.com"
        self.logger = get_logger('zadarma')
    
    def _make_request(self, endpoint: str, method: str = 'GET', data: Dict = None) -> Optional[Dict]:
        """Effectue une requête vers l'API Zadarma"""
        try:
            url = f"{self.base_url}{endpoint}"
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            if method == 'GET':
                response = requests.get(url, headers=headers, params=data)
            else:
                response = requests.post(url, headers=headers, json=data)
            
            if response.status_code == 200:
                return response.json()
            else:
                self.logger.error(f"Erreur API Zadarma: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            self.logger.error(f"Erreur requête Zadarma: {e}")
            return None
    
    def make_call(self, call_id: str, phone_number: str, user_id: int) -> Optional[str]:
        """Effectue un appel via Zadarma"""
        try:
            data = {
                'from': self.config.get('ZADARMA_FROM_NUMBER', ''),
                'to': phone_number,
                'call_id': call_id,
                'user_id': user_id
            }
            
            result = self._make_request('/v1/request/callback/', 'POST', data)
            
            if result and result.get('status') == 'success':
                call_uuid = result.get('call_id')
                self.logger.info(f"Appel Zadarma initié: {call_id} -> {call_uuid}")
                return call_uuid
            else:
                self.logger.error(f"Échec initiation appel Zadarma: {result}")
                return None
                
        except Exception as e:
            self.logger.error(f"Erreur lors de l'appel Zadarma: {e}")
            return None
    
    def hangup_call(self, call_uuid: str) -> bool:
        """Raccroche un appel Zadarma"""
        try:
            data = {'call_id': call_uuid}
            result = self._make_request('/v1/request/callback/hangup/', 'POST', data)
            
            if result and result.get('status') == 'success':
                self.logger.info(f"Appel Zadarma raccroché: {call_uuid}")
                return True
            else:
                self.logger.error(f"Échec raccrochage Zadarma: {result}")
                return False
                
        except Exception as e:
            self.logger.error(f"Erreur lors du raccrochage Zadarma: {e}")
            return False
    
    def get_call_status(self, call_uuid: str) -> Optional[str]:
        """Récupère le statut d'un appel Zadarma"""
        try:
            data = {'call_id': call_uuid}
            result = self._make_request('/v1/request/callback/status/', 'GET', data)
            
            if result:
                return result.get('status', 'unknown')
            return None
            
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération du statut Zadarma: {e}")
            return None
    
    def get_call_history(self, date_from: str = None, date_to: str = None) -> List[Dict[str, Any]]:
        """Récupère l'historique des appels"""
        try:
            data = {}
            if date_from:
                data['date_from'] = date_from
            if date_to:
                data['date_to'] = date_to
            
            result = self._make_request('/v1/request/callback/history/', 'GET', data)
            
            if result and result.get('status') == 'success':
                return result.get('calls', [])
            return []
            
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération de l'historique: {e}")
            return []


class CallManager:
    """Gestionnaire principal des appels"""
    
    def __init__(self, app):
        self.app = app
        self.asterisk = AsteriskManager(app)
        self.zadarma = ZadarmaManager(app)
        self.logger = get_logger('call_manager')
        
        # Configuration
        self.primary_provider = app.config.get('PRIMARY_TELEPHONY_PROVIDER', 'asterisk')
        self.recording_path = Path(app.config.get('UPLOAD_FOLDER', 'uploads')) / 'recordings'
        self.recording_path.mkdir(parents=True, exist_ok=True)
    
    @track_call_operation('initiate')
    def initiate_call(self, call_id: str, phone_number: str, user_id: int) -> bool:
        """Initie un appel téléphonique"""
        try:
            # Mise à jour du statut de l'appel
            call = Call.query.filter_by(call_id=call_id).first()
            if not call:
                self.logger.error(f"Appel non trouvé: {call_id}")
                return False
            
            call.status = 'in_progress'
            call.started_at = datetime.now(timezone.utc)
            call.attempt_count += 1
            call.last_attempt_at = datetime.now(timezone.utc)
            
            # Sélection du fournisseur
            if self.primary_provider == 'asterisk':
                success = self.asterisk.originate_call(call_id, phone_number)
            else:
                success = self.zadarma.make_call(call_id, phone_number, user_id) is not None
            
            if success:
                call.status = 'in_progress'
                telephony_logger.log_call_start(call_id, phone_number, user_id)
                
                # Log d'audit
                log_audit(
                    user_id=user_id,
                    action='CALL_STARTED',
                    resource_type='call',
                    resource_id=call_id,
                    ip_address=None
                )
            else:
                call.status = 'failed'
                call.failure_reason = f"Échec initiation via {self.primary_provider}"
                telephony_logger.log_call_error(call_id, "Échec initiation", phone_number)
            
            db.session.commit()
            return success
            
        except Exception as e:
            self.logger.error(f"Erreur lors de l'initiation d'appel: {e}")
            return False
    
    @track_call_operation('end')
    def end_call(self, call_id: str, duration: int = None) -> bool:
        """Termine un appel téléphonique"""
        try:
            call = Call.query.filter_by(call_id=call_id).first()
            if not call:
                self.logger.error(f"Appel non trouvé: {call_id}")
                return False
            
            call.status = 'completed'
            call.ended_at = datetime.now(timezone.utc)
            if duration:
                call.actual_duration = duration
            
            # Raccrochage via le fournisseur approprié
            if self.primary_provider == 'asterisk':
                # Récupération du canal depuis la base de données ou les logs
                pass
            else:
                # Raccrochage Zadarma si nécessaire
                pass
            
            telephony_logger.log_call_end(call_id, duration or 0, 'completed')
            
            # Log d'audit
            log_audit(
                user_id=call.user_id,
                action='CALL_ENDED',
                resource_type='call',
                resource_id=call_id,
                ip_address=None
            )
            
            db.session.commit()
            return True
            
        except Exception as e:
            self.logger.error(f"Erreur lors de la terminaison d'appel: {e}")
            return False
    
    def schedule_call(self, patient_id: int, user_id: int, scheduled_at: datetime, 
                     phone_number: str, call_type: str = 'follow_up') -> Optional[str]:
        """Planifie un appel"""
        try:
            # Génération d'un ID d'appel unique
            call_id = f"CALL_{uuid.uuid4().hex[:8].upper()}"
            
            # Création de l'appel en base
            call = Call(
                call_id=call_id,
                patient_id=patient_id,
                user_id=user_id,
                scheduled_at=scheduled_at,
                phone_number=phone_number,
                call_type=call_type,
                status='scheduled'
            )
            
            db.session.add(call)
            db.session.commit()
            
            self.logger.info(f"Appel planifié: {call_id} pour {scheduled_at}")
            
            # Log d'audit
            log_audit(
                user_id=user_id,
                action='CALL_SCHEDULED',
                resource_type='call',
                resource_id=call_id,
                ip_address=None
            )
            
            return call_id
            
        except Exception as e:
            self.logger.error(f"Erreur lors de la planification d'appel: {e}")
            return None
    
    def retry_failed_call(self, call_id: str) -> bool:
        """Retente un appel échoué"""
        try:
            call = Call.query.filter_by(call_id=call_id).first()
            if not call:
                self.logger.error(f"Appel non trouvé: {call_id}")
                return False
            
            if not call.can_retry():
                self.logger.warning(f"Appel {call_id} ne peut pas être retenté")
                return False
            
            # Retry de l'appel
            return self.initiate_call(call_id, call.phone_number, call.user_id)
            
        except Exception as e:
            self.logger.error(f"Erreur lors du retry d'appel: {e}")
            return False
    
    def get_overdue_calls(self) -> List[Call]:
        """Récupère les appels en retard"""
        try:
            overdue_calls = Call.query.filter(
                Call.status == 'scheduled',
                Call.scheduled_at < datetime.now(timezone.utc)
            ).all()
            
            return overdue_calls
            
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération des appels en retard: {e}")
            return []
    
    def process_call_webhook(self, webhook_data: Dict[str, Any]) -> bool:
        """Traite un webhook d'appel"""
        try:
            call_id = webhook_data.get('call_id')
            event_type = webhook_data.get('event')
            
            if not call_id:
                self.logger.error("Webhook sans call_id")
                return False
            
            call = Call.query.filter_by(call_id=call_id).first()
            if not call:
                self.logger.error(f"Appel non trouvé pour webhook: {call_id}")
                return False
            
            # Traitement selon le type d'événement
            if event_type == 'call_started':
                call.status = 'in_progress'
                call.started_at = datetime.now(timezone.utc)
                
            elif event_type == 'call_answered':
                call.status = 'in_progress'
                
            elif event_type == 'call_ended':
                duration = webhook_data.get('duration', 0)
                call.status = 'completed'
                call.ended_at = datetime.now(timezone.utc)
                call.actual_duration = duration
                
            elif event_type == 'call_failed':
                call.status = 'failed'
                call.failure_reason = webhook_data.get('reason', 'Unknown error')
                call.ended_at = datetime.now(timezone.utc)
            
            # Sauvegarde de l'enregistrement si disponible
            if 'recording_url' in webhook_data:
                recording_path = self._download_recording(
                    webhook_data['recording_url'], 
                    call_id
                )
                if recording_path:
                    call.call_recording_path = str(recording_path)
            
            db.session.commit()
            
            self.logger.info(f"Webhook traité: {event_type} pour {call_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Erreur lors du traitement du webhook: {e}")
            return False
    
    def _download_recording(self, recording_url: str, call_id: str) -> Optional[Path]:
        """Télécharge un enregistrement d'appel"""
        try:
            response = requests.get(recording_url, timeout=30)
            if response.status_code == 200:
                recording_file = self.recording_path / f"{call_id}.wav"
                recording_file.write_bytes(response.content)
                self.logger.info(f"Enregistrement téléchargé: {recording_file}")
                return recording_file
            else:
                self.logger.error(f"Échec téléchargement enregistrement: {response.status_code}")
                return None
                
        except Exception as e:
            self.logger.error(f"Erreur lors du téléchargement de l'enregistrement: {e}")
            return None
    
    def get_call_statistics(self, user_id: int = None, date_from: datetime = None, 
                           date_to: datetime = None) -> Dict[str, Any]:
        """Récupère les statistiques d'appels"""
        try:
            query = Call.query
            
            if user_id:
                query = query.filter(Call.user_id == user_id)
            
            if date_from:
                query = query.filter(Call.created_at >= date_from)
            
            if date_to:
                query = query.filter(Call.created_at <= date_to)
            
            calls = query.all()
            
            stats = {
                'total_calls': len(calls),
                'completed_calls': len([c for c in calls if c.status == 'completed']),
                'failed_calls': len([c for c in calls if c.status == 'failed']),
                'scheduled_calls': len([c for c in calls if c.status == 'scheduled']),
                'average_duration': 0,
                'total_duration': 0
            }
            
            completed_calls = [c for c in calls if c.actual_duration]
            if completed_calls:
                stats['total_duration'] = sum(c.actual_duration for c in completed_calls)
                stats['average_duration'] = stats['total_duration'] / len(completed_calls)
            
            return stats
            
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération des statistiques: {e}")
            return {}


# Instance globale du gestionnaire d'appels
call_manager = None


def init_telephony(app):
    """Initialisation du système de téléphonie"""
    global call_manager
    call_manager = CallManager(app)
    logger.info("Système de téléphonie initialisé")


def get_call_manager() -> CallManager:
    """Récupère l'instance du gestionnaire d'appels"""
    return call_manager 