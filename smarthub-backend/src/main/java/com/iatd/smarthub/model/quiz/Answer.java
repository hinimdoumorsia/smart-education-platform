package com.iatd.smarthub.model.quiz;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "answers")
@Getter
@Setter
@ToString(exclude = { "question", "quizAttempt" })
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_attempt_id", nullable = false)
    private QuizAttempt quizAttempt;

    @Column(name = "answer_text", nullable = false, columnDefinition = "TEXT")
    private String answerText;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    // === CONSTRUCTEURS ===
    public Answer() {
    }

    public Answer(Question question, QuizAttempt quizAttempt, String answerText) {
        this.question = question;
        this.quizAttempt = quizAttempt;
        this.answerText = answerText;
    }

    // === MÉTHODE UTILITAIRE ===
    public void validateAnswer() {
        if (question != null && question.getCorrectAnswer() != null) {
            this.isCorrect = question.getCorrectAnswer().equals(this.answerText);
        }
    }
}