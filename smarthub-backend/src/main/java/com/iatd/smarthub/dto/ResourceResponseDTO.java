package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.resource.Resource;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
public class ResourceResponseDTO {

    private Long id;
    private String title;
    private List<UserBasicDTO> authors;
    private String abstractText;
    private LocalDate publicationDate;
    private String originalFileName; // Nom original
    private String fileDownloadUrl; // URL pour télécharger le fichier
    private Long fileSize; // Taille du fichier
    private String fileType; // Type MIME
    private Resource.ResourceType type;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ResourceResponseDTO(Resource resource) {
        this.id = resource.getId();
        this.title = resource.getTitle();
        this.abstractText = resource.getAbstractText();
        this.publicationDate = resource.getPublicationDate();
        this.originalFileName = resource.getOriginalFileName();
        this.fileSize = resource.getFileSize();
        this.fileType = resource.getFileType();
        this.type = resource.getType();
        this.createdAt = resource.getCreatedAt();
        this.updatedAt = resource.getUpdatedAt();

        // Convertir les auteurs en UserBasicDTO
        if (resource.getAuthors() != null) {
            this.authors = resource.getAuthors().stream()
                    .map(UserBasicDTO::new)
                    .collect(Collectors.toList());
        }
    }

    public ResourceResponseDTO() {
    }
}
