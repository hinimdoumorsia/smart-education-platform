package com.iatd.smarthub.config;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) 
            throws IOException, ServletException {
        
        HttpServletResponse response = (HttpServletResponse) res;
        HttpServletRequest request = (HttpServletRequest) req;
        
        // Récupérer l'origine de la requête
        String origin = request.getHeader("Origin");
        
        // Déterminer quelle origine autoriser
        String allowedOrigin = determineAllowedOrigin(origin);
        
        if (!allowedOrigin.isEmpty()) {
            response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
        }
        
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD");
        response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, X-Requested-With, Origin");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setHeader("Access-Control-Max-Age", "3600");
        response.setHeader("Access-Control-Expose-Headers", "Authorization");
        
        // Si c'est une requête OPTIONS, répondre immédiatement
        if (HttpMethod.OPTIONS.toString().equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return; // Ne pas continuer la chaîne de filtres
        }
        
        chain.doFilter(req, res);
    }

    private String determineAllowedOrigin(String origin) {
        if (origin == null) {
            return "http://localhost:3000"; // Par défaut
        }
        
        // Liste des origines autorisées
        if (origin.startsWith("http://localhost:")) {
            return origin; // Autoriser tous les localhost
        }
        
        // Vercel domains - CORRECTION DU REGEX
        if (origin.equals("https://smart-education-platform-3qsejixj2.vercel.app") ||
            origin.equals("https://smart-education-platform-pied.vercel.app") ||
            origin.matches("^https://smart-education-platform-[a-zA-Z0-9]+\\.vercel\\.app$") ||
            origin.matches("^https://smart-education-platform-[a-zA-Z0-9]+-[a-zA-Z0-9]+\\.vercel\\.app$")) {
            return origin;
        }
        
        // Render backend
        if (origin.equals("https://smart-education-platform.onrender.com")) {
            return origin;
        }
        
        // Par défaut, refuser (retourner une origine vide)
        return "";
    }

    @Override
    public void init(FilterConfig filterConfig) {
        // Initialisation si nécessaire
    }

    @Override
    public void destroy() {
        // Nettoyage si nécessaire
    }
}
