# Services — SmartHub

Les services contiennent la logique métier. Ils sont annotés `@Service`, utilisent `@RequiredArgsConstructor` et `@Slf4j`. Les écritures sont `@Transactional` et les lectures `@Transactional(readOnly = true)`.

Extraits et méthodes importantes (rôle et signatures typiques) :

- `UserService` (comportement attendu)
  - `@Transactional
    public User createUser(User user)`
    - Vérifications : `existsByEmail`, `existsByUsername`
    - Action : encoder le mot de passe via `passwordEncoder.encode()` puis `userRepository.save(user)`
  - `@Transactional(readOnly = true)
    public User getUserById(Long id)`
  - `@Transactional(readOnly = true)
    public List<User> getAllUsers()`
  - `@Transactional
    public User updateUser(Long id, User changes)`
  - `@Transactional
    public void deleteUser(Long id)`

- `AuthService`
  - `public AuthResponse authenticate(AuthRequest request)` — valide credentials, génère JWT via `JwtUtil`
  - `public User register(RegisterRequest)` — crée un nouvel utilisateur (encode password)

- `FileStorageService`
  - `public String storeFile(MultipartFile file, String subPath)` — enregistre et retourne le chemin/nom
  - `public Resource loadAsResource(String filename)` — lit un fichier pour téléchargement

- `QuizService` / `QuizServiceImpl`
  - `public Quiz createQuiz(QuizRequestDTO dto)`
  - `public QuizResponseDTO getQuiz(Long id)`
  - `public QuizAttempt startAttempt(Long quizId, User user)`
  - `public Score submitAttempt(QuizAttemptRequestDTO dto)`

- `RAG` services (résumé)
  - `EmbeddingService` — `public float[] embed(String text)` / gestion cache
  - `VectorRAGService` — `public List<Passage> search(float[] queryEmbedding, int topK)`
  - `RAGQuizGenerationService` — orchestration : recherche passages → prompt → call IA → parser

- `EmailService` — `public void send(String to, String subject, String content)`

Observations :
- Logger `log.info` pour créations/updates/deletes
- `RuntimeException` utilisé pour signaler erreurs métiers (pattern du projet)