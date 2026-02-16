<h1 style="color:#0d47a1;">Partie Intelligence Artificielle</h1>

<h2 style="color:#1565c0;">1. Intégration d’un Agent IA – Chatbot Intelligent</h2>

Dans cette partie, nous avons intégré un agent IA conversationnel (chatbot) dont l’objectif est de répondre de manière méthodique, structurée et intelligente aux différentes questions des utilisateurs de la plateforme.

Ce chatbot est capable de :

- Résumer les cours de l’utilisateur  
- Répondre à des questions d’ordre général  
- Répondre à des questions spécifiques liées aux contenus pédagogiques  
- Fournir des explications détaillées et contextualisées  

L’agent est conçu pour gérer des questions multiples et variées, tout en maintenant une cohérence dans les réponses.

---

<h2 style="color:#1565c0;">Technologies utilisées</h2>

<h3 style="color:#1e88e5;">Plateforme principale : Botpress</h3>

L’agent a été développé à l’aide de la plateforme Botpress, qui offre :

- Une architecture modulaire avancée  
- Une gestion intelligente des flux conversationnels  
- Une intégration simplifiée des modèles de langage (LLM)  
- Une approche Low-Code / No-Code puissante  

Grâce à ces capacités, nous avons pu concevoir un chatbot performant sans complexité excessive au niveau du développement.

---

<h3 style="color:#1e88e5;">Consommation de modèles LLM</h3>

Le fonctionnement intelligent du chatbot repose sur l’utilisation de modèles de langage avancés (LLM) provenant de grands acteurs du domaine tels que :

- OpenAI  
- Autres fournisseurs de modèles LLM  

Ces modèles permettent :

- La compréhension du langage naturel  
- La génération de réponses pertinentes  
- Le raisonnement contextuel  
- L’adaptation aux différentes intentions utilisateur  

---

<h2 style="color:#1565c0;">Lien vers le Chatbot</h2>

Vous pouvez tester directement notre agent IA via le lien suivant :

