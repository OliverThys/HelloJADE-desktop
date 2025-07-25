#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HelloJADE v1.0 - Module IA
Gestion complète de l'intelligence artificielle
- Whisper (STT) : Transcription audio
- Piper (TTS) : Synthèse vocale  
- Ollama (LLM) : Analyse et génération de contenu médical
"""

import os
import json
import logging
import asyncio
import subprocess
import tempfile
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path
import requests
import torch
import torchaudio
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
import whisper
from pydub import AudioSegment
import numpy as np
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
import threading
import time

from .database import get_db, AITranscription, AIAnalysis, MedicalRecord
from .monitoring import record_ai_operation, record_ai_duration

logger = logging.getLogger(__name__)

@dataclass
class TranscriptionResult:
    """Résultat de transcription Whisper"""
    text: str
    confidence: float
    language: str
    segments: List[Dict]
    duration: float
    processing_time: float
    model_used: str

@dataclass
class AnalysisResult:
    """Résultat d'analyse Ollama"""
    summary: str
    key_points: List[str]
    sentiment: str
    urgency_level: str
    medical_notes: str
    recommendations: List[str]
    confidence: float
    processing_time: float
    model_used: str

@dataclass
class TTSResult:
    """Résultat de synthèse vocale Piper"""
    audio_path: str
    duration: float
    text_length: int
    quality_score: float
    processing_time: float
    voice_used: str

