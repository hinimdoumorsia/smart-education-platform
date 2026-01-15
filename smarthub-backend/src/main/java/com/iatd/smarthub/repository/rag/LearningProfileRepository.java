package com.iatd.smarthub.repository.rag;

import com.iatd.smarthub.model.rag.LearningProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.*;

@Repository
public interface LearningProfileRepository extends JpaRepository<LearningProfile, Long> {
    
    // Trouver le profil par ID utilisateur
    @Query("SELECT lp FROM LearningProfile lp WHERE lp.user.id = :userId")
    Optional<LearningProfile> findByUserId(@Param("userId") Long userId);
    
    // Vérifier si un profil existe pour un utilisateur
    @Query("SELECT COUNT(lp) > 0 FROM LearningProfile lp WHERE lp.user.id = :userId")
    boolean existsByUserId(@Param("userId") Long userId);
    
    // Trouver les profils par niveau de compétence
    @Query("SELECT lp FROM LearningProfile lp WHERE lp.proficiencyLevel = :level")
    List<LearningProfile> findByProficiencyLevel(@Param("level") String level);
}
