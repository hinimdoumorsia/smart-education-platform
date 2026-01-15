# Agents métier — SmartHub

Le projet contient plusieurs "agents" métier (package `service.agent`) qui orchestrent workflows plus complexes : orchestration de quiz adaptatifs, moteurs de recommandation, suivi de progression.

Principaux agents et responsabilités :

- `QuizOrchestratorAgent` — orchestre la création et exécution d'une session de quiz : sélection des questions, adaptation du niveau, suivi du temps, collecte des résultats.
- `RecommendationEngineAgent` — calcule recommandations pour un utilisateur en combinant signaux (interactions, profil d'apprentissage, performances) et contenu (knowledge base).
- `ProgressTrackerAgent` — suit la progression d'un utilisateur sur plusieurs cours/quizzes et met à jour `LearningProfile`.
- `CourseQuizSupervisorAgent` — supervise sessions de quiz pour un cours, déclenche réévaluations ou réassignations si nécessaire.
- `AdaptiveQuizOrchestrator` — agent spécialisé pour adapter la difficulté question par question selon l'historique de l'apprenant.

Pattern de communication :
- Les agents sont des services Spring (singleton) qui reçoivent des événements via méthodes publiques (ex: `onQuizStart(QuizAttempt attempt)`), ou via messages (futur : Kafka/RabbitMQ).
- Ils interagissent avec : `UserService`, `QuizService`, `RAG` services, `RecommendationService`, `Repository`

Exemple d'API d'un agent :

```java
public class QuizOrchestratorAgent {
    // ...existing code...
    public QuizSession startSession(User user, Long courseId) { ... }
    public void processAnswer(QuizSession session, AnswerSubmission submission) { ... }
    public QuizResult finishSession(QuizSession session) { ... }
}
```

Diagrammes de séquence et architecture des agents disponibles dans `diagrams.md`.