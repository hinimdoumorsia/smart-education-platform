package com.iatd.smarthub.model.rag;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "knowledge_base")
@Getter
@Setter
public class KnowledgeBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String content;

    @ElementCollection
    @CollectionTable(
            name = "knowledge_base_tags",
            joinColumns = @JoinColumn(name = "knowledge_base_id")
    )
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "course_id")
    private Long courseId;

    @Column(length = 50)
    private String source = "USER_UPLOAD"; // USER_UPLOAD, COURSE_MATERIAL, EXTERNAL

    @Column(name = "usage_count")
    private Integer usageCount = 0;

    // === Champs pour le RAG vectoriel ===
    // CORRIGÉ: Changé en float[] pour être compatible avec RAGQuizService
    // Supprimé columnDefinition="vector" et @JdbcTypeCode(SqlTypes.VECTOR)
    @Lob
    @Column(name = "embedding")
    private float[] embedding;

    @Column(name = "chunk_index")
    private Integer chunkIndex = 0;

    @Column(name = "chunk_total")
    private Integer chunkTotal = 1;

    // === Constructeurs ===
    public KnowledgeBase() {}

    public KnowledgeBase(String title, String content, List<String> tags) {
        this.title = title;
        this.content = content;
        this.tags = tags != null ? tags : new ArrayList<>();
    }

    public KnowledgeBase(String title, String content, List<String> tags, String source) {
        this.title = title;
        this.content = content;
        this.tags = tags != null ? tags : new ArrayList<>();
        this.source = source;
    }

    // === Méthodes utilitaires ===
    public void addTag(String tag) {
        if (this.tags == null) this.tags = new ArrayList<>();
        if (tag != null && !tag.trim().isEmpty() && !this.tags.contains(tag.trim())) {
            this.tags.add(tag.trim());
        }
    }

    public void addTags(List<String> tags) {
        if (tags != null) {
            tags.forEach(this::addTag);
        }
    }

    public void incrementUsageCount() {
        if (this.usageCount == null) this.usageCount = 0;
        this.usageCount++;
    }

    public boolean hasEmbedding() {
        return embedding != null && embedding.length > 0;
    }

    // === toString pour debug ===
    @Override
    public String toString() {
        return "KnowledgeBase{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", content length=" + (content != null ? content.length() : 0) +
                ", tags=" + tags +
                ", source='" + source + '\'' +
                ", usageCount=" + usageCount +
                ", hasEmbedding=" + hasEmbedding() +
                ", chunkIndex=" + chunkIndex +
                ", chunkTotal=" + chunkTotal +
                '}';
    }
}