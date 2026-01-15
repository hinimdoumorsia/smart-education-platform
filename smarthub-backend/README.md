# SmartHub — API REST (IATD)

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-brightgreen?logo=java&logoColor=white" alt="Java 21">
  <img src="https://img.shields.io/badge/Spring_Boot-3.4.11-6DB33F?logo=spring&logoColor=white" alt="Spring Boot 3.4.11">
  <img src="https://img.shields.io/badge/PostgreSQL-13-blue?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Maven-3.x-blueviolet?logo=apache-maven&logoColor=white" alt="Maven">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License">
</p>

Cette documentation explique l'objectif, l'architecture, les composants principaux, les fichiers importants, les classes et comment lancer l'application en développement.

<!-- Table des matières cliquable -->
## Table des matières

- Sections principales (dans ce README)
  - Vue d'ensemble
  - Architecture
  - Décisions et conventions clés
  - Structure des dossiers (résumé)
  - Lancement local
  - Endpoints (exemples)
  - Sécurité & améliorations possibles

- Documentation détaillée (fichiers dans `docs/`)
  - [Table des contenus (point d'entrée) — docs/TOC.md](docs/TOC.md)
  - [Controllers — docs/controllers.md](docs/controllers.md)
  - [Services — docs/services.md](docs/services.md)
  - [Repositories — docs/repositories.md](docs/repositories.md)
  - [Models — docs/models.md](docs/models.md)
  - [DTOs — docs/dtos.md](docs/dtos.md)
  - [Config — docs/config.md](docs/config.md)
  - [Agents — docs/agents.md](docs/agents.md)
  - [RAG — docs/rag.md](docs/rag.md)
  - [Diagrams — docs/diagrams.md](docs/diagrams.md)
  - [Visual Architecture — docs/visual-architecture.md](docs/visual-architecture.md)

> Remarque : sur GitHub, les liens relatifs vers les fichiers Markdown sous `docs/` ouvrent directement ces fichiers — idéal pour la navigation du dépôt.

## 1. Vue d'ensemble
- **But** : Fournir une API pour gérer utilisateurs et ressources pédagogiques (annonces, stages, projets, quiz, ressources) de l'IATD (Institut d'Animation et de Technologies Digitales).
- **Stack** : Java 21, Spring Boot 3.4.11, Spring Data JPA, PostgreSQL, Lombok, Maven.
- **Base de données** : PostgreSQL (`localhost:5432`, base `iatd_smarthub`).

## 2. Architecture
Architecture en couches : Controller → Service → Repository → Base PostgreSQL.

```
Controller (/api/v1/*)
   ↓
Service (logique métier, transactions)
   ↓
Repository (Spring Data JPA)
   ↓
PostgreSQL
```

- DTOs (Request/Response) pour isoler le contrat HTTP.
- Entités JPA sous `model/` avec contraintes et mapping.

## 3. Décisions et conventions clés
- Validation : annotations sur entités et doublées dans DTOs pour un contrat API explicite.
- Transactions : lectures annotées `@Transactional(readOnly = true)` ; écritures `@Transactional`.
- Unicité email/username : contrainte DB + vérifications service pour fast-fail.
- Rôles : enum `Role {STUDENT, TEACHER, ADMIN}` persistée en `STRING`.
- Password encoding : prévu via `PasswordEncoder` (BCrypt) — vérifier amélioration pour encoder systématiquement avant `save`.
- Logging : pattern Lombok `@Slf4j` dans les services, infos contextuelles (email, id).

## 4. Structure des dossiers (résumé)
```
src/main/java/com/iatd/smarthub/
  SmarthubApplication.java         -> Point d'entrée Spring Boot
  controller/                      -> REST controllers (UserController, QuizController, ...)
  service/                         -> Logique métier
  repository/                      -> Interfaces JpaRepository
  dto/                             -> DTO Request / Response
  model/                           -> Entités JPA par domaine
src/main/resources/
  application.properties           -> Config DB, JPA, logging
```
Autres fichiers : `pom.xml`, `mvnw`, `mvnw.cmd`, `HELP.md`.

### 4.1 Structure détaillée des packages et classes

| Package | Classes |
|---------|---------|
| `com.iatd.smarthub` | `SmarthubApplication` (bootstrap Spring Boot) |
| `com.iatd.smarthub.controller` | `AnnouncementController`, `InternshipController`, `ProjectController`, `QuizController`, `ResourceController`, `UserController` |
| `com.iatd.smarthub.service` | `AnnouncementService`, `FileStorageService` (gestion fichiers), `InternshipService`, `ProjectService`, `QuizAttemptService`, `QuizService` (interface éventuelle), `QuizServiceImpl` (implémentation), `ResourceService`, `UserService` |
| `com.iatd.smarthub.repository` | `AnnouncementRepository`, `AnswerRepository`, `InternshipRepository`, `ProjectRepository`, `QuestionRepository`, `QuizAttemptRepository`, `QuizRepository`, `ResourceRepository`, `UserRepository` |
| `com.iatd.smarthub.dto` | `AnnouncementRequestDTO`, `AnnouncementResponseDTO`, `AnswerRequestDTO`, `AnswerResponseDTO`, `AnswerStatisticsDTO`, `InternshipRequestDTO`, `InternshipResponseDTO`, `ProjectRequestDTO`, `ProjectResponseDTO`, `QuestionRequestDTO`, `QuestionResponseDTO`, `QuizAttemptRequestDTO`, `QuizAttemptResponseDTO`, `QuizRequestDTO`, `QuizResponseDTO`, `QuizStatisticsDTO`, `QuizSummaryDTO`, `ResourceRequestDTO`, `ResourceResponseDTO`, `UserBasicDTO`, `UserRequestDTO`, `UserResponseDTO`, `QuizGenerationRequest` ← NOUVEAU |
| `com.iatd.smarthub.model.base` | `BaseEntity` (ID / timestamps communs) |
| `com.iatd.smarthub.model.user` | `User` (entité utilisateur + rôle) |
| `com.iatd.smarthub.model.announcement` | `Announcement`, `AnnouncementType` (type d'annonce) |
| `com.iatd.smarthub.model.internship` | `Internship` |
| `com.iatd.smarthub.model.project` | `Project` |
| `com.iatd.smarthub.model.quiz` | `Answer`, `Question`, `QuestionType`, `Quiz`, `QuizAttempt` |
| `com.iatd.smarthub.model.resource` | `Resource` |

Notes rapides :
- Le duo `QuizService` / `QuizServiceImpl` illustre une séparation interface/implémentation (facilite tests ou extensions futures).
- `FileStorageService` gère la logique de stockage de fichiers (probablement pour ressources ou pièces jointes).
- Les DTO statistiques (`AnswerStatisticsDTO`, `QuizStatisticsDTO`, `QuizSummaryDTO`) fournissent des vues agrégées côté API sans exposer les entités directement.
- `BaseEntity` factorise les champs communs (ex.: identifiant, timestamps) pour réduire la duplication dans les entités domaine.

## 5. Fichiers et rôles principaux
- `pom.xml` : Dépendances, version parent Spring Boot.
- `SmarthubApplication.java` : Démarrage de l'application (`SpringApplication.run`).
- Controllers : exposent endpoints (`/api/v1/...`), reçoivent DTOs annotés `@Valid`.
- Services : logique métier, vérifications, encodage éventuel des mots de passe, transactions.
- Repositories : requêtes dérivées (`findByEmail`, `existsByUsername`, etc.).
- DTOs : Isolent format API, `ResponseDTO` ne renvoie pas les mots de passe.
- Entités : mapping JPA + contraintes (`@NotNull`, `@Column`, `@Enumerated`).

## 6. Communication entre couches
1. Requête HTTP → Controller → DTO Request.
2. Conversion/validation → Service → règles métier + repository.
3. Persistance/recherche → Entité JPA/DB.
4. Réponse → DTO Response (sans données sensibles).

## 7. Lancement local
Prérequis : PostgreSQL opérationnel avec base créée.

Création base :
```powershell
psql -U postgres -c "CREATE DATABASE iatd_smarthub;"
```

Démarrer l'appli :
```powershell
.\mvnw spring-boot:run
```

Build + package :
```powershell
.\mvnw clean package
java -jar target\smarthub-*.jar
```

Tests :
```powershell
.\mvnw test
```

## 8. Endpoints (exemples)
- `POST /api/v1/users` : créer utilisateur.
- `GET /api/v1/users/{id}` : récupérer utilisateur.
- `DELETE /api/v1/users/{id}` : supprimer utilisateur.
(Consulter dossiers `controller` pour la liste complète.)

## 9. Patterns de code
- Lombok pour constructeurs/accès (`@RequiredArgsConstructor`, `@Getter/@Setter`).
- Logging clair avec contexte (ID, email).
- DTOs dédiés à la couche API (pas d'exposition de champs sensibles).
- Enum persisté en `STRING` pour lisibilité et compatibilité.
- Couches nettes : pas de logique métier dans controllers.

## 10. Sécurité & améliorations possibles
- Encoder systématiquement les mots de passe avant persistance.
- Ajouter Spring Security + JWT pour auth/autorisation.
- Restreindre CORS (actuellement permissif si configuration globale ouverte).
- Centraliser la gestion d'erreurs via `@RestControllerAdvice`.
- Ajouter pagination pour listes importantes (utilisateurs, ressources).

## 11. Procédure de mise à niveau
Pour passer à une version plus récente de Spring Boot :
1. Modifier la version parent dans `pom.xml`.
2. Exécuter :
```powershell
.\mvnw clean verify
```
3. Corriger les dépréciations/erreurs éventuelles.

## 12. Responsabilités (récapitulatif)
- Controller : Mapping URI, validation initiale.
- Service : Règles métier, transactions, orchestrations.
- Repository : Accès données abstrait JPA.
- DTO : Contrats d'échange HTTP.
- Entité : Modélisation persistence.

## 13. Prochaines étapes suggérées
- Ajouter tests unitaires (Mockito) pour services essentiels.
- Implémenter encodage mot de passe uniforme.
- CI GitHub Actions (build + test).
- Ajout d'un `CHANGELOG.md` pour tracer les évolutions.

## Sommaire (Table des matières)

Sections principales :

- Vue d'ensemble (voir le haut du README)
- Architecture
- Structure des dossiers
- Lancement local

Documentation (fichiers dans `docs/`) :

- `docs/TOC.md` — Table des contenus (point d'entrée)
- `docs/controllers.md` — Controllers (endpoints et exemples)
- `docs/services.md` — Services (rôles et signatures)
- `docs/repositories.md` — Repositories (métodos JPA)
- `docs/models.md` — Modèles / Entités (ERD simplifié)
- `docs/dtos.md` — DTOs (Request / Response)
- `docs/config.md` — Config (Security, JWT, CORS, clients externes)
- `docs/agents.md` — Agents métier (orchestrateurs)
- `docs/rag.md` — RAG (indexation / retrieval / generation)
- `docs/diagrams.md` — Diagrammes Mermaid (architecture, séquences, ERD)
- `docs/visual-architecture.md` — Visual Architecture (consolidated)

## Documentation détaillée (docs/)

Les documents détaillés sont dans le dossier `docs/`. Ouvre `docs/TOC.md` pour le point d'entrée.

Que puis-je faire ensuite ?

Générer une documentation complète par classe (méthodes publiques, signatures, javadoc, exemples). Cela nécessite que je lise chaque fichier Java; je peux l'automatiser si tu confirmes.
Générer un fichier docs/ par package avec fichiers Markdown par classe.
Ajouter un sommaire (Table of Contents) et liens dans ce README.
Dis-moi la montée en détails que tu veux : "aperçu" (déjà fait), "détaillé (méthodes/signatures)", ou "docs séparés par package".