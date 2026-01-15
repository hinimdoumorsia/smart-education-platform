# SmartHub AI Coding Agent Instructions

## Project Overview

**SmartHub** is a Spring Boot 3.4.11 REST API for managing user resources in an educational platform (IATD - Institut d'Animation et de Technologies Digitales). It follows a layered architecture: Controller → Service → Repository → Database (PostgreSQL).

**Tech Stack:**
- Java 17, Spring Boot 3.4.11, Spring Data JPA
- PostgreSQL (localhost:5432, db: iatd_smarthub)
- Maven build system, Lombok for boilerplate reduction
- Spring Security for password encoding (BCrypt)

## Architecture & Data Flow

### Core Service Boundary: User Management

The application is currently single-domain (User entity only). All user operations flow through:

```
UserController (/api/v1/users)
    ↓ [REST endpoints]
UserService [business logic + validation]
    ↓ [repository abstraction]
UserRepository [JPA data access]
    ↓ [SQL]
PostgreSQL (users table)
```

**Key Architectural Decisions:**

1. **Entity Validation**: Constraints live on `User.java` model, not DTOs. DTOs (`UserRequestDTO`, `UserResponseDTO`) duplicate constraints for API contract clarity—preserve this separation.

2. **Password Encoding**: The `PasswordEncoder` component wraps `BCryptPasswordEncoder`. Currently passwords are NOT encoded before storage (security gap!). When fixing, ensure service calls `PasswordEncoder.encode()` before persistence.

3. **Role-Based Design**: User has enum `Role {STUDENT, TEACHER, ADMIN}` but no authorization checks yet—service accepts all roles. Future security layers should validate role transitions in service, not controller.

4. **Unique Constraints**: Username + Email uniqueness enforced at DB level (`@UniqueConstraint`). Service checks `existsByEmail()` / `existsByUsername()` before creation—redundant but intentional for fast-fail UX.

5. **Read-Only Transactions**: `getUserById()`, `getAllUsers()`, etc. explicitly mark `@Transactional(readOnly=true)` for performance. Maintain this pattern for queries.

## Build & Development Workflow

### Maven Commands

```bash
# Build project
./mvnw clean package

# Run tests
./mvnw test

# Start development server (runs on port 8080)
./mvnw spring-boot:run

# Compile only (useful for checking syntax errors)
./mvnw clean compile
```

**Dev Dependencies Active:**
- `spring-boot-devtools`: Auto-restart on source changes during `mvn spring-boot:run`

### Database Setup

PostgreSQL must be running locally:
```sql
CREATE DATABASE iatd_smarthub;
-- Tables auto-created by Hibernate (spring.jpa.hibernate.ddl-auto=update)
```

Credentials in `application.properties`: postgres/postgres (default, change for production!)

## Code Patterns & Conventions

### Service Layer Pattern

**File:** `src/main/java/com/iatd/smarthub/service/UserService.java`

Services ALWAYS:
- Use `@Slf4j` for logging (Lombok annotation)
- Mark `@Service` with `@RequiredArgsConstructor` for dependency injection
- Log operations at INFO level (create/update/delete), DEBUG for queries
- Throw `RuntimeException` with descriptive messages instead of custom exceptions (current pattern)
- Use `@Transactional` for write ops, `@Transactional(readOnly=true)` for reads

```java
// PATTERN: Service method structure
@Transactional
public User createUser(User user) {
    log.info("Creating new user with email: {}", user.getEmail());
    
    // Validate (business rules, not annotations)
    if (userRepository.existsByEmail(user.getEmail())) {
        throw new RuntimeException("Email already exists: " + user.getEmail());
    }
    
    // Execute
    return userRepository.save(user);
}
```

### Controller Layer Pattern

**File:** `src/main/java/com/iatd/smarthub/controller/UserController.java`

Controllers ALWAYS:
- Map to `/api/v1/{resource}` paths
- Use `@RequiredArgsConstructor` for service injection
- Wrap service calls in try-catch for HTTP error mapping
- Return appropriate HTTP status codes (201 for POST, 204 for DELETE, 404 for not found)
- Accept `@Valid` DTOs, let Spring handle validation errors

```java
// PATTERN: RESTful CRUD operations
@PostMapping
public ResponseEntity<User> createUser(@Valid @RequestBody User user) {
    try {
        return new ResponseEntity<>(userService.createUser(user), HttpStatus.CREATED);
    } catch (RuntimeException e) {
        return ResponseEntity.badRequest().build();
    }
}
```

### Repository Query Patterns

**File:** `src/main/java/com/iatd/smarthub/repository/UserRepository.java`

Repositories extend `JpaRepository<Entity, ID>` and add custom queries only when needed:

```java
// Simple method names (Spring derives SQL automatically)
Optional<User> findByEmail(String email);
List<User> findByRole(User.Role role);

// Complex queries use @Query with named parameters
@Query("SELECT u FROM User u WHERE u.email = :email OR u.username = :username")
Optional<User> findByEmailOrUsername(@Param("email") String email, @Param("username") String username);

// Boolean checks for uniqueness (not redundant with DB constraints, used for fast-fail)
Boolean existsByEmail(String email);
```

### DTO Pattern

**Files:** `UserRequestDTO.java` (incoming), `UserResponseDTO.java` (outgoing)

- **Request DTOs**: Include validation annotations (Lombok `@Getter @Setter`), have `toEntity()` conversion method
- **Response DTOs**: Never expose sensitive fields (passwords excluded), include timestamps for audit trails
- French validation messages (`message = "L'email est obligatoire"`) reflect localization intent—maintain language consistency
- Response DTOs have explicit constructors to prevent Jackson binding accidents

## Critical Patterns to Preserve

1. **No Service Calls in Constructors**: Use field injection + `@RequiredArgsConstructor` (Lombok), never @Autowired
2. **Consistent Logging**: Always include context (email, ID) in log messages for debugging
3. **Transaction Boundaries**: `@Transactional` on service methods, never on controllers
4. **URI Naming**: `/api/v1/{plural-resource}/{id}/{sub-resource}` convention
5. **Enum Serialization**: `@Enumerated(EnumType.STRING)` ensures role names (not ordinals) persist

## Common Extension Points (Add Next)

- **Authentication**: Add `@EnableWebSecurity` config with JWT token validation
- **Exception Handling**: Create `@RestControllerAdvice` to replace try-catch patterns
- **Password Encoding**: Service must call `PasswordEncoder.encode()` before `userRepository.save()`
- **Audit Logging**: Leverage existing `@CreationTimestamp` / `@UpdateTimestamp` with change tracking
- **Pagination**: Add `PagingAndSortingRepository` to support large user lists

## Testing Notes

- Tests live in `src/test/java/com/iatd/smarthub/`
- Use `@SpringBootTest` for integration tests
- No unit tests currently—add with mockito when creating new services

## Configuration Files

- `pom.xml`: Maven dependencies, Spring Boot 3.4.11 parent, Lombok annotation processor
- `application.properties`: DB connection, JPA/Hibernate DDL strategy (update), logging levels
- `CorsConfig.java`: Allows all origins (`*`) and methods on `/api/**` paths—restrictive for production

