package com.iatd.smarthub.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class QuizResponseDTO {

    private Long id;
    private String title;
    private String description;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<QuestionResponseDTO> questions = new ArrayList<>();

    // Constructeurs
    public QuizResponseDTO() {
    }

    public QuizResponseDTO(Long id, String title, String description, Boolean active,
            LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.active = active;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Méthodes utilitaires
    public void addQuestion(QuestionResponseDTO question) {
        this.questions.add(question);
    }
}