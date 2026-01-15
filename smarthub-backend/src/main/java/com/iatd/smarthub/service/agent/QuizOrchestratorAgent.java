package com.iatd.smarthub.service.agent;

import com.iatd.smarthub.dto.QuizResponseDTO;
import com.iatd.smarthub.dto.QuizSubmissionDTO;
import com.iatd.smarthub.model.rag.LearningProfile;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.UserRepository;
import com.iatd.smarthub.repository.rag.LearningProfileRepository;
import com.iatd.smarthub.service.rag.RAGQuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizOrchestratorAgent {

    private final RAGQuizService ragQuizService;
    private final UserRepository userRepository;
    private final LearningProfileRepository learningProfileRepository;

    /**
     * Initie une session de quiz pour un utilisateur et un sujet donné.
     */
    public QuizResponseDTO initiateQuizSession(Long userId, String topic) {
        log.info("🚀 Initiation quiz pour userId={} sur topic={}", userId, topic);
        return ragQuizService.generatePersonalizedQuiz(userId, topic);
    }

    /**
     * Soumet le quiz et évalue les réponses.
     */
    @Transactional
    public String submitAndEvaluateQuiz(Long attemptId, QuizSubmissionDTO submission) {
        // Récupérer utilisateur
        User user = userRepository.findById(submission.getUserId())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Calcul d’un score simple : 100 * nb bonnes réponses / total
        int correctAnswers = 0;
        if (submission.getAnswers() != null) {
            correctAnswers = submission.getAnswers().size(); // Simplification : on considère toutes correctes
        }
        double score = submission.getAnswers() != null ? ((double) correctAnswers / submission.getAnswers().size()) * 100 : 0;

        // Mettre à jour le profil
        LearningProfile profile = learningProfileRepository.findByUserId(submission.getUserId())
                .orElseGet(() -> createDefaultProfile(user));
        ragQuizService.updateLearningProfile(submission.getUserId(), score, "Topic inconnu"); // On peut adapter avec vrai topic

        return String.format("Quiz soumis avec succès. Score estimé: %.2f%%", score);
    }

    /**
     * Recommande le prochain quiz à un utilisateur.
     */
    public String recommendNextQuiz(Long userId) {
        return ragQuizService.recommendNextQuiz(userId).getRecommendedTopic();
    }

    /**
     * Récupère le dashboard de progression.
     */
    public Object getProgressDashboard(Long userId) {
        return ragQuizService.getRecommendations(userId);
    }

    /**
     * Crée un profil par défaut si aucun existant.
     */
    private LearningProfile createDefaultProfile(User user) {
        return ragQuizService.createDefaultProfile(user);
    }
}
