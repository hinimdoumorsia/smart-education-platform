package com.iatd.smarthub.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AnswerResponseDTO {

    private Long id;
    private Long questionId;
    private String questionText;
    private String answerText;
    private Boolean isCorrect;
    private String correctAnswer;

    // Constructeurs
    public AnswerResponseDTO() {
    }

    public AnswerResponseDTO(Long id, Long questionId, String questionText,
            String answerText, Boolean isCorrect, String correctAnswer) {
        this.id = id;
        this.questionId = questionId;
        this.questionText = questionText;
        this.answerText = answerText;
        this.isCorrect = isCorrect;
        this.correctAnswer = correctAnswer;
    }
}