[Lancer le chatbot IA](https://cdn.botpress.cloud/webchat/v3.6/shareable.html?configUrl=https://files.bpcontent.cloud/2026/01/05/13/20260105130230-BSGAPUCW.json)

---

<h2 style="color:#1565c0;">Architecture du Bot</h2>

Nous aurions souhaité partager ici l’architecture interne détaillée de notre chatbot (flows, gestion des intents, orchestration LLM, etc.).

Cependant, pour des raisons techniques, cela n’est pas possible dans cette documentation.

À la fin de cette documentation, un lien vers une vidéo YouTube de démonstration sera fourni, où l’architecture complète du bot est expliquée.

---

<h1 style="color:#0d47a1;">Agents IA et LLM pour le Système de RAG</h1>

<<h1 style="color:#0d47a1;">Agents IA et LLM pour le Système de RAG</h1>

<h2 style="color:#1565c0;">Système Multi-Agents Intelligent</h2>

Contrairement au chatbot conversationnel présenté précédemment, le système de RAG n’a pas été mis en place pour le bot.

Il a été conçu pour un autre système plus avancé, basé sur une architecture multi-agents intelligente.

Ce système est composé de plusieurs agents IA spécialisés, capables de collaborer entre eux afin d’assurer une supervision pédagogique complète.

---

<h2 style="color:#1565c0;">Rôle des Agents IA</h2>

Les agents sont capables de :

- Superviser le déroulement d’un cours  
- Générer automatiquement des quiz  
- Corriger les quiz et fournir les résultats  
- Donner des conseils personnalisés  
- Analyser le profil d’un utilisateur (par exemple un élève)  
- Évaluer son niveau académique  
- Lui attribuer un score selon ses performances  
- Configurer dynamiquement la difficulté du quiz  
- Générer un quiz adapté à son profil  

---

<h2 style="color:#1565c0;">Fonctionnement Intelligent</h2>

Le système fonctionne selon une logique adaptative :

1. Analyse du profil de l’élève  
2. Évaluation de son niveau à partir de ses performances précédentes  
3. Attribution d’un score de compétence  
4. Ajustement automatique du niveau de difficulté  
5. Génération d’un quiz personnalisé  

Grâce à l’intégration du RAG (Retrieval-Augmented Generation), les agents peuvent :

- Accéder aux contenus pédagogiques internes  
- Sélectionner les informations pertinentes  
- Générer des questions contextualisées  
- Produire des retours intelligents et adaptés  

---

<h2 style="color:#1565c0;">Objectif du Système</h2>

L’objectif principal de cette architecture multi-agents est de mettre en place un système pédagogique adaptatif capable de :

- Personnaliser l’apprentissage  
- Optimiser l’évaluation  
- Améliorer la progression des élèves  
- Offrir un accompagnement intelligent et automatisé  

Ce système représente une évolution avancée vers une plateforme éducative intelligente, basée sur l’orchestration d’agents IA et l’exploitation des modèles LLM.

# <span style="color:blue">Architecture Agentine de SmartHub</span>

## <span style="color:blue">Vue d'ensemble</span>

SmartHub utilise une architecture multi-agent pour gérer les quiz adaptatifs et l'apprentissage personnalisé. Le système repose sur des agents spécialisés qui collaborent pour offrir une expérience d'apprentissage intelligente.

## <span style="color:blue">Agents Principaux</span>

### <span style="color:blue">AdaptiveQuizOrchestrator</span>

**Rôle:** Orchestrateur principal des quiz adaptatifs, coordonne tous les autres agents.

**Interactions:**
- Utilise CourseQuizSupervisorAgent pour l'éligibilité
- Utilise ProgressTrackerAgent pour l'analyse de progression
- Utilise RAGQuizGenerationService pour la génération de quiz

**Méthodes principales:**

| Méthode | Description | Paramètres | Retour |
|---------|-------------|------------|--------|
| orchestrateAdaptiveQuiz | Orchestre un quiz adaptatif complet | userId, courseId | Map<String, Object> |
| determineQuizStrategy | Détermine la stratégie de quiz | progress, eligibility | String |
| createAgentParameters | Crée les paramètres d'agent | strategy, progress | Map<String, Object> |
| generateAdaptiveQuiz | Génère le quiz adaptatif | userId, courseId, strategy, params | QuizResponseDTO |

**Détails techniques:**
- Utilise Spring @Service et @Transactional
- Intègre RAG pour génération de contenu personnalisé
- Gère les stratégies: DIAGNOSTIC, REMEDIATION, CHALLENGE, REINFORCEMENT, STANDARD

### <span style="color:blue">CourseQuizSupervisorAgent</span>

**Rôle:** Superviseur des quiz de cours, gère l'éligibilité et l'initiation.

**Interactions:**
- Utilise ProgressTrackerAgent pour l'analyse de progression
- Utilise RAGQuizService pour la génération de quiz
- Accède aux repositories Course, Quiz, User, QuizAttempt

**Méthodes principales:**

| Méthode | Description | Paramètres | Retour |
|---------|-------------|------------|--------|
| checkQuizEligibility | Vérifie l'éligibilité au quiz | userId, courseId | QuizEligibilityResponse |
| initiateCourseQuiz | Initie un quiz de cours | userId, courseId | QuizInitiationResponse |
| debugQuizEligibility | Debug de l'éligibilité | userId, courseId | Map<String, Object> |
| generateQuizWithRAG | Génère quiz avec RAG | course, files, userId | QuizResponseDTO |

**Détails techniques:**
- Limite: 3 tentatives par jour, 30 min entre tentatives, 60 min timeout
- Utilise @Transactional pour les écritures
- Fallback si RAG échoue

### <span style="color:blue">ProgressTrackerAgent</span>

**Rôle:** Analyse la progression des étudiants.

**Interactions:**
- Utilise QuizAttemptRepository pour les données
- Fournit des analyses aux autres agents

**Méthodes principales:**

| Méthode | Description | Paramètres | Retour |
|---------|-------------|------------|--------|
| analyzeProgress | Analyse complète de progression | userId | ProgressAnalysis |

**Détails techniques:**
- @Transactional(readOnly=true) pour les performances
- Calcule taux de succès, score moyen, temps total, performance par topic

### <span style="color:blue">QuizOrchestratorAgent</span>

**Rôle:** Orchestrateur de sessions de quiz générales.

**Interactions:**
- Utilise RAGQuizService pour génération
- Utilise UserRepository et LearningProfileRepository

**Méthodes principales:**

| Méthode | Description | Paramètres | Retour |
|---------|-------------|------------|--------|
| initiateQuizSession | Initie une session de quiz | userId, topic | QuizResponseDTO |
| submitAndEvaluateQuiz | Soumet et évalue le quiz | attemptId, submission | String |
| recommendNextQuiz | Recommande le prochain quiz | userId | String |
| getProgressDashboard | Dashboard de progression | userId | Object |

**Détails techniques:**
- Calcul simple de score (simplifié)
- Met à jour le profil d'apprentissage

### <span style="color:blue">RecommendationEngineAgent</span>

**Rôle:** Moteur de recommandations d'apprentissage.

**Interactions:**
- Utilise RAGQuizService pour génération contextuelle
- Utilise QuizRecommendationRepository

**Méthodes principales:**

| Méthode | Description | Paramètres | Retour |
|---------|-------------|------------|--------|
| generateLearningPath | Génère chemin d'apprentissage | userId | List<QuizRecommendation> |
| createRecommendation | Crée une recommandation | userId, topic, confidence, reason | QuizRecommendation |
| generateRecommendationsFromTopic | Génère recommandations par topic | userId, topic | List<QuizRecommendation> |

**Détails techniques:**
- Trie par score de confiance
- Limite à 5 recommandations

## <span style="color:blue">Services RAG</span>

### <span style="color:blue">EmbeddingService</span>

**Rôle:** Génère des embeddings pour le RAG.

**Interactions:**
- Utilise OllamaService (qui utilise Gemini)

**Méthodes principales:**

| Méthode | Description | Paramètres | Retour |
|---------|-------------|------------|--------|
| generateEmbedding | Génère embedding | text | float[] |

**Détails techniques:**
- Cache des embeddings
- Fallback si Gemini échoue
- Normalise le texte (max 500 caractères)

### <span style="color:blue">RAGQuizGenerationService</span>

**Rôle:** Génère des quiz à partir de prompts RAG.

**Interactions:**
- Utilise OllamaService pour appels Gemini

**Méthodes principales:**

| Méthode | Description | Paramètres | Retour |
|---------|-------------|------------|--------|
| generateQuizFromRAGPrompt | Génère quiz depuis prompt RAG | ragPrompt, quizTitle, questionCount | QuizResponseDTO |

**Détails techniques:**
- Max 20 questions
- Vérifie disponibilité du service AI
- Convertit Questions en QuestionResponseDTO

## <span style="color:blue">Modèles IA et Agents</span>

### <span style="color:blue">Modèles IA utilisés</span>

- **Gemini (Google AI)**: Via OllamaService pour génération de texte et quiz structuré
- **Embeddings Gemini**: Pour vectorisation du texte dans RAG

### <span style="color:blue">Agents et leurs rôles</span>

- **AdaptiveQuizOrchestrator**: Chef d'orchestre, décide des stratégies
- **CourseQuizSupervisorAgent**: Gestionnaire de cours, contrôle d'accès
- **ProgressTrackerAgent**: Analyste de performance
- **QuizOrchestratorAgent**: Gestionnaire de sessions générales
- **RecommendationEngineAgent**: Conseiller pédagogique

## <span style="color:blue">Collaboration et prise de décision</span>

### <span style="color:blue">Flux de collaboration</span>

```
Utilisateur demande quiz adaptatif
    ↓
AdaptiveQuizOrchestrator vérifie éligibilité via CourseQuizSupervisorAgent
    ↓
Analyse progression via ProgressTrackerAgent
    ↓
Détermine stratégie (DIAGNOSTIC/REMEDIATION/etc.)
    ↓
Génère paramètres d'agent
    ↓
Initie quiz via CourseQuizSupervisorAgent
    ↓
Génère quiz avec RAGQuizGenerationService
    ↓
Quiz retourné à l'utilisateur
```

### <span style="color:blue">Prise de décision</span>

- **Éligibilité**: Basée sur tentatives/jour, temps entre tentatives, progression
- **Stratégie**: Basée sur score moyen, nombre de quiz complétés, dernière activité
- **Contenu**: Basé sur profil apprenant, intérêts, faiblesses
- **Recommandations**: Basées sur score de confiance, triées par pertinence

## <span style="color:blue">Architecture générale</span>

```
┌─────────────────┐    ┌─────────────────┐
│   Controller    │────│   Services      │
│   (REST API)    │    │   (Business)    │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Agents        │◄──►│   RAG Services  │
│   (Orchestration│    │   (AI/ML)       │
│    & Logic)     │    └─────────────────┘
└─────────────────┘             │
         │                      ▼
         ▼             ┌─────────────────┐
┌─────────────────┐    │   OllamaService │
│   Repositories  │    │   (Gemini API)  │
│   (Data Access) │    └─────────────────┘
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Database)    │
└─────────────────┘
```

## <span style="color:blue">Communication entre agents</span>

```
[AdaptiveQuizOrchestrator] ──► [CourseQuizSupervisorAgent]
         │                              │
         │                              ▼
         │                     [ProgressTrackerAgent]
         │                              │
         ▼                              ▼
[RecommendationEngineAgent] ◄──────────┼─────────────┐
         │                              │             │
         ▼                              ▼             ▼
[RAGQuizGenerationService] ◄── [EmbeddingService] ◄── [OllamaService]
         │                              │             │
         ▼                              ▼             ▼
   Génération quiz              Vectorisation    API Gemini
   personnalisés                de contenu      (Google AI)
```


<h1 style="color:#0d47a1;">Conclusion Générale du Système d’Intelligence Artificielle</h1>

Le système d’intelligence artificielle de SmartHub repose sur une architecture avancée combinant :

- Un chatbot conversationnel intelligent
- Un système multi-agents spécialisé
- Une intégration des modèles LLM
- Un moteur RAG (Retrieval-Augmented Generation)

Cette architecture permet de transformer la plateforme en un véritable écosystème pédagogique intelligent.

D’un côté, le chatbot offre une assistance méthodique et contextualisée aux utilisateurs.  
De l’autre, l’architecture multi-agents assure une supervision pédagogique complète, avec :

- Analyse des profils étudiants  
- Évaluation dynamique des performances  
- Génération de quiz adaptatifs  
- Recommandations personnalisées  
- Ajustement intelligent des stratégies d’apprentissage  

Grâce à l’orchestration des agents et à l’intégration du RAG, le système est capable de produire du contenu personnalisé, contextualisé et adapté au niveau réel de chaque apprenant.

Vous venez désormais de comprendre environ 80 % du fonctionnement global de notre système d’IA.

Vous êtes donc prêt à :

- Lancer le projet en local  
- Explorer son architecture  
- Tester les agents  
- Exploiter pleinement le potentiel du système  
- Adapter et améliorer les solutions existantes  

---

<h2 style="color:#1565c0;">Perspectives d’Amélioration et Défis Techniques</h2>

Plusieurs axes d’amélioration peuvent être explorés si vous souhaitez contribuer au projet :

1. Création de modèles d’intelligence artificielle dédiés à la recommandation automatique de cours pour les étudiants.
2. Introduction de techniques avancées de NLP (Natural Language Processing) pour améliorer la recherche intelligente au sein de la plateforme.
3. Développement d’un moteur de recherche sémantique basé sur embeddings.
4. Intégration d’une page dédiée avec un chatbot embarqué permettant aux étudiants :
   - De coder directement dans la plateforme  
   - D’être assistés en temps réel par l’IA  
   - De recevoir des explications sur leurs erreurs  
   - D’obtenir des suggestions d’amélioration  

Ces défis représentent une opportunité d’évolution vers une plateforme encore plus autonome, adaptative et innovante.

---

<h2 style="color:#1565c0;">Mot de Fin</h2>

Félicitations, cher lecteur.

Vous venez d’explorer l’architecture intelligente de SmartHub et de comprendre les fondements techniques d’un système pédagogique basé sur l’IA et les agents intelligents.

Nous vous souhaitons une excellente continuation dans votre quête de savoir, et nous vous invitons à contribuer, expérimenter et repousser les limites de cette architecture.

L’intelligence artificielle n’est pas seulement un outil dans ce projet : elle en est le moteur stratégique.



<h1 style="color:#0d47a1;">Technologies Utilisées</h1>

<div style="display:flex; flex-wrap:wrap; gap:40px; align-items:center; margin-top:20px;">

<div style="text-align:center;">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" width="60"/>
  <p><strong>Java</strong></p>
</div>

<div style="text-align:center;">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg" width="60"/>
  <p><strong>Spring Boot</strong></p>
</div>

<div style="text-align:center;">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="60"/>
  <p><strong>React</strong></p>
</div>

<div style="text-align:center;">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="60"/>
  <p><strong>PostgreSQL</strong></p>
</div>

<div style="text-align:center;">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" width="60"/>
  <p><strong>Docker</strong></p>
</div>

<div style="text-align:center;">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" width="60"/>
  <p><strong>GitHub</strong></p>
</div>

<div style="text-align:center;">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" width="60"/>
  <p><strong>Python</strong></p>
</div>

<div style="text-align:center;">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" width="60"/>
  <p><strong>Gemini (Google AI)</strong></p>
</div>

<div style="text-align:center;">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="60"/>
  <p><strong>Botpress</strong></p>
</div>

</div>


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
