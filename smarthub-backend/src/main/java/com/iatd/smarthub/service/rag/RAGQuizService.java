package com.iatd.smarthub.service.rag;

import com.iatd.smarthub.dto.QuizResponseDTO;
import com.iatd.smarthub.dto.QuestionResponseDTO;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.model.course.CourseFile;
import com.iatd.smarthub.model.rag.KnowledgeBase;
import com.iatd.smarthub.model.rag.LearningProfile;
import com.iatd.smarthub.model.rag.QuizRecommendation;
import com.iatd.smarthub.model.quiz.QuestionType;
import com.iatd.smarthub.repository.CourseFileRepository;
import com.iatd.smarthub.repository.UserRepository;
import com.iatd.smarthub.repository.rag.KnowledgeBaseRepository;
import com.iatd.smarthub.repository.rag.LearningProfileRepository;
import com.iatd.smarthub.repository.rag.QuizRecommendationRepository;
import com.iatd.smarthub.service.OllamaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Import PDFBox pour extraction réelle - CORRIGÉ pour version 3.0.2
import org.apache.pdfbox.Loader;  // IMPORTANT: Nouveau dans PDFBox 3.x
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RAGQuizService {
    
    // DÉPENDANCES
    private final CourseFileRepository courseFileRepository;
    private final UserRepository userRepository;
    private final OllamaService ollamaService;
    private final RAGQuizGenerationService ragQuizGenerationService;
    private final KnowledgeBaseRepository knowledgeBaseRepository;
    private final LearningProfileRepository learningProfileRepository;
    private final QuizRecommendationRepository quizRecommendationRepository;
    private final VectorRAGService vectorRAGService;
    private final EmbeddingService embeddingService;
    
    /**
     * Génère un quiz basé sur les fichiers d'un cours
     */
    @Transactional
    public QuizResponseDTO generatePersonalizedQuizForCourse(Long userId, Long courseId, String courseTitle) {
        log.info("📚 Génération quiz pour cours - userId: {}, courseId: {}, title: {}", 
                 userId, courseId, courseTitle);
        
        try {
            // 1. Récupérer l'utilisateur
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé: " + userId));
            
            // 2. Récupérer ou créer le profil
            LearningProfile profile = learningProfileRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultProfile(user));
            
            // 3. RÉCUPÉRER LES FICHIERS DU COURS
            List<CourseFile> courseFiles = courseFileRepository.findByCourseId(courseId);
            
            if (courseFiles.isEmpty()) {
                log.error("❌ AUCUN fichier trouvé pour le cours {}", courseId);
                throw new RuntimeException("Le cours n'a pas de fichiers disponibles");
            }
            
            log.info("📁 {} fichier(s) trouvé(s) pour le cours '{}': {}", 
                    courseFiles.size(), courseTitle,
                    courseFiles.stream()
                        .limit(3)
                        .map(CourseFile::getFileName)
                        .collect(Collectors.joining(", ")));
            
            // 4. LIRE LE VRAI CONTENU DES FICHIERS
            Map<String, String> fileContents = readRealFilesContent(courseFiles);
            
            // 5. Valider la pertinence du contenu
            validateContentRelevance(courseTitle, fileContents);
            
            // 6. Construire un prompt AVEC LE VRAI CONTENU - CORRIGÉ
            String ragPrompt = buildStrictRAGPrompt(courseTitle, profile, courseFiles, fileContents);
            
            log.debug("📝 Prompt cours généré: {} caractères", ragPrompt.length());
            
            // 7. Générer le quiz avec le vrai contenu - CHANGEMENT 1: 20 au lieu de 5
            QuizResponseDTO quiz = ragQuizGenerationService.generateQuizFromRAGPrompt(
                ragPrompt,
                "Quiz: " + courseTitle,
                20  // CHANGÉ DE 5 À 20
            );
            
            // 8. Enregistrer la recommandation
            saveCourseRecommendation(user, courseId, courseTitle, courseFiles);
            
            // 9. Mettre à jour le profil avec le cours
            updateProfileWithCourse(profile, courseTitle);
            
            log.info("✅ Quiz de cours généré avec succès: {} questions", quiz.getQuestions().size());
            return quiz;
            
        } catch (Exception e) {
            log.error("❌ Erreur génération quiz cours: {}", e.getMessage(), e);
            // Fallback: générer un quiz basique
            return generateFallbackCourseQuiz(courseId, courseTitle);
        }
    }
    
    /**
     * Lit le VRAI contenu des fichiers
     */
    private Map<String, String> readRealFilesContent(List<CourseFile> courseFiles) {
        Map<String, String> contents = new HashMap<>();
        
        for (CourseFile file : courseFiles) {
            try {
                String content = extractFileContent(file);
                if (content != null && !content.trim().isEmpty()) {
                    contents.put(file.getFileName(), content);
                    log.info("✅ Contenu EXTRACT pour {}: {} caractères", 
                            file.getFileName(), content.length());
                    
                    // Log du début du contenu pour vérification
                    String preview = content.length() > 200 ? 
                        content.substring(0, 200) + "..." : content;
                    log.debug("📄 Prévisualisation {}: {}", file.getFileName(), preview);
                } else {
                    log.warn("⚠️ Contenu vide ou non lisible pour {}", file.getFileName());
                    contents.put(file.getFileName(), 
                        "Fichier: " + file.getFileName() + 
                        " (Type: " + file.getFileType() + 
                        ", Taille: " + formatFileSize(file.getFileSize()) + ")" +
                        "\n\n⚠️ Impossible d'extraire le contenu textuel.");
                }
            } catch (Exception e) {
                log.error("❌ Erreur extraction {}: {}", file.getFileName(), e.getMessage());
                contents.put(file.getFileName(), 
                    "Fichier: " + file.getFileName() + 
                    " - Erreur d'extraction: " + e.getMessage());
            }
        }
        
        return contents;
    }
    
    /**
     * Extrait le contenu d'un fichier (méthode principale)
     */
    private String extractFileContent(CourseFile file) {
        try {
            if (file.getFilePath() == null || file.getFilePath().isEmpty()) {
                log.warn("⚠️ Chemin de fichier vide pour {}", file.getFileName());
                return null;
            }
            
            String uploadDir = "uploads/";
            Path filePath = Paths.get(uploadDir, file.getFilePath()).toAbsolutePath().normalize();
            log.info("📁 Recherche fichier à: {}", filePath);
            
            if (!Files.exists(filePath)) {
                log.warn("⚠️ Fichier non trouvé: {}", file.getFilePath());
                return "Fichier non trouvé: " + file.getFileName();
            }
            
            String fileType = file.getFileType() != null ? 
                file.getFileType().toLowerCase() : "unknown";
            
            log.info("🔍 Extraction fichier: {} (Type: {})", file.getFileName(), fileType);
            
            // 1. Fichiers texte
            if (fileType.contains("txt") || fileType.contains("md") || 
                fileType.contains("csv") || fileType.contains("json")) {
                try {
                    String content = Files.readString(filePath);
                    log.info("📄 Fichier texte lu: {} caractères", content.length());
                    return content;
                } catch (IOException e) {
                    log.error("❌ Erreur lecture fichier texte: {}", e.getMessage());
                    return "Erreur lecture: " + e.getMessage();
                }
            }
            
            // 2. FICHIERS PDF - EXTRACTION RÉELLE (CORRIGÉ POUR PDFBox 3.x)
            if (fileType.contains("pdf")) {
                return extractRealPDFContent(filePath);
            }
            
            // 3. Autres types
            return "Type de fichier: " + fileType.toUpperCase() + 
                   "\nFichier: " + file.getFileName() +
                   "\nTaille: " + formatFileSize(file.getFileSize());
            
        } catch (Exception e) {
            log.error("❌ Erreur extraction {}: {}", file.getFileName(), e.getMessage());
            throw new RuntimeException("Erreur extraction fichier: " + e.getMessage());
        }
    }
    
    /**
     * Extrait le VRAI contenu d'un PDF avec PDFBox 3.0.2 - CORRIGÉ
     */
    private String extractRealPDFContent(Path filePath) {
        log.info("📖 Extraction RÉELLE PDF avec PDFBox 3.0.2: {}", filePath.getFileName());
        
        // CORRECTION: Utiliser Loader.loadPDF() au lieu de PDDocument.load()
        try (PDDocument document = Loader.loadPDF(filePath.toFile())) {
            
            // Vérifier si le PDF est chiffré
            if (document.isEncrypted()) {
                log.warn("🔒 PDF chiffré détecté: {}", filePath.getFileName());
                return "PDF protégé (chiffré) - impossible d'extraire le contenu";
            }
            
            int pageCount = document.getNumberOfPages();
            log.info("📄 PDF détecté: {} pages", pageCount);
            
            if (pageCount == 0) {
                log.warn("⚠️ PDF vide: 0 pages");
                return "PDF vide (0 pages)";
            }
            
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            stripper.setWordSeparator(" ");
            
            // CHANGEMENT 2: 20 pages au lieu de 15 pour 20 questions
            stripper.setStartPage(1);
            stripper.setEndPage(Math.min(pageCount, 20));
            
            String text = stripper.getText(document);
            text = cleanExtractedText(text);
            
            // Analyse du contenu extrait
            analyzeExtractedContent(filePath.getFileName().toString(), text);
            
            log.info("✅ PDF extrait avec succès: {} caractères", text.length());
            return text;
            
        } catch (IOException e) {
            // Vérifier si c'est une erreur de mot de passe (PDFBox 3.x)
            if (e.getMessage() != null && 
                (e.getMessage().contains("password") || 
                 e.getMessage().contains("Password") ||
                 e.getMessage().contains("encrypted") ||
                 e.getMessage().contains("Encrypted"))) {
                log.error("🔒 PDF protégé par mot de passe: {}", filePath.getFileName());
                return "PDF protégé par mot de passe - impossible d'extraire le contenu";
            }
            
            log.error("❌ Erreur extraction PDF Box: {}", e.getMessage());
            return "Erreur extraction PDF: " + e.getMessage();
        } catch (Exception e) {
            log.error("❌ Erreur inattendue PDF: {}", e.getMessage(), e);
            return "Erreur inattendue: " + e.getMessage();
        }
    }
    
    /**
     * Nettoie le texte extrait
     */
    private String cleanExtractedText(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        
        // 1. Supprimer les sauts de ligne multiples
        text = text.replaceAll("\\n{3,}", "\n\n");
        
        // 2. Supprimer les espaces multiples
        text = text.replaceAll("\\s{2,}", " ");
        
        // 3. Supprimer les caractères de contrôle
        text = text.replaceAll("[\\x00-\\x1F\\x7F]", "");
        
        // 4. Nettoyer les en-têtes/pieds de page communs
        text = text.replaceAll("Page\\s+\\d+\\s+of\\s+\\d+", "");
        text = text.replaceAll("\\d{1,2}/\\d{1,2}/\\d{4}", "");
        
        // 5. Supprimer les numéros de page isolés
        text = text.replaceAll("^\\d+$", "");
        
        // 6. Supprimer les lignes trop courtes (moins de 3 caractères)
        text = Arrays.stream(text.split("\n"))
            .filter(line -> line.trim().length() > 3)
            .collect(Collectors.joining("\n"));
        
        return text.trim();
    }
    
    /**
     * Analyse le contenu extrait
     */
    private void analyzeExtractedContent(String fileName, String content) {
        log.info("📊 ANALYSE CONTENU PDF '{}':", fileName);
        log.info("  - Longueur totale: {} caractères", content.length());
        
        String[] lines = content.split("\n");
        log.info("  - Nombre de lignes: {}", lines.length);
        
        String[] words = content.split("\\s+");
        log.info("  - Nombre de mots: {}", words.length);
        
        // Détection de mots-clés MLOps
        String lowerContent = content.toLowerCase();
        
        // Mots-clés MLOps
        String[] mlopsKeywords = {
            "mlops", "machine learning operations", "model deployment", 
            "model monitoring", "pipeline", "ci/cd", "versioning",
            "explainable ai", "model interpretability", "shap", "lime",
            "feature store", "model registry", "experiment tracking"
        };
        
        log.info("  - MOTS-CLÉS DÉTECTÉS:");
        for (String keyword : mlopsKeywords) {
            if (lowerContent.contains(keyword)) {
                log.info("    ✓ '{}'", keyword);
            }
        }
        
        // Détection de sections
        if (content.contains("#") || content.contains("##")) {
            log.info("  - Structure Markdown détectée");
        }
        
        if (content.contains("```")) {
            log.info("  - Code source détecté");
        }
        
        // Extraire un échantillon pour vérification
        String sample = content.length() > 300 ? 
            content.substring(0, 300) + "..." : content;
        log.debug("  - ÉCHANTILLON: {}", sample.replace("\n", " "));
    }
    
    /**
     * Construit un prompt STRICT basé sur le vrai contenu - CORRIGÉ POUR ÉVITER LES PLACEHOLDERS
     */
    private String buildStrictRAGPrompt(String courseTitle, LearningProfile profile, 
                                       List<CourseFile> files, Map<String, String> fileContents) {
        
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("""
            ⚠️⚠️⚠️ INSTRUCTION CRITIQUE - SUIVRE À LA LETTRE ⚠️⚠️⚠️
            
            TU ES UN MODÈLE GEMINI AI SPÉCIALISÉ EN CRÉATION DE QUIZ PÉDAGOGIQUE.
            
            TU DOIS GÉNÉRER DES QUESTIONS UNIQUEMENT ET EXCLUSIVEMENT À PARTIR 
            DU CONTENU EXACT FOURNI CI-DESSOUS. 
            
            ABSOLUMENT INTERDIT:
            - D'utiliser tes connaissances générales
            - D'inventer des concepts non présents dans le contenu
            - De faire des suppositions sur le sujet
            
            CONTEXTE DU COURS:
            Titre: """).append(courseTitle).append("""
            
            Nombre de fichiers: """).append(files.size()).append("""
            
            Profil étudiant:
            - Niveau: """).append(translateProficiencyLevel(profile.getProficiencyLevel())).append("""
            - Intérêts: """).append(profile.getInterests() != null ? 
                String.join(", ", profile.getInterests()) : "Non spécifié").append("""
            
            """).append("=".repeat(80)).append("\n\n");
        
        // 1. ANALYSE DÉTAILLÉE DU CONTENU
        prompt.append("📊 CONTENU EXACT DES FICHIERS (NE PAS INVENTER):\n\n");
        
        int fileIndex = 1;
        for (Map.Entry<String, String> entry : fileContents.entrySet()) {
            String fileName = entry.getKey();
            String content = entry.getValue();
            
            prompt.append("📄 FICHIER ").append(fileIndex).append(": ").append(fileName).append("\n");
            prompt.append("-".repeat(50)).append("\n");
            
            // CHANGEMENT 3: 3000 caractères au lieu de 2000 pour 20 questions
            String limitedContent = content.length() > 3000 ? 
                content.substring(0, 3000) + "\n\n[... contenu tronqué pour raison de longueur ...]" :
                content;
            
            prompt.append(limitedContent).append("\n\n");
            
            // Indicateur de fin de fichier
            prompt.append("✓ Fin du fichier ").append(fileIndex).append("\n\n");
            fileIndex++;
        }
        
        prompt.append("=".repeat(80)).append("\n\n");
        
        // 2. INSTRUCTIONS DE GÉNÉRATION TRÈS STRICTES - CHANGEMENT 4: 20 questions
        prompt.append("""
            🎯 RÈGLES DE GÉNÉRATION DES QUESTIONS:
            
            POUR CHAQUE QUESTION, TU DOIS:
            1. Identifier PRÉCISÉMENT le passage source dans le contenu
            2. Utiliser la TERMINOLOGIE EXACTE du contenu
            3. Référencer le nom du fichier dans l'explication
            4. Ne pas modifier, extrapoler ou interpréter le contenu
            
            TYPES DE QUESTIONS REQUIS (20 questions total):
            - 18 questions SINGLE_CHOICE (une seule bonne réponse)
            - 1 question MULTIPLE_CHOICE (plusieurs bonnes réponses)
            - 1 question TRUE_FALSE (vrai/faux)
            
            CRITÈRES DE QUALITÉ:
            ✓ Questions CLAIRES et SPÉCIFIQUES
            ✓ Options PLAUSIBLES mais une seule bonne réponse (sauf multiple_choice)
            ✓ Réponses DIRECTEMENT dans le texte
            ✓ Explications qui CITENT le texte source
            
            EXEMPLE DE FORMAT REQUIS:
            Si le contenu dit: "Le deep learning utilise des réseaux de neurones à plusieurs couches."
            
            Alors génère:
            Question: "Que signifie 'deep' dans 'deep learning'?"
            Options: [
              "La profondeur des réseaux de neurones",
              "La complexité des algorithmes", 
              "La difficulté d'apprentissage",
              "Le nom du créateur"
            ]
            Réponse correcte: "La profondeur des réseaux de neurones"
            Explication: "Basé sur le fichier X, ligne Y: 'Le deep learning utilise des réseaux de neurones à plusieurs couches.'"
            
            """).append("=".repeat(80)).append("\n\n");
        
        // 3. FORMAT JSON STRICT SANS PLACEHOLDERS LITTÉRAUX - CORRECTION CRITIQUE
        prompt.append("""
            FORMAT DE SORTIE (JSON UNIQUEMENT - PAS DE TEXTE SUPPLÉMENTAIRE):
            
            {
              "questions": [
                {
                  "text": "QUESTION_TEXT",
                  "type": "SINGLE_CHOICE",
                  "options": ["OPTION_1", "OPTION_2", "OPTION_3", "OPTION_4"],
                  "correctAnswer": "CORRECT_OPTION",
                  "explanation": "EXPLANATION_WITH_SOURCE"
                }
              ]
            }
            
            REMPLACER:
            - "QUESTION_TEXT" par une vraie question basée sur le contenu
            - "OPTION_1", "OPTION_2", etc. par de vraies options distinctes
            - "CORRECT_OPTION" par l'option correcte
            - "EXPLANATION_WITH_SOURCE" par une explication qui cite le fichier et la ligne
            
            ⚠️ IMPORTANT FINAL:
            - Retourner UNIQUEMENT le JSON
            - PAS de commentaires
            - PAS d'explications supplémentaires
            - 20 questions exactement
            - Chaque question doit avoir une source identifiable dans le contenu
            - NE PAS copier les textes d'exemple comme "Question précise basée sur le contenu?"
            """);
        
        return prompt.toString();
    }
    
    /**
     * Valide la pertinence du contenu pour le cours
     */
    private void validateContentRelevance(String courseTitle, Map<String, String> fileContents) {
        log.info("🔍 Validation pertinence contenu pour: {}", courseTitle);
        
        String courseLower = courseTitle.toLowerCase();
        int relevantFiles = 0;
        
        for (Map.Entry<String, String> entry : fileContents.entrySet()) {
            String fileName = entry.getKey();
            String content = entry.getValue().toLowerCase();
            
            boolean isRelevant = false;
            
            // Vérification pour MLOps
            if (courseLower.contains("mlops")) {
                if (content.contains("mlops") || 
                    content.contains("machine learning operations") ||
                    content.contains("model deployment") ||
                    content.contains("ci/cd") ||
                    content.contains("pipeline")) {
                    isRelevant = true;
                    log.info("✅ Contenu MLOps détecté dans: {}", fileName);
                }
            }
            
            // Vérification pour Explainable AI
            if (courseLower.contains("explainable")) {
                if (content.contains("explainable") || 
                    content.contains("interpretable") ||
                    content.contains("shap") ||
                    content.contains("lime") ||
                    content.contains("feature importance")) {
                    isRelevant = true;
                    log.info("✅ Contenu Explainable AI détecté dans: {}", fileName);
                }
            }
            
            // Vérification générale
            if (!isRelevant && content.length() > 100) {
                // Vérifier les mots communs au titre du cours
                String[] titleWords = courseLower.split("\\s+");
                int matchingWords = 0;
                for (String word : titleWords) {
                    if (word.length() > 3 && content.contains(word)) {
                        matchingWords++;
                    }
                }
                
                if (matchingWords >= titleWords.length * 0.3) { // 30% de correspondance
                    isRelevant = true;
                    log.info("✅ Correspondance partielle détectée dans: {}", fileName);
                }
            }
            
            if (isRelevant) {
                relevantFiles++;
            } else if (content.length() > 200) {
                log.warn("⚠️ Contenu potentiellement non pertinent: {}", fileName);
            }
        }
        
        if (relevantFiles == 0) {
            log.warn("⚠️⚠️ AUCUN contenu pertinent détecté pour le cours: {}", courseTitle);
            log.warn("⚠️ Les questions générées peuvent ne pas correspondre au sujet");
        } else {
            log.info("✅ {} fichier(s) pertinent(s) détecté(s) sur {}", 
                    relevantFiles, fileContents.size());
        }
    }
    
    /**
     * Formate la taille du fichier
     */
    private String formatFileSize(Long bytes) {
        if (bytes == null) return "Taille inconnue";
        
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024) + " KB";
        return (bytes / (1024 * 1024)) + " MB";
    }
    
    /**
     * Traduction des niveaux
     */
    private String translateProficiencyLevel(String level) {
        if (level == null) return "Intermédiaire";
        return switch (level.toUpperCase()) {
            case "BEGINNER" -> "Débutant";
            case "INTERMEDIATE" -> "Intermédiaire";
            case "ADVANCED" -> "Avancé";
            case "EXPERT" -> "Expert";
            default -> "Intermédiaire";
        };
    }
    
    /**
     * Mise à jour du profil avec le cours
     */
    private void updateProfileWithCourse(LearningProfile profile, String courseTitle) {
        try {
            if (profile.getInterests() == null) {
                profile.setInterests(new ArrayList<>());
            }
            
            if (!profile.getInterests().contains(courseTitle)) {
                if (profile.getInterests().size() >= 10) {
                    profile.getInterests().remove(0);
                }
                profile.getInterests().add(courseTitle);
                learningProfileRepository.save(profile);
                log.debug("📝 Cours '{}' ajouté aux intérêts du profil", courseTitle);
            }
        } catch (Exception e) {
            log.warn("⚠️ Erreur mise à jour profil: {}", e.getMessage());
        }
    }
    
    /**
     * Fallback: génère un quiz basique
     */
    private QuizResponseDTO generateFallbackCourseQuiz(Long courseId, String courseTitle) {
        log.warn("🔄 Utilisation du fallback pour le cours {}", courseTitle);
        
        List<CourseFile> files = courseFileRepository.findByCourseId(courseId);
        
        QuizResponseDTO quiz = new QuizResponseDTO();
        quiz.setTitle("Quiz: " + courseTitle);
        quiz.setDescription("Quiz basé sur les fichiers du cours (mode fallback)");
        quiz.setQuestions(new ArrayList<>());
        
        // CHANGEMENT 5: Générer 20 questions de fallback au lieu de 5
        for (int i = 1; i <= 20; i++) {
            QuestionResponseDTO q = new QuestionResponseDTO();
            
            if (i <= 18) {
                // Questions SINGLE_CHOICE
                q.setText("Question " + i + ": Quel aspect de " + courseTitle + " est le plus important?");
                q.setType(QuestionType.SINGLE_CHOICE);
                
                List<String> options = Arrays.asList(
                    "Aspect fondamental",
                    "Aspect secondaire",
                    "Aspect optionnel",
                    "Aspect non pertinent"
                );
                Collections.shuffle(options);
                
                q.setOptions(options);
                q.setCorrectAnswer("Aspect fondamental");
                q.setExplanation("L'aspect fondamental est essentiel dans ce domaine.");
            } else if (i == 19) {
                // Question MULTIPLE_CHOICE
                q.setText("Question " + i + ": Quels sont les éléments clés de " + courseTitle + "? (choix multiples)");
                q.setType(QuestionType.MULTIPLE_CHOICE);
                q.setOptions(Arrays.asList("Élément 1", "Élément 2", "Élément non pertinent", "Élément 3"));
                q.setCorrectAnswer("Élément 1, Élément 2, Élément 3");
                q.setExplanation("Ces éléments sont essentiels selon le contenu du cours.");
            } else {
                // Question TRUE_FALSE
                q.setText("Question " + i + ": Le cours " + courseTitle + " est-il essentiel pour comprendre ce domaine?");
                q.setType(QuestionType.TRUE_FALSE);
                q.setOptions(Arrays.asList("Vrai", "Faux"));
                q.setCorrectAnswer("Vrai");
                q.setExplanation("Ce cours couvre des concepts fondamentaux du domaine.");
            }
            
            quiz.getQuestions().add(q);
        }
        
        return quiz;
    }
    
    /**
     * Sauvegarde une recommandation
     */
    private void saveCourseRecommendation(User user, Long courseId, String courseTopic, 
                                         List<CourseFile> courseFiles) {
        try {
            QuizRecommendation recommendation = new QuizRecommendation();
            recommendation.setUser(user);
            recommendation.setRecommendedTopic(courseTopic);
            
            String reason = String.format(
                "Quiz généré pour le cours: %s (ID: %d). Basé sur %d fichiers: %s",
                courseTopic,
                courseId,
                courseFiles.size(),
                courseFiles.stream()
                    .map(CourseFile::getFileName)
                    .limit(3)
                    .collect(Collectors.joining(", "))
            );
            
            recommendation.setReason(reason);
            recommendation.setConfidenceScore(0.8);
            recommendation.setRecommendedAt(LocalDateTime.now());
            recommendation.setAccepted(false);
            
            quizRecommendationRepository.save(recommendation);
            log.debug("💾 Recommandation enregistrée: {}", courseTopic);
        } catch (Exception e) {
            log.warn("⚠️ Erreur enregistrement recommandation: {}", e.getMessage());
        }
    }
    
    /**
     * Crée un profil par défaut
     */
    public LearningProfile createDefaultProfile(User user) {
        LearningProfile profile = new LearningProfile();
        profile.setUser(user);
        profile.setProficiencyLevel("INTERMEDIATE");
        profile.setInterests(new ArrayList<>(Arrays.asList("Programmation", "Informatique", "Technologie")));
        profile.setWeaknesses(new ArrayList<>());
        profile.setLearningStyle("VISUAL");
        return learningProfileRepository.save(profile);
    }
    
    /**
     * MÉTHODE ORIGINALE - Génère un quiz personnalisé
     */
    @Transactional
    public QuizResponseDTO generatePersonalizedQuiz(Long userId, String topic) {
        log.info("🚀 Génération quiz personnalisé pour userId: {}, topic: {}", userId, topic);
        
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            LearningProfile profile = learningProfileRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultProfile(user));
            
            String prompt = ragQuizGenerationService.buildRAGPrompt(
                topic,
                Collections.emptyList(),
                profile.getProficiencyLevel(),
                profile.getInterests()
            );
            
            // CHANGEMENT: 20 questions au lieu de 5
            return ragQuizGenerationService.generateQuizFromRAGPrompt(
                prompt,
                "Quiz: " + topic,
                20
            );
            
        } catch (Exception e) {
            log.error("❌ Erreur génération quiz: {}", e.getMessage());
            throw new RuntimeException("Erreur: " + e.getMessage());
        }
    }
    
    /**
     * Mise à jour du profil
     */
    @Transactional
    public void updateLearningProfile(Long userId, Double score, String topic) {
        try {
            LearningProfile profile = learningProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
                    return createDefaultProfile(user);
                });
            
            if (score < 60.0) {
                if (profile.getWeaknesses() == null) {
                    profile.setWeaknesses(new ArrayList<>());
                }
                if (!profile.getWeaknesses().contains(topic)) {
                    profile.getWeaknesses().add(topic);
                }
            }
            
            learningProfileRepository.save(profile);
            log.debug("📊 Profil mis à jour - userId: {}, score: {}, topic: {}", userId, score, topic);
        } catch (Exception e) {
            log.warn("⚠️ Erreur mise à jour profil: {}", e.getMessage());
        }
    }
    
    /**
     * Diagnostic du système RAG
     */
    public Map<String, Object> getSystemDiagnostic() {
        Map<String, Object> diagnostic = new HashMap<>();
        
        try {
            diagnostic.put("ragQuizGenerationService", ragQuizGenerationService != null ? "✅ Disponible" : "❌ Absent");
            diagnostic.put("ollamaService", ollamaService != null ? "✅ Disponible" : "❌ Absent");
            
            // Tester la disponibilité du service AI (Gemini)
            boolean aiAvailable = false;
            try {
                String testResponse = ollamaService.generateText("test");
                aiAvailable = testResponse != null && !testResponse.toLowerCase().contains("erreur");
            } catch (Exception e) {
                aiAvailable = false;
            }
            diagnostic.put("aiServiceAvailable", aiAvailable);
            diagnostic.put("aiService", "Gemini");
            
            // Test PDFBox
            try {
                Class.forName("org.apache.pdfbox.pdmodel.PDDocument");
                diagnostic.put("pdfBox", "✅ Disponible (version 3.0.2)");
            } catch (ClassNotFoundException e) {
                diagnostic.put("pdfBox", "❌ Absent - Ajouter dépendance PDFBox");
            }
            
            diagnostic.put("success", true);
            diagnostic.put("timestamp", LocalDateTime.now().toString());
            
        } catch (Exception e) {
            diagnostic.put("success", false);
            diagnostic.put("error", e.getMessage());
        }
        
        return diagnostic;
    }
    
    /**
     * Recommande le prochain quiz
     */
    public QuizRecommendation recommendNextQuiz(Long userId) {
        log.info("🎯 Recommandation prochain quiz pour userId: {}", userId);
        
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            LearningProfile profile = learningProfileRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultProfile(user));
            
            List<QuizRecommendation> pendingRecs = quizRecommendationRepository
                .findPendingRecommendationsByUserId(userId);
            
            if (!pendingRecs.isEmpty()) {
                QuizRecommendation bestPending = pendingRecs.stream()
                    .max((r1, r2) -> Double.compare(r1.getConfidenceScore(), r2.getConfidenceScore()))
                    .orElse(pendingRecs.get(0));
                
                log.info("✅ Recommandation en attente trouvée: {} (confiance: {})", 
                        bestPending.getRecommendedTopic(), bestPending.getConfidenceScore());
                return bestPending;
            }
            
            String recommendedTopic;
            double confidence;
            String reason;
            
            if (profile.getWeaknesses() != null && !profile.getWeaknesses().isEmpty()) {
                recommendedTopic = profile.getWeaknesses().get(0);
                confidence = 0.8;
                reason = "Renforcement nécessaire - sujet identifié comme faible";
            } 
            else if (profile.getInterests() != null && !profile.getInterests().isEmpty()) {
                recommendedTopic = profile.getInterests().get(0);
                confidence = 0.6;
                reason = "Basé sur vos centres d'intérêt";
            }
            else {
                recommendedTopic = "Révision générale";
                confidence = 0.5;
                reason = "Révision recommandée pour maintenir les compétences";
            }
            
            QuizRecommendation recommendation = new QuizRecommendation();
            recommendation.setUser(user);
            recommendation.setRecommendedTopic(recommendedTopic);
            recommendation.setReason(reason);
            recommendation.setConfidenceScore(confidence);
            recommendation.setRecommendedAt(LocalDateTime.now());
            recommendation.setAccepted(false);
            
            QuizRecommendation savedRec = quizRecommendationRepository.save(recommendation);
            
            log.info("✅ Nouvelle recommandation créée: {} (confiance: {})", 
                    recommendedTopic, confidence);
            
            return savedRec;
            
        } catch (Exception e) {
            log.error("❌ Erreur recommandation quiz: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de la recommandation: " + e.getMessage());
        }
    }
    
    /**
     * Récupère toutes les recommandations
     */
    public List<QuizRecommendation> getRecommendations(Long userId) {
        log.info("📋 Récupération recommandations pour userId: {}", userId);
        
        try {
            List<QuizRecommendation> pendingRecs = quizRecommendationRepository
                .findPendingRecommendationsByUserId(userId);
            
            List<QuizRecommendation> acceptedRecs = quizRecommendationRepository
                .findAcceptedRecommendationsByUserId(userId);
            
            List<QuizRecommendation> allRecommendations = new ArrayList<>();
            
            pendingRecs.sort((r1, r2) -> Double.compare(r2.getConfidenceScore(), r1.getConfidenceScore()));
            allRecommendations.addAll(pendingRecs);
            
            acceptedRecs.sort((r1, r2) -> {
                if (r1.getAcceptedAt() == null && r2.getAcceptedAt() == null) return 0;
                if (r1.getAcceptedAt() == null) return 1;
                if (r2.getAcceptedAt() == null) return -1;
                return r2.getAcceptedAt().compareTo(r1.getAcceptedAt());
            });
            allRecommendations.addAll(acceptedRecs);
            
            if (allRecommendations.size() < 2) {
                QuizRecommendation newRec = recommendNextQuiz(userId);
                allRecommendations.add(0, newRec);
            }
            
            List<QuizRecommendation> finalList = allRecommendations.stream()
                .limit(8)
                .collect(Collectors.toList());
            
            log.info("✅ {} recommandations récupérées ({} en attente, {} acceptées)", 
                    finalList.size(), pendingRecs.size(), acceptedRecs.size());
            
            return finalList;
            
        } catch (Exception e) {
            log.error("❌ Erreur récupération recommandations: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
    
    /**
     * Vérifie les fichiers d'un cours (debug)
     */
    public Map<String, Object> checkCourseFiles(Long courseId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            List<CourseFile> files = courseFileRepository.findByCourseId(courseId);
            
            List<Map<String, Object>> fileDetails = new ArrayList<>();
            for (CourseFile file : files) {
                Map<String, Object> detail = new HashMap<>();
                detail.put("id", file.getId());
                detail.put("name", file.getFileName());
                detail.put("type", file.getFileType());
                detail.put("size", file.getFileSize());
                detail.put("path", file.getFilePath());
                detail.put("exists", checkFileExists(file.getFilePath()));
                
                // Extraire un peu de contenu pour vérification
                if (checkFileExists(file.getFilePath())) {
                    String content = extractFileContent(file);
                    detail.put("contentLength", content != null ? content.length() : 0);
                    if (content != null && content.length() > 0) {
                        detail.put("contentPreview", content.substring(0, Math.min(100, content.length())));
                    }
                }
                
                fileDetails.add(detail);
            }
            
            result.put("courseId", courseId);
            result.put("fileCount", files.size());
            result.put("files", fileDetails);
            result.put("success", true);
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Vérifie si un fichier existe
     */
    private boolean checkFileExists(String filePath) {
        if (filePath == null || filePath.isEmpty()) return false;
        try {
            return Files.exists(Paths.get(filePath));
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * MÉTHODE DE DEBUG - Teste l'accès aux fichiers d'un cours
     */
    public Map<String, Object> testFileAccess(Long courseId) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> fileTests = new ArrayList<>();
        
        log.info("🔍🔍🔍 TEST ACCÈS FICHIERS - courseId: {}", courseId);
        
        try {
            // 1. Récupérer les fichiers du cours
            List<CourseFile> files = courseFileRepository.findByCourseId(courseId);
            log.info("📁 {} fichier(s) trouvé(s) en base", files.size());
            
            for (CourseFile file : files) {
                Map<String, Object> testResult = new HashMap<>();
                testResult.put("fileName", file.getFileName());
                testResult.put("fileType", file.getFileType());
                testResult.put("fileSize", file.getFileSize());
                testResult.put("dbFilePath", file.getFilePath());
                
                // 2. Vérifier si le chemin existe
                if (file.getFilePath() == null || file.getFilePath().isEmpty()) {
                    testResult.put("status", "❌ ERREUR: Chemin vide en base");
                    testResult.put("exists", false);
                } else {
                    Path filePath = Paths.get(file.getFilePath());
                    
                    // Vérifier existence
                    boolean exists = Files.exists(filePath);
                    testResult.put("exists", exists);
                    testResult.put("absolutePath", filePath.toAbsolutePath().toString());
                    
                    if (exists) {
                        testResult.put("status", "✅ FICHIER TROUVÉ");
                        
                        // Tenter de lire le fichier
                        try {
                            if (file.getFileType() != null && file.getFileType().toLowerCase().contains("pdf")) {
                                // Test PDFBox
                                String pdfTest = testPDFExtraction(filePath);
                                testResult.put("pdfTest", pdfTest);
                            } else {
                                // Test lecture texte
                                String content = Files.readString(filePath);
                                testResult.put("contentLength", content.length());
                                testResult.put("contentPreview", 
                                    content.substring(0, Math.min(200, content.length())) + "...");
                            }
                        } catch (Exception e) {
                            testResult.put("readError", e.getMessage());
                            testResult.put("status", "⚠️ Fichier trouvé mais erreur lecture");
                        }
                    } else {
                        testResult.put("status", "❌ FICHIER NON TROUVÉ SUR DISQUE");
                        
                        // Chercher dans d'autres emplacements
                        List<String> foundPaths = searchFileInCommonLocations(file.getFileName());
                        testResult.put("alternativeSearches", foundPaths);
                    }
                }
                
                fileTests.add(testResult);
                log.info("📊 Test {}: {} - {}", 
                    file.getFileName(), 
                    testResult.get("status"),
                    testResult.get("absolutePath"));
            }
            
            result.put("courseId", courseId);
            result.put("totalFiles", files.size());
            result.put("fileTests", fileTests);
            result.put("timestamp", LocalDateTime.now().toString());
            result.put("success", true);
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
            log.error("❌ Erreur test fichiers: {}", e.getMessage(), e);
        }
        
        return result;
    }

    /**
     * Teste l'extraction PDFBox
     */
    private String testPDFExtraction(Path filePath) {
        try (PDDocument document = Loader.loadPDF(filePath.toFile())) {
            int pageCount = document.getNumberOfPages();
            boolean encrypted = document.isEncrypted();
            
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setStartPage(1);
            stripper.setEndPage(Math.min(pageCount, 1)); // Juste la première page
            
            String text = stripper.getText(document);
            text = cleanExtractedText(text);
            
            return String.format(
                "PDF OK - Pages: %d, Chiffré: %s, Caractères page 1: %d, Extrait: %s...",
                pageCount, encrypted, text.length(),
                text.substring(0, Math.min(100, text.length()))
            );
            
        } catch (IOException e) {
            return "❌ Erreur PDFBox: " + e.getMessage();
        } catch (Exception e) {
            return "❌ Erreur inattendue: " + e.getMessage();
        }
    }

    /**
     * Cherche le fichier dans des emplacements communs
     */
    private List<String> searchFileInCommonLocations(String fileName) {
        List<String> foundPaths = new ArrayList<>();
        
        try {
            log.info("🔍 Recherche fichier '{}' dans emplacements communs...", fileName);
            
            // 1. Répertoire uploads standard
            String[] commonDirs = {
                "uploads",
                "uploads/courses",
                "uploads/files",
                "upload",
                "files",
                "documents",
                "data",
                "src/main/resources/static",
                "src/main/resources/uploads",
                System.getProperty("user.dir") + "/uploads"
            };
            
            for (String dir : commonDirs) {
                Path dirPath = Paths.get(dir);
                if (Files.exists(dirPath) && Files.isDirectory(dirPath)) {
                    Path filePath = dirPath.resolve(fileName);
                    if (Files.exists(filePath)) {
                        foundPaths.add("✅ TROUVÉ dans: " + filePath.toAbsolutePath());
                        log.info("   ✅ Trouvé dans: {}", dir);
                    }
                }
            }
            
            // 2. Chercher avec UUID (comme e0ac59a2-2063-4d2d-9cb3-9856b9461573.pdf)
            // Chercher tous les PDF dans uploads
            Path uploadsDir = Paths.get("uploads");
            if (Files.exists(uploadsDir) && Files.isDirectory(uploadsDir)) {
                try (var stream = Files.list(uploadsDir)) {
                    List<Path> pdfFiles = stream
                        .filter(path -> path.toString().toLowerCase().endsWith(".pdf"))
                        .collect(Collectors.toList());
                    
                    for (Path pdf : pdfFiles) {
                        if (pdf.getFileName().toString().toLowerCase().contains(fileName.toLowerCase().replace(".pdf", ""))) {
                            foundPaths.add("📄 PDF similaire: " + pdf.toAbsolutePath());
                        }
                    }
                }
            }
            
            // 3. Chercher dans tout le répertoire du projet (attention: lent)
            if (foundPaths.isEmpty()) {
                log.info("🔍 Recherche approfondie dans le projet...");
                foundPaths.addAll(searchFileRecursively(new File("."), fileName));
            }
            
        } catch (Exception e) {
            log.warn("⚠️ Erreur recherche fichiers: {}", e.getMessage());
        }
        
        if (foundPaths.isEmpty()) {
            foundPaths.add("❌ AUCUNE occurrence trouvée nulle part");
        }
        
        return foundPaths;
    }

    /**
     * Recherche récursive
     */
    private List<String> searchFileRecursively(File directory, String fileName) {
        List<String> found = new ArrayList<>();
        
        try {
            File[] files = directory.listFiles();
            if (files != null) {
                for (File file : files) {
                    if (file.isDirectory()) {
                        // Éviter node_modules et autres gros répertoires
                        if (!file.getName().equals("node_modules") && 
                            !file.getName().equals("target") &&
                            !file.getName().equals(".git")) {
                            found.addAll(searchFileRecursively(file, fileName));
                        }
                    } else if (file.getName().equalsIgnoreCase(fileName)) {
                        found.add("🔍 TROUVÉ récursif: " + file.getAbsolutePath());
                    }
                }
            }
        } catch (Exception e) {
            // Ignorer
        }
        
        return found;
    }
    
    /**
     * NOUVELLE MÉTHODE: Test simple pour vérifier la génération de questions
     */
    public String testQuestionGeneration(String content) {
        log.info("🧪 Test génération de questions");
        
        String testPrompt = """
            CONTENU: %s
            
            Génère 20 questions QCM basées sur ce contenu.
            
            Format JSON:
            {
              "questions": [
                {
                  "text": "QUESTION_TEXT",
                  "type": "SINGLE_CHOICE",
                  "options": ["OPTION_1", "OPTION_2", "OPTION_3", "OPTION_4"],
                  "correctAnswer": "CORRECT_OPTION",
                  "explanation": "EXPLANATION"
                }
              ]
            }
            
            Remplacer les placeholders par du vrai contenu basé sur le texte fourni.
            """.formatted(content.substring(0, Math.min(500, content.length())));
        
        return ollamaService.generateRawResponse(testPrompt);
    }
    
    /**
     * Vérifie la disponibilité du service AI (Gemini)
     */
    public boolean isAIServiceAvailable() {
        try {
            String testResponse = ollamaService.generateText("test");
            return testResponse != null && !testResponse.toLowerCase().contains("erreur");
        } catch (Exception e) {
            log.warn("Service AI non disponible: {}", e.getMessage());
            return false;
        }
    }
}