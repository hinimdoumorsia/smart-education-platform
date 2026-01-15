package com.iatd.smarthub.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Enumeration;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class JwtRequestFilter extends OncePerRequestFilter {

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String requestURI = request.getRequestURI();
        final String method = request.getMethod();
        
        // 1. LOG TOUT DÉTAILLÉ pour le débogage
        log.debug("=== DEBUT FILTRE JWT ===");
        log.debug("Méthode: {}, URI: {}", method, requestURI);
        
        // Log tous les headers pour voir ce qui arrive
        log.debug("--- Headers reçus ---");
        Enumeration<String> headerNames = request.getHeaderNames();
        if (headerNames != null) {
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                String headerValue = request.getHeader(headerName);
                if ("Authorization".equalsIgnoreCase(headerName)) {
                    log.debug("{}: {}", headerName, headerValue);
                    // Analyse détaillée du token
                    if (headerValue != null && headerValue.startsWith("Bearer ")) {
                        String token = headerValue.substring(7);
                        log.debug("Token ({} chars): {}", token.length(), token);
                        log.debug("Token contient '.' ? {}", token.contains("."));
                        if (token.contains(".")) {
                            int dotCount = 0;
                            for (char c : token.toCharArray()) {
                                if (c == '.') dotCount++;
                            }
                            log.debug("Nombre de points: {}", dotCount);
                        }
                    }
                } else {
                    log.debug("{}: {}", headerName, headerValue);
                }
            }
        }
        
        // 2. Ignorer OPTIONS (CORS)
        if (HttpMethod.OPTIONS.toString().equalsIgnoreCase(method)) {
            log.debug("Ignoring OPTIONS request");
            chain.doFilter(request, response);
            return;
        }

        final String authorizationHeader = request.getHeader("Authorization");

        String username = null;
        String jwt = null;

        // 3. Extraire le token
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            
            // Log détaillé du token
            log.debug("Token extrait ({} caractères)", jwt.length());
            log.debug("Token preview: {}...", 
                jwt.length() > 30 ? jwt.substring(0, 30) : jwt);
            
            try {
                username = jwtUtil.extractUsername(jwt);
                log.debug("Username extrait: {}", username);
            } catch (Exception e) {
                log.error("❌ ERREUR lors de l'extraction du username: {}", e.getMessage());
                log.error("Token complet: {}", jwt);
                log.error("Exception: ", e);
            }
        } else {
            if (authorizationHeader != null) {
                log.warn("Header Authorization mal formaté: {}", authorizationHeader);
                log.warn("Attendu: 'Bearer <token>', Reçu: '{}'", authorizationHeader);
            } else {
                log.warn("⚠️ Pas de header Authorization");
            }
        }

        // 4. Valider le token
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            log.debug("Tentative d'authentification pour: {}", username);
            
            try {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

                if (jwtUtil.validateToken(jwt, userDetails)) {
                    log.info("✅ Token VALIDE pour l'utilisateur: {}", username);
                    
                    UsernamePasswordAuthenticationToken authToken = 
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    
                    log.debug("✅ Authentification configurée pour: {}", username);
                } else {
                    log.warn("⚠️ Token INVALIDE pour: {}", username);
                }
            } catch (Exception e) {
                log.error("❌ Erreur lors du chargement de l'utilisateur {}: {}", username, e.getMessage());
            }
        } else {
            if (username == null) {
                log.debug("Username non extrait - pas d'authentification");
            } else {
                log.debug("Authentification déjà configurée pour: {}", username);
            }
        }

        log.debug("=== FIN FILTRE JWT ===\n");
        chain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        
        // Définir les chemins publics
        boolean isPublicPath = 
            path.startsWith("/api/auth/") || 
            path.equals("/error") ||
            path.contains("/swagger") || 
            path.contains("/api-docs") ||
            path.contains("/v3/api-docs") ||
            path.contains("/webjars/");
        
        if (isPublicPath) {
            log.debug("Chemin public détecté: {}", path);
            return true; // Ne pas appliquer le filtre
        }
        
        return false;
    }
}