// src/main/java/com/iatd/smarthub/dto/AnnouncementRequestDTO.java
package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.announcement.AnnouncementType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AnnouncementRequestDTO {

    @NotBlank(message = "Le titre de l'annonce est obligatoire")
    @Size(min = 3, max = 255, message = "Le titre doit contenir entre 3 et 255 caractères")
    private String title;

    @NotBlank(message = "Le contenu de l'annonce est obligatoire")
    @Size(min = 10, message = "Le contenu doit contenir au moins 10 caractères")
    private String content;

    @NotNull(message = "Le type d'annonce est obligatoire")
    private AnnouncementType type;

    @NotNull(message = "La date de l'annonce est obligatoire")
    private LocalDateTime date;

    // ✅ SUPPRIMÉ : authorId n'est plus nécessaire car l'auteur est l'utilisateur connecté
    // @NotNull(message = "L'ID de l'auteur est obligatoire")
    // private Long authorId;

    private Boolean published = true;
}