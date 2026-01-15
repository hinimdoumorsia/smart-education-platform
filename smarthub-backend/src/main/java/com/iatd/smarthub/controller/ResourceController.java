package com.iatd.smarthub.controller;

import com.iatd.smarthub.dto.ResourceRequestDTO;
import com.iatd.smarthub.dto.ResourceResponseDTO;
import com.iatd.smarthub.model.resource.Resource;
import com.iatd.smarthub.service.FileStorageService;
import com.iatd.smarthub.service.ResourceService;
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
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
@Slf4j
public class ResourceController {

    private final ResourceService resourceService;
    private final FileStorageService fileStorageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createResource(
            @Valid @ModelAttribute ResourceRequestDTO resourceRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            ResourceResponseDTO createdResource = resourceService.createResource(resourceRequest, userDetails.getUsername());
            return new ResponseEntity<>(createdResource, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("{\"error\": \"Accès refusé\", \"message\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            log.error("Unexpected error in createResource: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur interne du serveur");
        }
    }

    @GetMapping
    public ResponseEntity<List<ResourceResponseDTO>> getAllResources() {
        List<ResourceResponseDTO> resources = resourceService.getAllResources();
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponseDTO> getResourceById(@PathVariable Long id) {
        return resourceService.getResourceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Endpoint pour télécharger le fichier - accessible sans restriction de rôle
    @GetMapping("/files/{fileName}")
    public ResponseEntity<org.springframework.core.io.Resource> downloadFile(@PathVariable String fileName) {
        try {
            byte[] fileContent = fileStorageService.loadFile(fileName);
            org.springframework.core.io.Resource fileResource = new ByteArrayResource(fileContent);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(fileResource);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateResource(
            @PathVariable Long id,
            @Valid @ModelAttribute ResourceRequestDTO resourceDetails,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            ResourceResponseDTO updatedResource = resourceService.updateResource(id, resourceDetails, userDetails.getUsername());
            return ResponseEntity.ok(updatedResource);
        } catch (RuntimeException e) {
            // ✅ Gestion différenciée des erreurs
            if (e.getMessage().contains("not found") || e.getMessage().contains("not found with id")) {
                return ResponseEntity.notFound().build();
            } else if (e.getMessage().contains("n'êtes pas") || e.getMessage().contains("non autorisé") || 
                       e.getMessage().contains("auteur") || e.getMessage().contains("author")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"" + e.getMessage() + "\"}");
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Erreur\", \"message\": \"" + e.getMessage() + "\"}");
            }
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResource(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            resourceService.deleteResource(id, userDetails.getUsername());
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            // ✅ Gestion différenciée des erreurs
            if (e.getMessage().contains("not found") || e.getMessage().contains("not found with id")) {
                return ResponseEntity.notFound().build();
            } else if (e.getMessage().contains("n'êtes pas") || e.getMessage().contains("non autorisé") || 
                       e.getMessage().contains("auteur") || e.getMessage().contains("author")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"" + e.getMessage() + "\"}");
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Erreur\", \"message\": \"" + e.getMessage() + "\"}");
            }
        }
    }

    @GetMapping("/my-resources")
    public ResponseEntity<?> getMyResources(@AuthenticationPrincipal UserDetails userDetails) {
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

            List<ResourceResponseDTO> resources = resourceService.getResourcesByAuthorUsername(userDetails.getUsername());
            return ResponseEntity.ok(resources);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error in getMyResources: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur interne du serveur");
        }
    }

    @GetMapping("/author/{authorId}")
    public ResponseEntity<List<ResourceResponseDTO>> getResourcesByAuthor(@PathVariable Long authorId) {
        List<ResourceResponseDTO> resources = resourceService.getResourcesByAuthor(authorId);
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<ResourceResponseDTO>> getResourcesByType(
            @PathVariable Resource.ResourceType type) {
        List<ResourceResponseDTO> resources = resourceService.getResourcesByType(type);
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/search")
    public ResponseEntity<List<ResourceResponseDTO>> searchResources(@RequestParam String query) {
        List<ResourceResponseDTO> resources = resourceService.searchResources(query);
        return ResponseEntity.ok(resources);
    }
}
