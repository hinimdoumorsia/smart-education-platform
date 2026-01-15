package com.iatd.smarthub.model.rag;

import com.iatd.smarthub.model.quiz.Quiz;
import com.iatd.smarthub.model.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_recommendations")
@Getter
@Setter
public class QuizRecommendation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;
    
    @Column(name = "recommended_topic", length = 255)
    private String recommendedTopic;
    
    @Column(columnDefinition = "TEXT")
    private String reason;
    
    @Column(name = "confidence_score")
    private Double confidenceScore = 0.0;
    
    @Column(name = "recommended_at")
    private LocalDateTime recommendedAt;
    
    private Boolean accepted = false;
    
    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    // Constructeurs
    public QuizRecommendation() {}
    
    public QuizRecommendation(User user, String recommendedTopic, String reason) {
        this.user = user;
        this.recommendedTopic = recommendedTopic;
        this.reason = reason;
        this.recommendedAt = LocalDateTime.now();
    }
}
