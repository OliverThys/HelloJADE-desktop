-- Script de création des tables pour la gestion des appels HelloJADE
-- Tables PostgreSQL pour les données spécifiques au projet

-- Table des appels (données spécifiques au projet)
CREATE TABLE IF NOT EXISTS calls (
    project_call_id SERIAL PRIMARY KEY,
    project_patient_id INTEGER NOT NULL,
    project_hospitalisation_id INTEGER,
    statut VARCHAR(20) DEFAULT 'pending' NOT NULL,
    date_appel_prevue TIMESTAMP,
    date_appel_reelle TIMESTAMP,
    duree_secondes INTEGER DEFAULT 0,
    score INTEGER DEFAULT NULL,
    resume_appel TEXT,
    dialogue_result JSONB,
    recording_path VARCHAR(500),
    nombre_tentatives INTEGER DEFAULT 0,
    derniere_tentative TIMESTAMP,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    utilisateur_creation VARCHAR(50),
    utilisateur_modification VARCHAR(50),
    
    -- Contraintes
    CONSTRAINT ck_calls_statut CHECK (statut IN ('pending', 'called', 'failed', 'in_progress')),
    CONSTRAINT ck_calls_score CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
    CONSTRAINT ck_calls_duree CHECK (duree_secondes >= 0),
    CONSTRAINT ck_calls_tentatives CHECK (nombre_tentatives >= 0)
);

