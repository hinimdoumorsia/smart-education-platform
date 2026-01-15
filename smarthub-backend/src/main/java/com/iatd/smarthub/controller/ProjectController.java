package com.iatd.smarthub.controller;

import com.iatd.smarthub.dto.ProjectRequestDTO;
import com.iatd.smarthub.dto.ProjectResponseDTO;
import com.iatd.smarthub.model.project.Project;
import com.iatd.smarthub.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Slf4j
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<?> createProject(
            @Valid @RequestBody ProjectRequestDTO projectRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            ProjectResponseDTO createdProject = projectService.createProject(projectRequest, userDetails.getUsername());
            return new ResponseEntity<>(createdProject, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("{\"error\": \"Accès refusé\", \"message\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            log.error("Unexpected error in createProject: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur interne du serveur");
        }
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponseDTO>> getAllProjects() {
        List<ProjectResponseDTO> projects = projectService.getAllProjects();
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponseDTO> getProjectById(@PathVariable Long id) {
        return projectService.getProjectById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/my-projects")
    public ResponseEntity<?> getMyProjects(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Vérification manuelle des rôles
            boolean hasRequiredRole = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> 
                        grantedAuthority.getAuthority().equals("ROLE_TEACHER") || 
                        grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
            
            if (!hasRequiredRole) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Seuls les enseignants et administrateurs peuvent accéder à cette fonctionnalité\"}");
            }

            List<ProjectResponseDTO> projects = projectService.getProjectsBySupervisorUsername(userDetails.getUsername());
            return ResponseEntity.ok(projects);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error in getMyProjects: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur interne du serveur");
        }
    }

    @GetMapping("/student/my-projects")
    public ResponseEntity<?> getMyStudentProjects(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Vérification manuelle des rôles
            boolean hasRequiredRole = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> 
                        grantedAuthority.getAuthority().equals("ROLE_STUDENT"));
            
            if (!hasRequiredRole) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Seuls les étudiants peuvent accéder à cette fonctionnalité\"}");
            }

            List<ProjectResponseDTO> projects = projectService.getProjectsByStudentUsername(userDetails.getUsername());
            return ResponseEntity.ok(projects);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error in getMyStudentProjects: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur interne du serveur");
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ProjectResponseDTO>> getProjectsByStatus(@PathVariable Project.ProjectStatus status) {
        List<ProjectResponseDTO> projects = projectService.getProjectsByStatus(status);
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/active")
    public ResponseEntity<List<ProjectResponseDTO>> getActiveProjects() {
        List<ProjectResponseDTO> projects = projectService.getActiveProjects();
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProjectResponseDTO>> searchProjects(@RequestParam String query) {
        List<ProjectResponseDTO> projects = projectService.searchProjects(query);
        return ResponseEntity.ok(projects);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectRequestDTO projectDetails,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            ProjectResponseDTO updatedProject = projectService.updateProject(id, projectDetails, userDetails.getUsername());
            return ResponseEntity.ok(updatedProject);
        } catch (RuntimeException e) {
            // ✅ CORRECTION : Meilleure gestion des messages d'erreur
            String errorMessage = e.getMessage();
            if (errorMessage.contains("not found") || errorMessage.contains("not found with id")) {
                return ResponseEntity.notFound().build();
            } else if (errorMessage.contains("n'êtes pas") || errorMessage.contains("non autorisé") || 
                       errorMessage.contains("supervisor") || errorMessage.contains("pas le superviseur")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"" + errorMessage + "\"}");
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Erreur\", \"message\": \"" + errorMessage + "\"}");
            }
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            projectService.deleteProject(id, userDetails.getUsername());
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            // ✅ CORRECTION : Meilleure gestion des messages d'erreur
            String errorMessage = e.getMessage();
            if (errorMessage.contains("not found") || errorMessage.contains("not found with id")) {
                return ResponseEntity.notFound().build();
            } else if (errorMessage.contains("n'êtes pas") || errorMessage.contains("non autorisé") || 
                       errorMessage.contains("supervisor") || errorMessage.contains("pas le superviseur")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"" + errorMessage + "\"}");
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Erreur\", \"message\": \"" + errorMessage + "\"}");
            }
        }
    }

    // ✅ Appliquez la même correction à toutes les méthodes de gestion d'étudiants :

    @PostMapping("/{projectId}/students/{studentId}")
    public ResponseEntity<?> addStudentToProject(
            @PathVariable Long projectId,
            @PathVariable Long studentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            projectService.addStudentToProject(projectId, studentId, userDetails.getUsername());
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            // ✅ CORRECTION : Meilleure gestion des messages d'erreur
            String errorMessage = e.getMessage();
            if (errorMessage.contains("not found") || errorMessage.contains("not found with id")) {
                return ResponseEntity.notFound().build();
            } else if (errorMessage.contains("n'êtes pas") || errorMessage.contains("non autorisé") || 
                       errorMessage.contains("supervisor") || errorMessage.contains("pas le superviseur")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"" + errorMessage + "\"}");
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Erreur\", \"message\": \"" + errorMessage + "\"}");
            }
        }
    }

    @DeleteMapping("/{projectId}/students/{studentId}")
    public ResponseEntity<?> removeStudentFromProject(
            @PathVariable Long projectId,
            @PathVariable Long studentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            projectService.removeStudentFromProject(projectId, studentId, userDetails.getUsername());
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            // ✅ CORRECTION : Meilleure gestion des messages d'erreur
            String errorMessage = e.getMessage();
            if (errorMessage.contains("not found") || errorMessage.contains("not found with id")) {
                return ResponseEntity.notFound().build();
            } else if (errorMessage.contains("n'êtes pas") || errorMessage.contains("non autorisé") || 
                       errorMessage.contains("supervisor") || errorMessage.contains("pas le superviseur")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"" + errorMessage + "\"}");
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Erreur\", \"message\": \"" + errorMessage + "\"}");
            }
        }
    }

    @PostMapping("/{projectId}/students")
    public ResponseEntity<?> addStudentsToProject(
            @PathVariable Long projectId,
            @RequestBody List<Long> studentIds,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            projectService.addStudentsToProject(projectId, studentIds, userDetails.getUsername());
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            // ✅ CORRECTION : Meilleure gestion des messages d'erreur
            String errorMessage = e.getMessage();
            if (errorMessage.contains("not found") || errorMessage.contains("not found with id")) {
                return ResponseEntity.notFound().build();
            } else if (errorMessage.contains("n'êtes pas") || errorMessage.contains("non autorisé") || 
                       errorMessage.contains("supervisor") || errorMessage.contains("pas le superviseur")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"" + errorMessage + "\"}");
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Erreur\", \"message\": \"" + errorMessage + "\"}");
            }
        }
    }
}