package com.iatd.smarthub.controller.agent;

import com.iatd.smarthub.dto.agent.QuizEligibilityResponse;
import com.iatd.smarthub.dto.agent.QuizInitiationResponse;
import com.iatd.smarthub.dto.agent.QuizSubmissionResponse;
import com.iatd.smarthub.dto.agent.CourseQuizStats;
import com.iatd.smarthub.service.agent.CourseQuizSupervisorAgent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/agent/course-quiz")
@RequiredArgsConstructor
public class CourseQuizSupervisorController {
    
    private final CourseQuizSupervisorAgent supervisorAgent;
    
    @GetMapping("/eligibility")
    public ResponseEntity<QuizEligibilityResponse> checkQuizEligibility(
            @RequestParam Long userId,
            @RequestParam Long courseId) {
        
        log.info("📋 Vérification éligibilité - userId: {}, courseId: {}", userId, courseId);
        return ResponseEntity.ok(
            supervisorAgent.checkQuizEligibility(userId, courseId)
        );
    }
    
    @GetMapping("/debug/eligibility")
    public ResponseEntity<Map<String, Object>> debugEligibility(
            @RequestParam Long userId,
            @RequestParam Long courseId) {
        
        log.info("🔍 Debug eligibility - userId: {}, courseId: {}", userId, courseId);
        
        try {
            Map<String, Object> debugInfo = supervisorAgent.debugQuizEligibility(userId, courseId);
            return ResponseEntity.ok(debugInfo);
        } catch (Exception e) {
            Map<String, Object> errorInfo = new HashMap<>();
            errorInfo.put("error", e.getMessage());
            errorInfo.put("timestamp", LocalDateTime.now().toString());
            return ResponseEntity.status(500).body(errorInfo);
        }
    }
    
    @PostMapping("/initiate")
    public ResponseEntity<QuizInitiationResponse> initiateCourseQuiz(
            @RequestParam Long userId,
            @RequestParam Long courseId) {
        
        log.info("🚀 Initiation quiz - userId: {}, courseId: {}", userId, courseId);
        return ResponseEntity.ok(
            supervisorAgent.initiateCourseQuiz(userId, courseId)
        );
    }
    
    @PostMapping("/submit/{attemptId}")
    public ResponseEntity<QuizSubmissionResponse> submitCourseQuiz(
            @PathVariable Long attemptId,
            @RequestBody Map<String, Object> submission) {
        
        log.info("📤 Soumission quiz - attemptId: {}", attemptId);
        return ResponseEntity.ok(
            supervisorAgent.submitCourseQuiz(attemptId, submission)
        );
    }
    
    @GetMapping("/stats")
    public ResponseEntity<CourseQuizStats> getCourseQuizStats(
            @RequestParam Long userId,
            @RequestParam Long courseId) {
        
        log.info("📊 Récupération statistiques - userId: {}, courseId: {}", userId, courseId);
        return ResponseEntity.ok(
            supervisorAgent.getCourseQuizStats(userId, courseId)
        );
    }
    
    @GetMapping("/history/{userId}/{courseId}")
    public ResponseEntity<CourseQuizStats> getQuizHistory(
            @PathVariable Long userId,
            @PathVariable Long courseId) {
        
        log.info("📜 Historique quiz - userId: {}, courseId: {}", userId, courseId);
        return ResponseEntity.ok(
            supervisorAgent.getCourseQuizStats(userId, courseId)
        );
    }
    
    // Endpoint de test pour vérifier que le service fonctionne
    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> testEndpoint() {
        log.info("🧪 Test endpoint appelé");
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Service Course Quiz Supervisor opérationnel");
        response.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }
    
    // Endpoint pour forcer l'éligibilité (débogage seulement)
    @GetMapping("/force-eligible/{userId}/{courseId}")
    public ResponseEntity<QuizEligibilityResponse> forceEligible(
            @PathVariable Long userId,
            @PathVariable Long courseId) {
        
        log.info("⚡ Forcer éligibilité (debug) - userId: {}, courseId: {}", userId, courseId);
        
        // Créer une réponse forcée éligible
        QuizEligibilityResponse forcedResponse = QuizEligibilityResponse.builder()
            .userId(userId)
            .courseId(courseId)
            .isEligible(true)
            .reason("Éligibilité forcée (mode débogage)")
            .maxAttemptsPerDay(3)
            .attemptsToday(0)
            .remainingAttemptsToday(3)
            .build();
        
        return ResponseEntity.ok(forcedResponse);
    }
}