package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.quiz.Answer;
import com.iatd.smarthub.model.quiz.Question;
import com.iatd.smarthub.model.quiz.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
// import java.util.Optional;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {

    // === FINDERS DE BASE ===
    List<Answer> findByQuizAttempt(QuizAttempt quizAttempt);

    List<Answer> findByQuestion(Question question);

    List<Answer> findByQuizAttemptAndIsCorrect(QuizAttempt quizAttempt, Boolean isCorrect);

    // === FIND WITH RELATIONS EAGERLY ===
    @Query("SELECT a FROM Answer a " +
            "LEFT JOIN FETCH a.question " +
            "LEFT JOIN FETCH a.quizAttempt " +
            "WHERE a.quizAttempt.id = :attemptId")
    List<Answer> findByQuizAttemptIdWithDetails(@Param("attemptId") Long attemptId);

    // === EXISTS CHECKS ===
    boolean existsByQuizAttemptAndQuestion(QuizAttempt quizAttempt, Question question);

    // === COUNT METHODS ===
    Long countByQuizAttempt(QuizAttempt quizAttempt);

    Long countByQuizAttemptAndIsCorrect(QuizAttempt quizAttempt, Boolean isCorrect);

    // === BATCH OPERATIONS ===
    @Query("SELECT a FROM Answer a WHERE a.quizAttempt.id IN :attemptIds")
    List<Answer> findByQuizAttemptIds(@Param("attemptIds") List<Long> attemptIds);

    // === FIND FOR SCORING ===
    @Query("SELECT a FROM Answer a " +
            "JOIN FETCH a.question " +
            "WHERE a.quizAttempt.id = :attemptId " +
            "AND a.isCorrect IS NULL")
    List<Answer> findUnscoredAnswersByAttemptId(@Param("attemptId") Long attemptId);

    // === STATISTICS ===
    @Query("SELECT COUNT(a) FROM Answer a WHERE a.question.id = :questionId AND a.isCorrect = true")
    Long countCorrectAnswersByQuestionId(@Param("questionId") Long questionId);

    @Query("SELECT COUNT(a) FROM Answer a WHERE a.question.id = :questionId")
    Long countTotalAnswersByQuestionId(@Param("questionId") Long questionId);
}