-- HelloJADE v1.0 - Données de test pour simulation hospitalière
-- Script d'insertion de données de test

CONNECT hellojade/hellojade123

-- Insertion d'utilisateurs (personnel hospitalier)
INSERT INTO users (username, email, first_name, last_name, role, is_active) VALUES
('dr.martin', 'martin.dupont@hopital.fr', 'Jean', 'Dupont', 'medecin', 1),
('dr.bernard', 'bernard.martin@hopital.fr', 'Marie', 'Martin', 'medecin', 1),
('dr.leroy', 'leroy.petit@hopital.fr', 'Pierre', 'Petit', 'medecin', 1),
('inf.durand', 'durand.sophie@hopital.fr', 'Sophie', 'Durand', 'infirmier', 1),
('inf.moreau', 'moreau.thomas@hopital.fr', 'Thomas', 'Moreau', 'infirmier', 1),
('sec.roux', 'roux.anne@hopital.fr', 'Anne', 'Roux', 'secretaire', 1),
('sec.lefevre', 'lefevre.paul@hopital.fr', 'Paul', 'Lefevre', 'secretaire', 1);

-- Insertion de patients avec données médicales réalistes
INSERT INTO patients (patient_id, first_name, last_name, date_of_birth, phone_number, email, address, medical_history, current_medications, allergies, assigned_user_id) VALUES
('P001', 'Claude', 'Dubois', DATE '1955-03-15', '0123456789', 'claude.dubois@email.fr', '123 Rue de la Paix, 75001 Paris', 'Hypertension artérielle, Diabète type 2, Antécédent d''infarctus en 2018', 'Amlodipine 5mg/jour, Metformine 1000mg 2x/jour, Aspirine 100mg/jour', 'Pénicilline, Sulfamides', 1),
('P002', 'Françoise', 'Leroy', DATE '1962-07-22', '0123456790', 'francoise.leroy@email.fr', '456 Avenue Victor Hugo, 69001 Lyon', 'Asthme chronique, Reflux gastro-œsophagien', 'Ventoline inhalateur, Oméprazole 20mg/jour', 'Aucune allergie connue', 2),
('P003', 'Marcel', 'Moreau', DATE '1948-11-08', '0123456791', 'marcel.moreau@email.fr', '789 Boulevard Saint-Michel, 13001 Marseille', 'Insuffisance cardiaque, Fibrillation auriculaire, Prothèse de hanche droite', 'Digoxine 0.25mg/jour, Warfarine 5mg/jour, Furosémide 40mg/jour', 'Iode, Produits de contraste', 1),
('P004', 'Jeanne', 'Simon', DATE '1973-05-12', '0123456792', 'jeanne.simon@email.fr', '321 Rue de Rivoli, 31000 Toulouse', 'Dépression récurrente, Anxiété généralisée', 'Sertraline 50mg/jour, Alprazolam 0.5mg si nécessaire', 'Aucune allergie connue', 3),
('P005', 'Robert', 'Michel', DATE '1968-09-30', '0123456793', 'robert.michel@email.fr', '654 Place de la République, 44000 Nantes', 'Diabète type 1, Rétinopathie diabétique, Insuffisance rénale modérée', 'Insuline glargine 30 unités/jour, Insuline rapide selon glycémie', 'Latex, Certains adhésifs', 2),
('P006', 'Monique', 'Garcia', DATE '1959-12-03', '0123456794', 'monique.garcia@email.fr', '987 Rue du Commerce, 59000 Lille', 'Ostéoporose, Arthrose du genou droit, Hypertension artérielle', 'Alendronate 70mg/semaine, Paracétamol 1000mg si douleur, Amlodipine 10mg/jour', 'Aucune allergie connue', 1),
('P007', 'André', 'Roux', DATE '1971-02-18', '0123456795', 'andre.roux@email.fr', '147 Avenue des Champs-Élysées, 75008 Paris', 'Cancer du poumon en rémission, BPCO, Tabagisme sevré depuis 2020', 'Tiotropium inhalateur, Salbutamol si nécessaire, Vitamine D', 'Aucune allergie connue', 3),
('P008', 'Suzanne', 'Lefevre', DATE '1965-08-25', '0123456796', 'suzanne.lefevre@email.fr', '258 Rue de la Liberté, 67000 Strasbourg', 'Maladie de Parkinson, Dépression, Troubles du sommeil', 'Lévodopa/Carbidopa 100/25mg 3x/jour, Mirtazapine 30mg/jour, Zolpidem 10mg si nécessaire', 'Aucune allergie connue', 2),
('P009', 'Henri', 'Girard', DATE '1945-04-07', '0123456797', 'henri.girard@email.fr', '369 Boulevard de la Croix-Rousse, 69004 Lyon', 'Alzheimer modéré, Hypertension artérielle, Prostatisme', 'Donepezil 10mg/jour, Tamsulosine 0.4mg/jour, Amlodipine 5mg/jour', 'Aucune allergie connue', 1),
('P010', 'Lucie', 'Mercier', DATE '1980-06-14', '0123456798', 'lucie.mercier@email.fr', '741 Rue de la Bourse, 33000 Bordeaux', 'Endométriose, Fibromyalgie, Migraines chroniques', 'Ibuprofène 400mg si douleur, Sumatriptan 50mg si migraine, Vitamine B12', 'Aucune allergie connue', 3);

