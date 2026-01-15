package com.iatd.smarthub.service;

import com.iatd.smarthub.model.user.User; // IMPORT AJOUTÉ
import com.iatd.smarthub.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StatsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private InternshipRepository internshipRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    public Map<String, Object> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // Statistiques de base
            stats.put("users", userRepository.count());
            stats.put("courses", courseRepository.count());
            stats.put("projects", projectRepository.count());
            stats.put("announcements", announcementRepository.count());
            stats.put("internships", internshipRepository.count());
            stats.put("resources", resourceRepository.count());
            stats.put("quizzes", quizRepository.count());
            stats.put("quizAttempts", quizAttemptRepository.count());
            
            // Utilisateurs actifs
            try {
                stats.put("activeUsers", userRepository.countActiveUsers());
            } catch (Exception e) {
                stats.put("activeUsers", 0);
            }
            
            // Distribution par rôle - CORRECTION ICI
            try {
                // Utiliser User.Role enum au lieu de String
                stats.put("students", userRepository.countByRole(User.Role.STUDENT));
                stats.put("teachers", userRepository.countByRole(User.Role.TEACHER));
                stats.put("admins", userRepository.countByRole(User.Role.ADMIN));
            } catch (Exception e) {
                stats.put("students", 0);
                stats.put("teachers", 0);
                stats.put("admins", 0);
            }
            
            // Statistiques des 7 derniers jours
            LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
            try {
                stats.put("newUsers7d", userRepository.countByCreatedAtAfter(weekAgo));
            } catch (Exception e) {
                stats.put("newUsers7d", 0);
            }
            
            try {
                stats.put("quizAttempts7d", quizAttemptRepository.countByCreatedAtAfter(weekAgo));
            } catch (Exception e) {
                stats.put("quizAttempts7d", 0);
            }
            
            try {
                stats.put("newProjects7d", projectRepository.countByCreatedAtAfter(weekAgo));
            } catch (Exception e) {
                stats.put("newProjects7d", 0);
            }
            
            // Activités récentes
            stats.put("recentActivities", getRecentActivities());
            
        } catch (Exception e) {
            // En cas d'erreur, retourner des valeurs par défaut
            System.err.println("Erreur dans getAdminStats: " + e.getMessage());
            e.printStackTrace();
            return getDefaultStats();
        }
        
        return stats;
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        // Implémenter selon les besoins
        return stats;
    }

    private List<Map<String, Object>> getRecentActivities() {
        // Simuler des activités récentes
        return List.of(
            Map.of(
                "title", "Nouveau cours créé",
                "description", "Introduction à l'Intelligence Artificielle",
                "user", "Prof. Smith",
                "timestamp", LocalDateTime.now().minusHours(2)
            ),
            Map.of(
                "title", "Quiz complété",
                "description", "Quiz sur les réseaux neuronaux",
                "user", "Étudiant123",
                "timestamp", LocalDateTime.now().minusHours(5)
            )
        );
    }
    
    private Map<String, Object> getDefaultStats() {
        Map<String, Object> defaultStats = new HashMap<>();
        defaultStats.put("users", 0);
        defaultStats.put("courses", 0);
        defaultStats.put("projects", 0);
        defaultStats.put("announcements", 0);
        defaultStats.put("internships", 0);
        defaultStats.put("resources", 0);
        defaultStats.put("quizzes", 0);
        defaultStats.put("quizAttempts", 0);
        defaultStats.put("activeUsers", 0);
        defaultStats.put("students", 0);
        defaultStats.put("teachers", 0);
        defaultStats.put("admins", 0);
        defaultStats.put("newUsers7d", 0);
        defaultStats.put("quizAttempts7d", 0);
        defaultStats.put("newProjects7d", 0);
        defaultStats.put("recentActivities", List.of());
        return defaultStats;
    }
}