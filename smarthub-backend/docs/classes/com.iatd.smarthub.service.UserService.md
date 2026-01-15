# com.iatd.smarthub.service.UserService

Rôle
- Logique métier pour les utilisateurs : création, lecture, mise à jour, suppression.
- Vérifications rapides (existsByEmail / existsByUsername) avant persistance.
- Transactions : class-level `@Transactional` avec lectures en `@Transactional(readOnly=true)`.

Emplacement
- `src/main/java/com/iatd/smarthub/service/UserService.java`

Annotations / pattern
- `@Service`
- `@Transactional` sur la classe
- Logger `private static final Logger log = LoggerFactory.getLogger(UserService.class);`

Dépendances
- `private final UserRepository userRepository`

Méthodes publiques importantes (signatures réelles)
- `public UserResponseDTO createUser(UserRequestDTO userRequest)`
  - Vérifie `existsByEmail` et `existsByUsername` et sauvegarde l'utilisateur.
  - Actuellement le code sauvegarde le mot de passe en clair (TODO: appeler `PasswordEncoder.encode`).
- `@Transactional(readOnly = true) public List<UserResponseDTO> getAllUsers()`
- `@Transactional(readOnly = true) public Optional<UserResponseDTO> getUserById(Long id)`
- `@Transactional(readOnly = true) public Optional<UserResponseDTO> getUserByEmail(String email)`
- `@Transactional(readOnly = true) public List<UserResponseDTO> getUsersByRole(User.Role role)`
- `public UserResponseDTO updateUser(Long id, UserRequestDTO userDetails)`
- `public void deleteUser(Long id)`
- `public User getUserEntityById(Long id)` (retourne entité ou throw)
- `public User getUserEntityByUsername(String username)`
- `public boolean userExists(Long id)`
- `public User findById(Long id)`

Extrait de comportement (pseudo)

- Création :
  - log.info("Creating new user with email: {}", userRequest.getEmail());
  - if existsByEmail -> throw RuntimeException
  - convert DTO -> entity
  - save via `userRepository.save(user)`

Recommandations
- Appeler `passwordEncoder.encode()` avant `userRepository.save()` pour ne pas stocker de mot de passe en clair.
- Ajouter des tests unitaires (Mockito) pour `createUser` (happy path + email exists case).

Exemple d'utilisation interne
```java
UserRequestDTO dto = new UserRequestDTO(...);
UserResponseDTO created = userService.createUser(dto);
```
