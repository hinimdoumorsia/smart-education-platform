package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.quiz.QuizAttempt;
import com.iatd.smarthub.model.quiz.QuizAttempt.AttemptStatus;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.model.course.Course;
import com.iatd.smarthub.model.quiz.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    // === FINDERS DE BASE ===
    List<QuizAttempt> findByStudent(User student);
    List<QuizAttempt> findByQuiz(Quiz quiz);
    List<QuizAttempt> findByStudentAndQuiz(User student, Quiz quiz);
    List<QuizAttempt> findByStatus(AttemptStatus status);
    
    // ✅ NOUVEAU : Trouver par cours
    List<QuizAttempt> findByStudentAndCourse(User student, Course course);
    
    // ✅ NOUVEAU : Dernière tentative par cours
    @Query("SELECT qa FROM QuizAttempt qa WHERE qa.student = :student AND qa.course = :course ORDER BY qa.completedAt DESC LIMIT 1")
    Optional<QuizAttempt> findLastAttemptByStudentAndCourse(@Param("student") User student, @Param("course") Course course);
    
    // ✅ NOUVEAU : Compter les tentatives par jour
    @Query("SELECT COUNT(qa) FROM QuizAttempt qa WHERE qa.student = :student AND qa.course = :course AND qa.attemptedAt BETWEEN :start AND :end")
    Integer countByStudentAndCourseAndDateRange(
        @Param("student") User student,
        @Param("course") Course course,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );
    
    // ✅ NOUVEAU : Compter les tentatives par cours
    @Query("SELECT COUNT(qa) FROM QuizAttempt qa WHERE qa.student = :student AND qa.course = :course")
    Integer countByStudentAndCourse(@Param("student") User student, @Param("course") Course course);

    // === FIND WITH RELATIONS EAGERLY ===
    @Query("SELECT qa FROM QuizAttempt qa " +
            "LEFT JOIN FETCH qa.student " +
            "LEFT JOIN FETCH qa.quiz " +
            "LEFT JOIN FETCH qa.answers " +
            "WHERE qa.id = :id")
    Optional<QuizAttempt> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT qa FROM QuizAttempt qa " +
            "LEFT JOIN FETCH qa.student " +
            "LEFT JOIN FETCH qa.quiz " +
            "WHERE qa.student.id = :studentId " +
            "ORDER BY qa.attemptedAt DESC")
    List<QuizAttempt> findByStudentIdWithDetails(@Param("studentId") Long studentId);

    // === COUNT METHODS ===
    Long countByStudent(User student);
    Long countByQuiz(Quiz quiz);
    Long countByStudentAndQuiz(User student, Quiz quiz);
    Long countByQuizAndStatus(Quiz quiz, AttemptStatus status);
    
    @Query("SELECT COUNT(qa) FROM QuizAttempt qa WHERE qa.createdAt > :date")
    long countByCreatedAtAfter(@Param("date") LocalDateTime date);

    // === STATISTICS ===
    @Query("SELECT AVG(qa.score) FROM QuizAttempt qa WHERE qa.quiz.id = :quizId AND qa.status = 'COMPLETED'")
    Double findAverageScoreByQuizId(@Param("quizId") Long quizId);

    @Query("SELECT MAX(qa.score) FROM QuizAttempt qa WHERE qa.quiz.id = :quizId AND qa.status = 'COMPLETED'")
    Double findMaxScoreByQuizId(@Param("quizId") Long quizId);

    @Query("SELECT COUNT(qa) FROM QuizAttempt qa WHERE qa.quiz.id = :quizId AND qa.status = 'COMPLETED'")
    Long countCompletedAttemptsByQuizId(@Param("quizId") Long quizId);

    // === FIND INCOMPLETE ATTEMPTS ===
    @Query("SELECT qa FROM QuizAttempt qa WHERE qa.student.id = :studentId AND qa.quiz.id = :quizId AND qa.status = 'IN_PROGRESS'")
    Optional<QuizAttempt> findInProgressAttempt(@Param("studentId") Long studentId, @Param("quizId") Long quizId);

    // === FIND LATEST ATTEMPTS ===
    @Query("SELECT qa FROM QuizAttempt qa " +
            "WHERE qa.student.id = :studentId " +
            "AND qa.status = 'COMPLETED' " +
            "ORDER BY qa.completedAt DESC " +
            "LIMIT :limit")
    List<QuizAttempt> findRecentCompletedAttemptsByStudent(@Param("studentId") Long studentId,
            @Param("limit") int limit);
}