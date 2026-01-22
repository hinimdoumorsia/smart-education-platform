package com.iatd.smarthub.config;

import com.iatd.smarthub.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private JwtRequestFilter jwtRequestFilter;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    // ================= PASSWORD =================
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ================= AUTH PROVIDER =================
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(customUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // ================= SECURITY FILTER =================
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())

            .authorizeHttpRequests(auth -> auth

                // ========= ROUTES PUBLIQUES =========
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/test/**").permitAll()
                .requestMatchers("/error").permitAll()
                
                // AGENT API - PUBLIC POUR TESTS
                .requestMatchers("/api/agent/course-quiz/test").permitAll()
                .requestMatchers("/api/agent/course-quiz/debug/**").permitAll()
                .requestMatchers("/api/agent/course-quiz/force-eligible/**").permitAll()
                .requestMatchers("/api/agent/adaptive-quiz/test").permitAll()  // ✅ AJOUTÉ
                
                // RAG API - PUBLIC POUR TESTS
                .requestMatchers("/api/rag/status").permitAll()
                .requestMatchers("/api/rag/diagnostic").permitAll()
                
                // Course public endpoint - déplacé avant anyRequest()
                .requestMatchers(HttpMethod.GET, "/api/courses/*/public")
                    .permitAll()
                    
                .requestMatchers(HttpMethod.GET, "/api/courses/*/basic-info")
                    .permitAll()

                // ========= AGENT API - AUTH REQUIRED =========
                .requestMatchers("/api/agent/**")
                    .hasAnyRole("STUDENT", "TEACHER", "ADMIN")
                    
                .requestMatchers("/api/agent/adaptive-quiz/**")
                    .hasAnyRole("STUDENT", "TEACHER", "ADMIN")  // ✅ AJOUTÉ
                    
                .requestMatchers("/api/rag/**")
                    .hasAnyRole("STUDENT", "TEACHER", "ADMIN")  // ✅ AJOUTÉ

                // ========= COURS - LECTURE (STUDENT OK) =========
                .requestMatchers(HttpMethod.GET, "/api/courses")
                    .hasAnyRole("STUDENT", "TEACHER", "ADMIN")

                .requestMatchers(HttpMethod.GET, "/api/courses/*")
                    .hasAnyRole("STUDENT", "TEACHER", "ADMIN")

                .requestMatchers(HttpMethod.GET, "/api/courses/*/files")
                    .hasAnyRole("STUDENT", "TEACHER", "ADMIN")

                .requestMatchers(HttpMethod.GET, "/api/courses/files/*/download")
                    .hasAnyRole("STUDENT", "TEACHER", "ADMIN")

                .requestMatchers(HttpMethod.GET, "/api/courses/*/student-count")
                    .hasAnyRole("STUDENT", "TEACHER", "ADMIN")

                // ========= COURS - ÉCRITURE (TEACHER / ADMIN) =========
                .requestMatchers(HttpMethod.POST, "/api/courses/**")
                    .hasAnyRole("TEACHER", "ADMIN")

                .requestMatchers(HttpMethod.PUT, "/api/courses/**")
                    .hasAnyRole("TEACHER", "ADMIN")

                .requestMatchers(HttpMethod.DELETE, "/api/courses/**")
                    .hasAnyRole("TEACHER", "ADMIN")

                // ========= GESTION DES ÉTUDIANTS =========
                .requestMatchers("/api/courses/*/students/**")
                    .hasAnyRole("STUDENT","TEACHER", "ADMIN")

                // ========= FICHIERS =========
                .requestMatchers(HttpMethod.POST, "/api/courses/*/files")
                    .hasAnyRole("TEACHER", "ADMIN")

                .requestMatchers(HttpMethod.DELETE, "/api/courses/files/**")
                    .hasAnyRole("TEACHER", "ADMIN")

                // ========= MES COURS (ENSEIGNANT) =========
                .requestMatchers(HttpMethod.GET, "/api/courses/my-courses")
                    .hasAnyRole("TEACHER", "ADMIN")

                // ========= PAR DÉFAUT (DOIT ÊTRE LE DERNIER) =========
                .anyRequest().authenticated()
            )

            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ================= CORS =================
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",
            "http://localhost:3002",
            "http://localhost:8081",
            "https://smart-education-platform-pied.vercel.app",          // Votre domaine Vercel actuel
            "https://smart-education-platform-*.vercel.app",            // Tous les sous-domaines Vercel
            "https://smart-education-platform.onrender.com" ,
            "https://smart-education-platform-3qsejixj2.vercel.app"// Votre backend lui-même
        ));
        config.setAllowedMethods(Arrays.asList("GET","POST","PUT","DELETE","OPTIONS","PATCH","HEAD"));
        config.setAllowedHeaders(Arrays.asList("Authorization","Content-Type","Accept","X-Requested-With","Origin"));
        config.setExposedHeaders(Arrays.asList("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // ================= ACCESS DENIED =================
    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, ex) -> {
            response.setStatus(403);
            response.setContentType("application/json");
            response.getWriter()
                    .write("{\"error\":\"Accès refusé\", \"message\":\"" + 
                           ex.getMessage() + "\", \"path\":\"" + 
                           request.getRequestURI() + "\"}");
        };
    }
}
