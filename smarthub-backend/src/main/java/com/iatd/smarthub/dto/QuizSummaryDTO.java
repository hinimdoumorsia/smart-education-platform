package com.iatd.smarthub.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class QuizSummaryDTO {

    private Long id;
    private String title;
    private String description;
    private Boolean active;
    private LocalDateTime createdAt;
    private Integer questionCount = 0; // Initialisé à 0

    // Constructeurs
    public QuizSummaryDTO() {
    }

    public QuizSummaryDTO(Long id, String title, String description, Boolean active,
            LocalDateTime createdAt, Integer questionCount) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.active = active;
        this.createdAt = createdAt;
        this.questionCount = questionCount != null ? questionCount : 0;
    }
}