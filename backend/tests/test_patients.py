"""
Tests unitaires pour la gestion des patients
"""

import pytest
from datetime import date, datetime, timedelta
from unittest.mock import patch, MagicMock

from models.patient import Patient
from services.patient_service import PatientService
from utils.validators import validate_phone_number, validate_medical_record_number

class TestPatientValidation:
    """Tests de validation des données patient"""
    
    def test_validate_phone_number_valid(self):
        """Test validation numéro de téléphone valide"""
        valid_numbers = [
            "0470123456",
            "+32470123456",
            "0032470123456",
            "32470123456",
            "02 123 45 67",
            "02-123-45-67"
        ]
        
        for number in valid_numbers:
            assert validate_phone_number(number) == True
    
    def test_validate_phone_number_invalid(self):
        """Test validation numéro de téléphone invalide"""
        invalid_numbers = [
            "123456789",
            "invalid",
            "047012345",  # Trop court
            "04701234567",  # Trop long
            "+33123456789"  # Format français
        ]
        
        for number in invalid_numbers:
            assert validate_phone_number(number) == False
    
    def test_validate_medical_record_number_valid(self):
        """Test validation numéro de dossier médical valide"""
        valid_numbers = [
            "ABC123",
            "123456",
            "PATIENT001",
            "MRN2024001"
        ]
        
        for number in valid_numbers:
            assert validate_medical_record_number(number) == True
    
    def test_validate_medical_record_number_invalid(self):
        """Test validation numéro de dossier médical invalide"""
        invalid_numbers = [
            "AB",  # Trop court
            "A" * 25,  # Trop long
            "ABC-123",  # Caractères spéciaux
            "abc123",  # Minuscules
            ""
        ]
        
        for number in invalid_numbers:
            assert validate_medical_record_number(number) == False

class TestPatientModel:
    """Tests du modèle Patient"""
    
    def test_patient_creation(self):
        """Test création d'un patient"""
        patient = Patient(
            first_name="Jean",
            last_name="Dupont",
            date_of_birth=date(1980, 1, 1),
            gender="M",
            phone_number="0470123456",
            medical_record_number="PAT001",
            created_by=1
        )
        
        assert patient.first_name == "Jean"
        assert patient.last_name == "Dupont"
        assert patient.full_name == "Jean Dupont"
        assert patient.age > 40  # Approximatif selon la date de test
        assert patient.is_active == True
        assert patient.follow_up_required == True
    
    def test_patient_age_calculation(self):
        """Test calcul de l'âge"""
        # Patient né en 1990
        patient = Patient(
            first_name="Test",
            last_name="User",
            date_of_birth=date(1990, 6, 15),
            gender="F",
            phone_number="0470123456",
            medical_record_number="PAT002",
            created_by=1
        )
        
        expected_age = datetime.now().year - 1990
        assert patient.age == expected_age or patient.age == expected_age - 1
    
    def test_patient_follow_up_scheduling(self):
        """Test planification du suivi"""
        patient = Patient(
            first_name="Test",
            last_name="User",
            date_of_birth=date(1985, 1, 1),
            gender="M",
            phone_number="0470123456",
            medical_record_number="PAT003",
            created_by=1
        )
        
        # Test planification par défaut
        patient.schedule_next_follow_up()
        assert patient.next_follow_up is not None
        assert patient.last_follow_up is not None
        
        # Test planification personnalisée
        patient.schedule_next_follow_up(days=14)
        assert patient.next_follow_up > datetime.now()
    
    def test_patient_is_due_for_follow_up(self):
        """Test vérification si le patient est dû pour un suivi"""
        patient = Patient(
            first_name="Test",
            last_name="User",
            date_of_birth=date(1985, 1, 1),
            gender="M",
            phone_number="0470123456",
            medical_record_number="PAT004",
            created_by=1
        )
        
        # Patient sans suivi planifié
        assert patient.is_due_for_follow_up() == True
        
        # Patient avec suivi planifié dans le futur
        patient.schedule_next_follow_up(days=7)
        assert patient.is_due_for_follow_up() == False
        
        # Patient avec suivi en retard
        patient.next_follow_up = datetime.now() - timedelta(days=1)
        assert patient.is_due_for_follow_up() == True

