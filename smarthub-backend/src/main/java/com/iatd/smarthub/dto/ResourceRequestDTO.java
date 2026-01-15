package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.resource.Resource;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class ResourceRequestDTO {

    @NotBlank(message = "Le titre est obligatoire")
    @Size(min = 3, max = 255, message = "Le titre doit contenir entre 3 et 255 caractères")
    private String title;

    // ✅ Rendre optionnel - l'utilisateur connecté sera automatiquement ajouté
    private List<Long> authorIds;

    @Size(max = 2000, message = "Le résumé ne peut pas dépasser 2000 caractères")
    private String abstractText;

    @NotNull(message = "La date de publication est obligatoire")
    private LocalDate publicationDate;

    private MultipartFile file; // Fichier uploadé

    private Resource.ResourceType type = Resource.ResourceType.ARTICLE;
}