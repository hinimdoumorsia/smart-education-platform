// src/main/java/com/iatd/smarthub/controller/AnnouncementController.java
package com.iatd.smarthub.controller;

import com.iatd.smarthub.dto.AnnouncementRequestDTO;
import com.iatd.smarthub.dto.AnnouncementResponseDTO;
import com.iatd.smarthub.model.announcement.AnnouncementType;
import com.iatd.smarthub.service.AnnouncementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;


import java.util.List;

@RestController
@RequestMapping("/api/v1/announcements")
@RequiredArgsConstructor
@Slf4j  // ← Ajouter cette annotation
public class AnnouncementController {

    private final AnnouncementService announcementService;

    
    @PostMapping
 // RETIRER @PreAuthorize
    public ResponseEntity<?> createAnnouncement(
            @Valid @RequestBody AnnouncementRequestDTO announcementRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            AnnouncementResponseDTO createdAnnouncement = announcementService.createAnnouncement(announcementRequest, userDetails.getUsername());
            return new ResponseEntity<>(createdAnnouncement, HttpStatus.CREATED);
        } catch (RuntimeException e) {
         // Cette exception inclut maintenant "Les étudiants ne sont pas autorisés à créer des annonces"
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("{\"error\": \"Accès refusé\", \"message\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            log.error("Unexpected error in createAnnouncement: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur interne du serveur");
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<List<AnnouncementResponseDTO>> getAllAnnouncements() {
        List<AnnouncementResponseDTO> announcements = announcementService.getAllAnnouncements();
        return ResponseEntity.ok(announcements);
    }

    @GetMapping("/published")
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<List<AnnouncementResponseDTO>> getPublishedAnnouncements() {
        List<AnnouncementResponseDTO> announcements = announcementService.getPublishedAnnouncements();
        return ResponseEntity.ok(announcements);
    }

    @GetMapping("/recent")
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<List<AnnouncementResponseDTO>> getRecentAnnouncements() {
        List<AnnouncementResponseDTO> announcements = announcementService.getRecentAnnouncements();
        return ResponseEntity.ok(announcements);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<AnnouncementResponseDTO> getAnnouncementById(@PathVariable Long id) {
        return announcementService.getAnnouncementById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/my-announcements")
    public ResponseEntity<?> getMyAnnouncements(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Vérification manuelle des rôles (comme pour createAnnouncement)
            UserDetails currentUser = userDetails;
            boolean hasRequiredRole = currentUser.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> 
                        grantedAuthority.getAuthority().equals("ROLE_TEACHER") || 
                        grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
            
            if (!hasRequiredRole) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Seuls les enseignants et administrateurs peuvent accéder à cette fonctionnalité\"}");
            }

            List<AnnouncementResponseDTO> announcements = announcementService.getAnnouncementsByAuthorUsername(userDetails.getUsername());
            return ResponseEntity.ok(announcements);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error in getMyAnnouncements: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur interne du serveur");
        }
    }

    @GetMapping("/author/{authorId}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<List<AnnouncementResponseDTO>> getAnnouncementsByAuthor(@PathVariable Long authorId) {
        try {
            List<AnnouncementResponseDTO> announcements = announcementService.getAnnouncementsByAuthor(authorId);
            return ResponseEntity.ok(announcements);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/type/{type}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<List<AnnouncementResponseDTO>> getAnnouncementsByType(@PathVariable AnnouncementType type) {
        List<AnnouncementResponseDTO> announcements = announcementService.getAnnouncementsByType(type);
        return ResponseEntity.ok(announcements);
    }

    @GetMapping("/type/{type}/published")
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<List<AnnouncementResponseDTO>> getAnnouncementsByTypeAndPublished(
            @PathVariable AnnouncementType type) {
        List<AnnouncementResponseDTO> announcements = announcementService.getAnnouncementsByTypeAndPublished(type);
        return ResponseEntity.ok(announcements);
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<List<AnnouncementResponseDTO>> searchAnnouncements(@RequestParam String query) {
        List<AnnouncementResponseDTO> announcements = announcementService.searchAnnouncements(query);
        return ResponseEntity.ok(announcements);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAnnouncement(
            @PathVariable Long id,
            @Valid @RequestBody AnnouncementRequestDTO announcementDetails,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            AnnouncementResponseDTO updatedAnnouncement = announcementService.updateAnnouncement(id, announcementDetails, userDetails.getUsername());
            return ResponseEntity.ok(updatedAnnouncement);
        } catch (RuntimeException e) {
            // ✅ Amélioration : Différencier "non trouvé" et "non autorisé"
            if (e.getMessage().contains("not found") || e.getMessage().contains("not found with id")) {
                return ResponseEntity.notFound().build();
            } else if (e.getMessage().contains("n'êtes pas l'auteur") || e.getMessage().contains("non autorisé")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"" + e.getMessage() + "\"}");
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Erreur\", \"message\": \"" + e.getMessage() + "\"}");
            }
        }
    }

    // Faites la même chose pour deleteAnnouncement et togglePublishStatus
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAnnouncement(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            announcementService.deleteAnnouncement(id, userDetails.getUsername());
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found") || e.getMessage().contains("not found with id")) {
                return ResponseEntity.notFound().build();
            } else if (e.getMessage().contains("n'êtes pas l'auteur") || e.getMessage().contains("non autorisé")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"" + e.getMessage() + "\"}");
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Erreur\", \"message\": \"" + e.getMessage() + "\"}");
            }
        }
    }
    
    @PatchMapping("/{id}/toggle-publish")
    public ResponseEntity<?> togglePublishStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            AnnouncementResponseDTO updatedAnnouncement = announcementService.togglePublishStatus(id, userDetails.getUsername());
            return ResponseEntity.ok(updatedAnnouncement);
        } catch (RuntimeException e) {
            // ✅ Gestion différenciée des erreurs
            if (e.getMessage().contains("not found") || e.getMessage().contains("not found with id")) {
                return ResponseEntity.notFound().build();
            } else if (e.getMessage().contains("n'êtes pas l'auteur") || e.getMessage().contains("non autorisé")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"" + e.getMessage() + "\"}");
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Erreur\", \"message\": \"" + e.getMessage() + "\"}");
            }
        }
    }
}