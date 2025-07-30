-- Script d'initialisation des tables HelloJADE
-- Création des tables principales

-- Table des patients synchronisés
CREATE TABLE patients_sync (
    project_patient_id SERIAL PRIMARY KEY,
    hospital_patient_id INTEGER NOT NULL UNIQUE,
    numero_patient VARCHAR(20),
    nom VARCHAR(100),
    prenom VARCHAR(100),
    date_naissance DATE,
    telephone VARCHAR(20),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut_sync VARCHAR(20) DEFAULT 'ACTIVE'
);

-- Table des hospitalisations synchronisées
CREATE TABLE hospitalisations_sync (
    project_hospitalisation_id SERIAL PRIMARY KEY,
    hospital_hospitalisation_id INTEGER NOT NULL UNIQUE,
    project_patient_id INTEGER NOT NULL REFERENCES patients_sync(project_patient_id),
    site VARCHAR(100),
    service VARCHAR(100),
    medecin VARCHAR(100),
    date_sortie DATE,
    statut VARCHAR(20),
    diagnostic VARCHAR(500),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des appels
CREATE TABLE calls (
    project_call_id SERIAL PRIMARY KEY,
    project_patient_id INTEGER NOT NULL REFERENCES patients_sync(project_patient_id),
    project_hospitalisation_id INTEGER REFERENCES hospitalisations_sync(project_hospitalisation_id),
    statut VARCHAR(20) DEFAULT 'pending' NOT NULL,
    date_appel_prevue TIMESTAMP,
    date_appel_reelle TIMESTAMP,
    duree_secondes INTEGER DEFAULT 0,
    score INTEGER DEFAULT NULL,
    resume_appel TEXT,
    nombre_tentatives INTEGER DEFAULT 0,
    derniere_tentative TIMESTAMP,
    dialogue_result JSONB,
    recording_path VARCHAR(500),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table d'historique des appels
CREATE TABLE call_history (
    history_id SERIAL PRIMARY KEY,
    project_call_id INTEGER NOT NULL REFERENCES calls(project_call_id),
    action VARCHAR(50) NOT NULL,
    ancien_statut VARCHAR(20),
    nouveau_statut VARCHAR(20),
    donnees_avant JSONB,
    donnees_apres JSONB,
    utilisateur VARCHAR(50),
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des scores détaillés
CREATE TABLE scores (
    score_id SERIAL PRIMARY KEY,
    project_call_id INTEGER NOT NULL REFERENCES calls(project_call_id),
    type_score VARCHAR(50) NOT NULL,
    valeur_score INTEGER NOT NULL,
    poids_score INTEGER DEFAULT 1,
    commentaire VARCHAR(500),
    date_calcul TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des métadonnées d'appels
CREATE TABLE call_metadata (
    metadata_id SERIAL PRIMARY KEY,
    project_call_id INTEGER NOT NULL REFERENCES calls(project_call_id),
    cle_metadonnee VARCHAR(100) NOT NULL,
    valeur_metadonnee TEXT,
    type_donnee VARCHAR(20) DEFAULT 'TEXT',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_call_id, cle_metadonnee)
);

-- Index pour les performances
CREATE INDEX idx_patients_sync_hospital_id ON patients_sync(hospital_patient_id);
CREATE INDEX idx_patients_sync_number ON patients_sync(numero_patient);
CREATE INDEX idx_patients_sync_name ON patients_sync(nom, prenom);

CREATE INDEX idx_hospitalisations_sync_hospital_id ON hospitalisations_sync(hospital_hospitalisation_id);
CREATE INDEX idx_hospitalisations_sync_patient ON hospitalisations_sync(project_patient_id);
CREATE INDEX idx_hospitalisations_sync_discharge ON hospitalisations_sync(date_sortie);

CREATE INDEX idx_calls_patient ON calls(project_patient_id);
CREATE INDEX idx_calls_status ON calls(statut);
CREATE INDEX idx_calls_date_prevue ON calls(date_appel_prevue);
CREATE INDEX idx_calls_date_reelle ON calls(date_appel_reelle);
CREATE INDEX idx_calls_hospitalisation ON calls(project_hospitalisation_id);

CREATE INDEX idx_call_history_call ON call_history(project_call_id);
CREATE INDEX idx_call_history_action ON call_history(action);
CREATE INDEX idx_call_history_date ON call_history(date_action);

CREATE INDEX idx_scores_call ON scores(project_call_id);
CREATE INDEX idx_scores_type ON scores(type_score);

CREATE INDEX idx_metadata_call ON call_metadata(project_call_id);
CREATE INDEX idx_metadata_key ON call_metadata(cle_metadonnee);

-- Vues pour faciliter les requêtes
CREATE OR REPLACE VIEW v_appels_en_cours AS
SELECT 
    c.project_call_id,
    p.numero_patient,
    p.nom,
    p.prenom,
    p.telephone,
    h.site,
    h.service,
    h.medecin,
    h.date_sortie,
    c.date_appel_prevue,
    c.statut,
    c.nombre_tentatives
FROM calls c
JOIN patients_sync p ON c.project_patient_id = p.project_patient_id
LEFT JOIN hospitalisations_sync h ON c.project_hospitalisation_id = h.project_hospitalisation_id
WHERE c.statut = 'pending'
ORDER BY c.date_appel_prevue;

CREATE OR REPLACE VIEW v_statistiques_appels AS
SELECT 
    statut,
    COUNT(*) as nombre_appels,
    AVG(duree_secondes) as duree_moyenne,
    AVG(score) as score_moyen,
    MIN(date_creation) as premier_appel,
    MAX(date_creation) as dernier_appel
FROM calls
GROUP BY statut;

-- Données de test
INSERT INTO patients_sync (hospital_patient_id, numero_patient, nom, prenom, date_naissance, telephone) VALUES
(1001, 'P001', 'DUPONT', 'Marie', '1970-03-15', '+33612345678'),
(1002, 'P002', 'MARTIN', 'Jean', '1965-07-22', '+33623456789'),
(1003, 'P003', 'BERNARD', 'Sophie', '1980-11-08', '+33634567890'),
(1004, 'P004', 'PETIT', 'Pierre', '1955-12-03', '+33645678901'),
(1005, 'P005', 'ROBERT', 'Anne', '1975-09-17', '+33656789012');

INSERT INTO hospitalisations_sync (hospital_hospitalisation_id, project_patient_id, site, service, medecin, date_sortie, statut) VALUES
(2001, 1, 'Hôpital Saint-Louis', 'Cardiologie', 'Dr Martin', '2025-01-25', 'TERMINEE'),
(2002, 2, 'Hôpital Saint-Louis', 'Pneumologie', 'Dr Dubois', '2025-01-26', 'TERMINEE'),
(2003, 3, 'Hôpital Saint-Louis', 'Chirurgie', 'Dr Leroy', '2025-01-27', 'TERMINEE'),
(2004, 4, 'Hôpital Saint-Louis', 'Gériatrie', 'Dr Moreau', '2025-01-28', 'TERMINEE'),
(2005, 5, 'Hôpital Saint-Louis', 'Médecine interne', 'Dr Simon', '2025-01-29', 'TERMINEE');

INSERT INTO calls (project_patient_id, project_hospitalisation_id, statut, date_appel_prevue, date_appel_reelle, duree_secondes, score, resume_appel, dialogue_result) VALUES
(1, 1, 'complete', '2025-01-30 14:00:00', '2025-01-30 14:30:22', 185, 85, 'Patient en bonne forme, douleur légère, traitement suivi correctement', '{"douleur_niveau": 3, "traitement_suivi": true, "moral_niveau": 7}'),
(2, 2, 'pending', '2025-01-30 15:00:00', NULL, NULL, NULL, NULL, NULL),
(3, 3, 'failed', '2025-01-30 16:00:00', NULL, NULL, NULL, NULL, NULL),
(4, 4, 'complete', '2025-01-30 17:00:00', '2025-01-30 17:15:45', 245, 92, 'Patient très satisfait, aucun problème signalé', '{"douleur_niveau": 0, "traitement_suivi": true, "moral_niveau": 9}'),
(5, 5, 'pending', '2025-01-30 18:00:00', NULL, NULL, NULL, NULL, NULL); 