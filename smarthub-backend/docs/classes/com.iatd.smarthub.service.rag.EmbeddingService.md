# com.iatd.smarthub.service.rag.EmbeddingService

Rôle
- Génération d'embeddings pour du texte, gestion d'un cache in-memory, calcul de similarité (cosine).
- Interface entre le pipeline RAG et le service IA (`OllamaService` qui utilise Gemini).

Emplacement
- `src/main/java/com/iatd/smarthub/service/rag/EmbeddingService.java`

Annotations
- `@Service`, `@RequiredArgsConstructor`, `@Slf4j`

Dépendances
- `private final OllamaService ollamaService`
- `private final Map<String,float[]> embeddingCache` (ConcurrentHashMap)

Méthodes principales
- `public float[] generateEmbedding(String text)`
  - Normalise le texte, vérifie le cache, appelle `ollamaService.generateEmbedding(normalizedText)`, met en cache.
  - Fallback : `generateFallbackEmbedding` si erreur.
- `private float[] generateFallbackEmbedding(String text)`
- `private void manageCacheSize()`
- `private String normalizeTextForEmbedding(String text)`
- `public double cosineSimilarity(float[] vec1, float[] vec2)`
- `public boolean testAIConnection()`
- `public Map<String,Object> checkModelCompatibility()`
- `public void clearCache()`
- `public Map<String,Object> getCacheStats()`
- `public Map<String,float[]> generateEmbeddingsBatch(List<String> texts)`
- `public double textSimilarity(String text1, String text2)`
- `public List<String> findMostSimilar(String query, List<String> candidates, int topK)`

Notes opérationnelles
- Utilise un cache d'embeddings (taille max contrôlée) pour éviter recomputation.
- Gère dimensionnalité et fallback si l'API d'embeddings n'est pas disponible.

Exemple simplifié
```java
float[] emb = embeddingService.generateEmbedding("Exemple de texte");
double sim = embeddingService.cosineSimilarity(emb1, emb2);
```