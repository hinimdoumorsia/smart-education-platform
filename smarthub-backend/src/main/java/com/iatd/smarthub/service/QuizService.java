package com.iatd.smarthub.service;

import com.iatd.smarthub.dto.*;
import java.util.List;

public interface QuizService {

    QuizResponseDTO createQuiz(QuizRequestDTO quizRequest);

    List<QuizSummaryDTO> getAllQuizSummaries();

    QuizResponseDTO getQuizById(Long quizId);

    QuizResponseDTO updateQuiz(Long quizId, QuizRequestDTO quizRequest);

    void deleteQuiz(Long quizId);

    List<QuizSummaryDTO> getActiveQuizSummaries();

    List<QuizSummaryDTO> searchQuizzesByTitle(String title);

    QuizStatisticsDTO getQuizStatistics(Long quizId);

    AnswerStatisticsDTO getQuestionStatistics(Long questionId);
}
