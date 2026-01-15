# com.iatd.smarthub.config.SecurityConfig

Rôle
- Configure Spring Security pour l'application : filtres JWT, provider DAO, password encoder, CORS, politiques d'accès.

Emplacement
- `src/main/java/com/iatd/smarthub/config/SecurityConfig.java`

Annotations
- `@Configuration`, `@EnableWebSecurity`, `@EnableMethodSecurity(prePostEnabled = true)`

Beans exposés
- `PasswordEncoder passwordEncoder()` → `new BCryptPasswordEncoder()`
- `DaoAuthenticationProvider authenticationProvider()` → configure `customUserDetailsService` + `passwordEncoder`
- `AuthenticationManager authenticationManager(AuthenticationConfiguration)`
- `SecurityFilterChain filterChain(HttpSecurity)` → configuration des routes publiques/protégées, session stateless, ajout du `JwtRequestFilter`
- `CorsConfigurationSource corsConfigurationSource()` → origines autorisées (localhost:3000, 3002, 8081)
- `AccessDeniedHandler accessDeniedHandler()` → renvoie JSON d'erreur

Points clés
- Routes publiques incluent `/api/auth/**`, certaines routes RAG/agent pour tests.
- Beaucoup d'API liées aux cours exigent des rôles (`hasAnyRole("STUDENT","TEACHER","ADMIN")` etc.).
- Session management mis en `SessionCreationPolicy.STATELESS` (JWT stateless).

Recommandations
- Externaliser les origines CORS en propriété ou profile pour production.
- Vérifier que seules les routes de test RAG/agent sont publiques en prod.

Extrait de sécurité (pseudocode)
```java
http.cors(...).csrf(...)
  .authorizeHttpRequests(auth -> auth
     .requestMatchers("/api/auth/**").permitAll()
     .requestMatchers("/api/agent/**").hasAnyRole("STUDENT","TEACHER","ADMIN")
     .anyRequest().authenticated()
  )
  .sessionManagement(...stateless...)
  .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
```