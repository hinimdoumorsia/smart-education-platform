package com.iatd.smarthub.model.course;

import com.iatd.smarthub.model.user.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "course_files")
@Data
@NoArgsConstructor
public class CourseFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String filePath; // Chemin où le fichier est stocké

    private String fileType; // pdf, docx, pptx, etc.
    
    private Long fileSize; // Taille en bytes

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    @Column(name = "uploaded_date")
    private LocalDateTime uploadedDate = LocalDateTime.now();

    // Constructeur pratique
    public CourseFile(String fileName, String filePath, String fileType, Long fileSize, Course course, User uploadedBy) {
        this.fileName = fileName;
        this.filePath = filePath;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.course = course;
        this.uploadedBy = uploadedBy;
    }
}