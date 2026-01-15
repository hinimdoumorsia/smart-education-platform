package com.iatd.smarthub.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * Requête pour générer dynamiquement un quiz selon un sujet, un nombre de questions
 * et des critères facultatifs (tags, difficultés, durée).
 */
@Getter
@Setter
public class QuizGenerationRequest {

    @NotBlank(message = "Le sujet du quiz est obligatoire")
    @Size(max = 255, message = "Le sujet ne peut pas dépasser 255 caractères")
    private String topic;

    @Size(max = 500, message = "La description ne peut pas dépasser 500 caractères")
    private String description;

    @NotNull(message = "Le nombre de questions est obligatoire")
    @Min(value = 1, message = "Au moins une question")
    @Max(value = 50, message = "Pas plus de 50 questions")
    private Integer questionCount;

    @Size(max = 10, message = "Pas plus de 10 tags")
    private List<@Size(max = 30, message = "Tag trop long") String> tags;

    @Size(max = 5, message = "Pas plus de 5 niveaux de difficulté")
    private List<@Size(max = 20, message = "Nom de difficulté trop long") String> difficulties;

    @Min(value = 1, message = "Durée minimale 1 minute")
    @Max(value = 240, message = "Durée maximale 240 minutes")
    private Integer timeLimitMinutes;

    public QuizGenerationRequest() {}

    public QuizGenerationRequest(String topic, Integer questionCount) {
        this.topic = topic;
        this.questionCount = questionCount;
    }
}
