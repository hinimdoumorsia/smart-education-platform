package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.project.Project;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Getter
@Setter
public class ProjectResponseDTO {

    private Long id;
    private String title;
    private String description;
    private List<UserBasicDTO> students = new ArrayList<>();  // ✅ Initialiser avec liste vide
    private UserBasicDTO supervisor;
    private LocalDate startDate;
    private LocalDate endDate;
    private Project.ProjectStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ProjectResponseDTO(Project project) {
        this.id = project.getId();
        this.title = project.getTitle();
        this.description = project.getDescription();
        
        // ✅ CORRECTION : Toujours initialiser la liste, même si project.getStudents() est null
        if (project.getStudents() != null) {
            this.students = project.getStudents().stream()
                    .map(UserBasicDTO::new)
                    .collect(Collectors.toList());
        } else {
            this.students = new ArrayList<>(); // ✅ Liste vide si null
        }
        
        if (project.getSupervisor() != null) {
            this.supervisor = new UserBasicDTO(project.getSupervisor());
        }
        
        this.startDate = project.getStartDate();
        this.endDate = project.getEndDate();
        this.status = project.getStatus();
        this.createdAt = project.getCreatedAt();
        this.updatedAt = project.getUpdatedAt();
    }

    // Constructeur par défaut
    public ProjectResponseDTO() {
        this.students = new ArrayList<>(); // ✅ Initialiser dans le constructeur par défaut
    }
}