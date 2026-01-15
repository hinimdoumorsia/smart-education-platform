# com.iatd.smarthub.model.user.User

Entité JPA `User` — champs, contraintes et relations.

Emplacement
- `src/main/java/com/iatd/smarthub/model/user/User.java`

Annotations principales
- `@Entity`
- `@Table(name = "users", uniqueConstraints = { @UniqueConstraint(columnNames = "email"), @UniqueConstraint(columnNames = "username") })`
- Jackson ignore properties: `password`, `courses` via `@JsonIgnoreProperties`

Champs importants
- `@Id @GeneratedValue Long id`
- `@NotBlank @Size(min=3,max=50) String username` (unique)
- `@NotBlank @Email String email` (unique)
- `@NotBlank @Size(min=6,max=120) String password`
- `@Enumerated(EnumType.STRING) Role role` (STUDENT, TEACHER, ADMIN)
- `String profileImage` (path vers `uploads/profile-images/`)
- `firstName`, `lastName`, `phoneNumber`
- `boolean active` (colonne `active`)
- `@CreationTimestamp LocalDateTime createdAt`
- `@UpdateTimestamp LocalDateTime updatedAt`

Relations
- `@ManyToMany(mappedBy="students") List<Course> courses` (lazy)
- OneToMany relations via `QuizAttempt`, `AssignmentSubmission` etc. sont gérées dans les autres entités.

Méthodes utilitaires
- `isStudent()`, `isTeacher()`, `isAdmin()`
- `toString()` redéfini pour exposer id, username, email, role, active (sans password)

Contraintes de sécurité
- `password` doit être encodé avant persistance (BCrypt via `PasswordEncoder`).

Exemple d'utilisation
```java
User user = new User("ali","ali@example.com","encodedPassword", User.Role.STUDENT);
userRepository.save(user);
```