-- Table d'historique des appels (pour audit)
CREATE TABLE IF NOT EXISTS call_history (
    history_id SERIAL PRIMARY KEY,
    project_call_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    ancien_statut VARCHAR(20),
    nouveau_statut VARCHAR(20),
    donnees_avant JSONB,
    donnees_apres JSONB,
    utilisateur VARCHAR(50),
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des scores détaillés (pour l'algorithme médical)
CREATE TABLE IF NOT EXISTS scores (
    score_id SERIAL PRIMARY KEY,
    project_call_id INTEGER NOT NULL,
    type_score VARCHAR(50) NOT NULL,
    valeur_score INTEGER NOT NULL,
    poids_score DECIMAL(3,2) DEFAULT 1.0,
    commentaire VARCHAR(500),
    date_calcul TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des métadonnées d'appels (données enrichies)
CREATE TABLE IF NOT EXISTS call_metadata (
    metadata_id SERIAL PRIMARY KEY,
    project_call_id INTEGER NOT NULL,
    cle_metadonnee VARCHAR(100) NOT NULL,
    valeur_metadonnee TEXT,
    type_donnee VARCHAR(20) DEFAULT 'TEXT',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_call_id, cle_metadonnee)
);

-- Table des paramètres système (pour la configuration)
CREATE TABLE IF NOT EXISTS system_parameters (
    param_id SERIAL PRIMARY KEY,
    cle_parametre VARCHAR(100) NOT NULL UNIQUE,
    valeur_parametre TEXT,
    description TEXT,
    type_parametre VARCHAR(20) DEFAULT 'TEXT',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_calls_patient ON calls(project_patient_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(statut);
CREATE INDEX IF NOT EXISTS idx_calls_scheduled ON calls(date_appel_prevue);
CREATE INDEX IF NOT EXISTS idx_calls_actual ON calls(date_appel_reelle);
CREATE INDEX IF NOT EXISTS idx_calls_discharge ON calls(date_appel_prevue);

CREATE INDEX IF NOT EXISTS idx_call_history_call ON call_history(project_call_id);
CREATE INDEX IF NOT EXISTS idx_call_history_action ON call_history(action);
CREATE INDEX IF NOT EXISTS idx_call_history_date ON call_history(date_action);

CREATE INDEX IF NOT EXISTS idx_scores_call ON scores(project_call_id);
CREATE INDEX IF NOT EXISTS idx_scores_type ON scores(type_score);

CREATE INDEX IF NOT EXISTS idx_metadata_call ON call_metadata(project_call_id);
CREATE INDEX IF NOT EXISTS idx_metadata_key ON call_metadata(cle_metadonnee);

-- Vues utiles pour les rapports
-- Supprimer les vues existantes avant de les recréer
DROP VIEW IF EXISTS v_appels_en_cours CASCADE;
DROP VIEW IF EXISTS v_statistiques_appels CASCADE;

CREATE VIEW v_appels_en_cours AS
SELECT 
    c.project_call_id,
    p.numero_patient,
    p.nom,
    p.prenom,
    p.telephone,
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

CREATE VIEW v_statistiques_appels AS
SELECT 
    statut,
    COUNT(*) as nombre_appels,
    AVG(duree_secondes) as duree_moyenne,
    AVG(score) as score_moyen,
    MIN(date_creation) as premier_appel,
    MAX(date_creation) as dernier_appel
FROM calls
GROUP BY statut;

-- Fonction pour marquer un appel comme échec après un nombre maximum de tentatives
CREATE OR REPLACE FUNCTION marquer_appel_echec(p_patient_id INTEGER, p_max_tentatives INTEGER DEFAULT 3)
RETURNS VOID AS $$
DECLARE
    v_tentatives INTEGER;
BEGIN
    -- Récupérer le nombre de tentatives actuelles
    SELECT nombre_tentatives INTO v_tentatives
    FROM calls 
    WHERE project_patient_id = p_patient_id 
    AND statut = 'pending';
    
    -- Si le nombre maximum de tentatives est dépassé, marquer comme échec
    IF v_tentatives >= p_max_tentatives THEN
        UPDATE calls 
        SET statut = 'failed',
            date_modification = CURRENT_TIMESTAMP
        WHERE project_patient_id = p_patient_id 
        AND statut = 'pending';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Insérer les paramètres système par défaut
INSERT INTO system_parameters (cle_parametre, valeur_parametre, description, type_parametre) VALUES
('max_tentatives_appel', '3', 'Nombre maximum de tentatives d''appel avant échec', 'INTEGER'),
('delai_appel_jours', '3', 'Délai en jours après la sortie pour programmer l''appel', 'INTEGER'),
('score_seuil_alerte', '50', 'Seuil de score en dessous duquel une alerte est générée', 'INTEGER'),
('duree_appel_min', '60', 'Durée minimale d''un appel en secondes', 'INTEGER'),
('duree_appel_max', '1800', 'Durée maximale d''un appel en secondes', 'INTEGER')
ON CONFLICT (cle_parametre) DO NOTHING;

-- Commentaires sur les tables
COMMENT ON TABLE calls IS 'Appels post-hospitalisation gérés par HelloJADE';
COMMENT ON TABLE call_history IS 'Historique des modifications d''appels pour audit';
COMMENT ON TABLE scores IS 'Scores détaillés calculés par l''algorithme médical';
COMMENT ON TABLE call_metadata IS 'Métadonnées enrichies des appels';
COMMENT ON TABLE system_parameters IS 'Paramètres de configuration du système';

-- Triggers pour l'audit
CREATE OR REPLACE FUNCTION audit_call_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO call_history (
            project_call_id, 
            action, 
            ancien_statut, 
            nouveau_statut, 
            donnees_avant, 
            donnees_apres, 
            utilisateur
        ) VALUES (
            OLD.project_call_id,
            'updated',
            OLD.statut,
            NEW.statut,
            to_jsonb(OLD),
            to_jsonb(NEW),
            NEW.utilisateur_modification
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO call_history (
            project_call_id, 
            action, 
            nouveau_statut, 
            donnees_apres, 
            utilisateur
        ) VALUES (
            NEW.project_call_id,
            'created',
            NEW.statut,
            to_jsonb(NEW),
            NEW.utilisateur_creation
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_calls
    AFTER INSERT OR UPDATE ON calls
    FOR EACH ROW
    EXECUTE FUNCTION audit_call_changes();

-- Fonction pour calculer le score automatiquement
CREATE OR REPLACE FUNCTION calculer_score_appel(p_call_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 0;
    v_duree INTEGER;
    v_nombre_tentatives INTEGER;
    v_has_resume BOOLEAN;
BEGIN
    -- Récupérer les données de l'appel
    SELECT duree_secondes, nombre_tentatives, (resume_appel IS NOT NULL AND resume_appel != '')
    INTO v_duree, v_nombre_tentatives, v_has_resume
    FROM calls
    WHERE project_call_id = p_call_id;
    
    -- Calcul du score basé sur plusieurs critères
    -- 1. Durée de l'appel (0-40 points)
    IF v_duree > 0 THEN
        v_score := v_score + LEAST(v_duree / 30, 40); -- 30 secondes = 1 point, max 40 points
    END IF;
    
    -- 2. Nombre de tentatives (0-20 points)
    IF v_nombre_tentatives = 1 THEN
        v_score := v_score + 20; -- Réussi du premier coup
    ELSIF v_nombre_tentatives = 2 THEN
        v_score := v_score + 15; -- Réussi en 2 tentatives
    ELSIF v_nombre_tentatives = 3 THEN
        v_score := v_score + 10; -- Réussi en 3 tentatives
    END IF;
    
    -- 3. Présence d'un résumé (0-20 points)
    IF v_has_resume THEN
        v_score := v_score + 20;
    END IF;
    
    -- 4. Bonus pour un appel réussi (0-20 points)
    IF v_duree > 0 THEN
        v_score := v_score + 20;
    END IF;
    
    -- Limiter le score à 100
    v_score := LEAST(v_score, 100);
    
    -- Mettre à jour le score dans la table
    UPDATE calls 
    SET score = v_score,
        date_modification = CURRENT_TIMESTAMP
    WHERE project_call_id = p_call_id;
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql; 