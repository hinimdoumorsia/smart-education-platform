package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Boolean existsByEmail(String email);

    Boolean existsByUsername(String username);

    List<User> findByRole(User.Role role);

    List<User> findByActiveTrue();
    
    long countByActiveTrue();
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.active = true")
    long countActiveUsers();
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countByRole(@Param("role") User.Role role);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt > :date")
    long countByCreatedAtAfter(@Param("date") LocalDateTime date);
    
    Optional<User> findByResetToken(String resetToken);
    
    @Query("SELECT u FROM User u WHERE u.email = :email OR u.username = :username")
    Optional<User> findByEmailOrUsername(@Param("email") String email, 
                                        @Param("username") String username);
     
    @Query("""
        SELECT u FROM User u 
        WHERE u.role = 'STUDENT' 
        AND (LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) 
             OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :query, '%')) 
             OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :query, '%')) 
             OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')))
    """)
    List<User> findStudentsBySearchQuery(@Param("query") String query);
    
    // Méthodes supplémentaires utiles
    List<User> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            String firstName, String lastName);
    
    List<User> findByRoleAndActiveTrue(User.Role role);
    
 // Dans UserRepository.java, ajoutez :

    @Query(value = "SELECT role FROM users WHERE id = :userId", nativeQuery = true)
    String findUserRoleById(@Param("userId") Long userId);

    @Query(value = "SELECT username FROM users WHERE id = :userId", nativeQuery = true)
    String findUsernameById(@Param("userId") Long userId);
}