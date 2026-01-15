package com.iatd.smarthub.service.rag;

import com.iatd.smarthub.service.OllamaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmbeddingService {
    
    private final OllamaService ollamaService;  // Utilise OllamaService mais il utilise maintenant Gemini
    private final Map<String, float[]> embeddingCache = new ConcurrentHashMap<>();
    
    /**
     * Générer un embedding en utilisant OllamaService (qui utilise maintenant Gemini)
     */
    public float[] generateEmbedding(String text) {
        if (text == null || text.trim().isEmpty()) {
            log.warn("⚠️ Texte vide pour l'embedding");
            return new float[0];
        }
        
        // Normaliser le texte
        String normalizedText = normalizeTextForEmbedding(text);
        String cacheKey = "embed_" + normalizedText.hashCode();
        
        // Vérifier le cache
        if (embeddingCache.containsKey(cacheKey)) {
            log.debug("📦 Embedding récupéré du cache");
            return embeddingCache.get(cacheKey).clone();
        }
        
        try {
            log.debug("🔧 Génération embedding pour: {}...", 
                     normalizedText.substring(0, Math.min(50, normalizedText.length())));
            
            // Utiliser la méthode d'OllamaService qui utilise maintenant Gemini
            float[] embedding = ollamaService.generateEmbedding(normalizedText);
            
            if (embedding != null && embedding.length > 0) {
                log.info("✅ Embedding généré avec Gemini ({} dimensions)", embedding.length);
                
                // Mettre en cache
                embeddingCache.put(cacheKey, embedding.clone());
                
                // Gérer la taille du cache
                manageCacheSize();
                
                return embedding;
            } else {
                log.warn("⚠️ Embedding vide généré, utilisation du fallback");
                return generateFallbackEmbedding(normalizedText);
            }
            
        } catch (Exception e) {
            log.error("❌ Erreur lors de la génération d'embedding avec Gemini: {}", e.getMessage());
            return generateFallbackEmbedding(normalizedText);
        }
    }
    
    /**
     * Embedding de fallback si Gemini échoue
     */
    private float[] generateFallbackEmbedding(String text) {
        // Créer un embedding basique basé sur le texte
        int dimensions = 768; // Augmenté pour correspondre aux embeddings Gemini
        float[] embedding = new float[dimensions];
        
        int hash = text.hashCode();
        for (int i = 0; i < dimensions; i++) {
            embedding[i] = ((hash >> (i % 32)) & 1) * 0.3f + (float) Math.random() * 0.1f;
        }
        
        log.debug("🔄 Utilisation d'embedding fallback ({} dimensions)", dimensions);
        return embedding;
    }
    
    private void manageCacheSize() {
        int maxCacheSize = 1000;
        if (embeddingCache.size() > maxCacheSize) {
            String oldestKey = embeddingCache.keySet().iterator().next();
            embeddingCache.remove(oldestKey);
            log.debug("🧹 Cache nettoyé (taille: {})", embeddingCache.size());
        }
    }
    
    private String normalizeTextForEmbedding(String text) {
        if (text == null) return "";
        
        int maxLength = 500; // Gemini a une limite de tokens
        if (text.length() > maxLength) {
            text = text.substring(0, maxLength) + "...";
        }
        
        return text.trim()
                  .replaceAll("\\s+", " ")
                  .toLowerCase();
    }
    
    public double cosineSimilarity(float[] vec1, float[] vec2) {
        if (vec1 == null || vec2 == null || vec1.length == 0 || vec2.length == 0) {
            return 0.0;
        }
        
        int minLength = Math.min(vec1.length, vec2.length);
        double dotProduct = 0.0;
        double norm1 = 0.0;
        double norm2 = 0.0;
        
        for (int i = 0; i < minLength; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }
        
        if (norm1 == 0 || norm2 == 0) {
            return 0.0;
        }
        
        double similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        return Math.max(0.0, Math.min(1.0, similarity));
    }
    
    /**
     * Test de la connexion au service AI (Gemini)
     */
    public boolean testAIConnection() {
        try {
            // Tester avec une méthode disponible
            String testResponse = ollamaService.generateText("test");
            return testResponse != null && !testResponse.contains("error") && !testResponse.contains("Erreur");
        } catch (Exception e) {
            log.warn("Connexion AI échouée: {}", e.getMessage());
            return false;
        }
    }
    
    public Map<String, Object> checkModelCompatibility() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Tester l'embedding
            float[] testEmbedding = generateEmbedding("test de compatibilité");
            result.put("embedding_supported", testEmbedding.length > 0);
            result.put("embedding_dimensions", testEmbedding.length);
            result.put("ai_service_available", testAIConnection());
            result.put("cache_size", embeddingCache.size());
            result.put("model_type", "Gemini AI");
            
        } catch (Exception e) {
            result.put("error", e.getMessage());
            result.put("embedding_supported", false);
            result.put("model_type", "Gemini (erreur de connexion)");
        }
        
        return result;
    }
    
    public void clearCache() {
        embeddingCache.clear();
        log.info("🧹 Cache d'embeddings nettoyé");
    }
    
    public Map<String, Object> getCacheStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("size", embeddingCache.size());
        stats.put("cache_enabled", true);
        stats.put("ai_service", "Gemini via OllamaService");
        return stats;
    }
    
    /**
     * Batch embedding generation
     */
    public Map<String, float[]> generateEmbeddingsBatch(List<String> texts) {
        Map<String, float[]> results = new HashMap<>();
        
        for (String text : texts) {
            try {
                float[] embedding = generateEmbedding(text);
                results.put(text, embedding);
            } catch (Exception e) {
                log.warn("Erreur génération embedding pour '{}...': {}", 
                        text.substring(0, Math.min(30, text.length())), e.getMessage());
                results.put(text, generateFallbackEmbedding(text));
            }
        }
        
        return results;
    }
    
    /**
     * Vérifie la similarité entre deux textes
     */
    public double textSimilarity(String text1, String text2) {
        float[] embedding1 = generateEmbedding(text1);
        float[] embedding2 = generateEmbedding(text2);
        
        return cosineSimilarity(embedding1, embedding2);
    }
    
    /**
     * Trouve les textes les plus similaires
     */
    public List<String> findMostSimilar(String query, List<String> candidates, int topK) {
        Map<String, Double> similarities = new HashMap<>();
        float[] queryEmbedding = generateEmbedding(query);
        
        for (String candidate : candidates) {
            float[] candidateEmbedding = generateEmbedding(candidate);
            double similarity = cosineSimilarity(queryEmbedding, candidateEmbedding);
            similarities.put(candidate, similarity);
        }
        
        // Trier par similarité descendante
        return similarities.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(topK)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }
}