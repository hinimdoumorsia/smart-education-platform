package com.iatd.smarthub.repository;

import com.iatd.smarthub.dto.QuizSummaryDTO;
import com.iatd.smarthub.model.quiz.Quiz;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {

    // === FINDERS DE BASE ===
    List<Quiz> findByActiveTrue();

    List<Quiz> findByActiveFalse();

    List<Quiz> findByTitleContainingIgnoreCase(String title);

    // === EXISTS CHECKS ===
    boolean existsByTitleAndIdNot(String title, Long id);

    boolean existsByTitle(String title);

    // === QUIZ SUMMARIES (Pour les listes légères) - OPTIMISÉ ===
    @Query("SELECT new com.iatd.smarthub.dto.QuizSummaryDTO(" +
            "q.id, q.title, q.description, q.active, q.createdAt, " +
            "(SELECT COUNT(qu) FROM Question qu WHERE qu.quiz.id = q.id)) " +
            "FROM Quiz q " +
            "WHERE q.active = true " +
            "ORDER BY q.createdAt DESC")
    List<QuizSummaryDTO> findAllActiveQuizSummaries();

    @Query("SELECT new com.iatd.smarthub.dto.QuizSummaryDTO(" +
            "q.id, q.title, q.description, q.active, q.createdAt, " +
            "(SELECT COUNT(qu) FROM Question qu WHERE qu.quiz.id = q.id)) " +
            "FROM Quiz q " +
            "ORDER BY q.createdAt DESC")
    List<QuizSummaryDTO> findAllQuizSummaries();

    // === COUNT METHODS ===
    @Query("SELECT COUNT(q) FROM Quiz q WHERE q.active = true")
    Long countActiveQuizzes();

    @Query("SELECT COUNT(qu) FROM Question qu WHERE qu.quiz.id = :quizId")
    Integer countQuestionsByQuizId(@Param("quizId") Long quizId);

    // === FIND WITH QUESTIONS EAGERLY - CORRIGÉ AVEC ENTITYGRAPH ===
    @EntityGraph(attributePaths = {"questions", "questions.options"})
    @Query("SELECT q FROM Quiz q WHERE q.id = :id")
    Optional<Quiz> findByIdWithQuestions(@Param("id") Long id);
    
    // === NOUVELLE MÉTHODE : FETCH TOUT EN UNE SEULE REQUÊTE ===
    @EntityGraph(attributePaths = {"questions", "questions.options", "course"})
    @Query("SELECT DISTINCT q FROM Quiz q")
    List<Quiz> findAllWithDetails();
    
    // Pour la relation avec Course
    @Query("SELECT q FROM Quiz q WHERE q.course.id = :courseId")
    List<Quiz> findByCourseId(@Param("courseId") Long courseId);

    // Pour les statistiques
    @Query("SELECT COUNT(qa) FROM QuizAttempt qa WHERE qa.quiz.id = :quizId AND qa.status = 'COMPLETED'")
    Long countCompletedAttempts(@Param("quizId") Long quizId);

    @Query("SELECT AVG(qa.score) FROM QuizAttempt qa WHERE qa.quiz.id = :quizId AND qa.status = 'COMPLETED'")
    Double getAverageScore(@Param("quizId") Long quizId);
    
    // === NOUVELLE : POUR FETCH TOUS LES QUIZZES AVEC QUESTIONS (POUR ADMIN) ===
    @EntityGraph(attributePaths = {"questions"})
    @Query("SELECT DISTINCT q FROM Quiz q WHERE q.active = :active")
    List<Quiz> findAllByActiveWithQuestions(@Param("active") boolean active);
}