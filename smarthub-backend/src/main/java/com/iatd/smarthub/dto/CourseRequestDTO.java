package com.iatd.smarthub.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
public class CourseRequestDTO {
    @NotBlank(message = "Le titre est obligatoire")
    private String title;
    
    private String description;
    
    @NotNull(message = "L'ID de l'enseignant est obligatoire")
    private Long teacherId;
    
    // ✅ AJOUT : Liste des fichiers
    private List<MultipartFile> files;
}