-- Insertion d'appels programmés et complétés
INSERT INTO calls (call_id, patient_id, user_id, call_type, status, direction, phone_number, scheduled_time, start_time, end_time, duration, notes) VALUES
('CALL001', 1, 1, 'scheduled', 'completed', 'outbound', '0123456789', TIMESTAMP '2024-01-15 10:00:00', TIMESTAMP '2024-01-15 10:02:00', TIMESTAMP '2024-01-15 10:15:00', 13, 'Patient stable, tension bien contrôlée. Renouvellement des ordonnances validé.'),
('CALL002', 2, 2, 'scheduled', 'completed', 'outbound', '0123456790', TIMESTAMP '2024-01-15 14:00:00', TIMESTAMP '2024-01-15 14:01:00', TIMESTAMP '2024-01-15 14:12:00', 11, 'Asthme bien contrôlé, pas de crise récente. Vérification de la technique d''inhalation.'),
('CALL003', 3, 1, 'scheduled', 'completed', 'outbound', '0123456791', TIMESTAMP '2024-01-16 09:00:00', TIMESTAMP '2024-01-16 09:03:00', TIMESTAMP '2024-01-16 09:20:00', 17, 'Insuffisance cardiaque stable. INR dans les normes. Surveillance renforcée recommandée.'),
('CALL004', 4, 3, 'scheduled', 'completed', 'outbound', '0123456792', TIMESTAMP '2024-01-16 11:00:00', TIMESTAMP '2024-01-16 11:01:00', TIMESTAMP '2024-01-16 11:18:00', 17, 'Humeur améliorée, moins d''anxiété. Ajustement de la posologie de l''alprazolam.'),
('CALL005', 5, 2, 'scheduled', 'completed', 'outbound', '0123456793', TIMESTAMP '2024-01-17 08:00:00', TIMESTAMP '2024-01-17 08:02:00', TIMESTAMP '2024-01-17 08:25:00', 23, 'Glycémie instable, plusieurs hypoglycémies. Ajustement de l''insuline nécessaire.'),
('CALL006', 6, 1, 'scheduled', 'completed', 'outbound', '0123456794', TIMESTAMP '2024-01-17 15:00:00', TIMESTAMP '2024-01-17 15:01:00', TIMESTAMP '2024-01-17 15:10:00', 9, 'Douleurs articulaires modérées, traitement bien toléré.'),
('CALL007', 7, 3, 'scheduled', 'completed', 'outbound', '0123456795', TIMESTAMP '2024-01-18 10:00:00', TIMESTAMP '2024-01-18 10:03:00', TIMESTAMP '2024-01-18 10:22:00', 19, 'BPCO stable, pas d''exacerbation. Continuer la réhabilitation respiratoire.'),
('CALL008', 8, 2, 'scheduled', 'completed', 'outbound', '0123456796', TIMESTAMP '2024-01-18 14:00:00', TIMESTAMP '2024-01-18 14:01:00', TIMESTAMP '2024-01-18 14:15:00', 14, 'Tremblements modérés, ajustement de la lévodopa. Troubles du sommeil persistants.'),
('CALL009', 9, 1, 'scheduled', 'completed', 'outbound', '0123456797', TIMESTAMP '2024-01-19 09:00:00', TIMESTAMP '2024-01-19 09:02:00', TIMESTAMP '2024-01-19 09:20:00', 18, 'Déclin cognitif stable, aidant familial présent. Surveillance continue nécessaire.'),
('CALL010', 10, 3, 'scheduled', 'completed', 'outbound', '0123456798', TIMESTAMP '2024-01-19 16:00:00', TIMESTAMP '2024-01-19 16:01:00', TIMESTAMP '2024-01-19 16:12:00', 11, 'Douleurs endométriosiques modérées, traitement efficace. Fibromyalgie stable.');