class TestPatientService:
    """Tests du service PatientService"""
    
    @patch('services.patient_service.db')
    @patch('services.patient_service.Patient')
    def test_create_patient_success(self, mock_patient_model, mock_db):
        """Test création réussie d'un patient"""
        # Mock des données
        patient_data = {
            'first_name': 'Jean',
            'last_name': 'Dupont',
            'date_of_birth': date(1980, 1, 1),
            'gender': 'M',
            'phone_number': '0470123456',
            'medical_record_number': 'PAT001',
            'email': 'jean.dupont@email.com'
        }
        
        # Mock du patient existant (aucun)
        mock_patient_model.query.filter_by.return_value.first.return_value = None
        
        # Mock du nouveau patient
        mock_patient = MagicMock()
        mock_patient.id = 1
        mock_patient.medical_record_number = 'PAT001'
        mock_patient_model.return_value = mock_patient
        
        # Exécution
        result = PatientService.create_patient(patient_data, created_by=1)
        
        # Vérifications
        assert result == mock_patient
        mock_db.session.add.assert_called_once()
        mock_db.session.commit.assert_called_once()
    
    @patch('services.patient_service.db')
    @patch('services.patient_service.Patient')
    def test_create_patient_duplicate_medical_record(self, mock_patient_model, mock_db):
        """Test création patient avec numéro de dossier en double"""
        patient_data = {
            'first_name': 'Jean',
            'last_name': 'Dupont',
            'date_of_birth': date(1980, 1, 1),
            'gender': 'M',
            'phone_number': '0470123456',
            'medical_record_number': 'PAT001'
        }
        
        # Mock patient existant
        mock_existing_patient = MagicMock()
        mock_patient_model.query.filter_by.return_value.first.return_value = mock_existing_patient
        
        # Exécution et vérification
        with pytest.raises(ValueError, match="existe déjà"):
            PatientService.create_patient(patient_data, created_by=1)
        
        mock_db.session.commit.assert_not_called()
    
    @patch('services.patient_service.db')
    @patch('services.patient_service.Patient')
    def test_get_patient_success(self, mock_patient_model, mock_db):
        """Test récupération d'un patient"""
        # Mock du patient
        mock_patient = MagicMock()
        mock_patient_model.query.get.return_value = mock_patient
        
        # Exécution
        result = PatientService.get_patient(patient_id=1)
        
        # Vérifications
        assert result == mock_patient
        mock_patient_model.query.get.assert_called_once_with(1)
    
    @patch('services.patient_service.db')
    @patch('services.patient_service.Patient')
    def test_get_patient_not_found(self, mock_patient_model, mock_db):
        """Test récupération d'un patient inexistant"""
        # Mock patient non trouvé
        mock_patient_model.query.get.return_value = None
        
        # Exécution
        result = PatientService.get_patient(patient_id=999)
        
        # Vérifications
        assert result is None
    
    @patch('services.patient_service.db')
    @patch('services.patient_service.Patient')
    def test_search_patients(self, mock_patient_model, mock_db):
        """Test recherche de patients"""
        # Mock des résultats
        mock_patients = [MagicMock(), MagicMock()]
        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.count.return_value = 2
        mock_query.offset.return_value = mock_query
        mock_query.limit.return_value = mock_patients
        
        mock_patient_model.query = mock_query
        
        # Exécution
        patients, total = PatientService.search_patients(
            search_term="Dupont",
            page=1,
            per_page=20
        )
        
        # Vérifications
        assert patients == mock_patients
        assert total == 2
        mock_query.count.assert_called_once()

if __name__ == '__main__':
    pytest.main([__file__]) 