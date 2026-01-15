// src/main/java/com/iatd/smarthub/dto/AnnouncementResponseDTO.java
package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.announcement.Announcement;
import com.iatd.smarthub.model.announcement.AnnouncementType;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AnnouncementResponseDTO {
    private Long id;
    private String title;
    private String content;
    private AnnouncementType type;
    private LocalDateTime date;
    private UserBasicDTO author;
    private Boolean published;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AnnouncementResponseDTO(Announcement announcement) {
        this.id = announcement.getId();
        this.title = announcement.getTitle();
        this.content = announcement.getContent();
        this.type = announcement.getType();
        this.date = announcement.getDate();
        this.published = announcement.getPublished();
        this.createdAt = announcement.getCreatedAt();
        this.updatedAt = announcement.getUpdatedAt();

        // Convertir l'auteur en UserBasicDTO
        if (announcement.getAuthor() != null) {
            this.author = new UserBasicDTO(announcement.getAuthor());
        }
    }

    // Constructeur par défaut pour la désérialisation
    public AnnouncementResponseDTO() {
    }
}