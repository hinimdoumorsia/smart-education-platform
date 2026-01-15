package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.project.Project;

import com.iatd.smarthub.model.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.time.LocalDateTime;


import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    // Trouver les projets par superviseur
    List<Project> findBySupervisor(User supervisor);

    // Trouver les projets par statut - CORRIGÉ
    List<Project> findByStatus(Project.ProjectStatus status);

    // Trouver les projets où un étudiant est membre
    @Query("SELECT p FROM Project p JOIN p.students s WHERE s = :student")
    List<Project> findByStudent(@Param("student") User student);

    // Trouver les projets en cours (entre les dates)
    @Query("SELECT p FROM Project p WHERE p.startDate <= CURRENT_DATE AND p.endDate >= CURRENT_DATE")
    List<Project> findActiveProjects();

    // Recherche de projets par titre
    @Query("SELECT p FROM Project p WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Project> searchByTitle(@Param("query") String query);

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.students WHERE p.id = :id")
    Optional<Project> findByIdWithStudents(@Param("id") Long id);

    @Query("SELECT p FROM Project p JOIN FETCH p.supervisor LEFT JOIN FETCH p.students WHERE p.id = :id")
    Optional<Project> findByIdWithSupervisorAndStudents(@Param("id") Long id);
    
    @Query("SELECT p FROM Project p JOIN FETCH p.supervisor WHERE p.id = :id")
    Optional<Project> findByIdWithSupervisor(@Param("id") Long id);

    @Query("SELECT p FROM Project p JOIN FETCH p.supervisor")
    List<Project> findAllWithSupervisor();
    
    // AJOUTER CETTE MÉTHODE
    @Query("SELECT COUNT(p) FROM Project p WHERE p.createdAt > :date")
    long countByCreatedAtAfter(@Param("date") LocalDateTime date);
}