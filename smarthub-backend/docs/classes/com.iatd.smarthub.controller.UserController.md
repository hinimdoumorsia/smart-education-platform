# com.iatd.smarthub.controller.UserController

Rôle
- Expose les endpoints REST pour la gestion des utilisateurs (/api/v1/users).
- Valide les DTOs reçus, délègue la logique métier à `UserService` et transforme les entités en `UserResponseDTO`.

Emplacement
- `src/main/java/com/iatd/smarthub/controller/UserController.java`

Annotations principales
- `@RestController`
- `@RequestMapping("/api/v1/users")`
- `@RequiredArgsConstructor`

Dépendances injectées
- `private final UserService userService`
- `private final UserRepository userRepository`

Principaux endpoints / signatures
- `@GetMapping`
  - `public ResponseEntity<List<UserResponseDTO>> getAllUsers()`
- `@GetMapping("/{id}")`
  - `public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id)`
- `@PostMapping`
  - `public ResponseEntity<UserResponseDTO> createUser(@Valid @RequestBody UserRequestDTO userRequest)`
- `@PutMapping("/{id}")`
  - `public ResponseEntity<UserResponseDTO> updateUser(@PathVariable Long id, @Valid @RequestBody UserRequestDTO userDetails)`
- `@DeleteMapping("/{id}")`
  - `public ResponseEntity<Void> deleteUser(@PathVariable Long id)`
- `@GetMapping("/role/{role}")`
  - `public ResponseEntity<List<UserResponseDTO>> getUsersByRole(@PathVariable User.Role role)`
- `@GetMapping("/me")`
  - `public ResponseEntity<UserResponseDTO> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails)`
- Profile image upload/download endpoints (multipart handling):
  - `@PostMapping("/{userId}/profile-image")`
  - `@GetMapping("/{userId}/profile-image")`

Comportement important
- Les controllers retournent des codes HTTP appropriés : 201 (création), 204 (delete), 404 (not found), 400 (bad request).
- Les uploads sont sauvegardés dans `uploads/profile-images/` et le chemin est stocké dans l'entité `User`.

Exemple d'appel (curl)

```bash
curl -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"username":"ali","email":"ali@example.com","password":"Secret123","role":"STUDENT"}'
```

Notes
- La validation est réalisée via annotations sur `UserRequestDTO`.
- Toute logique métier (unicité, encodage du mot de passe) doit se trouver dans `UserService`.
