package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.quiz.Question;
import com.iatd.smarthub.model.quiz.QuestionType;
import com.iatd.smarthub.model.quiz.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    // === FINDERS DE BASE ===
    List<Question> findByQuiz(Quiz quiz);

    List<Question> findByQuizId(Long quizId);

    List<Question> findByType(QuestionType type);

    List<Question> findByQuizAndType(Quiz quiz, QuestionType type);

    // === EXISTS CHECKS ===
    boolean existsByQuizAndTextIgnoreCase(Quiz quiz, String text);

    // === COUNT METHODS ===
    Long countByQuiz(Quiz quiz);

    Long countByQuizId(Long quizId);

    // === FIND WITH OPTIONS EAGERLY ===
    @Query("SELECT q FROM Question q LEFT JOIN FETCH q.options WHERE q.id = :id")
    Optional<Question> findByIdWithOptions(@Param("id") Long id);

    @Query("SELECT q FROM Question q LEFT JOIN FETCH q.options WHERE q.quiz.id = :quizId")
    List<Question> findByQuizIdWithOptions(@Param("quizId") Long quizId);

    // === FIND FOR QUIZ ATTEMPT (sans réponses correctes) ===
    @Query("SELECT new Question(q.id, q.text, q.type, '', q.quiz) FROM Question q WHERE q.quiz.id = :quizId")
    List<Question> findQuestionsWithoutCorrectAnswersByQuizId(@Param("quizId") Long quizId);

    // === BATCH OPERATIONS ===
    @Query("SELECT q.correctAnswer FROM Question q WHERE q.id IN :questionIds")
    List<String> findCorrectAnswersByQuestionIds(@Param("questionIds") List<Long> questionIds);
}