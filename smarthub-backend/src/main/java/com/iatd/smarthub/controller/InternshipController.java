package com.iatd.smarthub.controller;

import com.iatd.smarthub.dto.InternshipRequestDTO;
import com.iatd.smarthub.dto.InternshipResponseDTO;
import com.iatd.smarthub.model.internship.Internship;
import com.iatd.smarthub.service.InternshipService;
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
@RequestMapping("/api/internships")
@RequiredArgsConstructor
@Slf4j
public class InternshipController {

    private final InternshipService internshipService;

    @PostMapping
    public ResponseEntity<?> createInternship(
            @Valid @RequestBody InternshipRequestDTO internshipRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            // ✅ SEULS les STUDENTS peuvent créer leur stage
            boolean isStudent = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> 
                        grantedAuthority.getAuthority().equals("ROLE_STUDENT"));
            
            if (!isStudent) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Seuls les étudiants peuvent créer leurs stages\"}");
            }

            InternshipResponseDTO createdInternship = internshipService.createInternship(internshipRequest, userDetails.getUsername());
            return new ResponseEntity<>(createdInternship, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("{\"error\": \"Accès refusé\", \"message\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            log.error("Unexpected error in createInternship: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur interne du serveur");
        }
    }

    @GetMapping
    public ResponseEntity<List<InternshipResponseDTO>> getAllInternships() {
        List<InternshipResponseDTO> internships = internshipService.getAllInternships();
        return ResponseEntity.ok(internships);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InternshipResponseDTO> getInternshipById(@PathVariable Long id) {
        return internshipService.getInternshipById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/my-internships")
    public ResponseEntity<?> getMyStudentInternships(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            // ✅ Vérification que c'est un étudiant
            boolean isStudent = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> 
                        grantedAuthority.getAuthority().equals("ROLE_STUDENT"));
            
            if (!isStudent) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Seuls les étudiants peuvent accéder à cette fonctionnalité\"}");
            }

            List<InternshipResponseDTO> internships = internshipService.getInternshipsByStudentUsername(userDetails.getUsername());
            return ResponseEntity.ok(internships);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error in getMyStudentInternships: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur interne du serveur");
        }
    }

    @GetMapping("/my-supervisions")
    public ResponseEntity<?> getMySupervisorInternships(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            // ✅ CORRECTION : Vérification plus robuste des rôles
            boolean isTeacher = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> {
                        String authority = grantedAuthority.getAuthority();
                        return authority.equals("ROLE_TEACHER") || 
                               authority.equals("TEACHER") || 
                               authority.equals("ROLE_ADMIN") || 
                               authority.equals("ADMIN");
                    });
            
            if (!isTeacher) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Seuls les enseignants et administrateurs peuvent accéder à cette fonctionnalité\"}");
            }

            List<InternshipResponseDTO> internships = internshipService.getInternshipsBySupervisorUsername(userDetails.getUsername());
            return ResponseEntity.ok(internships);
        } catch (RuntimeException e) {
            log.error("Error in getMySupervisorInternships: {}", e.getMessage(), e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Unexpected error in getMySupervisorInternships: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur interne du serveur");
        }
    }

    @GetMapping("/company/{company}")
    public ResponseEntity<List<InternshipResponseDTO>> getInternshipsByCompany(@PathVariable String company) {
        List<InternshipResponseDTO> internships = internshipService.getInternshipsByCompany(company);
        return ResponseEntity.ok(internships);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<InternshipResponseDTO>> getInternshipsByStatus(
            @PathVariable Internship.InternshipStatus status) {
        List<InternshipResponseDTO> internships = internshipService.getInternshipsByStatus(status);
        return ResponseEntity.ok(internships);
    }

    @GetMapping("/active")
    public ResponseEntity<List<InternshipResponseDTO>> getActiveInternships() {
        List<InternshipResponseDTO> internships = internshipService.getActiveInternships();
        return ResponseEntity.ok(internships);
    }

    @GetMapping("/search")
    public ResponseEntity<List<InternshipResponseDTO>> searchInternships(@RequestParam String query) {
        List<InternshipResponseDTO> internships = internshipService.searchInternships(query);
        return ResponseEntity.ok(internships);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateInternship(
            @PathVariable Long id,
            @Valid @RequestBody InternshipRequestDTO internshipDetails,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            InternshipResponseDTO updatedInternship = internshipService.updateInternship(id, internshipDetails, userDetails.getUsername());
            return ResponseEntity.ok(updatedInternship);
        } catch (RuntimeException e) {
            // ✅ Gestion différenciée des erreurs
            String errorMessage = e.getMessage();
            if (errorMessage.contains("not found") || errorMessage.contains("not found with id")) {
                return ResponseEntity.notFound().build();
            } else if (errorMessage.contains("n'êtes pas") || errorMessage.contains("non autorisé") || 
                       errorMessage.contains("étudiant") || errorMessage.contains("student")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"" + errorMessage + "\"}");
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Erreur\", \"message\": \"" + errorMessage + "\"}");
            }
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInternship(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            internshipService.deleteInternship(id, userDetails.getUsername());
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            // ✅ Gestion différenciée des erreurs
            String errorMessage = e.getMessage();
            if (errorMessage.contains("not found") || errorMessage.contains("not found with id")) {
                return ResponseEntity.notFound().build();
            } else if (errorMessage.contains("n'êtes pas") || errorMessage.contains("non autorisé") || 
                       errorMessage.contains("étudiant") || errorMessage.contains("student")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"" + errorMessage + "\"}");
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Erreur\", \"message\": \"" + errorMessage + "\"}");
            }
        }
    }
}