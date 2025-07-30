-- Script de création de la table CALLS pour HelloJADE
-- Cette table stocke les informations sur les appels post-hospitalisation

CREATE TABLE CALLS (
    CALL_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    PATIENT_ID NUMBER NOT NULL,
    STATUT VARCHAR2(20) DEFAULT 'pending' NOT NULL,
    DATE_APPEL_PREVU DATE,
    DATE_APPEL_REEL DATE,
    DUREE NUMBER DEFAULT 0, -- Durée en secondes
    SCORE NUMBER DEFAULT NULL, -- Score de 0 à 100
    RESUME_APPEL CLOB, -- Résumé détaillé de l'appel
    NOMBRE_TENTATIVES NUMBER DEFAULT 0,
    DERNIERE_TENTATIVE DATE,
    DATE_CREATION DATE DEFAULT SYSDATE,
    DATE_MODIFICATION DATE DEFAULT SYSDATE,
    UTILISATEUR_CREATION VARCHAR2(50),
    UTILISATEUR_MODIFICATION VARCHAR2(50),
    
    -- Contraintes
    CONSTRAINT fk_calls_patient FOREIGN KEY (PATIENT_ID) REFERENCES PATIENTS(PATIENT_ID),
    CONSTRAINT ck_calls_statut CHECK (STATUT IN ('pending', 'called', 'failed', 'in_progress')),
    CONSTRAINT ck_calls_score CHECK (SCORE IS NULL OR (SCORE >= 0 AND SCORE <= 100)),
    CONSTRAINT ck_calls_duree CHECK (DUREE >= 0),
    CONSTRAINT ck_calls_tentatives CHECK (NOMBRE_TENTATIVES >= 0)
);

-- Index pour améliorer les performances
CREATE INDEX idx_calls_patient_id ON CALLS(PATIENT_ID);
CREATE INDEX idx_calls_statut ON CALLS(STATUT);
CREATE INDEX idx_calls_date_prevue ON CALLS(DATE_APPEL_PREVU);
CREATE INDEX idx_calls_date_reelle ON CALLS(DATE_APPEL_REEL);

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE CALLS IS 'Table des appels post-hospitalisation pour le suivi des patients';
COMMENT ON COLUMN CALLS.CALL_ID IS 'Identifiant unique de l''appel';
COMMENT ON COLUMN CALLS.PATIENT_ID IS 'Référence vers le patient';
COMMENT ON COLUMN CALLS.STATUT IS 'Statut de l''appel: pending, called, failed, in_progress';
COMMENT ON COLUMN CALLS.DATE_APPEL_PREVU IS 'Date et heure prévues pour l''appel';
COMMENT ON COLUMN CALLS.DATE_APPEL_REEL IS 'Date et heure réelles de l''appel';
COMMENT ON COLUMN CALLS.DUREE IS 'Durée de l''appel en secondes';
COMMENT ON COLUMN CALLS.SCORE IS 'Score de l''appel (0-100) basé sur l''algorithme médical';
COMMENT ON COLUMN CALLS.RESUME_APPEL IS 'Résumé détaillé de l''appel et points importants';
COMMENT ON COLUMN CALLS.NOMBRE_TENTATIVES IS 'Nombre de tentatives d''appel effectuées';
COMMENT ON COLUMN CALLS.DERNIERE_TENTATIVE IS 'Date de la dernière tentative d''appel';

-- Séquence pour l'auto-incrémentation (si nécessaire)
-- CREATE SEQUENCE calls_seq START WITH 1 INCREMENT BY 1;

-- Vues utiles pour les rapports
CREATE OR REPLACE VIEW V_APPELS_EN_COURS AS
SELECT 
    c.CALL_ID,
    p.NUMERO_PATIENT,
    p.NOM,
    p.PRENOM,
    p.TELEPHONE,
    h.SERVICE,
    h.MEDECIN,
    h.DATE_SORTIE,
    c.DATE_APPEL_PREVU,
    c.STATUT,
    c.NOMBRE_TENTATIVES
FROM CALLS c
JOIN PATIENTS p ON c.PATIENT_ID = p.PATIENT_ID
JOIN HOSPITALISATIONS h ON p.PATIENT_ID = h.PATIENT_ID
WHERE c.STATUT = 'pending'
ORDER BY c.DATE_APPEL_PREVU;

-- Procédure pour marquer un appel comme échec après un nombre maximum de tentatives
CREATE OR REPLACE PROCEDURE MARQUER_APPEL_ECHEC(
    p_patient_id IN NUMBER,
    p_max_tentatives IN NUMBER DEFAULT 3
) AS
    v_tentatives NUMBER;
BEGIN
    -- Récupérer le nombre de tentatives actuelles
    SELECT NOMBRE_TENTATIVES INTO v_tentatives
    FROM CALLS 
    WHERE PATIENT_ID = p_patient_id 
    AND STATUT = 'pending';
    
    -- Si le nombre maximum de tentatives est dépassé, marquer comme échec
    IF v_tentatives >= p_max_tentatives THEN
        UPDATE CALLS 
        SET STATUT = 'failed',
            DATE_MODIFICATION = SYSDATE
        WHERE PATIENT_ID = p_patient_id 
        AND STATUT = 'pending';
        
        COMMIT;
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        NULL; -- Aucun appel en cours pour ce patient
    WHEN OTHERS THEN
        RAISE;
END MARQUER_APPEL_ECHEC;
/

-- Données de test (optionnel)
-- INSERT INTO CALLS (PATIENT_ID, STATUT, DATE_APPEL_PREVU, NOMBRE_TENTATIVES)
-- SELECT 
--     p.PATIENT_ID,
--     'pending',
--     h.DATE_SORTIE + 1,
--     0
-- FROM PATIENTS p
-- JOIN HOSPITALISATIONS h ON p.PATIENT_ID = h.PATIENT_ID
-- WHERE h.DATE_SORTIE IS NOT NULL
-- AND ROWNUM <= 10; -- Limiter à 10 patients pour les tests

COMMIT; 