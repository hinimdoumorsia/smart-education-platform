package com.iatd.smarthub.service;

import com.iatd.smarthub.dto.*;
import com.iatd.smarthub.model.quiz.Answer;
import com.iatd.smarthub.model.quiz.Question;
import com.iatd.smarthub.model.quiz.Quiz;
import com.iatd.smarthub.model.quiz.QuizAttempt;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.AnswerRepository;
import com.iatd.smarthub.repository.QuestionRepository;
import com.iatd.smarthub.repository.QuizAttemptRepository;
import com.iatd.smarthub.repository.QuizRepository;
import com.iatd.smarthub.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class QuizAttemptService {

    private static final Logger log = LoggerFactory.getLogger(QuizAttemptService.class);

    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizRepository quizRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;

    // ==================== ATTEMPT MANAGEMENT ====================

    public QuizAttemptResponseDTO startQuizAttempt(Long quizId, Long userId) {
        log.info("Starting quiz attempt for quiz ID: {} and user ID: {}", quizId, userId);

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz non trouvé avec ID: " + quizId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec ID: " + userId));

        // Vérifier s'il y a une tentative en cours
        QuizAttempt existingAttempt = quizAttemptRepository.findInProgressAttempt(userId, quizId).orElse(null);

        if (existingAttempt != null) {
            log.info("Resuming existing in-progress attempt ID: {}", existingAttempt.getId());
            return convertToQuizAttemptResponseDTO(existingAttempt);
        }

        // Créer une nouvelle tentative
        QuizAttempt attempt = new QuizAttempt(user, quiz);
        attempt.setStatus(QuizAttempt.AttemptStatus.IN_PROGRESS);
        attempt.setAttemptedAt(LocalDateTime.now());

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);
        log.info("New quiz attempt started with ID: {}", savedAttempt.getId());

        return convertToQuizAttemptResponseDTO(savedAttempt);
    }

    public QuizAttemptResponseDTO submitQuizAttempt(Long attemptId, QuizAttemptRequestDTO attemptRequest) {
        log.info("Submitting quiz attempt ID: {}", attemptId);

        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Tentative non trouvée avec ID: " + attemptId));

        // Vérifier que la tentative est en cours
        if (attempt.getStatus() != QuizAttempt.AttemptStatus.IN_PROGRESS) {
            throw new RuntimeException("Cette tentative a déjà été soumise ou abandonnée");
        }

        // Traiter les réponses
     // Traiter les réponses
        if (attemptRequest.getAnswers() != null) {
            List<Answer> answers = attemptRequest.getAnswers().stream()
                .map(answerRequest -> {
                    Question question = questionRepository.findById(answerRequest.getQuestionId())
                        .orElseThrow(() -> new RuntimeException(
                            "Question non trouvée avec ID: " + answerRequest.getQuestionId()));

                    Answer answer = new Answer();
                    answer.setQuestion(question);
                    answer.setQuizAttempt(attempt);
                    answer.setAnswerText(answerRequest.getAnswerText());
                    answer.validateAnswer();
                    return answer;
                })
                .collect(Collectors.toList());
            
            // Sauvegarder d'abord les réponses
            List<Answer> savedAnswers = answerRepository.saveAll(answers);
            attempt.getAnswers().addAll(savedAnswers);
        }

        // Calculer le score
        calculateAndSetScore(attempt);

        // Marquer comme complété
        attempt.completeAttempt();

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);
        log.info("Quiz attempt submitted successfully with score: {}", savedAttempt.getScore());

        return convertToQuizAttemptResponseDTO(savedAttempt);
    }

    public QuizAttemptResponseDTO abandonQuizAttempt(Long attemptId) {
        log.info("Abandoning quiz attempt ID: {}", attemptId);

        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Tentative non trouvée avec ID: " + attemptId));

        attempt.abandonAttempt();

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);
        log.info("Quiz attempt abandoned successfully");

        return convertToQuizAttemptResponseDTO(savedAttempt);
    }

    public QuizAttemptResponseDTO resumeOrStartQuizAttempt(Long userId, Long quizId) {
        log.info("Resuming or starting quiz attempt for user ID: {} and quiz ID: {}", userId, quizId);

        // Essayer de reprendre une tentative en cours
        QuizAttempt existingAttempt = quizAttemptRepository.findInProgressAttempt(userId, quizId).orElse(null);

        if (existingAttempt != null) {
            log.info("Resuming existing attempt ID: {}", existingAttempt.getId());
            return convertToQuizAttemptResponseDTO(existingAttempt);
        }

        // Sinon, démarrer une nouvelle tentative
        return startQuizAttempt(quizId, userId);
    }

    // ==================== RETRIEVAL OPERATIONS ====================

    public QuizAttemptResponseDTO getQuizAttemptById(Long attemptId) {
        log.debug("Fetching quiz attempt by ID: {}", attemptId);

        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Tentative non trouvée avec ID: " + attemptId));

        return convertToQuizAttemptResponseDTO(attempt);
    }

    public QuizAttemptResponseDTO getQuizAttemptWithDetails(Long attemptId) {
        log.debug("Fetching quiz attempt with details for ID: {}", attemptId);

        QuizAttempt attempt = quizAttemptRepository.findByIdWithDetails(attemptId)
                .orElseThrow(() -> new RuntimeException("Tentative non trouvée avec ID: " + attemptId));

        return convertToQuizAttemptResponseDTO(attempt);
    }

    public List<QuizAttemptResponseDTO> getUserQuizAttempts(Long userId) {
        log.debug("Fetching quiz attempts for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec ID: " + userId));

        List<QuizAttempt> attempts = quizAttemptRepository.findByStudent(user);
        return attempts.stream()
                .map(this::convertToQuizAttemptResponseDTO)
                .collect(Collectors.toList());
    }

    public List<QuizAttemptResponseDTO> getUserQuizAttemptsForQuiz(Long userId, Long quizId) {
        log.debug("Fetching quiz attempts for user ID: {} and quiz ID: {}", userId, quizId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec ID: " + userId));

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz non trouvé avec ID: " + quizId));

        List<QuizAttempt> attempts = quizAttemptRepository.findByStudentAndQuiz(user, quiz);
        return attempts.stream()
                .map(this::convertToQuizAttemptResponseDTO)
                .collect(Collectors.toList());
    }

    public List<QuizAttemptResponseDTO> getUserInProgressAttempts(Long userId) {
        log.debug("Fetching in-progress attempts for user ID: {}", userId);

        List<QuizAttempt> attempts = quizAttemptRepository.findByStudentIdWithDetails(userId).stream()
                .filter(attempt -> attempt.getStatus() == QuizAttempt.AttemptStatus.IN_PROGRESS)
                .collect(Collectors.toList());

        return attempts.stream()
                .map(this::convertToQuizAttemptResponseDTO)
                .collect(Collectors.toList());
    }

    public List<QuizAttemptResponseDTO> getUserRecentAttempts(Long userId, int limit) {
        log.debug("Fetching recent attempts for user ID: {} with limit: {}", userId, limit);

        List<QuizAttempt> attempts = quizAttemptRepository.findRecentCompletedAttemptsByStudent(userId, limit);
        return attempts.stream()
                .map(this::convertToQuizAttemptResponseDTO)
                .collect(Collectors.toList());
    }

    public List<QuizAttemptResponseDTO> getQuizAttempts(Long quizId) {
        log.debug("Fetching all attempts for quiz ID: {}", quizId);

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz non trouvé avec ID: " + quizId));

        List<QuizAttempt> attempts = quizAttemptRepository.findByQuiz(quiz);
        return attempts.stream()
                .map(this::convertToQuizAttemptResponseDTO)
                .collect(Collectors.toList());
    }

    public List<QuizAttemptResponseDTO> getCompletedQuizAttempts(Long quizId) {
        log.debug("Fetching completed attempts for quiz ID: {}", quizId);

        List<QuizAttempt> attempts = quizAttemptRepository.findByQuiz(
                quizRepository.findById(quizId)
                        .orElseThrow(() -> new RuntimeException("Quiz non trouvé avec ID: " + quizId)))
                .stream()
                .filter(attempt -> attempt.getStatus() == QuizAttempt.AttemptStatus.COMPLETED)
                .collect(Collectors.toList());

        return attempts.stream()
                .map(this::convertToQuizAttemptResponseDTO)
                .collect(Collectors.toList());
    }

    // ==================== PRIVATE METHODS ====================

    private void calculateAndSetScore(QuizAttempt attempt) {
        if (attempt.getAnswers() == null || attempt.getAnswers().isEmpty()) {
            attempt.setScore(0.0);
            return;
        }

        long totalQuestions = attempt.getQuiz().getQuestions().size();
        long correctAnswers = attempt.getAnswers().stream()
                .filter(answer -> Boolean.TRUE.equals(answer.getIsCorrect()))
                .count();

        double score = totalQuestions > 0 ? (double) correctAnswers / totalQuestions * 100 : 0.0;
        attempt.setScore(Math.round(score * 100.0) / 100.0); // Arrondir à 2 décimales
    }

    private QuizAttemptResponseDTO convertToQuizAttemptResponseDTO(QuizAttempt attempt) {
        QuizAttemptResponseDTO response = new QuizAttemptResponseDTO();
        response.setId(attempt.getId());
        response.setStudentId(attempt.getStudent().getId());
        response.setStudentName(attempt.getStudent().getFirstName() + " " + attempt.getStudent().getLastName());
        response.setQuizId(attempt.getQuiz().getId());
        response.setQuizTitle(attempt.getQuiz().getTitle());
        response.setScore(attempt.getScore());
        response.setAttemptedAt(attempt.getAttemptedAt());
        response.setCompletedAt(attempt.getCompletedAt());
        response.setStatus(attempt.getStatus());

        // Convertir les réponses
        if (attempt.getAnswers() != null) {
            List<AnswerResponseDTO> answerDTOs = attempt.getAnswers().stream()
                    .map(this::convertToAnswerResponseDTO)
                    .collect(Collectors.toList());
            response.setAnswers(answerDTOs);

            // Calculer le score si nécessaire
            if (response.getScore() == null && attempt.getStatus() == QuizAttempt.AttemptStatus.COMPLETED) {
                response.calculateAndSetScore();
            }
        }

        return response;
    }

    private AnswerResponseDTO convertToAnswerResponseDTO(Answer answer) {
        AnswerResponseDTO response = new AnswerResponseDTO();
        response.setId(answer.getId());
        response.setQuestionId(answer.getQuestion().getId());
        response.setQuestionText(answer.getQuestion().getText());
        response.setAnswerText(answer.getAnswerText());
        response.setIsCorrect(answer.getIsCorrect());
        response.setCorrectAnswer(answer.getQuestion().getCorrectAnswer());
        return response;
    }
}