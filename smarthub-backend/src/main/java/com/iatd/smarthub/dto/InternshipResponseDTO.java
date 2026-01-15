package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.internship.Internship;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class InternshipResponseDTO {
    private Long id;
    private String title;
    private String description;
    private UserBasicDTO student; // ← Remplacé par UserBasicDTO
    private UserBasicDTO supervisor; // ← Remplacé par UserBasicDTO
    private String company;
    private LocalDate startDate;
    private LocalDate endDate;
    private Internship.InternshipStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public InternshipResponseDTO(Internship internship) {
        this.id = internship.getId();
        this.title = internship.getTitle();
        this.description = internship.getDescription();

        // Convertir les User en UserBasicDTO
        if (internship.getStudent() != null) {
            this.student = new UserBasicDTO(internship.getStudent());
        }
        if (internship.getSupervisor() != null) {
            this.supervisor = new UserBasicDTO(internship.getSupervisor());
        }

        this.company = internship.getCompany();
        this.startDate = internship.getStartDate();
        this.endDate = internship.getEndDate();
        this.status = internship.getStatus();
        this.createdAt = internship.getCreatedAt();
        this.updatedAt = internship.getUpdatedAt();
    }

    // Constructeur par défaut pour la désérialisation
    public InternshipResponseDTO() {
    }
}
