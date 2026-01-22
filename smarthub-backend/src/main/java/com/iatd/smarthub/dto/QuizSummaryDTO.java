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
    private Long questionCount = 0L; // Changé de Integer à Long

    // Constructeurs
    public QuizSummaryDTO() {
    }

    // Constructeur modifié : dernier paramètre changé de Integer à Long
    public QuizSummaryDTO(Long id, String title, String description, Boolean active,
            LocalDateTime createdAt, Long questionCount) { // Long au lieu de Integer
        this.id = id;
        this.title = title;
        this.description = description;
        this.active = active;
        this.createdAt = createdAt;
        this.questionCount = questionCount != null ? questionCount : 0L;
    }
}
