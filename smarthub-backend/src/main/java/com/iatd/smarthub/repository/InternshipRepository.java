package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.internship.Internship;
import com.iatd.smarthub.model.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InternshipRepository extends JpaRepository<Internship, Long> {

    // Trouver les stages par étudiant
    List<Internship> findByStudent(User student);

    // Trouver les stages par superviseur
    List<Internship> findBySupervisor(User supervisor);

    // Trouver les stages par entreprise
    List<Internship> findByCompanyContainingIgnoreCase(String company);

    // Trouver les stages par statut
    List<Internship> findByStatus(Internship.InternshipStatus status);

    // Trouver les stages actifs (en cours)
    @Query("SELECT i FROM Internship i WHERE i.startDate <= CURRENT_DATE AND i.endDate >= CURRENT_DATE")
    List<Internship> findActiveInternships();

    // Recherche de stages par titre ou entreprise
    @Query("SELECT i FROM Internship i WHERE LOWER(i.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(i.company) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Internship> searchInternships(@Param("query") String query);
    
 // Ajoutez ces méthodes pour optimiser le chargement
    @Query("SELECT i FROM Internship i JOIN FETCH i.student JOIN FETCH i.supervisor")
    List<Internship> findAllWithStudentsAndSupervisors();

    @Query("SELECT i FROM Internship i JOIN FETCH i.student JOIN FETCH i.supervisor WHERE i.id = :id")
    Optional<Internship> findByIdWithStudentsAndSupervisors(@Param("id") Long id);
}