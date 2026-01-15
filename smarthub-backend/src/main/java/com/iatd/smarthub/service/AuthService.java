package com.iatd.smarthub.service;

import com.iatd.smarthub.config.JwtUtil;
import com.iatd.smarthub.dto.AuthRequest;
import com.iatd.smarthub.dto.AuthResponse;
import com.iatd.smarthub.dto.RegisterRequest; // AJOUTEZ CECI
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.UserRepository;
import lombok.extern.slf4j.Slf4j; // AJOUTEZ CECI
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Slf4j // AJOUTEZ CECI
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    // ✅ MODIFIEZ CETTE MÉTHODE :
    public AuthResponse register(RegisterRequest registerRequest) {
        log.debug("Début de l'inscription pour: {}", registerRequest.getUsername());
        
        log.debug("Rôle reçu: {}", registerRequest.getRole());
        log.debug("Données complètes reçues: {}", registerRequest);
        
        // 1. Vérifier si l'utilisateur existe déjà
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            log.warn("Nom d'utilisateur déjà utilisé: {}", registerRequest.getUsername());
            throw new RuntimeException("Nom d'utilisateur déjà utilisé");
        }
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            log.warn("Email déjà utilisé: {}", registerRequest.getEmail());
            throw new RuntimeException("Email déjà utilisé");
        }

        // 2. Vérifier que le mot de passe n'est pas null
        if (registerRequest.getPassword() == null || registerRequest.getPassword().trim().isEmpty()) {
            log.warn("Mot de passe null ou vide pour l'utilisateur: {}", registerRequest.getUsername());
            throw new IllegalArgumentException("Le mot de passe est requis");
        }

        // 3. Créer un nouvel utilisateur
        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        
        // 4. Définir les autres champs (avec valeurs par défaut si nécessaire)
        user.setFirstName(registerRequest.getFirstName());
        user.setLastName(registerRequest.getLastName());
        user.setPhoneNumber(registerRequest.getPhoneNumber());
        
        // ⭐⭐⭐⭐ CORRECTION CRITIQUE ICI ⭐⭐⭐⭐
        // Utiliser le rôle envoyé, ou STUDENT par défaut s'il n'est pas fourni
        user.setRole(registerRequest.getRole() != null ? registerRequest.getRole() : User.Role.STUDENT);
        
        user.setActive(true); // Actif par défaut
        
        // 5. Définir les timestamps
        LocalDateTime now = LocalDateTime.now();
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        
        // 6. Sauvegarder
        User savedUser = userRepository.save(user);
        log.info("Utilisateur enregistré avec ID: {} et rôle: {}", savedUser.getId(), savedUser.getRole());

        // 7. Générer le token
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(savedUser.getUsername());
        String token = jwtUtil.generateToken(userDetails);

        log.info("Inscription réussie pour: {} avec rôle: {}", savedUser.getUsername(), savedUser.getRole());
        return new AuthResponse(token, savedUser.getUsername(), savedUser.getRole().name());
    }

    // ✅ GARDEZ CETTE MÉTHODE TEL QUEL OU AJOUTEZ DU LOGGING :
    public AuthResponse login(AuthRequest authRequest) {
        log.debug("Tentative de connexion pour: {}", authRequest.getUsername());
        
        // Authentifier l'utilisateur
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
        );

        // Charger l'utilisateur et générer le token
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(authRequest.getUsername());
        String token = jwtUtil.generateToken(userDetails);

        // Récupérer l'utilisateur pour obtenir le rôle
        User user = userRepository.findByUsername(authRequest.getUsername())
                .orElseThrow(() -> {
                    log.error("Utilisateur non trouvé après authentification: {}", authRequest.getUsername());
                    return new RuntimeException("Utilisateur non trouvé");
                });

        // Mettre à jour la dernière connexion
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        
        log.info("Connexion réussie pour: {}", authRequest.getUsername());
        return new AuthResponse(token, user.getUsername(), user.getRole().name());
    }
}