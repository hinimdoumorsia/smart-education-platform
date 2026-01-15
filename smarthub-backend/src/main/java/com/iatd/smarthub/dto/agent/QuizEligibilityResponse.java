package com.iatd.smarthub.dto.agent;

import com.iatd.smarthub.service.agent.ProgressTrackerAgent;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class QuizEligibilityResponse {
    private Long userId;
    private Long courseId;
    private String courseTitle;
    private boolean isEligible;
    private String reason;
    private int maxAttemptsPerDay;
    private int attemptsToday;
    private int remainingAttemptsToday;
    private LocalDateTime lastAttemptDate;
    private LocalDateTime nextAvailableTime;
    private ProgressTrackerAgent.ProgressAnalysis progressAnalysis;
    private String recommendation;
    private String suggestion;
    private Map<String, String> recommendations;
    
    public static QuizEligibilityResponse error(Long userId, Long courseId, String error) {
        return QuizEligibilityResponse.builder()
            .userId(userId)
            .courseId(courseId)
            .isEligible(false)
            .reason("Erreur: " + error)
            .maxAttemptsPerDay(3)
            .attemptsToday(0)
            .remainingAttemptsToday(3)
            .build();
    }
}