package com.iatd.smarthub.dto.agent;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class QuizSubmissionResponse {
    private Long attemptId;
    private double score;
    private double timeSpentMinutes;
    private boolean timedOut;
    private boolean passed;
    private QuizFeedback feedback;
    private Map<String, Object> recommendations;
    private QuizEligibilityResponse nextQuizEligibility;
    private boolean certificateEligible;
    
    public static QuizSubmissionResponse error(String error) {
        return QuizSubmissionResponse.builder()
            .score(0.0)
            .passed(false)
            .build();
    }
}