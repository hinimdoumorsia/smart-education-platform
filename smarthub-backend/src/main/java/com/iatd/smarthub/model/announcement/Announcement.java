// src/main/java/com/iatd/smarthub/model/announcement/Announcement.java
package com.iatd.smarthub.model.announcement;

import com.iatd.smarthub.model.base.BaseEntity;
import com.iatd.smarthub.model.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "announcements")
@Getter
@Setter
public class Announcement extends BaseEntity {

    @NotBlank
    @Size(min = 3, max = 255)
    @Column(nullable = false)
    private String title;

    @NotBlank
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AnnouncementType type;

    @NotNull
    @Column(nullable = false)
    private LocalDateTime date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    private Boolean published = true;

    // Constructeurs
    public Announcement() {
    }

    public Announcement(String title, String content, AnnouncementType type, LocalDateTime date, User author) {
        this.title = title;
        this.content = content;
        this.type = type;
        this.date = date;
        this.author = author;
    }
}