class WhisperManager:
    """Gestionnaire Whisper pour la reconnaissance vocale"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model_name = config.get('model_name', 'base')
        self.language = config.get('language', 'fr')
        self.task = config.get('task', 'transcribe')
        self.max_workers = config.get('max_workers', 2)
        self._load_model()
    
    def _load_model(self):
        """Charge le modèle Whisper"""
        try:
            logger.info(f"Chargement du modèle Whisper: {self.model_name}")
            self.model = whisper.load_model(self.model_name, device=self.device)
            logger.info(f"Modèle Whisper chargé sur {self.device}")
        except Exception as e:
            logger.error(f"Erreur lors du chargement du modèle Whisper: {str(e)}")
            raise
    
    def transcribe_audio(self, audio_path: str) -> TranscriptionResult:
        """
        Transcrit un fichier audio en texte
        """
        try:
            start_time = time.time()
            
            if not os.path.exists(audio_path):
                raise FileNotFoundError(f"Fichier audio non trouvé: {audio_path}")
            
            # Charger l'audio
            audio = whisper.load_audio(audio_path)
            duration = len(audio) / 16000  # Whisper utilise 16kHz
            
            # Transcription
            result = self.model.transcribe(
                audio,
                language=self.language,
                task=self.task,
                verbose=False,
                word_timestamps=True
            )
            
            processing_time = time.time() - start_time
            
            # Calculer la confiance moyenne
            segments = result.get('segments', [])
            if segments:
                confidence = np.mean([segment.get('avg_logprob', 0) for segment in segments])
            else:
                confidence = 0.0
            
            transcription = TranscriptionResult(
                text=result['text'].strip(),
                confidence=confidence,
                language=result.get('language', self.language),
                segments=segments,
                duration=duration,
                processing_time=processing_time,
                model_used=self.model_name
            )
            
            # Métriques
            record_ai_operation('whisper', 'transcribe', 'success')
            record_ai_duration('whisper', 'transcribe', processing_time)
            
            logger.info(f"Transcription terminée: {len(transcription.text)} caractères, "
                       f"confiance: {confidence:.2f}, durée: {processing_time:.2f}s")
            
            return transcription
            
        except Exception as e:
            logger.error(f"Erreur lors de la transcription: {str(e)}")
            record_ai_operation('whisper', 'transcribe', 'error')
            raise
    
    def transcribe_batch(self, audio_paths: List[str]) -> List[TranscriptionResult]:
        """Transcrit plusieurs fichiers audio en parallèle"""
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            results = list(executor.map(self.transcribe_audio, audio_paths))
        return results

class PiperManager:
    """Gestionnaire Piper pour la synthèse vocale"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.model_path = config.get('model_path')
        self.config_path = config.get('config_path')
        self.output_dir = config.get('output_dir', 'temp/tts')
        self.voice = config.get('voice', 'fr_FR-m-ailabs_low')
        self.sample_rate = config.get('sample_rate', 22050)
        self.executable = config.get('executable', 'piper')
        
        # Créer le répertoire de sortie
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Vérifier que les modèles sont disponibles
        if not self._check_models():
            raise ValueError("Modèles Piper non trouvés")
    
    def _check_models(self) -> bool:
        """Vérifie que les modèles Piper sont disponibles"""
        if not self.model_path or not os.path.exists(self.model_path):
            logger.warning(f"Modèle Piper non trouvé: {self.model_path}")
            return False
        
        if not self.config_path or not os.path.exists(self.config_path):
            logger.warning(f"Configuration Piper non trouvée: {self.config_path}")
            return False
        
        return True
    
    def synthesize_speech(self, text: str, output_filename: str = None) -> TTSResult:
        """
        Synthétise du texte en parole
        """
        try:
            start_time = time.time()
            
            if not output_filename:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_filename = f"tts_{timestamp}.wav"
            
            output_path = os.path.join(self.output_dir, output_filename)
            
            # Préparer le texte
            text = self._preprocess_text(text)
            
            # Commande Piper
            cmd = [
                self.executable,
                '--model', self.model_path,
                '--config', self.config_path,
                '--output_file', output_path
            ]
            
            # Exécuter la synthèse
            process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            stdout, stderr = process.communicate(input=text)
            
            if process.returncode != 0:
                raise RuntimeError(f"Erreur Piper: {stderr}")
            
            # Vérifier que le fichier a été créé
            if not os.path.exists(output_path):
                raise RuntimeError("Fichier audio non généré")
            
            # Calculer la durée
            audio = AudioSegment.from_wav(output_path)
            duration = len(audio) / 1000.0  # en secondes
            
            processing_time = time.time() - start_time
            
            result = TTSResult(
                audio_path=output_path,
                duration=duration,
                text_length=len(text),
                quality_score=min(1.0, len(text) / 100),  # Score basique
                processing_time=processing_time,
                voice_used=self.voice
            )
            
            # Métriques
            record_ai_operation('piper', 'synthesize', 'success')
            record_ai_duration('piper', 'synthesize', processing_time)
            
            logger.info(f"Synthèse vocale terminée: {len(text)} caractères, "
                       f"durée: {duration:.2f}s, temps: {processing_time:.2f}s")
            
            return result
            
        except Exception as e:
            logger.error(f"Erreur lors de la synthèse vocale: {str(e)}")
            record_ai_operation('piper', 'synthesize', 'error')
            raise
    
    def _preprocess_text(self, text: str) -> str:
        """Préprocesse le texte pour la synthèse"""
        # Nettoyer le texte
        text = text.strip()
        
        # Remplacer les abréviations médicales
        medical_abbreviations = {
            'Dr.': 'Docteur',
            'Mme.': 'Madame',
            'M.': 'Monsieur',
            'etc.': 'et cetera',
            'vs.': 'versus',
            'i.e.': 'c\'est-à-dire',
            'e.g.': 'par exemple',
            'J+1': 'jour plus un',
            'J+2': 'jour plus deux',
            'J+3': 'jour plus trois'
        }
        
        for abbr, full in medical_abbreviations.items():
            text = text.replace(abbr, full)
        
        return text
    
    def synthesize_batch(self, texts: List[str]) -> List[TTSResult]:
        """Synthétise plusieurs textes en parallèle"""
        results = []
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [executor.submit(self.synthesize_speech, text) for text in texts]
            for future in futures:
                results.append(future.result())
        return results

