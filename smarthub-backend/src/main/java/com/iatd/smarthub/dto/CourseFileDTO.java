package com.iatd.smarthub.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CourseFileDTO {
    private Long id;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private LocalDateTime uploadedDate;
    private String uploadedByUsername;
    
    // AJOUTEZ CE CONSTRUCTEUR SANS ARGUMENTS
    public CourseFileDTO() {
    }
    
    // Constructeur pour faciliter la conversion
    public CourseFileDTO(Long id, String fileName, String fileType, Long fileSize, 
                        LocalDateTime uploadedDate, String uploadedByUsername) {
        this.id = id;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.uploadedDate = uploadedDate;
        this.uploadedByUsername = uploadedByUsername;
    }
}