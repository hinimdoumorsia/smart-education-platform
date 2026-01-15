# DTOs — SmartHub

Les DTOs définissent le contrat HTTP entre client et serveur. Les `Request` DTOs contiennent les validations (`@NotBlank`, `@Email`), les `Response` DTOs n'exposent pas de champs sensibles (pas de mot de passe).

Exemples importants :

- `UserRequestDTO`
  - `String username` (required)
  - `String email` (`@Email`)
  - `String password` (required)
  - `Role role` (optional)
  - `User toEntity()` — convertit DTO -> `User`

- `UserResponseDTO`
  - `Long id`, `String username`, `String email`, `Role role`, `Timestamp createdAt` — constructeur explicite (pas de password)

- `AuthRequest` / `AuthResponse`
  - `AuthRequest` : `usernameOrEmail`, `password`
  - `AuthResponse` : `token`, `expiresIn`, `UserBasicDTO`

- `QuizRequestDTO` / `QuizResponseDTO` / `QuizSummaryDTO`
  - Représentation légère pour l'API (questions, durée, tags)

- `CourseRequestDTO` / `CourseResponseDTO` — metadata et liens vers `CourseFileDTO`

Bonnes pratiques :
- Validation côté API via annotations
- Conversion explicite DTO <-> Entity pour garder séparation des couches