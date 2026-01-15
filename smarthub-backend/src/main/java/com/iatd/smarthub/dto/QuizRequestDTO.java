package com.iatd.smarthub.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class QuizRequestDTO {

    @NotBlank(message = "Le titre du quiz est obligatoire")
    @Size(max = 255, message = "Le titre ne peut pas dépasser 255 caractères")
    private String title;

    @Size(max = 1000, message = "La description ne peut pas dépasser 1000 caractères")
    private String description;

    @NotNull(message = "Le statut actif est obligatoire")
    private Boolean active = true;

    @Valid
    @Size(max = 50, message = "Un quiz ne peut pas contenir plus de 50 questions")
    private List<QuestionRequestDTO> questions = new ArrayList<>();

    // Constructeurs
    public QuizRequestDTO() {
    }

    public QuizRequestDTO(String title, String description) {
        this.title = title;
        this.description = description;
    }

    // Méthodes utilitaires
    public void addQuestion(QuestionRequestDTO question) {
        this.questions.add(question);
    }

    public void removeQuestion(QuestionRequestDTO question) {
        this.questions.remove(question);
    }
}