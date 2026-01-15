package com.iatd.smarthub.dto.agent;

import com.iatd.smarthub.dto.QuizResponseDTO;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class QuizInitiationResponse {
    private Long attemptId;
    private Long quizId;
    private QuizResponseDTO quizResponse;
    private int timeLimitMinutes;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private int remainingTimeMinutes;
    private String[] instructions;
    private String[] warnings;
    private boolean supervisorEnabled;
    
    public static QuizInitiationResponse notEligible(QuizEligibilityResponse eligibility) {
        return QuizInitiationResponse.builder()
            .attemptId(null)
            .quizResponse(null)
            .instructions(new String[]{"Non éligible pour le moment"})
            .warnings(new String[]{eligibility.getReason()}) // ✅ getReason() existe maintenant
            .supervisorEnabled(false)
            .build();
    }
    
    public static QuizInitiationResponse error(String error) {
        return QuizInitiationResponse.builder()
            .attemptId(null)
            .quizResponse(null)
            .instructions(new String[]{"Erreur d'initialisation"})
            .warnings(new String[]{error})
            .supervisorEnabled(false)
            .build();
    }
}