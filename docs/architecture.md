<h1 style="color:#0d47a1;">Architecture du projet</h1>

Bienvenue dans l'architecture de notre projet !  
Nous allons essayer de comprendre ensemble comment notre **frontend** a été conçu à l'aide d'un schéma clair, puis explorer le **backend**, ainsi que l'architecture de notre **chatbot**.  
Nous verrons également comment les **données sont véhiculées à l'intérieur de l'application**, étape par étape, pour que vous puissiez avoir une vue globale et compréhensible du fonctionnement du projet.


## <h2 style="color:#0d47a1;">Partie A : Architecture Backend</h2>


Dans cette partie, nous allons explorer comment notre backend a été conçu, comment les différents composants interagissent et comment les données circulent à l’intérieur de l’application.

Cette vue d’ensemble vous aidera à comprendre :

- La structure du projet backend
- Les principaux modules et services
- La communication avec le frontend et le chatbot
- Les flux de données et la logique métier


<h2 style="color:#0d47a1;">Partie A.1 : Diagramme de Cas d’Utilisation – Étudiant</h2>

La figure suivante présente le **diagramme de cas d’utilisation de l’acteur Étudiant**.

Ce diagramme met en évidence les différentes interactions possibles de l’étudiant avec le système, tout en respectant les contraintes fonctionnelles définies afin d’assurer une séparation claire des rôles au sein de la plateforme.

---

### <h2 style="color:#0d47a1;">Contraintes associées au rôle Étudiant<h2>

L’étudiant :

-  Ne peut pas créer, modifier ou supprimer des cours  
-  Ne peut pas créer des annonces  
-  Ne peut pas créer des projets (il peut uniquement être membre d’un projet)  
-  Ne peut pas voir les données des autres utilisateurs  

-  Peut consulter uniquement les cours auxquels il est inscrit  
-  Doit être inscrit pour accéder au contenu d’un cours  
-  Peut passer un quiz lié à un cours auquel il est inscrit  
-  Est limité à **3 tentatives de quiz par jour**  
-  Peut consulter uniquement ses propres stages  
-  Peut consulter uniquement ses propres projets  

---

### <h2 style="color:#0d47a1;">Diagramme de Cas d’Utilisation<h2>

