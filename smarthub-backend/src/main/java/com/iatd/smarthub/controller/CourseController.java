package com.iatd.smarthub.controller;

import com.iatd.smarthub.dto.CourseRequestDTO;
import com.iatd.smarthub.dto.CourseResponseDTO;
import com.iatd.smarthub.dto.StudentResponseDTO;
import com.iatd.smarthub.dto.CourseFileDTO;
import com.iatd.smarthub.dto.CourseListDTO;
import com.iatd.smarthub.model.course.Course;
import com.iatd.smarthub.model.course.CourseFile;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.mapper.CourseMapper;
import com.iatd.smarthub.service.CourseService;
import com.iatd.smarthub.service.UserService;
import com.iatd.smarthub.service.FileStorageService;
import com.iatd.smarthub.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@Slf4j
public class CourseController {
    
    private final CourseService courseService;
    private final UserService userService;
    private final CourseMapper courseMapper;
    private final FileStorageService fileStorageService;
    private final UserRepository userRepository;
    
    // ============ GESTION DES REQUÊTES OPTIONS (CORS) ============
    
    @RequestMapping(method = RequestMethod.OPTIONS)
    public ResponseEntity<?> handleOptions() {
        log.debug("Handling OPTIONS request for /api/courses");
        return ResponseEntity.ok()
                .header("Access-Control-Allow-Origin", "http://localhost:3002")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
                .header("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, X-Requested-With")
                .header("Access-Control-Allow-Credentials", "true")
                .header("Access-Control-Max-Age", "3600")
                .build();
    }
    
    // ============ ENDPOINT DE TEST ============
    
    @PostMapping(value = "/create-test", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createCourseTest(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("teacherId") String teacherIdStr,
            @RequestParam(value = "files", required = false) MultipartFile[] files,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        log.info("=== CREATE COURSE TEST ===");
        log.info("User: {}", userDetails.getUsername());
        log.info("Title: {}", title);
        log.info("Description: {}", description);
        log.info("TeacherId (String): {}", teacherIdStr);
        log.info("Files: {}", files != null ? files.length : 0);
        
        try {
            // Convertir teacherId de String en Long
            Long teacherId = Long.parseLong(teacherIdStr);
            log.info("TeacherId (Long): {}", teacherId);
            
            // Simuler une création réussie
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Test endpoint works correctly");
            response.put("teacherId", teacherId);
            response.put("title", title);
            response.put("description", description);
            response.put("user", userDetails.getUsername());
            response.put("role", userDetails.getAuthorities());
            
            return ResponseEntity.ok(response);
            
        } catch (NumberFormatException e) {
            log.error("Invalid teacherId format: {}", teacherIdStr);
            return ResponseEntity.badRequest()
                    .body("{\"error\": \"teacherId doit être un nombre valide\", \"received\": \"" + teacherIdStr + "\"}");
        }
    }
    
    // ============ CRÉATION D'UN COURS (PRINCIPAL) ============
    
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createCourse(
            @Valid @ModelAttribute CourseRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails,
            BindingResult bindingResult) {
        
        log.info("=== CREATE COURSE - START ===");
        log.info("User: {}", userDetails.getUsername());
        
        try {
            // DEBUG: Log la requête
            log.info("Request received - Title: {}", request.getTitle());
            log.info("Request received - Description: {}", request.getDescription());
            log.info("Request received - TeacherId: {}", request.getTeacherId());
            log.info("Request received - Files: {}", request.getFiles() != null ? request.getFiles().size() : 0);
            
            // Vérifier les erreurs de validation
            if (bindingResult.hasErrors()) {
                log.error("Validation errors found:");
                bindingResult.getAllErrors().forEach(error -> 
                    log.error(" - Field: {}, Error: {}", 
                        error.getObjectName(), error.getDefaultMessage())
                );
                return ResponseEntity.badRequest()
                        .body("{\"error\": \"Validation failed\", \"details\": \"" + 
                              bindingResult.getFieldError().getDefaultMessage() + "\"}");
            }
            
            // Vérification des rôles
            boolean hasRequiredRole = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> {
                        String authority = grantedAuthority.getAuthority();
                        return authority.equals("ROLE_TEACHER") || 
                               authority.equals("ROLE_ADMIN");
                    });
            
            if (!hasRequiredRole) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Seuls les enseignants et administrateurs peuvent créer des cours\"}");
            }

