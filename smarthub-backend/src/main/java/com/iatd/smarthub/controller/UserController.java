package com.iatd.smarthub.controller;

import java.util.stream.Collectors;
import com.iatd.smarthub.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.iatd.smarthub.dto.UserRequestDTO;
import com.iatd.smarthub.dto.UserResponseDTO;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        List<UserResponseDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<UserResponseDTO> createUser(@Valid @RequestBody UserRequestDTO userRequest) {
        try {
            UserResponseDTO createdUser = userService.createUser(userRequest);
            return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(@PathVariable Long id,
            @Valid @RequestBody UserRequestDTO userDetails) {
        try {
            UserResponseDTO updatedUser = userService.updateUser(id, userDetails);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserResponseDTO>> getUsersByRole(@PathVariable User.Role role) {
        List<UserResponseDTO> users = userService.getUsersByRole(role);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<UserResponseDTO> getUserByEmail(@PathVariable String email) {
        return userService.getUserByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
     
    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails.getUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé: " + username));
        
        // Utiliser le constructeur de UserResponseDTO au lieu de setters
        UserResponseDTO userResponse = new UserResponseDTO(user);
        return ResponseEntity.ok(userResponse);
    }

    @GetMapping("/teachers")
    public ResponseEntity<List<UserResponseDTO>> getAllTeachers() {
        List<User> teachers = userRepository.findByRole(User.Role.TEACHER);
        List<UserResponseDTO> response = teachers.stream()
                .map(user -> {
                    // Utiliser le constructeur au lieu de setters
                    UserResponseDTO dto = new UserResponseDTO(user);
                    return dto;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/search/students")
    public ResponseEntity<List<UserResponseDTO>> searchStudents(
            @RequestParam String query) {
        try {
            List<User> students = userRepository.findStudentsBySearchQuery(query);
            List<UserResponseDTO> response = students.stream()
                    .map(user -> {
                        // Utiliser le constructeur au lieu de setters
                        UserResponseDTO dto = new UserResponseDTO(user);
                        return dto;
                    })
                    .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping("/{userId}/profile-image")
    public ResponseEntity<?> uploadProfileImage(
            @PathVariable Long userId,
            @RequestParam("image") MultipartFile file) {
        
        try {
            // Vérifier si le fichier est une image
            if (!file.getContentType().startsWith("image/")) {
                return ResponseEntity.badRequest().body("Le fichier doit être une image");
            }
            
            // Vérifier la taille du fichier (max 5MB)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body("L'image ne doit pas dépasser 5MB");
            }
            
            // Créer le répertoire s'il n'existe pas
            String uploadDir = "uploads/profile-images/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            // Générer un nom de fichier unique
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            
            // Sauvegarder le fichier
            Files.copy(file.getInputStream(), filePath);
            
            // Mettre à jour l'utilisateur avec le chemin de l'image
            User user = userService.findById(userId);
            if (user != null) {
                user.setProfileImage("/uploads/profile-images/" + fileName);
                User updatedUser = userRepository.save(user);
                
                // Utiliser le constructeur de UserResponseDTO
                UserResponseDTO response = new UserResponseDTO(updatedUser);
                return ResponseEntity.ok(response);
            }
            
            return ResponseEntity.notFound().build();
            
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Erreur lors de l'upload de l'image");
        }
    }
    
    @GetMapping("/{userId}/profile-image")
    public ResponseEntity<?> getProfileImage(@PathVariable Long userId) {
        User user = userService.findById(userId);
        if (user == null || user.getProfileImage() == null) {
            return ResponseEntity.notFound().build();
        }
        
        try {
            Path imagePath = Paths.get("." + user.getProfileImage());
            byte[] imageBytes = Files.readAllBytes(imagePath);
            return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(imageBytes);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }
}