-- Insertion d'appels en cours et programmés
INSERT INTO calls (call_id, patient_id, user_id, call_type, status, direction, phone_number, scheduled_time, notes) VALUES
('CALL011', 1, 1, 'scheduled', 'scheduled', 'outbound', '0123456789', TIMESTAMP '2024-01-22 10:00:00', 'Suivi mensuel - Contrôle tension et glycémie'),
('CALL012', 3, 1, 'scheduled', 'scheduled', 'outbound', '0123456791', TIMESTAMP '2024-01-22 14:00:00', 'Contrôle INR et ajustement anticoagulant'),
('CALL013', 5, 2, 'scheduled', 'scheduled', 'outbound', '0123456793', TIMESTAMP '2024-01-23 09:00:00', 'Suivi diabète - Ajustement insuline'),
('CALL014', 7, 3, 'scheduled', 'scheduled', 'outbound', '0123456795', TIMESTAMP '2024-01-23 11:00:00', 'Contrôle BPCO et réhabilitation'),
('CALL015', 9, 1, 'scheduled', 'scheduled', 'outbound', '0123456797', TIMESTAMP '2024-01-24 10:00:00', 'Suivi Alzheimer et évaluation cognitive');

-- Insertion de dossiers médicaux
INSERT INTO medical_records (patient_id, call_id, record_type, title, content, severity, ai_generated, created_by_user_id) VALUES
(1, 1, 'consultation', 'Suivi hypertension et diabète', 'Patient Claude Dubois - Contrôle tension artérielle : 135/85 mmHg. Glycémie à jeun : 1.26 g/l. Poids stable : 78 kg. Traitement bien toléré. Pas d''effet indésirable rapporté. Recommandations : Continuer le régime hyposodé, activité physique modérée 30 min/jour.', 'modere', 0, 1),
(2, 2, 'consultation', 'Suivi asthme', 'Patient Françoise Leroy - Peak flow : 350 L/min (normale : 400-600). Pas de crise d''asthme depuis 3 mois. Technique d''inhalation correcte. Traitement de fond bien suivi. Recommandations : Continuer le traitement, éviter les facteurs déclenchants.', 'faible', 0, 2),
(3, 3, 'consultation', 'Suivi insuffisance cardiaque', 'Patient Marcel Moreau - INR : 2.8 (cible 2-3). Pas d''œdème des membres inférieurs. Dyspnée stable. Poids : 72 kg (stable). Traitement anticoagulant bien équilibré. Surveillance renforcée recommandée.', 'eleve', 0, 1),
(4, 4, 'consultation', 'Suivi dépression et anxiété', 'Patient Jeanne Simon - Échelle de dépression : 8/21 (amélioration). Moins d''anxiété, meilleur sommeil. Humeur plus stable. Ajustement alprazolam : 0.25mg au lieu de 0.5mg. Continuer la psychothérapie.', 'modere', 0, 3),
(5, 5, 'consultation', 'Suivi diabète type 1', 'Patient Robert Michel - Glycémie instable avec 3 hypoglycémies cette semaine. HbA1c : 8.2% (objectif <7%). Ajustement insuline : +2 unités le matin, -1 unité le soir. Surveillance glycémique renforcée.', 'eleve', 0, 2);

-- Insertion de transcriptions IA simulées
INSERT INTO ai_transcriptions (call_id, text, confidence, language, duration, model_used, processing_time) VALUES
(1, 'Bonjour Monsieur Dubois, c''est le Dr Dupont. Comment allez-vous aujourd''hui ? - Bonjour docteur, ça va plutôt bien. Ma tension est stable. - Parfait, pouvez-vous me donner vos chiffres de tension de cette semaine ? - Oui, j''ai noté : lundi 135/85, mardi 130/80, mercredi 140/90...', 0.95, 'fr', 780, 'whisper-large-v3', 2.3),
(2, 'Bonjour Madame Leroy, c''est le Dr Martin. Comment se passe votre asthme ? - Bonjour docteur, ça va mieux. J''ai eu une petite crise il y a 10 jours mais ça s''est bien passé avec la Ventoline. - Avez-vous fait votre peak flow ce matin ? - Oui, 350. - C''est bien, c''est dans vos normes...', 0.92, 'fr', 660, 'whisper-large-v3', 1.8),
(3, 'Bonjour Monsieur Moreau, c''est le Dr Dupont. Comment vous sentez-vous ? - Bonjour docteur, je me sens fatigué mais pas plus que d''habitude. - Avez-vous des œdèmes aux jambes ? - Non, pas plus que d''habitude. - Parfait, votre INR est à 2.8, c''est parfait...', 0.89, 'fr', 1020, 'whisper-large-v3', 3.1);

