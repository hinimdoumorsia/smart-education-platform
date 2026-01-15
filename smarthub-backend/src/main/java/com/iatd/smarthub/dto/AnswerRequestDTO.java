package com.iatd.smarthub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AnswerRequestDTO {

    @NotNull(message = "L'ID de la question est obligatoire")
    private Long questionId;

    @NotBlank(message = "La réponse est obligatoire")
    @Size(max = 1000, message = "La réponse ne peut pas dépasser 1000 caractères")
    private String answerText;

    // Constructeurs
    public AnswerRequestDTO() {}

    public AnswerRequestDTO(Long questionId, String answerText) {
        this.questionId = questionId;
        this.answerText = answerText;
    }
}