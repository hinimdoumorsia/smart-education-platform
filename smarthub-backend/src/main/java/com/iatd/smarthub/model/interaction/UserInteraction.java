package com.iatd.smarthub.model.interaction;

import com.iatd.smarthub.model.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_interactions",
       indexes = {
           @Index(name = "idx_user_interactions_user", columnList = "user_id"),
           @Index(name = "idx_user_interactions_resource", columnList = "resource_type,resource_id"),
           @Index(name = "idx_user_interactions_timestamp", columnList = "interacted_at")
       })
@Getter
@Setter
public class UserInteraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", nullable = false, length = 50)
    private ResourceType resourceType;

    @Column(name = "resource_id", nullable = false)
    private Long resourceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "interaction_type", nullable = false, length = 50)
    private InteractionType interactionType;

    @CreationTimestamp
    @Column(name = "interacted_at", nullable = false, updatable = false)
    private LocalDateTime interactedAt;

    // Champs supplémentaires pour le contexte
    @Column(name = "duration_seconds")
    private Integer durationSeconds; // Durée de consultation en secondes

    @Column(name = "search_query")
    private String searchQuery; // Pour les interactions de recherche

    // === ENUMS ===
    
    public enum ResourceType {
        COURSE,
        PROJECT, 
        INTERNSHIP,
        RESOURCE,
        QUIZ,
        ANNOUNCEMENT,
        USER  // Pour les interactions entre utilisateurs
    }

    public enum InteractionType {
        // Consutation
        VIEW,
        VIEW_DETAILS,
        
        // Engagement
        LIKE,
        DISLIKE,
        BOOKMARK,
        SHARE,
        COMMENT,
        RATE,
        
        // Actions
        ENROLL,
        COMPLETE,
        SUBMIT,
        DOWNLOAD,
        UPLOAD,
        
        // Recherche
        SEARCH,
        CLICK_SEARCH_RESULT,
        
        // Social
        FOLLOW,
        MESSAGE
    }

    // === CONSTRUCTEURS ===
    
    public UserInteraction() {}

    public UserInteraction(User user, ResourceType resourceType, Long resourceId, InteractionType interactionType) {
        this.user = user;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.interactionType = interactionType;
    }

    public UserInteraction(User user, ResourceType resourceType, Long resourceId, InteractionType interactionType, String searchQuery) {
        this.user = user;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.interactionType = interactionType;
        this.searchQuery = searchQuery;
    }
}