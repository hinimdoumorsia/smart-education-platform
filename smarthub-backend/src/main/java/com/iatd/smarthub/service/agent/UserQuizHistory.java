package com.iatd.smarthub.service.agent;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;
import java.util.Map;

// Classe pour l'historique utilisateur
@Data
@Builder
class UserQuizHistory {
    private Integer totalAttempts;
    private Integer successfulAttempts;
    private Double averageScore;
    private List<String> recentTopics;
    private List<String> weakTopics;
    private List<String> strongTopics;
    private LocalDateTime lastAttemptDate;
    private Double attemptFrequency; // quizzes par semaine
}

// Classe pour l'état utilisateur
@Data
@Builder
class UserState {
    private Long userId;
    private String currentLevel;
    private Double currentMotivation;
    private Double fatigueLevel;
    private Double readinessForNextQuiz;
    private List<String> preferredTopics;
    private List<String> avoidTopics;
    private String recentPerformanceTrend;
    private Double learningVelocity;
    private Double confidenceLevel;
}

// Classe pour l'analyse de progression
@Data
@Builder
class ProgressAnalysis {
    private Long userId;
    private Integer quizCount;
    private Double successRate;
    private Double averageScore;
    private Long totalTimeSpent;
    private Double consistencyScore;
    private String progressTrend;
    private List<String> improvementPatterns;
    private List<String> regressionPatterns;
    private Map<String, Double> topicProficiency;
    private LocalDateTime lastActiveDate;
    private Double learningVelocity;
}

// Classe pour la tendance de niveau
@Data
@Builder
class LevelTrend {
    private String currentLevel;
    private String trend; // IMPROVING, DECLINING, STABLE, FLUCTUATING
    private Double confidence;
    private String predictedNextLevel;
    private Integer weeksToNextLevel;
    private List<String> milestonesAchieved;
}

// Classe pour l'analyse des lacunes
@Data
@Builder
class KnowledgeGapAnalysis {
    private Long userId;
    private Integer totalGaps;
    private Integer criticalGaps;
    private Map<String, GapAnalysis> gaps;
    private Double overallGapScore;
    private List<String> recommendedFocusTopics;
}

@Data
@Builder
class GapAnalysis {
    private String topic;
    private Double averageScore;
    private Double consistency;
    private String severity; // CRITICAL, HIGH, MEDIUM, LOW, NONE
    private List<String> recommendedActions;
}

// Classe pour les recommandations de parcours
@Data
@Builder
class LearningPathRecommendation {
    private String type; // GAP_FILLING, LEVEL_UP, REINFORCEMENT, EXPLORATION
    private String topic;
    private String difficulty;
    private String reason;
    private Integer priority; // 1-10
    private Duration estimatedTime;
    private List<String> expectedOutcomes;
}
