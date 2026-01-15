# com.iatd.smarthub.service.agent.QuizOrchestratorAgent

Rôle
- Agent d'orchestration pour les sessions de quiz : initiation, soumission, évaluation, recommandations.
- Interagit avec `RAGQuizService`, `UserRepository`, `LearningProfileRepository`.

Emplacement
- `src/main/java/com/iatd/smarthub/service/agent/QuizOrchestratorAgent.java`

Annotations
- `@Service`, `@RequiredArgsConstructor`, `@Slf4j`

Dépendances
- `private final RAGQuizService ragQuizService`
- `private final UserRepository userRepository`
- `private final LearningProfileRepository learningProfileRepository`

Méthodes publiques
- `public QuizResponseDTO initiateQuizSession(Long userId, String topic)`
  - Appelle `ragQuizService.generatePersonalizedQuiz(userId, topic)`
- `@Transactional public String submitAndEvaluateQuiz(Long attemptId, QuizSubmissionDTO submission)`
  - Récupère l'utilisateur, calcule un score (simplifié dans le code), met à jour `LearningProfile` via `ragQuizService.updateLearningProfile(...)`.
- `public String recommendNextQuiz(Long userId)`
  - Retourne `ragQuizService.recommendNextQuiz(userId).getRecommendedTopic()`
- `public Object getProgressDashboard(Long userId)`
  - Délègue à `ragQuizService.getRecommendations(userId)` (dashboard / recommandations)

Comportement important
- Transactions sur `submitAndEvaluateQuiz` pour garantir la mise à jour atomique des données.
- Les calculs de score dans le code d'exemple sont simplifiés; en production il faut une évaluation précise par question.

Exemple d'appel
```java
QuizResponseDTO session = quizOrchestratorAgent.initiateQuizSession(userId, "HTML forms");
String result = quizOrchestratorAgent.submitAndEvaluateQuiz(attemptId, submissionDto);
```