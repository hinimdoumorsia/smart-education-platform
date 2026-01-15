package com.iatd.smarthub.service;

import com.iatd.smarthub.model.interaction.UserInteraction;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.UserInteractionRepository;
import com.iatd.smarthub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class UserInteractionService {

    private final UserInteractionRepository userInteractionRepository;
    private final UserRepository userRepository;

    // === MÉTHODES DE TRACKING SIMPLES ===
    
    public void trackView(Long userId, UserInteraction.ResourceType resourceType, Long resourceId) {
        trackInteraction(userId, resourceType, resourceId, UserInteraction.InteractionType.VIEW);
    }

    public void trackViewDetails(Long userId, UserInteraction.ResourceType resourceType, Long resourceId) {
        trackInteraction(userId, resourceType, resourceId, UserInteraction.InteractionType.VIEW_DETAILS);
    }

    public void trackLike(Long userId, UserInteraction.ResourceType resourceType, Long resourceId) {
        trackInteraction(userId, resourceType, resourceId, UserInteraction.InteractionType.LIKE);
    }

    public void trackBookmark(Long userId, UserInteraction.ResourceType resourceType, Long resourceId) {
        trackInteraction(userId, resourceType, resourceId, UserInteraction.InteractionType.BOOKMARK);
    }

    public void trackComplete(Long userId, UserInteraction.ResourceType resourceType, Long resourceId) {
        trackInteraction(userId, resourceType, resourceId, UserInteraction.InteractionType.COMPLETE);
    }

    public void trackEnroll(Long userId, UserInteraction.ResourceType resourceType, Long resourceId) {
        trackInteraction(userId, resourceType, resourceId, UserInteraction.InteractionType.ENROLL);
    }

    public void trackSearch(Long userId, String searchQuery, Long resultResourceId, UserInteraction.ResourceType resourceType) {
        UserInteraction interaction = createInteraction(userId, resourceType, resultResourceId, UserInteraction.InteractionType.SEARCH);
        interaction.setSearchQuery(searchQuery);
        userInteractionRepository.save(interaction);
        log.debug("Tracked search interaction: user={}, query={}, resource={}", userId, searchQuery, resultResourceId);
    }

    // === MÉTHODE GÉNÉRIQUE ===
    
    public void trackInteraction(Long userId, UserInteraction.ResourceType resourceType, Long resourceId, UserInteraction.InteractionType interactionType) {
        UserInteraction interaction = createInteraction(userId, resourceType, resourceId, interactionType);
        userInteractionRepository.save(interaction);
        log.debug("Tracked interaction: user={}, type={}, resource={}, action={}", 
                 userId, resourceType, resourceId, interactionType);
    }

    private UserInteraction createInteraction(Long userId, UserInteraction.ResourceType resourceType, Long resourceId, UserInteraction.InteractionType interactionType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        UserInteraction interaction = new UserInteraction();
        interaction.setUser(user);
        interaction.setResourceType(resourceType);
        interaction.setResourceId(resourceId);
        interaction.setInteractionType(interactionType);
        
        return interaction;
    }

    // === MÉTHODES DE RÉCUPÉRATION ===
    
    @Transactional(readOnly = true)
    public List<UserInteraction> getUserRecentInteractions(Long userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return userInteractionRepository.findRecentInteractionsByUser(userId, since);
    }

    @Transactional(readOnly = true)
    public List<UserInteraction> getUserInteractionsByType(Long userId, UserInteraction.ResourceType resourceType, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return userInteractionRepository.findRecentInteractionsByUserAndResourceType(userId, resourceType, since);
    }

    // === MÉTHODES POUR LES RECOMMANDATIONS ===
    
    @Transactional(readOnly = true)
    public List<Long> getRecommendedResources(Long userId, UserInteraction.ResourceType resourceType) {
        LocalDateTime since = LocalDateTime.now().minusMonths(1);
        
        // 1. Trouver des utilisateurs similaires
        List<Long> similarUsers = userInteractionRepository.findSimilarUsers(userId, since);
        
        // 2. Récupérer les ressources populaires parmi les utilisateurs similaires
        List<UserInteraction.InteractionType> positiveInteractions = List.of(
            UserInteraction.InteractionType.LIKE,
            UserInteraction.InteractionType.BOOKMARK,
            UserInteraction.InteractionType.COMPLETE,
            UserInteraction.InteractionType.VIEW_DETAILS
        );
        
        List<Object[]> popularResources = userInteractionRepository.findPopularResources(
            resourceType, positiveInteractions, since);
        
        // 3. Filtrer les ressources que l'utilisateur a déjà interagi
        List<Long> userInteractedResources = getUserInteractionsByType(userId, resourceType, 30)
                .stream()
                .map(UserInteraction::getResourceId)
                .collect(Collectors.toList());
        
        return popularResources.stream()
                .map(obj -> (Long) obj[0])
                .filter(resourceId -> !userInteractedResources.contains(resourceId))
                .limit(10)
                .collect(Collectors.toList());
    }

    // === STATISTIQUES ===
    
    @Transactional(readOnly = true)
    public Long getInteractionCount(Long userId, UserInteraction.ResourceType resourceType, UserInteraction.InteractionType interactionType) {
        return userInteractionRepository.countByUser_IdAndResourceTypeAndInteractionType(userId, resourceType, interactionType);
    }

    @Transactional(readOnly = true)
    public Long getResourcePopularity(UserInteraction.ResourceType resourceType, Long resourceId, UserInteraction.InteractionType interactionType) {
        return userInteractionRepository.countByResourceTypeAndResourceIdAndInteractionType(resourceType, resourceId, interactionType);
    }

    // === ANALYSE COMPORTEMENTALE ===
    
    @Transactional(readOnly = true)
    public List<Object[]> getUserBehaviorPatterns(Long userId) {
        LocalDateTime since = LocalDateTime.now().minusMonths(3);
        return userInteractionRepository.getUserInteractionPatterns(userId, since);
    }
}
