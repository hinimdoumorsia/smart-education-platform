package com.iatd.smarthub.model.quiz;

import com.iatd.smarthub.model.course.Course;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Entity
@Table(name = "quizzes")
@Getter
@Setter
@ToString(exclude = "questions") // Évite la récursion dans toString()
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    // ✅ RELATION BIDIRECTIONNELLE AVEC QUESTIONS
    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference // Évite la sérialisation circulaire
    private List<Question> questions = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(nullable = false)
    private Boolean active = true;

    // === CONSTRUCTEURS ===
    public Quiz() {
    }

    public Quiz(String title, String description) {
        this.title = title;
        this.description = description;
    }

    // === MÉTHODES UTILITAIRES POUR GÉRER LA BIDIRECTIONNALITÉ ===

    /**
     * Ajoute une question en maintenant la cohérence bidirectionnelle
     */
    public void addQuestion(Question question) {
        questions.add(question);
        question.setQuiz(this); // Maintient la cohérence
    }

    /**
     * Supprime une question en maintenant la cohérence bidirectionnelle
     */
    public void removeQuestion(Question question) {
        questions.remove(question);
        question.setQuiz(null); // Maintient la cohérence
    }

    /**
     * Ajoute une liste de questions en maintenant la cohérence
     */
    public void addQuestions(List<Question> questionsToAdd) {
        questionsToAdd.forEach(this::addQuestion);
    }

    /**
     * Supprime toutes les questions en maintenant la cohérence
     */
    public void clearQuestions() {
        // Crée une copie pour éviter ConcurrentModificationException
        new ArrayList<>(questions).forEach(this::removeQuestion);
    }
    
 // Relation optionnelle avec Course (comme prévu dans le CDC)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;  // ← AJOUTER CETTE RELATION
}