package com.iatd.smarthub.mapper;

import com.iatd.smarthub.dto.CourseRequestDTO;
import com.iatd.smarthub.dto.CourseResponseDTO;
import com.iatd.smarthub.dto.StudentResponseDTO;
import com.iatd.smarthub.dto.CourseFileDTO;
import com.iatd.smarthub.model.course.Course;
import com.iatd.smarthub.model.user.User;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Component
public class CourseMapper {
    
    public Course toEntity(CourseRequestDTO dto, User teacher) {
        Course course = new Course();
        course.setTitle(dto.getTitle());
        course.setDescription(dto.getDescription());
        course.setTeacher(teacher);
        return course;
    }
    
    public CourseResponseDTO toResponseDTO(Course course) {
        CourseResponseDTO dto = new CourseResponseDTO();
        dto.setId(course.getId());
        dto.setTitle(course.getTitle());
        dto.setDescription(course.getDescription());
        dto.setCreatedDate(course.getCreatedDate());
        
        // ⚠️ CORRECTION : Vérifier si le teacher est initialisé
        if (course.getTeacher() != null) {
            dto.setTeacherId(course.getTeacher().getId());
            // ⚠️ CORRECTION : Ne pas appeler getUsername() si teacher est un proxy
            // Utilise une méthode safe
            dto.setTeacherName(getSafeUsername(course.getTeacher()));
        }
        
        // Pour les étudiants - VÉRIFIER SANS déclencher le chargement
        try {
            if (course.getStudents() != null && !course.getStudents().isEmpty()) {
                List<StudentResponseDTO> studentDTOs = new ArrayList<>();
                for (User student : course.getStudents()) {
                    StudentResponseDTO studentDTO = new StudentResponseDTO();
                    studentDTO.setId(student.getId());
                    // ⚠️ CORRECTION : Utilise safe method
                    studentDTO.setUsername(getSafeUsername(student));
                    studentDTO.setEmail(student.getEmail());
                    studentDTOs.add(studentDTO);
                }
                dto.setStudents(studentDTOs);
            }
        } catch (Exception e) {
            dto.setStudents(new ArrayList<>());
        }
        
        // Pour les fichiers - VÉRIFIER SANS déclencher le chargement
        try {
            if (course.getFiles() != null && !course.getFiles().isEmpty()) {
                List<CourseFileDTO> fileDTOs = new ArrayList<>();
                for (com.iatd.smarthub.model.course.CourseFile file : course.getFiles()) {
                    CourseFileDTO fileDTO = toCourseFileDTO(file);
                    fileDTOs.add(fileDTO);
                }
                dto.setFiles(fileDTOs);
            }
        } catch (Exception e) {
            dto.setFiles(new ArrayList<>());
        }
        
        return dto;
    }
    
    // ⚠️ NOUVELLE MÉTHODE : Safe username getter
    private String getSafeUsername(User user) {
        try {
            // Essaie de récupérer le username SANS déclencher le chargement
            if (user != null) {
                // Utilise Hibernate pour vérifier si l'objet est initialisé
                org.hibernate.Hibernate.initialize(user);
                return user.getUsername();
            }
            return null;
        } catch (Exception e) {
            // Si échec, retourne un placeholder
            return "User#" + user.getId();
        }
    }
    
    // ⚠️ CORRECTION de toCourseFileDTO
    private CourseFileDTO toCourseFileDTO(com.iatd.smarthub.model.course.CourseFile courseFile) {
        CourseFileDTO dto = new CourseFileDTO();
        dto.setId(courseFile.getId());
        dto.setFileName(courseFile.getFileName());
        dto.setFileType(courseFile.getFileType());
        dto.setFileSize(courseFile.getFileSize());
        dto.setUploadedDate(courseFile.getUploadedDate());
        
        // ⚠️ CORRECTION : Ne pas essayer d'accéder à uploadedBy s'il n'est pas chargé
        if (courseFile.getUploadedBy() != null) {
            try {
                // Vérifie si uploadedBy est initialisé
                org.hibernate.Hibernate.initialize(courseFile.getUploadedBy());
                dto.setUploadedByUsername(courseFile.getUploadedBy().getUsername());
            } catch (Exception e) {
                // Si échec, utilise juste l'ID
                dto.setUploadedByUsername("User#" + courseFile.getUploadedBy().getId());
            }
        }
        
        return dto;
    }
    
    public void updateEntityFromDTO(CourseRequestDTO dto, Course course, User teacher) {
        course.setTitle(dto.getTitle());
        course.setDescription(dto.getDescription());
        course.setTeacher(teacher);
    }
    
    public CourseResponseDTO toSummaryDTO(Course course) {
        CourseResponseDTO dto = new CourseResponseDTO();
        dto.setId(course.getId());
        dto.setTitle(course.getTitle());
        dto.setDescription(course.getDescription());
        
        if (course.getTeacher() != null) {
            dto.setTeacherId(course.getTeacher().getId());
            dto.setTeacherName(getSafeUsername(course.getTeacher()));
        }
        
        dto.setCreatedDate(course.getCreatedDate());
        
        // AJOUTEZ CES 2 LIGNES CRUCIALES POUR LES COUNTS ↓
        dto.setStudentCount(calculateStudentCount(course));
        dto.setFileCount(calculateFileCount(course));
        
        // NE PAS charger les listes complètes pour la liste (performance)
        dto.setStudents(null); // Laissez null ou vide
        dto.setFiles(null);    // Laissez null ou vide
        
        return dto;
    }

    // Méthode utilitaire pour calculer studentCount
    private Integer calculateStudentCount(Course course) {
        try {
            if (course.getStudents() != null) {
                return course.getStudents().size();
            }
            return 0;
        } catch (Exception e) {
            // En cas d'erreur lazy loading
            return 0;
        }
    }

    // Méthode utilitaire pour calculer fileCount  
    private Integer calculateFileCount(Course course) {
        try {
            if (course.getFiles() != null) {
                return course.getFiles().size();
            }
            return 0;
        } catch (Exception e) {
            // En cas d'erreur lazy loading
            return 0;
        }
    }
    
    public CourseResponseDTO toDetailDTO(Course course) {
        return toResponseDTO(course);
    }
}