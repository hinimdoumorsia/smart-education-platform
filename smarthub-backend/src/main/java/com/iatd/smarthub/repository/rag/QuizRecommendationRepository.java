package com.iatd.smarthub.repository.rag;

import com.iatd.smarthub.model.rag.QuizRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface QuizRecommendationRepository extends JpaRepository<QuizRecommendation, Long> {
    
    // Trouver les recommandations non acceptées pour un utilisateur
    @Query("SELECT qr FROM QuizRecommendation qr WHERE qr.user.id = :userId AND qr.accepted = false")
    List<QuizRecommendation> findPendingRecommendationsByUserId(@Param("userId") Long userId);
    
    // Trouver les recommandations acceptées
    @Query("SELECT qr FROM QuizRecommendation qr WHERE qr.user.id = :userId AND qr.accepted = true")
    List<QuizRecommendation> findAcceptedRecommendationsByUserId(@Param("userId") Long userId);
    
    // Compter les recommandations acceptées
    @Query("SELECT COUNT(qr) FROM QuizRecommendation qr WHERE qr.user.id = :userId AND qr.accepted = true")
    Long countAcceptedRecommendationsByUserId(@Param("userId") Long userId);
    
    // Trouver les recommandations récentes
    @Query("SELECT qr FROM QuizRecommendation qr WHERE qr.user.id = :userId AND qr.recommendedAt >= :since")
    List<QuizRecommendation> findRecentRecommendationsByUserId(
            @Param("userId") Long userId, 
            @Param("since") LocalDateTime since);
}
