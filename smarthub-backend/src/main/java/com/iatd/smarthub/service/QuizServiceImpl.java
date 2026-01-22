package com.iatd.smarthub.service;

import com.iatd.smarthub.dto.*;
import com.iatd.smarthub.model.quiz.Quiz;
import com.iatd.smarthub.model.quiz.Question;
import com.iatd.smarthub.repository.QuizRepository;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
public class QuizServiceImpl implements QuizService {
    
    private final QuizRepository quizRepository;

    public QuizServiceImpl(QuizRepository quizRepository) {
        this.quizRepository = quizRepository;
    }

    @Override
    public QuizResponseDTO createQuiz(QuizRequestDTO quizRequest) {
        log.info("Creating quiz: {}", quizRequest.getTitle());
        
        Quiz quiz = new Quiz();
        quiz.setTitle(quizRequest.getTitle());
        quiz.setDescription(quizRequest.getDescription());
        quiz.setActive(quizRequest.getActive() != null ? quizRequest.getActive() : true);
        
        if (quizRequest.getQuestions() != null && !quizRequest.getQuestions().isEmpty()) {
            List<Question> questions = quizRequest.getQuestions().stream()
                .map(questionDto -> {
                    Question question = new Question();
                    question.setText(questionDto.getText());
                    question.setType(questionDto.getType());
                    question.setCorrectAnswer(questionDto.getCorrectAnswer());
                    question.setOptions(questionDto.getOptions());
                    question.setQuiz(quiz);
                    return question;
                })
                .collect(Collectors.toList());
            
            quiz.setQuestions(questions);
        }
        
        Quiz savedQuiz = quizRepository.save(quiz);
        return convertToResponseDTO(savedQuiz);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizSummaryDTO> getAllQuizSummaries() {
        log.info("Fetching all quiz summaries");
        
        List<Quiz> quizzes = quizRepository.findAll();
        
        // Initialiser les relations pour éviter LazyInitializationException
        for (Quiz quiz : quizzes) {
            Hibernate.initialize(quiz.getQuestions());
        }
        
        return quizzes.stream()
            .map(this::convertToSummaryDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public QuizResponseDTO getQuizById(Long quizId) {
        log.info("Fetching quiz by ID: {}", quizId);
        
        Quiz quiz = quizRepository.findById(quizId)
            .orElseThrow(() -> {
                log.error("Quiz not found with ID: {}", quizId);
                return new RuntimeException("Quiz non trouvé avec l'ID: " + quizId);
            });
        
        // FORCE l'initialisation des relations
        Hibernate.initialize(quiz.getQuestions());
        if (quiz.getQuestions() != null) {
            for (Question question : quiz.getQuestions()) {
                Hibernate.initialize(question.getOptions());
            }
        }
        
        return convertToResponseDTO(quiz);
    }

    @Override
    public QuizResponseDTO updateQuiz(Long quizId, QuizRequestDTO quizRequest) {
        log.info("Updating quiz ID: {}", quizId);
        
        Quiz quiz = quizRepository.findById(quizId)
            .orElseThrow(() -> new RuntimeException("Quiz non trouvé"));
        
        quiz.setTitle(quizRequest.getTitle());
        quiz.setDescription(quizRequest.getDescription());
        
        if (quizRequest.getQuestions() != null) {
            // Supprimer les anciennes questions
            quiz.getQuestions().clear();
            
            // Ajouter les nouvelles questions
            List<Question> newQuestions = quizRequest.getQuestions().stream()
                .map(qDto -> {
                    Question question = new Question();
                    question.setText(qDto.getText());
                    question.setType(qDto.getType());
                    question.setCorrectAnswer(qDto.getCorrectAnswer());
                    question.setOptions(qDto.getOptions());
                    question.setQuiz(quiz);
                    return question;
                })
                .collect(Collectors.toList());
            quiz.getQuestions().addAll(newQuestions);
        }
        
        Quiz updatedQuiz = quizRepository.save(quiz);
        return convertToResponseDTO(updatedQuiz);
    }

    @Override
    public void deleteQuiz(Long quizId) {
        log.info("Deleting quiz ID: {}", quizId);
        
        Quiz quiz = quizRepository.findById(quizId)
            .orElseThrow(() -> new RuntimeException("Quiz non trouvé"));
        quizRepository.delete(quiz);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizSummaryDTO> getActiveQuizSummaries() {
        log.info("Fetching active quiz summaries");
        
        List<Quiz> activeQuizzes = quizRepository.findByActiveTrue();
        
        // Initialiser les questions
        for (Quiz quiz : activeQuizzes) {
            Hibernate.initialize(quiz.getQuestions());
        }
        
        return activeQuizzes.stream()
            .map(this::convertToSummaryDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizSummaryDTO> searchQuizzesByTitle(String title) {
        log.info("Searching quizzes by title: {}", title);
        
        List<Quiz> quizzes = quizRepository.findByTitleContainingIgnoreCase(title);
        
        // Initialiser les questions
        for (Quiz quiz : quizzes) {
            Hibernate.initialize(quiz.getQuestions());
        }
        
        return quizzes.stream()
            .map(this::convertToSummaryDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AnswerStatisticsDTO getQuestionStatistics(Long questionId) {
        log.info("Getting statistics for question ID: {}", questionId);
        return new AnswerStatisticsDTO();
    }

    @Override
    @Transactional(readOnly = true)
    public QuizStatisticsDTO getQuizStatistics(Long quizId) {
        log.info("Getting statistics for quiz ID: {}", quizId);
        
        Quiz quiz = quizRepository.findById(quizId)
            .orElseThrow(() -> new RuntimeException("Quiz non trouvé"));
        
        Long totalAttempts = quizRepository.countCompletedAttempts(quizId);
        Double averageScore = quizRepository.getAverageScore(quizId);
        
        QuizStatisticsDTO stats = new QuizStatisticsDTO();
        stats.setQuizId(quizId);
        stats.setQuizTitle(quiz.getTitle());
        stats.setTotalAttempts(totalAttempts != null ? totalAttempts : 0L);
        stats.setAverageScore(averageScore != null ? Math.round(averageScore * 100.0) / 100.0 : 0.0);
        stats.setQuestionCount(quiz.getQuestions() != null ? quiz.getQuestions().size() : 0);
        
        return stats;
    }

    // Méthodes privées de conversion
    private QuizResponseDTO convertToResponseDTO(Quiz quiz) {
        QuizResponseDTO dto = new QuizResponseDTO();
        dto.setId(quiz.getId());
        dto.setTitle(quiz.getTitle());
        dto.setDescription(quiz.getDescription());
        dto.setActive(quiz.getActive());
        dto.setCreatedAt(quiz.getCreatedAt());
        dto.setUpdatedAt(quiz.getUpdatedAt());
        
        // Cours - si votre DTO a ces méthodes, sinon enlevez-les
        if (quiz.getCourse() != null) {
            // Vérifiez si votre QuizResponseDTO a ces méthodes
            // Si oui, décommentez les lignes suivantes
            // dto.setCourseId(quiz.getCourse().getId());
            // dto.setCourseTitle(quiz.getCourse().getTitle());
        }
        
        // Questions
        if (quiz.getQuestions() != null && !quiz.getQuestions().isEmpty()) {
            List<QuestionResponseDTO> questionDTOs = quiz.getQuestions().stream()
                .map(this::convertQuestionToDTO)
                .collect(Collectors.toList());
            dto.setQuestions(questionDTOs);
        } else {
            dto.setQuestions(List.of());
        }
        
        return dto;
    }

    private QuestionResponseDTO convertQuestionToDTO(Question question) {
        QuestionResponseDTO dto = new QuestionResponseDTO();
        dto.setId(question.getId());
        dto.setText(question.getText());
        dto.setType(question.getType());
        dto.setCorrectAnswer(question.getCorrectAnswer());
        
        // Options
        if (question.getOptions() != null && !question.getOptions().isEmpty()) {
            dto.setOptions(question.getOptions());
        } else {
            dto.setOptions(List.of());
        }
        
        return dto;
    }

    private QuizSummaryDTO convertToSummaryDTO(Quiz quiz) {
        QuizSummaryDTO dto = new QuizSummaryDTO();
        dto.setId(quiz.getId());
        dto.setTitle(quiz.getTitle());
        dto.setDescription(quiz.getDescription());
        dto.setActive(quiz.getActive());
        dto.setQuestionCount(quiz.getQuestions() != null ? (long) quiz.getQuestions().size() : 0L);
        
        // Cours - si votre DTO a ces méthodes
        if (quiz.getCourse() != null) {
            // Vérifiez si votre QuizSummaryDTO a ces méthodes
            // Si oui, décommentez les lignes suivantes
            // dto.setCourseId(quiz.getCourse().getId());
            // dto.setCourseTitle(quiz.getCourse().getTitle());
        }
        
        return dto;
    }
}
