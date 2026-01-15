package com.iatd.smarthub.model.resource;

import com.iatd.smarthub.model.base.BaseEntity;
import com.iatd.smarthub.model.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "resources")
@Getter
@Setter
public class Resource extends BaseEntity {

    @NotBlank
    @Size(min = 3, max = 255)
    @Column(nullable = false)
    private String title;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "resource_authors",
        joinColumns = @JoinColumn(name = "resource_id"),
        inverseJoinColumns = @JoinColumn(name = "author_id")
    )
    private List<User> authors = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String abstractText;

    @NotNull
    @Column(nullable = false)
    private LocalDate publicationDate;

    // Champs pour l'upload de fichiers
    @Size(max = 255)
    private String originalFileName;
    
    @Size(max = 255)
    private String storedFileName;
    
    private Long fileSize;
    
    private String fileType;

    public enum ResourceType {
        ARTICLE, THESIS, PUBLICATION, REPORT, OTHER
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceType type = ResourceType.ARTICLE;
}