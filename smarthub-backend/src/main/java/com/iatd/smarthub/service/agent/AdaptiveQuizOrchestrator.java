package com.iatd.smarthub.service.agent;

import com.iatd.smarthub.dto.QuizResponseDTO;
import com.iatd.smarthub.dto.agent.*;
import com.iatd.smarthub.model.rag.LearningProfile;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.UserRepository;
import com.iatd.smarthub.repository.rag.LearningProfileRepository;
import com.iatd.smarthub.service.rag.RAGQuizGenerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdaptiveQuizOrchestrator {
    
    private final CourseQuizSupervisorAgent supervisorAgent;
    private final RAGQuizGenerationService ragQuizGenerationService;
    private final ProgressTrackerAgent progressTrackerAgent;
    private final UserRepository userRepository;
    private final LearningProfileRepository learningProfileRepository;
    
    /**
     * Orchestre un quiz adaptatif complet avec stratégie
     */
    @Transactional
    public Map<String, Object> orchestrateAdaptiveQuiz(Long userId, Long courseId) {
        log.info("🎬 Orchestration quiz adaptatif - userId: {}, courseId: {}", userId, courseId);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Étape 1: Vérification d'éligibilité
            QuizEligibilityResponse eligibility = supervisorAgent.checkQuizEligibility(userId, courseId);
            result.put("eligibility", eligibility);
            
            if (!eligibility.isEligible()) {
                result.put("status", "NOT_ELIGIBLE");
                result.put("message", eligibility.getReason());
                return result;
            }
            
            // Étape 2: Analyse de progression
            ProgressTrackerAgent.ProgressAnalysis progress = 
                progressTrackerAgent.analyzeProgress(userId);
            result.put("progressAnalysis", progress);
            
            // Étape 3: Détermination de la stratégie
            String quizStrategy = determineQuizStrategy(progress, eligibility);
            result.put("strategy", quizStrategy);
            
            // Étape 4: Paramètres du quiz
            Map<String, Object> agentParams = createAgentParameters(quizStrategy, progress);
            result.put("agentParameters", agentParams);
            
            // Étape 5: Initiation du quiz (sans sauvegarde en base)
            QuizInitiationResponse initiation = createQuizInitiation(userId, courseId, quizStrategy);
            result.put("initiation", initiation);
            
            // Étape 6: Génération du quiz adaptatif
            QuizResponseDTO quiz = generateAdaptiveQuiz(userId, courseId, quizStrategy, agentParams);
            result.put("quiz", quiz);
            
            result.put("status", "SUCCESS");
            result.put("message", "Quiz adaptatif généré avec succès");
            result.put("timestamp", LocalDateTime.now());
            
        } catch (Exception e) {
            log.error("❌ Erreur orchestration adaptative", e);
            result.put("status", "ERROR");
            result.put("message", e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Crée une réponse d'initiation (sans sauvegarde en base)
     */
    private QuizInitiationResponse createQuizInitiation(Long userId, Long courseId, String strategy) {
        return QuizInitiationResponse.builder()
            .attemptId(generateTemporaryAttemptId(userId, courseId))
            .quizId(null) // Pas de quiz en base
            .quizResponse(null) // Sera rempli plus tard
            .timeLimitMinutes(45)
            .startTime(LocalDateTime.now())
            .endTime(LocalDateTime.now().plusMinutes(45))
            .remainingTimeMinutes(45)
            .instructions(new String[]{
                "Quiz adaptatif généré par IA",
                "Stratégie: " + strategy,
                "Temps limite: 45 minutes",
                "Basez-vous sur vos connaissances"
            })
            .warnings(new String[]{"Ce quiz est généré dynamiquement par IA"})
            .supervisorEnabled(true)
            .build();
    }
    
    /**
     * Génère un ID de tentative temporaire
     */
    private Long generateTemporaryAttemptId(Long userId, Long courseId) {
        return userId * 10000L + courseId + System.currentTimeMillis() % 10000;
    }
    
    /**
     * Détermine la stratégie de quiz
     */
    private String determineQuizStrategy(ProgressTrackerAgent.ProgressAnalysis progress, 
                                       QuizEligibilityResponse eligibility) {
        
        // Vérifier si progress n'est pas null et a les données nécessaires
        if (progress == null) {
            return "DIAGNOSTIC"; // Par défaut si pas de données
        }
        
        // Utiliser des méthodes sécurisées
        int completedCount = progress.getCompletedCount() != null ? progress.getCompletedCount() : 0;
        double averageScore = progress.getAverageScore() != null ? progress.getAverageScore() : 0.0;
        
        if (completedCount < 2) return "DIAGNOSTIC";
        if (averageScore < 50.0) return "REMEDIATION";
        if (averageScore > 85.0) return "CHALLENGE";
        
        // Vérifier la date de dernière activité
        LocalDateTime lastActiveDate = progress.getLastActiveDate();
        if (averageScore > 70.0 && 
            lastActiveDate != null &&
            lastActiveDate.isBefore(LocalDateTime.now().minusDays(7))) {
            return "REINFORCEMENT";
        }
        
        return "STANDARD";
    }
    
    /**
     * Crée les paramètres d'agent
     */
    private Map<String, Object> createAgentParameters(String strategy, 
                                                    ProgressTrackerAgent.ProgressAnalysis progress) {
        Map<String, Object> params = new HashMap<>();
        params.put("strategy", strategy);
        
        // Récupérer les faiblesses de manière sécurisée
        List<String> weakTopics = progress != null && progress.getWeakTopics() != null 
            ? progress.getWeakTopics() 
            : new ArrayList<>();
        
        switch (strategy) {
            case "DIAGNOSTIC":
                params.put("difficulty", "MEDIUM");
                params.put("questionCount", 5);
                params.put("focusAreas", weakTopics);
                break;
                
            case "REMEDIATION":
                params.put("difficulty", "EASY");
                params.put("questionCount", 7);
                params.put("focusAreas", weakTopics);
                break;
                
            case "CHALLENGE":
                params.put("difficulty", "HARD");
                params.put("questionCount", 10);
                params.put("includeAdvanced", true);
                break;
                
            default:
                params.put("difficulty", "MEDIUM");
                params.put("questionCount", 8);
        }
        
        return params;
    }
    
    /**
     * Génère le quiz adaptatif
     */
    private QuizResponseDTO generateAdaptiveQuiz(Long userId, Long courseId, 
                                                String strategy, Map<String, Object> agentParams) {
        
        try {
            // Récupérer l'utilisateur et le profil
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            LearningProfile profile = learningProfileRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultProfile(user));
            
            // Récupérer le sujet du cours
            String topic = getCourseTopic(courseId);
            
            // Simuler le contenu RAG (à remplacer par votre vrai service)
            List<String> relevantContent = simulateRelevantContent(topic, strategy);
            
            // Construire le prompt RAG
            String ragPrompt = buildAdaptiveRAGPrompt(topic, relevantContent, profile, strategy, agentParams);
            
            // Générer le quiz
            int questionCount = (Integer) agentParams.getOrDefault("questionCount", 5);
            
            return ragQuizGenerationService.generateQuizFromRAGPrompt(
                ragPrompt,
                "Quiz " + strategy + ": " + topic,
                questionCount
            );
            
        } catch (Exception e) {
            log.error("❌ Erreur génération quiz adaptatif", e);
            throw new RuntimeException("Erreur génération quiz: " + e.getMessage());
        }
    }
    
    /**
     * Simule le contenu pertinent (à remplacer par votre vrai service RAG)
     */
    private List<String> simulateRelevantContent(String topic, String strategy) {
        List<String> content = new ArrayList<>();
        
        switch (strategy) {
            case "DIAGNOSTIC":
                content.add("Concepts de base sur " + topic + ": définitions et principes fondamentaux.");
                content.add("Introduction à " + topic + ": les éléments essentiels à connaître.");
                break;
                
            case "REMEDIATION":
                content.add("Explications détaillées sur les aspects difficiles de " + topic + ".");
                content.add("Exercices corrigés pour renforcer la compréhension de " + topic + ".");
                break;
                
            case "CHALLENGE":
                content.add("Concepts avancés de " + topic + ": applications complexes et cas d'usage.");
                content.add("Problèmes difficiles liés à " + topic + " avec solutions innovantes.");
                break;
                
            default:
                content.add("Contenu standard sur " + topic + ": vue d'ensemble complète.");
        }
        
        return content;
    }
    
    /**
     * Construit le prompt RAG adaptatif
     */
    private String buildAdaptiveRAGPrompt(String topic, List<String> relevantContent, 
                                         LearningProfile profile, String strategy,
                                         Map<String, Object> agentParams) {
        
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("🎯 STRATÉGIE: ").append(strategy).append("\n");
        prompt.append("📊 DIFFICULTÉ: ").append(agentParams.get("difficulty")).append("\n\n");
        
        prompt.append("👤 PROFIL APPRENANT:\n");
        prompt.append("- Niveau: ").append(profile.getProficiencyLevel()).append("\n");
        
        // Gérer les intérêts null
        if (profile.getInterests() != null && !profile.getInterests().isEmpty()) {
            prompt.append("- Intérêts: ").append(String.join(", ", profile.getInterests())).append("\n");
        }
        
        // Gérer les faiblesses null
        if (profile.getWeaknesses() != null && !profile.getWeaknesses().isEmpty()) {
            prompt.append("- Points à améliorer: ").append(String.join(", ", profile.getWeaknesses())).append("\n");
        }
        
        prompt.append("\n");
        
        prompt.append("📖 CONTENU DE RÉFÉRENCE:\n");
        if (!relevantContent.isEmpty()) {
            for (int i = 0; i < relevantContent.size(); i++) {
                prompt.append("\n【Source ").append(i + 1).append("】\n");
                prompt.append(relevantContent.get(i)).append("\n");
            }
        } else {
            prompt.append("Aucun contenu spécifique trouvé. Basez-vous sur vos connaissances générales du sujet.\n");
        }
        prompt.append("\n");
        
        prompt.append("""
            🎯 INSTRUCTIONS DE GÉNÉRATION:
            
            1. Questions basées UNIQUEMENT sur le contenu ci-dessus
            2. Adaptées au niveau: """).append(profile.getProficiencyLevel()).append("""
            3. Mélanger les types: SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE
            4. Questions claires et non ambiguës
            5. Inclure une explication pour chaque réponse
            
            6. FORMAT JSON STRICT:
            {
              "questions": [
                {
                  "text": "Question?",
                  "type": "SINGLE_CHOICE",
                  "options": ["A", "B", "C", "D"],
                  "correctAnswer": "B"
                }
              ]
            }
            
            7. Retourner UNIQUEMENT le JSON, sans texte supplémentaire
            """);
        
        return prompt.toString();
    }
    
    private String getCourseTopic(Long courseId) {
        // À implémenter: récupérer le titre du cours depuis votre CourseRepository
        // Pour l'instant, retournez une valeur par défaut
        return "Sujet du cours ID: " + courseId;
    }
    
    private LearningProfile createDefaultProfile(User user) {
        LearningProfile profile = new LearningProfile();
        profile.setUser(user);
        profile.setProficiencyLevel("INTERMEDIATE");
        
        // Initialiser les listes si null
        if (profile.getInterests() == null) {
            profile.setInterests(new ArrayList<>());
        }
        if (profile.getWeaknesses() == null) {
            profile.setWeaknesses(new ArrayList<>());
        }
        
        // Ajouter des intérêts par défaut
        profile.getInterests().add("Programmation");
        profile.getInterests().add("Informatique");
        
        return learningProfileRepository.save(profile);
    }
}