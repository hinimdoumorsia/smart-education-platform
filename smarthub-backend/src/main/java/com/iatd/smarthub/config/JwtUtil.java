package com.iatd.smarthub.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtUtil {

    // Clé fixe pour éviter les problèmes de signature aléatoire
    private static final String SECRET_STRING = "votre-secret-jwt-tres-securise-et-long-pour-assurer-la-securite-123456789";
    
    // Convertir la chaîne en SecretKey
    private final SecretKey SECRET_KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes(StandardCharsets.UTF_8));
    
    private final long EXPIRATION_TIME = 1000 * 60 * 60 * 10; // 10 heures

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(SECRET_KEY)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (ExpiredJwtException e) {
            throw new RuntimeException("Token expiré", e);
        } catch (MalformedJwtException e) {
            throw new RuntimeException("Token mal formé", e);
        } catch (SignatureException e) {
            throw new RuntimeException("Signature JWT invalide", e);
        } catch (Exception e) {
            throw new RuntimeException("Token invalide: " + e.getMessage(), e);
        }
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // ✅ CORRECTION CRITIQUE : AJOUTER LES RÔLES DANS LE TOKEN
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        
        // Extraire les rôles de l'utilisateur
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
        
        // Ajouter les rôles aux claims
        claims.put("roles", roles);
        
        // Optionnel : Ajouter d'autres informations
        claims.put("username", userDetails.getUsername());
        
        return createToken(claims, userDetails.getUsername());
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(SECRET_KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    // ✅ CORRECTION : Extraire les rôles du token
    public List<String> extractRoles(String token) {
        Claims claims = extractAllClaims(token);
        
        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) claims.get("roles");
        
        return roles != null ? roles : List.of();
    }

    // ✅ CORRECTION : Vérifier si l'utilisateur a un rôle spécifique
    public boolean hasRole(String token, String role) {
        List<String> roles = extractRoles(token);
        return roles.contains(role);
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
    
    // Méthode supplémentaire pour valider juste le token
    public Boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    // ✅ NOUVELLE MÉTHODE : Vérifier l'expiration sans exception
    public boolean isTokenValid(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    // ✅ NOUVELLE MÉTHODE : Extraire toutes les informations du token
    public Map<String, Object> extractAllTokenInfo(String token) {
        Map<String, Object> info = new HashMap<>();
        
        try {
            Claims claims = extractAllClaims(token);
            
            info.put("username", claims.getSubject());
            info.put("issuedAt", claims.getIssuedAt());
            info.put("expiration", claims.getExpiration());
            info.put("roles", claims.get("roles", List.class));
            info.put("isExpired", isTokenExpired(token));
            
        } catch (Exception e) {
            info.put("error", e.getMessage());
        }
        
        return info;
    }
}