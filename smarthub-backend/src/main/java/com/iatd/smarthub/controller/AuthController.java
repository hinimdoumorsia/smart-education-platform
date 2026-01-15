package com.iatd.smarthub.controller;

import com.iatd.smarthub.dto.AuthRequest;
import com.iatd.smarthub.dto.AuthResponse;
import com.iatd.smarthub.dto.ForgotPasswordRequest;
import com.iatd.smarthub.dto.ResetPasswordRequest;
import com.iatd.smarthub.dto.RegisterRequest; // AJOUTEZ CECI
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.UserRepository;
import com.iatd.smarthub.service.AuthService;
import com.iatd.smarthub.service.EmailService;
import jakarta.validation.Valid; // AJOUTEZ CECI
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3002")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    // ✅ MODIFIEZ SEULEMENT CETTE MÉTHODE :
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            log.info("Tentative d'inscription pour: {}", registerRequest.getUsername());
            
            AuthResponse authResponse = authService.register(registerRequest);
            
            // Récupérer l'utilisateur pour l'email
            Optional<User> user = userRepository.findByUsername(registerRequest.getUsername());
            
            // Envoyer un email de bienvenue
            if (user.isPresent()) {
                try {
                    emailService.sendWelcomeEmail(user.get().getEmail(), user.get().getUsername());
                    log.info("Email de bienvenue envoyé à: {}", user.get().getEmail());
                } catch (Exception e) {
                    log.warn("Impossible d'envoyer l'email de bienvenue: {}", e.getMessage());
                    // Ne pas échouer l'inscription si l'email échoue
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Inscription réussie");
            response.put("data", authResponse);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.warn("Validation échouée pour l'inscription: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
            
        } catch (RuntimeException e) {
            log.warn("Erreur métier lors de l'inscription: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
            
        } catch (Exception e) {
            log.error("Erreur inattendue lors de l'inscription: ", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur lors de l'inscription");
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ✅ MODIFIEZ AUSSI CETTE MÉTHODE :
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest authRequest) {
        try {
            AuthResponse authResponse = authService.login(authRequest);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Connexion réussie");
            response.put("data", authResponse);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.warn("Échec de l'authentification pour {}: {}", 
                    authRequest.getUsername(), e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Échec de l'authentification");
            errorResponse.put("error", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
    }

    // ✅ GARDEZ TOUTES LES AUTRES MÉTHODES TEL QUEL :
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("API d'authentification fonctionne !");
    }
    
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            log.info("Demande de réinitialisation pour email: {}", request.getEmail());
            
            // 1. Vérifier si l'email existe
            Optional<User> user = userRepository.findByEmail(request.getEmail());
            
            // Pour des raisons de sécurité, on donne toujours la même réponse
            Map<String, String> response = new HashMap<>();
            response.put("message", "Si votre email est enregistré, vous recevrez un lien de réinitialisation");
            
            if (user.isEmpty()) {
                log.warn("Email non trouvé: {}", request.getEmail());
                return ResponseEntity.ok(response);
            }

            // 2. Générer un token de réinitialisation
            String resetToken = UUID.randomUUID().toString();
            User userToUpdate = user.get();
            userToUpdate.setResetToken(resetToken);
            userToUpdate.setResetTokenExpiry(LocalDateTime.now().plusHours(2));
            userToUpdate.setResetTokenCreatedAt(LocalDateTime.now());
            userRepository.save(userToUpdate);

            // 3. Envoyer l'email réel
            try {
                emailService.sendPasswordResetEmail(user.get().getEmail(), resetToken);
                log.info("Email de réinitialisation envoyé à: {}", request.getEmail());
                
                // En développement, on peut aussi logger le lien pour faciliter les tests
                String resetLink = "http://localhost:3000/reset-password?token=" + resetToken;
                log.debug("Lien de réinitialisation (DEV ONLY): {}", resetLink);
                
            } catch (Exception e) {
                log.error("Erreur lors de l'envoi de l'email: {}", e.getMessage());
                // Ne pas exposer l'erreur à l'utilisateur pour des raisons de sécurité
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Erreur dans forgot-password: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la demande de réinitialisation");
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            log.info("Tentative de réinitialisation avec token");
            
            // 1. Trouver l'utilisateur par token
            Optional<User> user = userRepository.findByResetToken(request.getToken());
            
            if (user.isEmpty()) {
                log.warn("Token invalide: {}", request.getToken());
                return ResponseEntity.badRequest().body("Token de réinitialisation invalide");
            }
            
            User userToUpdate = user.get();
            
            // 2. Vérifier l'expiration du token
            if (userToUpdate.getResetTokenExpiry() == null || 
                userToUpdate.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
                log.warn("Token expiré pour l'utilisateur: {}", userToUpdate.getEmail());
                return ResponseEntity.badRequest().body("Le lien de réinitialisation a expiré");
            }

            // 3. Vérifier la force du mot de passe
            if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
                return ResponseEntity.badRequest().body("Le mot de passe doit contenir au moins 6 caractères");
            }

            // 4. Mettre à jour le mot de passe
            userToUpdate.setPassword(passwordEncoder.encode(request.getNewPassword()));
            userToUpdate.setResetToken(null);
            userToUpdate.setResetTokenExpiry(null);
            userToUpdate.setResetTokenCreatedAt(null);
            userRepository.save(userToUpdate);

            log.info("Mot de passe réinitialisé avec succès pour: {}", userToUpdate.getEmail());
            
            return ResponseEntity.ok("Mot de passe réinitialisé avec succès");
            
        } catch (Exception e) {
            log.error("Erreur dans reset-password: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la réinitialisation du mot de passe");
        }
    }
}