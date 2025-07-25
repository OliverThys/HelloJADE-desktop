#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HelloJADE v1.0 - Script d'intégration Asterisk
Gestion des appels automatiques et enregistrements
"""

import os
import sys
import json
import logging
import requests
from datetime import datetime, timezone
from typing import Dict, List, Optional
import pyst2
from pyst2 import Manager

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/hellojade/asterisk.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class AsteriskManager:
    """Gestionnaire Asterisk pour HelloJADE"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.manager = None
        self.api_url = config.get('api_url', 'http://localhost:5000/api')
        self.api_token = config.get('api_token')
        self._connect()
    
    def _connect(self):
        """Connexion à Asterisk AMI"""
        try:
            self.manager = Manager(
                host=self.config.get('host', 'localhost'),
                port=self.config.get('port', 5038),
                username=self.config.get('username', 'hellojade'),
                secret=self.config.get('password', 'hellojade123')
            )
            logger.info("Connexion Asterisk AMI établie")
        except Exception as e:
            logger.error(f"Erreur de connexion Asterisk: {str(e)}")
            raise
    
    def originate_call(self, call_id: str, phone_number: str, context: str = 'hellojade') -> bool:
        """
        Lance un appel sortant
        """
        try:
            # Préparer les variables pour l'appel
            variables = {
                'CALL_ID': call_id,
                'PHONE_NUMBER': phone_number,
                'CONTEXT': context
            }
            
            # Lancer l'appel
            response = self.manager.originate(
                channel=f'SIP/{phone_number}',
                context=context,
                exten=phone_number,
                priority=1,
                variables=variables,
                timeout=30000
            )
            
            if response.response == 'Success':
                logger.info(f"Appel lancé: {call_id} vers {phone_number}")
                return True
            else:
                logger.error(f"Échec du lancement d'appel: {response.message}")
                return False
                
        except Exception as e:
            logger.error(f"Erreur lors du lancement d'appel: {str(e)}")
            return False
    
    def hangup_call(self, call_id: str) -> bool:
        """
        Termine un appel
        """
        try:
            # Récupérer les informations de l'appel
            call_info = self.get_call_info(call_id)
            if not call_info:
                return False
            
            # Terminer l'appel
            response = self.manager.hangup(call_info['channel'])
            
            if response.response == 'Success':
                logger.info(f"Appel terminé: {call_id}")
                return True
            else:
                logger.error(f"Échec de la terminaison d'appel: {response.message}")
                return False
                
        except Exception as e:
            logger.error(f"Erreur lors de la terminaison d'appel: {str(e)}")
            return False
    
    def get_call_info(self, call_id: str) -> Optional[Dict]:
        """
        Récupère les informations d'un appel
        """
        try:
            # Lister les canaux actifs
            response = self.manager.status()
            
            for channel in response:
                if channel.get('variable', {}).get('CALL_ID') == call_id:
                    return {
                        'channel': channel.get('channel'),
                        'state': channel.get('state'),
                        'duration': channel.get('duration'),
                        'call_id': call_id
                    }
            
            return None
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des infos d'appel: {str(e)}")
            return None
    
    def get_active_calls(self) -> List[Dict]:
        """
        Récupère la liste des appels actifs
        """
        try:
            response = self.manager.status()
            active_calls = []
            
            for channel in response:
                call_id = channel.get('variable', {}).get('CALL_ID')
                if call_id:
                    active_calls.append({
                        'channel': channel.get('channel'),
                        'call_id': call_id,
                        'state': channel.get('state'),
                        'duration': channel.get('duration')
                    })
            
            return active_calls
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des appels actifs: {str(e)}")
            return []
    
    def process_recording(self, recording_path: str, call_id: str):
        """
        Traite un enregistrement d'appel
        """
        try:
            if not os.path.exists(recording_path):
                logger.error(f"Fichier d'enregistrement non trouvé: {recording_path}")
                return False
            
            # Envoyer l'enregistrement au backend pour traitement IA
            with open(recording_path, 'rb') as f:
                files = {'audio_file': f}
                data = {'call_id': call_id}
                
                response = requests.post(
                    f"{self.api_url}/ai/process-call",
                    files=files,
                    data=data,
                    headers={'Authorization': f'Bearer {self.api_token}'},
                    timeout=300
                )
            
            if response.status_code == 200:
                logger.info(f"Enregistrement traité avec succès: {call_id}")
                return True
            else:
                logger.error(f"Erreur lors du traitement de l'enregistrement: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Erreur lors du traitement de l'enregistrement: {str(e)}")
            return False

