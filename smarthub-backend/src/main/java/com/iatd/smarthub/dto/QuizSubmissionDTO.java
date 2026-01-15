package com.iatd.smarthub.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.Map;

@Getter
@Setter
public class QuizSubmissionDTO {
    private Long quizId;
    private Long userId;
    private Map<Long, String> answers; // Clé = questionId, Valeur = réponse choisie

    public QuizSubmissionDTO() {
    }

    public QuizSubmissionDTO(Long quizId, Long userId, Map<Long, String> answers) {
        this.quizId = quizId;
        this.userId = userId;
        this.answers = answers;
    }
}

