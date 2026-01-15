package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.internship.Internship;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class InternshipRequestDTO {

    @NotBlank(message = "Le titre du stage est obligatoire")
    @Size(min = 3, max = 255, message = "Le titre doit contenir entre 3 et 255 caractères")
    private String title;

    @Size(max = 1000, message = "La description ne peut pas dépasser 1000 caractères")
    private String description;

    @NotNull(message = "L'ID de l'étudiant est obligatoire")
    private Long studentId;

    // ❌ SUPPRIMER cette ligne - le superviseur est assigné automatiquement
    // @NotNull(message = "L'ID du superviseur est obligatoire")
    // private Long supervisorId;

    // ✅ OU la rendre optionnelle :
    private Long supervisorId; // Sans annotation @NotNull

    @NotBlank(message = "Le nom de l'entreprise est obligatoire")
    @Size(max = 255, message = "Le nom de l'entreprise ne peut pas dépasser 255 caractères")
    private String company;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDate startDate;

    @NotNull(message = "La date de fin est obligatoire")
    private LocalDate endDate;

    private Internship.InternshipStatus status = Internship.InternshipStatus.PLANNED;
}