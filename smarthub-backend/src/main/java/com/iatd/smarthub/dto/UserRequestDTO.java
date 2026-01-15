package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.user.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRequestDTO {

    @NotBlank(message = "Le nom d'utilisateur est obligatoire")
    @Size(min = 3, max = 50, message = "Le nom d'utilisateur doit contenir entre 3 et 50 caractères")
    private String username;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "L'email doit être valide")
    @Size(max = 100, message = "L'email ne peut pas dépasser 100 caractères")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 6, max = 120, message = "Le mot de passe doit contenir entre 6 et 120 caractères")
    private String password;

    private User.Role role;

    @Size(max = 50, message = "Le prénom ne peut pas dépasser 50 caractères")
    private String firstName;

    @Size(max = 50, message = "Le nom ne peut pas dépasser 50 caractères")
    private String lastName;

    @Size(max = 20, message = "Le numéro de téléphone ne peut pas dépasser 20 caractères")
    private String phoneNumber;

    // Méthode pour convertir en Entity User
    public User toEntity() {
        User user = new User();
        user.setUsername(this.username.trim());
        user.setEmail(this.email.trim().toLowerCase());
        user.setPassword(this.password); // Sera hashé plus tard
        user.setRole(this.role != null ? this.role : User.Role.STUDENT);
        user.setFirstName(this.firstName != null ? this.firstName.trim() : null);
        user.setLastName(this.lastName != null ? this.lastName.trim() : null);
        user.setPhoneNumber(this.phoneNumber != null ? this.phoneNumber.trim() : null);
        user.setActive(true);
        return user;
    }
}