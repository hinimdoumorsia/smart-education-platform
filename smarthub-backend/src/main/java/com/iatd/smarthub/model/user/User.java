package com.iatd.smarthub.model.user;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = "email"),
        @UniqueConstraint(columnNames = "username")
})
@Getter
@Setter
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({
    "password",
    "courses"
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(min = 3, max = 50)
    @Column(nullable = false)
    private String username;

    @NotBlank
    @Size(max = 100)
    @Email
    @Column(nullable = false)
    private String email;

    @NotBlank
    @Size(min = 6, max = 120)
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
    
    @Column(name = "profile_image")
    private String profileImage;

    private String firstName;
    private String lastName;
    private String phoneNumber;
    
    @Column(name = "reset_token")
    private String resetToken;
    
    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry;
    
    @Column(name = "reset_token_created_at")
    private LocalDateTime resetTokenCreatedAt;

    // Colonne modifiée en TINYINT(1) dans MySQL
    @Column(name = "active", nullable = false)
    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime lastLogin;

    @ManyToMany(mappedBy = "students", fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<com.iatd.smarthub.model.course.Course> courses;

    public enum Role {
        STUDENT, TEACHER, ADMIN
    }

    // Constructeurs
    public User() {
    }

    public User(String username, String email, String password, Role role) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    // Getters et setters
    public Long getId() { 
        return id; 
    }
    
    public void setId(Long id) { 
        this.id = id; 
    }

    public String getUsername() { 
        return username; 
    }
    
    public void setUsername(String username) { 
        this.username = username; 
    }

    public String getEmail() { 
        return email; 
    }
    
    public void setEmail(String email) { 
        this.email = email; 
    }

    public String getPassword() { 
        return password; 
    }
    
    public void setPassword(String password) { 
        this.password = password; 
    }

    public Role getRole() { 
        return role; 
    }
    
    public void setRole(Role role) { 
        this.role = role; 
    }

    public String getFirstName() { 
        return firstName; 
    }
    
    public void setFirstName(String firstName) { 
        this.firstName = firstName; 
    }

    public String getLastName() { 
        return lastName; 
    }
    
    public void setLastName(String lastName) { 
        this.lastName = lastName; 
    }

    public String getPhoneNumber() { 
        return phoneNumber; 
    }
    
    public void setPhoneNumber(String phoneNumber) { 
        this.phoneNumber = phoneNumber; 
    }

    // IMPORTANT : Méthodes pour le champ 'active'
    public boolean isActive() { 
        return active; 
    }
    
    public void setActive(boolean active) { 
        this.active = active; 
    }

    // Pour la compatibilité avec certaines bibliothèques qui attendent getActive()
    public Boolean getActive() {
        return active;
    }

    public LocalDateTime getCreatedAt() { 
        return createdAt; 
    }
    
    public void setCreatedAt(LocalDateTime createdAt) { 
        this.createdAt = createdAt; 
    }

    public LocalDateTime getUpdatedAt() { 
        return updatedAt; 
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) { 
        this.updatedAt = updatedAt; 
    }

    public LocalDateTime getLastLogin() { 
        return lastLogin; 
    }
    
    public void setLastLogin(LocalDateTime lastLogin) { 
        this.lastLogin = lastLogin; 
    }
    
    public String getProfileImage() { 
        return profileImage; 
    }
    
    public void setProfileImage(String profileImage) { 
        this.profileImage = profileImage; 
    }
    
    public String getResetToken() { 
        return resetToken; 
    }
    
    public void setResetToken(String resetToken) { 
        this.resetToken = resetToken; 
    }
    
    public LocalDateTime getResetTokenExpiry() { 
        return resetTokenExpiry; 
    }
    
    public void setResetTokenExpiry(LocalDateTime resetTokenExpiry) { 
        this.resetTokenExpiry = resetTokenExpiry; 
    }
    
    public LocalDateTime getResetTokenCreatedAt() { 
        return resetTokenCreatedAt; 
    }
    
    public void setResetTokenCreatedAt(LocalDateTime resetTokenCreatedAt) { 
        this.resetTokenCreatedAt = resetTokenCreatedAt; 
    }
    
    public List<com.iatd.smarthub.model.course.Course> getCourses() { 
        return courses; 
    }
    
    public void setCourses(List<com.iatd.smarthub.model.course.Course> courses) { 
        this.courses = courses; 
    }
    
    // Méthodes utilitaires
    public boolean isStudent() {
        return Role.STUDENT.equals(this.role);
    }
    
    public boolean isTeacher() {
        return Role.TEACHER.equals(this.role);
    }
    
    public boolean isAdmin() {
        return Role.ADMIN.equals(this.role);
    }
    
    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", role=" + role +
                ", active=" + active +
                '}';
    }
}