package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.resource.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    // Recherche par titre ou résumé
    @Query("SELECT r FROM Resource r WHERE LOWER(r.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(r.abstractText) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Resource> searchByTitleOrAbstract(@Param("query") String query);

    // Trouver les ressources par auteur
    @Query("SELECT r FROM Resource r JOIN r.authors a WHERE a.id = :authorId")
    List<Resource> findByAuthorId(@Param("authorId") Long authorId);

    // Trouver les ressources par type
    List<Resource> findByType(Resource.ResourceType type);

    // Trouver les ressources par année de publication
    @Query("SELECT r FROM Resource r WHERE YEAR(r.publicationDate) = :year")
    List<Resource> findByPublicationYear(@Param("year") int year);
    
 // AJOUTER CES MÉTHODES
    @Query("SELECT r FROM Resource r LEFT JOIN FETCH r.authors")
    List<Resource> findAllWithAuthors();

    @Query("SELECT r FROM Resource r LEFT JOIN FETCH r.authors WHERE r.id = :id")
    Optional<Resource> findByIdWithAuthors(Long id);

    @Query("SELECT r FROM Resource r LEFT JOIN FETCH r.authors WHERE r.id IN :ids")
    List<Resource> findAllWithAuthorsByIds(@Param("ids") List<Long> ids);
}