# com.iatd.smarthub.repository.UserRepository

Rôle
- Interface JPA pour l'entité `User`.
- Méthodes dérivées Spring Data + requêtes `@Query` pour besoins spécifiques (statistiques, recherche texte).

Emplacement
- `src/main/java/com/iatd/smarthub/repository/UserRepository.java`

Signature
- `public interface UserRepository extends JpaRepository<User, Long>`

Méthodes principales (déclarées)
- `Optional<User> findByEmail(String email)`
- `Optional<User> findByUsername(String username)`
- `Boolean existsByEmail(String email)`
- `Boolean existsByUsername(String username)`
- `List<User> findByRole(User.Role role)`
- `List<User> findByActiveTrue()`
- `long countByActiveTrue()`
- `@Query("SELECT COUNT(u) FROM User u WHERE u.active = true") long countActiveUsers();`
- `@Query("SELECT COUNT(u) FROM User u WHERE u.role = :role") long countByRole(@Param("role") User.Role role);`
- `@Query("SELECT COUNT(u) FROM User u WHERE u.createdAt > :date") long countByCreatedAtAfter(@Param("date") LocalDateTime date);`
- `Optional<User> findByResetToken(String resetToken)`
- `@Query("SELECT u FROM User u WHERE u.email = :email OR u.username = :username") Optional<User> findByEmailOrUsername(@Param("email") String email, @Param("username") String username);`
- `@Query(...) List<User> findStudentsBySearchQuery(@Param("query") String query);` (recherche texte sur étudiants)
- Méthodes utilitaires : `findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase`, `findByRoleAndActiveTrue`

Notes
- `existsBy*` permet un fast-fail côté service avant une violation de contrainte DB.
- Quelques requêtes utilisent `nativeQuery = true` pour extractions rapides (ex: `findUserRoleById`, `findUsernameById`).

Exemple d'appel
```java
if (userRepository.existsByEmail(email)) {
  throw new RuntimeException("Email already exists: " + email);
}
```