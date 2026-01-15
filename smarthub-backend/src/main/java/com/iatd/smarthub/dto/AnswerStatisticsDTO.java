package com.iatd.smarthub.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AnswerStatisticsDTO {
    private Long questionId;
    private String questionText;
    private Long totalAnswers;
    private Long correctAnswers;
    private Long incorrectAnswers;
    private Double correctPercentage;

    public AnswerStatisticsDTO() {
    }

    public AnswerStatisticsDTO(Long questionId, String questionText, Long totalAnswers,
            Long correctAnswers, Long incorrectAnswers, Double correctPercentage) {
        this.questionId = questionId;
        this.questionText = questionText;
        this.totalAnswers = totalAnswers;
        this.correctAnswers = correctAnswers;
        this.incorrectAnswers = incorrectAnswers;
        this.correctPercentage = correctPercentage;
    }
}