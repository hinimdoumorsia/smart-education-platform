// Ajoutez ces champs à votre QuizAttempt.java existant
package com.iatd.smarthub.model.quiz;

import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.model.course.Course; // <-- IMPORTANT
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
@Table(name = "quiz_attempts")
@Getter
@Setter
@ToString(exclude = { "student", "quiz", "answers" })
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;
    
    // ✅ NOUVEAU : Relation avec Course
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "quizAttempt", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Answer> answers = new ArrayList<>();
    
    @Column(name = "score")
    private Double score;

    @CreationTimestamp
    @Column(name = "attempted_at", updatable = false)
    private LocalDateTime attemptedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttemptStatus status = AttemptStatus.IN_PROGRESS;
    
    // ✅ NOUVEAU : Champs pour la supervision
    @Column(name = "time_limit_minutes")
    private Integer timeLimitMinutes;
    
    @Column(name = "time_spent_seconds")
    private Integer timeSpentSeconds;
    
    @Column(name = "max_attempts")
    private Integer maxAttempts;
    
    @Column(name = "current_attempt_number")
    private Integer currentAttemptNumber;
    
    @Column(name = "answers_json", columnDefinition = "TEXT")
    private String answersJson; // Pour stocker les réponses en JSON

    // === ENUM ÉTENDU ===
    public enum AttemptStatus {
        IN_PROGRESS,
        COMPLETED,
        ABANDONED,
        TIMEOUT // ✅ NOUVEAU
    }

    // === CONSTRUCTEURS ===
    public QuizAttempt() {
    }

    public QuizAttempt(User student, Quiz quiz) {
        this.student = student;
        this.quiz = quiz;
    }
    
    public QuizAttempt(User student, Course course) {
        this.student = student;
        this.course = course;
        this.attemptedAt = LocalDateTime.now();
        this.status = AttemptStatus.IN_PROGRESS;
    }

    // === MÉTHODES UTILITAIRES ===
    public void addAnswer(Answer answer) {
        answers.add(answer);
        answer.setQuizAttempt(this);
    }

    public void removeAnswer(Answer answer) {
        answers.remove(answer);
        answer.setQuizAttempt(null);
    }

    public void completeAttempt() {
        this.status = AttemptStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
    }

    public void abandonAttempt() {
        this.status = AttemptStatus.ABANDONED;
        this.completedAt = LocalDateTime.now();
    }
    
    public void timeoutAttempt() {
        this.status = AttemptStatus.TIMEOUT;
        this.completedAt = LocalDateTime.now();
    }
    
    public void calculateScore() {
        if (this.answers == null || this.answers.isEmpty()) {
            this.score = 0.0;
            return;
        }
        
        long correctAnswers = this.answers.stream()
                .filter(answer -> Boolean.TRUE.equals(answer.getIsCorrect()))
                .count();
        
        this.score = (double) correctAnswers / this.answers.size() * 100;
    }
    
    // ✅ NOUVEAU : Méthode pour la supervision
    public boolean isTimedOut() {
        if (timeLimitMinutes == null || attemptedAt == null) {
            return false;
        }
        long elapsedMinutes = java.time.Duration.between(attemptedAt, LocalDateTime.now()).toMinutes();
        return elapsedMinutes > timeLimitMinutes;
    }
}