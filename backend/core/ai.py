"""
HelloJADE v1.0 - Module d'intelligence artificielle
Intégration Whisper (transcription), Piper (synthèse) et Ollama (analyse)
"""

import logging
import time
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple
from pathlib import Path
import tempfile

import whisper
import piper
import torch
import torchaudio
import requests
from flask import current_app

from core.database import db, AITranscription, AIAnalysis, log_audit
from core.logging import get_logger, ai_logger
from core.monitoring import track_ai_operation

logger = get_logger('ai')


class WhisperManager:
    """Gestionnaire pour Whisper (transcription audio)"""
    
    def __init__(self, app):
        self.app = app
        self.config = app.config
        self.model = None
        self.logger = get_logger('whisper')
        self._load_model()
    
    def _load_model(self):
        """Charge le modèle Whisper"""
        try:
            model_name = self.config.get('WHISPER_MODEL', 'base')
            self.logger.info(f"Chargement du modèle Whisper: {model_name}")
            
            # Chargement du modèle avec configuration optimisée
            self.model = whisper.load_model(
                model_name,
                device=self.config.get('WHISPER_DEVICE', 'cpu'),
                download_root=self.config.get('AI_MODELS_PATH', './ai/models/whisper')
            )
            
            self.logger.info(f"Modèle Whisper chargé: {model_name}")
            
        except Exception as e:
            self.logger.error(f"Erreur lors du chargement du modèle Whisper: {e}")
            self.model = None
    
    @track_ai_operation('transcription', 'whisper')
    def transcribe_audio(self, audio_file_path: str, language: str = 'fr') -> Optional[Dict[str, Any]]:
        """
        Transcrit un fichier audio en texte
        
        Args:
            audio_file_path: Chemin vers le fichier audio
            language: Langue du fichier audio
            
        Returns:
            Dict avec transcription et métadonnées
        """
        if not self.model:
            self.logger.error("Modèle Whisper non chargé")
            return None
        
        try:
            start_time = time.time()
            
            # Options de transcription
            options = {
                'language': language,
                'task': 'transcribe',
                'fp16': False,  # Désactivé pour CPU
                'verbose': False
            }
            
            # Transcription
            result = self.model.transcribe(audio_file_path, **options)
            
            duration = time.time() - start_time
            
            # Préparation du résultat
            transcription_data = {
                'text': result['text'].strip(),
                'language': result['language'],
                'segments': result.get('segments', []),
                'confidence': self._calculate_confidence(result),
                'processing_time': duration,
                'model_used': self.config.get('WHISPER_MODEL', 'base')
            }
            
            self.logger.info(
                f"Transcription réussie: {len(transcription_data['text'])} caractères en {duration:.2f}s"
            )
            
            return transcription_data
            
        except Exception as e:
            self.logger.error(f"Erreur lors de la transcription: {e}")
            return None
    
    def _calculate_confidence(self, result: Dict) -> float:
        """Calcule le score de confiance moyen"""
        try:
            segments = result.get('segments', [])
            if not segments:
                return 0.0
            
            # Calcul de la moyenne des scores de confiance
            confidence_scores = []
            for segment in segments:
                if 'avg_logprob' in segment:
                    # Conversion du logprob en probabilité
                    confidence_scores.append(torch.exp(segment['avg_logprob']).item())
            
            if confidence_scores:
                return sum(confidence_scores) / len(confidence_scores)
            return 0.0
            
        except Exception as e:
            self.logger.warning(f"Erreur lors du calcul de confiance: {e}")
            return 0.0
    
    def transcribe_call_recording(self, call_id: str, recording_path: str) -> Optional[AITranscription]:
        """Transcrit l'enregistrement d'un appel et sauvegarde en base"""
        try:
            # Transcription
            result = self.transcribe_audio(recording_path)
            if not result:
                return None
            
            # Sauvegarde en base de données
            transcription = AITranscription(
                call_id=call_id,
                audio_file_path=recording_path,
                transcription_text=result['text'],
                confidence_score=result['confidence'],
                language=result['language'],
                processing_time=result['processing_time'],
                model_used=result['model_used'],
                status='completed'
            )
            
            db.session.add(transcription)
            db.session.commit()
            
            # Log d'audit
            log_audit(
                user_id=None,  # Système
                action='TRANSCRIPTION_CREATED',
                resource_type='ai_transcription',
                resource_id=str(transcription.id),
                ip_address=None
            )
            
            self.logger.info(f"Transcription sauvegardée pour l'appel {call_id}")
            return transcription
            
        except Exception as e:
            self.logger.error(f"Erreur lors de la transcription d'appel: {e}")
            return None


