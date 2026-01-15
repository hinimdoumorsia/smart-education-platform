package com.iatd.smarthub.service.agent;
import org.springframework.transaction.annotation.Transactional; 

import com.iatd.smarthub.model.quiz.QuizAttempt;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.QuizAttemptRepository;

import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProgressTrackerAgent {

    private final QuizAttemptRepository quizAttemptRepository;

    /**
     * Analyse la progression d'un étudiant
     */
    public ProgressAnalysis analyzeProgress(Long userId) {
        log.info("🤖 Analyse progression pour userId: {}", userId);

        User student = new User();
        student.setId(userId);

        List<QuizAttempt> attempts = quizAttemptRepository.findByStudent(student);

        if (attempts.isEmpty()) {
            return ProgressAnalysis.empty(userId);
        }

        List<QuizAttempt> completedAttempts = attempts.stream()
                .filter(a -> QuizAttempt.AttemptStatus.COMPLETED.equals(a.getStatus()))
                .collect(Collectors.toList());

        double successRate = calculateSuccessRate(completedAttempts);
        double averageScore = calculateAverageScore(completedAttempts);
        long totalTimeSpent = calculateTotalTimeSpent(completedAttempts);
        LocalDateTime lastActive = getLastActivityDate(attempts);
        Map<String, Double> topicPerformance = analyzeTopicPerformance(completedAttempts);
        List<String> strongTopics = identifyStrongTopics(topicPerformance);
        List<String> weakTopics = identifyWeakTopics(topicPerformance);

        return ProgressAnalysis.builder()
                .userId(userId)
                .quizCount(attempts.size())
                .completedCount(completedAttempts.size())
                .successRate(successRate)
                .averageScore(averageScore)
                .totalTimeSpent(totalTimeSpent)
                .lastActiveDate(lastActive)
                .topicPerformance(topicPerformance)
                .strongTopics(strongTopics)
                .weakTopics(weakTopics)
                .build();
    }

    private double calculateSuccessRate(List<QuizAttempt> completed) {
        if (completed.isEmpty()) return 0.0;
        long passed = completed.stream().filter(a -> a.getScore() != null && a.getScore() >= 60.0).count();
        return (double) passed / completed.size() * 100;
    }

    private double calculateAverageScore(List<QuizAttempt> completed) {
        return completed.stream()
                .filter(a -> a.getScore() != null)
                .mapToDouble(QuizAttempt::getScore)
                .average()
                .orElse(0.0);
    }

    private long calculateTotalTimeSpent(List<QuizAttempt> completed) {
        return completed.stream()
                .filter(a -> a.getAttemptedAt() != null && a.getCompletedAt() != null)
                .mapToLong(a -> ChronoUnit.SECONDS.between(a.getAttemptedAt(), a.getCompletedAt()))
                .sum();
    }

    private LocalDateTime getLastActivityDate(List<QuizAttempt> attempts) {
        return attempts.stream()
                .map(QuizAttempt::getUpdatedAt)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);
    }

    private Map<String, Double> analyzeTopicPerformance(List<QuizAttempt> attempts) {
        Map<String, Double> topicScores = new HashMap<>();
        Map<String, Integer> topicCounts = new HashMap<>();

        for (QuizAttempt attempt : attempts) {
            // VÉRIFIER SI LE QUIZ EXISTE AVANT D'Y ACCÉDER
            if (attempt.getScore() == null || attempt.getQuiz() == null) {
                continue; // Passer à l'itération suivante
            }

            try {
                // Utilisation du title du quiz comme "topic"
                String topic = attempt.getQuiz().getTitle() != null ? 
                               attempt.getQuiz().getTitle() : "Unknown";
                
                topicScores.merge(topic, attempt.getScore(), Double::sum);
                topicCounts.merge(topic, 1, Integer::sum);
            } catch (Exception e) {
                log.warn("⚠️ Impossible d'accéder au quiz pour l'attempt {}: {}", 
                         attempt.getId(), e.getMessage());
                continue;
            }
        }

        // Calculer la moyenne par topic
        Map<String, Double> averageScores = new HashMap<>();
        for (Map.Entry<String, Double> entry : topicScores.entrySet()) {
            String topic = entry.getKey();
            double totalScore = entry.getValue();
            int count = topicCounts.getOrDefault(topic, 1);
            averageScores.put(topic, totalScore / count);
        }

        return averageScores;
    }


    private List<String> identifyStrongTopics(Map<String, Double> topicPerformance) {
        return topicPerformance.entrySet().stream()
                .filter(e -> e.getValue() >= 75.0)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    private List<String> identifyWeakTopics(Map<String, Double> topicPerformance) {
        return topicPerformance.entrySet().stream()
                .filter(e -> e.getValue() < 60.0)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    public String recommendNextTopic(Long userId) {
        ProgressAnalysis analysis = analyzeProgress(userId);

        if (!analysis.getWeakTopics().isEmpty()) return analysis.getWeakTopics().get(0);
        if (!analysis.getStrongTopics().isEmpty()) return "Avancé: " + analysis.getStrongTopics().get(0);

        return "Introduction aux bases";
    }

    // NOUVELLES MÉTHODES POUR AdaptiveQuizOrchestrator
    public List<String> getStrongTopics(Long userId) {
        ProgressAnalysis analysis = analyzeProgress(userId);
        return analysis.getStrongTopics();
    }
    
    public List<String> getWeakTopics(Long userId) {
        ProgressAnalysis analysis = analyzeProgress(userId);
        return analysis.getWeakTopics();
    }
    
    public double getAverageScore(Long userId) {
        ProgressAnalysis analysis = analyzeProgress(userId);
        return analysis.getAverageScore();
    }
    
    public int getCompletedCount(Long userId) {
        ProgressAnalysis analysis = analyzeProgress(userId);
        return analysis.getCompletedCount();
    }
    
    public LocalDateTime getLastActiveDate(Long userId) {
        ProgressAnalysis analysis = analyzeProgress(userId);
        return analysis.getLastActiveDate();
    }
    
    public Map<String, Object> getProgressSummary(Long userId) {
        ProgressAnalysis analysis = analyzeProgress(userId);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("userId", userId);
        summary.put("quizCount", analysis.getQuizCount());
        summary.put("completedCount", analysis.getCompletedCount());
        summary.put("averageScore", analysis.getAverageScore());
        summary.put("successRate", analysis.getSuccessRate());
        summary.put("strongTopics", analysis.getStrongTopics());
        summary.put("weakTopics", analysis.getWeakTopics());
        summary.put("lastActive", analysis.getLastActiveDate());
        
        return summary;
    }

    // MÉTHODES SUPPLÉMENTAIRES
    public int getTotalQuizCount(Long userId) {
        ProgressAnalysis analysis = analyzeProgress(userId);
        return analysis.getQuizCount();
    }
    
    public double getSuccessRate(Long userId) {
        ProgressAnalysis analysis = analyzeProgress(userId);
        return analysis.getSuccessRate();
    }
    
    public Map<String, Double> getTopicPerformance(Long userId) {
        ProgressAnalysis analysis = analyzeProgress(userId);
        return analysis.getTopicPerformance();
    }
    
    public boolean hasProgressData(Long userId) {
        ProgressAnalysis analysis = analyzeProgress(userId);
        return analysis.getQuizCount() > 0;
    }
    
    public String getPerformanceLevel(Long userId) {
        ProgressAnalysis analysis = analyzeProgress(userId);
        double avgScore = analysis.getAverageScore();
        
        if (avgScore >= 85.0) return "EXCELLENT";
        if (avgScore >= 70.0) return "GOOD";
        if (avgScore >= 60.0) return "SATISFACTORY";
        return "NEEDS_IMPROVEMENT";
    }
    
    public List<Map<String, Object>> getRecentActivity(Long userId, int limit) {
        User student = new User();
        student.setId(userId);
        
        List<QuizAttempt> attempts = quizAttemptRepository.findByStudent(student);
        
        return attempts.stream()
                .sorted((a, b) -> b.getAttemptedAt().compareTo(a.getAttemptedAt()))
                .limit(limit)
                .map(attempt -> {
                    Map<String, Object> activity = new HashMap<>();
                    activity.put("id", attempt.getId());
                    activity.put("quizTitle", attempt.getQuiz() != null ? attempt.getQuiz().getTitle() : "Unknown");
                    activity.put("score", attempt.getScore());
                    activity.put("status", attempt.getStatus());
                    activity.put("attemptedAt", attempt.getAttemptedAt());
                    activity.put("completedAt", attempt.getCompletedAt());
                    activity.put("timeSpent", 
                        attempt.getAttemptedAt() != null && attempt.getCompletedAt() != null ?
                        ChronoUnit.SECONDS.between(attempt.getAttemptedAt(), attempt.getCompletedAt()) : 0);
                    return activity;
                })
                .collect(Collectors.toList());
    }
    
    public Map<String, Object> getLearningTrend(Long userId) {
        User student = new User();
        student.setId(userId);
        
        List<QuizAttempt> attempts = quizAttemptRepository.findByStudent(student);
        
        if (attempts.isEmpty()) {
            return Map.of("hasData", false, "message", "Aucune donnée disponible");
        }
        
        // Trier par date
        attempts.sort(Comparator.comparing(QuizAttempt::getAttemptedAt));
        
        List<Double> scores = attempts.stream()
                .filter(a -> a.getScore() != null)
                .map(QuizAttempt::getScore)
                .collect(Collectors.toList());
        
        List<LocalDateTime> dates = attempts.stream()
                .map(QuizAttempt::getAttemptedAt)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        
        // Calculer la tendance
        double trend = calculateTrend(scores);
        
        Map<String, Object> trendAnalysis = new HashMap<>();
        trendAnalysis.put("hasData", true);
        trendAnalysis.put("totalAttempts", attempts.size());
        trendAnalysis.put("scoreTrend", trend);
        trendAnalysis.put("trendDirection", trend > 0 ? "IMPROVING" : trend < 0 ? "DECLINING" : "STABLE");
        trendAnalysis.put("averageScore", scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0));
        trendAnalysis.put("firstAttemptDate", dates.isEmpty() ? null : dates.get(0));
        trendAnalysis.put("lastAttemptDate", dates.isEmpty() ? null : dates.get(dates.size() - 1));
        trendAnalysis.put("scoreHistory", scores);
        
        return trendAnalysis;
    }
    
    private double calculateTrend(List<Double> scores) {
        if (scores.size() < 2) return 0.0;
        
        // Régression linéaire simple
        double sumX = 0.0, sumY = 0.0, sumXY = 0.0, sumX2 = 0.0;
        int n = scores.size();
        
        for (int i = 0; i < n; i++) {
            sumX += i;
            sumY += scores.get(i);
            sumXY += i * scores.get(i);
            sumX2 += i * i;
        }
        
        double slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }

    @Getter
    @Builder
    public static class ProgressAnalysis {
        private Long userId;
        private Integer quizCount;
        private Integer completedCount;
        private Double successRate;
        private Double averageScore;
        private Long totalTimeSpent;
        private LocalDateTime lastActiveDate;
        private Map<String, Double> topicPerformance;
        private List<String> strongTopics;
        private List<String> weakTopics;

        public static ProgressAnalysis empty(Long userId) {
            return ProgressAnalysis.builder()
                    .userId(userId)
                    .quizCount(0)
                    .completedCount(0)
                    .successRate(0.0)
                    .averageScore(0.0)
                    .totalTimeSpent(0L)
                    .lastActiveDate(null)
                    .topicPerformance(new HashMap<>())
                    .strongTopics(new ArrayList<>())
                    .weakTopics(new ArrayList<>())
                    .build();
        }
        
        // GETTERS SÉCURISÉS
        public Integer getQuizCount() {
            return quizCount != null ? quizCount : 0;
        }
        
        public Integer getCompletedCount() {
            return completedCount != null ? completedCount : 0;
        }
        
        public Double getSuccessRate() {
            return successRate != null ? successRate : 0.0;
        }
        
        public Double getAverageScore() {
            return averageScore != null ? averageScore : 0.0;
        }
        
        public Long getTotalTimeSpent() {
            return totalTimeSpent != null ? totalTimeSpent : 0L;
        }
        
        public LocalDateTime getLastActiveDate() {
            return lastActiveDate;
        }
        
        public Map<String, Double> getTopicPerformance() {
            return topicPerformance != null ? topicPerformance : new HashMap<>();
        }
        
        public List<String> getStrongTopics() {
            return strongTopics != null ? strongTopics : new ArrayList<>();
        }
        
        public List<String> getWeakTopics() {
            return weakTopics != null ? weakTopics : new ArrayList<>();
        }
        
        // MÉTHODES UTILITAIRES
        public boolean hasData() {
            return quizCount != null && quizCount > 0;
        }
        
        public String getPerformanceSummary() {
            if (!hasData()) return "Aucune donnée disponible";
            
            StringBuilder summary = new StringBuilder();
            summary.append("Quiz complétés: ").append(completedCount).append("/").append(quizCount).append("\n");
            summary.append("Score moyen: ").append(String.format("%.1f", averageScore)).append("%\n");
            summary.append("Taux de réussite: ").append(String.format("%.1f", successRate)).append("%\n");
            
            if (!strongTopics.isEmpty()) {
                summary.append("Points forts: ").append(String.join(", ", strongTopics)).append("\n");
            }
            
            if (!weakTopics.isEmpty()) {
                summary.append("À améliorer: ").append(String.join(", ", weakTopics));
            }
            
            return summary.toString();
        }
    }
} // FIN DE LA CLASSE