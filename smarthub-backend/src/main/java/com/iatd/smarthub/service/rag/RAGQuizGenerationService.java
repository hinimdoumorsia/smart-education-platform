package com.iatd.smarthub.service.rag;

import com.iatd.smarthub.dto.QuestionResponseDTO;
import com.iatd.smarthub.dto.QuizResponseDTO;
import com.iatd.smarthub.model.quiz.Question;
import com.iatd.smarthub.model.quiz.QuestionType;
import com.iatd.smarthub.service.OllamaService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class RAGQuizGenerationService {
    
    private final OllamaService ollamaService;
    private final ObjectMapper objectMapper;
    
    // CHANGÉ DE 5 À 20 QUESTIONS
    private static final int MAX_QUESTIONS = 20;
    
    /**
     * Génère un quiz à partir d'un prompt RAG (sans sauvegarde en base)
     */
    public QuizResponseDTO generateQuizFromRAGPrompt(String ragPrompt, String quizTitle, int questionCount) {
        log.info("🎯 Génération quiz RAG: {} ({} questions, max: {})", quizTitle, questionCount, MAX_QUESTIONS);
        
        try {
            // 1. Vérifier que le service AI est disponible
            if (!isAIServiceAvailable()) {
                log.error("🚨 Service AI (Gemini) non disponible pour la génération RAG");
                throw new RuntimeException("Service AI (Gemini) non disponible. Vérifiez votre connexion internet et votre clé API.");
            }
            
            // 2. DEBUG: Log du prompt
            log.info("📝 Prompt envoyé à Gemini ({} caractères):", ragPrompt.length());
            log.info("Extrait prompt: {}", 
                    ragPrompt.substring(0, Math.min(200, ragPrompt.length())) + "...");
            
            // 3. Appel à Gemini via OllamaService
            long startTime = System.currentTimeMillis();
            List<Question> aiQuestions = ollamaService.generateStructuredQuiz(ragPrompt);
            long duration = System.currentTimeMillis() - startTime;
            
            log.info("⏱️ Gemini a répondu en {}ms", duration);
            log.info("🔧 Modèle utilisé: Gemini via OllamaService");
            
            // 4. DEBUG: Vérifier ce que Gemini a retourné
            if (aiQuestions == null) {
                log.error("❌❌❌ Gemini a retourné NULL");
                throw new RuntimeException("Gemini a retourné null");
            }
            
            if (aiQuestions.isEmpty()) {
                log.error("❌❌❌ Gemini a retourné une liste VIDE");
                
                // Test: Appeler Gemini directement avec un prompt simple
                String testPrompt = "Génère 1 question sur Java.";
                String rawResponse = ollamaService.generateRawResponse(testPrompt);
                log.error("🔍 Test Gemini direct: {}", 
                        rawResponse != null ? rawResponse.substring(0, Math.min(100, rawResponse.length())) : "null");
                
                throw new RuntimeException("Gemini liste vide");
            }
            
            log.info("✅ Gemini a généré {} questions", aiQuestions.size());
            for (int i = 0; i < Math.min(aiQuestions.size(), 3); i++) {
                Question q = aiQuestions.get(i);
                log.info("Q{}: {} (type: {})", i+1, 
                        q.getText().substring(0, Math.min(50, q.getText().length())) + "...",
                        q.getType());
            }
            
            // 5. Convertir les Questions en QuestionResponseDTO (jusqu'à MAX_QUESTIONS)
            QuizResponseDTO quiz = convertToQuizResponse(aiQuestions, quizTitle, Math.min(questionCount, MAX_QUESTIONS));
            
            log.info("✅ Quiz RAG généré avec succès: {} questions", quiz.getQuestions().size());
            return quiz;
            
        } catch (Exception e) {
            log.error("❌❌❌ ERREUR CRITIQUE génération quiz RAG: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur génération quiz: " + e.getMessage(), e);
        }
    }
    
    /**
     * Vérifie si le service AI est disponible
     */
    private boolean isAIServiceAvailable() {
        try {
            // Tester avec une méthode disponible
            String testResponse = ollamaService.generateText("test");
            return testResponse != null && !testResponse.toLowerCase().contains("erreur");
        } catch (Exception e) {
            log.warn("Service AI non disponible: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Convertit les Questions en QuizResponseDTO - CHANGÉ POUR GARDER PLUS DE QUESTIONS
     */
    private QuizResponseDTO convertToQuizResponse(List<Question> questions, String quizTitle, int expectedCount) {
        QuizResponseDTO quizResponse = new QuizResponseDTO();
        quizResponse.setTitle(quizTitle);
        quizResponse.setDescription("Quiz généré par Gemini AI avec contexte RAG");
        quizResponse.setQuestions(new ArrayList<>());
        
        int validQuestions = 0;
        for (Question question : questions) {
            // NE PAS LIMITER À 5 - Garder jusqu'à expectedCount ou MAX_QUESTIONS
            if (validQuestions >= MAX_QUESTIONS) {
                log.info("🏁 Limite de {} questions atteinte", MAX_QUESTIONS);
                break;
            }
            
            QuestionResponseDTO dto = convertQuestionToDTO(question);
            if (dto != null) {
                quizResponse.getQuestions().add(dto);
                validQuestions++;
            }
        }
        
        // Si pas assez de questions valides, compléter avec des questions de fallback
        if (validQuestions < Math.min(expectedCount, 10)) {
            log.warn("⚠️ Seulement {} questions valides sur {} attendues", validQuestions, expectedCount);
            int remaining = Math.min(expectedCount, MAX_QUESTIONS) - validQuestions;
            quizResponse.getQuestions().addAll(generateFallbackQuestions(remaining));
        }
        
        return quizResponse;
    }
    
    /**
     * Convertit une Question en QuestionResponseDTO
     */
    private QuestionResponseDTO convertQuestionToDTO(Question question) {
        try {
            if (question == null || question.getText() == null || question.getText().trim().isEmpty()) {
                log.warn("❌ Question vide ou sans texte");
                return null;
            }
            
            QuestionResponseDTO dto = new QuestionResponseDTO();
            
            // Texte
            dto.setText(question.getText().trim());
            
            // Type
            dto.setType(question.getType() != null ? question.getType() : QuestionType.SINGLE_CHOICE);
            
            // Options
            if (question.getOptions() != null && !question.getOptions().isEmpty()) {
                dto.setOptions(new ArrayList<>(question.getOptions()));
            } else {
                // Options par défaut selon le type
                if (dto.getType() == QuestionType.TRUE_FALSE) {
                    dto.setOptions(Arrays.asList("Vrai", "Faux"));
                } else if (dto.getType() == QuestionType.SINGLE_CHOICE || dto.getType() == QuestionType.MULTIPLE_CHOICE) {
                    dto.setOptions(Arrays.asList("Option A", "Option B", "Option C", "Option D"));
                }
            }
            
            // Réponse correcte
            if (question.getCorrectAnswer() != null && !question.getCorrectAnswer().trim().isEmpty()) {
                dto.setCorrectAnswer(question.getCorrectAnswer().trim());
            } else {
                // Réponse par défaut
                dto.setCorrectAnswer(getDefaultAnswer(dto.getType(), dto.getOptions()));
            }
            
            // Explication (pas disponible dans Question, on met une valeur par défaut)
            dto.setExplanation("Explication basée sur le contenu du cours");
            
            // ID temporaire
            dto.setId(System.currentTimeMillis() % 10000);
            
            log.debug("✅ Question convertie: '{}'", 
                     dto.getText().substring(0, Math.min(50, dto.getText().length())));
            
            return dto;
            
        } catch (Exception e) {
            log.warn("❌ Erreur conversion question: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Réponse par défaut selon le type
     */
    private String getDefaultAnswer(QuestionType type, List<String> options) {
        if (type == QuestionType.MULTIPLE_CHOICE && options != null && !options.isEmpty()) {
            return options.get(0);
        } else if (type == QuestionType.SINGLE_CHOICE && options != null && !options.isEmpty()) {
            return options.get(0);
        } else if (type == QuestionType.TRUE_FALSE) {
            return "Vrai";
        } else if (type == QuestionType.OPEN_ENDED) {
            return "Réponse attendue basée sur le contexte";
        }
        return "Réponse correcte";
    }
    
    /**
     * Parse le JSON généré par Gemini (méthode conservée pour compatibilité)
     */
    private QuizResponseDTO parseQuizFromJSON(String jsonResponse, String quizTitle, int expectedCount) {
        try {
            // Nettoyer le JSON
            String cleanedJson = cleanJsonResponse(jsonResponse);
            
            // Parser
            Map<String, Object> quizData = objectMapper.readValue(cleanedJson, Map.class);
            List<Map<String, Object>> questionsData = (List<Map<String, Object>>) quizData.get("questions");
            
            // Créer le DTO
            QuizResponseDTO quizResponse = new QuizResponseDTO();
            quizResponse.setTitle(quizTitle);
            quizResponse.setDescription("Quiz généré par Gemini AI avec contexte RAG");
            quizResponse.setQuestions(new ArrayList<>());
            
            int validQuestions = 0;
            for (Map<String, Object> qData : questionsData) {
                if (validQuestions >= MAX_QUESTIONS) break;
                
                QuestionResponseDTO question = parseQuestionFromMap(qData);
                if (question != null) {
                    quizResponse.getQuestions().add(question);
                    validQuestions++;
                }
            }
            
            // Si pas assez de questions valides, compléter avec des questions de fallback
            if (validQuestions < Math.min(expectedCount, 10)) {
                log.warn("⚠️ Seulement {} questions valides sur {} attendues", validQuestions, expectedCount);
                int remaining = Math.min(expectedCount, MAX_QUESTIONS) - validQuestions;
                quizResponse.getQuestions().addAll(generateFallbackQuestions(remaining));
            }
            
            return quizResponse;
            
        } catch (Exception e) {
            log.error("❌ Erreur parsing JSON RAG: {}", e.getMessage());
            throw new RuntimeException("Erreur lors du parsing du quiz généré: " + e.getMessage());
        }
    }
    
    /**
     * Parse une question depuis la Map
     */
    private QuestionResponseDTO parseQuestionFromMap(Map<String, Object> qData) {
        try {
            log.debug("🔍 Parsing question data: {}", qData.keySet());
            
            QuestionResponseDTO question = new QuestionResponseDTO();
            
            // 1. Texte (avec recherche flexible)
            String text = extractQuestionText(qData);
            if (text == null || text.trim().isEmpty() || text.length() < 10) {
                log.warn("❌ Question sans texte valide (longueur: {})", text != null ? text.length() : 0);
                return null;
            }
            question.setText(text.trim());
            
            // 2. Type (avec détection intelligente)
            question.setType(detectQuestionType(qData));
            
            // 3. Options (gestion de tous les formats)
            List<String> options = extractQuestionOptions(qData, question.getType());
            question.setOptions(options);
            
            // 4. Réponse correcte (extraction flexible)
            String correctAnswer = extractCorrectAnswer(qData, question.getType(), options);
            question.setCorrectAnswer(correctAnswer);
            
            // 5. Explication
            question.setExplanation(extractExplanation(qData));
            
            // 6. ID (générer un ID temporaire)
            question.setId(qData.containsKey("id") ? 
                Long.parseLong(qData.get("id").toString()) : 
                System.currentTimeMillis() % 1000);
            
            log.debug("✅ Question parsée: '{}' ({} options, type: {})", 
                     text.substring(0, Math.min(30, text.length())), 
                     options.size(), question.getType());
            
            return question;
            
        } catch (Exception e) {
            log.warn("❌ Erreur parsing question: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Extraction flexible du texte de la question
     */
    private String extractQuestionText(Map<String, Object> qData) {
        String[] possibleKeys = {"text", "question", "q", "content", "query", "prompt"};
        
        for (String key : possibleKeys) {
            if (qData.containsKey(key)) {
                Object value = qData.get(key);
                if (value != null) {
                    String text = value.toString().trim();
                    if (!text.isEmpty()) {
                        log.debug("📝 Texte trouvé dans clé '{}': {}...", key, 
                                 text.substring(0, Math.min(50, text.length())));
                        return text;
                    }
                }
            }
        }
        
        // Si aucune clé trouvée, chercher dans les valeurs
        for (Map.Entry<String, Object> entry : qData.entrySet()) {
            if (entry.getValue() instanceof String) {
                String value = entry.getValue().toString().trim();
                if (value.length() > 20 && value.contains("?")) {
                    log.debug("📝 Texte trouvé dans valeur de '{}'", entry.getKey());
                    return value;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Détection intelligente du type de question
     */
    private QuestionType detectQuestionType(Map<String, Object> qData) {
        // 1. Vérifier la clé "type"
        if (qData.containsKey("type")) {
            Object typeObj = qData.get("type");
            String typeStr = typeObj.toString().toUpperCase().replace(" ", "_");
            
            log.debug("🎯 Type brut: '{}'", typeStr);
            
            // Nettoyer le type
            if (typeStr.contains("SINGLE") || typeStr.contains("CHOICE")) {
                return QuestionType.SINGLE_CHOICE;
            } else if (typeStr.contains("MULTIPLE") || typeStr.contains("CHOICE")) {
                return QuestionType.MULTIPLE_CHOICE;
            } else if (typeStr.contains("TRUE") || typeStr.contains("FALSE")) {
                return QuestionType.TRUE_FALSE;
            } else if (typeStr.contains("SHORT") || typeStr.contains("ANSWER") || 
                       typeStr.contains("OPEN") || typeStr.contains("ENDED")) {
                return QuestionType.OPEN_ENDED;
            }
            
            // Essayer de matcher exactement
            try {
                return QuestionType.valueOf(typeStr);
            } catch (IllegalArgumentException e) {
                // Continuer avec la détection automatique
            }
        }
        
        // 2. Détection par analyse des options
        if (qData.containsKey("options")) {
            Object options = qData.get("options");
            if (options instanceof List) {
                List<?> opts = (List<?>) options;
                if (opts.size() == 2) {
                    // Vérifier si c'est TRUE_FALSE
                    String opt1 = opts.get(0).toString().toLowerCase();
                    String opt2 = opts.get(1).toString().toLowerCase();
                    if ((opt1.contains("vrai") && opt2.contains("faux")) || 
                        (opt1.contains("true") && opt2.contains("false"))) {
                        return QuestionType.TRUE_FALSE;
                    }
                }
                return QuestionType.SINGLE_CHOICE; // Par défaut pour les choix
            }
        }
        
        // 3. Détection par présence de réponses multiples
        if (qData.containsKey("correctAnswer")) {
            Object correct = qData.get("correctAnswer");
            if (correct instanceof List && ((List<?>) correct).size() > 1) {
                return QuestionType.MULTIPLE_CHOICE;
            }
        }
        
        // 4. Par défaut
        log.debug("🎯 Type par défaut: SINGLE_CHOICE");
        return QuestionType.SINGLE_CHOICE;
    }
    
    /**
     * Extraction flexible des options
     */
    private List<String> extractQuestionOptions(Map<String, Object> qData, QuestionType type) {
        List<String> options = new ArrayList<>();
        
        // Si c'est OPEN_ENDED ou SHORT_ANSWER, pas d'options nécessaires
        if (type == QuestionType.OPEN_ENDED) {
            return options; // Liste vide
        }
        
        // 1. Essayer la clé "options"
        if (qData.containsKey("options")) {
            Object opts = qData.get("options");
            
            if (opts instanceof List) {
                List<?> rawOptions = (List<?>) opts;
                
                for (Object opt : rawOptions) {
                    if (opt == null) continue;
                    
                    if (opt instanceof Map) {
                        // Format: {"text": "Option A", "correct": true}
                        Map<String, Object> optMap = (Map<String, Object>) opt;
                        if (optMap.containsKey("text")) {
                            String optText = optMap.get("text").toString().trim();
                            if (!optText.isEmpty()) {
                                options.add(optText);
                            }
                        } else if (optMap.containsKey("option")) {
                            String optText = optMap.get("option").toString().trim();
                            if (!optText.isEmpty()) {
                                options.add(optText);
                            }
                        }
                    } else if (opt instanceof String) {
                        // Format simple: "Option A"
                        String optText = opt.toString().trim();
                        if (!optText.isEmpty()) {
                            options.add(optText);
                        }
                    } else {
                        // Autre type, convertir en string
                        options.add(opt.toString().trim());
                    }
                }
            } else if (opts instanceof String) {
                // Format: "Option A, Option B, Option C"
                String[] parts = ((String) opts).split(",");
                for (String part : parts) {
                    String trimmed = part.trim();
                    if (!trimmed.isEmpty()) {
                        options.add(trimmed);
                    }
                }
            }
        }
        
        // 2. Si TRUE_FALSE et pas d'options, créer les options standard
        if (type == QuestionType.TRUE_FALSE && options.isEmpty()) {
            options.add("Vrai");
            options.add("Faux");
        }
        
        // 3. Si pas assez d'options pour un choix, compléter
        if ((type == QuestionType.SINGLE_CHOICE || type == QuestionType.MULTIPLE_CHOICE) && 
            options.size() < 2) {
            String[] defaults = {"Option A", "Option B", "Option C", "Option D"};
            for (int i = options.size(); i < Math.min(4, defaults.length); i++) {
                options.add(defaults[i]);
            }
        }
        
        log.debug("📋 Options extraites: {} (type: {})", options.size(), type);
        return options;
    }
    
    /**
     * Extraction flexible de la réponse correcte
     */
    private String extractCorrectAnswer(Map<String, Object> qData, QuestionType type, List<String> options) {
        // 1. Essayer la clé "correctAnswer"
        if (qData.containsKey("correctAnswer")) {
            Object correct = qData.get("correctAnswer");
            
            if (correct == null) {
                return getDefaultAnswerForJSON(type, options);
            }
            
            // Pour MULTIPLE_CHOICE
            if (type == QuestionType.MULTIPLE_CHOICE) {
                if (correct instanceof List) {
                    // Format: ["Option A", "Option C"]
                    List<String> answers = new ArrayList<>();
                    for (Object ans : (List<?>) correct) {
                        if (ans != null) {
                            String answer = ans.toString().trim();
                            if (!answer.isEmpty() && !answers.contains(answer)) {
                                answers.add(answer);
                            }
                        }
                    }
                    return answers.isEmpty() ? getDefaultAnswerForJSON(type, options) : String.join(",", answers);
                } else if (correct instanceof String) {
                    // Format: "Option A, Option C" ou "A,C"
                    String answerStr = correct.toString().trim();
                    if (answerStr.contains(",")) {
                        String[] parts = answerStr.split(",");
                        List<String> answers = new ArrayList<>();
                        for (String part : parts) {
                            String trimmed = part.trim();
                            if (!trimmed.isEmpty() && !answers.contains(trimmed)) {
                                answers.add(trimmed);
                            }
                        }
                        return answers.isEmpty() ? getDefaultAnswerForJSON(type, options) : String.join(",", answers);
                    } else {
                        // Une seule réponse
                        return answerStr;
                    }
                }
            } else {
                // Pour SINGLE_CHOICE, TRUE_FALSE, OPEN_ENDED
                String answer = correct.toString().trim();
                return answer.isEmpty() ? getDefaultAnswerForJSON(type, options) : answer;
            }
        }
        
        // 2. Chercher dans d'autres clés
        String[] possibleKeys = {"answer", "correct", "solution", "response"};
        for (String key : possibleKeys) {
            if (qData.containsKey(key)) {
                Object answer = qData.get(key);
                if (answer != null) {
                    String answerStr = answer.toString().trim();
                    if (!answerStr.isEmpty()) {
                        return answerStr;
                    }
                }
            }
        }
        
        // 3. Fallback
        return getDefaultAnswerForJSON(type, options);
    }
    
    /**
     * Réponse par défaut selon le type (version pour JSON parsing)
     */
    private String getDefaultAnswerForJSON(QuestionType type, List<String> options) {
        if (type == QuestionType.MULTIPLE_CHOICE && options != null && !options.isEmpty()) {
            return options.get(0);
        } else if (type == QuestionType.SINGLE_CHOICE && options != null && !options.isEmpty()) {
            return options.get(0);
        } else if (type == QuestionType.TRUE_FALSE) {
            return "Vrai";
        } else if (type == QuestionType.OPEN_ENDED) {
            return "Réponse attendue basée sur le contexte";
        }
        return "Réponse correcte";
    }
    
    /**
     * Extraction de l'explication
     */
    private String extractExplanation(Map<String, Object> qData) {
        String[] possibleKeys = {"explanation", "explication", "reason", "why", "rationale", "details"};
        
        for (String key : possibleKeys) {
            if (qData.containsKey(key)) {
                Object value = qData.get(key);
                if (value != null) {
                    String explanation = value.toString().trim();
                    if (!explanation.isEmpty()) {
                        return explanation;
                    }
                }
            }
        }
        
        // Fallback basé sur le type
        if (qData.containsKey("type")) {
            String type = qData.get("type").toString().toLowerCase();
            if (type.contains("choice")) {
                return "Sélectionnez la ou les réponses correctes basées sur le contexte du cours";
            }
        }
        
        return "Explication basée sur le contenu du cours";
    }
    
    /**
     * Nettoie la réponse JSON
     */
    private String cleanJsonResponse(String response) {
        if (response == null) return "{\"questions\":[]}";
        
        // Retirer les backticks de markdown
        response = response.replaceAll("```json\\n?", "").replaceAll("\\n?```", "");
        
        // Trouver le premier { et dernier }
        int start = response.indexOf('{');
        int end = response.lastIndexOf('}');
        
        if (start >= 0 && end > start) {
            String json = response.substring(start, end + 1);
            
            // Valider que c'est du JSON
            try {
                objectMapper.readTree(json);
                return json;
            } catch (Exception e) {
                log.debug("JSON invalide, tentative de correction...");
            }
        }
        
        // Fallback: chercher du JSON-like
        String[] lines = response.split("\n");
        StringBuilder jsonBuilder = new StringBuilder();
        boolean inJson = false;
        
        for (String line : lines) {
            line = line.trim();
            if (line.startsWith("{") || line.startsWith("[")) {
                inJson = true;
            }
            if (inJson) {
                jsonBuilder.append(line);
                if (line.endsWith("}") || line.endsWith("]")) {
                    break;
                }
            }
        }
        
        String extracted = jsonBuilder.toString();
        if (extracted.isEmpty()) {
            throw new RuntimeException("Impossible d'extraire du JSON de la réponse");
        }
        
        return extracted;
    }
    
    /**
     * Génère un quiz de fallback
     */
    private QuizResponseDTO generateFallbackQuiz(String quizTitle, int questionCount) {
        QuizResponseDTO quiz = new QuizResponseDTO();
        quiz.setTitle(quizTitle + " (Mode Secours)");
        quiz.setDescription("Quiz généré en mode de secours - veuillez réessayer plus tard");
        quiz.setQuestions(generateFallbackQuestions(Math.min(questionCount, 10)));
        
        log.warn("⚠️ Utilisation du quiz de fallback");
        return quiz;
    }
    
    /**
     * Génère des questions de fallback
     */
    private List<QuestionResponseDTO> generateFallbackQuestions(int count) {
        List<QuestionResponseDTO> questions = new ArrayList<>();
        
        int actualCount = Math.min(count, 10);
        for (int i = 1; i <= actualCount; i++) {
            QuestionResponseDTO question = new QuestionResponseDTO();
            question.setText("Question de secours #" + i + " - Le système est en maintenance");
            question.setType(QuestionType.SINGLE_CHOICE);
            question.setOptions(Arrays.asList("Option A", "Option B", "Option C", "Option D"));
            question.setCorrectAnswer("Option B");
            question.setExplanation("Question générée automatiquement pendant une maintenance du système AI");
            
            questions.add(question);
        }
        
        return questions;
    }
    
    /**
     * Construit un prompt RAG optimisé pour Gemini
     */
    public String buildRAGPrompt(String topic, List<String> relevantContent, String userLevel, List<String> userInterests) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("🎯 TU ES UN TUTEUR INTELLIGENT QUI CRÉE DES QUIZ PERSONNALISÉS AVEC GEMINI AI\n\n");
        
        // Contexte de l'apprenant
        prompt.append("👤 CONTEXTE APPRENANT:\n");
        prompt.append("- Niveau: ").append(userLevel).append("\n");
        if (userInterests != null && !userInterests.isEmpty()) {
            prompt.append("- Centres d'intérêt: ").append(String.join(", ", userInterests)).append("\n");
        }
        prompt.append("\n");
        
        // Contenu pertinent
        prompt.append("📖 CONTENU PERTINENT (sélectionné par RAG):\n");
        if (relevantContent != null && !relevantContent.isEmpty()) {
            for (int i = 0; i < Math.min(relevantContent.size(), 5); i++) {
                prompt.append("\n【Source ").append(i + 1).append("】\n");
                String content = relevantContent.get(i);
                prompt.append(content.substring(0, Math.min(300, content.length())));
                if (content.length() > 300) prompt.append("...");
                prompt.append("\n");
            }
        } else {
            prompt.append("Aucun contenu spécifique trouvé. Base-toi sur tes connaissances générales.\n");
        }
        prompt.append("\n");
        
        // Instructions - MODIFIÉ POUR 15-20 QUESTIONS
        prompt.append("""
            🎯 INSTRUCTIONS CRITIQUES:
            
            1. CRÉE 15-20 QUESTIONS BASÉES UNIQUEMENT SUR LE CONTENU CI-DESSUS
            2. NE PAS INVENTER D'INFORMATIONS
            3. MÉLANGER LES TYPES: 60% SINGLE_CHOICE, 30% MULTIPLE_CHOICE, 10% TRUE_FALSE
            4. QUESTIONS CLAIRES ET NON AMBIGUËS
            5. OPTIONS PERTINENTES ET DISTINCTES
            
            6. FORMAT JSON STRICT:
            {
              "questions": [
                {
                  "text": "Question précise?",
                  "type": "SINGLE_CHOICE",
                  "options": ["Option A", "Option B", "Option C", "Option D"],
                  "correctAnswer": "Option B",
                  "explanation": "Explication basée sur la source 1"
                }
              ]
            }
            
            7. IMPORTANT: Retourne UNIQUEMENT le JSON, sans texte avant/après
            8. UTILISE GEMINI POUR GÉNÉRER DES QUESTIONS DE HAUTE QUALITÉ
            """);
        
        return prompt.toString();
    }
    
    /**
     * Teste la génération RAG
     */
    public Map<String, Object> testRAGGeneration() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Test avec un prompt simple
            String testPrompt = """
                📖 CONTENU: Spring Boot simplifie le développement Java avec la configuration automatique.
                
                🎯 CRÉE 15-20 questions sur Spring Boot.
                Format JSON uniquement.
                """;
            
            QuizResponseDTO quiz = generateQuizFromRAGPrompt(testPrompt, "Test RAG", 20);
            
            result.put("success", true);
            result.put("questions_generated", quiz.getQuestions().size());
            result.put("quiz_title", quiz.getTitle());
            result.put("ai_service_available", isAIServiceAvailable());
            result.put("ai_service", "Gemini");
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("ai_service", "Gemini (erreur)");
        }
        
        return result;
    }
    
    /**
     * Méthode alternative pour générer un quiz à partir de JSON (pour compatibilité)
     */
    public QuizResponseDTO generateQuizFromJSON(String jsonResponse, String quizTitle, int questionCount) {
        log.info("🎯 Génération quiz depuis JSON: {} ({} questions)", quizTitle, questionCount);
        
        try {
            // Utiliser l'ancienne méthode de parsing JSON
            return parseQuizFromJSON(jsonResponse, quizTitle, questionCount);
            
        } catch (Exception e) {
            log.error("❌ Erreur génération quiz depuis JSON: {}", e.getMessage());
            return generateFallbackQuiz(quizTitle, Math.min(questionCount, 10));
        }
    }
    
    /**
     * Valide si une réponse JSON contient des questions valides
     */
    public boolean validateQuizJSON(String jsonResponse) {
        try {
            String cleanedJson = cleanJsonResponse(jsonResponse);
            Map<String, Object> quizData = objectMapper.readValue(cleanedJson, Map.class);
            
            if (!quizData.containsKey("questions")) {
                log.warn("❌ JSON invalide: clé 'questions' manquante");
                return false;
            }
            
            List<?> questions = (List<?>) quizData.get("questions");
            if (questions == null || questions.isEmpty()) {
                log.warn("❌ JSON invalide: liste de questions vide");
                return false;
            }
            
            log.info("✅ JSON valide: {} questions détectées", questions.size());
            return true;
            
        } catch (Exception e) {
            log.error("❌ Erreur validation JSON: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Génère un quiz avec gestion d'erreur élégante
     */
    public QuizResponseDTO generateQuizSafely(String ragPrompt, String quizTitle, int questionCount) {
        try {
            return generateQuizFromRAGPrompt(ragPrompt, quizTitle, questionCount);
        } catch (Exception e) {
            log.warn("Génération AI échouée, création d'un quiz de secours: {}", e.getMessage());
            
            QuizResponseDTO fallbackQuiz = new QuizResponseDTO();
            fallbackQuiz.setTitle(quizTitle + " (quiz de secours)");
            fallbackQuiz.setDescription("Quiz créé manuellement suite à une erreur de génération Gemini AI");
            fallbackQuiz.setQuestions(generateFallbackQuestions(Math.min(5, questionCount)));
            
            return fallbackQuiz;
        }
    }
    
    /**
     * Vérifie l'état du service
     */
    public Map<String, Object> getServiceStatus() {
        Map<String, Object> status = new HashMap<>();
        
        try {
            boolean aiAvailable = isAIServiceAvailable();
            status.put("ai_service_available", aiAvailable);
            status.put("ai_service", "Gemini via OllamaService");
            status.put("json_parsing_supported", true);
            status.put("rag_generation_supported", true);
            status.put("max_questions_per_quiz", MAX_QUESTIONS);
            
            // Tester avec un petit prompt
            if (aiAvailable) {
                String testResponse = ollamaService.generateText("bonjour");
                status.put("ai_response_test", testResponse != null && testResponse.length() > 0);
            }
            
        } catch (Exception e) {
            status.put("error", e.getMessage());
            status.put("ai_service_available", false);
        }
        
        return status;
    }
}