class PiperManager:
    """Gestionnaire pour Piper (synthèse vocale)"""
    
    def __init__(self, app):
        self.app = app
        self.config = app.config
        self.model = None
        self.logger = get_logger('piper')
        self._load_model()
    
    def _load_model(self):
        """Charge le modèle Piper"""
        try:
            model_path = self.config.get('PIPER_MODEL_PATH')
            if not model_path or not Path(model_path).exists():
                self.logger.error(f"Modèle Piper non trouvé: {model_path}")
                return
            
            self.logger.info(f"Chargement du modèle Piper: {model_path}")
            
            # Chargement du modèle
            self.model = piper.PiperVoice.load(
                model_path,
                config_path=model_path.replace('.onnx', '.onnx.json')
            )
            
            self.logger.info("Modèle Piper chargé avec succès")
            
        except Exception as e:
            self.logger.error(f"Erreur lors du chargement du modèle Piper: {e}")
            self.model = None
    
    @track_ai_operation('synthesis', 'piper')
    def synthesize_speech(self, text: str, output_path: str = None, 
                         speed: float = 1.0) -> Optional[str]:
        """
        Synthétise du texte en parole
        
        Args:
            text: Texte à synthétiser
            output_path: Chemin de sortie (optionnel)
            speed: Vitesse de lecture
            
        Returns:
            Chemin vers le fichier audio généré
        """
        if not self.model:
            self.logger.error("Modèle Piper non chargé")
            return None
        
        try:
            start_time = time.time()
            
            # Génération du chemin de sortie si non fourni
            if not output_path:
                output_path = tempfile.mktemp(suffix='.wav')
            
            # Synthèse vocale
            self.model.synthesize(text, output_path, speed=speed)
            
            duration = time.time() - start_time
            
            self.logger.info(
                f"Synthèse vocale réussie: {len(text)} caractères en {duration:.2f}s"
            )
            
            return output_path
            
        except Exception as e:
            self.logger.error(f"Erreur lors de la synthèse vocale: {e}")
            return None
    
    def create_reminder_audio(self, message: str, patient_name: str) -> Optional[str]:
        """Crée un message audio de rappel personnalisé"""
        try:
            # Personnalisation du message
            personalized_text = f"Bonjour {patient_name}, {message}"
            
            # Génération du fichier audio
            output_path = Path(self.config.get('UPLOAD_FOLDER', 'uploads')) / 'reminders'
            output_path.mkdir(parents=True, exist_ok=True)
            
            audio_file = output_path / f"reminder_{int(time.time())}.wav"
            
            result = self.synthesize_speech(personalized_text, str(audio_file))
            return result
            
        except Exception as e:
            self.logger.error(f"Erreur lors de la création du rappel audio: {e}")
            return None


