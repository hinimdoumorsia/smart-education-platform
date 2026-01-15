package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.quiz.QuizAttempt.AttemptStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class QuizAttemptResponseDTO {

    private Long id;
    private Long studentId;
    private String studentName;
    private Long quizId;
    private String quizTitle;
    private Double score;
    private LocalDateTime attemptedAt;
    private LocalDateTime completedAt;
    private AttemptStatus status;
    private List<AnswerResponseDTO> answers = new ArrayList<>();

    // Constructeurs
    public QuizAttemptResponseDTO() {
    }

    public QuizAttemptResponseDTO(Long id, Long studentId, String studentName, Long quizId,
            String quizTitle, Double score, AttemptStatus status) {
        this.id = id;
        this.studentId = studentId;
        this.studentName = studentName;
        this.quizId = quizId;
        this.quizTitle = quizTitle;
        this.score = score;
        this.status = status;
    }

    // Méthodes utilitaires
    public void addAnswer(AnswerResponseDTO answer) {
        this.answers.add(answer);
    }

    // Méthode pour calculer le score automatiquement
    public void calculateAndSetScore() {
        if (answers == null || answers.isEmpty()) {
            this.score = 0.0;
            return;
        }

        long correctAnswers = answers.stream()
                .filter(answer -> Boolean.TRUE.equals(answer.getIsCorrect()))
                .count();

        this.score = (double) correctAnswers / answers.size() * 100;
    }
}