![Diagramme de cas d'utilisation Étudiant](images/diag_use_cas_etud.png)


<h2 style="color:#0d47a1;">6. Diagramme de Cas d’Utilisation – Enseignant (Teacher)</h2>

La figure suivante présente le **diagramme de cas d’utilisation de l’acteur Enseignant**.

Ce diagramme illustre les différentes interactions possibles de l’enseignant avec la plateforme, tout en respectant les règles de gestion et la séparation des rôles définies dans le système.

---

### <h2 style="color:#0d47a1;">Contraintes associées au rôle Enseignant<h2>

L’enseignant :

-  Peut modifier uniquement ses propres cours  
-  Peut uploader des ressources uniquement dans ses cours  
-  Peut accepter ou refuser les demandes d’inscription des étudiants  
-  Peut créer des annonces  
-  Peut consulter les statistiques de ses étudiants  
-  Est automatiquement superviseur des projets qu’il crée  
-  Peut suivre l’évolution académique de ses étudiants  
-  Peut créer un quiz à partir de l’IA via un système de **RAG (Retrieval-Augmented Generation)**  
-  Peut interagir avec un chatbot en cas de difficulté  
-  Peut supprimer un étudiant de son propre cours  

-  Ne peut pas modifier les cours des autres enseignants  
-  Ne peut pas accéder aux données privées d’autres enseignants  

---

### <h2 style="color:#0d47a1;">Diagramme de Cas d’Utilisation – Enseignant<h2>

![Diagramme de cas d'utilisation Enseignant](images/casutilisationEnseignant.png)

<h2 style="color:#0d47a1;">7. Diagramme de Cas d’Utilisation – Administrateur</h2>

La figure suivante présente le **diagramme de cas d’utilisation de l’acteur Administrateur**.

L’administrateur est le gestionnaire principal de la plateforme.  
Il dispose d’un contrôle global sur l’ensemble du système afin d’assurer le bon fonctionnement, la sécurité et la supervision générale de l’application.

Il possède des privilèges étendus qui lui permettent d’intervenir sur toutes les entités du système et, si nécessaire, d’outrepasser certaines règles métier.

---

### <h2 style="color:#0d47a1;">Contraintes associées au rôle Administrateur<h2>

L’administrateur :

- A tous les droits sur l’ensemble des entités de la plateforme  
- Peut outrepasser les règles métier (forcer des inscriptions, modifier des affectations, etc.)  
- Est le seul à avoir accès aux logs système  
- Peut gérer les utilisateurs de tous les rôles (création, modification, suppression, activation, suspension)  
- A accès à toutes les statistiques globales de la plateforme  
- Supervise les agents IA intégrés au système  

---

### <h2 style="color:#0d47a1;">Diagramme de Cas d’Utilisation – Administrateur<h2>

![Diagramme de cas d'utilisation Administrateur](images/casutilisationadmin.png)


<h2 style="color:#0d47a1;">8. Diagramme de Séquence – Inscription à un Cours (Étudiant)</h2>

Après avoir présenté les différents diagrammes de cas d’utilisation, nous nous orientons maintenant vers les **diagrammes de séquence**.

Ces diagrammes permettent de visualiser, étape par étape, les interactions entre les différents composants du système pour un scénario précis.

Nous débutons par le scénario suivant : **inscription d’un étudiant à un cours**.

---

### <h2 style="color:#0d47a1;">Contraintes validées pour l’inscription<h2>

Pour que l’étudiant puisse s’inscrire à un cours, les conditions suivantes doivent être respectées :

- L’étudiant doit avoir le rôle **STUDENT**  
- L’étudiant ne doit pas déjà être inscrit au cours  
- Le cours doit exister dans la plateforme  
- L’étudiant doit être authentifié  

---

### <h2 style="color:#0d47a1;">Diagramme de Séquence – Inscription à un Cours<h2>

![Diagramme de séquence Inscription Étudiant](images/INSCRIPTION_UN_COURSEtudiant.png)


<h2 style="color:#0d47a1;">9. Diagramme de Séquence – Passer un Quiz Adaptatif (Étudiant)</h2>

Dans cette partie, nous présentons le **diagramme de séquence pour le passage d’un quiz adaptatif par un étudiant**.  
Ce diagramme illustre les interactions entre l’étudiant, le frontend, le backend et le système de génération de quiz adaptatif, étape par étape.

Avant de pouvoir accéder au quiz, certaines contraintes doivent être vérifiées pour garantir la validité du processus.

---

### <h2 style="color:#0d47a1;">Contraintes vérifiées avant de passer le quiz<h2>

Pour qu’un étudiant puisse passer un quiz adaptatif :

- L’étudiant ne doit pas dépasser le nombre maximum de tentatives par jour :  
  **MAX_ATTEMPTS_PER_DAY = 3**  
- Un délai minimal doit être respecté entre deux tentatives :  
  **MIN_TIME_BETWEEN_ATTEMPTS_MINUTES = 30 minutes**  
- Le cours doit contenir au moins **un fichier** pour générer des questions  
- Le quiz est généré **uniquement à partir du contenu des fichiers** du cours  

---

### <h2 style="color:#0d47a1;">Diagramme de Séquence – Passage du Quiz<h2>

![Diagramme de séquence Passage Quiz Étudiant](images/seqgenerationquiz.png)



<h2 style="color:#0d47a1;">10. Diagramme de Séquence – Génération de Quiz par IA</h2>

Cette section présente le **diagramme de séquence pour la génération d’un quiz par IA**.  
Le diagramme illustre les interactions entre l’étudiant, le backend, et le moteur IA qui génère le quiz de manière adaptative.

Avant de générer le quiz, certaines contraintes métier doivent être vérifiées pour assurer la qualité et la cohérence des questions.

---

### <h2 style="color:#0d47a1;">Contraintes de génération<h2>

Pour qu’un quiz soit généré correctement :

- Le quiz doit contenir **minimum 15 questions valides** (sur 20 demandées)  
- **Maximum 20 questions** peuvent être générées  
- Si le nombre de questions valides est inférieur à 10, un **fallback automatique** est déclenché  
- Les questions doivent être basées **uniquement sur le contenu fourni**  
- Aucune question **hors-sujet ou générique** ne doit être incluse  

---

<h2 style="color:#0d47a1;">Diagramme de Séquence – Génération de Quiz IA</h2>

![Diagramme de séquence Génération Quiz IA](images/seqgenerationquiz.png)

---

<h2 style="color:#0d47a1;">Récapitulatif des principales contraintes métier</h2>

<div style="width: 100%; margin: 0; padding: 0; overflow-x:auto;">
<table style="border: 1px solid #0d47a1; border-collapse: collapse; width: 100%; table-layout: fixed; margin: 0; padding: 0;">
<thead>
<tr style="background-color:#0d47a1; color:white; text-align:left;">
<th style="border: 1px solid #0d47a1; padding: 6px; width:33%;">Entité</th>
<th style="border: 1px solid #0d47a1; padding: 6px; width:33%;">Contrainte</th>
<th style="border: 1px solid #0d47a1; padding: 6px; width:34%;">Règle</th>
</tr>
</thead>
<tbody>
<tr>
<td style="border: 1px solid #0d47a1; padding: 6px;">User</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">email</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">Unique, format email valide</td>
</tr>
<tr>
<td style="border: 1px solid #0d47a1; padding: 6px;">User</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">username</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">Unique, 3-50 caractères</td>
</tr>
<tr>
<td style="border: 1px solid #0d47a1; padding: 6px;">User</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">password</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">Min 6 caractères, hashé</td>
</tr>
<tr>
<td style="border: 1px solid #0d47a1; padding: 6px;">Course</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">teacher</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">Obligatoire, doit être TEACHER</td>
</tr>
<tr>
<td style="border: 1px solid #0d47a1; padding: 6px;">Course</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">students</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">Pas de doublons (jointure)</td>
</tr>
<tr>
<td style="border: 1px solid #0d47a1; padding: 6px;">QuizAttempt</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">maxAttemptsPerDay</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">3 par jour max</td>
</tr>
<tr>
<td style="border: 1px solid #0d47a1; padding: 6px;">QuizAttempt</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">minTimeBetween</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">30 minutes minimum</td>
</tr>
<tr>
<td style="border: 1px solid #0d47a1; padding: 6px;">QuizAttempt</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">timeout</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">60 minutes max</td>
</tr>
<tr>
<td style="border: 1px solid #0d47a1; padding: 6px;">Question</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">options</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">4 options pour QCM</td>
</tr>
<tr>
<td style="border: 1px solid #0d47a1; padding: 6px;">Question</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">correctAnswer</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">Doit être dans options</td>
</tr>
<tr>
<td style="border: 1px solid #0d47a1; padding: 6px;">KnowledgeBase</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">embedding</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">768 dimensions (Gemini)</td>
</tr>
<tr>
<td style="border: 1px solid #0d47a1; padding: 6px;">QuizRecommendation</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">confidenceScore</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">0.0 à 1.0</td>
</tr>
<tr>
<td style="border: 1px solid #0d47a1; padding: 6px;">CourseFile</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">uploadedBy</td>
<td style="border: 1px solid #0d47a1; padding: 6px;">Doit être le teacher du cours</td>
</tr>
</tbody>
</table>
</div>


----

<h2 style="color:#0d47a1;">Diagramme de Communication – Agents & RAG</h2>

<p>
Les agents communiquent entre eux et avec le système <strong>RAG</strong>. 
Ce diagramme de communication permet de comprendre comment la génération et la supervision des quiz sont effectuées, ainsi que par qui cette supervision est assurée.
</p>

![Diagramme de communication Agents & RAG](images/diagrame_communication_agent_rag.png)

----

<h2 style="color:#0d47a1;">Flux de Communication – Initiation de Quiz Adaptatif</h2>

<p>
Ce flux décrit le processus complet lorsque l'étudiant demande à démarrer un quiz adaptatif sur un cours spécifique. 
Le système va vérifier son éligibilité, analyser sa progression, puis générer un quiz personnalisé basé sur le contenu réel du cours.
</p>

<h3 style="color:#0d47a1;">Les Acteurs du Flux</h3>

<table style="border:1px solid #0d47a1; border-collapse:collapse; width:100%; table-layout:fixed;">
<thead>
<tr style="background-color:#0d47a1; color:white; text-align:left;">
<th style="border:1px solid #0d47a1; padding:6px;">Acteur</th>
<th style="border:1px solid #0d47a1; padding:6px;">Rôle</th>
</tr>
</thead>
<tbody>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">Étudiant</td>
<td style="border:1px solid #0d47a1; padding:6px;">Utilisateur qui veut passer un quiz</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">AdaptiveQuizOrchestrator</td>
<td style="border:1px solid #0d47a1; padding:6px;">Chef d'orchestre qui coordonne tous les agents</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">CourseQuizSupervisorAgent</td>
<td style="border:1px solid #0d47a1; padding:6px;">Agent qui vérifie les règles métier (tentatives, délais)</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">ProgressTrackerAgent</td>
<td style="border:1px solid #0d47a1; padding:6px;">Agent qui analyse la progression de l'étudiant</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">RAGQuizService</td>
<td style="border:1px solid #0d47a1; padding:6px;">Service principal de génération de quiz par IA</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">VectorRAGService</td>
<td style="border:1px solid #0d47a1; padding:6px;">Service de recherche sémantique dans la base de connaissances</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">KnowledgeBase</td>
<td style="border:1px solid #0d47a1; padding:6px;">Base de connaissances contenant les embeddings des fichiers</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">Gemini AI</td>
<td style="border:1px solid #0d47a1; padding:6px;">Intelligence artificielle externe (Google Gemini)</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">Base de données</td>
<td style="border:1px solid #0d47a1; padding:6px;">Stockage des données (tentatives, profils, fichiers)</td>
</tr>
</tbody>
</table>

<h3 style="color:#0d47a1;">Étapes Détaillées du Flux</h3>

<p><strong>ÉTAPE 1 : DEMANDE DE L'ÉTUDIANT</strong><br>
L'étudiant envoie une requête pour initier un quiz sur un cours spécifique (ex. ID 456). 
L'AdaptiveQuizOrchestrator reçoit cette demande avec l'ID de l'étudiant et l'ID du cours.</p>

<p><strong>ÉTAPE 2 : VÉRIFICATION D'ÉLIGIBILITÉ</strong><br>
L'orchestrateur demande au CourseQuizSupervisorAgent de vérifier si l'étudiant peut passer le quiz. 
Le superviseur consulte le ProgressTrackerAgent pour obtenir l'analyse de progression. 
Le ProgressTrackerAgent interroge la base de données pour récupérer les tentatives précédentes, leurs scores et dates.</p>

<p><strong>ÉTAPE 3 : ANALYSE DE PROGRESSION</strong><br>
Le ProgressTrackerAgent retourne au superviseur une ProgressAnalysis : nombre de tentatives, score moyen, points forts/faibles, dernière activité. 
Le CourseQuizSupervisorAgent applique les règles métier : max 3 tentatives/jour, min 30 min entre deux tentatives, vérification d'inscription. 
Si OK, retour à l'orchestrateur avec QuizEligibilityResponse positive.</p>

<p><strong>ÉTAPE 4 : GÉNÉRATION DU QUIZ PERSONNALISÉ</strong><br>
L'orchestrateur demande au RAGQuizService de générer le quiz. 
Le service récupère tous les fichiers du cours (PDF, docs texte, etc.) depuis la base de données.</p>

<p><strong>ÉTAPE 5 : RECHERCHE DE CONTENU PERTINENT</strong><br>
Pour chaque fichier, contenu textuel extrait. 
Le RAGQuizService demande au VectorRAGService de trouver le contenu le plus pertinent via embeddings (768 dimensions) et mots-clés. 
Les 5 documents les plus pertinents sont fusionnés.</p>

<p><strong>ÉTAPE 6 : CONSTRUCTION DU PROMPT ET GÉNÉRATION IA</strong><br>
Le RAGQuizService construit un prompt structuré avec titre, contenu, profil étudiant et instructions strictes. 
Prompt envoyé à Gemini AI : "Génère 20 questions basées uniquement sur ce contenu".</p>

<p><strong>ÉTAPE 7 : VALIDATION ET RETOUR</strong><br>
Gemini retourne 18–20 questions. RAGQuizService valide chaque question : texte non vide, options valides, réponse correcte existante. 
Si ≥15 questions valides, construit QuizResponseDTO et retourne à l'orchestrateur, qui le transmet à l'étudiant.</p>

<p><strong>ÉTAPE 8 : MISE À JOUR (OPTIONNELLE)</strong><br>
Orchestrateur demande au ProgressTrackerAgent de créer une nouvelle entrée de tentative ("IN_PROGRESS").</p>

<h3 style="color:#0d47a1;">Règles Métier Appliquées</h3>

<table style="border:1px solid #0d47a1; border-collapse:collapse; width:100%; table-layout:fixed;">
<thead>
<tr style="background-color:#0d47a1; color:white; text-align:left;">
<th style="border:1px solid #0d47a1; padding:6px;">Règle</th>
<th style="border:1px solid #0d47a1; padding:6px;">Valeur</th>
<th style="border:1px solid #0d47a1; padding:6px;">Appliquée par</th>
</tr>
</thead>
<tbody>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">Maximum de tentatives par jour</td>
<td style="border:1px solid #0d47a1; padding:6px;">3</td>
<td style="border:1px solid #0d47a1; padding:6px;">CourseQuizSupervisorAgent</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">Délai minimum entre tentatives</td>
<td style="border:1px solid #0d47a1; padding:6px;">30 minutes</td>
<td style="border:1px solid #0d47a1; padding:6px;">CourseQuizSupervisorAgent</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">Temps maximum par quiz</td>
<td style="border:1px solid #0d47a1; padding:6px;">60 minutes</td>
<td style="border:1px solid #0d47a1; padding:6px;">CourseQuizSupervisorAgent</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">Nombre de questions générées</td>
<td style="border:1px solid #0d47a1; padding:6px;">20</td>
<td style="border:1px solid #0d47a1; padding:6px;">RAGQuizService</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">Minimum de questions acceptables</td>
<td style="border:1px solid #0d47a1; padding:6px;">15</td>
<td style="border:1px solid #0d47a1; padding:6px;">RAGQuizService</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">Sources autorisées</td>
<td style="border:1px solid #0d47a1; padding:6px;">Uniquement les fichiers du cours</td>
<td style="border:1px solid #0d47a1; padding:6px;">RAGQuizService</td>
</tr>
</tbody>
</table>

<h3 style="color:#0d47a1;">Diagramme du Flux de Communication</h3>

![Flux de communication Quiz Adaptatif](images/FLUX_DE_COMMUNICATION_QUIZ_ADAPTATIF.png)


<h2 style="color:#0d47a1;">Diagramme de Communication – RAG avec Vector Store</h2>

<p>
Cette section détaille la communication entre les services pour la génération de quiz IA via RAG et Vector Store.
Les étapes principales sont les suivantes :
</p>

<ul>
<li><strong>EmbeddingService</strong> : convertit la requête en vecteur (768 dimensions).</li>
<li><strong>VectorRAGService</strong> : effectue une recherche par similarité cosinus.</li>
<li>Recherche textuelle parallèle avec mots-clés pour enrichir les résultats.</li>
<li>Fusion hybride : combine les résultats vectoriels et textuels.</li>
<li><strong>RAGQuizGenerationService</strong> : construit le prompt avec les résultats obtenus.</li>
<li><strong>Gemini AI</strong> : génère les questions basées sur le contexte fourni.</li>
</ul>

![Diagramme de communication RAG avec Vector Store](images/diag_comu_rag_vec.png)


<h2 style="color:#0d47a1;">Diagramme de Communication – Profil Apprenant</h2>

<p>
Cette section décrit la communication et les mises à jour du profil apprenant. 
Les agents analysent les performances et comportements, mettent à jour le LearningProfile, et génèrent des recommandations personnalisées.
</p>

<h3 style="color:#0d47a1;">Mise à jour du profil</h3>

<ul>
<li><strong>ProgressTrackerAgent</strong> : analyse les performances aux quiz.</li>
<li><strong>GapAnalyzer</strong> : identifie les points faibles (scores &lt; 60%).</li>
<li><strong>BehaviorAnalyzer</strong> : détecte les centres d'intérêt via interactions.</li>
<li><strong>ProfileUpdater</strong> : met à jour le LearningProfile en base.</li>
<li><strong>RecommendationEngineAgent</strong> : génère des recommandations personnalisées.</li>
</ul>

<h3 style="color:#0d47a1;">Les Acteurs du Flux</h3>

<table style="border:1px solid #0d47a1; border-collapse:collapse; width:100%; table-layout:fixed;">
<thead>
<tr style="background-color:#0d47a1; color:white; text-align:left;">
<th style="border:1px solid #0d47a1; padding:6px;">Acteur</th>
<th style="border:1px solid #0d47a1; padding:6px;">Rôle</th>
<th style="border:1px solid #0d47a1; padding:6px;">Données manipulées</th>
</tr>
</thead>
<tbody>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">QuizAttempts</td>
<td style="border:1px solid #0d47a1; padding:6px;">Historique des tentatives de quiz</td>
<td style="border:1px solid #0d47a1; padding:6px;">Scores, dates, questions réussies/échouées</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">UserInteractions</td>
<td style="border:1px solid #0d47a1; padding:6px;">Comportement de navigation</td>
<td style="border:1px solid #0d47a1; padding:6px;">Pages visitées, temps passé, recherches</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">ProgressTrackerAgent</td>
<td style="border:1px solid #0d47a1; padding:6px;">Analyseur de progression</td>
<td style="border:1px solid #0d47a1; padding:6px;">Statistiques de performance, tendances</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">BehaviorAnalyzer</td>
<td style="border:1px solid #0d47a1; padding:6px;">Analyseur comportemental</td>
<td style="border:1px solid #0d47a1; padding:6px;">Centres d'intérêt, préférences</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">GapAnalyzer</td>
<td style="border:1px solid #0d47a1; padding:6px;">Analyseur de lacunes</td>
<td style="border:1px solid #0d47a1; padding:6px;">Points faibles, concepts à réviser</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">ProfileUpdater</td>
<td style="border:1px solid #0d47a1; padding:6px;">Mise à jour du profil</td>
<td style="border:1px solid #0d47a1; padding:6px;">Fusion des analyses en profil cohérent</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">LearningProfile</td>
<td style="border:1px solid #0d47a1; padding:6px;">Profil stocké en base</td>
<td style="border:1px solid #0d47a1; padding:6px;">Niveau, intérêts, faiblesses, style d'apprentissage</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">RecommendationEngineAgent</td>
<td style="border:1px solid #0d47a1; padding:6px;">Moteur de recommandations</td>
<td style="border:1px solid #0d47a1; padding:6px;">Suggestions personnalisées</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">QuizRecommendations</td>
<td style="border:1px solid #0d47a1; padding:6px;">Recommandations générées</td>
<td style="border:1px solid #0d47a1; padding:6px;">Quiz suggérés, raisons, priorité</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">LearningPath</td>
<td style="border:1px solid #0d47a1; padding:6px;">Parcours personnalisé</td>
<td style="border:1px solid #0d47a1; padding:6px;">Séquence de recommandations</td>
</tr>
</tbody>
</table>

<h3 style="color:#0d47a1;">Diagramme de Communication</h3>

![Diagramme de communication Profil Apprenant](images/diag_com_prof_etud.png)


<h2 style="color:#0d47a1;">Diagramme de Séquence – Génération de Quiz RAG Complet</h2>

<p>
Cette section détaille le processus complet de génération d'un quiz par RAG (Retrieval-Augmented Generation). 
À partir des fichiers du cours, le système extrait le contenu, recherche les passages pertinents via embeddings vectoriels, et demande à Gemini de générer des questions basées uniquement sur ce contenu.
</p>

<h3 style="color:#0d47a1;">Les Acteurs du Flux</h3>

<table style="border:1px solid #0d47a1; border-collapse:collapse; width:100%; table-layout:fixed;">
<thead>
<tr style="background-color:#0d47a1; color:white; text-align:left;">
<th style="border:1px solid #0d47a1; padding:6px;">Acteur</th>
<th style="border:1px solid #0d47a1; padding:6px;">Rôle</th>
<th style="border:1px solid #0d47a1; padding:6px;">Responsabilité</th>
</tr>
</thead>
<tbody>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">Étudiant</td>
<td style="border:1px solid #0d47a1; padding:6px;">Demandeur</td>
<td style="border:1px solid #0d47a1; padding:6px;">Initie la demande de quiz</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">CourseQuizSupervisorAgent</td>
<td style="border:1px solid #0d47a1; padding:6px;">Superviseur</td>
<td style="border:1px solid #0d47a1; padding:6px;">Vérifie l'éligibilité et coordonne</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">RAGQuizService</td>
<td style="border:1px solid #0d47a1; padding:6px;">Service principal</td>
<td style="border:1px solid #0d47a1; padding:6px;">Orchestre toute la génération RAG</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">VectorRAGService</td>
<td style="border:1px solid #0d47a1; padding:6px;">Recherche sémantique</td>
<td style="border:1px solid #0d47a1; padding:6px;">Trouve le contenu pertinent par similarité</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">KnowledgeBase</td>
<td style="border:1px solid #0d47a1; padding:6px;">Base de connaissances</td>
<td style="border:1px solid #0d47a1; padding:6px;">Stocke les embeddings et le contenu</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">EmbeddingService</td>
<td style="border:1px solid #0d47a1; padding:6px;">Générateur de vecteurs</td>
<td style="border:1px solid #0d47a1; padding:6px;">Convertit le texte en vecteurs mathématiques</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">Gemini AI</td>
<td style="border:1px solid #0d47a1; padding:6px;">Générateur de questions</td>
<td style="border:1px solid #0d47a1; padding:6px;">Crée les questions à partir du prompt</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">Base de données</td>
<td style="border:1px solid #0d47a1; padding:6px;">Stockage</td>
<td style="border:1px solid #0d47a1; padding:6px;">Contient les fichiers du cours</td>
</tr>
</tbody>
</table>

<h3 style="color:#0d47a1;">Étapes Détaillées</h3>

<ol>
<li><strong>Demande initiale :</strong> L'étudiant envoie une requête pour initier un quiz sur un cours spécifique. Le superviseur vérifie l'éligibilité.</li>
<li><strong>Déclenchement de la génération RAG :</strong> Le superviseur appelle <code>RAGQuizService.generatePersonalizedQuizForCourse</code>.</li>
<li><strong>Récupération des fichiers du cours :</strong> PDF, documents texte, présentations et autres ressources pédagogiques.</li>
<li><strong>Extraction du contenu des fichiers :</strong> PDFBox pour les PDFs, lecture directe pour .txt/.md/.csv/.json, contenu minimal pour autres formats.</li>
<li><strong>Préparation de la recherche vectorielle :</strong> Le titre du cours et profil étudiant sont utilisés pour prioriser le contenu.</li>
<li><strong>Génération de l'embedding de requête :</strong> EmbeddingService convertit le texte en vecteur de 768 dimensions via Gemini.</li>
<li><strong>Recherche vectorielle :</strong> VectorRAGService recherche les documents les plus similaires dans la KnowledgeBase.</li>
<li><strong>Recherche textuelle parallèle :</strong> Recherche par mots-clés pour compléter la recherche vectorielle.</li>
<li><strong>Fusion hybride des résultats :</strong> Combinaison des top documents vectoriels et textuels, classement et bonus pour intérêts et popularité.</li>
<li><strong>Construction du prompt RAG :</strong> Création d'un prompt structuré pour Gemini avec instructions strictes et contenu exact du cours.</li>
<li><strong>Appel à Gemini AI :</strong> Génération de 18-20 questions strictement basées sur le contenu fourni.</li>
<li><strong>Validation des questions :</strong> Vérification de texte, type, options, réponse correcte et explications.</li>
<li><strong>Gestion du nombre de questions :</strong> Minimum 15 questions valides, fallback automatique si nécessaire.</li>
<li><strong>Construction de la réponse finale :</strong> QuizResponseDTO avec toutes les questions validées et métadonnées.</li>
<li><strong>Retour à l'utilisateur :</strong> Le quiz final est transmis à l'étudiant via le superviseur avec toutes les informations nécessaires.</li>
</ol>

<h3 style="color:#0d47a1;">Statistiques de Génération</h3>

<table style="border:1px solid #0d47a1; border-collapse:collapse; width:100%; table-layout:fixed;">
<thead>
<tr style="background-color:#0d47a1; color:white; text-align:left;">
<th style="border:1px solid #0d47a1; padding:6px;">Métrique</th>
<th style="border:1px solid #0d47a1; padding:6px;">Valeur typique</th>
</tr>
</thead>
<tbody>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">Temps total</td>
<td style="border:1px solid #0d47a1; padding:6px;">3-8 secondes</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">Questions générées</td>
<td style="border:1px solid #0d47a1; padding:6px;">18-20</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">Questions validées</td>
<td style="border:1px solid #0d47a1; padding:6px;">15-20</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">Fichiers analysés</td>
<td style="border:1px solid #0d47a1; padding:6px;">1-15</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">Tokens envoyés à Gemini</td>
<td style="border:1px solid #0d47a1; padding:6px;">8000-15000</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">Taux de succès</td>
<td style="border:1px solid #0d47a1; padding:6px;">95%</td>
</tr>
</tbody>
</table>

<h3 style="color:#0d47a1;">Points Clés à Retenir</h3>

<ul>
<li>Fidélité au contenu : Les questions sont basées exclusivement sur les fichiers du cours.</li>
<li>Double recherche : Vectorielle + textuelle pour une pertinence maximale.</li>
<li>Personnalisation : Le profil de l'étudiant influence le choix des documents.</li>
<li>Validation stricte : Pas de questions mal formées.</li>
<li>Résilience : Fallback automatique en cas d'échec.</li>
<li>Traçabilité : Chaque question a une source identifiable.</li>
</ul>

![Diagramme de séquence Génération Quiz RAG Complet](images/generation_quiz_complet_diag.png)



<h2 style="color:#0d47a1;">Diagramme de Communication – Système Complet</h2>

<p>
Ce diagramme présente l'architecture complète de l'application SmartHub, montrant comment tous les composants interagissent entre eux, depuis l'interface utilisateur jusqu'aux services externes, en passant par les agents intelligents et la base de connaissances.
</p>

![Diagramme de Communication Système Complet](images/diag_system_complet.png)

<h3 style="color:#0d47a1;">Tableau Récapitulatif – Communications</h3>

<table style="border:1px solid #0d47a1; border-collapse:collapse; width:100%; table-layout:fixed;">
<thead>
<tr style="background-color:#0d47a1; color:white; text-align:left;">
<th style="border:1px solid #0d47a1; padding:6px;">Agent/Source</th>
<th style="border:1px solid #0d47a1; padding:6px;">Communique avec</th>
<th style="border:1px solid #0d47a1; padding:6px;">Méthode</th>
<th style="border:1px solid #0d47a1; padding:6px;">Données échangées</th>
<th style="border:1px solid #0d47a1; padding:6px;">Fréquence</th>
</tr>
</thead>
<tbody>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">AdaptiveQuizOrchestrator</td>
<td style="border:1px solid #0d47a1; padding:6px;">CourseQuizSupervisorAgent</td>
<td style="border:1px solid #0d47a1; padding:6px;">checkEligibility()</td>
<td style="border:1px solid #0d47a1; padding:6px;">userId, courseId → EligibilityResponse</td>
<td style="border:1px solid #0d47a1; padding:6px;">À chaque tentative</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">ProgressTrackerAgent</td>
<td style="border:1px solid #0d47a1; padding:6px;">analyzeProgress()</td>
<td style="border:1px solid #0d47a1; padding:6px;">userId → ProgressAnalysis</td>
<td style="border:1px solid #0d47a1; padding:6px;">À chaque quiz</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">RAGQuizService</td>
<td style="border:1px solid #0d47a1; padding:6px;">generatePersonalizedQuiz()</td>
<td style="border:1px solid #0d47a1; padding:6px;">userId, topic → QuizResponseDTO</td>
<td style="border:1px solid #0d47a1; padding:6px;">À chaque initiation</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">CourseQuizSupervisorAgent</td>
<td style="border:1px solid #0d47a1; padding:6px;">ProgressTrackerAgent</td>
<td style="border:1px solid #0d47a1; padding:6px;">getProgress()</td>
<td style="border:1px solid #0d47a1; padding:6px;">userId → ProgressData</td>
<td style="border:1px solid #0d47a1; padding:6px;">À chaque vérification</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">RAGQuizService</td>
<td style="border:1px solid #0d47a1; padding:6px;">generateCourseQuiz()</td>
<td style="border:1px solid #0d47a1; padding:6px;">courseId → QuizResponseDTO</td>
<td style="border:1px solid #0d47a1; padding:6px;">Si quiz inexistant</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">Base de données</td>
<td style="border:1px solid #0d47a1; padding:6px;">saveAttempt()</td>
<td style="border:1px solid #0d47a1; padding:6px;">QuizAttempt → void</td>
<td style="border:1px solid #0d47a1; padding:6px;">À chaque soumission</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">ProgressTrackerAgent</td>
<td style="border:1px solid #0d47a1; padding:6px;">QuizAttemptRepository</td>
<td style="border:1px solid #0d47a1; padding:6px;">findByStudent()</td>
<td style="border:1px solid #0d47a1; padding:6px;">student → List&lt;QuizAttempt&gt;</td>
<td style="border:1px solid #0d47a1; padding:6px;">À chaque analyse</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">LearningProfile</td>
<td style="border:1px solid #0d47a1; padding:6px;">updateProfile()</td>
<td style="border:1px solid #0d47a1; padding:6px;">profile → void</td>
<td style="border:1px solid #0d47a1; padding:6px;">Après chaque quiz</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">RAGQuizService</td>
<td style="border:1px solid #0d47a1; padding:6px;">VectorRAGService</td>
<td style="border:1px solid #0d47a1; padding:6px;">findRelevantContent()</td>
<td style="border:1px solid #0d47a1; padding:6px;">query, profile → List&lt;KnowledgeBase&gt;</td>
<td style="border:1px solid #0d47a1; padding:6px;">À chaque génération</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">RAGQuizGenerationService</td>
<td style="border:1px solid #0d47a1; padding:6px;">buildPrompt()</td>
<td style="border:1px solid #0d47a1; padding:6px;">content → String</td>
<td style="border:1px solid #0d47a1; padding:6px;">À chaque génération</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">EmbeddingService</td>
<td style="border:1px solid #0d47a1; padding:6px;">generateEmbedding()</td>
<td style="border:1px solid #0d47a1; padding:6px;">text → float[]</td>
<td style="border:1px solid #0d47a1; padding:6px;">Pour recherche vectorielle</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">Gemini AI</td>
<td style="border:1px solid #0d47a1; padding:6px;">generateQuestions()</td>
<td style="border:1px solid #0d47a1; padding:6px;">prompt → List&lt;Question&gt;</td>
<td style="border:1px solid #0d47a1; padding:6px;">À chaque génération</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">VectorRAGService</td>
<td style="border:1px solid #0d47a1; padding:6px;">KnowledgeBase</td>
<td style="border:1px solid #0d47a1; padding:6px;">findSimilarByEmbedding()</td>
<td style="border:1px solid #0d47a1; padding:6px;">embedding → List&lt;KnowledgeBase&gt;</td>
<td style="border:1px solid #0d47a1; padding:6px;">Recherche vectorielle</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">KnowledgeBase</td>
<td style="border:1px solid #0d47a1; padding:6px;">searchByKeyword()</td>
<td style="border:1px solid #0d47a1; padding:6px;">keyword → List&lt;KnowledgeBase&gt;</td>
<td style="border:1px solid #0d47a1; padding:6px;">Recherche textuelle</td>
<td style="border:1px solid #0d47a1; padding:6px;"></td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">EmbeddingService</td>
<td style="border:1px solid #0d47a1; padding:6px;">Gemini AI</td>
<td style="border:1px solid #0d47a1; padding:6px;">generateEmbedding()</td>
<td style="border:1px solid #0d47a1; padding:6px;">text → float[]</td>
<td style="border:1px solid #0d47a1; padding:6px;">Pour créer vecteurs</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">RecommendationEngineAgent</td>
<td style="border:1px solid #0d47a1; padding:6px;">RAGQuizService</td>
<td style="border:1px solid #0d47a1; padding:6px;">getRecommendations()</td>
<td style="border:1px solid #0d47a1; padding:6px;">userId → List&lt;QuizRecommendation&gt;</td>
<td style="border:1px solid #0d47a1; padding:6px;">Périodique</td>
</tr>
<tr>
<td style="border:1px solid #0d47a1; padding:6px;">QuizRecommendation</td>
<td style="border:1px solid #0d47a1; padding:6px;">save()</td>
<td style="border:1px solid #0d47a1; padding:6px;">recommendation → void</td>
<td style="border:1px solid #0d47a1; padding:6px;">À chaque création</td>
</tr>
</tbody>
</table>


## <span style="color:#0d47a1;">Démos du projet</span>

Vous pouvez découvrir le projet via plusieurs ressources :

- **Présentation complète avec explications :**  
  [Voir la vidéo YouTube](https://youtu.be/y0RjRl1l7fE?si=ILAPrpO_GC3_NF_3)  
  *Cette vidéo détaille le projet, son fonctionnement et les choix techniques.*

- **Démo de l’application seulement :**  
  [Voir la démonstration sur LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7423897690977042432/?originTrackingId=00wryq7BSwTZmQ6yxPRm6g%3D%3D)  
  *Accès direct à l’application en action, sans explications supplémentaires.*

- **Code source complet sur GitHub :**  
  [Voir le dépôt GitHub](https://github.com/hinimdoumorsia/smart-education-platform)  
  *Vous pouvez cloner ou explorer le projet complet.*

- **Tester l’application en ligne :**  
  [Accéder à l’application](https://smart-education-platform-3qsejixj2.vercel.app)  
  *Essayez directement l’application depuis votre navigateur.*

