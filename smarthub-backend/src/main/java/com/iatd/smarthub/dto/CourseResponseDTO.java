package com.iatd.smarthub.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;
import java.time.LocalDateTime;

@Getter
@Setter
public class CourseResponseDTO {
    private Long id;
    private String title;
    private String description;
    private Long teacherId;
    private String teacherName;
    private LocalDateTime createdDate;
    private List<StudentResponseDTO> students;
    private List<CourseFileDTO> files; // AJOUTEZ CETTE LIGNE
    
 // AJOUTEZ CES DEUX CHAMPS ↓
    private Integer studentCount = 0;
    private Integer fileCount = 0;

    // Constructeur par défaut
    public CourseResponseDTO() {
    }
    
}