# Modèles / Entités — SmartHub

Cette section décrit les entités JPA principales, leurs champs significatifs et relations (ERD simplifié). Les entités héritent souvent de `BaseEntity` qui définit `id`, `createdAt`, `updatedAt`.

Principales entités :

- `BaseEntity`
  - `Long id`
  - `Timestamp createdAt` (`@CreationTimestamp`)
  - `Timestamp updatedAt` (`@UpdateTimestamp`)

- `User` (com.iatd.smarthub.model.user.User)
  - `String username` (unique)
  - `String email` (unique)
  - `String password` (BCrypt)
  - `Role role` (`@Enumerated(EnumType.STRING)`)
  - `String avatarPath` (optionnel)
  - Relations :
    - OneToMany -> `QuizAttempt` (attempts)
    - OneToMany -> `Project` (if owner)

- `Course`
  - `String title`, `String description`, `List<CourseFile> files`
  - Relations : OneToMany `CourseFile`, OneToMany `Quiz`

- `Quiz`, `Question`, `Answer`, `QuizAttempt`
  - `Quiz` contient `List<Question>`
  - `Question` contient `List<Answer>` et `QuestionType` (MULTIPLE_CHOICE, OPEN)
  - `QuizAttempt` relie `User` et `Quiz` (score, startedAt, finishedAt)

- `Assignment`, `AssignmentSubmission`, `SubmissionFile`
  - `Assignment` relié à `Course` et `Project`
  - `AssignmentSubmission` relié à `User` et `Assignment` avec `files`, `grade`

- `Resource` (métadonnées) — stocke référence au fichier réel (path), tags, résumés pour RAG

- RAG modèles : `KnowledgeBase`, `LearningProfile`, `QuizRecommendation`
  - `KnowledgeBase` contient documents découpés en passages + embedding vector (stocké dans l'index/vector store)
  - `LearningProfile` stocke vecteurs/compétences utilisateur pour personnalisation

Exemple simplifié d'ERD (voir `diagrams.md` pour représentation Mermaid plus lisible).