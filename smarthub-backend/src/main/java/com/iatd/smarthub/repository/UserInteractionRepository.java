package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.interaction.UserInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserInteractionRepository extends JpaRepository<UserInteraction, Long> {

    // ========= BASE =========

    List<UserInteraction> findByUser_IdOrderByInteractedAtDesc(Long userId);

    List<UserInteraction> findByUser_IdAndInteractionTypeIn(
            Long userId,
            List<UserInteraction.InteractionType> types
    );

    long countByUser_Id(Long userId);

    boolean existsByUser_IdAndResourceId(Long userId, Long resourceId);

    // ========= RÉCENT =========

    @Query("""
        SELECT ui FROM UserInteraction ui
        WHERE ui.user.id = :userId
          AND ui.interactedAt >= :since
        ORDER BY ui.interactedAt DESC
    """)
    List<UserInteraction> findRecentInteractionsByUser(
            @Param("userId") Long userId,
            @Param("since") LocalDateTime since
    );

    @Query("""
        SELECT ui FROM UserInteraction ui
        WHERE ui.user.id = :userId
          AND ui.resourceType = :resourceType
          AND ui.interactedAt >= :since
    """)
    List<UserInteraction> findRecentInteractionsByUserAndResourceType(
            @Param("userId") Long userId,
            @Param("resourceType") UserInteraction.ResourceType resourceType,
            @Param("since") LocalDateTime since
    );

    // ========= SIMILARITÉ UTILISATEURS =========
    // VERSION CORRIGÉE - JPQL au lieu de SQL natif

    @Query("""
        SELECT DISTINCT ui2.user.id
        FROM UserInteraction ui1
        JOIN UserInteraction ui2 ON ui1.resourceId = ui2.resourceId
        WHERE ui1.user.id = :userId
          AND ui2.user.id != :userId
          AND ui1.interactedAt >= :since
    """)
    List<Long> findSimilarUsers(
            @Param("userId") Long userId,
            @Param("since") LocalDateTime since
    );

    // ========= POPULARITÉ =========

    @Query("""
        SELECT ui.resourceId, COUNT(ui.id)
        FROM UserInteraction ui
        WHERE ui.resourceType = :resourceType
          AND ui.interactionType IN :interactionTypes
          AND ui.interactedAt >= :since
        GROUP BY ui.resourceId
        ORDER BY COUNT(ui.id) DESC
    """)
    List<Object[]> findPopularResources(
            @Param("resourceType") UserInteraction.ResourceType resourceType,
            @Param("interactionTypes") List<UserInteraction.InteractionType> interactionTypes,
            @Param("since") LocalDateTime since
    );

    // ========= STATISTIQUES =========

    long countByUser_IdAndResourceTypeAndInteractionType(
            Long userId,
            UserInteraction.ResourceType resourceType,
            UserInteraction.InteractionType interactionType
    );

    long countByResourceTypeAndResourceIdAndInteractionType(
            UserInteraction.ResourceType resourceType,
            Long resourceId,
            UserInteraction.InteractionType interactionType
    );

    // ========= ANALYSE =========

    @Query("""
        SELECT ui.resourceType, ui.interactionType, COUNT(ui.id)
        FROM UserInteraction ui
        WHERE ui.user.id = :userId
          AND ui.interactedAt >= :since
        GROUP BY ui.resourceType, ui.interactionType
    """)
    List<Object[]> getUserInteractionPatterns(
            @Param("userId") Long userId,
            @Param("since") LocalDateTime since
    );

    // ========= MÉTHODES UTILES SUPPLEMENTAIRES =========

    List<UserInteraction> findByResourceTypeAndResourceId(
            UserInteraction.ResourceType resourceType,
            Long resourceId
    );

    List<UserInteraction> findByUser_IdAndResourceTypeAndResourceId(
            Long userId,
            UserInteraction.ResourceType resourceType,
            Long resourceId
    );
}