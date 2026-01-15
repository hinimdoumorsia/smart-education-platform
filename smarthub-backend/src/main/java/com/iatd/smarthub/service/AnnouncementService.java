// src/main/java/com/iatd/smarthub/service/AnnouncementService.java
package com.iatd.smarthub.service;

import com.iatd.smarthub.dto.AnnouncementRequestDTO;
import com.iatd.smarthub.dto.AnnouncementResponseDTO;
import com.iatd.smarthub.model.announcement.Announcement;
import com.iatd.smarthub.model.announcement.AnnouncementType;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.AnnouncementRepository;
import com.iatd.smarthub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;

    // ✅ MODIFIÉ : Ajout du paramètre username pour l'auteur connecté + VÉRIFICATION DE SÉCURITÉ
    public AnnouncementResponseDTO createAnnouncement(AnnouncementRequestDTO announcementRequest, String username) {
        log.info("Creating new announcement: {}", announcementRequest.getTitle());

        // ✅ Récupérer l'utilisateur connecté comme auteur
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));

        // ✅ VÉRIFICATION DE SÉCURITÉ : Empêcher les STUDENT de créer des annonces
        if (author.getRole() == User.Role.STUDENT) {
            throw new RuntimeException("Les étudiants ne sont pas autorisés à créer des annonces");
        }

        Announcement announcement = new Announcement();
        announcement.setTitle(announcementRequest.getTitle());
        announcement.setContent(announcementRequest.getContent());
        announcement.setType(announcementRequest.getType());
        announcement.setDate(announcementRequest.getDate());
        announcement.setAuthor(author);
        announcement.setPublished(announcementRequest.getPublished() != null ? announcementRequest.getPublished() : true);

        Announcement savedAnnouncement = announcementRepository.save(announcement);
        return new AnnouncementResponseDTO(savedAnnouncement);
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponseDTO> getAllAnnouncements() {
        log.debug("Fetching all announcements");
        return announcementRepository.findAll()
                .stream()
                .map(AnnouncementResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<AnnouncementResponseDTO> getAnnouncementById(Long id) {
        log.debug("Fetching announcement by id: {}", id);
        return announcementRepository.findById(id)
                .map(AnnouncementResponseDTO::new);
    }

    // ✅ NOUVEAU : Récupérer les annonces par username de l'auteur
    @Transactional(readOnly = true)
    public List<AnnouncementResponseDTO> getAnnouncementsByAuthorUsername(String username) {
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));

        return announcementRepository.findByAuthor(author)
                .stream()
                .map(AnnouncementResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponseDTO> getAnnouncementsByAuthor(Long authorId) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("Author not found with id: " + authorId));

        return announcementRepository.findByAuthor(author)
                .stream()
                .map(AnnouncementResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponseDTO> getAnnouncementsByType(AnnouncementType type) {
        return announcementRepository.findByType(type)
                .stream()
                .map(AnnouncementResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponseDTO> getPublishedAnnouncements() {
        return announcementRepository.findByPublishedTrue()
                .stream()
                .map(AnnouncementResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponseDTO> getRecentAnnouncements() {
        LocalDateTime startDate = LocalDateTime.now().minusDays(30);
        return announcementRepository.findRecentAnnouncements(startDate)
                .stream()
                .map(AnnouncementResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponseDTO> getAnnouncementsByTypeAndPublished(AnnouncementType type) {
        return announcementRepository.findByTypeAndPublishedTrue(type)
                .stream()
                .map(AnnouncementResponseDTO::new)
                .collect(Collectors.toList());
    }

    // ✅ MODIFIÉ : Ajout de la vérification de propriété
    public AnnouncementResponseDTO updateAnnouncement(Long id, AnnouncementRequestDTO announcementDetails, String username) {
        log.info("Updating announcement with id: {}", id);

        Announcement existingAnnouncement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found with id: " + id));

        // ✅ Vérifier que l'utilisateur est l'auteur de l'annonce ou admin
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
        
        if (!existingAnnouncement.getAuthor().getId().equals(currentUser.getId()) && currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Vous n'êtes pas l'auteur de cette annonce");
        }

        existingAnnouncement.setTitle(announcementDetails.getTitle());
        existingAnnouncement.setContent(announcementDetails.getContent());
        existingAnnouncement.setType(announcementDetails.getType());
        existingAnnouncement.setDate(announcementDetails.getDate());
        existingAnnouncement.setPublished(announcementDetails.getPublished());

        Announcement updatedAnnouncement = announcementRepository.save(existingAnnouncement);
        return new AnnouncementResponseDTO(updatedAnnouncement);
    }

    // ✅ MODIFIÉ : Ajout de la vérification de propriété
    public void deleteAnnouncement(Long id, String username) {
        log.info("Deleting announcement with id: {}", id);

        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found with id: " + id));

        // ✅ Vérifier que l'utilisateur est l'auteur de l'annonce ou admin
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
        
        if (!announcement.getAuthor().getId().equals(currentUser.getId()) && currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Vous n'êtes pas l'auteur de cette annonce");
        }

        announcementRepository.delete(announcement);
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponseDTO> searchAnnouncements(String query) {
        return announcementRepository.searchPublishedAnnouncements(query)
                .stream()
                .map(AnnouncementResponseDTO::new)
                .collect(Collectors.toList());
    }

    // ✅ MODIFIÉ : Ajout de la vérification de propriété
    public AnnouncementResponseDTO togglePublishStatus(Long id, String username) {
        log.info("Toggling publish status for announcement with id: {}", id);

        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found with id: " + id));

        // ✅ Vérifier que l'utilisateur est l'auteur de l'annonce ou admin
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
        
        if (!announcement.getAuthor().getId().equals(currentUser.getId()) && currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Vous n'êtes pas l'auteur de cette annonce");
        }

        announcement.setPublished(!announcement.getPublished());
        Announcement updatedAnnouncement = announcementRepository.save(announcement);

        return new AnnouncementResponseDTO(updatedAnnouncement);
    }
}
