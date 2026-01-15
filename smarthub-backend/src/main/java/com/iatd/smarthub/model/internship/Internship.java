package com.iatd.smarthub.model.internship;

import com.iatd.smarthub.model.base.BaseEntity;
import com.iatd.smarthub.model.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "internships")
@Getter
@Setter
public class Internship extends BaseEntity {

    @NotBlank
    @Size(min = 3, max = 255)
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_id", nullable = false)
    private User supervisor;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false)
    private String company;

    @NotNull
    @Column(nullable = false)
    private LocalDate startDate;

    @NotNull
    @Column(nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InternshipStatus status = InternshipStatus.PLANNED;

    // Enum interne
    public enum InternshipStatus {
        PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
    }
}
