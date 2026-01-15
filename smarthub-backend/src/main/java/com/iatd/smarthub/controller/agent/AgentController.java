package com.iatd.smarthub.controller.agent;

import com.iatd.smarthub.service.agent.QuizOrchestratorAgent;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.iatd.smarthub.dto.QuizSubmissionDTO;


@RestController
@RequestMapping("/api/agent")
@RequiredArgsConstructor
public class AgentController {
    
    private final QuizOrchestratorAgent quizOrchestratorAgent;
    
    @PostMapping("/quiz/initiate")
    public ResponseEntity<?> initiateQuizSession(
            @RequestParam Long userId,
            @RequestParam String topic) {
        
        return ResponseEntity.ok(
            quizOrchestratorAgent.initiateQuizSession(userId, topic)
        );
    }
    
    @PostMapping("/quiz/submit")
    public ResponseEntity<?> submitAndEvaluateQuiz(
            @RequestParam Long attemptId,
            @RequestBody QuizSubmissionDTO submission) {
        
        return ResponseEntity.ok(
            quizOrchestratorAgent.submitAndEvaluateQuiz(attemptId, submission)
        );
    }
    
    @GetMapping("/recommend/next")
    public ResponseEntity<?> recommendNextQuiz(@RequestParam Long userId) {
        return ResponseEntity.ok(
            quizOrchestratorAgent.recommendNextQuiz(userId)
        );
    }
    
    @GetMapping("/dashboard/{userId}")
    public ResponseEntity<?> getProgressDashboard(@PathVariable Long userId) {
        return ResponseEntity.ok(
            quizOrchestratorAgent.getProgressDashboard(userId)
        );
    }
    
    @GetMapping("/analysis/{userId}")
    public ResponseEntity<?> getDetailedAnalysis(@PathVariable Long userId) {
        return ResponseEntity.ok(
            quizOrchestratorAgent.getProgressDashboard(userId)
        );
    }
}
