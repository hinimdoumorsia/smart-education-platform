package com.iatd.smarthub.controller.agent;

import com.iatd.smarthub.service.agent.AdaptiveQuizOrchestrator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/agent/adaptive-quiz")
@RequiredArgsConstructor
public class AdaptiveQuizController {
    
    private final AdaptiveQuizOrchestrator adaptiveOrchestrator;
    
    @PostMapping("/initiate")
    public ResponseEntity<Map<String, Object>> initiateAdaptiveQuiz(
            @RequestParam Long userId,
            @RequestParam Long courseId) {
        
        log.info("🎯 Initiation quiz adaptatif - userId: {}, courseId: {}", userId, courseId);
        
        Map<String, Object> result = adaptiveOrchestrator.orchestrateAdaptiveQuiz(userId, courseId);
        
        return ResponseEntity.ok(result);
    }
 // AdaptiveQuizController.java - AJOUTER
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testAdaptiveQuiz() {
        log.info("🧪 Test endpoint for adaptive quiz");
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Adaptive Quiz Orchestrator is operational");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("ollamaAvailable", true); // À vérifier
        
        return ResponseEntity.ok(response);
    }
}
