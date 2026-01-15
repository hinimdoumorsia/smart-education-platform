# Configurations importantes — SmartHub

Fichiers et beans de configuration essentiels :

- `application.properties` — DB, JPA, uploads, JWT, Gemini/Ollama, RAG, SMTP
  - Exemples : `spring.datasource.url`, `spring.jpa.hibernate.ddl-auto=update`, `file.upload-dir`, `jwt.secret`, `gemini.api.key`

- `SecurityConfig` — configure Spring Security : endpoints publics, filtres JWT (`JwtRequestFilter`), `PasswordEncoder` bean (BCrypt), `UserDetailsService` (CustomUserDetailsService)

- `JwtUtil` — utilitaires pour signer/valider tokens (algorithme HS256, secret + expiration)

- `JwtRequestFilter` — filtre `OncePerRequestFilter` qui : récupère le header `Authorization`, valide token, place `Authentication` dans `SecurityContext`

- `CorsFilter` / `WebConfig` — règle CORS pour `/api/**` (origines autorisées dans `application.properties`)

- `RestTemplateConfig` — bean `RestTemplate`/`WebClient` pour appels externes (Gemini/Ollama)

- `OllamaConfig` — configuration pour appeler un moteur IA local (endpoint, timeout)

Sécurité :
- Remplace les secrets dans `application.properties` par variables d'environnement (ex: `JWT_SECRET=${JWT_SECRET}`) avant déploiement.
- Assure-toi d'encoder les mots de passe via `PasswordEncoder` dans `UserService`.