class OllamaManager:
    """Gestionnaire Ollama pour l'analyse LLM local"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.base_url = config.get('base_url', 'http://localhost:11434')
        self.model_name = config.get('model_name', 'llama2')
        self.max_tokens = config.get('max_tokens', 2048)
        self.temperature = config.get('temperature', 0.7)
        self.timeout = config.get('timeout', 30)
        
        # Vérifier la connexion
        self._check_connection()
    
    def _check_connection(self):
        """Vérifie la connexion à Ollama"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code != 200:
                raise ConnectionError("Impossible de se connecter à Ollama")
            
            models = response.json().get('models', [])
            model_names = [model['name'] for model in models]
            
            if self.model_name not in model_names:
                logger.warning(f"Modèle {self.model_name} non trouvé. Modèles disponibles: {model_names}")
                
        except Exception as e:
            logger.error(f"Erreur de connexion à Ollama: {str(e)}")
            raise
    
    def analyze_transcription(self, transcription: str, patient_context: Dict = None) -> AnalysisResult:
        """
        Analyse une transcription avec contexte patient
        """
        try:
            start_time = time.time()
            
            # Construire le prompt
            prompt = self._build_analysis_prompt(transcription, patient_context)
            
            # Appel à Ollama
            response = self._call_ollama(prompt)
            
            # Parser la réponse
            analysis = self._parse_analysis_response(response)
            
            processing_time = time.time() - start_time
            
            result = AnalysisResult(
                summary=analysis.get('summary', ''),
                key_points=analysis.get('key_points', []),
                sentiment=analysis.get('sentiment', 'neutral'),
                urgency_level=analysis.get('urgency_level', 'normal'),
                medical_notes=analysis.get('medical_notes', ''),
                recommendations=analysis.get('recommendations', []),
                confidence=analysis.get('confidence', 0.8),
                processing_time=processing_time,
                model_used=self.model_name
            )
            
            # Métriques
            record_ai_operation('ollama', 'analyze', 'success')
            record_ai_duration('ollama', 'analyze', processing_time)
            
            logger.info(f"Analyse IA terminée: {len(result.summary)} caractères, "
                       f"niveau urgence: {result.urgency_level}, temps: {processing_time:.2f}s")
            
            return result
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse IA: {str(e)}")
            record_ai_operation('ollama', 'analyze', 'error')
            raise
    
    def _build_analysis_prompt(self, transcription: str, patient_context: Dict = None) -> str:
        """Construit le prompt pour l'analyse"""
        prompt = f"""
Tu es un assistant médical spécialisé dans l'analyse d'appels post-hospitalisation.
Analyse la transcription suivante et fournis un résumé structuré.

TRANSCRIPTION:
{transcription}

"""
        
        if patient_context:
            prompt += f"""
CONTEXTE PATIENT:
- Nom: {patient_context.get('name', 'Non spécifié')}
- Âge: {patient_context.get('age', 'Non spécifié')}
- Diagnostic principal: {patient_context.get('diagnosis', 'Non spécifié')}
- Médicaments actuels: {patient_context.get('medications', 'Non spécifié')}
- Allergies: {patient_context.get('allergies', 'Aucune connue')}

"""
        
        prompt += """
Tâches à effectuer:
1. Résumé principal (2-3 phrases)
2. Points clés (liste à puces)
3. Sentiment du patient (positif/neutre/négatif)
4. Niveau d'urgence (faible/normal/élevé/critique)
5. Notes médicales importantes
6. Recommandations pour le suivi
7. Score de confiance (0-1)

Réponds au format JSON:
{
  "summary": "résumé principal",
  "key_points": ["point 1", "point 2", "point 3"],
  "sentiment": "positif/neutre/négatif",
  "urgency_level": "faible/normal/élevé/critique",
  "medical_notes": "notes médicales importantes",
  "recommendations": ["recommandation 1", "recommandation 2"],
  "confidence": 0.85
}
"""
        
        return prompt
    
    def _call_ollama(self, prompt: str) -> str:
        """Appelle l'API Ollama"""
        try:
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": self.max_tokens,
                    "temperature": self.temperature
                }
            }
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=self.timeout
            )
            
            if response.status_code != 200:
                raise RuntimeError(f"Erreur API Ollama: {response.text}")
            
            result = response.json()
            return result.get('response', '')
            
        except Exception as e:
            logger.error(f"Erreur lors de l'appel Ollama: {str(e)}")
            raise
    
    def _parse_analysis_response(self, response: str) -> Dict:
        """Parse la réponse JSON d'Ollama"""
        try:
            # Essayer de trouver du JSON dans la réponse
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                raise ValueError("Aucun JSON trouvé dans la réponse")
            
            json_str = response[start_idx:end_idx]
            return json.loads(json_str)
            
        except json.JSONDecodeError as e:
            logger.warning(f"Erreur de parsing JSON: {str(e)}")
            # Retourner une analyse basique
            return {
                "summary": response[:200] + "..." if len(response) > 200 else response,
                "key_points": [],
                "sentiment": "neutre",
                "urgency_level": "normal",
                "medical_notes": "",
                "recommendations": [],
                "confidence": 0.5
            }
    
    def generate_medical_summary(self, patient_data: Dict, call_history: List[Dict]) -> str:
        """Génère un résumé médical complet"""
        try:
            prompt = f"""
Génère un résumé médical structuré pour un patient post-hospitalisation.

DONNÉES PATIENT:
{json.dumps(patient_data, indent=2, ensure_ascii=False)}

HISTORIQUE DES APPELS:
{json.dumps(call_history, indent=2, ensure_ascii=False)}

Génère un résumé médical professionnel incluant:
- Évolution clinique
- Points d'attention
- Recommandations
- Suivi nécessaire

Format: Texte structuré avec sections claires.
"""
            
            response = self._call_ollama(prompt)
            return response.strip()
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération du résumé médical: {str(e)}")
            raise

