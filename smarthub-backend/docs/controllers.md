# Controllers — SmartHub

Ce document décrit les controllers exposant les endpoints REST et donne des signatures d'API et exemples d'utilisation.

Principaux controllers et responsabilités :

- `AuthController` — Authentification, login, refresh token.
  - Endpoints (exemples) :
    - `POST /api/v1/auth/login` — corps `AuthRequest` → retourne `AuthResponse` (JWT + user)
    - `POST /api/v1/auth/register` — corps `RegisterRequest` → retourne `UserResponseDTO`

- `UserController` — CRUD utilisteurs
  - Endpoints (exemples) :
    - `POST /api/v1/users` — crée un utilisateur (`UserRequestDTO`) → 201 + `UserResponseDTO`
    - `GET /api/v1/users/{id}` — récupère `UserResponseDTO`
    - `PUT /api/v1/users/{id}` — met à jour
    - `DELETE /api/v1/users/{id}` — supprime → 204

- `ResourceController` — upload / téléchargement de ressources pédagogiques
  - `POST /api/v1/resources` (multipart) — stocke le fichier via `FileStorageService` et crée `Resource`

- `QuizController` — création et exécution de quiz
  - `POST /api/v1/quizzes` — crée un `Quiz` à partir de `QuizRequestDTO`
  - `GET /api/v1/quizzes/{id}` — retourne `QuizResponseDTO`
  - `POST /api/v1/quizzes/{id}/attempts` — démarre une tentative, crée `QuizAttempt`

- `CourseController`, `ProjectController`, `InternshipController`, `AnnouncementController`, `SubmissionController` — opérations CRUD classiques

Bonnes pratiques observées :
- Chaque endpoint accepte/retourne DTOs (`@Valid` pour validations)
- Les controllers capturent `RuntimeException` et traduisent en codes HTTP (pattern présent dans le projet)
- Les controllers délèguent toute logique métier aux services

Exemple d'implémentation de `createUser` (pattern) :

```java
@PostMapping
public ResponseEntity<UserResponseDTO> createUser(@Valid @RequestBody UserRequestDTO dto) {
    try {
        User user = userService.createUser(dto.toEntity());
        return new ResponseEntity<>(UserResponseDTO.from(user), HttpStatus.CREATED);
    } catch (RuntimeException e) {
        return ResponseEntity.badRequest().build();
    }
}
```