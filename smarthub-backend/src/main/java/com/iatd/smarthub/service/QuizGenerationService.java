package com.iatd.smarthub.service;

import com.iatd.smarthub.dto.QuestionResponseDTO;
import com.iatd.smarthub.dto.QuizResponseDTO;
import com.iatd.smarthub.model.quiz.Question;
import com.iatd.smarthub.model.quiz.Quiz;
import com.iatd.smarthub.repository.QuestionRepository;
import com.iatd.smarthub.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizGenerationService {
    
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final OllamaService ollamaService;
    
    @Value("${gemini.model.name:gemini-2.5-flash}")
    private String geminiModelName;
    
    @Transactional
    public QuizResponseDTO generateQuizFromText(String content, String title, int questionCount) {
        log.info("Génération de quiz depuis texte utilisateur: {} ({} questions)", title, questionCount);
        
        try {
            // 1. Vérifier que le service AI est disponible
            if (!isAIServiceAvailable()) { // Utiliser notre méthode corrigée
                throw new RuntimeException("Le service AI (Gemini) n'est pas disponible. Vérifiez votre connexion internet et votre clé API.");
            }
            
            // 2. Préparer le prompt pour Gemini
            String prompt = buildQuizGenerationPrompt(content, questionCount);
            
            // 3. Appeler le service pour générer les questions
            List<Question> questions = ollamaService.generateQuestions(prompt, questionCount);
            
            // 4. Créer et sauvegarder le quiz
            Quiz quiz = new Quiz();
            quiz.setTitle(title);
            quiz.setDescription("Quiz généré depuis votre contenu avec Gemini AI");
            quiz.setActive(true);
            
            Quiz savedQuiz = quizRepository.save(quiz);
            
            // 5. Associer et sauvegarder les questions
            for (Question question : questions) {
                question.setQuiz(savedQuiz);
                questionRepository.save(question);
                savedQuiz.addQuestion(question);
            }
            
            // 6. Sauvegarder à nouveau
            quizRepository.save(savedQuiz);
            
            log.info("Quiz généré avec succès. ID: {}, Questions: {}", savedQuiz.getId(), questions.size());
            
            // 7. Convertir en DTO avec les questions
            return convertToResponseDTO(savedQuiz);
            
        } catch (Exception e) {
            log.error("Erreur lors de la génération du quiz", e);
            throw new RuntimeException("Erreur de génération du quiz: " + e.getMessage());
        }
    }
    
    /**
     * Vérifie si le service AI est disponible
     */
    private boolean isAIServiceAvailable() {
        try {
            // Essayer de générer un petit texte de test
            String testResponse = ollamaService.generateText("Test de connexion");
            return testResponse != null && !testResponse.toLowerCase().contains("erreur");
        } catch (Exception e) {
            log.warn("Service AI non disponible: {}", e.getMessage());
            return false;
        }
    }
    
    private QuizResponseDTO convertToResponseDTO(Quiz quiz) {
        QuizResponseDTO response = new QuizResponseDTO();
        response.setId(quiz.getId());
        response.setTitle(quiz.getTitle());
        response.setDescription(quiz.getDescription());
        response.setActive(quiz.getActive());
        response.setCreatedAt(quiz.getCreatedAt());
        response.setUpdatedAt(quiz.getUpdatedAt());
        
        // Convertir chaque Question en QuestionResponseDTO
        if (quiz.getQuestions() != null) {
            for (Question question : quiz.getQuestions()) {
                QuestionResponseDTO questionDto = convertQuestionToResponseDTO(question);
                response.addQuestion(questionDto);
            }
        }
        
        return response;
    }
    
    private QuestionResponseDTO convertQuestionToResponseDTO(Question question) {
        QuestionResponseDTO dto = new QuestionResponseDTO();
        dto.setId(question.getId());
        dto.setText(question.getText());
        dto.setType(question.getType());
        dto.setCorrectAnswer(question.getCorrectAnswer());
        dto.setOptions(question.getOptions());
        
        // Ajouter le quizId
        if (question.getQuiz() != null) {
            dto.setQuizId(question.getQuiz().getId());
        }
        
        return dto;
    }
    
    /**
     * Génère un quiz à partir d'un fichier uploadé
     */
    @Transactional
    public QuizResponseDTO generateQuizFromFile(String fileName, String fileContent, int questionCount) {
        log.info("Génération de quiz depuis fichier: {} ({} questions)", fileName, questionCount);
        
        try {
            // Déterminer le titre à partir du nom du fichier
            String title = extractTitleFromFileName(fileName);
            
            // Utiliser la méthode de génération depuis texte
            return generateQuizFromText(fileContent, title, questionCount);
            
        } catch (Exception e) {
            log.error("Erreur lors de la génération depuis fichier", e);
            throw new RuntimeException("Erreur de génération depuis fichier: " + e.getMessage());
        }
    }
    
    /**
     * Génère un quiz à partir d'une URL
     */
    @Transactional
    public QuizResponseDTO generateQuizFromUrl(String url, int questionCount) {
        log.info("Génération de quiz depuis URL: {} ({} questions)", url, questionCount);
        
        try {
            // 1. Extraire le contenu depuis l'URL
            String extractedContent = extractContentFromUrl(url);
            
            if (extractedContent == null || extractedContent.trim().isEmpty()) {
                throw new RuntimeException("Impossible d'extraire le contenu depuis l'URL");
            }
            
            // 2. Générer le titre
            String title = "Quiz depuis: " + extractTitleFromUrl(url);
            
            // 3. Générer le quiz
            return generateQuizFromText(extractedContent, title, questionCount);
            
        } catch (Exception e) {
            log.error("Erreur lors de la génération depuis URL", e);
            throw new RuntimeException("Erreur de génération depuis URL: " + e.getMessage());
        }
    }
    
    /**
     * Génère un quiz lié à un cours spécifique
     */
    @Transactional
    public QuizResponseDTO generateQuizForCourse(String content, String title, int questionCount, Long courseId) {
        log.info("Génération de quiz pour le cours ID: {}, titre: {}", courseId, title);
        
        try {
            // Générer le quiz normalement
            QuizResponseDTO quizResponse = generateQuizFromText(content, title, questionCount);
            
            // Récupérer le quiz créé
            Quiz quiz = quizRepository.findById(quizResponse.getId())
                .orElseThrow(() -> new RuntimeException("Quiz non trouvé après création"));
            
            // TODO: Associer au cours quand vous aurez un service CourseService
            // quiz.setCourse(courseService.findById(courseId));
            
            quizRepository.save(quiz);
            
            return quizResponse;
            
        } catch (Exception e) {
            log.error("Erreur lors de la génération du quiz pour le cours", e);
            throw new RuntimeException("Erreur de génération du quiz pour le cours: " + e.getMessage());
        }
    }
    
    /**
     * Construit le prompt pour Gemini
     */
    private String buildQuizGenerationPrompt(String content, int questionCount) {
        // Limiter la taille du contenu
        String limitedContent = content.length() > 3000 
            ? content.substring(0, 3000) + "... [contenu tronqué]" 
            : content;
        
        return String.format("""
            TU ES UN EXPERT PÉDAGOGIQUE EN CRÉATION DE QUIZ. 
            
            TÂCHE: Crée EXACTEMENT %d questions de quiz PERTINENTES et PRÉCISES basées sur ce contenu.
            
            CONTENU:
            %s
            
            --------------------------------------------------------------------------
            RÈGLES STRICTES À SUIVRE :
            --------------------------------------------------------------------------
            1. CHAQUE QUESTION DOIT ÊTRE SPÉCIFIQUE AU CONTENU
            2. VARIÉTÉ DES TYPES :
               - SINGLE_CHOICE : 1 seule bonne réponse parmi 4 options
               - MULTIPLE_CHOICE : 2-3 bonnes réponses parmi 4-5 options
               - TRUE_FALSE : UNIQUEMENT "Vrai" et "Faux"
            3. QUALITÉ DES QUESTIONS :
               - Questions claires et non ambiguës
               - Options plausibles et distinctes
               - Pas de répétitions
            4. FORMATE JSON EXACT :
            
            {
              "questions": [
                {
                  "text": "Question précise et concise?",
                  "type": "SINGLE_CHOICE | MULTIPLE_CHOICE | TRUE_FALSE",
                  "options": ["Option A", "Option B", "Option C", "Option D"],
                  "correctAnswer": "Pour SINGLE_CHOICE : 'Option A' | Pour MULTIPLE_CHOICE : 'Option A,Option C' | Pour TRUE_FALSE : 'Vrai' ou 'Faux'"
                }
              ]
            }
            
            --------------------------------------------------------------------------
            EXEMPLES CORRECTS :
            --------------------------------------------------------------------------
            EXEMPLE SINGLE_CHOICE (Java) :
            {
              "text": "Quel mot-clé déclare une constante en Java?",
              "type": "SINGLE_CHOICE",
              "options": ["final", "static", "const", "constant"],
              "correctAnswer": "final"
            }
            
            EXEMPLE MULTIPLE_CHOICE (Spring Boot) :
            {
              "text": "Quels sont les avantages de Spring Boot?",
              "type": "MULTIPLE_CHOICE",
              "options": ["Configuration automatique", "Serveurs embarqués", "Requiert XML complexe", "Démarrage rapide"],
              "correctAnswer": "Configuration automatique,Serveurs embarqués,Démarrage rapide"
            }
            
            EXEMPLE TRUE_FALSE :
            {
              "text": "En Java, 'package' est l'équivalent de 'namespace' dans d'autres langages.",
              "type": "TRUE_FALSE",
              "options": ["Vrai", "Faux"],
              "correctAnswer": "Vrai"
            }
            
            --------------------------------------------------------------------------
            CONSIGNES FINALES :
            --------------------------------------------------------------------------
            1. UTILISE LE CONTENU FOURNI POUR GÉNÉRER DES QUESTIONS SPÉCIFIQUES
            2. PAS DE QUESTIONS GÉNÉRIQUES
            3. PAS DE 'namespace' EN JAVA - UTILISE 'package'
            4. POUR TRUE_FALSE : SEULEMENT ["Vrai", "Faux"] - PAS D'AUTRES OPTIONS
            5. NÉTTOYE LES OPTIONS : PAS D'ESPACES INUTILES AU DÉBUT/FIN
            6. RÉPONDS UNIQUEMENT AVEC LE JSON - PAS DE TEXTE SUPPLÉMENTAIRE
            7. ASSURE-TOI QUE LE NOMBRE TOTAL DE QUESTIONS EST %d
            
            JSON DE RÉPONSE :
            """, questionCount, limitedContent, questionCount);
    }
    
    /**
     * Extrait un titre depuis le nom de fichier
     */
    private String extractTitleFromFileName(String fileName) {
        // Retirer l'extension
        String nameWithoutExt = fileName.replaceAll("\\.[^.]+$", "");
        // Remplacer les underscores et tirets par des espaces
        nameWithoutExt = nameWithoutExt.replaceAll("[_-]", " ");
        // Capitaliser les mots
        return capitalizeWords(nameWithoutExt);
    }
    
    private String capitalizeWords(String text) {
        if (text == null || text.isEmpty()) return text;
        
        String[] words = text.split("\\s+");
        StringBuilder result = new StringBuilder();
        
        for (String word : words) {
            if (!word.isEmpty()) {
                result.append(Character.toUpperCase(word.charAt(0)))
                      .append(word.substring(1).toLowerCase())
                      .append(" ");
            }
        }
        
        return result.toString().trim();
    }
    
    /**
     * Extrait le titre depuis une URL
     */
    private String extractTitleFromUrl(String url) {
        try {
            // Extraire le domaine et le chemin
            String cleanUrl = url.replaceFirst("^(https?://)?(www\\.)?", "");
            String[] parts = cleanUrl.split("/");
            
            if (parts.length > 0 && !parts[0].isEmpty()) {
                String domain = parts[0].replaceAll("\\..*$", ""); // Retirer extension
                return capitalizeWords(domain.replaceAll("[.-]", " "));
            }
            return "Page web";
            
        } catch (Exception e) {
            return "Contenu web";
        }
    }
    
    /**
     * Extrait le contenu depuis une URL (à implémenter avec Jsoup)
     */
    private String extractContentFromUrl(String url) {
        log.info("Extraction du contenu depuis URL: {}", url);
        
        // Pour l'instant, lancer une exception car non implémenté
        throw new UnsupportedOperationException(
            "L'extraction depuis URL nécessite l'ajout de la dépendance Jsoup. " +
            "Veuillez utiliser l'upload de fichier ou le copier-coller pour le moment."
        );
    }
    
    /**
     * Méthode utilitaire pour vérifier l'état du service
     */
    public String getServiceStatus() {
        boolean aiAvailable = isAIServiceAvailable();
        
        return String.format("""
            QuizGenerationService Status:
            - Gemini AI disponible: %s
            - Modèle: %s
            - Base de données: OK
            """, 
            aiAvailable ? "✅ OUI" : "❌ NON",
            geminiModelName
        );
    }
    
    /**
     * Version alternative avec gestion d'erreur plus élégante
     */
    @Transactional
    public QuizResponseDTO generateQuizSafely(String content, String title, int questionCount) {
        try {
            return generateQuizFromText(content, title, questionCount);
        } catch (RuntimeException e) {
            // Log l'erreur mais retourne un quiz minimal
            log.warn("Génération AI échouée, création d'un quiz de secours: {}", e.getMessage());
            
            Quiz quiz = new Quiz();
            quiz.setTitle(title + " (quiz de secours)");
            quiz.setDescription("Quiz créé manuellement suite à une erreur de génération AI");
            quiz.setActive(true);
            
            Quiz savedQuiz = quizRepository.save(quiz);
            
            // Ajouter quelques questions par défaut
            Question defaultQuestion = new Question();
            defaultQuestion.setText("Cette question a été créée manuellement car le service AI n'a pas pu générer de questions.");
            defaultQuestion.setType(com.iatd.smarthub.model.quiz.QuestionType.SINGLE_CHOICE);
            defaultQuestion.setCorrectAnswer("Oui");
            defaultQuestion.setOptions(List.of("Oui", "Non", "Peut-être", "Je ne sais pas"));
            defaultQuestion.setQuiz(savedQuiz);
            
            questionRepository.save(defaultQuestion);
            savedQuiz.addQuestion(defaultQuestion);
            quizRepository.save(savedQuiz);
            
            return convertToResponseDTO(savedQuiz);
        }
    }
}