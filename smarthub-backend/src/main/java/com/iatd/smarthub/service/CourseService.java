package com.iatd.smarthub.service;

import com.iatd.smarthub.model.course.Course;
import com.iatd.smarthub.repository.*;
import com.iatd.smarthub.model.course.CourseFile;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CourseService {
    
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CourseFileRepository courseFileRepository;
    private final FileStorageService fileStorageService;
    // ⚠️ RETIREZ CourseStudentRepository
    
    // ============ GESTION DES ÉTUDIANTS (CORRIGÉ) ============
    
    @Transactional
    public void addStudentToCourse(Long courseId, Long studentId) {
        log.info("Adding student {} to course {}", studentId, courseId);

        // 1. Charger le cours SANS les étudiants d'abord (pour éviter les problèmes de cache)
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Cours non trouvé avec l'ID: " + courseId));

        // 2. Charger l'étudiant
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Étudiant non trouvé avec l'ID: " + studentId));

        // 3. Vérifier que c'est bien un étudiant
        if (student.getRole() != User.Role.STUDENT) {
            throw new RuntimeException("L'utilisateur " + student.getUsername() + " n'est pas un étudiant");
        }

        // 4. Vérifier si l'étudiant est déjà dans le cours
        Integer exists = courseRepository.existsInCourseStudents(courseId, studentId);
        if (exists != null && exists > 0) {
            log.warn("Student {} is already enrolled in course {}", studentId, courseId);
            throw new RuntimeException("L'étudiant est déjà inscrit à ce cours");
        }

        // 5. Utiliser la méthode native pour garantir l'insertion
        try {
            courseRepository.addStudentToCourseNative(courseId, studentId);
            
            // 6. Rafraîchir l'entité pour voir les changements
            courseRepository.flush();
            
            log.info("Student {} successfully added to course {} using native query", 
                     studentId, courseId);
            
            // 7. Pour la cohérence, ajouter aussi à la collection en mémoire
            course.getStudents().add(student);
            
        } catch (Exception e) {
            log.error("Error adding student to course with native query: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de l'ajout de l'étudiant: " + e.getMessage());
        }
    }
    
    @Transactional
    public void removeStudentFromCourse(Long courseId, Long studentId) {
        log.info("Removing student {} from course {}", studentId, courseId);
        
        try {
            // Utiliser la méthode native de CourseRepository
            courseRepository.removeStudentFromCourseNative(courseId, studentId);
            
            log.info("Student {} successfully removed from course {}", studentId, courseId);
            
        } catch (Exception e) {
            log.error("Error removing student from course: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de la suppression de l'étudiant: " + e.getMessage());
        }
    }
    
    // ============ MÉTHODES LECTURE (Gardez-les telles quelles) ============
    
    @Transactional(readOnly = true)
    public List<User> getCourseStudents(Long courseId) {
        Course course = courseRepository.findByIdWithStudents(courseId)
                .orElseThrow(() -> new RuntimeException("Cours non trouvé avec l'ID: " + courseId));
        
        if (course.getStudents() != null) {
            Hibernate.initialize(course.getStudents());
            return new ArrayList<>(course.getStudents());
        }
        
        return new ArrayList<>();
    }
    
    @Transactional(readOnly = true)
    public Course getCourseWithDetails(Long id) {
        log.info("Loading course with details for id: {}", id);
        
        Course course = courseRepository.findByIdWithFiles(id)
                .orElseThrow(() -> new RuntimeException("Cours non trouvé avec l'ID: " + id));
        
        log.info("Course loaded: {}", course.getTitle());
        
        if (course.getTeacher() != null) {
            Hibernate.initialize(course.getTeacher());
            log.info("Teacher loaded: {} (ID: {})", 
                     course.getTeacher().getUsername(), course.getTeacher().getId());
        }
        
        if (course.getFiles() != null && !course.getFiles().isEmpty()) {
            for (CourseFile file : course.getFiles()) {
                if (file.getUploadedBy() != null) {
                    Hibernate.initialize(file.getUploadedBy());
                    log.debug("File '{}' uploaded by: {}", 
                             file.getFileName(), file.getUploadedBy().getUsername());
                }
            }
            log.info("Files loaded: {} (with uploadedBy)", course.getFiles().size());
        }
        
        try {
            Course courseWithStudents = courseRepository.findByIdWithStudents(id).orElse(course);
            if (courseWithStudents.getStudents() != null) {
                course.setStudents(courseWithStudents.getStudents());
                log.info("Students loaded: {}", course.getStudents().size());
            }
        } catch (Exception e) {
            log.warn("Could not load students for course {}: {}", id, e.getMessage());
        }
        
        return course;
    }
    
    // ============ AUTRES MÉTHODES (Inchangées) ============
    
    @Transactional
    public Course createCourse(Course course) {
        log.info("Creating course: {}", course.getTitle());
        course.setCreatedDate(LocalDateTime.now());
        return courseRepository.save(course);
    }
    
    @Transactional
    public Course createCourseWithFiles(Course course, List<MultipartFile> files, User uploadedBy) {
        log.info("Creating course with files: {}", course.getTitle());
        course.setCreatedDate(LocalDateTime.now());
        
        Course savedCourse = courseRepository.save(course);
        
        if (files != null && !files.isEmpty()) {
            addFilesToCourse(savedCourse.getId(), files, uploadedBy);
        }
        
        return savedCourse;
    }
    
    @Transactional(readOnly = true)
    public List<Course> getAllCourses() {
        return courseRepository.findAllWithTeacher();
    }
    
    @Transactional(readOnly = true)
    public Course getCourseById(Long id) {
    	return courseRepository.findByIdWithTeacher(id)
                .orElseThrow(() -> new RuntimeException("Cours non trouvé avec l'ID: " + id));
    }
    
    @Transactional(readOnly = true)
    public Course getCourseWithTeacher(Long id) {
        return courseRepository.findByIdWithTeacher(id)
                .orElseThrow(() -> new RuntimeException("Cours non trouvé avec l'ID: " + id));
    }
    
    @Transactional(readOnly = true)
    public Course getCourseWithTeacherAndStudents(Long id) {
        Course course = courseRepository.findByIdWithTeacherAndStudents(id)
                .orElseThrow(() -> new RuntimeException("Cours non trouvé avec l'ID: " + id));
        
        if (course.getStudents() != null) {
            Hibernate.initialize(course.getStudents());
        }
        
        return course;
    }
    
    @Transactional(readOnly = true)
    public Course getCompleteCourse(Long id) {
        log.info("Loading complete course for id: {}", id);
        
        Course course = courseRepository.findByIdWithFiles(id)
                .orElseThrow(() -> new RuntimeException("Cours non trouvé avec l'ID: " + id));
        
        if (course.getTeacher() != null) {
            Hibernate.initialize(course.getTeacher());
        }
        
        try {
            Course courseWithStudents = courseRepository.findByIdWithStudents(id).orElse(course);
            if (courseWithStudents.getStudents() != null) {
                course.setStudents(courseWithStudents.getStudents());
            }
        } catch (Exception e) {
            log.warn("Could not load students: {}", e.getMessage());
        }
        
        return course;
    }
    
    @Transactional
    public Course updateCourse(Course course) {
        Course existingCourse = courseRepository.findById(course.getId())
                .orElseThrow(() -> new RuntimeException("Cours non trouvé avec l'ID: " + course.getId()));
        
        existingCourse.setTitle(course.getTitle());
        existingCourse.setDescription(course.getDescription());
        existingCourse.setTeacher(course.getTeacher());
        
        return courseRepository.save(existingCourse);
    }
    
    @Transactional
    public void deleteCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cours non trouvé avec l'ID: " + id));
        
        deleteCourseFiles(id);
        courseRepository.delete(course);
    }
    
    @Transactional(readOnly = true)
    public List<Course> getCoursesByTeacherUsername(String username) {
        log.info("Fetching courses for teacher: {}", username);
        
        User teacher = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Enseignant non trouvé: " + username));
        
        log.info("Teacher ID: {}", teacher.getId());
        
        List<Course> courses = courseRepository.findByTeacherId(teacher.getId());
        log.info("Found {} courses for teacher {}", courses.size(), username);
        
        for (Course course : courses) {
            Hibernate.initialize(course.getTeacher());
            
            Course courseWithStudents = courseRepository.findByIdWithStudents(course.getId()).orElse(course);
            if (courseWithStudents.getStudents() != null) {
                Hibernate.initialize(courseWithStudents.getStudents());
                course.setStudents(courseWithStudents.getStudents());
            }
            
            Course courseWithFiles = courseRepository.findByIdWithFiles(course.getId()).orElse(course);
            if (courseWithFiles.getFiles() != null) {
                for (CourseFile file : courseWithFiles.getFiles()) {
                    if (file.getUploadedBy() != null) {
                        Hibernate.initialize(file.getUploadedBy());
                    }
                }
                course.setFiles(courseWithFiles.getFiles());
            }
        }
        
        return courses;
    }
    
    @Transactional(readOnly = true)
    public List<CourseFile> getCourseFiles(Long courseId) {
        Course course = courseRepository.findByIdWithFiles(courseId)
                .orElseThrow(() -> new RuntimeException("Cours non trouvé avec l'ID: " + courseId));
        
        if (course.getFiles() != null) {
            for (CourseFile file : course.getFiles()) {
                if (file.getUploadedBy() != null) {
                    Hibernate.initialize(file.getUploadedBy());
                }
            }
            return course.getFiles();
        }
        
        return new ArrayList<>();
    }
    
    @Transactional(readOnly = true)
    public CourseFile getCourseFileById(Long fileId) {
        return courseFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Fichier non trouvé avec l'ID: " + fileId));
    }
    
    @Transactional
    public void addFilesToCourse(Long courseId, List<MultipartFile> files, User uploadedBy) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Cours non trouvé avec l'ID: " + courseId));
        
        if (files == null || files.isEmpty()) {
            return;
        }
        
        for (MultipartFile file : files) {
            try {
                String filePath = fileStorageService.storeFile(file);
                
                CourseFile courseFile = new CourseFile();
                courseFile.setFileName(file.getOriginalFilename());
                courseFile.setFileType(file.getContentType());
                courseFile.setFileSize(file.getSize());
                courseFile.setFilePath(filePath);
                courseFile.setUploadedDate(LocalDateTime.now());
                courseFile.setUploadedBy(uploadedBy);
                courseFile.setCourse(course);
                
                courseFileRepository.save(courseFile);
                
                if (course.getFiles() == null) {
                    course.setFiles(new ArrayList<>());
                }
                course.getFiles().add(courseFile);
                
            } catch (IOException e) {
                log.error("Error saving file: {}", e.getMessage());
                throw new RuntimeException("Erreur lors de l'enregistrement du fichier: " + e.getMessage());
            }
        }
        
        courseRepository.save(course);
    }
    
    @Transactional
    public void deleteCourseFile(Long fileId) {
        CourseFile courseFile = courseFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Fichier non trouvé avec l'ID: " + fileId));
        
        try {
            fileStorageService.deleteFile(courseFile.getFilePath());
        } catch (IOException e) {
            log.warn("Could not delete physical file: {}", e.getMessage());
        }
        
        courseFileRepository.delete(courseFile);
    }
    
    @Transactional
    public void deleteCourseFiles(Long courseId) {
        List<CourseFile> files = getCourseFiles(courseId);
        
        for (CourseFile file : files) {
            try {
                fileStorageService.deleteFile(file.getFilePath());
            } catch (IOException e) {
                log.warn("Could not delete physical file: {}", e.getMessage());
            }
        }
        
        courseFileRepository.deleteAll(files);
    }
    
    @Transactional(readOnly = true)
    public Course getCourseForConsulterPage(Long id) {
        log.info("Loading course details for consulter page, id: {}", id);
        return getCourseWithDetails(id);
    }
    
    @Transactional(readOnly = true)
    public Course getCourseWithTeacherOnly(Long id) {
        return courseRepository.findByIdWithTeacher(id)
                .orElseThrow(() -> new RuntimeException("Cours non trouvé avec l'ID: " + id));
    }
    
 // CourseService.java - CORRECTION
    @Transactional(readOnly = true)
    public boolean isStudentInCourse(Long courseId, Long userId) {
        log.info("Checking enrollment: courseId={}, userId={}", courseId, userId);
        
        // Option A : Utiliser la méthode existante qui marche
        return courseRepository.existsInCourseStudents(courseId, userId) != null && 
               courseRepository.existsInCourseStudents(courseId, userId) > 0;
        
        // OU Option B : Nouvelle requête
        // Long count = courseRepository.countStudentInCourseNative(courseId, userId);
        // return count != null && count > 0;
    }
    
    @Transactional(readOnly = true)
    public int getStudentCount(Long courseId) {
        // Utilisez une requête native pour obtenir le compte directement depuis la base
        Long count = courseRepository.countStudentsByCourseIdNative(courseId);
        return count != null ? count.intValue() : 0;
    }
 // Ajoutez cette méthode dans CourseService.java
    @Transactional(readOnly = true)
    public Course getCourseWithAllDetails(Long id) {
        log.info("=== GET COURSE WITH ALL DETAILS ===");
        log.info("Loading course ID: {}", id);
        
        // Essayez d'abord avec findByIdWithStudents
        try {
            log.info("Trying to load course with students...");
            Course course = courseRepository.findByIdWithStudents(id)
                    .orElseThrow(() -> new RuntimeException("Cours non trouvé avec l'ID: " + id));
            
            // Vérifier si les étudiants sont chargés
            if (course.getStudents() != null) {
                log.info("✅ Students loaded: {}", course.getStudents().size());
                for (User student : course.getStudents()) {
                    log.info("  - Student: {} (ID: {})", student.getUsername(), student.getId());
                }
            } else {
                log.warn("⚠️ Students list is NULL after findByIdWithStudents!");
            }
            
            // Charger aussi les fichiers
            if (course.getFiles() == null || course.getFiles().isEmpty()) {
                log.info("Loading files separately...");
                Course courseWithFiles = courseRepository.findByIdWithFiles(id).orElse(course);
                if (courseWithFiles.getFiles() != null) {
                    course.setFiles(courseWithFiles.getFiles());
                    log.info("Files loaded: {}", course.getFiles().size());
                }
            }
            
            // Charger le teacher
            if (course.getTeacher() == null) {
                log.info("Loading teacher separately...");
                Course courseWithTeacher = courseRepository.findByIdWithTeacher(id).orElse(course);
                if (courseWithTeacher.getTeacher() != null) {
                    course.setTeacher(courseWithTeacher.getTeacher());
                    log.info("Teacher loaded: {}", course.getTeacher().getUsername());
                }
            }
            
            return course;
            
        } catch (Exception e) {
            log.error("Error loading course with students: {}", e.getMessage());
            
            // Fallback: utiliser getCourseWithDetails()
            log.info("Fallback: using getCourseWithDetails()");
            Course course = getCourseWithDetails(id);
            
            // Vérifier les étudiants
            if (course.getStudents() != null) {
                log.info("Fallback - Students loaded: {}", course.getStudents().size());
            } else {
                log.error("❌ ERROR: Students list is still NULL even with fallback!");
                log.info("Trying manual initialization...");
                
                // Essayer d'initialiser manuellement
                try {
                    Course freshCourse = courseRepository.findById(id)
                            .orElseThrow(() -> new RuntimeException("Cours non trouvé"));
                    
                    Hibernate.initialize(freshCourse.getStudents());
                    Hibernate.initialize(freshCourse.getFiles());
                    Hibernate.initialize(freshCourse.getTeacher());
                    
                    if (freshCourse.getStudents() != null) {
                        log.info("Manual init - Students: {}", freshCourse.getStudents().size());
                        course.setStudents(freshCourse.getStudents());
                    }
                    
                } catch (Exception ex) {
                    log.error("Manual initialization failed: {}", ex.getMessage());
                }
            }
            
            return course;
        }
    }
    public List<Course> getCoursesByStudentId(Long studentId) {
        return courseRepository.findCoursesByStudentId(studentId);
    }

    @Transactional(readOnly = true)
    public int getFileCount(Long courseId) {
        Long count = courseFileRepository.countByCourseId(courseId);
        return count != null ? count.intValue() : 0;
    }
}