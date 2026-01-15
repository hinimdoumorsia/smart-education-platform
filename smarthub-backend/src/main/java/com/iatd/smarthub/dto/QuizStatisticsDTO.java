package com.iatd.smarthub.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuizStatisticsDTO {
    private Long quizId;
    private String quizTitle;
    private Double averageScore;
    private Double maxScore;
    private Long totalAttempts;
    private Integer questionCount;
    private Long completedAttempts;
    private Long inProgressAttempts;

    public QuizStatisticsDTO() {
    }

    public QuizStatisticsDTO(Long quizId, String quizTitle, Double averageScore, Double maxScore,
            Long totalAttempts, Integer questionCount, Long completedAttempts, Long inProgressAttempts) {
        this.quizId = quizId;
        this.quizTitle = quizTitle;
        this.averageScore = averageScore;
        this.maxScore = maxScore;
        this.totalAttempts = totalAttempts;
        this.questionCount = questionCount;
        this.completedAttempts = completedAttempts;
        this.inProgressAttempts = inProgressAttempts;
    }
}