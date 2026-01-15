# Repositories — SmartHub

Les repositories sont des interfaces `JpaRepository<Entity, ID>` et définissent les méthodes de recherche utilisées par les services.

Exemples de méthodes et contrats attendus :

- `UserRepository extends JpaRepository<User, Long>`
  - `Optional<User> findByEmail(String email)`
  - `Optional<User> findByUsername(String username)`
  - `Optional<User> findByEmailOrUsername(String email, String username)`
  - `Boolean existsByEmail(String email)`
  - `Boolean existsByUsername(String username)`

- `QuizRepository`
  - `List<Quiz> findByCourseId(Long courseId)`

- `ResourceRepository`
  - `List<Resource> findByCourse(Long courseId)`

- RAG repositories (`repository.rag`)
  - `KnowledgeBaseRepository` — opérations CRUD pour documents indexés
  - `LearningProfileRepository` — profils d'apprentissage (user-centric)
  - `QuizRecommendationRepository` — stocke recommandations calculées

Bonnes pratiques :
- Préférer méthodes dérivées (naming convention) quand possible.
- Utiliser `@Query` pour requêtes complexes avec `@Param`.
- Les checks `existsBy*` sont utilisés pour fast-fail dans les services (même si la base a des contraintes uniques).