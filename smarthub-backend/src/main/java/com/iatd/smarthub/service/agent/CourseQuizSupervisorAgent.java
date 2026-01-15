package com.iatd.smarthub.service.agent;

import com.iatd.smarthub.dto.agent.QuizEligibilityResponse;
import com.iatd.smarthub.dto.agent.QuizInitiationResponse;
import com.iatd.smarthub.dto.agent.QuizSubmissionResponse;
import com.iatd.smarthub.dto.agent.QuizFeedback;
import com.iatd.smarthub.dto.agent.CourseQuizStats;
import com.iatd.smarthub.dto.QuestionResponseDTO;
import com.iatd.smarthub.dto.QuizResponseDTO;
import com.iatd.smarthub.model.course.Course;
import com.iatd.smarthub.model.course.CourseFile;
import com.iatd.smarthub.model.quiz.Quiz;
import com.iatd.smarthub.model.quiz.QuizAttempt;
import com.iatd.smarthub.model.quiz.QuestionType;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.CourseFileRepository;
import com.iatd.smarthub.repository.CourseRepository;
import com.iatd.smarthub.repository.QuizAttemptRepository;
import com.iatd.smarthub.repository.QuizRepository;
import com.iatd.smarthub.repository.UserRepository;
import com.iatd.smarthub.service.rag.RAGQuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseQuizSupervisorAgent {
    
    // Services RAG et repositories
    private final RAGQuizService ragQuizService;
    private final QuizAttemptRepository quizAttemptRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final QuizRepository quizRepository;
    private final CourseFileRepository courseFileRepository;
    private final ProgressTrackerAgent progressTrackerAgent;
    
    // Configuration
    private static final int MAX_ATTEMPTS_PER_DAY = 3;
    private static final int MIN_TIME_BETWEEN_ATTEMPTS_MINUTES = 30;
    private static final int QUIZ_TIMEOUT_MINUTES = 60;
    
    /**
     * Vérifie si l'étudiant peut passer un quiz
     */
    public QuizEligibilityResponse checkQuizEligibility(Long userId, Long courseId) {
        log.info("🤖 Vérification éligibilité quiz - userId: {}, courseId: {}", userId, courseId);
        
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Cours non trouvé"));
            
            // 1. Vérifier les tentatives du jour
            LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
            
            int todayAttempts = 0;
            try {
                todayAttempts = quizAttemptRepository.countByStudentAndCourseAndDateRange(
                    user, course, startOfDay, LocalDateTime.now()
                );
                log.info("📊 Tentatives aujourd'hui (via repository): {}", todayAttempts);
            } catch (Exception e) {
                log.warn("⚠️ Méthode non disponible, fallback");
                List<QuizAttempt> allAttempts = quizAttemptRepository.findByStudentAndCourse(user, course);
                todayAttempts = (int) allAttempts.stream()
                    .filter(attempt -> attempt.getAttemptedAt() != null 
                        && !attempt.getAttemptedAt().isBefore(startOfDay))
                    .count();
                log.info("📊 Tentatives aujourd'hui (fallback): {}", todayAttempts);
            }
            
            // 2. Vérifier la dernière tentative
            Optional<QuizAttempt> lastAttempt = Optional.empty();
            try {
                lastAttempt = quizAttemptRepository
                    .findLastAttemptByStudentAndCourse(user, course);
            } catch (Exception e) {
                log.warn("⚠️ Méthode findLastAttemptByStudentAndCourse non disponible");
            }
            
            // 3. Analyser la progression
            ProgressTrackerAgent.ProgressAnalysis progress = null;
            try {
                progress = progressTrackerAgent.analyzeProgress(userId);
                log.info("📈 Analyse progression réussie - score moyen: {}", progress.getAverageScore());
            } catch (Exception e) {
                log.warn("⚠️ Impossible d'analyser la progression");
                progress = ProgressTrackerAgent.ProgressAnalysis.empty(userId);
            }
            
            // 4. Construire la réponse
            QuizEligibilityResponse response = QuizEligibilityResponse.builder()
                .userId(userId)
                .courseId(courseId)
                .courseTitle(course.getTitle())
                .isEligible(true)
                .reason("Éligible pour passer le quiz")
                .maxAttemptsPerDay(MAX_ATTEMPTS_PER_DAY)
                .attemptsToday(todayAttempts)
                .remainingAttemptsToday(Math.max(0, MAX_ATTEMPTS_PER_DAY - todayAttempts))
                .lastAttemptDate(lastAttempt.map(QuizAttempt::getCompletedAt).orElse(null))
                .progressAnalysis(progress)
                .recommendations(new HashMap<>())
                .build();
            
            // 5. Appliquer les restrictions
            log.info("🔍 Vérification restrictions: {}/{} tentatives aujourd'hui", 
                todayAttempts, MAX_ATTEMPTS_PER_DAY);
            
            if (todayAttempts >= MAX_ATTEMPTS_PER_DAY) {
                response.setEligible(false);
                response.setReason("Limite quotidienne atteinte (" + MAX_ATTEMPTS_PER_DAY + " tentatives/jour)");
                response.setNextAvailableTime(startOfDay.plusDays(1));
                log.info("🚫 Limite atteinte - userId: {}", userId);
            } else if (lastAttempt.isPresent() && lastAttempt.get().getCompletedAt() != null) {
                LocalDateTime lastTime = lastAttempt.get().getCompletedAt();
                long minutesSinceLast = ChronoUnit.MINUTES.between(lastTime, LocalDateTime.now());
                
                log.info("⏱️ Dernière tentative il y a {} minutes", minutesSinceLast);
                
                if (minutesSinceLast < MIN_TIME_BETWEEN_ATTEMPTS_MINUTES) {
                    response.setEligible(false);
                    long minutesToWait = MIN_TIME_BETWEEN_ATTEMPTS_MINUTES - minutesSinceLast;
                    response.setReason("Attente requise entre les tentatives (" + 
                        minutesToWait + " minutes restantes)");
                    response.setNextAvailableTime(lastTime.plusMinutes(MIN_TIME_BETWEEN_ATTEMPTS_MINUTES));
                    log.info("⏳ Attente requise - userId: {}", userId);
                }
            }
            
            // 6. Si toujours éligible
            if (response.isEligible()) {
                if (response.getRemainingAttemptsToday() == 1) {
                    response.setRecommendation("Dernière tentative disponible aujourd'hui");
                }
            }
            
            log.info("✅ Éligibilité finale: {} - Raison: {} - Tentatives restantes: {}", 
                response.isEligible(), response.getReason(), response.getRemainingAttemptsToday());
            
            return response;
            
        } catch (Exception e) {
            log.error("❌ Erreur vérification éligibilité", e);
            return QuizEligibilityResponse.builder()
                .userId(userId)
                .courseId(courseId)
                .isEligible(false)
                .reason("Erreur technique: " + e.getMessage())
                .maxAttemptsPerDay(MAX_ATTEMPTS_PER_DAY)
                .attemptsToday(0)
                .remainingAttemptsToday(MAX_ATTEMPTS_PER_DAY)
                .build();
        }
    }
    
    /**
     * Debug de l'éligibilité
     */
    public Map<String, Object> debugQuizEligibility(Long userId, Long courseId) {
        Map<String, Object> debugInfo = new HashMap<>();
        
        try {
            debugInfo.put("userId", userId);
            debugInfo.put("courseId", courseId);
            debugInfo.put("timestamp", LocalDateTime.now().toString());
            
            boolean userExists = userRepository.existsById(userId);
            debugInfo.put("userExists", userExists);
            
            if (userExists) {
                User user = userRepository.findById(userId).orElseThrow();
                debugInfo.put("userName", user.getUsername());
            }
            
            boolean courseExists = courseRepository.existsById(courseId);
            debugInfo.put("courseExists", courseExists);
            
            if (courseExists) {
                Course course = courseRepository.findById(courseId).orElseThrow();
                debugInfo.put("courseTitle", course.getTitle());
                
                // Vérifier les fichiers
                List<CourseFile> courseFiles = courseFileRepository.findByCourseId(courseId);
                debugInfo.put("courseFiles", courseFiles.size());
                debugInfo.put("fileNames", courseFiles.stream()
                    .map(CourseFile::getFileName)
                    .collect(Collectors.toList()));
            }
            
            if (userExists && courseExists) {
                User user = userRepository.findById(userId).orElseThrow();
                Course course = courseRepository.findById(courseId).orElseThrow();
                
                List<QuizAttempt> allAttempts = quizAttemptRepository.findByStudentAndCourse(user, course);
                debugInfo.put("totalAttempts", allAttempts.size());
                
                LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
                long todayAttempts = allAttempts.stream()
                    .filter(attempt -> attempt.getAttemptedAt() != null 
                        && !attempt.getAttemptedAt().isBefore(startOfDay))
                    .count();
                debugInfo.put("todayAttempts", todayAttempts);
            }
            
            // Tester la méthode principale
            QuizEligibilityResponse response = checkQuizEligibility(userId, courseId);
            debugInfo.put("eligibilityResponse", Map.of(
                "isEligible", response.isEligible(),
                "reason", response.getReason(),
                "attemptsToday", response.getAttemptsToday(),
                "remainingAttemptsToday", response.getRemainingAttemptsToday()
            ));
            
            debugInfo.put("success", true);
            
        } catch (Exception e) {
            debugInfo.put("success", false);
            debugInfo.put("error", e.getMessage());
        }
        
        return debugInfo;
    }
    
    /**
     * Initie un quiz pour un cours avec RAG
     */
    @Transactional
    public QuizInitiationResponse initiateCourseQuiz(Long userId, Long courseId) {
        log.info("🚀 Initiation quiz de cours - userId: {}, courseId: {}", userId, courseId);
        
        try {
            // 1. Vérifier l'éligibilité
            QuizEligibilityResponse eligibility = checkQuizEligibility(userId, courseId);
            log.info("📋 Résultat éligibilité: {} - Raison: {}", 
                eligibility.isEligible(), eligibility.getReason());
            
            if (!eligibility.isEligible()) {
                log.warn("🚫 Utilisateur non éligible: {}", eligibility.getReason());
                return QuizInitiationResponse.notEligible(eligibility);
            }
            
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Cours non trouvé"));
            
            // 2. RÉCUPÉRER LES FICHIERS POUR VÉRIFIER QU'IL Y A DU CONTENU
            List<CourseFile> courseFiles = courseFileRepository.findByCourseId(courseId);
            log.info("📁 {} fichier(s) trouvé(s) pour le cours: {}", 
                courseFiles.size(), course.getTitle());
            
            if (courseFiles.isEmpty()) {
                log.error("❌ ERREUR: Le cours '{}' n'a AUCUN fichier !", course.getTitle());
                return QuizInitiationResponse.error("Le cours n'a pas de fichiers pour générer un quiz");
            }
            
            // 3. S'assurer qu'un quiz existe
            Quiz courseQuiz = ensureCourseQuizExists(course);
            log.info("✅ Quiz prêt - ID: {}, Titre: {}", courseQuiz.getId(), courseQuiz.getTitle());
            
            // 4. Compter les tentatives
            List<QuizAttempt> existingAttempts = quizAttemptRepository.findByStudentAndCourse(user, course);
            int nextAttemptNumber = existingAttempts.size() + 1;
            
            // 5. Créer la tentative
            QuizAttempt attempt = new QuizAttempt();
            attempt.setStudent(user);
            attempt.setCourse(course);
            attempt.setQuiz(courseQuiz);
            attempt.setCurrentAttemptNumber(nextAttemptNumber);
            attempt.setMaxAttempts(MAX_ATTEMPTS_PER_DAY);
            attempt.setStatus(QuizAttempt.AttemptStatus.IN_PROGRESS);
            attempt.setAttemptedAt(LocalDateTime.now());
            attempt.setTimeLimitMinutes(QUIZ_TIMEOUT_MINUTES);
            attempt.setTimeSpentSeconds(0);
            attempt.setScore(null);
            
            QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);
            log.info("📝 Tentative créée - ID: {}, Numéro: {}, Quiz: {}", 
                savedAttempt.getId(), savedAttempt.getCurrentAttemptNumber(), courseQuiz.getId());
            
            // 6. GÉNÉRER LE QUIZ AVEC RAG - CORRIGÉ : passer userId
            QuizResponseDTO quiz = generateQuizWithRAG(course, courseFiles, userId);
            
            // 7. Construire la réponse
            QuizInitiationResponse response = QuizInitiationResponse.builder()
                .attemptId(savedAttempt.getId())
                .quizId(courseQuiz.getId())
                .quizResponse(quiz)
                .timeLimitMinutes(QUIZ_TIMEOUT_MINUTES)
                .startTime(LocalDateTime.now())
                .endTime(LocalDateTime.now().plusMinutes(QUIZ_TIMEOUT_MINUTES))
                .remainingTimeMinutes(QUIZ_TIMEOUT_MINUTES)
                .instructions(generateQuizInstructions())
                .warnings(generateWarnings(eligibility, courseFiles))
                .supervisorEnabled(true)
                .build();
            
            log.info("✅ Quiz RAG initié avec succès - {} questions générées", 
                quiz.getQuestions().size());
            return response;
            
        } catch (Exception e) {
            log.error("❌ Erreur initiation quiz", e);
            return QuizInitiationResponse.error(e.getMessage());
        }
    }
    
    /**
     * GÉNÉRER LE QUIZ AVEC RAG - CORRECTION COMPLÈTE
     */
    private QuizResponseDTO generateQuizWithRAG(Course course, List<CourseFile> courseFiles, Long userId) {
        try {
            log.info("🤖 Début génération quiz RAG pour: {}", course.getTitle());
            log.info("📚 Fichiers disponibles: {}", 
                courseFiles.stream().map(CourseFile::getFileName).collect(Collectors.toList()));
            
            // 1. Vérifier que le service RAG est disponible
            if (ragQuizService == null) {
                log.error("❌ Service RAG non disponible !");
                return generateFallbackQuiz(course, "Service RAG non disponible");
            }
            
            // 2. Essayer d'abord la méthode spécifique pour les cours
            String courseTopic = course.getTitle();
            log.info("🎯 Appel RAG avec userId: {}, courseId: {}, topic: {}", 
                userId, course.getId(), courseTopic);
            
            QuizResponseDTO quiz = null;
            
            try {
                // Essayer la méthode de cours si disponible
                quiz = ragQuizService.generatePersonalizedQuizForCourse(userId, course.getId(), courseTopic);
                log.info("✅ Méthode generatePersonalizedQuizForCourse utilisée");
            } catch (Exception e1) {
                log.warn("⚠️ generatePersonalizedQuizForCourse échoué: {}, fallback...", e1.getMessage());
                try {
                    // Fallback: méthode générale
                    quiz = ragQuizService.generatePersonalizedQuiz(userId, courseTopic);
                    log.info("✅ Méthode generatePersonalizedQuiz utilisée (fallback)");
                } catch (Exception e2) {
                    log.error("❌ Les deux méthodes RAG ont échoué: {}", e2.getMessage());
                    throw new RuntimeException("Impossible de générer le quiz RAG: " + e2.getMessage());
                }
            }
            
            // 3. Vérifier la qualité du quiz généré
            if (quiz == null || quiz.getQuestions() == null || quiz.getQuestions().isEmpty()) {
                log.warn("⚠️ RAG n'a généré aucune question valide");
                return generateFallbackQuiz(course, "RAG n'a pas généré de questions valides");
            }
            
            // 4. Améliorer les questions si nécessaire
            List<QuestionResponseDTO> validQuestions = quiz.getQuestions().stream()
                .filter(q -> q != null && q.getText() != null && !q.getText().trim().isEmpty())
                .collect(Collectors.toList());
            
            if (validQuestions.isEmpty()) {
                log.warn("⚠️ Toutes les questions RAG sont invalides");
                return generateFallbackQuiz(course, "Toutes les questions RAG sont invalides");
            }
            
            // 5. S'assurer d'avoir au moins 5 questions
            if (validQuestions.size() < 5) {
                log.warn("⚠️ Seulement {} questions valides, complétion avec fallback", validQuestions.size());
                int needed = 5 - validQuestions.size();
                validQuestions.addAll(generateFallbackQuestions(needed));
            }
            
            // 6. Mettre à jour le quiz
            quiz.setQuestions(validQuestions);
            quiz.setTitle("Quiz RAG - " + course.getTitle());
            quiz.setDescription("Quiz généré à partir des fichiers du cours via RAG");
            
            log.info("✅ Quiz RAG généré avec succès: {} questions valides", validQuestions.size());
            return quiz;
            
        } catch (Exception e) {
            log.error("❌ Erreur génération RAG: {}", e.getMessage());
            
            // Fallback: Générer un quiz basé sur les noms des fichiers
            return generateQuizFromFiles(course, courseFiles);
        }
    }
    
    /**
     * Fallback: Générer un quiz basé sur les fichiers
     */
    private QuizResponseDTO generateQuizFromFiles(Course course, List<CourseFile> files) {
        log.info("🔄 Génération quiz basé sur les fichiers (fallback)");
        
        QuizResponseDTO quiz = new QuizResponseDTO();
        quiz.setTitle("Quiz - " + course.getTitle());
        quiz.setDescription("Quiz basé sur les fichiers du cours");
        quiz.setQuestions(new ArrayList<>());
        
        // Utiliser les noms de fichiers pour créer des questions
        int questionCount = Math.min(10, files.size());
        
        for (int i = 0; i < questionCount; i++) {
            CourseFile file = files.get(i);
            QuestionResponseDTO question = new QuestionResponseDTO();
            
            question.setText("Question sur le fichier: " + file.getFileName() + 
                           " - Expliquez le contenu principal");
            question.setType(QuestionType.OPEN_ENDED);
            question.setCorrectAnswer("Réponse basée sur le contenu du fichier: " + file.getFileName());
            question.setExplanation("Vérifiez le fichier '" + file.getFileName() + 
                                  "' pour la réponse complète");
            
            quiz.getQuestions().add(question);
        }
        
        // Si pas assez de fichiers, ajouter des questions génériques
        if (quiz.getQuestions().size() < 5) {
            int needed = 5 - quiz.getQuestions().size();
            quiz.getQuestions().addAll(generateFallbackQuestions(needed));
        }
        
        log.info("📝 Quiz fallback généré: {} questions", quiz.getQuestions().size());
        return quiz;
    }
    
    /**
     * Générer des questions de secours
     */
    private List<QuestionResponseDTO> generateFallbackQuestions(int count) {
        List<QuestionResponseDTO> questions = new ArrayList<>();
        
        for (int i = 1; i <= count; i++) {
            QuestionResponseDTO question = new QuestionResponseDTO();
            question.setText("Question " + i + " - Veuillez répondre en vous basant sur vos connaissances du cours");
            question.setType(QuestionType.OPEN_ENDED);
            question.setCorrectAnswer("Réponse attendue basée sur l'apprentissage du cours");
            question.setExplanation("Cette question a été générée automatiquement");
            questions.add(question);
        }
        
        return questions;
    }
    
    /**
     * Générer un quiz de secours
     */
    private QuizResponseDTO generateFallbackQuiz(Course course, String reason) {
        QuizResponseDTO quiz = new QuizResponseDTO();
        quiz.setTitle("Quiz - " + course.getTitle() + " (Fallback)");
        quiz.setDescription("Quiz de secours: " + reason);
        quiz.setQuestions(generateFallbackQuestions(5));
        return quiz;
    }
    
    /**
     * S'assurer qu'un quiz existe pour le cours
     */
    private Quiz ensureCourseQuizExists(Course course) {
        log.info("🔍 Recherche d'un quiz pour le cours: {}", course.getTitle());
        
        List<Quiz> existingQuizzes = quizRepository.findByCourseId(course.getId());
        log.info("📊 {} quiz(s) trouvé(s) pour le cours {}", existingQuizzes.size(), course.getTitle());
        
        // Chercher un quiz actif
        Optional<Quiz> activeQuiz = existingQuizzes.stream()
            .filter(quiz -> Boolean.TRUE.equals(quiz.getActive()))
            .findFirst();
        
        if (activeQuiz.isPresent()) {
            log.info("✅ Quiz actif trouvé: {} (ID: {})", 
                activeQuiz.get().getTitle(), activeQuiz.get().getId());
            return activeQuiz.get();
        }
        
        // Si aucun quiz actif mais il y a des quizzes, prendre le premier
        if (!existingQuizzes.isEmpty()) {
            log.warn("⚠️ Aucun quiz actif, utilisation du quiz existant: {} (ID: {})", 
                existingQuizzes.get(0).getTitle(), existingQuizzes.get(0).getId());
            return existingQuizzes.get(0);
        }
        
        // Créer un nouveau quiz
        log.info("📝 Création d'un nouveau quiz pour le cours: {}", course.getTitle());
        
        Quiz quiz = new Quiz();
        quiz.setTitle("Quiz RAG - " + course.getTitle());
        quiz.setDescription("Quiz généré automatiquement à partir des fichiers du cours");
        quiz.setCourse(course);
        quiz.setActive(true);
        
        Quiz savedQuiz = quizRepository.save(quiz);
        log.info("✅ Nouveau quiz créé: {} (ID: {})", savedQuiz.getTitle(), savedQuiz.getId());
        
        return savedQuiz;
    }
    
    /**
     * Soumet et évalue un quiz
     */
    @Transactional
    public QuizSubmissionResponse submitCourseQuiz(Long attemptId, Map<String, Object> submission) {
        log.info("📤 Soumission quiz - attemptId: {}", attemptId);
        
        try {
            QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Tentative non trouvée"));
            
            // 1. Vérifier le temps
            long timeElapsed = ChronoUnit.MINUTES.between(
                attempt.getAttemptedAt(), LocalDateTime.now()
            );
            
            boolean timedOut = timeElapsed > QUIZ_TIMEOUT_MINUTES;
            
            // 2. Calculer le score
            double score = calculateScore(submission);
            
            // 3. Mettre à jour la tentative
            attempt.setCompletedAt(LocalDateTime.now());
            attempt.setStatus(timedOut ? QuizAttempt.AttemptStatus.TIMEOUT : QuizAttempt.AttemptStatus.COMPLETED);
            attempt.setScore(score);
            attempt.setTimeSpentSeconds((int) ChronoUnit.SECONDS.between(
                attempt.getAttemptedAt(), attempt.getCompletedAt()
            ));
            attempt.setAnswersJson(submission.toString());
            
            quizAttemptRepository.save(attempt);
            
            // 4. Mettre à jour le profil RAG
            if (ragQuizService != null && attempt.getCourse() != null) {
                try {
                    String topic = attempt.getCourse().getTitle();
                    ragQuizService.updateLearningProfile(attempt.getStudent().getId(), score, topic);
                } catch (Exception e) {
                    log.warn("⚠️ Impossible de mettre à jour le profil RAG: {}", e.getMessage());
                }
            }
            
            // 5. Générer le feedback
            QuizFeedback feedback = generateDetailedFeedback(score);
            
            // 6. Recommandations
            Map<String, Object> recommendations = generateStudyRecommendations(
                attempt.getStudent().getId(), 
                attempt.getCourse().getId(), 
                score
            );
            
            // 7. Construire la réponse
            QuizSubmissionResponse response = QuizSubmissionResponse.builder()
                .attemptId(attemptId)
                .score(score)
                .timeSpentMinutes(timeElapsed)
                .timedOut(timedOut)
                .passed(score >= 60.0)
                .feedback(feedback)
                .recommendations(recommendations)
                .nextQuizEligibility(checkQuizEligibility(
                    attempt.getStudent().getId(), 
                    attempt.getCourse().getId()
                ))
                .certificateEligible(score >= 80.0 && attempt.getCurrentAttemptNumber() == 1)
                .build();
            
            log.info("✅ Quiz soumis - Score: {}% - Passé: {}", score, score >= 60.0);
            return response;
            
        } catch (Exception e) {
            log.error("❌ Erreur soumission quiz", e);
            return QuizSubmissionResponse.error(e.getMessage());
        }
    }
    
    /**
     * Récupère les statistiques
     */
    public CourseQuizStats getCourseQuizStats(Long userId, Long courseId) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Cours non trouvé"));
            
            List<QuizAttempt> attempts = quizAttemptRepository.findByStudentAndCourse(user, course);
            
            double bestScore = attempts.stream()
                .filter(a -> a.getScore() != null)
                .mapToDouble(QuizAttempt::getScore)
                .max()
                .orElse(0.0);
            
            double averageScore = attempts.stream()
                .filter(a -> a.getScore() != null)
                .mapToDouble(QuizAttempt::getScore)
                .average()
                .orElse(0.0);
            
            LocalDateTime lastAttemptDate = attempts.stream()
                .map(QuizAttempt::getCompletedAt)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);
            
            CourseQuizStats stats = CourseQuizStats.builder()
                .userId(userId)
                .courseId(courseId)
                .totalAttempts(attempts.size())
                .completedAttempts((int) attempts.stream()
                    .filter(a -> QuizAttempt.AttemptStatus.COMPLETED.equals(a.getStatus()))
                    .count())
                .bestScore(bestScore)
                .averageScore(averageScore)
                .lastAttemptDate(lastAttemptDate)
                .build();
            
            log.info("📊 Statistiques récupérées - userId: {}, courseId: {}, tentatives: {}, meilleur score: {}%", 
                userId, courseId, attempts.size(), bestScore);
                
            return stats;
                
        } catch (Exception e) {
            log.error("❌ Erreur récupération statistiques", e);
            return CourseQuizStats.error(userId, courseId, e.getMessage());
        }
    }
    
    /**
     * Test de connexion RAG
     */
    public Map<String, Object> testRAGConnection(Long courseId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Cours non trouvé"));
            
            result.put("course", course.getTitle());
            
            // 1. Vérifier les fichiers
            List<CourseFile> files = courseFileRepository.findByCourseId(courseId);
            result.put("files_count", files.size());
            result.put("files", files.stream()
                .map(f -> f.getFileName() + " (" + f.getFileType() + ")")
                .collect(Collectors.toList()));
            
            // 2. Tester le service RAG
            if (ragQuizService != null) {
                try {
                    // Tester avec un ID temporaire - CORRIGÉ : utiliser un ID existant ou créer un test
                    Long testUserId = 1L; // ID de test
                    try {
                        userRepository.findById(testUserId).orElseThrow(() -> new RuntimeException("Utilisateur test non trouvé"));
                        QuizResponseDTO testQuiz = ragQuizService.generatePersonalizedQuiz(testUserId, course.getTitle());
                        result.put("rag_success", true);
                        result.put("questions_generated", testQuiz.getQuestions().size());
                        result.put("quiz_title", testQuiz.getTitle());
                        result.put("quiz_description", testQuiz.getDescription());
                    } catch (Exception e) {
                        // Si l'utilisateur 1 n'existe pas, tester sans userId
                        result.put("rag_success", false);
                        result.put("rag_error", "Utilisateur test (ID:1) non trouvé: " + e.getMessage());
                    }
                } catch (Exception e) {
                    result.put("rag_success", false);
                    result.put("rag_error", e.getMessage());
                }
            } else {
                result.put("rag_success", false);
                result.put("rag_error", "Service RAG non disponible");
            }
            
            result.put("success", true);
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }
    
    // ========== MÉTHODES UTILITAIRES ==========
    
    private String[] generateQuizInstructions() {
        return new String[]{
            "Instructions pour le quiz:",
            "1. Vous avez 60 minutes pour compléter le quiz",
            "2. Le quiz contient entre 5 et 10 questions",
            "3. Un score de 60% est requis pour réussir",
            "4. Le quiz sera soumis automatiquement à la fin du temps",
            "5. Les questions sont générées à partir des fichiers du cours"
        };
    }
    
    private String[] generateWarnings(QuizEligibilityResponse eligibility, List<CourseFile> files) {
        List<String> warnings = new ArrayList<>();
        
        if (eligibility.getRemainingAttemptsToday() == 1) {
            warnings.add("⚠️ Dernière tentative disponible aujourd'hui");
        }
        
        if (files != null && files.size() < 2) {
            warnings.add("⚠️ Le cours n'a que " + files.size() + " fichier(s). Questions limitées.");
        }
        
        return warnings.toArray(new String[0]);
    }
    
    private double calculateScore(Map<String, Object> submission) {
        // Logique simplifiée
        double score = 50 + Math.random() * 45;
        log.info("🎯 Score calculé: {}%", Math.round(score * 10) / 10.0);
        return score;
    }
    
    private QuizFeedback generateDetailedFeedback(double score) {
        String grade;
        if (score >= 90) grade = "A";
        else if (score >= 80) grade = "B";
        else if (score >= 70) grade = "C";
        else if (score >= 60) grade = "D";
        else grade = "F";
        
        return QuizFeedback.builder()
            .score(score)
            .grade(grade)
            .strengths(new String[]{"Compréhension des concepts", "Capacité d'analyse"})
            .weaknesses(new String[]{"Attention aux détails", "Précision terminologique"})
            .suggestions(new String[]{
                "Revoyez les fichiers du cours",
                "Pratiquez avec des exercices similaires"
            })
            .build();
    }
    
    private Map<String, Object> generateStudyRecommendations(Long userId, Long courseId, double score) {
        Map<String, Object> recs = new HashMap<>();
        
        if (score < 60.0) {
            recs.put("action", "STUDY_AGAIN");
            recs.put("message", "Revoyez les fichiers du cours avant de retenter");
            recs.put("waitHours", 24);
        } else if (score < 80.0) {
            recs.put("action", "PRACTICE_MORE");
            recs.put("message", "Bonne compréhension, pratiquez davantage");
            recs.put("resources", new String[]{"Exercices supplémentaires"});
        } else {
            recs.put("action", "ADVANCE");
            recs.put("message", "Excellent ! Vous pouvez avancer");
            recs.put("nextStep", "Passez au chapitre suivant");
        }
        
        return recs;
    }
    
    // Méthode pour debug
    public Map<String, Object> debugCourseFiles(Long courseId) {
        Map<String, Object> debug = new HashMap<>();
        
        try {
            Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Cours non trouvé"));
            
            debug.put("course", course.getTitle());
            
            List<CourseFile> files = courseFileRepository.findByCourseId(courseId);
            debug.put("fileCount", files.size());
            
            List<Map<String, Object>> fileDetails = files.stream()
                .map(f -> {
                    Map<String, Object> detail = new HashMap<>();
                    detail.put("id", f.getId());
                    detail.put("name", f.getFileName());
                    detail.put("type", f.getFileType());
                    detail.put("size", f.getFileSize());
                    detail.put("path", f.getFilePath());
                    return detail;
                })
                .collect(Collectors.toList());
            
            debug.put("files", fileDetails);
            debug.put("success", true);
            
        } catch (Exception e) {
            debug.put("success", false);
            debug.put("error", e.getMessage());
        }
        
        return debug;
    }
}