-- Tables pour la gestion de la satisfaction des patients
-- À exécuter dans la base de données hellojade

-- Suppression des tables si elles existent (pour éviter les conflits)
DROP TABLE IF EXISTS patient_wellness_metrics CASCADE;
DROP TABLE IF EXISTS patient_alerts CASCADE;
DROP TABLE IF EXISTS patient_satisfaction CASCADE;

-- Table pour les évaluations de satisfaction
CREATE TABLE patient_satisfaction (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    call_id INTEGER,
    date_evaluation TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    score_global INTEGER CHECK (score_global >= 1 AND score_global <= 10),
    score_communication INTEGER CHECK (score_communication >= 1 AND score_communication <= 10),
    score_soins INTEGER CHECK (score_soins >= 1 AND score_soins <= 10),
    score_environnement INTEGER CHECK (score_environnement >= 1 AND score_environnement <= 10),
    commentaire TEXT,
    statut_evaluation VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les alertes et actions requises
CREATE TABLE patient_alerts (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    call_id INTEGER,
    type_alerte VARCHAR(50) NOT NULL, -- 'DOULEUR', 'INFECTION', 'ANXIETE', 'AUTRE'
    niveau_urgence VARCHAR(20) DEFAULT 'MOYEN', -- 'FAIBLE', 'MOYEN', 'ELEVE', 'CRITIQUE'
    description TEXT NOT NULL,
    action_requise TEXT,
    statut VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'EN_COURS', 'RESOLUE'
    date_creation TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_resolution TIMESTAMP WITHOUT TIME ZONE,
    medecin_responsable VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les métriques de bien-être
CREATE TABLE patient_wellness_metrics (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    call_id INTEGER,
    date_evaluation TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    niveau_douleur INTEGER CHECK (niveau_douleur >= 0 AND niveau_douleur <= 10),
    etat_fatigue VARCHAR(20), -- 'EXCELLENT', 'BIEN', 'FATIGUE', 'TRES_FATIGUE'
    niveau_anxiete VARCHAR(20), -- 'AUCUNE', 'LEGERE', 'MODEREE', 'ELEVEE'
    presence_infection BOOLEAN DEFAULT FALSE,
    type_infection VARCHAR(100),
    commentaire_bien_etre TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les performances
CREATE INDEX idx_patient_satisfaction_patient_id ON patient_satisfaction(patient_id);
CREATE INDEX idx_patient_satisfaction_date ON patient_satisfaction(date_evaluation);
CREATE INDEX idx_patient_alerts_patient_id ON patient_alerts(patient_id);
CREATE INDEX idx_patient_alerts_statut ON patient_alerts(statut);
CREATE INDEX idx_patient_alerts_type ON patient_alerts(type_alerte);
CREATE INDEX idx_patient_wellness_patient_id ON patient_wellness_metrics(patient_id);
CREATE INDEX idx_patient_wellness_date ON patient_wellness_metrics(date_evaluation);

-- Contraintes de clés étrangères (optionnel, à adapter selon vos besoins)
-- ALTER TABLE patient_satisfaction ADD CONSTRAINT fk_patient_satisfaction_patient_id 
--     FOREIGN KEY (patient_id) REFERENCES patients_sync(patient_id);
-- ALTER TABLE patient_alerts ADD CONSTRAINT fk_patient_alerts_patient_id 
--     FOREIGN KEY (patient_id) REFERENCES patients_sync(patient_id);
-- ALTER TABLE patient_wellness_metrics ADD CONSTRAINT fk_patient_wellness_patient_id 
--     FOREIGN KEY (patient_id) REFERENCES patients_sync(patient_id);

-- Données d'exemple pour les tests
INSERT INTO patient_satisfaction (patient_id, call_id, score_global, score_communication, score_soins, score_environnement, commentaire) VALUES
(1, 1, 8, 9, 8, 7, 'Très satisfait du suivi post-hospitalisation'),
(3, 3, 7, 8, 7, 8, 'Bon suivi, quelques améliorations possibles'),
(5, 5, 9, 9, 9, 8, 'Excellent service, personnel très attentionné'),
(6, 6, 6, 7, 6, 7, 'Correct mais pourrait être amélioré'),
(7, 7, 8, 8, 8, 8, 'Satisfait du traitement reçu'),
(9, 9, 7, 8, 7, 7, 'Bon suivi médical'),
(10, 10, 9, 9, 9, 9, 'Service exceptionnel'),
(12, 12, 8, 8, 8, 8, 'Très satisfait'),
(14, 14, 7, 8, 7, 7, 'Bon suivi'),
(19, 19, 8, 9, 8, 8, 'Excellent personnel'),
(20, 20, 9, 9, 9, 9, 'Service de qualité'),
(21, 21, 7, 8, 7, 7, 'Satisfait du suivi');

INSERT INTO patient_alerts (patient_id, call_id, type_alerte, niveau_urgence, description, action_requise) VALUES
(2, 2, 'DOULEUR', 'ELEVE', 'Patient signale une douleur intense (10/10)', 'Contacter immédiatement pour évaluer douleur et infection'),
(8, 8, 'INFECTION', 'MOYEN', 'Suspicion d\'infection post-opératoire', 'Programmer consultation urgente'),
(11, 11, 'ANXIETE', 'MOYEN', 'Patient très anxieux concernant son traitement', 'Suivi psychologique recommandé'),
(13, 13, 'DOULEUR', 'ELEVE', 'Douleurs persistantes non soulagées', 'Réévaluation médicale urgente'),
(15, 15, 'INFECTION', 'ELEVE', 'Signes d\'infection sur la plaie', 'Antibiothérapie immédiate nécessaire');

INSERT INTO patient_wellness_metrics (patient_id, call_id, niveau_douleur, etat_fatigue, niveau_anxiete, presence_infection, type_infection, commentaire_bien_etre) VALUES
(1, 1, 3, 'BIEN', 'LEGERE', FALSE, NULL, 'Patient se sent bien, récupération normale'),
(2, 2, 10, 'TRES_FATIGUE', 'ELEVEE', TRUE, 'Infection cutanée', 'Douleur intense, fatigue importante'),
(3, 3, 4, 'BIEN', 'MODEREE', FALSE, NULL, 'Légère anxiété mais état général bon'),
(5, 5, 2, 'EXCELLENT', 'AUCUNE', FALSE, NULL, 'Excellent état général'),
(6, 6, 5, 'FATIGUE', 'MODEREE', FALSE, NULL, 'Fatigue modérée mais acceptable'),
(7, 7, 3, 'BIEN', 'LEGERE', FALSE, NULL, 'Bien-être satisfaisant'),
(8, 8, 7, 'FATIGUE', 'ELEVEE', TRUE, 'Infection urinaire', 'Fatigue et infection'),
(9, 9, 4, 'BIEN', 'LEGERE', FALSE, NULL, 'État stable'),
(10, 10, 2, 'EXCELLENT', 'AUCUNE', FALSE, NULL, 'Excellent état'),
(11, 11, 6, 'FATIGUE', 'ELEVEE', FALSE, NULL, 'Anxiété importante'),
(12, 12, 3, 'BIEN', 'LEGERE', FALSE, NULL, 'Bien-être correct'),
(13, 13, 8, 'FATIGUE', 'ELEVEE', FALSE, NULL, 'Douleurs persistantes'),
(14, 14, 2, 'EXCELLENT', 'AUCUNE', FALSE, NULL, 'Excellent état'),
(15, 15, 7, 'FATIGUE', 'MODEREE', TRUE, 'Infection respiratoire', 'Infection et fatigue'),
(16, 16, 4, 'BIEN', 'LEGERE', FALSE, NULL, 'État stable'),
(17, 17, 5, 'BIEN', 'MODEREE', FALSE, NULL, 'Anxiété modérée'),
(18, 18, 3, 'BIEN', 'LEGERE', FALSE, NULL, 'Bien-être satisfaisant'),
(19, 19, 4, 'BIEN', 'LEGERE', FALSE, NULL, 'État stable'),
(20, 20, 2, 'EXCELLENT', 'AUCUNE', FALSE, NULL, 'Excellent état'),
(21, 21, 5, 'BIEN', 'MODEREE', FALSE, NULL, 'Anxiété modérée mais gérable'); 