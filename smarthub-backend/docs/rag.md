# RAG (Retrieval-Augmented Generation) — SmartHub

Ce projet embarque des composants RAG pour générer quiz et contenus enrichis à partir d'une base documentaire.

Composants clé :
- Ingestion / Indexation
  - `ResourceService` ou `RAG` ingestion pipeline découpe documents en passages (chunks), nettoie et normalise le texte, puis calcule embedding via `EmbeddingService`.
  - Les passages et embeddings sont stockés dans un store (DB + vector index) — représenté par `KnowledgeBase` + `KnowledgeBaseRepository`.

- Retrieval
  - `VectorRAGService` / `RAGQuizService` recherche les top-k passages pertinents pour une requête via similarité cosinus sur embeddings.

- Generation
  - `RAGQuizGenerationService` construit un prompt à partir des passages récupérés et appelle un modèle de génération (`OllamaService` / Gemini via RestTemplate).
  - Résultat : texte généré transformé en `Quiz`/`Question` via parsing.

- Cache & optimisation
  - Embeddings mis en cache (Redis ou en-mémoire) pour éviter recomputation.
  - Passage store pagination et métadonnées (source file, offset) pour traçabilité.

Flux simplifié :
1. Ingestion -> chunking -> embed -> store
2. Query -> embed(query) -> search(topK) -> assemble prompt
3. Model call -> parse -> persist as Quiz/Resource

Exemples d'appels :
- `embeddingService.embed(text)` → float[]
- `vectorRAGService.search(embedding, topK)` → List<Passage>
- `ragQuizGenerationService.generateQuiz(topic, topK)` → Quiz