class CallScheduler:
    """Planificateur d'appels automatiques"""
    
    def __init__(self, asterisk_manager: AsteriskManager, config: Dict):
        self.asterisk = asterisk_manager
        self.config = config
        self.api_url = config.get('api_url', 'http://localhost:5000/api')
        self.api_token = config.get('api_token')
    
    def get_scheduled_calls(self) -> List[Dict]:
        """
        Récupère les appels programmés
        """
        try:
            response = requests.get(
                f"{self.api_url}/calls/scheduled",
                headers={'Authorization': f'Bearer {self.api_token}'},
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json().get('data', [])
            else:
                logger.error(f"Erreur lors de la récupération des appels programmés: {response.text}")
                return []
                
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des appels programmés: {str(e)}")
            return []
    
    def execute_scheduled_calls(self):
        """
        Exécute les appels programmés
        """
        try:
            scheduled_calls = self.get_scheduled_calls()
            
            for call in scheduled_calls:
                if self._should_execute_call(call):
                    logger.info(f"Exécution de l'appel programmé: {call['id']}")
                    
                    # Lancer l'appel
                    success = self.asterisk.originate_call(
                        call['call_id'],
                        call['phone_number']
                    )
                    
                    if success:
                        # Marquer l'appel comme en cours
                        self._update_call_status(call['id'], 'in_progress')
                    else:
                        # Marquer l'appel comme échoué
                        self._update_call_status(call['id'], 'failed')
                        
        except Exception as e:
            logger.error(f"Erreur lors de l'exécution des appels programmés: {str(e)}")
    
    def _should_execute_call(self, call: Dict) -> bool:
        """
        Vérifie si un appel doit être exécuté
        """
        scheduled_time = datetime.fromisoformat(call['scheduled_time'].replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        
        # Exécuter si l'heure programmée est passée et que l'appel est en statut 'scheduled'
        return (scheduled_time <= now and call['status'] == 'scheduled')
    
    def _update_call_status(self, call_id: int, status: str):
        """
        Met à jour le statut d'un appel
        """
        try:
            response = requests.put(
                f"{self.api_url}/calls/{call_id}",
                json={'status': status},
                headers={'Authorization': f'Bearer {self.api_token}'},
                timeout=30
            )
            
            if response.status_code != 200:
                logger.error(f"Erreur lors de la mise à jour du statut: {response.text}")
                
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour du statut: {str(e)}")

def main():
    """Fonction principale"""
    try:
        # Configuration
        config = {
            'host': os.getenv('ASTERISK_HOST', 'localhost'),
            'port': int(os.getenv('ASTERISK_PORT', 5038)),
            'username': os.getenv('ASTERISK_USER', 'hellojade'),
            'password': os.getenv('ASTERISK_PASSWORD', 'hellojade123'),
            'api_url': os.getenv('HELLOJADE_API_URL', 'http://localhost:5000/api'),
            'api_token': os.getenv('HELLOJADE_API_TOKEN')
        }
        
        # Initialisation du gestionnaire Asterisk
        asterisk_manager = AsteriskManager(config)
        
        # Initialisation du planificateur
        scheduler = CallScheduler(asterisk_manager, config)
        
        # Exécution des appels programmés
        scheduler.execute_scheduled_calls()
        
        logger.info("Script Asterisk terminé avec succès")
        
    except Exception as e:
        logger.error(f"Erreur dans le script Asterisk: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 