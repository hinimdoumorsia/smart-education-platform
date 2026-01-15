package com.iatd.smarthub.model.quiz;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
@Getter
@Setter
@ToString(exclude = "quiz") // Évite la récursion dans toString()
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QuestionType type;

    @ElementCollection
    @CollectionTable(name = "question_options", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "option_text", length = 500)
    private List<String> options = new ArrayList<>();

    @Column(name = "correct_answer", nullable = false, length = 1000)
    private String correctAnswer;

    // ✅ RELATION BIDIRECTIONNELLE AVEC QUIZ
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    @JsonBackReference // Évite la sérialisation circulaire
    private Quiz quiz;

    // === CONSTRUCTEURS ===
    public Question() {
    }

    public Question(String text, QuestionType type, String correctAnswer, Quiz quiz) {
        this.text = text;
        this.type = type;
        this.correctAnswer = correctAnswer;
        this.quiz = quiz;
    }

    // AJOUTEZ CE CONSTRUCTEUR POUR CORRIGER L'ERREUR
    public Question(Long id, String text, QuestionType type, String correctAnswer, Quiz quiz) {
        this.id = id;
        this.text = text;
        this.type = type;
        this.correctAnswer = correctAnswer;
        this.quiz = quiz;
    }

    // === MÉTHODES UTILITAIRES ===
    public void addOption(String option) {
        this.options.add(option);
    }

    public void removeOption(String option) {
        this.options.remove(option);
    }
}