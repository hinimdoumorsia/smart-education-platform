package com.iatd.smarthub.model.rag;

import com.iatd.smarthub.model.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "learning_profiles")
@Getter
@Setter
public class LearningProfile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @ElementCollection
    @CollectionTable(name = "user_interests", joinColumns = @JoinColumn(name = "learning_profile_id"))
    @Column(name = "interest")
    private List<String> interests = new ArrayList<>();
    
    @ElementCollection
    @CollectionTable(name = "user_weaknesses", joinColumns = @JoinColumn(name = "learning_profile_id"))
    @Column(name = "weakness")
    private List<String> weaknesses = new ArrayList<>();
    
    @Column(name = "learning_style")
    private String learningStyle = "READING_WRITING"; // "VISUAL", "AUDITORY", "READING_WRITING", "KINESTHETIC"
    
    @Column(name = "proficiency_level")
    private String proficiencyLevel = "INTERMEDIATE"; // "BEGINNER", "INTERMEDIATE", "ADVANCED"
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructeurs
    public LearningProfile() {}
    
    public LearningProfile(User user) {
        this.user = user;
        this.interests = new ArrayList<>();
        this.weaknesses = new ArrayList<>();
    }
    
    // Méthodes utilitaires
    public void addInterest(String interest) {
        if (!this.interests.contains(interest)) {
            this.interests.add(interest);
        }
    }
    
    public void addWeakness(String weakness) {
        if (!this.weaknesses.contains(weakness)) {
            this.weaknesses.add(weakness);
        }
    }
}