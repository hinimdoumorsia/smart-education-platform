package com.iatd.smarthub.service.rag;

import com.iatd.smarthub.model.rag.KnowledgeBase;
import com.iatd.smarthub.model.rag.LearningProfile;
import com.iatd.smarthub.repository.rag.KnowledgeBaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VectorRAGService {
    
    private final KnowledgeBaseRepository knowledgeBaseRepository;
    private final EmbeddingService embeddingService;
    
    public List<KnowledgeBase> findVectorRelevantContent(String query, LearningProfile profile, int limit) {
        log.info("🔍 Recherche vectorielle Gemini pour: '{}'", query);
        
        // 1. Générer l'embedding de la requête avec Gemini
        float[] queryEmbedding = embeddingService.generateEmbedding(query);
        if (queryEmbedding.length == 0) {
            log.warn("⚠️ Impossible de générer l'embedding Gemini pour la requête");
            return Collections.emptyList();
        }
        
        log.debug("✅ Embedding Gemini généré avec {} dimensions", queryEmbedding.length);
        
        // 2. Recherche vectorielle dans la base
        List<KnowledgeBase> vectorResults = knowledgeBaseRepository.findSimilarByEmbedding(queryEmbedding, limit * 2);
        
        // 3. Calculer les scores de similarité et appliquer les bonus
        Map<KnowledgeBase, Double> scoredResults = new HashMap<>();
        
        for (KnowledgeBase doc : vectorResults) {
            if (doc.getEmbedding() != null && doc.getEmbedding().length > 0) {
                double similarity = embeddingService.cosineSimilarity(queryEmbedding, doc.getEmbedding());
                
                // Bonus pour les intérêts de l'utilisateur
                if (profile != null && profile.getInterests() != null && doc.getTags() != null) {
                    for (String interest : profile.getInterests()) {
                        if (doc.getTags().contains(interest)) {
                            similarity += 0.15; // Bonus de 15%
                            log.debug("➕ Bonus Gemini pour l'intérêt '{}' sur document {}", interest, doc.getId());
                        }
                    }
                }
                
                // Bonus pour l'usage count (documents populaires)
                if (doc.getUsageCount() != null && doc.getUsageCount() > 10) {
                    similarity += 0.05; // Bonus de 5%
                }
                
                scoredResults.put(doc, similarity);
                log.debug("📊 Document {}: similarité Gemini={}", doc.getId(), String.format("%.2f", similarity));
            }
        }
        
        // 4. Trier par score et limiter
        List<KnowledgeBase> results = scoredResults.entrySet().stream()
            .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
            .limit(limit)
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());
        
        log.info("✅ Recherche vectorielle Gemini: {} résultats trouvés", results.size());
        return results;
    }
    
    public List<KnowledgeBase> findHybridRelevantContent(String query, LearningProfile profile) {
        List<KnowledgeBase> results = new ArrayList<>();
        
        log.info("🔀 Recherche hybride (textuelle + vectorielle Gemini) pour: '{}'", query);
        
        // 1. Recherche textuelle (rapide, précise)
        List<KnowledgeBase> textResults = knowledgeBaseRepository.searchByKeyword(query);
        results.addAll(textResults);
        log.debug("📝 Recherche textuelle: {} résultats", textResults.size());
        
        // 2. Si pas assez de résultats, ajouter la recherche vectorielle Gemini
        if (results.size() < 3) {
            int vectorLimit = 5 - results.size();
            List<KnowledgeBase> vectorResults = findVectorRelevantContent(query, profile, vectorLimit);
            
            // Éviter les doublons
            Set<Long> existingIds = results.stream()
                .map(KnowledgeBase::getId)
                .collect(Collectors.toSet());
            
            for (KnowledgeBase vectorDoc : vectorResults) {
                if (!existingIds.contains(vectorDoc.getId())) {
                    results.add(vectorDoc);
                    log.debug("➕ Ajout du document vectoriel Gemini {}", vectorDoc.getId());
                }
            }
            
            log.debug("🎯 Recherche vectorielle Gemini ajoutée: {} nouveaux documents", 
                     vectorResults.stream().filter(d -> !existingIds.contains(d.getId())).count());
        }
        
        // 3. Si toujours pas assez, ajouter par tags d'intérêts
        if (results.size() < 2 && profile != null && profile.getInterests() != null) {
            for (String interest : profile.getInterests()) {
                if (results.size() >= 5) break;
                
                List<KnowledgeBase> interestResults = knowledgeBaseRepository.findByTag(interest);
                for (KnowledgeBase doc : interestResults) {
                    if (results.size() >= 5) break;
                    if (!results.contains(doc)) {
                        results.add(doc);
                        log.debug("🏷️ Ajout par intérêt '{}': document {}", interest, doc.getId());
                    }
                }
            }
        }
        
        // Limiter à 5 résultats maximum
        List<KnowledgeBase> finalResults = results.stream()
            .limit(5)
            .collect(Collectors.toList());
        
        log.info("✅ Recherche hybride Gemini complète: {} résultats finaux", finalResults.size());
        return finalResults;
    }
    
    public String getStats() {
        long total = knowledgeBaseRepository.count();
        long withEmbedding = knowledgeBaseRepository.countWithEmbedding();
        double percentage = total > 0 ? (withEmbedding * 100.0 / total) : 0;
        
        // Tester la connexion au service AI
        boolean aiConnected = false;
        try {
            aiConnected = embeddingService.testAIConnection();
        } catch (Exception e) {
            log.warn("Erreur test connexion AI: {}", e.getMessage());
        }
        
        return String.format(
            "📊 Statistiques Vector RAG avec Gemini:\n" +
            "- Documents totaux: %d\n" +
            "- Documents avec embedding: %d (%.1f%%)\n" +
            "- Service d'embedding: %s\n" +
            "- Modèle AI: Gemini",
            total, withEmbedding, percentage,
            aiConnected ? "✅ Connecté" : "❌ Déconnecté"
        );
    }
    
    /**
     * NOUVELLE MÉTHODE: Test de la recherche vectorielle
     */
    public Map<String, Object> testVectorSearch(String testQuery) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            log.info("🧪 Test recherche vectorielle Gemini avec requête: '{}'", testQuery);
            
            // 1. Générer embedding de test
            float[] testEmbedding = embeddingService.generateEmbedding(testQuery);
            result.put("embeddingGenerated", testEmbedding.length > 0);
            result.put("embeddingDimensions", testEmbedding.length);
            
            // 2. Rechercher des documents similaires
            List<KnowledgeBase> similarDocs = knowledgeBaseRepository.findSimilarByEmbedding(testEmbedding, 3);
            result.put("similarDocumentsFound", similarDocs.size());
            
            // 3. Afficher les résultats
            List<Map<String, Object>> docsInfo = new ArrayList<>();
            for (KnowledgeBase doc : similarDocs) {
                Map<String, Object> docInfo = new HashMap<>();
                docInfo.put("id", doc.getId());
                docInfo.put("title", doc.getTitle());
                docInfo.put("tags", doc.getTags());
                docInfo.put("contentLength", doc.getContent() != null ? doc.getContent().length() : 0);
                
                // Calculer la similarité
                if (doc.getEmbedding() != null) {
                    double similarity = embeddingService.cosineSimilarity(testEmbedding, doc.getEmbedding());
                    docInfo.put("similarity", String.format("%.3f", similarity));
                }
                
                docsInfo.add(docInfo);
            }
            result.put("similarDocuments", docsInfo);
            
            // 4. Vérifier la connexion
            result.put("aiServiceConnected", embeddingService.testAIConnection());
            result.put("aiService", "Gemini");
            result.put("success", true);
            
            log.info("✅ Test recherche vectorielle Gemini réussi");
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
            log.error("❌ Erreur test recherche vectorielle: {}", e.getMessage());
        }
        
        return result;
    }
    
    /**
     * NOUVELLE MÉTHODE: Mettre à jour les embeddings pour tous les documents
     */
    public Map<String, Object> updateAllEmbeddings() {
        Map<String, Object> result = new HashMap<>();
        int updatedCount = 0;
        int errorCount = 0;
        
        try {
            log.info("🔄 Mise à jour des embeddings Gemini pour tous les documents");
            
            List<KnowledgeBase> allDocs = knowledgeBaseRepository.findAll();
            result.put("totalDocuments", allDocs.size());
            
            for (KnowledgeBase doc : allDocs) {
                try {
                    // Générer un nouvel embedding Gemini
                    String content = doc.getContent();
                    if (content != null && !content.trim().isEmpty()) {
                        float[] newEmbedding = embeddingService.generateEmbedding(content);
                        
                        // Mettre à jour le document
                        doc.setEmbedding(newEmbedding);
                        knowledgeBaseRepository.save(doc);
                        
                        updatedCount++;
                        
                        if (updatedCount % 10 == 0) {
                            log.info("📝 {} documents mis à jour...", updatedCount);
                        }
                    }
                } catch (Exception e) {
                    errorCount++;
                    log.warn("⚠️ Erreur mise à jour embedding document {}: {}", doc.getId(), e.getMessage());
                }
            }
            
            result.put("documentsUpdated", updatedCount);
            result.put("documentsWithErrors", errorCount);
            result.put("aiService", "Gemini");
            result.put("success", true);
            
            log.info("✅ Mise à jour embeddings Gemini terminée: {} mis à jour, {} erreurs", 
                    updatedCount, errorCount);
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
            log.error("❌ Erreur globale mise à jour embeddings: {}", e.getMessage());
        }
        
        return result;
    }
    
    /**
     * NOUVELLE MÉTHODE: Recherche sémantique avancée avec Gemini
     */
    public List<KnowledgeBase> findSemanticRelevantContent(String query, LearningProfile profile, double similarityThreshold) {
        log.info("🧠 Recherche sémantique avancée Gemini pour: '{}'", query);
        
        // 1. Générer l'embedding de la requête
        float[] queryEmbedding = embeddingService.generateEmbedding(query);
        if (queryEmbedding.length == 0) {
            log.warn("⚠️ Embedding Gemini vide pour la requête");
            return Collections.emptyList();
        }
        
        // 2. Recherche étendue
        List<KnowledgeBase> allCandidates = knowledgeBaseRepository.findSimilarByEmbedding(queryEmbedding, 20);
        
        // 3. Filtrer par seuil de similarité
        List<KnowledgeBase> filteredResults = new ArrayList<>();
        for (KnowledgeBase doc : allCandidates) {
            if (doc.getEmbedding() != null) {
                double similarity = embeddingService.cosineSimilarity(queryEmbedding, doc.getEmbedding());
                if (similarity >= similarityThreshold) {
                    filteredResults.add(doc);
                    log.debug("🎯 Document {}: similarité={} (seuil: {})", 
                            doc.getId(), String.format("%.3f", similarity), similarityThreshold);
                }
            }
        }
        
        // 4. Trier par similarité
        filteredResults.sort((d1, d2) -> {
            double s1 = embeddingService.cosineSimilarity(queryEmbedding, d1.getEmbedding());
            double s2 = embeddingService.cosineSimilarity(queryEmbedding, d2.getEmbedding());
            return Double.compare(s2, s1); // Décroissant
        });
        
        // 5. Limiter à 10 résultats maximum
        List<KnowledgeBase> finalResults = filteredResults.stream()
            .limit(10)
            .collect(Collectors.toList());
        
        log.info("✅ Recherche sémantique Gemini: {} résultats (seuil: {})", 
                finalResults.size(), similarityThreshold);
        
        return finalResults;
    }
}