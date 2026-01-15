package com.iatd.smarthub.service;

import com.iatd.smarthub.model.quiz.Question;
import com.iatd.smarthub.model.quiz.QuestionType;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
public class OllamaService {
    
    @Value("${gemini.api.key:}")
    private String geminiApiKey;
    
    @Value("${gemini.model.name:gemini-2.5-flash}")
    private String geminiModelName;
    
    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/}")
    private String geminiApiUrl;
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    public OllamaService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Génère une réponse brute depuis Gemini
     */
    public String generateRawResponse(String prompt) {
        log.info("📤 Génération réponse brute Gemini - Prompt: {} caractères", prompt.length());
        
        try {
            String url = geminiApiUrl + geminiModelName + ":generateContent?key=" + geminiApiKey;
            
            Map<String, Object> request = new HashMap<>();
            
            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> content = new HashMap<>();
            
            List<Map<String, Object>> parts = new ArrayList<>();
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);
            parts.add(part);
            
            content.put("parts", parts);
            contents.add(content);
            
            request.put("contents", contents);
            
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("maxOutputTokens", 16000);
            generationConfig.put("temperature", 0.3);
            
            request.put("generationConfig", generationConfig);
            
            // Safety settings
            List<Map<String, Object>> safetySettings = new ArrayList<>();
            safetySettings.add(Map.of(
                "category", "HARM_CATEGORY_HARASSMENT",
                "threshold", "BLOCK_MEDIUM_AND_ABOVE"
            ));
            safetySettings.add(Map.of(
                "category", "HARM_CATEGORY_HATE_SPEECH", 
                "threshold", "BLOCK_MEDIUM_AND_ABOVE"
            ));
            safetySettings.add(Map.of(
                "category", "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold", "BLOCK_MEDIUM_AND_ABOVE"
            ));
            safetySettings.add(Map.of(
                "category", "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold", "BLOCK_MEDIUM_AND_ABOVE"
            ));
            
            request.put("safetySettings", safetySettings);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            
            log.debug("🔗 Envoi requête à Gemini: {}", url);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                url, 
                HttpMethod.POST, 
                entity, 
                Map.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                
                String aiResponse = extractTextFromGeminiResponse(responseBody);
                
                if (aiResponse != null) {
                    log.info("✅ Réponse brute reçue: {} caractères", aiResponse.length());
                    
                    // Afficher les 200 premiers caractères de la réponse
                    String preview = aiResponse.length() > 200 ? 
                        aiResponse.substring(0, 200) + "..." : aiResponse;
                    log.info("📄 Prévisualisation réponse: {}", preview);
                    
                    return aiResponse;
                } else {
                    log.error("❌ Impossible d'extraire le texte de la réponse Gemini");
                    throw new RuntimeException("Réponse Gemini invalide - texte non extractible");
                }
            } else {
                log.error("❌ Réponse HTTP invalide: {}", response.getStatusCode());
                throw new RuntimeException("Erreur HTTP: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("❌ Erreur génération réponse brute: {}", e.getMessage());
            throw new RuntimeException("Erreur de communication avec Gemini: " + e.getMessage(), e);
        }
    }
    
    /**
     * Test simple de génération pour RAG
     */
    public String testRAGGeneration(String content) {
        log.info("🧪 Test RAG - Contenu: {} caractères", content.length());
        
        String testPrompt = String.format("""
            Basé sur ce contenu:
            %s
            
            Génère 1 question QCM simple.
            Format JSON STRICT (sans texte supplémentaire):
            {
              "questions": [
                {
                  "text": "QUESTION",
                  "type": "SINGLE_CHOICE",
                  "options": ["OPTION1", "OPTION2", "OPTION3", "OPTION4"],
                  "correctAnswer": "OPTION_CORRECTE"
                }
              ]
            }
            """, content.substring(0, Math.min(500, content.length())));
        
        return generateRawResponse(testPrompt);
    }
    
    /**
     * Génère des questions structurées à partir d'un prompt
     * Lance une exception si la génération échoue
     */
    public List<Question> generateQuestions(String prompt, int questionCount) {
        log.info("🎯 Génération de {} questions avec Gemini", questionCount);
        
        try {
            // Construction du prompt spécifique
            String fullPrompt = buildQuestionPrompt(prompt, questionCount);
            
            // Afficher le prompt pour débogage
            log.info("📝 Prompt envoyé à Gemini ({} caractères):", fullPrompt.length());
            String promptPreview = fullPrompt.substring(0, Math.min(500, fullPrompt.length()));
            log.info("📄 Extrait prompt: {}", promptPreview + (fullPrompt.length() > 500 ? "..." : ""));
            
            // Appel à Gemini
            String aiResponse = callGeminiAPI(fullPrompt, questionCount);
            
            // Validation de la réponse
            if (aiResponse == null || aiResponse.trim().isEmpty()) {
                throw new RuntimeException("Réponse Gemini vide");
            }
            
            // Afficher la réponse brute
            log.info("📥 Réponse brute Gemini ({} caractères):", aiResponse.length());
            String responsePreview = aiResponse.substring(0, Math.min(300, aiResponse.length()));
            log.info("📋 Extrait réponse: {}", responsePreview + (aiResponse.length() > 300 ? "..." : ""));
            
            // Parsing de la réponse
            List<Question> questions = parseAIResponse(aiResponse, questionCount);
            
            // Validation finale
            validateGeneratedQuestions(questions, questionCount);
            
            // AFFICHER LES QUESTIONS GÉNÉRÉES DANS LES LOGS
            displayGeneratedQuestions(questions);
            
            log.info("✅ {} questions générées avec succès", questions.size());
            return questions;
            
        } catch (Exception e) {
            log.error("❌ Échec de génération des questions: {}", e.getMessage());
            throw new RuntimeException("Impossible de générer des questions: " + e.getMessage(), e);
        }
    }
    
    /**
     * Affiche les questions générées dans les logs avec un format lisible
     */
    private void displayGeneratedQuestions(List<Question> questions) {
        if (questions == null || questions.isEmpty()) {
            log.warn("⚠️ Aucune question à afficher");
            return;
        }
        
        log.info("=".repeat(80));
        log.info("📋 QUESTIONS GÉNÉRÉES PAR GEMINI ({} questions):", questions.size());
        log.info("=".repeat(80));
        
        int questionsToShow = Math.min(10, questions.size()); // Montrer seulement les 10 premières pour ne pas surcharger les logs
        for (int i = 0; i < questionsToShow; i++) {
            Question q = questions.get(i);
            
            log.info("🔹 QUESTION {} (Type: {}):", i + 1, q.getType());
            log.info("   📝 Texte: {}", q.getText());
            
            // Afficher les options
            if (q.getOptions() != null && !q.getOptions().isEmpty()) {
                log.info("   📌 Options:");
                for (int j = 0; j < q.getOptions().size(); j++) {
                    String option = q.getOptions().get(j);
                    boolean isCorrect = option.equals(q.getCorrectAnswer()) || 
                                      (q.getCorrectAnswer() != null && 
                                       q.getCorrectAnswer().contains(option));
                    
                    String marker = isCorrect ? "✅" : "   ";
                    log.info("      {} {}. {}", marker, (char)('A' + j), option);
                }
            }
            
            // Afficher la réponse correcte
            if (q.getCorrectAnswer() != null) {
                log.info("   🎯 Réponse correcte: {}", q.getCorrectAnswer());
            }
            
            log.info("-".repeat(40));
        }
        
        if (questions.size() > 10) {
            log.info("... ({} questions supplémentaires)", questions.size() - 10);
        }
        
        log.info("=".repeat(80));
        log.info("📊 RÉSUMÉ: {} questions générées avec succès", questions.size());
        log.info("=".repeat(80));
    }
    
    private String buildQuestionPrompt(String topic, int questionCount) {
        return String.format(
            "Génère %d questions sur le sujet: '%s'. " +
            "Format de réponse JSON STRICT (sans texte avant ni après):\n" +
            "{\n" +
            "  \"questions\": [\n" +
            "    {\n" +
            "      \"text\": \"texte de la question clair et précis\",\n" +
            "      \"type\": \"SINGLE_CHOICE\",\n" +
            "      \"correctAnswer\": \"réponse correcte exacte\",\n" +
            "      \"options\": [\"option1\", \"option2\", \"option3\", \"option4\"],\n" +
            "      \"explanation\": \"explication pédagogique\"\n" +
            "    }\n" +
            "  ]\n" +
            "}\n" +
            "Règles strictes:\n" +
            "1. Les questions doivent être directement liées au sujet\n" +
            "2. 4 options par question\n" +
            "3. Une seule réponse correcte\n" +
            "4. Texte des options clair et concis\n" +
            "5. Aucun texte supplémentaire avant ou après le JSON",
            questionCount, topic
        );
    }
    
    private String callGeminiAPI(String prompt, int questionCount) {
        try {
            String url = geminiApiUrl + geminiModelName + ":generateContent?key=" + geminiApiKey;
            
            log.info("📤 Envoi à Gemini - Model: {}, Prompt: {} caractères, Questions demandées: {}", 
                    geminiModelName, prompt.length(), questionCount);
            
            Map<String, Object> request = new HashMap<>();
            
            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> content = new HashMap<>();
            
            List<Map<String, Object>> parts = new ArrayList<>();
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);
            parts.add(part);
            
            content.put("parts", parts);
            contents.add(content);
            
            request.put("contents", contents);
            
            // Ajuster les tokens en fonction du nombre de questions
            int maxTokens = calculateMaxTokensForQuestions(questionCount);
            
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("maxOutputTokens", maxTokens);
            generationConfig.put("temperature", 0.3);
            generationConfig.put("topP", 0.95);
            
            request.put("generationConfig", generationConfig);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                url, 
                HttpMethod.POST, 
                entity, 
                Map.class
            );
            
            log.debug("📥 Statut réponse: {}", response.getStatusCode());
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                
                String aiResponse = extractTextFromGeminiResponse(responseBody);
                
                if (aiResponse != null) {
                    log.info("✅ Réponse Gemini reçue: {} caractères", aiResponse.length());
                    return aiResponse;
                } else {
                    throw new RuntimeException("Impossible d'extraire le texte de la réponse Gemini");
                }
            } else {
                log.error("❌ Réponse Gemini invalide: {}", response.getStatusCode());
                throw new RuntimeException("Réponse Gemini invalide: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("❌ Erreur API Gemini: {}", e.getMessage());
            throw new RuntimeException("Erreur de communication avec Gemini: " + e.getMessage(), e);
        }
    }
    
    private int calculateMaxTokensForQuestions(int questionCount) {
        // Estimation: 100 tokens par question pour 40 questions
        int baseTokens = 10000;
        int tokensPerQuestion = 300;
        
        int calculatedTokens = baseTokens + (questionCount * tokensPerQuestion);
        
        // Limiter à 16000 tokens (limite de Gemini)
        int maxTokens = Math.min(calculatedTokens, 30000);
        
        log.debug("📊 Calcul tokens: {} questions -> {} tokens", questionCount, maxTokens);
        return maxTokens;
    }
    
    private String extractTextFromGeminiResponse(Map<String, Object> responseBody) {
        try {
            log.debug("🔍 Extraction texte réponse Gemini...");
            
            if (responseBody == null) {
                throw new RuntimeException("Réponse Gemini nulle");
            }
            
            // Vérifier si il y a une erreur
            if (responseBody.containsKey("error")) {
                Map<String, Object> error = (Map<String, Object>) responseBody.get("error");
                String errorMsg = error != null ? error.toString() : "Erreur inconnue";
                throw new RuntimeException("Erreur Gemini: " + errorMsg);
            }
            
            // Structure normale de réponse Gemini
            if (responseBody.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
                
                if (candidates == null || candidates.isEmpty()) {
                    throw new RuntimeException("Aucun candidat dans la réponse Gemini");
                }
                
                Map<String, Object> firstCandidate = candidates.get(0);
                
                // Vérifier si le candidat est bloqué
                if (firstCandidate.containsKey("finishReason")) {
                    String finishReason = firstCandidate.get("finishReason").toString();
                    if ("SAFETY".equals(finishReason)) {
                        throw new RuntimeException("Réponse bloquée pour raison de sécurité");
                    }
                    if ("MAX_TOKENS".equals(finishReason)) {
                        log.warn("⚠️ Réponse tronquée (MAX_TOKENS) - augmentation maxOutputTokens recommandée");
                    }
                }
                
                if (firstCandidate.containsKey("content")) {
                    Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
                    
                    if (content.containsKey("parts")) {
                        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                        
                        if (parts != null && !parts.isEmpty()) {
                            Map<String, Object> firstPart = parts.get(0);
                            
                            if (firstPart.containsKey("text")) {
                                Object textObj = firstPart.get("text");
                                String text = textObj != null ? textObj.toString() : null;
                                
                                if (text != null && !text.trim().isEmpty()) {
                                    log.debug("✅ Texte extrait: {} caractères", text.length());
                                    return text.trim();
                                }
                            }
                        }
                    }
                }
            }
            
            throw new RuntimeException("Structure de réponse Gemini invalide");
            
        } catch (RuntimeException e) {
            throw e; // Propager les RuntimeExceptions
        } catch (Exception e) {
            log.error("❌ Erreur extraction texte réponse Gemini: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de l'extraction du texte: " + e.getMessage(), e);
        }
    }
    
    private List<Question> parseAIResponse(String aiResponse, int expectedCount) {
        log.info("🔍 Parsing réponse Gemini ({} caractères)", aiResponse.length());
        
        try {
            // Nettoyer et valider la réponse
            String cleanedResponse = cleanAndValidateAIResponse(aiResponse);
            
            // Afficher le JSON nettoyé pour débogage
            log.info("🧹 JSON nettoyé ({} caractères):", cleanedResponse.length());
            String jsonPreview = cleanedResponse.substring(0, Math.min(500, cleanedResponse.length()));
            log.info("📄 Extrait JSON: {}", jsonPreview + (cleanedResponse.length() > 500 ? "..." : ""));
            
            // Parser le JSON
            Map<String, Object> responseMap = objectMapper.readValue(cleanedResponse, Map.class);
            
            // Validation de la structure
            if (!responseMap.containsKey("questions")) {
                throw new RuntimeException("Champ 'questions' manquant dans la réponse JSON");
            }
            
            Object questionsObj = responseMap.get("questions");
            if (!(questionsObj instanceof List)) {
                throw new RuntimeException("Le champ 'questions' n'est pas une liste");
            }
            
            List<Map<String, Object>> questionsData = (List<Map<String, Object>>) questionsObj;
            
            if (questionsData.isEmpty()) {
                throw new RuntimeException("La liste des questions est vide");
            }
            
            List<Question> questions = new ArrayList<>();
            
            log.info("📊 Détection: {} questions dans la réponse JSON", questionsData.size());
            
            for (int i = 0; i < Math.min(questionsData.size(), expectedCount); i++) {
                Map<String, Object> qData = questionsData.get(i);
                
                log.info("🔧 Parsing question {}...", i + 1);
                
                Question question = parseQuestion(qData, i + 1);
                questions.add(question);
                
                log.info("   ✅ Question {} parsée avec succès", i + 1);
            }
            
            log.info("✅ {} questions parsées avec succès", questions.size());
            return questions;
            
        } catch (Exception e) {
            log.error("❌ Échec du parsing de la réponse Gemini: {}", e.getMessage());
            log.debug("🔍 Réponse brute complète: {}", aiResponse);
            throw new RuntimeException("Format de réponse invalide: " + e.getMessage(), e);
        }
    }
    
    private Question parseQuestion(Map<String, Object> qData, int questionNumber) {
        log.debug("   📝 Parsing détaillé question {}...", questionNumber);
        
        Question question = new Question();
        
        // Texte de la question (obligatoire)
        if (!qData.containsKey("text")) {
            log.error("   ❌ Champ 'text' manquant pour la question {}", questionNumber);
            throw new RuntimeException("Question " + questionNumber + ": champ 'text' manquant");
        }
        String text = qData.get("text").toString().trim();
        log.debug("   📖 Texte détecté ({} caractères): {}", text.length(), 
                 text.substring(0, Math.min(100, text.length())) + (text.length() > 100 ? "..." : ""));
        
        if (text.length() < 10) {
            log.error("   ❌ Texte trop court ({} caractères)", text.length());
            throw new RuntimeException("Question " + questionNumber + ": texte trop court");
        }
        if (text.length() > 500) {
            log.warn("   ⚠️ Texte très long ({} caractères)", text.length());
        }
        question.setText(text);
        
        // Type de question (optionnel, par défaut SINGLE_CHOICE)
        QuestionType type = QuestionType.SINGLE_CHOICE;
        if (qData.containsKey("type")) {
            String typeStr = qData.get("type").toString().toUpperCase();
            log.debug("   🔤 Type détecté: {}", typeStr);
            try {
                type = QuestionType.valueOf(typeStr);
            } catch (IllegalArgumentException e) {
                log.warn("   ⚠️ Type de question inconnu: {}, utilisation de SINGLE_CHOICE", typeStr);
            }
        } else {
            log.debug("   🔤 Type non spécifié, utilisation de SINGLE_CHOICE par défaut");
        }
        question.setType(type);
        
        // Réponse correcte - gérer les tableaux pour MULTIPLE_CHOICE
        if (!qData.containsKey("correctAnswer")) {
            log.error("   ❌ Champ 'correctAnswer' manquant pour la question {}", questionNumber);
            throw new RuntimeException("Question " + questionNumber + ": champ 'correctAnswer' manquant");
        }
        
        Object correctAnswerObj = qData.get("correctAnswer");
        String correctAnswer;
        
        if (correctAnswerObj instanceof List) {
            // C'est une liste pour MULTIPLE_CHOICE
            List<?> correctAnswersList = (List<?>) correctAnswerObj;
            List<String> correctAnswers = new ArrayList<>();
            
            for (Object answer : correctAnswersList) {
                if (answer != null) {
                    correctAnswers.add(answer.toString().trim());
                }
            }
            
            // Joindre les réponses avec des virgules
            correctAnswer = String.join(", ", correctAnswers);
            log.debug("   🎯 Réponse correcte MULTIPLE_CHOICE détectée: {}", correctAnswer);
        } else {
            // C'est une chaîne pour SINGLE_CHOICE ou TRUE_FALSE
            correctAnswer = correctAnswerObj.toString().trim();
            log.debug("   🎯 Réponse correcte détectée: {}", correctAnswer);
        }
        
        if (correctAnswer.isEmpty()) {
            log.error("   ❌ Réponse correcte vide");
            throw new RuntimeException("Question " + questionNumber + ": 'correctAnswer' vide");
        }
        question.setCorrectAnswer(correctAnswer);
        
        // Options (obligatoires)
        List<String> options = new ArrayList<>();
        if (qData.containsKey("options") && qData.get("options") instanceof List) {
            List<?> rawOptions = (List<?>) qData.get("options");
            log.debug("   📌 {} options détectées", rawOptions.size());
            
            for (int i = 0; i < rawOptions.size(); i++) {
                Object opt = rawOptions.get(i);
                if (opt != null) {
                    String option = opt.toString().trim();
                    if (!option.isEmpty()) {
                        options.add(option);
                        log.debug("     {}. {}", (char)('A' + i), option);
                    } else {
                        log.warn("     ⚠️ Option {} vide, ignorée", i + 1);
                    }
                } else {
                    log.warn("     ⚠️ Option {} nulle, ignorée", i + 1);
                }
            }
            
            // Validation des options selon le type
            if (type == QuestionType.TRUE_FALSE) {
                log.debug("   🔧 Question TRUE_FALSE détectée, validation des options");
                if (options.size() != 2 || !options.contains("Vrai") || !options.contains("Faux")) {
                    log.warn("   ⚠️ Options TRUE_FALSE invalides, utilisation des options par défaut");
                    options = Arrays.asList("Vrai", "Faux");
                }
            } else {
                if (options.size() < 2) {
                    log.error("   ❌ Pas assez d'options ({})", options.size());
                    throw new RuntimeException("Question " + questionNumber + ": pas assez d'options (" + options.size() + ")");
                }
                
                // Pour SINGLE_CHOICE, vérifier que la réponse est dans les options
                if (type == QuestionType.SINGLE_CHOICE) {
                    boolean foundCorrect = false;
                    for (String option : options) {
                        if (option.equals(correctAnswer)) {
                            foundCorrect = true;
                            break;
                        }
                    }
                    
                    if (!foundCorrect) {
                        log.error("   ❌ Réponse correcte '{}' non trouvée dans les options", correctAnswer);
                        throw new RuntimeException("Question " + questionNumber + ": la réponse correcte n'est pas dans les options");
                    } else {
                        log.debug("   ✅ Réponse correcte trouvée dans les options");
                    }
                }
                // Pour MULTIPLE_CHOICE, la validation est plus complexe, on l'ignore pour l'instant
            }
        } else {
            log.error("   ❌ Champ 'options' manquant ou invalide");
            throw new RuntimeException("Question " + questionNumber + ": champ 'options' manquant ou invalide");
        }
        
        question.setOptions(options);
        
        log.debug("   ✅ Question {} parsée avec succès ({} options, type: {})", 
                 questionNumber, options.size(), type);
        
        return question;
    }
    
    private String cleanAndValidateAIResponse(String response) {
        log.debug("🧹 Nettoyage et validation de la réponse");
        
        String cleaned = response.trim();
        
        // Supprimer les blocs markdown
        if (cleaned.startsWith("```json")) {
            log.debug("   🔧 Suppression du préfixe ```json");
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            log.debug("   🔧 Suppression du préfixe ```");
            cleaned = cleaned.substring(3);
        }
        
        if (cleaned.endsWith("```")) {
            log.debug("   🔧 Suppression du suffixe ```");
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        
        cleaned = cleaned.trim();
        log.debug("   📏 Longueur après nettoyage markdown: {} caractères", cleaned.length());
        
        // Trouver le début et la fin du JSON
        int jsonStart = cleaned.indexOf('{');
        int jsonEnd = cleaned.lastIndexOf('}');
        
        if (jsonStart == -1) {
            log.error("   ❌ Caractère '{' non trouvé dans la réponse");
            throw new RuntimeException("Structure JSON invalide: caractère '{' non trouvé");
        }
        
        if (jsonEnd == -1) {
            log.error("   ❌ Caractère '}' non trouvé dans la réponse");
            throw new RuntimeException("Structure JSON invalide: caractère '}' non trouvé");
        }
        
        if (jsonEnd < jsonStart) {
            log.error("   ❌ Positions invalides: {} < {}", jsonEnd, jsonStart);
            throw new RuntimeException("Structure JSON invalide: '}' avant '{'");
        }
        
        // Extraire uniquement le JSON
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
        log.debug("   📏 Longueur après extraction JSON: {} caractères", cleaned.length());
        
        // Valider que c'est du JSON valide
        try {
            objectMapper.readTree(cleaned);
            log.debug("   ✅ JSON valide détecté");
            return cleaned;
        } catch (Exception e) {
            log.error("   ❌ JSON invalide: {}", e.getMessage());
            throw new RuntimeException("JSON invalide dans la réponse: " + e.getMessage());
        }
    }
    
    private void validateGeneratedQuestions(List<Question> questions, int expectedCount) {
        log.info("🔍 Validation finale des questions générées...");
        
        if (questions == null) {
            throw new RuntimeException("Liste de questions nulle");
        }
        
        if (questions.isEmpty()) {
            throw new RuntimeException("Aucune question générée");
        }
        
        log.info("📊 {} questions à valider (attendues: {})", questions.size(), expectedCount);
        
        // Pour 40 questions, accepter un minimum de 30
        int minAcceptableQuestions = Math.max(30, expectedCount / 2);
        
        if (questions.size() < minAcceptableQuestions) {
            log.warn("⚠️ Seulement {} questions générées (minimum acceptable: {}, attendues: {})", 
                    questions.size(), minAcceptableQuestions, expectedCount);
        }
        
        // Valider chaque question
        int invalidQuestions = 0;
        for (int i = 0; i < questions.size(); i++) {
            Question q = questions.get(i);
            
            try {
                if (q.getText() == null || q.getText().trim().isEmpty()) {
                    log.warn("   ⚠️ Question {}: texte vide", i + 1);
                    invalidQuestions++;
                    continue;
                }
                
                if (q.getOptions() == null) {
                    log.warn("   ⚠️ Question {}: options nulles", i + 1);
                    invalidQuestions++;
                    continue;
                }
                
                if (q.getOptions().size() < 2) {
                    log.warn("   ⚠️ Question {}: seulement {} option(s)", i + 1, q.getOptions().size());
                    invalidQuestions++;
                    continue;
                }
                
                if (q.getCorrectAnswer() == null || q.getCorrectAnswer().trim().isEmpty()) {
                    log.warn("   ⚠️ Question {}: réponse correcte vide", i + 1);
                    invalidQuestions++;
                    continue;
                }
                
                log.debug("   ✅ Question {} validée avec succès", i + 1);
                
            } catch (Exception e) {
                log.warn("   ⚠️ Erreur validation question {}: {}", i + 1, e.getMessage());
                invalidQuestions++;
            }
        }
        
        if (invalidQuestions > 0) {
            log.warn("⚠️ {} questions invalides sur {}", invalidQuestions, questions.size());
        }
        
        // Si plus de la moitié des questions sont invalides, lancer une exception
        if (invalidQuestions > questions.size() / 2) {
            throw new RuntimeException("Trop de questions invalides: " + invalidQuestions + "/" + questions.size());
        }
        
        log.info("✅ Validation terminée: {} questions valides sur {}", 
                questions.size() - invalidQuestions, questions.size());
    }
    
    /**
     * Test simple de connexion
     */
    public String testSimplePrompt() {
        try {
            log.info("🧪 Test connexion Gemini");
            
            String simplePrompt = "Bonjour, réponds 'TEST OK' en français.";
            log.info("📤 Prompt de test: {}", simplePrompt);
            
            String response = callGeminiAPI(simplePrompt, 1);
            
            if (response != null && response.contains("TEST OK")) {
                log.info("✅ Test Gemini réussi: {}", response);
                return response;
            } else {
                log.error("❌ Réponse de test invalide: {}", response);
                throw new RuntimeException("Réponse de test invalide: " + response);
            }
            
        } catch (Exception e) {
            log.error("❌ Test Gemini échoué: {}", e.getMessage());
            throw new RuntimeException("Test Gemini échoué: " + e.getMessage(), e);
        }
    }
    
    /**
     * Test de génération JSON
     */
    public String testJSONGeneration() {
        try {
            log.info("🧪 Test génération JSON Gemini");
            
            String jsonPrompt = """
                Génère un simple JSON de test avec exactement ce format:
                {
                  "test": "ok",
                  "message": "ça fonctionne"
                }
                Ne rajoute aucun texte avant ou après le JSON.
                """;
            
            log.info("📤 Prompt JSON de test envoyé");
            
            String response = callGeminiAPI(jsonPrompt, 1);
            
            // Vérifier que c'est du JSON valide
            objectMapper.readTree(response);
            
            log.info("✅ JSON valide généré: {}", response);
            return response;
            
        } catch (Exception e) {
            log.error("❌ Test JSON échoué: {}", e.getMessage());
            throw new RuntimeException("Test JSON échoué: " + e.getMessage(), e);
        }
    }
    
    /**
     * Génère un quiz structuré pour RAG - 40 QUESTIONS
     */
    /**
     * Génère un quiz structuré pour RAG - 20 QUESTIONS
     */
    public List<Question> generateStructuredQuiz(String ragPrompt) {
        log.info("🎯 Génération quiz structuré RAG - 20 QUESTIONS ({} caractères)", ragPrompt.length());
        
        try {
            // Afficher un extrait du prompt RAG
            String promptPreview = ragPrompt.substring(0, Math.min(300, ragPrompt.length()));
            log.info("📝 Extrait prompt RAG: {}...", promptPreview);
            
            // Construire un prompt optimisé pour 20 questions
            String jsonPrompt = ragPrompt + 
                "\n\nIMPORTANT CRITIQUE - SUIVRE À LA LETTRE:\n" +
                "1. Retourne UNIQUEMENT un JSON valide\n" +
                "2. Format exact: {\"questions\": [{...}]}\n" +
                "3. GÉNÈRE EXACTEMENT 20 QUESTIONS (PAS 5, PAS 40)\n" +
                "4. Pas de texte avant ni après le JSON\n" +
                "5. Base-toi STRICTEMENT sur le contexte fourni\n" +
                "6. Répartis les questions sur différents aspects du contenu\n" +
                "7. Inclus des questions de différents niveaux de difficulté\n" +
                "8. Assure-toi que chaque question est unique et spécifique\n" +
                "9. Format de chaque question: {\"text\": \"...\", \"type\": \"SINGLE_CHOICE\", \"options\": [\"...\", \"...\", \"...\", \"...\"], \"correctAnswer\": \"...\"}";
            
            // Appel à Gemini avec configuration pour 20 questions
            String aiResponse = callGeminiAPI(jsonPrompt, 20);
            
            // Parsing strict pour 20 questions
            List<Question> questions = parseAIResponse(aiResponse, 20);
            
            // Afficher les questions générées
            displayGeneratedQuestions(questions);
            
            log.info("✅ Quiz RAG généré: {} questions valides (sur 20 demandées)", questions.size());
            return questions;
            
        } catch (Exception e) {
            log.error("❌ Erreur génération quiz RAG: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de la génération du quiz RAG: " + e.getMessage(), e);
        }
    }
    /**
     * Génère des embeddings (pour référence, peut échouer sans fallback)
     */
    public float[] generateEmbedding(String text) {
        try {
            log.info("🔍 Génération embedding pour texte ({} caractères)", text.length());
            
            String url = geminiApiUrl + "embedding-001:embedContent?key=" + geminiApiKey;
            
            Map<String, Object> request = new HashMap<>();
            
            Map<String, Object> content = new HashMap<>();
            Map<String, Object> part = new HashMap<>();
            part.put("text", text.substring(0, Math.min(500, text.length())));
            
            List<Map<String, Object>> parts = new ArrayList<>();
            parts.add(part);
            content.put("parts", parts);
            
            request.put("content", content);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, Map.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                
                if (body.containsKey("embedding")) {
                    Map<String, Object> embeddingData = (Map<String, Object>) body.get("embedding");
                    if (embeddingData.containsKey("values")) {
                        List<Double> values = (List<Double>) embeddingData.get("values");
                        float[] embedding = new float[values.size()];
                        
                        for (int i = 0; i < values.size(); i++) {
                            embedding[i] = values.get(i).floatValue();
                        }
                        
                        log.info("✅ Embedding généré avec {} ({} dimensions)", geminiModelName, embedding.length);
                        return embedding;
                    }
                }
            }
            
            throw new RuntimeException("Structure de réponse d'embedding invalide");
            
        } catch (Exception e) {
            log.error("❌ Erreur génération embedding: {}", e.getMessage());
            throw new RuntimeException("Impossible de générer l'embedding: " + e.getMessage(), e);
        }
    }
    
    /**
     * Vérifie si Gemini est disponible
     */
    public boolean isGeminiAvailable() {
        try {
            testSimplePrompt();
            return true;
        } catch (Exception e) {
            log.warn("⚠️ Gemini non disponible: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Génération simple de texte
     */
    public String generateText(String prompt) {
        try {
            log.info("📝 Génération texte simple: {} caractères", prompt.length());
            log.info("📤 Prompt: {}", prompt.substring(0, Math.min(200, prompt.length())) + (prompt.length() > 200 ? "..." : ""));
            
            String response = callGeminiAPI(prompt, 1);
            
            log.info("📥 Réponse texte: {}", response.substring(0, Math.min(200, response.length())) + (response.length() > 200 ? "..." : ""));
            
            return response;
        } catch (Exception e) {
            log.error("❌ Erreur génération texte: {}", e.getMessage());
            throw new RuntimeException("Erreur de génération de texte: " + e.getMessage(), e);
        }
    }
    
    public String getModelInfo() {
        return this.geminiModelName;
    }
    
    /**
     * Diagnostic du service
     */
    public Map<String, Object> getDiagnostic() {
        Map<String, Object> diagnostic = new HashMap<>();
        
        try {
            diagnostic.put("service", "OllamaService (Gemini uniquement)");
            diagnostic.put("model", geminiModelName);
            diagnostic.put("apiKeyConfigured", geminiApiKey != null && !geminiApiKey.isEmpty());
            diagnostic.put("fallbackDisabled", true);
            
            // Test de connexion
            try {
                String simpleTest = testSimplePrompt();
                diagnostic.put("connectionTest", "SUCCESS");
                diagnostic.put("connectionResponse", simpleTest.substring(0, Math.min(50, simpleTest.length())));
            } catch (Exception e) {
                diagnostic.put("connectionTest", "FAILED");
                diagnostic.put("connectionError", e.getMessage());
            }
            
            diagnostic.put("success", true);
            diagnostic.put("timestamp", new Date().toString());
            
        } catch (Exception e) {
            diagnostic.put("success", false);
            diagnostic.put("error", e.getMessage());
        }
        
        return diagnostic;
    }
}