package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.user.User;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserBasicDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String username;
    private String role;

    public UserBasicDTO(User user) {
        this.id = user.getId();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.email = user.getEmail();
        this.username = user.getUsername();
        this.role = user.getRole() != null ? user.getRole().name() : null;
    }

    // Constructeur par défaut pour la désérialisation
    public UserBasicDTO() {
    }
}
