package com.iatd.smarthub.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class QuizAttemptRequestDTO {

    @NotNull(message = "L'ID du quiz est obligatoire")
    private Long quizId;

    @Valid
    @Size(min = 1, message = "Au moins une réponse est requise")
    private List<AnswerRequestDTO> answers = new ArrayList<>();

    // Constructeurs
    public QuizAttemptRequestDTO() {
    }

    public QuizAttemptRequestDTO(Long quizId) {
        this.quizId = quizId;
    }

    // Méthodes utilitaires
    public void addAnswer(AnswerRequestDTO answer) {
        this.answers.add(answer);
    }

    public void removeAnswer(AnswerRequestDTO answer) {
        this.answers.remove(answer);
    }
}