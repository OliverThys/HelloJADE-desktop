-- HelloJADE v1.0 - Initialisation base de données Oracle
-- Script d'initialisation automatique

-- Création de l'utilisateur HelloJADE
CREATE USER hellojade IDENTIFIED BY hellojade123
    DEFAULT TABLESPACE USERS
    TEMPORARY TABLESPACE TEMP
    QUOTA UNLIMITED ON USERS;

-- Attribution des privilèges
GRANT CONNECT, RESOURCE TO hellojade;
GRANT CREATE SESSION TO hellojade;
GRANT CREATE TABLE TO hellojade;
GRANT CREATE SEQUENCE TO hellojade;
GRANT CREATE VIEW TO hellojade;
GRANT CREATE PROCEDURE TO hellojade;
GRANT CREATE TRIGGER TO hellojade;
GRANT SELECT ANY DICTIONARY TO hellojade;

-- Création des tables
CONNECT hellojade/hellojade123

-- Table des utilisateurs
CREATE TABLE users (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR2(50) UNIQUE NOT NULL,
    email VARCHAR2(100) UNIQUE NOT NULL,
    first_name VARCHAR2(50) NOT NULL,
    last_name VARCHAR2(50) NOT NULL,
    role VARCHAR2(20) NOT NULL CHECK (role IN ('admin', 'medecin', 'infirmier', 'secretaire', 'user')),
    is_active NUMBER(1) DEFAULT 1 CHECK (is_active IN (0, 1)),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des patients
CREATE TABLE patients (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id VARCHAR2(20) UNIQUE NOT NULL,
    first_name VARCHAR2(50) NOT NULL,
    last_name VARCHAR2(50) NOT NULL,
    date_of_birth DATE,
    phone_number VARCHAR2(20) NOT NULL,
    email VARCHAR2(100),
    address TEXT,
    medical_history CLOB,
    current_medications CLOB,
    allergies CLOB,
    assigned_user_id NUMBER REFERENCES users(id),
    is_active NUMBER(1) DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des appels
CREATE TABLE calls (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    call_id VARCHAR2(50) UNIQUE NOT NULL,
    patient_id NUMBER NOT NULL REFERENCES patients(id),
    user_id NUMBER NOT NULL REFERENCES users(id),
    call_type VARCHAR2(20) NOT NULL CHECK (call_type IN ('scheduled', 'manual', 'follow_up')),
    status VARCHAR2(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'failed', 'cancelled')),
    direction VARCHAR2(10) NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
    phone_number VARCHAR2(20) NOT NULL,
    scheduled_time TIMESTAMP,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration NUMBER,
    recording_path VARCHAR2(500),
    transcription_text CLOB,
    ai_analysis CLOB,
    notes CLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des dossiers médicaux
CREATE TABLE medical_records (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id NUMBER NOT NULL REFERENCES patients(id),
    call_id NUMBER REFERENCES calls(id),
    record_type VARCHAR2(50) NOT NULL,
    title VARCHAR2(200) NOT NULL,
    content CLOB,
    severity VARCHAR2(20),
    ai_generated NUMBER(1) DEFAULT 0 CHECK (ai_generated IN (0, 1)),
    created_by_user_id NUMBER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des transcriptions IA
CREATE TABLE ai_transcriptions (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    call_id NUMBER NOT NULL REFERENCES calls(id),
    text CLOB NOT NULL,
    confidence NUMBER(5,4),
    language VARCHAR2(10) DEFAULT 'fr',
    duration NUMBER,
    segments CLOB,
    model_used VARCHAR2(50),
    processing_time NUMBER(10,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des analyses IA
CREATE TABLE ai_analyses (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    call_id NUMBER NOT NULL REFERENCES calls(id),
    summary CLOB,
    sentiment VARCHAR2(20),
    urgency_level VARCHAR2(20),
    medical_notes CLOB,
    recommendations CLOB,
    confidence NUMBER(5,4),
    model_used VARCHAR2(50),
    processing_time NUMBER(10,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des logs système
CREATE TABLE system_logs (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    level VARCHAR2(10) NOT NULL,
    logger VARCHAR2(100),
    message CLOB NOT NULL,
    module VARCHAR2(50),
    function VARCHAR2(100),
    line_number NUMBER,
    user_id NUMBER REFERENCES users(id),
    ip_address VARCHAR2(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des logs d'audit
CREATE TABLE audit_logs (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    action VARCHAR2(20) NOT NULL,
    resource_type VARCHAR2(50) NOT NULL,
    resource_id NUMBER,
    user_id NUMBER REFERENCES users(id),
    old_values CLOB,
    new_values CLOB,
    ip_address VARCHAR2(45),
    user_agent VARCHAR2(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création des index pour les performances
CREATE INDEX idx_patients_patient_id ON patients(patient_id);
CREATE INDEX idx_patients_phone ON patients(phone_number);
CREATE INDEX idx_patients_assigned_user ON patients(assigned_user_id);
CREATE INDEX idx_calls_call_id ON calls(call_id);
CREATE INDEX idx_calls_patient_id ON calls(patient_id);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_scheduled_time ON calls(scheduled_time);
CREATE INDEX idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX idx_medical_records_call_id ON medical_records(call_id);
CREATE INDEX idx_ai_transcriptions_call_id ON ai_transcriptions(call_id);
CREATE INDEX idx_ai_analyses_call_id ON ai_analyses(call_id);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Création des séquences
CREATE SEQUENCE seq_users_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_patients_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_calls_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_medical_records_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_ai_transcriptions_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_ai_analyses_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_system_logs_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_audit_logs_id START WITH 1 INCREMENT BY 1;

-- Insertion d'un utilisateur administrateur par défaut
INSERT INTO users (username, email, first_name, last_name, role, is_active)
VALUES ('admin', 'admin@hellojade.com', 'Administrateur', 'HelloJADE', 'admin', 1);

-- Commit des changements
COMMIT;

-- Affichage du statut
SELECT 'Base de données HelloJADE initialisée avec succès' AS status FROM dual; 