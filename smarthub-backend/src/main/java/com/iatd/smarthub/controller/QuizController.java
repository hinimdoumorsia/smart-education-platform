package com.iatd.smarthub.controller;

import com.iatd.smarthub.dto.*;
import com.iatd.smarthub.service.QuizService;
import com.iatd.smarthub.service.QuizAttemptService;
import com.iatd.smarthub.service.QuizGenerationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;
    private final QuizAttemptService quizAttemptService;
    private final QuizGenerationService quizGenerationService;
    
    // ==================== QUIZ MANAGEMENT ====================

    /**
     * Créer un nouveau quiz avec ses questions
     */
    @PostMapping
    public ResponseEntity<QuizResponseDTO> createQuiz(@Valid @RequestBody QuizRequestDTO quizRequest) {
        QuizResponseDTO createdQuiz = quizService.createQuiz(quizRequest);
        return new ResponseEntity<>(createdQuiz, HttpStatus.CREATED);
    }

    /**
     * Récupérer tous les quizzes (version légère pour les listes)
     */
    @GetMapping
    public ResponseEntity<List<QuizSummaryDTO>> getAllQuizzes() {
        List<QuizSummaryDTO> quizzes = quizService.getAllQuizSummaries();
        return ResponseEntity.ok(quizzes);
    }

    /**
     * Récupérer un quiz spécifique avec toutes ses questions
     */
    @GetMapping("/{quizId}")
    public ResponseEntity<QuizResponseDTO> getQuizById(@PathVariable Long quizId) {
        QuizResponseDTO quiz = quizService.getQuizById(quizId);
        return ResponseEntity.ok(quiz);
    }

    /**
     * Mettre à jour un quiz existant
     */
    @PutMapping("/{quizId}")
    public ResponseEntity<QuizResponseDTO> updateQuiz(
            @PathVariable Long quizId,
            @Valid @RequestBody QuizRequestDTO quizRequest) {
        QuizResponseDTO updatedQuiz = quizService.updateQuiz(quizId, quizRequest);
        return ResponseEntity.ok(updatedQuiz);
    }

    /**
     * Supprimer un quiz
     */
    @DeleteMapping("/{quizId}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable Long quizId) {
        quizService.deleteQuiz(quizId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Récupérer seulement les quizzes actifs
     */
    @GetMapping("/active")
    public ResponseEntity<List<QuizSummaryDTO>> getActiveQuizzes() {
        List<QuizSummaryDTO> quizzes = quizService.getActiveQuizSummaries();
        return ResponseEntity.ok(quizzes);
    }

    /**
     * Rechercher des quizzes par titre
     */
    @GetMapping("/search")
    public ResponseEntity<List<QuizSummaryDTO>> searchQuizzes(@RequestParam String title) {
        List<QuizSummaryDTO> quizzes = quizService.searchQuizzesByTitle(title);
        return ResponseEntity.ok(quizzes);
    }

    // ==================== QUIZ GENERATION (IA) ====================

    /**
     * Générer un quiz automatiquement depuis un sujet (utilisation du DTO existant)
     * Cette méthode utilise QuizGenerationRequest avec topic et description
     */
    @PostMapping("/generate")
    public ResponseEntity<QuizResponseDTO> generateQuiz(
            @Valid @RequestBody QuizGenerationRequest request) {
        try {
            // Construire le contenu à partir du topic et de la description
            StringBuilder contentBuilder = new StringBuilder();
            contentBuilder.append("Sujet: ").append(request.getTopic());
            
            if (request.getDescription() != null && !request.getDescription().isBlank()) {
                contentBuilder.append("\n\nDescription: ").append(request.getDescription());
            }
            
            if (request.getTags() != null && !request.getTags().isEmpty()) {
                contentBuilder.append("\n\nTags: ").append(String.join(", ", request.getTags()));
            }
            
            String content = contentBuilder.toString();
            String title = request.getTopic();
            int questionCount = request.getQuestionCount();
            
            // CORRECTION: Utilisez la méthode qui existe dans votre service
            QuizResponseDTO quiz = quizGenerationService.generateQuizFromText(content, title, questionCount);
            
            return ResponseEntity.ok(quiz);
            
        } catch (Exception e) {
            // Log l'erreur pour le débogage
            System.err.println("Erreur lors de la génération du quiz: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(null);
        }
    }

    /**
     * Générer un quiz automatiquement depuis un texte libre (copier-coller)
     * Différent de l'endpoint /generate qui utilise un sujet structuré
     */
    @PostMapping("/generate/from-text")
    public ResponseEntity<QuizResponseDTO> generateQuizFromFreeText(
            @RequestParam String content,
            @RequestParam String title,
            @RequestParam(defaultValue = "10") int questionCount) {
        try {
            QuizResponseDTO quiz = quizGenerationService.generateQuizFromText(content, title, questionCount);
            return ResponseEntity.ok(quiz);
        } catch (Exception e) {
            System.err.println("Erreur lors de la génération depuis texte libre: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(null);
        }
    }

    /**
     * Générer un quiz automatiquement depuis un fichier uploadé
     */
    @PostMapping("/generate/from-file")
    public ResponseEntity<QuizResponseDTO> generateQuizFromFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "10") int questionCount) {
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        
        try {
            String content = new String(file.getBytes());
            String fileName = file.getOriginalFilename();
            
            QuizResponseDTO quiz = quizGenerationService.generateQuizFromFile(fileName, content, questionCount);
            return ResponseEntity.ok(quiz);
            
        } catch (IOException e) {
            System.err.println("Erreur IO lors de la lecture du fichier: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(null);
        } catch (Exception e) {
            System.err.println("Erreur lors de la génération depuis fichier: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    /**
     * Générer un quiz automatiquement depuis une URL
     */
    @PostMapping("/generate/from-url")
    public ResponseEntity<QuizResponseDTO> generateQuizFromUrl(
            @RequestParam String url,
            @RequestParam(defaultValue = "10") int questionCount) {
        try {
            QuizResponseDTO quiz = quizGenerationService.generateQuizFromUrl(url, questionCount);
            return ResponseEntity.ok(quiz);
        } catch (UnsupportedOperationException e) {
            return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                    .body(null);
        } catch (Exception e) {
            System.err.println("Erreur lors de la génération depuis URL: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(null);
        }
    }

    /**
     * Vérifier l'état du service de génération IA
     */
    @GetMapping("/generate/status")
    public ResponseEntity<String> getGenerationServiceStatus() {
        try {
            String status = quizGenerationService.getServiceStatus();
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.ok("Service en erreur: " + e.getMessage());
        }
    }

    // ==================== QUIZ ATTEMPTS ====================

    /**
     * Commencer une nouvelle tentative de quiz
     */
    @PostMapping("/{quizId}/attempts/start")
    public ResponseEntity<QuizAttemptResponseDTO> startQuizAttempt(
            @PathVariable Long quizId,
            @RequestParam Long userId) {
        QuizAttemptResponseDTO attempt = quizAttemptService.startQuizAttempt(quizId, userId);
        return new ResponseEntity<>(attempt, HttpStatus.CREATED);
    }

    /**
     * Soumettre une tentative de quiz avec les réponses
     */
    @PostMapping("/{quizId}/attempts/{attemptId}/submit")
    public ResponseEntity<QuizAttemptResponseDTO> submitQuizAttempt(
            @PathVariable Long quizId,
            @PathVariable Long attemptId,
            @Valid @RequestBody QuizAttemptRequestDTO attemptRequest) {
        QuizAttemptResponseDTO result = quizAttemptService.submitQuizAttempt(attemptId, attemptRequest);
        return ResponseEntity.ok(result);
    }

    /**
     * Récupérer les détails d'une tentative spécifique
     */
    @GetMapping("/attempts/{attemptId}")
    public ResponseEntity<QuizAttemptResponseDTO> getQuizAttempt(@PathVariable Long attemptId) {
        QuizAttemptResponseDTO attempt = quizAttemptService.getQuizAttemptWithDetails(attemptId);
        return ResponseEntity.ok(attempt);
    }

    /**
     * Récupérer toutes les tentatives d'un utilisateur
     */
    @GetMapping("/users/{userId}/attempts")
    public ResponseEntity<List<QuizAttemptResponseDTO>> getUserQuizAttempts(@PathVariable Long userId) {
        List<QuizAttemptResponseDTO> attempts = quizAttemptService.getUserQuizAttempts(userId);
        return ResponseEntity.ok(attempts);
    }

    /**
     * Récupérer les tentatives d'un utilisateur pour un quiz spécifique
     */
    @GetMapping("/{quizId}/users/{userId}/attempts")
    public ResponseEntity<List<QuizAttemptResponseDTO>> getUserQuizAttemptsForQuiz(
            @PathVariable Long quizId,
            @PathVariable Long userId) {
        List<QuizAttemptResponseDTO> attempts = quizAttemptService.getUserQuizAttemptsForQuiz(userId, quizId);
        return ResponseEntity.ok(attempts);
    }

    /**
     * Reprendre ou commencer une tentative en cours
     */
    @GetMapping("/{quizId}/users/{userId}/resume")
    public ResponseEntity<QuizAttemptResponseDTO> resumeOrStartQuizAttempt(
            @PathVariable Long quizId,
            @PathVariable Long userId) {
        QuizAttemptResponseDTO attempt = quizAttemptService.resumeOrStartQuizAttempt(userId, quizId);
        return ResponseEntity.ok(attempt);
    }

    // ==================== STATISTICS & ANALYTICS ====================

    /**
     * Récupérer les statistiques d'un quiz
     */
    @GetMapping("/{quizId}/statistics")
    public ResponseEntity<QuizStatisticsDTO> getQuizStatistics(@PathVariable Long quizId) {
        QuizStatisticsDTO statistics = quizService.getQuizStatistics(quizId);
        return ResponseEntity.ok(statistics);
    }

    /**
     * Récupérer les statistiques des réponses pour une question
     */
    @GetMapping("/questions/{questionId}/statistics")
    public ResponseEntity<AnswerStatisticsDTO> getQuestionStatistics(@PathVariable Long questionId) {
        AnswerStatisticsDTO statistics = quizService.getQuestionStatistics(questionId);
        return ResponseEntity.ok(statistics);
    }

    /**
     * Récupérer les tentatives récentes d'un utilisateur
     */
    @GetMapping("/users/{userId}/recent-attempts")
    public ResponseEntity<List<QuizAttemptResponseDTO>> getUserRecentAttempts(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "5") int limit) {
        List<QuizAttemptResponseDTO> attempts = quizAttemptService.getUserRecentAttempts(userId, limit);
        return ResponseEntity.ok(attempts);
    }
}