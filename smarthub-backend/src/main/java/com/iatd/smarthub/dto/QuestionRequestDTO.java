package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.quiz.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class QuestionRequestDTO {

    @NotBlank(message = "Le texte de la question est obligatoire")
    @Size(max = 2000, message = "Le texte de la question ne peut pas dépasser 2000 caractères")
    private String text;

    @NotNull(message = "Le type de question est obligatoire")
    private QuestionType type;

    @Size(max = 10, message = "Une question ne peut pas avoir plus de 10 options")
    private List<@NotBlank String> options = new ArrayList<>();

    @NotBlank(message = "La réponse correcte est obligatoire")
    @Size(max = 1000, message = "La réponse correcte ne peut pas dépasser 1000 caractères")
    private String correctAnswer;

    // Constructeurs
    public QuestionRequestDTO() {
    }

    public QuestionRequestDTO(String text, QuestionType type, String correctAnswer) {
        this.text = text;
        this.type = type;
        this.correctAnswer = correctAnswer;
    }
}