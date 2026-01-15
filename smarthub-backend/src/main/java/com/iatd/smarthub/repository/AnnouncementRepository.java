// src/main/java/com/iatd/smarthub/repository/AnnouncementRepository.java
package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.announcement.Announcement;
import com.iatd.smarthub.model.announcement.AnnouncementType;
import com.iatd.smarthub.model.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    // Trouver les annonces par auteur
    List<Announcement> findByAuthor(User author);

    // Trouver les annonces par type
    List<Announcement> findByType(AnnouncementType type);

    // Trouver les annonces publiées
    List<Announcement> findByPublishedTrue();

    // Trouver les annonces par date (après une certaine date)
    List<Announcement> findByDateAfter(LocalDateTime date);

    // Trouver les annonces récentes (dernières 30 jours)
    @Query("SELECT a FROM Announcement a WHERE a.date >= :startDate AND a.published = true ORDER BY a.date DESC")
    List<Announcement> findRecentAnnouncements(@Param("startDate") LocalDateTime startDate);

    // Recherche d'annonces par titre ou contenu
    @Query("SELECT a FROM Announcement a WHERE a.published = true AND " +
            "(LOWER(a.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.content) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "ORDER BY a.date DESC")
    List<Announcement> searchPublishedAnnouncements(@Param("query") String query);

    // Trouver les annonces par type et statut de publication
    List<Announcement> findByTypeAndPublishedTrue(AnnouncementType type);
}