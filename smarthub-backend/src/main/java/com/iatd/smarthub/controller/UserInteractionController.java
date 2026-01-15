package com.iatd.smarthub.controller;

import com.iatd.smarthub.model.interaction.UserInteraction;
import com.iatd.smarthub.service.UserInteractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/interactions")
@RequiredArgsConstructor
public class UserInteractionController {

    private final UserInteractionService userInteractionService;

    // === ENDPOINTS DE TRACKING ===
    
    @PostMapping("/track/view")
    public ResponseEntity<Void> trackView(
            @RequestParam Long userId,
            @RequestParam UserInteraction.ResourceType resourceType,
            @RequestParam Long resourceId) {
        userInteractionService.trackView(userId, resourceType, resourceId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/track/like")
    public ResponseEntity<Void> trackLike(
            @RequestParam Long userId,
            @RequestParam UserInteraction.ResourceType resourceType,
            @RequestParam Long resourceId) {
        userInteractionService.trackLike(userId, resourceType, resourceId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/track/bookmark")
    public ResponseEntity<Void> trackBookmark(
            @RequestParam Long userId,
            @RequestParam UserInteraction.ResourceType resourceType,
            @RequestParam Long resourceId) {
        userInteractionService.trackBookmark(userId, resourceType, resourceId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/track/complete")
    public ResponseEntity<Void> trackComplete(
            @RequestParam Long userId,
            @RequestParam UserInteraction.ResourceType resourceType,
            @RequestParam Long resourceId) {
        userInteractionService.trackComplete(userId, resourceType, resourceId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/track/enroll")
    public ResponseEntity<Void> trackEnroll(
            @RequestParam Long userId,
            @RequestParam UserInteraction.ResourceType resourceType,
            @RequestParam Long resourceId) {
        userInteractionService.trackEnroll(userId, resourceType, resourceId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/track/search")
    public ResponseEntity<Void> trackSearch(
            @RequestParam Long userId,
            @RequestParam String searchQuery,
            @RequestParam(required = false) Long resultResourceId,
            @RequestParam UserInteraction.ResourceType resourceType) {
        userInteractionService.trackSearch(userId, searchQuery, resultResourceId, resourceType);
        return ResponseEntity.ok().build();
    }

    // === ENDPOINTS DE RÉCUPÉRATION ===
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserInteraction>> getUserInteractions(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "30") int days) {
        List<UserInteraction> interactions = userInteractionService.getUserRecentInteractions(userId, days);
        return ResponseEntity.ok(interactions);
    }

    @GetMapping("/user/{userId}/recommendations/{resourceType}")
    public ResponseEntity<List<Long>> getRecommendedResources(
            @PathVariable Long userId,
            @PathVariable UserInteraction.ResourceType resourceType) {
        List<Long> recommendations = userInteractionService.getRecommendedResources(userId, resourceType);
        return ResponseEntity.ok(recommendations);
    }

    // === STATISTIQUES ===
    
    @GetMapping("/stats/user/{userId}")
    public ResponseEntity<Long> getUserInteractionStats(
            @PathVariable Long userId,
            @RequestParam UserInteraction.ResourceType resourceType,
            @RequestParam UserInteraction.InteractionType interactionType) {
        Long count = userInteractionService.getInteractionCount(userId, resourceType, interactionType);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/stats/resource")
    public ResponseEntity<Long> getResourcePopularity(
            @RequestParam UserInteraction.ResourceType resourceType,
            @RequestParam Long resourceId,
            @RequestParam UserInteraction.InteractionType interactionType) {
        Long count = userInteractionService.getResourcePopularity(resourceType, resourceId, interactionType);
        return ResponseEntity.ok(count);
    }
}
