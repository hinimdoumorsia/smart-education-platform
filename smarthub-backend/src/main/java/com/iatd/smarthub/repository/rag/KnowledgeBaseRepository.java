package com.iatd.smarthub.repository.rag;

import com.iatd.smarthub.model.rag.KnowledgeBase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeBaseRepository extends JpaRepository<KnowledgeBase, Long> {
    
    // Méthode 1: Utilisant MEMBER OF (standard JPA)
    @Query("SELECT kb FROM KnowledgeBase kb WHERE :tag MEMBER OF kb.tags")
    List<KnowledgeBase> findByTag(@Param("tag") String tag);
    
    // Méthode alternative si MEMBER OF ne fonctionne pas
    @Query("SELECT kb FROM KnowledgeBase kb WHERE :tag IN (SELECT t FROM kb.tags t)")
    List<KnowledgeBase> findByTagAlternative(@Param("tag") String tag);
    
    // Recherche par mot-clé dans le titre ou le contenu - CORRIGÉ
    @Query("SELECT kb FROM KnowledgeBase kb WHERE " +
           "LOWER(kb.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "kb.content LIKE CONCAT('%', :keyword, '%')")
    List<KnowledgeBase> searchByKeyword(@Param("keyword") String keyword);
    
    // Trouver tous les tags uniques
    @Query("SELECT DISTINCT tag FROM KnowledgeBase kb JOIN kb.tags tag ORDER BY tag")
    List<String> findAllUniqueTags();
    
    // Trouver par source
    List<KnowledgeBase> findBySource(String source);
    
    // Recherche par plusieurs tags
    @Query("SELECT DISTINCT kb FROM KnowledgeBase kb JOIN kb.tags tag " +
           "WHERE tag IN :tags")
    List<KnowledgeBase> findByTagsIn(@Param("tags") List<String> tags);
    
    // Recherche avec pagination - CORRIGÉ
    @Query("SELECT kb FROM KnowledgeBase kb WHERE " +
           "LOWER(kb.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "kb.content LIKE CONCAT('%', :keyword, '%') " +
           "ORDER BY kb.usageCount DESC, kb.createdAt DESC")
    List<KnowledgeBase> searchByKeywordWithSorting(@Param("keyword") String keyword);
    
    @Query("SELECT kb FROM KnowledgeBase kb WHERE kb.embedding IS NOT NULL")
    List<KnowledgeBase> findAllWithEmbedding();
    
    // Recherche vectorielle native avec pgvector
    @Query(value = "SELECT * FROM knowledge_base " +
                   "WHERE embedding IS NOT NULL " +
                   "ORDER BY embedding <=> CAST(:embedding AS vector) " +
                   "LIMIT :limit", 
           nativeQuery = true)
    List<KnowledgeBase> findSimilarByEmbedding(
        @Param("embedding") float[] embedding, 
        @Param("limit") int limit
    );
    
    // Trouver les documents sans embedding
    @Query("SELECT kb FROM KnowledgeBase kb WHERE kb.embedding IS NULL")
    List<KnowledgeBase> findAllWithoutEmbedding();
    
    // Compter les documents avec embedding
    @Query("SELECT COUNT(kb) FROM KnowledgeBase kb WHERE kb.embedding IS NOT NULL")
    long countWithEmbedding();
}