class AIManager:
    """Gestionnaire principal IA orchestrant Whisper, Piper et Ollama"""
    
    def __init__(self, app=None):
        self.app = app
        self.whisper_manager = None
        self.piper_manager = None
        self.ollama_manager = None
        self.is_initialized = False
        
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialise le gestionnaire IA avec l'application Flask"""
        self.app = app
        
        # Charger la configuration
        config = app.config.get('AI_CONFIG', {})
        
        try:
            # Initialiser les gestionnaires
            if config.get('whisper', {}).get('enabled', True):
                self.whisper_manager = WhisperManager(config.get('whisper', {}))
            
            if config.get('piper', {}).get('enabled', True):
                self.piper_manager = PiperManager(config.get('piper', {}))
            
            if config.get('ollama', {}).get('enabled', True):
                self.ollama_manager = OllamaManager(config.get('ollama', {}))
            
            self.is_initialized = True
            logger.info("Gestionnaire IA initialisé avec succès")
            
        except Exception as e:
            logger.error(f"Erreur lors de l'initialisation du gestionnaire IA: {str(e)}")
            self.is_initialized = False
    
    def process_call_recording(self, audio_path: str, call_id: int, patient_context: Dict = None) -> Dict:
        """
        Traite un enregistrement d'appel complet
        Transcription -> Analyse -> Synthèse -> Sauvegarde DB
        """
        try:
            if not self.is_initialized:
                raise RuntimeError("Gestionnaire IA non initialisé")
            
            results = {
                'transcription': None,
                'analysis': None,
                'tts_summary': None,
                'processing_time': 0,
                'success': False,
                'call_id': call_id
            }
            
            start_time = time.time()
            
            # 1. Transcription
            if self.whisper_manager:
                logger.info(f"Début transcription: {audio_path}")
                transcription = self.whisper_manager.transcribe_audio(audio_path)
                results['transcription'] = transcription
                
                # 2. Analyse IA
                if self.ollama_manager and transcription.text:
                    logger.info("Début analyse IA")
                    analysis = self.ollama_manager.analyze_transcription(
                        transcription.text, patient_context
                    )
                    results['analysis'] = analysis
                    
                    # 3. Synthèse vocale du résumé
                    if self.piper_manager and analysis.summary:
                        logger.info("Début synthèse vocale")
                        tts_result = self.piper_manager.synthesize_speech(analysis.summary)
                        results['tts_summary'] = tts_result
                    
                    # 4. Sauvegarde en base de données
                    self._save_ai_results(call_id, transcription, analysis)
            
            results['processing_time'] = time.time() - start_time
            results['success'] = True
            
            logger.info(f"Traitement IA terminé: {results['processing_time']:.2f}s")
            return results
            
        except Exception as e:
            logger.error(f"Erreur lors du traitement IA: {str(e)}")
            results['error'] = str(e)
            return results
    
    def _save_ai_results(self, call_id: int, transcription: TranscriptionResult, analysis: AnalysisResult):
        """Sauvegarde les résultats IA en base de données"""
        try:
            db = get_db()
            
            # Sauvegarde transcription
            ai_transcription = AITranscription(
                call_id=call_id,
                text=transcription.text,
                confidence=transcription.confidence,
                language=transcription.language,
                duration=transcription.duration,
                segments=json.dumps(transcription.segments),
                model_used=transcription.model_used,
                processing_time=transcription.processing_time
            )
            db.add(ai_transcription)
            
            # Sauvegarde analyse
            ai_analysis = AIAnalysis(
                call_id=call_id,
                summary=analysis.summary,
                sentiment=analysis.sentiment,
                urgency_level=analysis.urgency_level,
                medical_notes=analysis.medical_notes,
                recommendations=json.dumps(analysis.recommendations),
                confidence=analysis.confidence,
                model_used=analysis.model_used,
                processing_time=analysis.processing_time
            )
            db.add(ai_analysis)
            
            # Créer un dossier médical si urgence élevée
            if analysis.urgency_level in ['élevé', 'critique']:
                medical_record = MedicalRecord(
                    patient_id=call_id,  # À adapter selon la structure
                    record_type='ai_alert',
                    title=f"Alerte IA - {analysis.urgency_level}",
                    content=analysis.medical_notes,
                    severity=analysis.urgency_level,
                    ai_generated=True,
                    created_by_user_id=1  # Système
                )
                db.add(medical_record)
            
            db.commit()
            logger.info(f"Résultats IA sauvegardés pour l'appel {call_id}")
            
        except Exception as e:
            logger.error(f"Erreur lors de la sauvegarde des résultats IA: {str(e)}")
            db.rollback()
    
    def generate_tts_message(self, text: str, output_filename: str = None) -> TTSResult:
        """Génère un message audio à partir de texte"""
        if not self.is_initialized or not self.piper_manager:
            raise RuntimeError("Piper non initialisé")
        
        return self.piper_manager.synthesize_speech(text, output_filename)
    
    def get_health_status(self) -> Dict:
        """Retourne le statut de santé des services IA"""
        status = {
            'whisper': {'enabled': False, 'status': 'disabled'},
            'piper': {'enabled': False, 'status': 'disabled'},
            'ollama': {'enabled': False, 'status': 'disabled'},
            'overall': 'healthy'
        }
        
        try:
            if self.whisper_manager:
                status['whisper'] = {
                    'enabled': True,
                    'status': 'healthy',
                    'model': self.whisper_manager.model_name,
                    'device': self.whisper_manager.device
                }
            
            if self.piper_manager:
                status['piper'] = {
                    'enabled': True,
                    'status': 'healthy',
                    'model': self.piper_manager.model_path,
                    'voice': self.piper_manager.voice
                }
            
            if self.ollama_manager:
                status['ollama'] = {
                    'enabled': True,
                    'status': 'healthy',
                    'model': self.ollama_manager.model_name,
                    'base_url': self.ollama_manager.base_url
                }
            
            # Vérifier si au moins un service est actif
            active_services = sum(1 for service in status.values() 
                                if isinstance(service, dict) and service.get('enabled'))
            
            if active_services == 0:
                status['overall'] = 'unhealthy'
            
        except Exception as e:
            logger.error(f"Erreur lors de la vérification du statut IA: {str(e)}")
            status['overall'] = 'error'
        
        return status
    
    def cleanup_temp_files(self):
        """Nettoie les fichiers temporaires"""
        try:
            if self.piper_manager and os.path.exists(self.piper_manager.output_dir):
                for file in os.listdir(self.piper_manager.output_dir):
                    file_path = os.path.join(self.piper_manager.output_dir, file)
                    if os.path.isfile(file_path):
                        # Supprimer les fichiers de plus de 24h
                        if time.time() - os.path.getmtime(file_path) > 86400:
                            os.remove(file_path)
                            logger.debug(f"Fichier temporaire supprimé: {file_path}")
        except Exception as e:
            logger.error(f"Erreur lors du nettoyage des fichiers temporaires: {str(e)}")

# Instance globale
ai_manager = AIManager() 