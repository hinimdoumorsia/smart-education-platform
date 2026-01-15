package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.quiz.QuestionType;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class QuestionResponseDTO {

    private Long id;
    private String text;
    private QuestionType type;
    private List<String> options = new ArrayList<>();
    private String correctAnswer;
    private Long quizId;
    private String explanation;  // AJOUTÉ ICI

    // Constructeurs
    public QuestionResponseDTO() {
    }

    public QuestionResponseDTO(Long id, String text, QuestionType type, List<String> options,
            String correctAnswer, Long quizId, String explanation) {
        this.id = id;
        this.text = text;
        this.type = type;
        this.options = options != null ? new ArrayList<>(options) : new ArrayList<>();
        this.correctAnswer = correctAnswer;
        this.quizId = quizId;
        this.explanation = explanation;
    }
    
    // Méthodes utilitaires
    public void addOption(String option) {
        if (this.options == null) {
            this.options = new ArrayList<>();
        }
        this.options.add(option);
    }
    
    public void addAllOptions(List<String> options) {
        if (this.options == null) {
            this.options = new ArrayList<>();
        }
        this.options.addAll(options);
    }
}