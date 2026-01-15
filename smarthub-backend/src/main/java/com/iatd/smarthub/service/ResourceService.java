package com.iatd.smarthub.service;

import com.iatd.smarthub.dto.ResourceRequestDTO;
import com.iatd.smarthub.dto.ResourceResponseDTO;
import com.iatd.smarthub.model.resource.Resource;
import com.iatd.smarthub.dto.UserBasicDTO;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final UserService userService;
    private final FileStorageService fileStorageService;

    // ✅ MODIFIÉ : Ajout du paramètre username pour l'auteur connecté
    public ResourceResponseDTO createResource(ResourceRequestDTO resourceRequest, String username) {
        Resource resource = new Resource();
        resource.setTitle(resourceRequest.getTitle());
        resource.setAbstractText(resourceRequest.getAbstractText());
        resource.setPublicationDate(resourceRequest.getPublicationDate());
        resource.setType(resourceRequest.getType());

        // ✅ Gérer la liste des auteurs
        List<User> authors = new ArrayList<>();
        
        // ✅ Ajouter l'utilisateur connecté comme auteur principal
        User currentUser = userService.getUserEntityByUsername(username);
        authors.add(currentUser);

        // ✅ Ajouter les auteurs supplémentaires si fournis
        if (resourceRequest.getAuthorIds() != null && !resourceRequest.getAuthorIds().isEmpty()) {
            for (Long authorId : resourceRequest.getAuthorIds()) {
                User author = userService.getUserEntityById(authorId);
                if (!authors.contains(author)) {
                    authors.add(author);
                }
            }
        }

        resource.setAuthors(authors);

        // ✅ Gérer l'upload du fichier
        if (resourceRequest.getFile() != null && !resourceRequest.getFile().isEmpty()) {
            try {
                MultipartFile file = resourceRequest.getFile();
                String storedFileName = fileStorageService.storeFile(file);
                
                resource.setOriginalFileName(file.getOriginalFilename());
                resource.setStoredFileName(storedFileName);
                resource.setFileSize(file.getSize());
                resource.setFileType(file.getContentType());
            } catch (IOException e) {
                throw new RuntimeException("Erreur lors de l'upload du fichier: " + e.getMessage());
            }
        }

        Resource savedResource = resourceRepository.save(resource);
        return convertToDTO(savedResource);
    }

    @Transactional(readOnly = true)
    public List<ResourceResponseDTO> getAllResources() {
        // ✅ Utiliser la méthode avec JOIN FETCH
        return resourceRepository.findAllWithAuthors().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<ResourceResponseDTO> getResourceById(Long id) {
        // ✅ Utiliser la méthode avec JOIN FETCH
        return resourceRepository.findByIdWithAuthors(id)
                .map(this::convertToDTO);
    }

    // ✅ NOUVEAU : Récupérer les ressources par username de l'auteur
    @Transactional(readOnly = true)
    public List<ResourceResponseDTO> getResourcesByAuthorUsername(String username) {
        User author = userService.getUserEntityByUsername(username);
        return resourceRepository.findByAuthorId(author.getId()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ✅ Garder l'ancienne méthode pour compatibilité
    @Transactional(readOnly = true)
    public List<ResourceResponseDTO> getResourcesByAuthor(Long authorId) {
        return resourceRepository.findByAuthorId(authorId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ResourceResponseDTO> getResourcesByType(Resource.ResourceType type) {
        return resourceRepository.findByType(type).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ResourceResponseDTO> searchResources(String query) {
        return resourceRepository.searchByTitleOrAbstract(query).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ✅ MODIFIÉ : Ajout de la vérification de propriété
    public ResourceResponseDTO updateResource(Long id, ResourceRequestDTO resourceDetails, String username) {
        Resource existingResource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + id));

        // ✅ Vérifier que l'utilisateur est un auteur de la ressource
        User currentUser = userService.getUserEntityByUsername(username);
        boolean isAuthor = existingResource.getAuthors().stream()
                .anyMatch(author -> author.getId().equals(currentUser.getId()));
        
        if (!isAuthor && currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Vous n'êtes pas un auteur de cette ressource");
        }

        // Mettre à jour les champs
        existingResource.setTitle(resourceDetails.getTitle());
        existingResource.setAbstractText(resourceDetails.getAbstractText());
        existingResource.setPublicationDate(resourceDetails.getPublicationDate());
        existingResource.setType(resourceDetails.getType());

        // Mettre à jour les auteurs si fournis
        if (resourceDetails.getAuthorIds() != null) {
            List<User> authors = resourceDetails.getAuthorIds().stream()
                    .map(userService::getUserEntityById)
                    .collect(Collectors.toList());
            existingResource.setAuthors(authors);
        }

        // Gérer l'upload du fichier si fourni
        if (resourceDetails.getFile() != null && !resourceDetails.getFile().isEmpty()) {
            try {
                MultipartFile file = resourceDetails.getFile();
                String storedFileName = fileStorageService.storeFile(file);
                
                existingResource.setOriginalFileName(file.getOriginalFilename());
                existingResource.setStoredFileName(storedFileName);
                existingResource.setFileSize(file.getSize());
                existingResource.setFileType(file.getContentType());
            } catch (IOException e) {
                throw new RuntimeException("Erreur lors de l'upload du fichier: " + e.getMessage());
            }
        }

        Resource updatedResource = resourceRepository.save(existingResource);
        return convertToDTO(updatedResource);
    }

    // ✅ MODIFIÉ : Ajout de la vérification de propriété
    public void deleteResource(Long id, String username) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + id));

        // ✅ Vérifier que l'utilisateur est un auteur de la ressource
        User currentUser = userService.getUserEntityByUsername(username);
        boolean isAuthor = resource.getAuthors().stream()
                .anyMatch(author -> author.getId().equals(currentUser.getId()));
        
        if (!isAuthor && currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Vous n'êtes pas un auteur de cette ressource");
        }

        // Supprimer le fichier physique si existe
        if (resource.getStoredFileName() != null) {
            try {
                fileStorageService.deleteFile(resource.getStoredFileName());
            } catch (IOException e) {
                throw new RuntimeException("Erreur lors de la suppression du fichier: " + e.getMessage());
            }
        }

        resourceRepository.delete(resource);
    }

    private ResourceResponseDTO convertToDTO(Resource resource) {
        ResourceResponseDTO dto = new ResourceResponseDTO();
        dto.setId(resource.getId());
        dto.setTitle(resource.getTitle());
        dto.setAbstractText(resource.getAbstractText());
        dto.setPublicationDate(resource.getPublicationDate());
        dto.setOriginalFileName(resource.getOriginalFileName());
        dto.setFileSize(resource.getFileSize());
        dto.setFileType(resource.getFileType());
        dto.setType(resource.getType());
        dto.setCreatedAt(resource.getCreatedAt());
        dto.setUpdatedAt(resource.getUpdatedAt());

        // ✅ Convertir les auteurs en UserBasicDTO
        if (resource.getAuthors() != null) {
            dto.setAuthors(resource.getAuthors().stream()
                    .map(author -> {
                        UserBasicDTO authorDTO = new UserBasicDTO();
                        authorDTO.setId(author.getId());
                        authorDTO.setUsername(author.getUsername());
                        authorDTO.setEmail(author.getEmail());
                        authorDTO.setFirstName(author.getFirstName());
                        authorDTO.setLastName(author.getLastName());
                        authorDTO.setRole(author.getRole() != null ? author.getRole().name() : null);
                        return authorDTO;
                    })
                    .collect(Collectors.toList()));
        }

        // ✅ Générer l'URL de téléchargement
        if (resource.getStoredFileName() != null) {
            dto.setFileDownloadUrl("/api/resources/files/" + resource.getStoredFileName());
        }

        return dto;
    }
}
