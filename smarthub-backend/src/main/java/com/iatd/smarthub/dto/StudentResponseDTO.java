package com.iatd.smarthub.dto;

import lombok.Data;

@Data
public class StudentResponseDTO {
    private Long id;
    private String username;
    private String email;
    private String firstName; // AJOUTEZ SI NÉCESSAIRE
    private String lastName;  // AJOUTEZ SI NÉCESSAIRE
}