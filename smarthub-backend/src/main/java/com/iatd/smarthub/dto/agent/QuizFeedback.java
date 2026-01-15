package com.iatd.smarthub.dto.agent;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuizFeedback {
    private double score;
    private String grade;
    private String[] strengths;
    private String[] weaknesses;
    private String[] suggestions;
}