            // RÉCUPÉRATION DU teacherId
            Long teacherId = request.getTeacherId();
            
            log.info("Initial teacherId from request: {}", teacherId);
            
            // Si teacherId est null ET l'utilisateur est TEACHER
            if (teacherId == null) {
                if (userDetails.getAuthorities().stream()
                        .anyMatch(g -> g.getAuthority().equals("ROLE_TEACHER"))) {
                    
                    log.info("teacherId is null, getting from TEACHER user");
                    
                    // Récupérer l'utilisateur TEACHER connecté
                    User currentUser = userRepository.findByUsername(userDetails.getUsername())
                            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
                    
                    teacherId = currentUser.getId();
                    request.setTeacherId(teacherId);
                    log.info("Set teacherId to TEACHER's ID: {}", teacherId);
                    
                } else {
                    // Pour ADMIN, teacherId ne doit pas être null
                    log.error("teacherId is null for ADMIN user");
                    return ResponseEntity.badRequest()
                            .body("{\"error\": \"L'ID de l'enseignant est obligatoire pour les administrateurs\"}");
                }
            }
            
            log.info("Final teacherId to use: {}", teacherId);

            // Récupérer l'enseignant
            User teacher = userService.getUserEntityById(teacherId);
            log.info("Teacher found: {} (ID: {})", teacher.getUsername(), teacher.getId());
            
            // Récupérer l'utilisateur connecté (pour les logs des fichiers)
            User currentUser = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            // Vérifier que l'enseignant connecté est bien celui spécifié (sauf ADMIN)
            boolean isAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> 
                        grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
            