class OllamaManager:
    """Gestionnaire pour Ollama (analyse et génération de texte)"""
    
    def __init__(self, app):
        self.app = app
        self.config = app.config
        self.base_url = self.config.get('OLLAMA_HOST', 'http://localhost:11434')
        self.default_model = self.config.get('OLLAMA_MODEL', 'llama2')
        self.logger = get_logger('ollama')
    
    def _make_request(self, endpoint: str, data: Dict = None) -> Optional[Dict]:
        """Effectue une requête vers l'API Ollama"""
        try:
            url = f"{self.base_url}{endpoint}"
            headers = {'Content-Type': 'application/json'}
            
            if data:
                response = requests.post(url, json=data, headers=headers, timeout=30)
            else:
                response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                return response.json()
            else:
                self.logger.error(f"Erreur API Ollama: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            self.logger.error(f"Erreur requête Ollama: {e}")
            return None
    
    def get_available_models(self) -> List[str]:
        """Récupère la liste des modèles disponibles"""
        try:
            result = self._make_request('/api/tags')
            if result and 'models' in result:
                return [model['name'] for model in result['models']]
            return []
            
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération des modèles: {e}")
            return []
    
    @track_ai_operation('analysis', 'ollama')
    def analyze_text(self, text: str, analysis_type: str = 'general', 
                    model: str = None) -> Optional[Dict[str, Any]]:
        """
        Analyse un texte avec Ollama
        
        Args:
            text: Texte à analyser
            analysis_type: Type d'analyse (sentiment, medical, compliance, etc.)
            model: Modèle à utiliser
            
        Returns:
            Résultat de l'analyse
        """
        try:
            if not model:
                model = self.default_model
            
            start_time = time.time()
            
            # Construction du prompt selon le type d'analyse
            prompt = self._build_analysis_prompt(text, analysis_type)
            
            # Requête vers Ollama
            data = {
                'model': model,
                'prompt': prompt,
                'stream': False,
                'options': {
                    'temperature': 0.7,
                    'top_p': 0.9,
                    'max_tokens': 1000
                }
            }
            
            result = self._make_request('/api/generate', data)
            
            if not result:
                return None
            
            duration = time.time() - start_time
            
            # Traitement de la réponse
            analysis_result = {
                'analysis_type': analysis_type,
                'input_text': text,
                'result': result.get('response', ''),
                'model_used': model,
                'processing_time': duration,
                'tokens_used': result.get('eval_count', 0)
            }
            
            self.logger.info(
                f"Analyse {analysis_type} réussie en {duration:.2f}s"
            )
            
            return analysis_result
            
        except Exception as e:
            self.logger.error(f"Erreur lors de l'analyse: {e}")
            return None
    
    def _build_analysis_prompt(self, text: str, analysis_type: str) -> str:
        """Construit le prompt pour l'analyse"""
        base_prompt = f"Analyse le texte suivant et fournis une réponse structurée en français:\n\n{text}\n\n"
        
        if analysis_type == 'sentiment':
            return base_prompt + """
            Analyse le sentiment et l'émotion exprimés dans ce texte.
            Réponds au format JSON avec:
            - sentiment: positif, négatif, neutre
            - emotion: joie, tristesse, colère, peur, surprise, dégoût
            - confidence: score de confiance (0-1)
            - keywords: mots-clés émotionnels
            """
        
        elif analysis_type == 'medical':
            return base_prompt + """
            Analyse ce texte d'un point de vue médical.
            Identifie:
            - Symptômes mentionnés
            - Médicaments cités
            - Niveau d'urgence (faible, moyen, élevé)
            - Recommandations
            Réponds au format JSON structuré.
            """
        
        elif analysis_type == 'compliance':
            return base_prompt + """
            Vérifie la conformité de ce texte aux réglementations médicales.
            Identifie:
            - Risques de conformité
            - Informations sensibles
            - Recommandations de sécurité
            Réponds au format JSON structuré.
            """
        
        else:
            return base_prompt + "Fournis une analyse générale du contenu au format JSON."
    
    def generate_summary(self, text: str, max_length: int = 200) -> Optional[str]:
        """Génère un résumé d'un texte"""
        try:
            prompt = f"""
            Résume le texte suivant en maximum {max_length} caractères:
            
            {text}
            
            Résumé:
            """
            
            data = {
                'model': self.default_model,
                'prompt': prompt,
                'stream': False,
                'options': {
                    'temperature': 0.3,
                    'max_tokens': 500
                }
            }
            
            result = self._make_request('/api/generate', data)
            
            if result:
                return result.get('response', '').strip()
            return None
            
        except Exception as e:
            self.logger.error(f"Erreur lors de la génération du résumé: {e}")
            return None
    
    def analyze_call_transcription(self, call_id: str, transcription_text: str) -> Optional[AIAnalysis]:
        """Analyse la transcription d'un appel et sauvegarde en base"""
        try:
            # Analyse multi-type
            analyses = {}
            
            # Analyse de sentiment
            sentiment_result = self.analyze_text(transcription_text, 'sentiment')
            if sentiment_result:
                analyses['sentiment'] = sentiment_result
            
            # Analyse médicale
            medical_result = self.analyze_text(transcription_text, 'medical')
            if medical_result:
                analyses['medical'] = medical_result
            
            # Analyse de conformité
            compliance_result = self.analyze_text(transcription_text, 'compliance')
            if compliance_result:
                analyses['compliance'] = compliance_result
            
            if not analyses:
                return None
            
            # Sauvegarde en base de données
            analysis = AIAnalysis(
                call_id=call_id,
                analysis_type='comprehensive',
                input_text=transcription_text,
                analysis_result=analyses,
                model_used=self.default_model,
                status='completed'
            )
            
            db.session.add(analysis)
            db.session.commit()
            
            # Log d'audit
            log_audit(
                user_id=None,  # Système
                action='ANALYSIS_CREATED',
                resource_type='ai_analysis',
                resource_id=str(analysis.id),
                ip_address=None
            )
            
            self.logger.info(f"Analyse sauvegardée pour l'appel {call_id}")
            return analysis
            
        except Exception as e:
            self.logger.error(f"Erreur lors de l'analyse d'appel: {e}")
            return None


class AIManager:
    """Gestionnaire principal de l'IA"""
    
    def __init__(self, app):
        self.app = app
        self.whisper = WhisperManager(app)
        self.piper = PiperManager(app)
        self.ollama = OllamaManager(app)
        self.logger = get_logger('ai_manager')
    
    def process_call_recording(self, call_id: str, recording_path: str) -> Tuple[Optional[AITranscription], Optional[AIAnalysis]]:
        """
        Traite complètement un enregistrement d'appel
        
        Args:
            call_id: ID de l'appel
            recording_path: Chemin vers l'enregistrement
            
        Returns:
            Tuple (transcription, analysis)
        """
        try:
            # Transcription
            transcription = self.whisper.transcribe_call_recording(call_id, recording_path)
            if not transcription:
                return None, None
            
            # Analyse de la transcription
            analysis = self.ollama.analyze_call_transcription(call_id, transcription.transcription_text)
            
            self.logger.info(f"Traitement IA complet pour l'appel {call_id}")
            return transcription, analysis
            
        except Exception as e:
            self.logger.error(f"Erreur lors du traitement IA de l'appel {call_id}: {e}")
            return None, None
    
    def create_personalized_message(self, patient_name: str, message_template: str, 
                                  context: Dict = None) -> Optional[str]:
        """Crée un message personnalisé avec synthèse vocale"""
        try:
            # Personnalisation du message
            personalized_text = message_template.format(
                patient_name=patient_name,
                **(context or {})
            )
            
            # Génération audio
            audio_path = self.piper.create_reminder_audio(personalized_text, patient_name)
            return audio_path
            
        except Exception as e:
            self.logger.error(f"Erreur lors de la création du message personnalisé: {e}")
            return None
    
    def get_ai_status(self) -> Dict[str, Any]:
        """Récupère le statut des services IA"""
        status = {
            'whisper': {
                'available': self.whisper.model is not None,
                'model': self.app.config.get('WHISPER_MODEL', 'base')
            },
            'piper': {
                'available': self.piper.model is not None,
                'model': self.app.config.get('PIPER_MODEL_PATH', 'N/A')
            },
            'ollama': {
                'available': len(self.ollama.get_available_models()) > 0,
                'models': self.ollama.get_available_models()
            }
        }
        
        return status
    
    def cleanup_old_files(self, max_age_days: int = 30):
        """Nettoie les anciens fichiers temporaires"""
        try:
            upload_path = Path(self.app.config.get('UPLOAD_FOLDER', 'uploads'))
            cutoff_time = datetime.now(timezone.utc).timestamp() - (max_age_days * 24 * 3600)
            
            cleaned_count = 0
            for file_path in upload_path.rglob('*.wav'):
                if file_path.stat().st_mtime < cutoff_time:
                    file_path.unlink()
                    cleaned_count += 1
            
            if cleaned_count > 0:
                self.logger.info(f"Nettoyage terminé: {cleaned_count} fichiers supprimés")
                
        except Exception as e:
            self.logger.error(f"Erreur lors du nettoyage: {e}")


# Instance globale du gestionnaire IA
ai_manager = None


def init_ai(app):
    """Initialisation du système d'IA"""
    global ai_manager
    ai_manager = AIManager(app)
    logger.info("Système d'IA initialisé")


def get_ai_manager() -> AIManager:
    """Récupère l'instance du gestionnaire IA"""
    return ai_manager 