package com.iatd.smarthub.service;

import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;

@Service
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.info("🔍 [CUSTOM_USER_DETAILS] Tentative de chargement de l'utilisateur: {}", username);
        
        // 1. Recherche de l'utilisateur
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.error("❌ [CUSTOM_USER_DETAILS] Utilisateur NON TROUVÉ: {}", username);
                    return new UsernameNotFoundException("Utilisateur non trouvé: " + username);
                });

        // 2. Log des informations utilisateur
        log.info("✅ [CUSTOM_USER_DETAILS] Utilisateur TROUVÉ:");
        log.info("   📌 Username: {}", user.getUsername());
        log.info("   📌 ID: {}", user.getId());
        log.info("   📌 Rôle: {}", user.getRole());
        log.info("   📌 Email: {}", user.getEmail());
        log.info("   📌 Prénom: {}", user.getFirstName());
        log.info("   📌 Nom: {}", user.getLastName());
        
        // 3. Génération des authorities
        Collection<? extends GrantedAuthority> authorities = getAuthorities(user);
        log.info("🔑 [CUSTOM_USER_DETAILS] Authorities générées: {}", authorities);

        // 4. Création du UserDetails Spring Security
        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                user.getUsername(), 
                user.getPassword(),
                authorities
        );
        
        log.info("✅ [CUSTOM_USER_DETAILS] UserDetails créé avec succès pour: {}", username);
        log.info("📊 [CUSTOM_USER_DETAILS] Vérification:");
        log.info("   - Username dans UserDetails: {}", userDetails.getUsername());
        log.info("   - Password non vide: {}", userDetails.getPassword() != null && !userDetails.getPassword().isEmpty());
        log.info("   - Account non expiré: {}", userDetails.isAccountNonExpired());
        log.info("   - Account non vérouillé: {}", userDetails.isAccountNonLocked());
        log.info("   - Credentials non expirés: {}", userDetails.isCredentialsNonExpired());
        log.info("   - Account activé: {}", userDetails.isEnabled());
        log.info("   - Nombre d'authorities: {}", userDetails.getAuthorities().size());
        
        log.info("==================================================");
        
        return userDetails;
    }

    private Collection<? extends GrantedAuthority> getAuthorities(User user) {
        // Construction du rôle au format Spring Security
        String roleName = user.getRole().name();
        String springRole = "ROLE_" + roleName;
        
        log.debug("🎯 [CUSTOM_USER_DETAILS] Création de l'authority: {} (depuis {})", springRole, roleName);
        
        return Collections.singletonList(new SimpleGrantedAuthority(springRole));
    }
    
    // Méthode supplémentaire pour debug
    public void debugUser(String username) {
        try {
            UserDetails userDetails = loadUserByUsername(username);
            log.info("🔍 [DEBUG] UserDetails pour {}:", username);
            log.info("   - Username: {}", userDetails.getUsername());
            log.info("   - Authorities: {}", userDetails.getAuthorities());
        } catch (UsernameNotFoundException e) {
            log.error("❌ [DEBUG] Utilisateur {} non trouvé", username);
        }
    }
}