            if (!isAdmin && !teacher.getUsername().equals(userDetails.getUsername())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Vous ne pouvez créer des cours que pour vous-même\"}");
            }

            // Créer le cours
            log.info("Creating course with teacher: {}", teacher.getUsername());
            Course course = courseMapper.toEntity(request, teacher);
            
            // Gérer les fichiers
            List<MultipartFile> files = request.getFiles();
            if (files != null) {
                log.info("Processing {} files", files.size());
            }
            
            Course savedCourse = courseService.createCourseWithFiles(course, files, currentUser);
            CourseResponseDTO response = courseMapper.toResponseDTO(savedCourse);
            
            log.info("=== CREATE COURSE - SUCCESS ===");
            log.info("Course created with ID: {}", savedCourse.getId());
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            log.error("RuntimeException in createCourse: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("{\"error\": \"Erreur\", \"message\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            log.error("Unexpected error in createCourse: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"Erreur interne du serveur\"}");
        }
    }
    
    @GetMapping
    public ResponseEntity<List<CourseListDTO>> getAllCourses() {
        List<Course> courses = courseService.getAllCourses();
        
        List<CourseListDTO> response = courses.stream()
                .map(course -> {
                    CourseListDTO dto = new CourseListDTO();
                    dto.setId(course.getId());
                    dto.setTitle(course.getTitle());
                    dto.setDescription(course.getDescription());
                    dto.setCreatedDate(course.getCreatedDate());
                    
                    if (course.getTeacher() != null) {
                        dto.setTeacherId(course.getTeacher().getId());
                        dto.setTeacherName(
                            course.getTeacher().getFirstName() + " " + course.getTeacher().getLastName()
                        );
                    }
                    
                    // IMPORTANT : Ajouter les counts
                    dto.setStudentCount(courseService.getStudentCount(course.getId()));
                    dto.setFileCount(courseService.getFileCount(course.getId()));
                    
                    return dto;
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/my-courses")
    public ResponseEntity<?> getMyCourses(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Vérification manuelle des rôles
            boolean hasRequiredRole = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> {
                        String authority = grantedAuthority.getAuthority();
                        return authority.equals("ROLE_TEACHER") || 
                               authority.equals("ROLE_ADMIN");
                    });
            
            if (!hasRequiredRole) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Seuls les enseignants et administrateurs peuvent accéder à cette fonctionnalité\"}");
            }

            List<Course> courses = courseService.getCoursesByTeacherUsername(userDetails.getUsername());
            List<CourseResponseDTO> response = courses.stream()
                    .map(courseMapper::toSummaryDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error in getMyCourses: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"Erreur interne du serveur\"}");
        }
    }

    @GetMapping("/{courseId}/students")
    public ResponseEntity<?> getCourseStudents(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            log.info("GET /courses/{}/students - Request from user: {}", courseId, userDetails.getUsername());
            
            // Vérification manuelle des rôles
            boolean hasRequiredRole = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> {
                        String authority = grantedAuthority.getAuthority();
                        return authority.equals("ROLE_TEACHER") || 
                               authority.equals("ROLE_ADMIN");
                    });
            
            if (!hasRequiredRole) {
                log.warn("Access denied for user: {}", userDetails.getUsername());
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Seuls les enseignants et administrateurs peuvent accéder à cette fonctionnalité\"}");
            }

            // Récupérer le cours avec le teacher
            Course course = courseService.getCourseWithTeacherOnly(courseId);
            boolean isAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> 
                        grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
            
            // Vérifier que l'utilisateur est l'enseignant du cours (sauf ADMIN)
            if (!isAdmin && !course.getTeacher().getUsername().equals(userDetails.getUsername())) {
                log.warn("User {} is not the teacher of course {}", userDetails.getUsername(), courseId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Vous n'êtes pas l'enseignant de ce cours\"}");
            }
            
            // Utiliser la méthode pour récupérer les étudiants
            List<User> students = courseService.getCourseStudents(courseId);
            
            // Mapper les étudiants vers DTOs
            List<StudentResponseDTO> studentDTOs = students.stream()
                    .map(student -> {
                        StudentResponseDTO studentDTO = new StudentResponseDTO();
                        studentDTO.setId(student.getId());
                        studentDTO.setUsername(student.getUsername());
                        studentDTO.setEmail(student.getEmail());
                        studentDTO.setFirstName(student.getFirstName());
                        studentDTO.setLastName(student.getLastName());
                        return studentDTO;
                    })
                    .collect(Collectors.toList());
            
            log.info("GET /courses/{}/students - Success, found {} students", courseId, studentDTOs.size());
            return ResponseEntity.ok(studentDTOs);
            
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage();
            log.error("GET /courses/{}/students - Error: {}", courseId, errorMessage);
            
            if (errorMessage.contains("not found") || errorMessage.contains("not found with id")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("{\"error\": \"Cours non trouvé\", \"message\": \"Le cours avec l'ID " + courseId + " n'existe pas\"}");
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("{\"error\": \"Erreur\", \"message\": \"" + errorMessage + "\"}");
            }
        }
    }
     
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCourse(
            @PathVariable Long id, 
            @Valid @RequestBody CourseRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Vérification manuelle des rôles
            boolean hasRequiredRole = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> {
                        String authority = grantedAuthority.getAuthority();
                        return authority.equals("ROLE_TEACHER") || 
                               authority.equals("ROLE_ADMIN");
                    });
            
            if (!hasRequiredRole) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Seuls les enseignants et administrateurs peuvent modifier des cours\"}");
            }

            Course existingCourse = courseService.getCourseById(id);
            
            // Vérifier que l'enseignant est bien l'enseignant du cours (sauf ADMIN)
            boolean isAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> 
                        grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
            
            if (!isAdmin && !existingCourse.getTeacher().getUsername().equals(userDetails.getUsername())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Vous n'êtes pas l'enseignant de ce cours\"}");
            }

            User teacher = userService.getUserEntityById(request.getTeacherId());
            courseMapper.updateEntityFromDTO(request, existingCourse, teacher);
            Course updatedCourse = courseService.updateCourse(existingCourse);
            CourseResponseDTO response = courseMapper.toResponseDTO(updatedCourse);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage();
            if (errorMessage.contains("not found") || errorMessage.contains("not found with id")) {
                return ResponseEntity.notFound().build();
            } else if (errorMessage.contains("n'êtes pas") || errorMessage.contains("non autorisé")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"" + errorMessage + "\"}");
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Erreur\", \"message\": \"" + errorMessage + "\"}");
            }
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Vérification manuelle des rôles
            boolean hasRequiredRole = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> {
                        String authority = grantedAuthority.getAuthority();
                        return authority.equals("ROLE_TEACHER") || 
                               authority.equals("ROLE_ADMIN");
                    });
            
            if (!hasRequiredRole) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Seuls les enseignants et administrateurs peuvent supprimer des cours\"}");
            }

            Course existingCourse = courseService.getCourseById(id);
            
            // Vérifier que l'enseignant est bien l'enseignant du cours (sauf ADMIN)
            boolean isAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> 
                        grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
            
            if (!isAdmin && !existingCourse.getTeacher().getUsername().equals(userDetails.getUsername())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Vous n'êtes pas l'enseignant de ce cours\"}");
            }

            courseService.deleteCourse(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage();
            if (errorMessage.contains("not found") || errorMessage.contains("not found with id")) {
                return ResponseEntity.notFound().build();
            } else if (errorMessage.contains("n'êtes pas") || errorMessage.contains("non autorisé")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"" + errorMessage + "\"}");
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Erreur\", \"message\": \"" + errorMessage + "\"}");
            }
        }
    }
    
    @PostMapping("/{courseId}/students/{studentId}")
    public ResponseEntity<?> addStudentToCourse(
            @PathVariable Long courseId, 
            @PathVariable Long studentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Vérification manuelle des rôles
            boolean hasRequiredRole = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> {
                        String authority = grantedAuthority.getAuthority();
                        return authority.equals("ROLE_TEACHER") || 
                               authority.equals("ROLE_ADMIN");
                    });
            
            if (!hasRequiredRole) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Seuls les enseignants et administrateurs peuvent ajouter des étudiants à un cours\"}");
            }

            Course course = courseService.getCourseById(courseId);
            
            // Vérifier que l'enseignant est bien l'enseignant du cours (sauf ADMIN)
            boolean isAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> 
                        grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
            
            if (!isAdmin && !course.getTeacher().getUsername().equals(userDetails.getUsername())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Vous n'êtes pas l'enseignant de ce cours\"}");
            }

            courseService.addStudentToCourse(courseId, studentId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage();
            if (errorMessage.contains("not found") || errorMessage.contains("not found with id")) {
                return ResponseEntity.notFound().build();
            } else if (errorMessage.contains("n'êtes pas") || errorMessage.contains("non autorisé")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"" + errorMessage + "\"}");
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Erreur\", \"message\": \"" + errorMessage + "\"}");
            }
        }
    }
    
    @DeleteMapping("/{courseId}/students/{studentId}")
    public ResponseEntity<?> removeStudentFromCourse(
            @PathVariable Long courseId, 
            @PathVariable Long studentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Vérification manuelle des rôles
            boolean hasRequiredRole = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> {
                        String authority = grantedAuthority.getAuthority();
                        return authority.equals("ROLE_TEACHER") || 
                               authority.equals("ROLE_ADMIN");
                    });
            
            if (!hasRequiredRole) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Seuls les enseignants et administrateurs peuvent retirer des étudiants d'un cours\"}");
            }

            Course course = courseService.getCourseById(courseId);
            
            // Vérifier que l'enseignant est bien l'enseignant du cours (sauf ADMIN)
            boolean isAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> 
                        grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
            
            if (!isAdmin && !course.getTeacher().getUsername().equals(userDetails.getUsername())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Vous n'êtes pas l'enseignant de ce cours\"}");
            }

            courseService.removeStudentFromCourse(courseId, studentId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage();
            if (errorMessage.contains("not found") || errorMessage.contains("not found with id")) {
                return ResponseEntity.notFound().build();
            } else if (errorMessage.contains("n'êtes pas") || errorMessage.contains("non autorisé")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"" + errorMessage + "\"}");
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Erreur\", \"message\": \"" + errorMessage + "\"}");
            }
        }
    }

    @GetMapping("/{courseId}/files")
    public ResponseEntity<?> getCourseFiles(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            log.info("=== GET COURSE FILES - User: {} ===", userDetails.getUsername());
            
            // Vérifier les permissions en fonction du rôle
            boolean isStudent = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"));
            boolean isTeacher = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_TEACHER"));
            boolean isAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            
            // Pour les étudiants : vérifier l'inscription
            if (isStudent) {
                User student = userRepository.findByUsername(userDetails.getUsername())
                        .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
                
                boolean isEnrolled = courseService.isStudentInCourse(courseId, student.getId());
                if (!isEnrolled) {
                    log.warn("Student {} not enrolled in course {}", userDetails.getUsername(), courseId);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("{\"error\": \"Vous n'êtes pas inscrit à ce cours\"}");
                }
            }
            
            // Pour les enseignants : vérifier qu'ils enseignent ce cours
            if (isTeacher && !isAdmin) {
                Course course = courseService.getCourseWithTeacherOnly(courseId);
                if (!course.getTeacher().getUsername().equals(userDetails.getUsername())) {
                    log.warn("Teacher {} not teaching course {}", userDetails.getUsername(), courseId);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("{\"error\": \"Vous n'êtes pas l'enseignant de ce cours\"}");
                }
            }
            
            // Récupérer les fichiers
            List<CourseFile> files = courseService.getCourseFiles(courseId);
            List<CourseFileDTO> response = files.stream()
                    .map(this::mapToFileDTO)
                    .collect(Collectors.toList());
            
            log.info("✅ ACCESS GRANTED: Returning {} files", response.size());
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            log.error("Error getting course files: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"Erreur lors de la récupération des fichiers\"}");
        }
    }
    
    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<org.springframework.core.io.Resource> downloadFile(@PathVariable Long fileId) {
        try {
            CourseFile courseFile = courseService.getCourseFileById(fileId);
            byte[] fileContent = fileStorageService.loadFile(courseFile.getFilePath());
            org.springframework.core.io.Resource fileResource = new ByteArrayResource(fileContent);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + courseFile.getFileName() + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(fileResource);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping(value = "/{courseId}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> addFilesToCourse(
            @PathVariable Long courseId,
            @RequestParam("files") List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Vérification des permissions
            Course course = courseService.getCourseById(courseId);
            
            User currentUser = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            boolean hasRequiredRole = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> {
                        String authority = grantedAuthority.getAuthority();
                        return authority.equals("ROLE_TEACHER") || 
                               authority.equals("ROLE_ADMIN");
                    });
            
            if (!hasRequiredRole) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Seuls les enseignants et administrateurs peuvent ajouter des fichiers\"}");
            }

            // Vérifier que l'enseignant est bien l'enseignant du cours (sauf ADMIN)
            boolean isAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> 
                        grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
            
            if (!isAdmin && !course.getTeacher().getUsername().equals(userDetails.getUsername())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Vous n'êtes pas l'enseignant de ce cours\"}");
            }

            courseService.addFilesToCourse(courseId, files, currentUser);
            return ResponseEntity.ok().body("{\"message\": \"Fichiers ajoutés avec succès\"}");
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage();
            if (errorMessage.contains("not found")) {
                return ResponseEntity.notFound().build();
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Erreur\", \"message\": \"" + errorMessage + "\"}");
            }
        }
    }

    @DeleteMapping("/files/{fileId}")
    public ResponseEntity<?> deleteCourseFile(
            @PathVariable Long fileId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            CourseFile courseFile = courseService.getCourseFileById(fileId);
            Course course = courseFile.getCourse();
            
            // Vérification des permissions
            boolean hasRequiredRole = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> {
                        String authority = grantedAuthority.getAuthority();
                        return authority.equals("ROLE_TEACHER") || 
                               authority.equals("ROLE_ADMIN");
                    });
            
            if (!hasRequiredRole) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Seuls les enseignants et administrateurs peuvent supprimer des fichiers\"}");
            }

            // Vérifier que l'enseignant est bien l'enseignant du cours (sauf ADMIN)
            boolean isAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> 
                        grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
            
            if (!isAdmin && !course.getTeacher().getUsername().equals(userDetails.getUsername())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Vous n'êtes pas l'enseignant de ce cours\"}");
            }

            courseService.deleteCourseFile(fileId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage();
            if (errorMessage.contains("not found")) {
                return ResponseEntity.notFound().build();
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Erreur\", \"message\": \"" + errorMessage + "\"}");
            }
        }
    }

    // Méthode utilitaire pour mapper CourseFile vers CourseFileDTO
    private CourseFileDTO mapToFileDTO(CourseFile courseFile) {
        CourseFileDTO dto = new CourseFileDTO();
        dto.setId(courseFile.getId());
        dto.setFileName(courseFile.getFileName());
        dto.setFileType(courseFile.getFileType());
        dto.setFileSize(courseFile.getFileSize());
        dto.setUploadedDate(courseFile.getUploadedDate());
        
        // Utilisation du bon nom de champ : uploadedByUsername
        if (courseFile.getUploadedBy() != null) {
            dto.setUploadedByUsername(courseFile.getUploadedBy().getUsername());
        } else {
            dto.setUploadedByUsername("Unknown");
        }
        
        return dto;
    }
    
    @PostMapping(value = "/debug-create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> debugCreateCourse(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("teacherId") String teacherIdStr,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        log.info("=== DEBUG CREATE COURSE ===");
        log.info("Title: {}", title);
        log.info("Description: {}", description);
        log.info("TeacherId (string): {}", teacherIdStr);
        log.info("TeacherId type: {}", teacherIdStr.getClass());
        log.info("Files count: {}", files != null ? files.size() : 0);
        log.info("User: {}", userDetails.getUsername());
        
        try {
            // Essayer de convertir en Long
            Long teacherId = Long.parseLong(teacherIdStr);
            log.info("TeacherId (parsed as Long): {}", teacherId);
            
            return ResponseEntity.ok().body("{\"message\": \"Debug successful\", \"teacherId\": " + teacherId + "}");
        } catch (NumberFormatException e) {
            log.error("Cannot parse teacherId: {}", teacherIdStr, e);
            return ResponseEntity.badRequest().body("{\"error\": \"Invalid teacherId format: " + teacherIdStr + "\"}");
        }
    }
    
    @GetMapping("/{courseId}/student-count")
    public ResponseEntity<Map<String, Object>> getStudentCount(@PathVariable Long courseId) {
        try {
            int count = courseService.getStudentCount(courseId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "count", count
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "count", 0,
                "message", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/my-courses/student")
    public ResponseEntity<?> getMyStudentCourses(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Vérifier rôle STUDENT
            boolean isStudent = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"));

            if (!isStudent) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès réservé aux étudiants\"}");
            }

            // Récupérer l'étudiant connecté
            User student = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            // Récupérer ses cours
            List<Course> courses = courseService.getCoursesByStudentId(student.getId());

            List<CourseResponseDTO> response = courses.stream()
                    .map(courseMapper::toSummaryDTO)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error fetching student courses", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"Erreur serveur\"}");
        }
    }
    
    // ============ SEULE MÉTHODE GET /{id} - LES AUTRES SUPPRIMÉES ============
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getCourseById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            log.info("User {} accessing course {}", userDetails.getUsername(), id);
            
            // Vérifier si c'est un étudiant
            boolean isStudent = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"));
            
            if (isStudent) {
                // Récupérer l'étudiant
                User student = userRepository.findByUsername(userDetails.getUsername())
                        .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
                
                // Vérifier l'inscription
                boolean isEnrolled = courseService.isStudentInCourse(id, student.getId());
                
                if (!isEnrolled) {
                    log.warn("Student {} NOT enrolled in course {}", userDetails.getUsername(), id);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("{\"error\": \"Vous n'êtes pas inscrit à ce cours\"}");
                }
            }
            
            // Pour les enseignants : vérifier qu'ils enseignent ce cours (sauf ADMIN)
            boolean isTeacher = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_TEACHER"));
            boolean isAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            
            if (isTeacher && !isAdmin) {
                Course course = courseService.getCourseWithTeacherOnly(id);
                if (!course.getTeacher().getUsername().equals(userDetails.getUsername())) {
                    log.warn("Teacher {} not teaching course {}", userDetails.getUsername(), id);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("{\"error\": \"Vous n'êtes pas l'enseignant de ce cours\"}");
                }
            }
            
            // Récupérer le cours
            Course course = courseService.getCourseById(id);
            CourseResponseDTO response = courseMapper.toDetailDTO(course);
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            log.error("Error fetching course {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("{\"error\": \"Cours non trouvé\"}");
        }
    }
    
    // ============ ENDPOINT PUBLIC (ACCÈS LIBRE) ============
    
    @GetMapping("/public/{id}")
    public ResponseEntity<CourseResponseDTO> getCoursePublic(@PathVariable Long id) {
        try {
            Course course = courseService.getCourseById(id);
            CourseResponseDTO response = courseMapper.toDetailDTO(course);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/{id}/for-student")
    public ResponseEntity<?> getCourseForStudent(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            log.info("Student {} accessing course {}", userDetails.getUsername(), id);
            
            // Vérifier le rôle STUDENT
            boolean isStudent = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"));
            
            if (!isStudent) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès réservé aux étudiants\"}");
            }
            
            // Récupérer l'étudiant
            User student = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            // Vérifier l'inscription
            boolean isEnrolled = courseService.isStudentInCourse(id, student.getId());
            
            if (!isEnrolled) {
                log.warn("Student {} NOT enrolled in course {}", userDetails.getUsername(), id);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Vous n'êtes pas inscrit à ce cours\"}");
            }
            
            // Récupérer le cours
            Course course = courseService.getCourseById(id);
            
            // Créer une réponse adaptée aux étudiants
            CourseResponseDTO response = courseMapper.toDetailDTO(course);
            
            // Masquer certaines infos sensibles pour les étudiants
            response.setStudents(null);
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            log.error("Error fetching course for student: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("{\"error\": \"Cours non trouvé\"}");
        }
    }

    @PostMapping("/{id}/enroll")
    public ResponseEntity<?> enrollInCourse(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            log.info("Student {} enrolling in course {}", userDetails.getUsername(), id);
            
            // Vérifier le rôle STUDENT
            boolean isStudent = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"));
            
            if (!isStudent) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès réservé aux étudiants\"}");
            }
            
            // Récupérer l'étudiant
            User student = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            // Vérifier si déjà inscrit
            boolean isAlreadyEnrolled = courseService.isStudentInCourse(id, student.getId());
            
            if (isAlreadyEnrolled) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("{\"error\": \"Vous êtes déjà inscrit à ce cours\"}");
            }
            
            // Ajouter l'étudiant au cours
            courseService.addStudentToCourse(id, student.getId());
            
            // Retourner succès
            return ResponseEntity.ok()
                    .body("{\"message\": \"Inscription réussie\", \"courseId\": " + id + "}");
            
        } catch (RuntimeException e) {
            String errorMessage = e.getMessage();
            log.error("Error enrolling student: {}", errorMessage);
            
            if (errorMessage.contains("non trouvé") || errorMessage.contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("{\"error\": \"Cours non trouvé\"}");
            } else if (errorMessage.contains("déjà inscrit") || errorMessage.contains("already enrolled")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("{\"error\": \"Vous êtes déjà inscrit à ce cours\"}");
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("{\"error\": \"Erreur lors de l'inscription\"}");
            }
        }
    }

    @GetMapping("/{id}/check-enrollment")
    public ResponseEntity<Map<String, Object>> checkEnrollment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            log.info("Checking enrollment for student {} in course {}", userDetails.getUsername(), id);
            
            // Récupérer l'étudiant
            User student = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            // Vérifier l'inscription
            boolean isEnrolled = courseService.isStudentInCourse(id, student.getId());
            
            // Retourner le résultat
            Map<String, Object> response = new HashMap<>();
            response.put("isEnrolled", isEnrolled);
            response.put("courseId", id);
            response.put("studentId", student.getId());
            
            if (isEnrolled) {
                response.put("message", "Étudiant inscrit au cours");
            } else {
                response.put("message", "Étudiant non inscrit au cours");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            log.error("Error checking enrollment: {}", e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("isEnrolled", false);
            errorResponse.put("error", "Erreur lors de la vérification");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.ok(errorResponse);
        }
    }
    @GetMapping("/{id}/basic-info")
    public ResponseEntity<?> getCourseBasicInfo(@PathVariable Long id) {
        try {
            log.info("Getting basic info for course {}", id);
            
            // Utilisez getCourseWithTeacherOnly - PAS getCourseById
            Course course = courseService.getCourseWithTeacherOnly(id);
            
            if (course == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("{\"error\": \"Cours non trouvé\"}");
            }
            
            // Créer une réponse SANS accéder aux collections lazy
            Map<String, Object> response = new HashMap<>();
            response.put("id", course.getId());
            response.put("title", course.getTitle());
            response.put("description", course.getDescription());
            response.put("createdDate", course.getCreatedDate());
            
            // Infos enseignant seulement
            if (course.getTeacher() != null) {
                response.put("teacherId", course.getTeacher().getId());
                response.put("teacherName", course.getTeacher().getFirstName() + " " + course.getTeacher().getLastName());
            }
            
            // NE PAS faire ça - c'est ce qui cause l'erreur
            // response.put("studentCount", course.getStudents() != null ? course.getStudents().size() : 0);
            // response.put("fileCount", course.getFiles() != null ? course.getFiles().size() : 0);
            
            // Remplacer par ces valeurs (vous pouvez les calculer autrement si besoin)
            response.put("studentCount", 0);
            response.put("fileCount", 0);
            
            log.info("✅ Basic info retrieved successfully for course {}", id);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Error getting basic info for course {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("{\"error\": \"Cours non trouvé\", \"details\": \"" + e.getMessage() + "\"}");
        }
    }
    
    
}