-- Insertion d'analyses IA simulées
INSERT INTO ai_analyses (call_id, summary, sentiment, urgency_level, medical_notes, recommendations, confidence, model_used, processing_time) VALUES
(1, 'Consultation de suivi pour hypertension et diabète. Patient stable avec tension et glycémie dans les objectifs. Traitement bien toléré.', 'positif', 'faible', 'Tension artérielle : 135/85 mmHg. Glycémie à jeun : 1.26 g/l. Poids stable. Pas d''effet indésirable.', 'Continuer le traitement actuel. Maintenir le régime hyposodé. Activité physique modérée.', 0.94, 'gpt-4', 1.2),
(2, 'Suivi asthme chronique. Patient stable avec peak flow normal. Pas de crise récente. Technique d''inhalation correcte.', 'positif', 'faible', 'Peak flow : 350 L/min. Pas de crise depuis 3 mois. Traitement de fond bien suivi.', 'Continuer le traitement de fond. Éviter les facteurs déclenchants. Surveillance peak flow.', 0.91, 'gpt-4', 0.9),
(3, 'Suivi insuffisance cardiaque. INR dans les objectifs. Pas d''œdème. Patient stable mais surveillance renforcée nécessaire.', 'neutre', 'modere', 'INR : 2.8. Pas d''œdème. Dyspnée stable. Poids stable.', 'Maintenir la surveillance INR. Contrôle poids quotidien. Consultation en cas d''aggravation.', 0.93, 'gpt-4', 1.1);

-- Insertion de logs système
INSERT INTO system_logs (level, logger, message, module, function, user_id, ip_address) VALUES
('INFO', 'call_service', 'Appel CALL001 démarré pour patient P001', 'calls', 'start_call', 1, '192.168.1.100'),
('INFO', 'call_service', 'Appel CALL001 terminé - durée: 13 minutes', 'calls', 'end_call', 1, '192.168.1.100'),
('INFO', 'ai_service', 'Transcription IA générée pour CALL001', 'ai', 'transcribe_call', 1, '192.168.1.100'),
('INFO', 'ai_service', 'Analyse IA générée pour CALL001', 'ai', 'analyze_call', 1, '192.168.1.100'),
('WARNING', 'auth_service', 'Tentative de connexion échouée pour utilisateur inconnu', 'auth', 'login', NULL, '192.168.1.105');

-- Insertion de logs d'audit
INSERT INTO audit_logs (action, resource_type, resource_id, user_id, old_values, new_values, ip_address, user_agent) VALUES
('CREATE', 'call', 1, 1, NULL, '{"call_id": "CALL001", "patient_id": 1, "status": "completed"}', '192.168.1.100', 'HelloJADE-Desktop/1.0'),
('UPDATE', 'patient', 1, 1, '{"last_contact": null}', '{"last_contact": "2024-01-15 10:15:00"}', '192.168.1.100', 'HelloJADE-Desktop/1.0'),
('CREATE', 'medical_record', 1, 1, NULL, '{"record_type": "consultation", "title": "Suivi hypertension"}', '192.168.1.100', 'HelloJADE-Desktop/1.0'),
('VIEW', 'patient', 2, 2, NULL, NULL, '192.168.1.101', 'HelloJADE-Desktop/1.0'),
('UPDATE', 'call', 2, 2, '{"status": "scheduled"}', '{"status": "completed"}', '192.168.1.101', 'HelloJADE-Desktop/1.0');

-- Commit des changements
COMMIT;

-- Affichage du statut
SELECT 'Données de test HelloJADE insérées avec succès' AS status FROM dual;
SELECT COUNT(*) AS total_patients FROM patients;
SELECT COUNT(*) AS total_calls FROM calls;
SELECT COUNT(*) AS total_users FROM users; 