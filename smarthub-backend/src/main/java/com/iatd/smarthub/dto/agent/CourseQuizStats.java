package com.iatd.smarthub.dto.agent;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class CourseQuizStats {
    private Long userId;
    private Long courseId;
    private int totalAttempts;
    private int completedAttempts;
    private double bestScore;
    private double averageScore;
    private LocalDateTime lastAttemptDate;
    
    public static CourseQuizStats error(Long userId, Long courseId, String error) {
        return CourseQuizStats.builder()
            .userId(userId)
            .courseId(courseId)
            .totalAttempts(0)
            .completedAttempts(0)
            .bestScore(0.0)
            .averageScore(0.0)
            .build();
    }
}