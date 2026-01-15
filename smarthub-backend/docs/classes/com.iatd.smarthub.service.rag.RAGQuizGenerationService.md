# com.iatd.smarthub.service.rag.RAGQuizGenerationService

Rôle
- Orchestration de génération de quiz via RAG + modèle IA (Gemini via `OllamaService`).
- Parse et normalise la réponse IA en `QuizResponseDTO` et `QuestionResponseDTO`.

Emplacement
- `src/main/java/com/iatd/smarthub/service/rag/RAGQuizGenerationService.java`

Annotations
- `@Service`, `@RequiredArgsConstructor`, `@Slf4j`

Dépendances
- `private final OllamaService ollamaService`
- `private final ObjectMapper objectMapper`

Comportement / méthodes majeures
- `public QuizResponseDTO generateQuizFromRAGPrompt(String ragPrompt, String quizTitle, int questionCount)`
  - Vérifie disponibilité AI, appelle `ollamaService.generateStructuredQuiz(ragPrompt)`, convertit la liste de `Question` retournée en `QuizResponseDTO`.
- `private boolean isAIServiceAvailable()`
- `private QuizResponseDTO convertToQuizResponse(List<Question> questions, String quizTitle, int expectedCount)`
- `private QuestionResponseDTO convertQuestionToDTO(Question question)`
- `private QuizResponseDTO parseQuizFromJSON(String jsonResponse, String quizTitle, int expectedCount)`
- `public String buildRAGPrompt(String topic, List<String> relevantContent, String userLevel, List<String> userInterests)`
- `public Map<String,Object> testRAGGeneration()`
- `public QuizResponseDTO generateQuizFromJSON(String jsonResponse, String quizTitle, int questionCount)`
- `public boolean validateQuizJSON(String jsonResponse)`
- `public QuizResponseDTO generateQuizSafely(String ragPrompt, String quizTitle, int questionCount)`
- `public Map<String,Object> getServiceStatus()`

Points d'attention
- Gère robustesse : fallback quiz, nettoyage JSON reçu du modèle, parsing flexible des structures de questions/options/responses.
- MAX_QUESTIONS configuré (20 dans le code actuel).

Exemple d'usage
```java
String prompt = ragQuizService.buildRAGPrompt(topic, passages, "beginner", List.of("web"));
QuizResponseDTO quiz = ragQuizGenerationService.generateQuizFromRAGPrompt(prompt, "Quiz Topic", 10);
```