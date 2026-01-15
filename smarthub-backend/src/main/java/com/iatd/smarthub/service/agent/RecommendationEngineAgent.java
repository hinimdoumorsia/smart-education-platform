package com.iatd.smarthub.service.agent;

import com.iatd.smarthub.model.rag.QuizRecommendation;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.UserRepository;
import com.iatd.smarthub.repository.rag.QuizRecommendationRepository;
import com.iatd.smarthub.service.rag.RAGQuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationEngineAgent {

    private final RAGQuizService ragQuizService;
    private final UserRepository userRepository;
    private final QuizRecommendationRepository quizRecommendationRepository;

    /**
     * Génère un chemin d'apprentissage personnalisé pour un utilisateur
     * basé sur ses recommandations existantes et son profil.
     */
    public List<QuizRecommendation> generateLearningPath(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé: " + userId));

        // 1. Récupérer toutes les recommandations non acceptées pour l'utilisateur
        List<QuizRecommendation> pendingRecommendations =
                quizRecommendationRepository.findPendingRecommendationsByUserId(userId);

        // 2. Trier les recommandations par score de confiance décroissant
        pendingRecommendations.sort(Comparator.comparingDouble(QuizRecommendation::getConfidenceScore).reversed());

        // 3. Limiter à un maximum de 5 recommandations
        List<QuizRecommendation> topRecommendations = pendingRecommendations.stream()
                .limit(5)
                .collect(Collectors.toList());

        log.info("🔹 {} recommandations générées pour userId {}", topRecommendations.size(), userId);
        return topRecommendations;
    }

    /**
     * Crée et sauvegarde une nouvelle recommandation pour l'utilisateur
     * en utilisant RAGQuizService pour le contexte.
     */
    public QuizRecommendation createRecommendation(Long userId, String topic, double confidence, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé: " + userId));

        QuizRecommendation recommendation = new QuizRecommendation();
        recommendation.setUser(user);
        recommendation.setRecommendedTopic(topic);
        recommendation.setConfidenceScore(confidence);
        recommendation.setReason(reason);
        recommendation.setRecommendedAt(LocalDateTime.now());
        recommendation.setAccepted(false);

        QuizRecommendation saved = quizRecommendationRepository.save(recommendation);
        log.info("✅ Recommandation créée pour '{}' (userId {})", topic, userId);
        return saved;
    }

    /**
     * Génère automatiquement des recommandations basées sur un topic d'intérêt
     * et le profil utilisateur via RAGQuizService.
     */
    public List<QuizRecommendation> generateRecommendationsFromTopic(Long userId, String topic) {
        // 1. Utiliser RAGQuizService pour générer un quiz contextuel
        var quizResponse = ragQuizService.generatePersonalizedQuiz(userId, topic);

        // 2. Créer une recommandation associée au quiz généré
        QuizRecommendation rec = createRecommendation(
                userId,
                topic,
                0.8, // confiance par défaut
                "Recommandation basée sur le profil utilisateur et le topic " + topic
        );

        return List.of(rec);
    }
}
