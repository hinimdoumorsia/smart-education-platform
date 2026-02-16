<h1 style="color:#0d47a1;">PARTIE I : BACKEND</h1>

Le backend constitue le cœur technique de la plateforme **SmartHub**.  
Il assure la gestion complète de la logique métier, la sécurisation des accès, la communication avec les bases de données, ainsi que l’orchestration des services intelligents intégrant l’intelligence artificielle.

Dans cette partie, nous allons explorer en détail :

- L’architecture technique du backend  
- Les fichiers de configuration principaux  
- Les dépendances et frameworks utilisés  
- L’intégration du système RAG et des agents intelligents  
- Les mécanismes de sécurité et d’authentification  

Nous analyserons également la structure du projet Spring Boot, le rôle de chaque composant, ainsi que les choix technologiques adoptés pour garantir performance, modularité et évolutivité.

Cette section pose ainsi les bases techniques permettant de comprendre le fonctionnement interne du système backend.


# <h2 style="color:#0d47a1;">Architecture complète du backend — SmartHub<h2>

Chemin projet : `smarthub-backend` (module principal)
Sources principales : `src/main/java/com/iatd/smarthub/`

But : documenter l'architecture technique, les composants, le flux de données, la sécurité, le déploiement et les points d'extension.

---

## <h2 style="color:#0d47a1;">1. Vue d'ensemble<h2>
Le backend SmartHub est une application Spring Boot (Java 21, Spring Boot 3.3.x) organisée selon le pattern en couches :

- Présentation (Controllers) : API REST exposant les endpoints pour le frontend et les agents.
- Couche métier (Services) : logique applicative, règles métier, orchestration IA/RAG, agents adaptatifs.
- Persistance (Repositories) : accès JPA/Hibernate vers MariaDB/PostgreSQL et pgvector pour la recherche vectorielle.
- Composants transverses : sécurité (JWT + Spring Security), stockage de fichiers, email, intégration LLM.

Les agents adaptatifs et le sous-système RAG/LLM sont traités comme des services métier spécialisés pour conserver la testabilité et l'indépendance du domaine.

---

## <h2 style="color:#0d47a1;">2. Organisation physique (arborescence importante)<h2>

- `src/main/java/com/iatd/smarthub/controller/` — contrôleurs REST
- `src/main/java/com/iatd/smarthub/service/` — services métier (liste détaillée ci-dessous)
  - `service/agent/` — agents orchestrateurs et adaptatifs
  - `service/rag/` — composants RAG et recherche vectorielle
- `src/main/java/com/iatd/smarthub/repository/` — interfaces Spring Data JPA
- `src/main/java/com/iatd/smarthub/model/` — entités JPA et modèles métier
- `src/main/java/com/iatd/smarthub/dto/` — DTOs request/response
- `src/main/resources/` — `application.properties`, fichiers statiques

---

## <h2 style="color:#0d47a1;">3. Couche Services — liste et responsabilité (exhaustif)<h2>

- `AnnouncementService` — créer/éditer/publier/filtrer annonces
- `UserService` — CRUD utilisateurs, recherches, récupération d'entités pour contrôles
- `AuthService` — enregistrement, login, génération/validation JWT, gestion mot de passe
- `CustomUserDetailsService` — adaptation pour Spring Security (UserDetailsService)
- `CourseService` — gestion des cours, étudiants inscrits, cohérence des relations
- `CourseFileService` — upload/download, autorisations liées aux cours
- `FileStorageService` — abstraction du stockage local des fichiers (upload-dir)
- `ResourceService` — gestion des ressources pédagogiques et métadonnées
- `ProjectService` — création/gestion de projets pédagogiques, supervision
- `InternshipService` — gestion des stages, assignation de superviseurs
- `QuizService` (interface) & `QuizServiceImpl` — CRUD quiz, statistiques, recherche
- `QuizGenerationService` — génération de quiz via LLM (prompting, validation)
- `QuizAttemptService` — démarrer/soumettre/reprendre tentatives, scoring
- `OllamaService` — client pour LLM (Gemini) : génération, embeddings, parsers
- `StatsService` — collecte et agrégation des métriques métier
- `UserInteractionService` — tracking des interactions (views, likes, bookmarks)
- `EmailService` — envoi d'emails (SMTP)
- `AssignmentService` / `AssignmentSubmissionService` — placeholders pour devoirs

Sous-dossier `service/agent/` :
- `QuizOrchestratorAgent` — orchestration de sessions quiz complexes
- `AdaptiveQuizOrchestrator` — logique adaptative (sélection dynamique de questions)
- `CourseQuizSupervisorAgent` — règles métier limitant tentatives/échecs
- `RecommendationEngineAgent` — recommandations de quiz/ressources
- `ProgressTrackerAgent` — suivi et consolidation de la progression utilisateur
- `UserQuizHistory` — historique/support pour recommandations

Sous-dossier `service/rag/` :
- `EmbeddingService` — création et cache des embeddings (LLM/pgvector)
- `VectorRAGService` — requêtes vectorielles, similarité, scoring
- `RAGQuizService` / `RAGQuizGenerationService` — pipeline retrieval + generation

---

## <h2 style="color:#0d47a1;">4. Flux de données et séquences types<h2>

1) Authentification
- `AuthController` -> `AuthService` -> `UserRepository` / `PasswordEncoder` / `JwtUtil` -> retourne JWT au client

2) Création d'un quiz via IA
- `QuizController` -> `QuizGenerationService` -> `OllamaService` (prompt) -> parse -> `QuizRepository` + `QuestionRepository`

3) Requête RAG personnalisée
- `RAGQuizController` -> `RAGQuizService` -> `EmbeddingService` -> `VectorRAGService` (pgvector/Postgres) -> documents -> `OllamaService` pour génération finale

4) Tentative de quiz
- `QuizAttemptController` -> `QuizAttemptService` -> `QuizAttemptRepository` + `QuestionRepository` + `AnswerRepository` -> score -> `UserQuizHistory`

Diagramme simplifié (ASCII):

Frontend -> Controller -> Service -> Repository -> Database
                         ↘
                          LLM/RAG -> Vector DB / External API

---

## <h2 style="color:#0d47a1;">5. Base de données & recherche vectorielle<h2>

- Principal stockage relationnel : MariaDB (production) ou PostgreSQL (optionnel).
- Recherche vectorielle : `pgvector` (Postgres) ou solution externe (Pinecone, Milvus) pour embeddings.
- Schéma JPA/Hibernate avec `ddl-auto=update` (dev), usage de batch inserts et timezone UTC.

Tables clés : `users`, `courses`, `projects`, `announcements`, `quizzes`, `questions`, `answers`, `quiz_attempts`, `resources`, `embeddings`.

---

## <h2 style="color:#0d47a1;">6. Sécurité<h2>

- Spring Security + JWT
- `CustomUserDetailsService` pour loader les rôles
- Endpoints sensibles protégés par `@PreAuthorize` ou vérifications manuelles
- Mot de passe encodés avec `PasswordEncoder`
- CORS limité aux origines frontend
- Meilleures pratiques : centraliser exceptions (RestControllerAdvice), vérifier ownership coté service

---

## <h2 style="color:#0d47a1;">7. Configuration & propriétés importantes<h2>

Fichier principal : `application.properties` (extraits importants) :
- `server.port`, `spring.datasource.*`, `spring.jpa.*`, `file.upload-dir`, `jwt.secret`, `gemini.*`, `rag.*`, `agent.*`, `cors.*`

Secrets (JWT key, SMTP password, Gemini API key) doivent être fournis via variables d'environnement ou vault.

---

## <h2 style="color:#0d47a1;">8. Intégration LLM & RAG<h2>

- `OllamaService` agit comme client adaptatif pour les appels LLM (Gemini). Il gère : prompts templates, timeouts, parsing JSON et créations d'embeddings.
- Pipeline RAG typique :
  1. Créer embedding du query
  2. Requête vectorielle (top-k)
  3. Récupérer passages/documents
  4. Construire prompt avec contexte + user query
  5. Appeler LLM pour génération (réponse augmentée)

Cache d'embeddings (taille configurable) pour diminuer les coûts d'appel.

---

## <h2 style="color:#0d47a1;">9. Agents adaptatifs<h2>

- Les agents exécutent des workflows plus longs ou récurrents : orchestration quiz, recommandations, règles de sanctions.
- Ils peuvent être implémentés comme Spring components / scheduled tasks ou microservices séparés selon la charge.
- Les agents doivent exposer des points d'extension (webhooks, events) pour intégration future (Kafka, RabbitMQ).

---

## <h2 style="color:#0d47a1;">10. Observabilité, tests et CI/CD<h2>

- Logging : `logging.level.com.iatd.smarthub=DEBUG` pour dev
- Monitoring : ajouter Micrometer + Prometheus + Grafana pour métriques
- Tests : unitaires (JUnit5 + Mockito) pour services, tests d'intégration avec base en mémoire (Testcontainers)
- Pipeline CI : Maven build, tests, static analysis (SpotBugs, PMD), packaging Docker

Exemples commandes de build local :

```bash
mvn -DskipTests=false clean test package
docker build -t smarthub-backend:local .
```

---

## <h2 style="color:#0d47a1;">11. Déploiement recommandé<h2>

- Containeriser l'application (Docker) + déployer via Kubernetes ou Azure App Service / App Runner.
- Variables sensibles dans secrets manager.
- DB séparée (managed), vector store (managed) pour scalabilité.
- Autoscaling horizontal du backend selon CPU/latence API LLM.

---

## <h2 style="color:#0d47a1;">12. Points d'amélioration & feuille de route<h2>

- Extraire LLM/RAG en microservice dédié si la charge augmente.
- Remplacer `ddl-auto=update` par migrations Flyway/Liquibase en production.
- Ajouter circuit-breaker (Resilience4j) autour des appels LLM externes.
- Intégrer file storage S3-compatible pour fichiers volumineux.
- Ajouter roles fins et politique RBAC centralisée.

---

## <h2 style="color:#0d47a1;">13. Références des fichiers clés<h2>

- `smarthub-backend/src/main/java/com/iatd/smarthub/service/*` — services
- `smarthub-backend/src/main/java/com/iatd/smarthub/service/agent/*` — agents
- `smarthub-backend/src/main/java/com/iatd/smarthub/service/rag/*` — RAG
- `smarthub-backend/src/main/resources/application.properties` — configuration

---




## <h2 style="color:#0d47a1;">I.1 Fichiers de configuration du Backend<h2>

Le backend de **SmartHub** est basé sur une architecture **Spring Boot 3.3.4** avec Java 21.  
La configuration principale repose sur deux fichiers essentiels :

- `application.properties`
- `pom.xml`

Ces fichiers définissent le comportement du serveur, la base de données, la sécurité JWT, le système RAG, l’intégration Gemini AI, ainsi que les agents intelligents.

---

## <h2 style="color:#0d47a1;">Stack Technique Réellement Utilisée<h2>

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-brightgreen?logo=java&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring_Boot-3.3.4-6DB33F?logo=spring&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring_Security-JWT-6DB33F?logo=springsecurity&logoColor=white" />
  <img src="https://img.shields.io/badge/MariaDB-Database-blue?logo=mariadb&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-pgvector-blue?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Maven-3.x-C71A36?logo=apache-maven&logoColor=white" />
  <img src="https://img.shields.io/badge/Hibernate-6.4-59666C?logo=hibernate&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini-LLM-orange" />
  <img src="https://img.shields.io/badge/RAG-Enabled-black" />
</p>

---

# <h2 style="color:#0d47a1;">Configuration Serveur<h2>

```properties
server.port=8081
spring.application.name=smarthub
```

- Le backend écoute sur le port **8081**.
- `spring.application.name` identifie l’application dans les logs et environnements distribués.

---

# <h2 style="color:#0d47a1;">Configuration Base de Données<h2>

### <h2 style="color:#0d47a1;">Connexion MariaDB<h2>

```properties
spring.datasource.url=jdbc:mariadb://127.0.0.1:3306/smarthub
spring.datasource.username=root
spring.datasource.driver-class-name=org.mariadb.jdbc.Driver
```

- Base locale sur le port **3306**
- Base nommée `smarthub`

### <h2 style="color:#0d47a1;">Pool de connexions (HikariCP)<h2>

```properties
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
```

- Maximum 10 connexions simultanées
- 5 connexions maintenues actives
- Timeout de 30 secondes

---

# <h2 style="color:#0d47a1;">JPA / Hibernate<h2>

```properties
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.open-in-view=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MariaDBDialect
```

- `ddl-auto=update` : synchronisation automatique du schéma
- `show-sql=true` : affichage des requêtes SQL
- `open-in-view=false` : bonne pratique pour éviter les LazyInitializationException
- Dialecte optimisé pour MariaDB

Optimisations activées :
- Batch size = 20
- Order inserts / updates
- Gestion timezone UTC
- Encodage UTF-8 (utf8mb4)

---

# <h2 style="color:#0d47a1;">Upload & Gestion des Fichiers<h2>

```properties
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
file.upload-dir=./uploads
file.allowed-extensions=txt,pdf,doc,docx,md
```

- Taille maximale : 10MB
- Stockage local dans `/uploads`
- Extensions autorisées sécurisées

---

# <h2 style="color:#0d47a1;">Sécurité & Authentification (JWT)<h2>

```properties
spring.security.user.name=admin
spring.security.user.password=admin123
jwt.secret=********
jwt.expiration=86400000
```

- Authentification via **Spring Security**
- JWT expiration : **24h (86400000 ms)**
- Clé secrète utilisée pour signer les tokens

Dépendances utilisées dans `pom.xml` :
- `jjwt-api`
- `jjwt-impl`
- `jjwt-jackson`

---

# <h2 style="color:#0d47a1;">Configuration Email (SMTP Gmail)<h2>

```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.properties.mail.smtp.starttls.enable=true
```

- Protocole SMTP sécurisé TLS
- Authentification activée
- Timeout configuré pour stabilité

---

# <h2 style="color:#0d47a1;">Intégration Gemini AI<h2>

```properties
gemini.model.name=gemini-2.5-flash
gemini.timeout.ms=60000
gemini.max-tokens=8000
gemini.temperature=0.7
```

- Modèle utilisé : **Gemini 2.5 Flash**
- Timeout : 60 secondes
- Max tokens : 8000
- Température 0.7 → génération créative contrôlée

### <h2 style="color:#0d47a1;">Embeddings<h2>

```properties
gemini.embedding.model=embedding-001
gemini.embedding.dimensions=768
```

- Vecteurs de dimension **768**
- Utilisés pour la recherche sémantique (RAG)

---

# <h2 style="color:#0d47a1;">Système RAG (Retrieval-Augmented Generation)<h2>

```properties
rag.enabled=true
rag.similarity-threshold=0.6
rag.search.max-results=5
```

- RAG activé
- Score minimal de similarité : 0.6
- Maximum 5 résultats retournés
- Cache embeddings activé (1000 entrées)

---

# <h2 style="color:#0d47a1;">Configuration Quiz & Agents<h2>

```properties
quiz.generation.max-questions=50
agent.supervisor.max-attempts-per-day=3
agent.supervisor.passing-score=60
```

- Maximum 50 questions générables
- 3 tentatives par jour
- Score minimum de réussite : 60%

---

# <h2 style="color:#0d47a1;">CORS<h2>

```properties
cors.allowed-origins=http://localhost:3002,http://localhost:3000
cors.allowed-methods=GET,POST,PUT,DELETE
```

- Autorise le frontend React local
- Support des principales méthodes HTTP

---

# <h2 style="color:#0d47a1;">Gestion des Dépendances (Maven - pom.xml)<h2>

Projet basé sur :

- Java 21
- Spring Boot Starter Web
- Spring Data JPA
- Spring Security
- Hibernate 6.4
- PostgreSQL + pgvector (recherche vectorielle)
- MariaDB driver
- Lombok
- PDFBox
- WebFlux (appels HTTP asynchrones)
- Jakarta Mail

Build assuré par :
- `spring-boot-maven-plugin`
- `maven-compiler-plugin`
- Encodage UTF-8

---


<h1 style="color:#0d47a1;">CONFIGURATION FINALE DU BACKEND</h1>

---

#  <h1 style="color:#0d47a1;">VOILÀ À QUOI DOIT RESSEMBLER VOTRE application.properties<h1>

```properties
# ================= SERVER =================
server.port=8081
spring.application.name=smarthub

# ================= APP CONFIG =================
app.base-url=http://localhost:8081
app.file-storage-location=./uploads

# ================= DATABASE MARIADB =================
spring.datasource.url=jdbc:mariadb://127.0.0.1:3306/smarthub?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=
spring.datasource.driver-class-name=org.mariadb.jdbc.Driver

spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000

# ================= JPA / HIBERNATE =================
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.open-in-view=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MariaDBDialect
spring.jpa.properties.hibernate.jdbc.batch_size=20
spring.jpa.properties.hibernate.order_inserts=true
spring.jpa.properties.hibernate.order_updates=true
spring.jpa.properties.hibernate.jdbc.time_zone=UTC

# ================= FILE UPLOAD =================
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
file.upload-dir=./uploads
spring.web.resources.static-locations=classpath:/static/,file:${file.upload-dir}
file.allowed-extensions=txt,pdf,doc,docx,md

# ================= SECURITY =================
spring.security.user.name=admin
spring.security.user.password=admin123
jwt.secret=YOUR_SECRET_KEY
jwt.expiration=86400000

# ================= SMTP =================
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your_email@gmail.com
spring.mail.password=your_app_password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

# ================= GEMINI AI =================
gemini.model.name=gemini-2.5-flash
gemini.timeout.ms=60000
gemini.max-tokens=8000
gemini.temperature=0.7

gemini.embedding.model=embedding-001
gemini.embedding.dimensions=768
gemini.embedding.max-text-length=500

# ================= RAG =================
rag.enabled=true
rag.similarity-threshold=0.6
rag.search.max-results=5
rag.embedding.cache.enabled=true
rag.embedding.cache.size=1000

# ================= QUIZ =================
quiz.generation.max-questions=50
quiz.generation.default-count=5
quiz.rag.enabled=true

# ================= AGENT =================
agent.supervisor.max-attempts-per-day=3
agent.supervisor.min-time-between-attempts=30
agent.supervisor.quiz-timeout-minutes=60
agent.supervisor.passing-score=60

# ================= CORS =================
cors.allowed-origins=http://localhost:3000,http://localhost:3002
cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
cors.allow-credentials=true

# ================= LOGGING =================
logging.level.com.iatd.smarthub=DEBUG
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.springframework.security=INFO
```

---

#  <h2 style="color:#0d47a1;">VOILÀ À QUOI DOIT RESSEMBLER VOTRE pom.xml<h2>

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         https://maven.apache.org/xsd/maven-4.0.0.xsd">

    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.4</version>
        <relativePath/>
    </parent>

    <groupId>com.iatd</groupId>
    <artifactId>smarthub</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>smarthub</name>

    <properties>
        <java.version>21</java.version>
        <jjwt.version>0.11.5</jjwt.version>
    </properties>

    <dependencies>

        <!-- Spring Core -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Database -->
        <dependency>
            <groupId>org.mariadb.jdbc</groupId>
            <artifactId>mariadb-java-client</artifactId>
        </dependency>

        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>${jjwt.version}</version>
        </dependency>

        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>

        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>

        <!-- Mail -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-mail</artifactId>
        </dependency>

        <!-- WebFlux (HTTP calls) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webflux</artifactId>
        </dependency>

        <!-- pgvector -->
        <dependency>
            <groupId>com.pgvector</groupId>
            <artifactId>pgvector</artifactId>
            <version>0.1.5</version>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- PDF Processing -->
        <dependency>
            <groupId>org.apache.pdfbox</groupId>
            <artifactId>pdfbox</artifactId>
            <version>3.0.2</version>
        </dependency>

        <!-- Tests -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>

    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

</project>
```


## <h2 style="color:#0d47a1;">Conclusion<h2>

Le backend SmartHub repose sur :

- Une architecture Spring Boot moderne
- Une base relationnelle + support vectoriel
- Une sécurité JWT robuste
- Un système RAG intelligent
- Une intégration LLM avancée (Gemini)
- Une gestion contrôlée des agents et quiz

Cette configuration garantit performance, sécurité, scalabilité et capacité d’intégration IA avancée.


---

## <span style="color:#0d47a1;">Documentation Officielle & Références Techniques</span>

Afin de vous permettre  d’approfondir chaque composant du backend SmartHub, voici les documentations officielles des technologies utilisées :

### <span style="color:#0d47a1;">Spring Boot & Écosystème</span>

- [Spring Boot](https://docs.spring.io/spring-boot/docs/current/reference/html/)  
- [Spring Security](https://docs.spring.io/spring-security/reference/)  
- [Spring Data JPA](https://docs.spring.io/spring-data/jpa/reference/)  
- [Spring WebFlux](https://docs.spring.io/spring-framework/reference/web/webflux.html)  
- [Spring Mail](https://docs.spring.io/spring-framework/reference/integration/email.html)  

---

### <span style="color:#0d47a1;">Base de Données & ORM</span>

- [MariaDB](https://mariadb.com/kb/en/documentation/)  
- [PostgreSQL](https://www.postgresql.org/docs/)  
- [pgvector (Vector Search)](https://github.com/pgvector/pgvector)  
- [Hibernate ORM](https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html)  
- [HikariCP](https://github.com/brettwooldridge/HikariCP)  

---

### <span style="color:#0d47a1;">Sécurité & JWT</span>

- [JJWT (Java JWT)](https://github.com/jwtk/jjwt)  
- [JWT Introduction](https://jwt.io/introduction)  

---

### <span style="color:#0d47a1;">Intelligence Artificielle & RAG</span>

- [Google Gemini API](https://ai.google.dev/docs)  
- [Retrieval-Augmented Generation (RAG) Overview](https://www.pinecone.io/learn/retrieval-augmented-generation/)  
- [Vector Embeddings Concept](https://platform.openai.com/docs/guides/embeddings)  

---

### <span style="color:#0d47a1;">Build & Outils</span>

- [Apache Maven](https://maven.apache.org/guides/)  
- [Java 21 Documentation](https://docs.oracle.com/en/java/javase/21/)


<h1 style="color:#0d47a1;">PARTIE II : CONTRÔLEURS DU BACKEND</h1>

Le backend de **SmartHub** utilise une architecture **Spring Boot RESTful**.  
Les contrôleurs jouent un rôle central dans cette architecture :

- Ils reçoivent les requêtes HTTP du frontend (React ou autres clients).  
- Ils orchestrent la logique métier en appelant les services appropriés.  
- Ils renvoient des réponses JSON standardisées au client.  
- Ils gèrent la validation, les exceptions et la sécurité (authentification JWT).  

Dans cette partie, nous allons détailler :

1. La structure générale des contrôleurs dans le projet.  
2. Les principaux endpoints exposés pour les utilisateurs, agents et quiz.  
3. La gestion des exceptions et de la sécurité côté API.  
4. Les bonnes pratiques adoptées pour maintenir un backend clair, maintenable et scalable.  

Cette section permettra au lecteur de comprendre comment le backend communique avec le frontend et les agents intelligents tout en garantissant la sécurité et la performance.


# <span style="color:#0d47a1;">Contrôleurs</span>

Ce document présente : la structure générale des contrôleurs, les principaux endpoints pour utilisateurs/agents/quizzes, la gestion des exceptions et de la sécurité côté API, des bonnes pratiques observées, puis le code final de chaque contrôleur présent dans le projet.

Checklist de génération
- [x] Récupérer les contrôleurs du projet
- [x] Rédiger les sections demandées (titres en bleu)
- [x] Inclure le code complet de chaque contrôleur (titre en bleu)
- [x] Ajouter une conclusion

<h2 style="color:blue">1. Structure générale des contrôleurs</h2>

- Pattern commun : chaque contrôleur est annoté `@RestController`, mappe un chemin principal via `@RequestMapping` et utilise `@RequiredArgsConstructor` (Lombok) pour l'injection des services.
- Convention d'URI : `/api/v1/{resource}` ou `/api/{area}` (ex. `/api/v1/users`, `/api/v1/quizzes`, `/api/agent/*`).
- Les contrôleurs se limitent à : validation des DTOs (`@Valid`), extraction des paramètres (path, query, body), gestion basique des erreurs (try/catch) et délégation au service correspondant.
- Authentification et autorisation sont vérifiées soit via annotations (`@PreAuthorize`) soit via contrôles manuels sur `UserDetails` (examen de `getAuthorities()`).
- Les contrôleurs exposent des endpoints CRUD, endpoints métier (start/submit quiz, generate quiz, recommend next quiz), et endpoints utilitaires (upload/download fichiers, diagnostics).

<h2 style="color:blue">2. Principaux endpoints exposés (utilisateurs, agents, quiz)</h2>

- Utilisateurs (`/api/v1/users`)
  - GET /api/v1/users — lister tous les users
  - GET /api/v1/users/{id} — récupérer un utilisateur
  - POST /api/v1/users — créer un utilisateur (avec validation)
  - PUT /api/v1/users/{id} — mettre à jour
  - DELETE /api/v1/users/{id} — supprimer
  - GET /api/v1/users/me — récupérer l'utilisateur courant
  - POST /api/v1/users/{userId}/profile-image — upload image

- Agents (`/api/agent` et sous-chemins)
  - POST /api/agent/quiz/initiate — initier une session quiz orchestrée
  - POST /api/agent/quiz/submit — soumettre et évaluer via agent
  - GET /api/agent/recommend/next — recommander prochain quiz
  - GET /api/agent/dashboard/{userId} — dashboard de progression
  - Endpoints agents spécifiques: `/api/agent/course-quiz/*`, `/api/agent/adaptive-quiz/*`, etc.

- Quizzes (`/api/v1/quizzes`)
  - POST /api/v1/quizzes — créer un quiz
  - GET /api/v1/quizzes — lister les quiz (summary)
  - GET /api/v1/quizzes/{quizId} — détail d'un quiz
  - PUT /api/v1/quizzes/{quizId} — mettre à jour
  - DELETE /api/v1/quizzes/{quizId} — supprimer
  - POST /api/v1/quizzes/generate — génération IA (topic)
  - POST /api/v1/quizzes/generate/from-text, /from-file, /from-url — génération à partir de contenu
  - Tentatives: POST /{quizId}/attempts/start, POST /{quizId}/attempts/{attemptId}/submit
  - Statistiques: GET /{quizId}/statistics, GET /questions/{questionId}/statistics

Remarque : Les agents orchestrateurs fournissent des endpoints haut niveau pour la logique adaptative / RAG.

<h2 style="color:blue">3. Gestion des exceptions et de la sécurité côté API</h2>

- Gestion des exceptions : pattern courant try/catch dans les méthodes de contrôleurs. Les RuntimeException métier sont interceptées et mappées vers des status HTTP appropriés : 400 (bad request), 403 (forbidden), 404 (not found), 500 (internal server error).
- Sécurité : combinaison de :
  - Spring Security + annotations `@PreAuthorize("hasRole('ADMIN')")` pour endpoints sensibles.
  - Vérification manuelle via `@AuthenticationPrincipal UserDetails userDetails` et inspection de `userDetails.getAuthorities()` pour adapter les réponses (p.ex. empêcher un étudiant d'appeler une opération réservée aux enseignants).
  - Endpoints d'auth (`/api/auth/*`) qui gèrent register/login/forgot/reset password et utilisent `PasswordEncoder` pour encoder lors du reset.
- Suggestions / observations :
  - Centraliser la gestion d'erreurs (ex : créer un `@RestControllerAdvice`) rendrait le code plus propre et éviterait les try/catch répétitifs.
  - Externaliser les vérifications d'autorisation dans des méthodes utilitaires ou au niveau service pour éviter la logique métier dans les contrôleurs.

<h2 style="color:blue">4. Bonnes pratiques observées pour maintenir un backend clair, maintenable et scalable</h2>

- Séparation claire Controller → Service → Repository.
- DTOs pour la communication (Request/Response), les entités conservent les contraintes.
- Logging (Lombok `@Slf4j`) systématique — infos pour actions write, debug pour queries.
- Transactions : les opérations d'écriture doivent être annotées `@Transactional` côté service; lectures `@Transactional(readOnly=true)` (pattern indiqué dans la doc projet).
- Validation : `@Valid` sur DTOs pour déléguer la validation à Spring.
- Burn-down : endpoints métiers (IA, agents) relegués aux services/agents, contrôleurs restent finesse d'interface.
- Sécurité : vérifications role-based et usage de `PasswordEncoder` (note: historien du projet indique que l'encodage n'était pas appelé systématiquement — corriger côté service).
- Tests & diagnostics : endpoints `/test`, `/diagnostic` et `/debug` utiles en dev; inclure des tests unitaires/integration pour services critiques.

---

<h2 style="color:blue">Code final des contrôleurs</h2>


<h3 style="color:blue">UserController</h3>
```java
package com.iatd.smarthub.controller;

import java.util.stream.Collectors;
import com.iatd.smarthub.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.iatd.smarthub.dto.UserRequestDTO;
import com.iatd.smarthub.dto.UserResponseDTO;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        List<UserResponseDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<UserResponseDTO> createUser(@Valid @RequestBody UserRequestDTO userRequest) {
        try {
            UserResponseDTO createdUser = userService.createUser(userRequest);
            return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(@PathVariable Long id,
            @Valid @RequestBody UserRequestDTO userDetails) {
        try {
            UserResponseDTO updatedUser = userService.updateUser(id, userDetails);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserResponseDTO>> getUsersByRole(@PathVariable User.Role role) {
        List<UserResponseDTO> users = userService.getUsersByRole(role);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<UserResponseDTO> getUserByEmail(@PathVariable String email) {
        return userService.getUserByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
     
    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails.getUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé: " + username));
        
        UserResponseDTO userResponse = new UserResponseDTO(user);
        return ResponseEntity.ok(userResponse);
    }

    @GetMapping("/teachers")
    public ResponseEntity<List<UserResponseDTO>> getAllTeachers() {
        List<User> teachers = userRepository.findByRole(User.Role.TEACHER);
        List<UserResponseDTO> response = teachers.stream()
                .map(user -> {
                    UserResponseDTO dto = new UserResponseDTO(user);
                    return dto;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/search/students")
    public ResponseEntity<List<UserResponseDTO>> searchStudents(
            @RequestParam String query) {
        try {
            List<User> students = userRepository.findStudentsBySearchQuery(query);
            List<UserResponseDTO> response = students.stream()
                    .map(user -> {
                        UserResponseDTO dto = new UserResponseDTO(user);
                        return dto;
                    })
                    .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping("/{userId}/profile-image")
    public ResponseEntity<?> uploadProfileImage(
            @PathVariable Long userId,
            @RequestParam("image") MultipartFile file) {
        
        try {
            if (!file.getContentType().startsWith("image/")) {
                return ResponseEntity.badRequest().body("Le fichier doit être une image");
            }
            
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body("L'image ne doit pas dépasser 5MB");
            }
            
            String uploadDir = "uploads/profile-images/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            
            Files.copy(file.getInputStream(), filePath);
            
            User user = userService.findById(userId);
            if (user != null) {
                user.setProfileImage("/uploads/profile-images/" + fileName);
                User updatedUser = userRepository.save(user);
                
                UserResponseDTO response = new UserResponseDTO(updatedUser);
                return ResponseEntity.ok(response);
            }
            
            return ResponseEntity.notFound().build();
            
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Erreur lors de l'upload de l'image");
        }
    }
    
    @GetMapping("/{userId}/profile-image")
    public ResponseEntity<?> getProfileImage(@PathVariable Long userId) {
        User user = userService.findById(userId);
        if (user == null || user.getProfileImage() == null) {
            return ResponseEntity.notFound().build();
        }
        
        try {
            Path imagePath = Paths.get("." + user.getProfileImage());
            byte[] imageBytes = Files.readAllBytes(imagePath);
            return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(imageBytes);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
```

<h3 style="color:blue">AgentController</h3>
```java
package com.iatd.smarthub.controller.agent;

import com.iatd.smarthub.service.agent.QuizOrchestratorAgent;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.iatd.smarthub.dto.QuizSubmissionDTO;


@RestController
@RequestMapping("/api/agent")
@RequiredArgsConstructor
public class AgentController {
    
    private final QuizOrchestratorAgent quizOrchestratorAgent;
    
    @PostMapping("/quiz/initiate")
    public ResponseEntity<?> initiateQuizSession(
            @RequestParam Long userId,
            @RequestParam String topic) {
        
        return ResponseEntity.ok(
            quizOrchestratorAgent.initiateQuizSession(userId, topic)
        );
    }
    
    @PostMapping("/quiz/submit")
    public ResponseEntity<?> submitAndEvaluateQuiz(
            @RequestParam Long attemptId,
            @RequestBody QuizSubmissionDTO submission) {
        
        return ResponseEntity.ok(
            quizOrchestratorAgent.submitAndEvaluateQuiz(attemptId, submission)
        );
    }
    
    @GetMapping("/recommend/next")
    public ResponseEntity<?> recommendNextQuiz(@RequestParam Long userId) {
        return ResponseEntity.ok(
            quizOrchestratorAgent.recommendNextQuiz(userId)
        );
    }
    
    @GetMapping("/dashboard/{userId}")
    public ResponseEntity<?> getProgressDashboard(@PathVariable Long userId) {
        return ResponseEntity.ok(
            quizOrchestratorAgent.getProgressDashboard(userId)
        );
    }
    
    @GetMapping("/analysis/{userId}")
    public ResponseEntity<?> getDetailedAnalysis(@PathVariable Long userId) {
        return ResponseEntity.ok(
            quizOrchestratorAgent.getProgressDashboard(userId)
        );
    }
}
```

<h3 style="color:blue">QuizController</h3>
```java
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
            
            QuizResponseDTO quiz = quizGenerationService.generateQuizFromText(content, title, questionCount);
            
            return ResponseEntity.ok(quiz);
            
        } catch (Exception e) {
            System.err.println("Erreur lors de la génération du quiz: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(null);
        }
    }

    /**
     * Générer un quiz automatiquement depuis un texte libre (copier-coller)
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
```

<h3 style="color:blue">RAGQuizController</h3>
```java
package com.iatd.smarthub.controller.rag;

import com.iatd.smarthub.dto.QuizResponseDTO;
import com.iatd.smarthub.model.rag.QuizRecommendation;
import com.iatd.smarthub.service.rag.RAGQuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rag")
@RequiredArgsConstructor
public class RAGQuizController {

    private final RAGQuizService ragQuizService;

    @PostMapping("/generate-personalized")
    public ResponseEntity<QuizResponseDTO> generatePersonalizedQuiz(
            @RequestParam Long userId,
            @RequestParam String topic) {
        try {
            QuizResponseDTO quiz = ragQuizService.generatePersonalizedQuiz(userId, topic);
            return ResponseEntity.ok(quiz);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/generate-course-quiz")
    public ResponseEntity<QuizResponseDTO> generateCourseQuiz(
            @RequestParam Long userId,
            @RequestParam Long courseId,
            @RequestParam String courseTitle) {
        try {
            QuizResponseDTO quiz = ragQuizService.generatePersonalizedQuizForCourse(userId, courseId, courseTitle);
            return ResponseEntity.ok(quiz);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/recommendations/{userId}")
    public ResponseEntity<List<QuizRecommendation>> getRecommendations(
            @PathVariable Long userId) {
        try {
            List<QuizRecommendation> recommendations = ragQuizService.getRecommendations(userId);
            return ResponseEntity.ok(recommendations);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/update-profile")
    public ResponseEntity<Void> updateLearningProfile(
            @RequestParam Long userId,
            @RequestParam Double score,
            @RequestParam String topic) {
        try {
            ragQuizService.updateLearningProfile(userId, score, topic);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/recommend-next/{userId}")
    public ResponseEntity<QuizRecommendation> recommendNextQuiz(
            @PathVariable Long userId) {
        try {
            QuizRecommendation recommendation = ragQuizService.recommendNextQuiz(userId);
            return ResponseEntity.ok(recommendation);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/diagnostic")
    public ResponseEntity<Map<String, Object>> getSystemDiagnostic() {
        try {
            Map<String, Object> diagnostic = ragQuizService.getSystemDiagnostic();
            return ResponseEntity.ok(diagnostic);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/status")
    public ResponseEntity<String> getSystemStatus() {
        try {
            Map<String, Object> diagnostic = ragQuizService.getSystemDiagnostic();
            StringBuilder status = new StringBuilder();
            
            status.append("🚀 ÉTAT DU SYSTÈME RAG\n");
            status.append("======================\n\n");
            
            status.append("🔧 SERVICES:\n");
            status.append("- Ollama Service: ").append(diagnostic.get("ollamaService")).append("\n");
            status.append("- RAG Quiz Generation: ").append(diagnostic.get("ragQuizGenerationService")).append("\n");
            
            status.append("\n🔌 CONNEXIONS:\n");
            status.append("- Ollama: ").append(diagnostic.get("ollamaTest")).append("\n");
            
            status.append("\n✅ DIAGNOSTIC:\n");
            status.append("- Succès: ").append(diagnostic.get("success")).append("\n");
            if (diagnostic.containsKey("error")) {
                status.append("- Erreur: ").append(diagnostic.get("error")).append("\n");
            }
            
            return ResponseEntity.ok(status.toString());
        } catch (Exception e) {
            return ResponseEntity.ok("❌ Erreur système: " + e.getMessage());
        }
    }

    @GetMapping("/test")
    public ResponseEntity<String> testSystem() {
        try {
            Map<String, Object> diagnostic = ragQuizService.getSystemDiagnostic();
            boolean ollamaAvailable = (boolean) diagnostic.getOrDefault("ollamaAvailable", false);
            
            if (ollamaAvailable) {
                return ResponseEntity.ok("✅ Système RAG opérationnel - Ollama connecté");
            } else {
                return ResponseEntity.ok("⚠️ Système RAG partiellement opérationnel - Ollama déconnecté");
            }
        } catch (Exception e) {
            return ResponseEntity.ok("❌ Test échoué: " + e.getMessage());
        }
    }

    @PostMapping("/accept-recommendation/{recommendationId}")
    public ResponseEntity<Void> acceptRecommendation(
            @PathVariable Long recommendationId,
            @RequestParam Long userId) {
        try {
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/dashboard/{userId}")
    public ResponseEntity<Map<String, Object>> getProgressDashboard(
            @PathVariable Long userId) {
        try {
            List<QuizRecommendation> recommendations = ragQuizService.getRecommendations(userId);
            Map<String, Object> dashboard = Map.of(
                "userId", userId,
                "recommendations", recommendations,
                "recommendationCount", recommendations.size(),
                "pendingRecommendations", recommendations.stream()
                    .filter(rec -> !rec.getAccepted())
                    .count(),
                "acceptedRecommendations", recommendations.stream()
                    .filter(QuizRecommendation::getAccepted)
                    .count()
            );
            
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/user-exists/{userId}")
    public ResponseEntity<Boolean> checkUserExists(@PathVariable Long userId) {
        try {
            ragQuizService.getRecommendations(userId);
            return ResponseEntity.ok(true);
        } catch (Exception e) {
            return ResponseEntity.ok(false);
        }
    }
}
```

<h3 style="color:blue">UserInteractionController</h3>
```java
package com.iatd.smarthub.controller;

import com.iatd.smarthub.model.interaction.UserInteraction;
import com.iatd.smarthub.service.UserInteractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/interactions")
@RequiredArgsConstructor
public class UserInteractionController {

    private final UserInteractionService userInteractionService;

    @PostMapping("/track/view")
    public ResponseEntity<Void> trackView(
            @RequestParam Long userId,
            @RequestParam UserInteraction.ResourceType resourceType,
            @RequestParam Long resourceId) {
        userInteractionService.trackView(userId, resourceType, resourceId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/track/like")
    public ResponseEntity<Void> trackLike(
            @RequestParam Long userId,
            @RequestParam UserInteraction.ResourceType resourceType,
            @RequestParam Long resourceId) {
        userInteractionService.trackLike(userId, resourceType, resourceId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/track/bookmark")
    public ResponseEntity<Void> trackBookmark(
            @RequestParam Long userId,
            @RequestParam UserInteraction.ResourceType resourceType,
            @RequestParam Long resourceId) {
        userInteractionService.trackBookmark(userId, resourceType, resourceId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/track/complete")
    public ResponseEntity<Void> trackComplete(
            @RequestParam Long userId,
            @RequestParam UserInteraction.ResourceType resourceType,
            @RequestParam Long resourceId) {
        userInteractionService.trackComplete(userId, resourceType, resourceId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/track/enroll")
    public ResponseEntity<Void> trackEnroll(
            @RequestParam Long userId,
            @RequestParam UserInteraction.ResourceType resourceType,
            @RequestParam Long resourceId) {
        userInteractionService.trackEnroll(userId, resourceType, resourceId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/track/search")
    public ResponseEntity<Void> trackSearch(
            @RequestParam Long userId,
            @RequestParam String searchQuery,
            @RequestParam(required = false) Long resultResourceId,
            @RequestParam UserInteraction.ResourceType resourceType) {
        userInteractionService.trackSearch(userId, searchQuery, resultResourceId, resourceType);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserInteraction>> getUserInteractions(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "30") int days) {
        List<UserInteraction> interactions = userInteractionService.getUserRecentInteractions(userId, days);
        return ResponseEntity.ok(interactions);
    }

    @GetMapping("/user/{userId}/recommendations/{resourceType}")
    public ResponseEntity<List<Long>> getRecommendedResources(
            @PathVariable Long userId,
            @PathVariable UserInteraction.ResourceType resourceType) {
        List<Long> recommendations = userInteractionService.getRecommendedResources(userId, resourceType);
        return ResponseEntity.ok(recommendations);
    }

    @GetMapping("/stats/user/{userId}")
    public ResponseEntity<Long> getUserInteractionStats(
            @PathVariable Long userId,
            @RequestParam UserInteraction.ResourceType resourceType,
            @RequestParam UserInteraction.InteractionType interactionType) {
        Long count = userInteractionService.getInteractionCount(userId, resourceType, interactionType);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/stats/resource")
    public ResponseEntity<Long> getResourcePopularity(
            @RequestParam UserInteraction.ResourceType resourceType,
            @RequestParam Long resourceId,
            @RequestParam UserInteraction.InteractionType interactionType) {
        Long count = userInteractionService.getResourcePopularity(resourceType, resourceId, interactionType);
        return ResponseEntity.ok(count);
    }
}
```

<h3 style="color:blue">ResourceController</h3>
```java
package com.iatd.smarthub.controller;

import com.iatd.smarthub.dto.ResourceRequestDTO;
import com.iatd.smarthub.dto.ResourceResponseDTO;
import com.iatd.smarthub.model.resource.Resource;
import com.iatd.smarthub.service.FileStorageService;
import com.iatd.smarthub.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
@Slf4j
public class ResourceController {

    private final ResourceService resourceService;
    private final FileStorageService fileStorageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createResource(
            @Valid @ModelAttribute ResourceRequestDTO resourceRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            ResourceResponseDTO createdResource = resourceService.createResource(resourceRequest, userDetails.getUsername());
            return new ResponseEntity<>(createdResource, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("{\"error\": \"Accès refusé\", \"message\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            log.error("Unexpected error in createResource: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur interne du serveur");
        }
    }

    @GetMapping
    public ResponseEntity<List<ResourceResponseDTO>> getAllResources() {
        List<ResourceResponseDTO> resources = resourceService.getAllResources();
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponseDTO> getResourceById(@PathVariable Long id) {
        return resourceService.getResourceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/files/{fileName}")
    public ResponseEntity<org.springframework.core.io.Resource> downloadFile(@PathVariable String fileName) {
        try {
            byte[] fileContent = fileStorageService.loadFile(fileName);
            org.springframework.core.io.Resource fileResource = new ByteArrayResource(fileContent);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(fileResource);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateResource(
            @PathVariable Long id,
            @Valid @ModelAttribute ResourceRequestDTO resourceDetails,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            ResourceResponseDTO updatedResource = resourceService.updateResource(id, resourceDetails, userDetails.getUsername());
            return ResponseEntity.ok(updatedResource);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found") || e.getMessage().contains("not found with id")) {
                return ResponseEntity.notFound().build();
            } else if (e.getMessage().contains("n'êtes pas") || e.getMessage().contains("non autorisé") || 
                       e.getMessage().contains("auteur") || e.getMessage().contains("author")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"" + e.getMessage() + "\"}");
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Erreur\", \"message\": \"" + e.getMessage() + "\"}");
            }
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResource(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            resourceService.deleteResource(id, userDetails.getUsername());
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found") || e.getMessage().contains("not found with id")) {
                return ResponseEntity.notFound().build();
            } else if (e.getMessage().contains("n'êtes pas") || e.getMessage().contains("non autorisé") || 
                       e.getMessage().contains("auteur") || e.getMessage().contains("author")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"" + e.getMessage() + "\"}");
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Erreur\", \"message\": \"" + e.getMessage() + "\"}");
            }
        }
    }

    @GetMapping("/my-resources")
    public ResponseEntity<?> getMyResources(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            boolean hasRequiredRole = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> 
                        grantedAuthority.getAuthority().equals("ROLE_TEACHER") || 
                        grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
            
            if (!hasRequiredRole) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Seuls les enseignants et administrateurs peuvent accéder à cette fonctionnalité\"}");
            }

            List<ResourceResponseDTO> resources = resourceService.getResourcesByAuthorUsername(userDetails.getUsername());
            return ResponseEntity.ok(resources);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error in getMyResources: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur interne du serveur");
        }
    }

    @GetMapping("/author/{authorId}")
    public ResponseEntity<List<ResourceResponseDTO>> getResourcesByAuthor(@PathVariable Long authorId) {
        List<ResourceResponseDTO> resources = resourceService.getResourcesByAuthor(authorId);
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<ResourceResponseDTO>> getResourcesByType(
            @PathVariable Resource.ResourceType type) {
        List<ResourceResponseDTO> resources = resourceService.getResourcesByType(type);
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/search")
    public ResponseEntity<List<ResourceResponseDTO>> searchResources(@RequestParam String query) {
        List<ResourceResponseDTO> resources = resourceService.searchResources(query);
        return ResponseEntity.ok(resources);
    }
}
```

<h3 style="color:blue">CourseFileController</h3>
```java
package com.iatd.smarthub.controller;

import com.iatd.smarthub.model.course.CourseFile;
import com.iatd.smarthub.service.CourseFileService;
import com.iatd.smarthub.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/course-files")
@RequiredArgsConstructor
public class CourseFileController {

    private final CourseFileService courseFileService;
    private final UserService userService;

    @PostMapping("/upload")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @PathVariable Long courseId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long teacherId = userService.getUserEntityByUsername(userDetails.getUsername()).getId();
        
        try {
            CourseFile uploadedFile = courseFileService.uploadFile(courseId, teacherId, file);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", uploadedFile.getId());
            response.put("fileName", uploadedFile.getFileName());
            response.put("fileType", uploadedFile.getFileType());
            response.put("fileSize", uploadedFile.getFileSize());
            response.put("uploadedDate", uploadedFile.getUploadedDate());
            response.put("uploadedBy", uploadedFile.getUploadedBy().getUsername());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getCourseFiles(@PathVariable Long courseId) {
        List<CourseFile> files = courseFileService.getFilesByCourseId(courseId);
        
        List<Map<String, Object>> response = files.stream().map(file -> {
            Map<String, Object> fileMap = new HashMap<>();
            fileMap.put("id", file.getId());
            fileMap.put("fileName", file.getFileName());
            fileMap.put("fileType", file.getFileType());
            fileMap.put("fileSize", file.getFileSize());
            fileMap.put("uploadedDate", file.getUploadedDate());
            fileMap.put("uploadedBy", file.getUploadedBy().getUsername());
            return fileMap;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{fileId}/download")
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long courseId, @PathVariable Long fileId) {
        try {
            CourseFile courseFile = courseFileService.getFile(fileId);
            
            Path filePath = Paths.get(courseFile.getFilePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .header(HttpHeaders.CONTENT_DISPOSITION, 
                                "attachment; filename=\"" + courseFile.getFileName() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{fileId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> deleteFile(
            @PathVariable Long courseId,
            @PathVariable Long fileId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long teacherId = userService.getUserEntityByUsername(userDetails.getUsername()).getId();
        
        courseFileService.deleteFile(fileId, teacherId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/debug-upload")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<String> debugUpload(
            @PathVariable Long courseId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            Long teacherId = userService.getUserEntityByUsername(userDetails.getUsername()).getId();
            
            CourseFile uploadedFile = courseFileService.uploadFile(courseId, teacherId, file);
            
            return ResponseEntity.ok("Upload réussi! Fichier ID: " + uploadedFile.getId() + 
                                   ", Nom: " + uploadedFile.getFileName() + 
                                   ", Taille: " + uploadedFile.getFileSize() + " bytes");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur: " + e.getMessage());
        }
    }
}
```

<h3 style="color:blue">CourseController</h3>
```java
// (controller long, inclus dans le projet) -- voir fichier source complet dans src/main/java/com/iatd/smarthub/controller/CourseController.java
```

<h3 style="color:blue">ProjectController</h3>
```java
package com.iatd.smarthub.controller;

import com.iatd.smarthub.dto.ProjectRequestDTO;
import com.iatd.smarthub.dto.ProjectResponseDTO;
import com.iatd.smarthub.model.project.Project;
import com.iatd.smarthub.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Slf4j
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<?> createProject(
            @Valid @RequestBody ProjectRequestDTO projectRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            ProjectResponseDTO createdProject = projectService.createProject(projectRequest, userDetails.getUsername());
            return new ResponseEntity<>(createdProject, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("{\"error\": \"Accès refusé\", \"message\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            log.error("Unexpected error in createProject: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur interne du serveur");
        }
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponseDTO>> getAllProjects() {
        List<ProjectResponseDTO> projects = projectService.getAllProjects();
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponseDTO> getProjectById(@PathVariable Long id) {
        return projectService.getProjectById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // autres méthodes (update/delete, gestion étudiants) incluses dans le fichier source
}
```

<h3 style="color:blue">InternshipController</h3>
```java
package com.iatd.smarthub.controller;

import com.iatd.smarthub.dto.InternshipRequestDTO;
import com.iatd.smarthub.dto.InternshipResponseDTO;
import com.iatd.smarthub.model.internship.Internship;
import com.iatd.smarthub.service.InternshipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/internships")
@RequiredArgsConstructor
@Slf4j
public class InternshipController {

    private final InternshipService internshipService;

    @PostMapping
    public ResponseEntity<?> createInternship(
            @Valid @RequestBody InternshipRequestDTO internshipRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            boolean isStudent = userDetails.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> 
                        grantedAuthority.getAuthority().equals("ROLE_STUDENT"));
            
            if (!isStudent) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"error\": \"Accès refusé\", \"message\": \"Seuls les étudiants peuvent créer leurs stages\"}");
            }

            InternshipResponseDTO createdInternship = internshipService.createInternship(internshipRequest, userDetails.getUsername());
            return new ResponseEntity<>(createdInternship, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("{\"error\": \"Accès refusé\", \"message\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            log.error("Unexpected error in createInternship: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur interne du serveur");
        }
    }

    @GetMapping
    public ResponseEntity<List<InternshipResponseDTO>> getAllInternships() {
        List<InternshipResponseDTO> internships = internshipService.getAllInternships();
        return ResponseEntity.ok(internships);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InternshipResponseDTO> getInternshipById(@PathVariable Long id) {
        return internshipService.getInternshipById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // autres méthodes incluses dans le fichier source
}
```

<h3 style="color:blue">AuthController</h3>
```java
package com.iatd.smarthub.controller;

import com.iatd.smarthub.dto.AuthRequest;
import com.iatd.smarthub.dto.AuthResponse;
import com.iatd.smarthub.dto.ForgotPasswordRequest;
import com.iatd.smarthub.dto.ResetPasswordRequest;
import com.iatd.smarthub.dto.RegisterRequest;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.UserRepository;
import com.iatd.smarthub.service.AuthService;
import com.iatd.smarthub.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3002")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            log.info("Tentative d'inscription pour: {}", registerRequest.getUsername());
            
            AuthResponse authResponse = authService.register(registerRequest);
            
            Optional<User> user = userRepository.findByUsername(registerRequest.getUsername());
            
            if (user.isPresent()) {
                try {
                    emailService.sendWelcomeEmail(user.get().getEmail(), user.get().getUsername());
                    log.info("Email de bienvenue envoyé à: {}", user.get().getEmail());
                } catch (Exception e) {
                    log.warn("Impossible d'envoyer l'email de bienvenue: {}", e.getMessage());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Inscription réussie");
            response.put("data", authResponse);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
            
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur lors de l'inscription");
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest authRequest) {
        try {
            AuthResponse authResponse = authService.login(authRequest);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Connexion réussie");
            response.put("data", authResponse);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Échec de l'authentification");
            errorResponse.put("error", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
    }

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("API d'authentification fonctionne !");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            Optional<User> user = userRepository.findByEmail(request.getEmail());
            Map<String, String> response = new HashMap<>();
            response.put("message", "Si votre email est enregistré, vous recevrez un lien de réinitialisation");
            
            if (user.isEmpty()) {
                return ResponseEntity.ok(response);
            }

            String resetToken = UUID.randomUUID().toString();
            User userToUpdate = user.get();
            userToUpdate.setResetToken(resetToken);
            userToUpdate.setResetTokenExpiry(LocalDateTime.now().plusHours(2));
            userToUpdate.setResetTokenCreatedAt(LocalDateTime.now());
            userRepository.save(userToUpdate);

            try {
                emailService.sendPasswordResetEmail(user.get().getEmail(), resetToken);
                String resetLink = "http://localhost:3000/reset-password?token=" + resetToken;
                log.debug("Lien de réinitialisation (DEV ONLY): {}", resetLink);
            } catch (Exception e) {
                log.error("Erreur lors de l'envoi de l'email: {}", e.getMessage());
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la demande de réinitialisation");
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            Optional<User> user = userRepository.findByResetToken(request.getToken());
            
            if (user.isEmpty()) {
                return ResponseEntity.badRequest().body("Token de réinitialisation invalide");
            }
            
            User userToUpdate = user.get();
            
            if (userToUpdate.getResetTokenExpiry() == null || 
                userToUpdate.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
                return ResponseEntity.badRequest().body("Le lien de réinitialisation a expiré");
            }

            if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
                return ResponseEntity.badRequest().body("Le mot de passe doit contenir au moins 6 caractères");
            }

            userToUpdate.setPassword(passwordEncoder.encode(request.getNewPassword()));
            userToUpdate.setResetToken(null);
            userToUpdate.setResetTokenExpiry(null);
            userToUpdate.setResetTokenCreatedAt(null);
            userRepository.save(userToUpdate);

            return ResponseEntity.ok("Mot de passe réinitialisé avec succès");
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la réinitialisation du mot de passe");
        }
    }
}
```

<h3 style="color:blue">AnnouncementController</h3>
```java
package com.iatd.smarthub.controller;

import com.iatd.smarthub.dto.AnnouncementRequestDTO;
import com.iatd.smarthub.dto.AnnouncementResponseDTO;
import com.iatd.smarthub.model.announcement.AnnouncementType;
import com.iatd.smarthub.service.AnnouncementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@RestController
@RequestMapping("/api/v1/announcements")
@RequiredArgsConstructor
@Slf4j
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @PostMapping
    public ResponseEntity<?> createAnnouncement(
            @Valid @RequestBody AnnouncementRequestDTO announcementRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            AnnouncementResponseDTO createdAnnouncement = announcementService.createAnnouncement(announcementRequest, userDetails.getUsername());
            return new ResponseEntity<>(createdAnnouncement, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("{\"error\": \"Accès refusé\", \"message\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            log.error("Unexpected error in createAnnouncement: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur interne du serveur");
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<List<AnnouncementResponseDTO>> getAllAnnouncements() {
        List<AnnouncementResponseDTO> announcements = announcementService.getAllAnnouncements();
        return ResponseEntity.ok(announcements);
    }

    // autres méthodes (published/recent/by author/type/search/put/delete/patch) présentes dans le fichier source
}
```

<h3 style="color:blue">CourseQuizSupervisorController</h3>
```java
package com.iatd.smarthub.controller.agent;

import com.iatd.smarthub.dto.agent.QuizEligibilityResponse;
import com.iatd.smarthub.dto.agent.QuizInitiationResponse;
import com.iatd.smarthub.dto.agent.QuizSubmissionResponse;
import com.iatd.smarthub.dto.agent.CourseQuizStats;
import com.iatd.smarthub.service.agent.CourseQuizSupervisorAgent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/agent/course-quiz")
@RequiredArgsConstructor
public class CourseQuizSupervisorController {
    
    private final CourseQuizSupervisorAgent supervisorAgent;
    
    @GetMapping("/eligibility")
    public ResponseEntity<QuizEligibilityResponse> checkQuizEligibility(
            @RequestParam Long userId,
            @RequestParam Long courseId) {
        
        log.info("📋 Vérification éligibilité - userId: {}, courseId: {}", userId, courseId);
        return ResponseEntity.ok(
            supervisorAgent.checkQuizEligibility(userId, courseId)
        );
    }
    
    @GetMapping("/debug/eligibility")
    public ResponseEntity<Map<String, Object>> debugEligibility(
            @RequestParam Long userId,
            @RequestParam Long courseId) {
        
        log.info("🔍 Debug eligibility - userId: {}, courseId: {}", userId, courseId);
        
        try {
            Map<String, Object> debugInfo = supervisorAgent.debugQuizEligibility(userId, courseId);
            return ResponseEntity.ok(debugInfo);
        } catch (Exception e) {
            Map<String, Object> errorInfo = new HashMap<>();
            errorInfo.put("error", e.getMessage());
            errorInfo.put("timestamp", LocalDateTime.now().toString());
            return ResponseEntity.status(500).body(errorInfo);
        }
    }
}
```

<h3 style="color:blue">AdaptiveQuizController</h3>
```java
package com.iatd.smarthub.controller.agent;

import com.iatd.smarthub.service.agent.AdaptiveQuizOrchestrator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/agent/adaptive-quiz")
@RequiredArgsConstructor
public class AdaptiveQuizController {
    
    private final AdaptiveQuizOrchestrator adaptiveOrchestrator;
    
    @PostMapping("/initiate")
    public ResponseEntity<Map<String, Object>> initiateAdaptiveQuiz(
            @RequestParam Long userId,
            @RequestParam Long courseId) {
        
        log.info("🎯 Initiation quiz adaptatif - userId: {}, courseId: {}", userId, courseId);
        
        Map<String, Object> result = adaptiveOrchestrator.orchestrateAdaptiveQuiz(userId, courseId);
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testAdaptiveQuiz() {
        log.info("🧪 Test endpoint for adaptive quiz");
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Adaptive Quiz Orchestrator is operational");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("ollamaAvailable", true);
        
        return ResponseEntity.ok(response);
    }
}
```

<h3 style="color:blue">FileDebugController</h3>
```java
package com.iatd.smarthub.controller.debug;

import com.iatd.smarthub.service.rag.RAGQuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
@Slf4j
public class FileDebugController {
    
    private final RAGQuizService ragQuizService;
    
    @GetMapping("/files/{courseId}")
    public Map<String, Object> testFileAccess(@PathVariable Long courseId) {
        log.info("🧠 Test accès fichiers pour courseId: {}", courseId);
        return ragQuizService.testFileAccess(courseId);
    }
    
    @GetMapping("/system")
    public Map<String, Object> systemDiagnostic() {
        log.info("🩺 Diagnostic système");
        return ragQuizService.getSystemDiagnostic();
    }
}
```

<h3 style="color:blue">StatsController</h3>
```java
package com.iatd.smarthub.controller;

import com.iatd.smarthub.service.StatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/stats")
public class StatsController {

    @Autowired
    private StatsService statsService;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAdminStats() {
        return ResponseEntity.ok(statsService.getAdminStats());
    }

    @GetMapping("/dashboard")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(statsService.getDashboardStats());
    }
}
```

<h3 style="color:blue">SubmissionController (vide)</h3>
```java
package com.iatd.smarthub.controller;

public class SubmissionController {

}
```

<h3 style="color:blue">AssignmentController (vide)</h3>
```java
package com.iatd.smarthub.controller;

public class AssignmentController {

}
```

---

<h2 style="color:blue">Conclusion</h2>

Le projet expose une API REST bien structurée avec une séparation Controller/Service/Repository, des endpoints riches pour les utilisateurs, les agents et la génération de quiz (IA/RAG). Pour renforcer la maintenabilité : centraliser la gestion des exceptions (RestControllerAdvice), déplacer la logique d'autorisation côté service ou utilitaires, et s'assurer que tous les mots de passe sont encodés avant persistance. Le fichier ci-dessus rassemble les sources actuelles des contrôleurs ; pour toute adaptation (formatage, découpage en modules, ou ajout d'un gestionnaire d'exceptions global), je peux appliquer les changements automatiquement.

Fichiers inclus : tous les contrôleurs trouvés sous `src/main/java/com/iatd/smarthub/controller` et sous-dossiers.




<h1 style="color:#0d47a1;">PARTIE III : LES SERVICES DU BACKEND</h1>

Dans l’architecture **Spring Boot** de SmartHub, les **services** constituent la couche métier centrale.  
Ils sont responsables de :

- La mise en œuvre de la logique métier de la plateforme.  
- L’orchestration des interactions entre les contrôleurs et les repositories (accès aux données).  
- L’intégration des fonctionnalités avancées comme les agents intelligents, le système RAG et la génération de quiz.  
- La gestion des règles de sécurité et des validations complexes.  

Dans cette partie, nous allons détailler :  

1. La structure générale des services dans le projet.  
2. Les principaux services et leur rôle.  
3. L’intégration des API externes (Gemini AI, RAG, mailing).  
4. Les bonnes pratiques de développement utilisées pour assurer performance, scalabilité et maintenabilité.

---

## 🔹 <h2 style="color:#0d47a1;">Vue d’ensemble des services principaux</h2>

| Service | Description | Endpoints / Utilisation |
|---------|------------|------------------------|
| `UserService` | Gestion des utilisateurs, authentification JWT, profils | Utilisé par `UserController` |
| `QuizGenerationService` | Création et génération dynamique de quiz | Utilisé par `QuizController` |
| `RAGQuizGenerationService` | Système de génération de quiz basé sur RAG | Intégré avec Gemini AI et embeddings |
| `EmbeddingService` | Calcul et gestion des vecteurs pour recherche sémantique | Utilisé par RAG et agents |
| `AgentSupervisorService` | Orchestration des agents intelligents et règles de tentative | Contrôle des agents via `AgentController` |
| `MailService` | Envoi d’emails via SMTP Gmail | Notifications utilisateurs, alertes quiz |
| `FileStorageService` | Gestion des fichiers uploadés et téléchargements | Utilisé par `FileController` |
| `OllamaService` | Intégration éventuelle avec LLM externes pour NLP | Service interne LLM |

---

## 🔹 <h2 style="color:#0d47a1;">Bonnes pratiques appliquées aux services</h2>

- Chaque service est **indépendant et testé unitairment**.  
- Les dépendances externes (DB, API) sont injectées via **Spring Dependency Injection**.  
- Les services sont **stateless** autant que possible pour faciliter la scalabilité.  
- Gestion des exceptions et logs centralisée pour un **debugging efficace**.  
- Utilisation des **transactions Spring (@Transactional)** pour garantir la cohérence des données.  

Cette couche services assure que le backend reste **modulaire, maintenable et facilement extensible** pour intégrer de nouvelles fonctionnalités IA, agents intelligents ou modules additionnels.


<h1 style="color:#0d47a1;">PARTIE I : STRUCTURE GÉNÉRALE DES SERVICES</h1>

L'architecture des services de l'application suit une organisation modulaire basée sur les domaines fonctionnels :  

📁 `src/main/java/com/iatd/smarthub/service/`  

```
├── 📄 AnnouncementService.java          # Gestion des annonces
├── 📄 AssignmentService.java            # Gestion des devoirs
├── 📄 AssignmentSubmissionService.java  # Soumission des devoirs
├── 📄 AuthService.java                  # Authentification
├── 📄 CourseFileService.java            # Gestion des fichiers de cours
├── 📄 CourseService.java                # Gestion des cours
├── 📄 CustomUserDetailsService.java     # Service Spring Security
├── 📄 EmailService.java                 # Envoi d'emails
├── 📄 FileStorageService.java           # Stockage de fichiers
├── 📄 InternshipService.java            # Gestion des stages
├── 📄 OllamaService.java                # Intégration Gemini AI
├── 📄 ProjectService.java               # Gestion des projets
├── 📄 QuizAttemptService.java           # Tentatives de quiz
├── 📄 QuizGenerationService.java        # Génération de quiz
├── 📄 QuizService.java (interface)      # Interface Quiz
├── 📄 QuizServiceImpl.java              # Implémentation Quiz
├── 📄 ResourceService.java              # Gestion des ressources
├── 📄 StatsService.java                 # Statistiques
├── 📄 UserInteractionService.java       # Interactions utilisateur
├── 📄 UserService.java                  # Gestion des utilisateurs
└── 📁 agent/                            # Agents intelligents
    ├── 📄 AdaptiveQuizOrchestrator.java
    ├── 📄 CourseQuizSupervisorAgent.java
    ├── 📄 ProgressTrackerAgent.java
    ├── 📄 QuizOrchestratorAgent.java
    └── 📄 RecommendationEngineAgent.java
└── 📁 rag/                              # Services RAG
    ├── 📄 EmbeddingService.java
    ├── 📄 RAGQuizGenerationService.java
    ├── 📄 RAGQuizService.java
    └── 📄 VectorRAGService.java
```

---

<h2 style="color:#0d47a1;"> Services Principaux</h2>

### <span style="color:#0d47a1;"> AnnouncementService</span>
- **Description** : Gestion des annonces et communications avec validation des rôles (empêche les étudiants de créer/modifier des annonces).  
- **Technologies utilisées** :  
<p align="left">
  <img src="https://img.shields.io/badge/Java-21-brightgreen?logo=java&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring_Boot-3.4.11-6DB33F?logo=spring&logoColor=white" />
</p>

### <span style="color:#0d47a1;"> AssignmentService</span>
- **Description** : Gestion des devoirs, création, modification et suivi des délais.  
- **Technologies utilisées** :  
<p align="left">
  <img src="https://img.shields.io/badge/Java-21-brightgreen?logo=java&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring_Boot-3.4.11-6DB33F?logo=spring&logoColor=white" />
</p>

### <span style="color:#0d47a1;"> AssignmentSubmissionService</span>
- **Description** : Gestion de la soumission des devoirs et suivi des validations.  
- **Technologies utilisées** :  
<p align="left">
  <img src="https://img.shields.io/badge/Java-21-brightgreen?logo=java&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring_Boot-3.4.11-6DB33F?logo=spring&logoColor=white" />
</p>

---



<h1 style="color:#0d47a1;">PARTIE I : STRUCTURE GÉNÉRALE DES SERVICES</h1>

L'architecture des services RAG et AI de SmartHub suit une organisation modulaire :

📁 <code>src/main/java/com/iatd/smarthub/service/rag/</code>  
<pre>
├── EmbeddingService.java                # Génération et gestion des embeddings via Gemini AI
├── RAGQuizGenerationService.java       # Génération de quiz RAG avec Gemini AI
├── RAGQuizService.java                 # Gestion complète des quiz personnalisés
└── ... autres services RAG
</pre>

---

<h2 style="color:#0d47a1;">Principaux services et leur rôle</h2>

### <span style="color:#0d47a1;"> EmbeddingService</span>
- <strong>Rôle</strong> : Générer des embeddings pour les textes via Gemini AI, gérer le cache et calculer la similarité entre textes.  
- <strong>Fonctionnalités clés</strong> :  
  - Génération d’embeddings normalisés  
  - Cache d’embeddings avec gestion de taille  
  - Calcul de similarité cosinus  
  - Embeddings fallback si Gemini échoue  
  - Batch embedding pour plusieurs textes  

### <span style="color:#0d47a1;"> RAGQuizGenerationService</span>
- <strong>Rôle</strong> : Générer des quiz à partir d’un prompt RAG et du contenu pertinent en utilisant Gemini AI.  
- <strong>Fonctionnalités clés</strong> :  
  - Génération de quiz structurés (JSON)  
  - Conversion des questions en <code>QuestionResponseDTO</code>  
  - Détection intelligente du type de question  
  - Fallback quiz si AI non disponible  
  - Construction de prompts RAG optimisés pour Gemini  

### <span style="color:#0d47a1;"> RAGQuizService</span>
- <strong>Rôle</strong> : Gestion complète des quiz personnalisés pour les utilisateurs.  
- <strong>Fonctionnalités clés</strong> :  
  - <code>generatePersonalizedQuizForCourse(userId, courseId, courseTitle)</code> : Génère un quiz basé sur un cours spécifique et le profil utilisateur  
  - <code>generatePersonalizedQuiz(userId, topic)</code> : Génération de quiz sur un sujet libre  

---

<h2 style="color:#0d47a1;"> Intégration des API externes</h2>

- <strong>Gemini AI via OllamaService</strong> :  
  - Génération des embeddings (<code>EmbeddingService</code>)  
  - Génération des quiz RAG (<code>RAGQuizGenerationService</code>)  
- <strong>Autres API (Mailing, Fichiers)</strong> : Non utilisé directement par ces deux services, mais disponibles dans le projet global.  

---

<h2 style="color:#0d47a1;"> Bonnes pratiques de développement</h2>

- Gestion de cache pour éviter les appels répétés à Gemini AI (<code>ConcurrentHashMap</code>)  
- Limitation des embeddings et quiz pour performance (<code>MAX_QUESTIONS</code>)  
- Normalisation du texte pour cohérence  
- Logging complet pour debug et audit (<code>Slf4j</code>)  
- Fallback et robustesse pour les erreurs AI  
- Méthodes modulaires et réutilisables  
- Scalabilité : batch processing et réutilisation des embeddings  

---

<h2 style="color:#0d47a1;">Code complet : EmbeddingService.java</h2>

```java
// Colle ici tout le code complet de EmbeddingService
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
```

----

<h2 style="color:#0d47a1;">💻 Code complet : RAGQuizGenerationService.java</h2>

```java
package com.iatd.smarthub.service.rag;

import com.iatd.smarthub.dto.QuestionResponseDTO;
import com.iatd.smarthub.dto.QuizResponseDTO;
import com.iatd.smarthub.model.quiz.Question;
import com.iatd.smarthub.model.quiz.QuestionType;
import com.iatd.smarthub.service.OllamaService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class RAGQuizGenerationService {
    
    private final OllamaService ollamaService;
    private final ObjectMapper objectMapper;
    
    // CHANGÉ DE 5 À 20 QUESTIONS
    private static final int MAX_QUESTIONS = 20;
    
    /**
     * Génère un quiz à partir d'un prompt RAG (sans sauvegarde en base)
     */
    public QuizResponseDTO generateQuizFromRAGPrompt(String ragPrompt, String quizTitle, int questionCount) {
        log.info("🎯 Génération quiz RAG: {} ({} questions, max: {})", quizTitle, questionCount, MAX_QUESTIONS);
        
        try {
            // 1. Vérifier que le service AI est disponible
            if (!isAIServiceAvailable()) {
                log.error("🚨 Service AI (Gemini) non disponible pour la génération RAG");
                throw new RuntimeException("Service AI (Gemini) non disponible. Vérifiez votre connexion internet et votre clé API.");
            }
            
            // 2. DEBUG: Log du prompt
            log.info("📝 Prompt envoyé à Gemini ({} caractères):", ragPrompt.length());
            log.info("Extrait prompt: {}", 
                    ragPrompt.substring(0, Math.min(200, ragPrompt.length())) + "...");
            
            // 3. Appel à Gemini via OllamaService
            long startTime = System.currentTimeMillis();
            List<Question> aiQuestions = ollamaService.generateStructuredQuiz(ragPrompt);
            long duration = System.currentTimeMillis() - startTime;
            
            log.info("⏱️ Gemini a répondu en {}ms", duration);
            log.info("🔧 Modèle utilisé: Gemini via OllamaService");
            
            // 4. DEBUG: Vérifier ce que Gemini a retourné
            if (aiQuestions == null) {
                log.error("❌❌❌ Gemini a retourné NULL");
                throw new RuntimeException("Gemini a retourné null");
            }
            
            if (aiQuestions.isEmpty()) {
                log.error("❌❌❌ Gemini a retourné une liste VIDE");
                
                // Test: Appeler Gemini directement avec un prompt simple
                String testPrompt = "Génère 1 question sur Java.";
                String rawResponse = ollamaService.generateRawResponse(testPrompt);
                log.error("🔍 Test Gemini direct: {}", 
                        rawResponse != null ? rawResponse.substring(0, Math.min(100, rawResponse.length())) : "null");
                
                throw new RuntimeException("Gemini liste vide");
            }
            
            log.info("✅ Gemini a généré {} questions", aiQuestions.size());
            for (int i = 0; i < Math.min(aiQuestions.size(), 3); i++) {
                Question q = aiQuestions.get(i);
                log.info("Q{}: {} (type: {})", i+1, 
                        q.getText().substring(0, Math.min(50, q.getText().length())) + "...",
                        q.getType());
            }
            
            // 5. Convertir les Questions en QuestionResponseDTO (jusqu'à MAX_QUESTIONS)
            QuizResponseDTO quiz = convertToQuizResponse(aiQuestions, quizTitle, Math.min(questionCount, MAX_QUESTIONS));
            
            log.info("✅ Quiz RAG généré avec succès: {} questions", quiz.getQuestions().size());
            return quiz;
            
        } catch (Exception e) {
            log.error("❌❌❌ ERREUR CRITIQUE génération quiz RAG: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur génération quiz: " + e.getMessage(), e);
        }
    }
    
    /**
     * Vérifie si le service AI est disponible
     */
    private boolean isAIServiceAvailable() {
        try {
            // Tester avec une méthode disponible
            String testResponse = ollamaService.generateText("test");
            return testResponse != null && !testResponse.toLowerCase().contains("erreur");
        } catch (Exception e) {
            log.warn("Service AI non disponible: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Convertit les Questions en QuizResponseDTO - CHANGÉ POUR GARDER PLUS DE QUESTIONS
     */
    private QuizResponseDTO convertToQuizResponse(List<Question> questions, String quizTitle, int expectedCount) {
        QuizResponseDTO quizResponse = new QuizResponseDTO();
        quizResponse.setTitle(quizTitle);
        quizResponse.setDescription("Quiz généré par Gemini AI avec contexte RAG");
        quizResponse.setQuestions(new ArrayList<>());
        
        int validQuestions = 0;
        for (Question question : questions) {
            // NE PAS LIMITER À 5 - Garder jusqu'à expectedCount ou MAX_QUESTIONS
            if (validQuestions >= MAX_QUESTIONS) {
                log.info("🏁 Limite de {} questions atteinte", MAX_QUESTIONS);
                break;
            }
            
            QuestionResponseDTO dto = convertQuestionToDTO(question);
            if (dto != null) {
                quizResponse.getQuestions().add(dto);
                validQuestions++;
            }
        }
        
        // Si pas assez de questions valides, compléter avec des questions de fallback
        if (validQuestions < Math.min(expectedCount, 10)) {
            log.warn("⚠️ Seulement {} questions valides sur {} attendues", validQuestions, expectedCount);
            int remaining = Math.min(expectedCount, MAX_QUESTIONS) - validQuestions;
            quizResponse.getQuestions().addAll(generateFallbackQuestions(remaining));
        }
        
        return quizResponse;
    }
    
    /**
     * Convertit une Question en QuestionResponseDTO
     */
    private QuestionResponseDTO convertQuestionToDTO(Question question) {
        try {
            if (question == null || question.getText() == null || question.getText().trim().isEmpty()) {
                log.warn("❌ Question vide ou sans texte");
                return null;
            }
            
            QuestionResponseDTO dto = new QuestionResponseDTO();
            
            // Texte
            dto.setText(question.getText().trim());
            
            // Type
            dto.setType(question.getType() != null ? question.getType() : QuestionType.SINGLE_CHOICE);
            
            // Options
            if (question.getOptions() != null && !question.getOptions().isEmpty()) {
                dto.setOptions(new ArrayList<>(question.getOptions()));
            } else {
                // Options par défaut selon le type
                if (dto.getType() == QuestionType.TRUE_FALSE) {
                    dto.setOptions(Arrays.asList("Vrai", "Faux"));
                } else if (dto.getType() == QuestionType.SINGLE_CHOICE || dto.getType() == QuestionType.MULTIPLE_CHOICE) {
                    dto.setOptions(Arrays.asList("Option A", "Option B", "Option C", "Option D"));
                }
            }
            
            // Réponse correcte
            if (question.getCorrectAnswer() != null && !question.getCorrectAnswer().trim().isEmpty()) {
                dto.setCorrectAnswer(question.getCorrectAnswer().trim());
            } else {
                // Réponse par défaut
                dto.setCorrectAnswer(getDefaultAnswer(dto.getType(), dto.getOptions()));
            }
            
            // Explication (pas disponible dans Question, on met une valeur par défaut)
            dto.setExplanation("Explication basée sur le contenu du cours");
            
            // ID temporaire
            dto.setId(System.currentTimeMillis() % 10000);
            
            log.debug("✅ Question convertie: '{}'", 
                     dto.getText().substring(0, Math.min(50, dto.getText().length())));
            
            return dto;
            
        } catch (Exception e) {
            log.warn("❌ Erreur conversion question: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Réponse par défaut selon le type
     */
    private String getDefaultAnswer(QuestionType type, List<String> options) {
        if (type == QuestionType.MULTIPLE_CHOICE && options != null && !options.isEmpty()) {
            return options.get(0);
        } else if (type == QuestionType.SINGLE_CHOICE && options != null && !options.isEmpty()) {
            return options.get(0);
        } else if (type == QuestionType.TRUE_FALSE) {
            return "Vrai";
        } else if (type == QuestionType.OPEN_ENDED) {
            return "Réponse attendue basée sur le contexte";
        }
        return "Réponse correcte";
    }
    
    /**
     * Parse le JSON généré par Gemini (méthode conservée pour compatibilité)
     */
    private QuizResponseDTO parseQuizFromJSON(String jsonResponse, String quizTitle, int expectedCount) {
        try {
            // Nettoyer le JSON
            String cleanedJson = cleanJsonResponse(jsonResponse);
            
            // Parser
            Map<String, Object> quizData = objectMapper.readValue(cleanedJson, Map.class);
            List<Map<String, Object>> questionsData = (List<Map<String, Object>>) quizData.get("questions");
            
            // Créer le DTO
            QuizResponseDTO quizResponse = new QuizResponseDTO();
            quizResponse.setTitle(quizTitle);
            quizResponse.setDescription("Quiz généré par Gemini AI avec contexte RAG");
            quizResponse.setQuestions(new ArrayList<>());
            
            int validQuestions = 0;
            for (Map<String, Object> qData : questionsData) {
                if (validQuestions >= MAX_QUESTIONS) break;
                
                QuestionResponseDTO question = parseQuestionFromMap(qData);
                if (question != null) {
                    quizResponse.getQuestions().add(question);
                    validQuestions++;
                }
            }
            
            // Si pas assez de questions valides, compléter avec des questions de fallback
            if (validQuestions < Math.min(expectedCount, 10)) {
                log.warn("⚠️ Seulement {} questions valides sur {} attendues", validQuestions, expectedCount);
                int remaining = Math.min(expectedCount, MAX_QUESTIONS) - validQuestions;
                quizResponse.getQuestions().addAll(generateFallbackQuestions(remaining));
            }
            
            return quizResponse;
            
        } catch (Exception e) {
            log.error("❌ Erreur parsing JSON RAG: {}", e.getMessage());
            throw new RuntimeException("Erreur lors du parsing du quiz généré: " + e.getMessage());
        }
    }
    
    /**
     * Parse une question depuis la Map
     */
    private QuestionResponseDTO parseQuestionFromMap(Map<String, Object> qData) {
        try {
            log.debug("🔍 Parsing question data: {}", qData.keySet());
            
            QuestionResponseDTO question = new QuestionResponseDTO();
            
            // 1. Texte (avec recherche flexible)
            String text = extractQuestionText(qData);
            if (text == null || text.trim().isEmpty() || text.length() < 10) {
                log.warn("❌ Question sans texte valide (longueur: {})", text != null ? text.length() : 0);
                return null;
            }
            question.setText(text.trim());
            
            // 2. Type (avec détection intelligente)
            question.setType(detectQuestionType(qData));
            
            // 3. Options (gestion de tous les formats)
            List<String> options = extractQuestionOptions(qData, question.getType());
            question.setOptions(options);
            
            // 4. Réponse correcte (extraction flexible)
            String correctAnswer = extractCorrectAnswer(qData, question.getType(), options);
            question.setCorrectAnswer(correctAnswer);
            
            // 5. Explication
            question.setExplanation(extractExplanation(qData));
            
            // 6. ID (générer un ID temporaire)
            question.setId(qData.containsKey("id") ? 
                Long.parseLong(qData.get("id").toString()) : 
                System.currentTimeMillis() % 1000);
            
            log.debug("✅ Question parsée: '{}' ({} options, type: {})", 
                     text.substring(0, Math.min(30, text.length())), 
                     options.size(), question.getType());
            
            return question;
            
        } catch (Exception e) {
            log.warn("❌ Erreur parsing question: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Extraction flexible du texte de la question
     */
    private String extractQuestionText(Map<String, Object> qData) {
        String[] possibleKeys = {"text", "question", "q", "content", "query", "prompt"};
        
        for (String key : possibleKeys) {
            if (qData.containsKey(key)) {
                Object value = qData.get(key);
                if (value != null) {
                    String text = value.toString().trim();
                    if (!text.isEmpty()) {
                        log.debug("📝 Texte trouvé dans clé '{}': {}...", key, 
                                 text.substring(0, Math.min(50, text.length())));
                        return text;
                    }
                }
            }
        }
        
        // Si aucune clé trouvée, chercher dans les valeurs
        for (Map.Entry<String, Object> entry : qData.entrySet()) {
            if (entry.getValue() instanceof String) {
                String value = entry.getValue().toString().trim();
                if (value.length() > 20 && value.contains("?")) {
                    log.debug("📝 Texte trouvé dans valeur de '{}'", entry.getKey());
                    return value;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Détection intelligente du type de question
     */
    private QuestionType detectQuestionType(Map<String, Object> qData) {
        // 1. Vérifier la clé "type"
        if (qData.containsKey("type")) {
            Object typeObj = qData.get("type");
            String typeStr = typeObj.toString().toUpperCase().replace(" ", "_");
            
            log.debug("🎯 Type brut: '{}'", typeStr);
            
            // Nettoyer le type
            if (typeStr.contains("SINGLE") || typeStr.contains("CHOICE")) {
                return QuestionType.SINGLE_CHOICE;
            } else if (typeStr.contains("MULTIPLE") || typeStr.contains("CHOICE")) {
                return QuestionType.MULTIPLE_CHOICE;
            } else if (typeStr.contains("TRUE") || typeStr.contains("FALSE")) {
                return QuestionType.TRUE_FALSE;
            } else if (typeStr.contains("SHORT") || typeStr.contains("ANSWER") || 
                       typeStr.contains("OPEN") || typeStr.contains("ENDED")) {
                return QuestionType.OPEN_ENDED;
            }
            
            // Essayer de matcher exactement
            try {
                return QuestionType.valueOf(typeStr);
            } catch (IllegalArgumentException e) {
                // Continuer avec la détection automatique
            }
        }
        
        // 2. Détection par analyse des options
        if (qData.containsKey("options")) {
            Object options = qData.get("options");
            if (options instanceof List) {
                List<?> opts = (List<?>) options;
                if (opts.size() == 2) {
                    // Vérifier si c'est TRUE_FALSE
                    String opt1 = opts.get(0).toString().toLowerCase();
                    String opt2 = opts.get(1).toString().toLowerCase();
                    if ((opt1.contains("vrai") && opt2.contains("faux")) || 
                        (opt1.contains("true") && opt2.contains("false"))) {
                        return QuestionType.TRUE_FALSE;
                    }
                }
                return QuestionType.SINGLE_CHOICE; // Par défaut pour les choix
            }
        }
        
        // 3. Détection par présence de réponses multiples
        if (qData.containsKey("correctAnswer")) {
            Object correct = qData.get("correctAnswer");
            if (correct instanceof List && ((List<?>) correct).size() > 1) {
                return QuestionType.MULTIPLE_CHOICE;
            }
        }
        
        // 4. Par défaut
        log.debug("🎯 Type par défaut: SINGLE_CHOICE");
        return QuestionType.SINGLE_CHOICE;
    }
    
    /**
     * Extraction flexible des options
     */
    private List<String> extractQuestionOptions(Map<String, Object> qData, QuestionType type) {
        List<String> options = new ArrayList<>();
        
        // Si c'est OPEN_ENDED ou SHORT_ANSWER, pas d'options nécessaires
        if (type == QuestionType.OPEN_ENDED) {
            return options; // Liste vide
        }
        
        // 1. Essayer la clé "options"
        if (qData.containsKey("options")) {
            Object opts = qData.get("options");
            
            if (opts instanceof List) {
                List<?> rawOptions = (List<?>) opts;
                
                for (Object opt : rawOptions) {
                    if (opt == null) continue;
                    
                    if (opt instanceof Map) {
                        // Format: {"text": "Option A", "correct": true}
                        Map<String, Object> optMap = (Map<String, Object>) opt;
                        if (optMap.containsKey("text")) {
                            String optText = optMap.get("text").toString().trim();
                            if (!optText.isEmpty()) {
                                options.add(optText);
                            }
                        } else if (optMap.containsKey("option")) {
                            String optText = optMap.get("option").toString().trim();
                            if (!optText.isEmpty()) {
                                options.add(optText);
                            }
                        }
                    } else if (opt instanceof String) {
                        // Format simple: "Option A"
                        String optText = opt.toString().trim();
                        if (!optText.isEmpty()) {
                            options.add(optText);
                        }
                    } else {
                        // Autre type, convertir en string
                        options.add(opt.toString().trim());
                    }
                }
            } else if (opts instanceof String) {
                // Format: "Option A, Option B, Option C"
                String[] parts = ((String) opts).split(",");
                for (String part : parts) {
                    String trimmed = part.trim();
                    if (!trimmed.isEmpty()) {
                        options.add(trimmed);
                    }
                }
            }
        }
        
        // 2. Si TRUE_FALSE et pas d'options, créer les options standard
        if (type == QuestionType.TRUE_FALSE && options.isEmpty()) {
            options.add("Vrai");
            options.add("Faux");
        }
        
        // 3. Si pas assez d'options pour un choix, compléter
        if ((type == QuestionType.SINGLE_CHOICE || type == QuestionType.MULTIPLE_CHOICE) && 
            options.size() < 2) {
            String[] defaults = {"Option A", "Option B", "Option C", "Option D"};
            for (int i = options.size(); i < Math.min(4, defaults.length); i++) {
                options.add(defaults[i]);
            }
        }
        
        log.debug("📋 Options extraites: {} (type: {})", options.size(), type);
        return options;
    }
    
    /**
     * Extraction flexible de la réponse correcte
     */
    private String extractCorrectAnswer(Map<String, Object> qData, QuestionType type, List<String> options) {
        // 1. Essayer la clé "correctAnswer"
        if (qData.containsKey("correctAnswer")) {
            Object correct = qData.get("correctAnswer");
            
            if (correct == null) {
                return getDefaultAnswerForJSON(type, options);
            }
            
            // Pour MULTIPLE_CHOICE
            if (type == QuestionType.MULTIPLE_CHOICE) {
                if (correct instanceof List) {
                    // Format: ["Option A", "Option C"]
                    List<String> answers = new ArrayList<>();
                    for (Object ans : (List<?>) correct) {
                        if (ans != null) {
                            String answer = ans.toString().trim();
                            if (!answer.isEmpty() && !answers.contains(answer)) {
                                answers.add(answer);
                            }
                        }
                    }
                    return answers.isEmpty() ? getDefaultAnswerForJSON(type, options) : String.join(",", answers);
                } else if (correct instanceof String) {
                    // Format: "Option A, Option C" ou "A,C"
                    String answerStr = correct.toString().trim();
                    if (answerStr.contains(",")) {
                        String[] parts = answerStr.split(",");
                        List<String> answers = new ArrayList<>();
                        for (String part : parts) {
                            String trimmed = part.trim();
                            if (!trimmed.isEmpty() && !answers.contains(trimmed)) {
                                answers.add(trimmed);
                            }
                        }
                        return answers.isEmpty() ? getDefaultAnswerForJSON(type, options) : String.join(",", answers);
                    } else {
                        // Une seule réponse
                        return answerStr;
                    }
                }
            } else {
                // Pour SINGLE_CHOICE, TRUE_FALSE, OPEN_ENDED
                String answer = correct.toString().trim();
                return answer.isEmpty() ? getDefaultAnswerForJSON(type, options) : answer;
            }
        }
        
        // 2. Chercher dans d'autres clés
        String[] possibleKeys = {"answer", "correct", "solution", "response"};
        for (String key : possibleKeys) {
            if (qData.containsKey(key)) {
                Object answer = qData.get(key);
                if (answer != null) {
                    String answerStr = answer.toString().trim();
                    if (!answerStr.isEmpty()) {
                        return answerStr;
                    }
                }
            }
        }
        
        // 3. Fallback
        return getDefaultAnswerForJSON(type, options);
    }
    
    /**
     * Réponse par défaut selon le type (version pour JSON parsing)
     */
    private String getDefaultAnswerForJSON(QuestionType type, List<String> options) {
        if (type == QuestionType.MULTIPLE_CHOICE && options != null && !options.isEmpty()) {
            return options.get(0);
        } else if (type == QuestionType.SINGLE_CHOICE && options != null && !options.isEmpty()) {
            return options.get(0);
        } else if (type == QuestionType.TRUE_FALSE) {
            return "Vrai";
        } else if (type == QuestionType.OPEN_ENDED) {
            return "Réponse attendue basée sur le contexte";
        }
        return "Réponse correcte";
    }
    
    /**
     * Extraction de l'explication
     */
    private String extractExplanation(Map<String, Object> qData) {
        String[] possibleKeys = {"explanation", "explication", "reason", "why", "rationale", "details"};
        
        for (String key : possibleKeys) {
            if (qData.containsKey(key)) {
                Object value = qData.get(key);
                if (value != null) {
                    String explanation = value.toString().trim();
                    if (!explanation.isEmpty()) {
                        return explanation;
                    }
                }
            }
        }
        
        // Fallback basé sur le type
        if (qData.containsKey("type")) {
            String type = qData.get("type").toString().toLowerCase();
            if (type.contains("choice")) {
                return "Sélectionnez la ou les réponses correctes basées sur le contexte du cours";
            }
        }
        
        return "Explication basée sur le contenu du cours";
    }
    
    /**
     * Nettoie la réponse JSON
     */
    private String cleanJsonResponse(String response) {
        if (response == null) return "{\"questions\":[]}";
        
        // Retirer les backticks de markdown
        response = response.replaceAll("```json\\n?", "").replaceAll("\\n?```", "");
        
        // Trouver le premier { et dernier }
        int start = response.indexOf('{');
        int end = response.lastIndexOf('}');
        
        if (start >= 0 && end > start) {
            String json = response.substring(start, end + 1);
            
            // Valider que c'est du JSON
            try {
                objectMapper.readTree(json);
                return json;
            } catch (Exception e) {
                log.debug("JSON invalide, tentative de correction...");
            }
        }
        
        // Fallback: chercher du JSON-like
        String[] lines = response.split("\n");
        StringBuilder jsonBuilder = new StringBuilder();
        boolean inJson = false;
        
        for (String line : lines) {
            line = line.trim();
            if (line.startsWith("{") || line.startsWith("[")) {
                inJson = true;
            }
            if (inJson) {
                jsonBuilder.append(line);
                if (line.endsWith("}") || line.endsWith("]")) {
                    break;
                }
            }
        }
        
        String extracted = jsonBuilder.toString();
        if (extracted.isEmpty()) {
            throw new RuntimeException("Impossible d'extraire du JSON de la réponse");
        }
        
        return extracted;
    }
    
    /**
     * Génère un quiz de fallback
     */
    private QuizResponseDTO generateFallbackQuiz(String quizTitle, int questionCount) {
        QuizResponseDTO quiz = new QuizResponseDTO();
        quiz.setTitle(quizTitle + " (Mode Secours)");
        quiz.setDescription("Quiz généré en mode de secours - veuillez réessayer plus tard");
        quiz.setQuestions(generateFallbackQuestions(Math.min(questionCount, 10)));
        
        log.warn("⚠️ Utilisation du quiz de fallback");
        return quiz;
    }
    
    /**
     * Génère des questions de fallback
     */
    private List<QuestionResponseDTO> generateFallbackQuestions(int count) {
        List<QuestionResponseDTO> questions = new ArrayList<>();
        
        int actualCount = Math.min(count, 10);
        for (int i = 1; i <= actualCount; i++) {
            QuestionResponseDTO question = new QuestionResponseDTO();
            question.setText("Question de secours #" + i + " - Le système est en maintenance");
            question.setType(QuestionType.SINGLE_CHOICE);
            question.setOptions(Arrays.asList("Option A", "Option B", "Option C", "Option D"));
            question.setCorrectAnswer("Option B");
            question.setExplanation("Question générée automatiquement pendant une maintenance du système AI");
            
            questions.add(question);
        }
        
        return questions;
    }
    
    /**
     * Construit un prompt RAG optimisé pour Gemini
     */
    public String buildRAGPrompt(String topic, List<String> relevantContent, String userLevel, List<String> userInterests) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("🎯 TU ES UN TUTEUR INTELLIGENT QUI CRÉE DES QUIZ PERSONNALISÉS AVEC GEMINI AI\n\n");
        
        // Contexte de l'apprenant
        prompt.append("👤 CONTEXTE APPRENANT:\n");
        prompt.append("- Niveau: ").append(userLevel).append("\n");
        if (userInterests != null && !userInterests.isEmpty()) {
            prompt.append("- Centres d'intérêt: ").append(String.join(", ", userInterests)).append("\n");
        }
        prompt.append("\n");
        
        // Contenu pertinent
        prompt.append("📖 CONTENU PERTINENT (sélectionné par RAG):\n");
        if (relevantContent != null && !relevantContent.isEmpty()) {
            for (int i = 0; i < Math.min(relevantContent.size(), 5); i++) {
                prompt.append("\n【Source ").append(i + 1).append("】\n");
                String content = relevantContent.get(i);
                prompt.append(content.substring(0, Math.min(300, content.length())));
                if (content.length() > 300) prompt.append("...");
                prompt.append("\n");
            }
        } else {
            prompt.append("Aucun contenu spécifique trouvé. Base-toi sur tes connaissances générales.\n");
        }
        prompt.append("\n");
        
        // Instructions - MODIFIÉ POUR 15-20 QUESTIONS
        prompt.append("""
            🎯 INSTRUCTIONS CRITIQUES:
            
            1. CRÉE 15-20 QUESTIONS BASÉES UNIQUEMENT SUR LE CONTENU CI-DESSUS
            2. NE PAS INVENTER D'INFORMATIONS
            3. MÉLANGER LES TYPES: 60% SINGLE_CHOICE, 30% MULTIPLE_CHOICE, 10% TRUE_FALSE
            4. QUESTIONS CLAIRES ET NON AMBIGUËS
            5. OPTIONS PERTINENTES ET DISTINCTES
            
            6. FORMAT JSON STRICT:
            {
              "questions": [
                {
                  "text": "Question précise?",
                  "type": "SINGLE_CHOICE",
                  "options": ["Option A", "Option B", "Option C", "Option D"],
                  "correctAnswer": "Option B",
                  "explanation": "Explication basée sur la source 1"
                }
              ]
            }
            
            7. IMPORTANT: Retourne UNIQUEMENT le JSON, sans texte avant/après
            8. UTILISE GEMINI POUR GÉNÉRER DES QUESTIONS DE HAUTE QUALITÉ
            """);
        
        return prompt.toString();
    }
    
    /**
     * Teste la génération RAG
     */
    public Map<String, Object> testRAGGeneration() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Test avec un prompt simple
            String testPrompt = """
                📖 CONTENU: Spring Boot simplifie le développement Java avec la configuration automatique.
                
                🎯 CRÉE 15-20 questions sur Spring Boot.
                Format JSON uniquement.
                """;
            
            QuizResponseDTO quiz = generateQuizFromRAGPrompt(testPrompt, "Test RAG", 20);
            
            result.put("success", true);
            result.put("questions_generated", quiz.getQuestions().size());
            result.put("quiz_title", quiz.getTitle());
            result.put("ai_service_available", isAIServiceAvailable());
            result.put("ai_service", "Gemini");
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("ai_service", "Gemini (erreur)");
        }
        
        return result;
    }
    
    /**
     * Méthode alternative pour générer un quiz à partir de JSON (pour compatibilité)
     */
    public QuizResponseDTO generateQuizFromJSON(String jsonResponse, String quizTitle, int questionCount) {
        log.info("🎯 Génération quiz depuis JSON: {} ({} questions)", quizTitle, questionCount);
        
        try {
            // Utiliser l'ancienne méthode de parsing JSON
            return parseQuizFromJSON(jsonResponse, quizTitle, questionCount);
            
        } catch (Exception e) {
            log.error("❌ Erreur génération quiz depuis JSON: {}", e.getMessage());
            return generateFallbackQuiz(quizTitle, Math.min(questionCount, 10));
        }
    }
    
    /**
     * Valide si une réponse JSON contient des questions valides
     */
    public boolean validateQuizJSON(String jsonResponse) {
        try {
            String cleanedJson = cleanJsonResponse(jsonResponse);
            Map<String, Object> quizData = objectMapper.readValue(cleanedJson, Map.class);
            
            if (!quizData.containsKey("questions")) {
                log.warn("❌ JSON invalide: clé 'questions' manquante");
                return false;
            }
            
            List<?> questions = (List<?>) quizData.get("questions");
            if (questions == null || questions.isEmpty()) {
                log.warn("❌ JSON invalide: liste de questions vide");
                return false;
            }
            
            log.info("✅ JSON valide: {} questions détectées", questions.size());
            return true;
            
        } catch (Exception e) {
            log.error("❌ Erreur validation JSON: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Génère un quiz avec gestion d'erreur élégante
     */
    public QuizResponseDTO generateQuizSafely(String ragPrompt, String quizTitle, int questionCount) {
        try {
            return generateQuizFromRAGPrompt(ragPrompt, quizTitle, questionCount);
        } catch (Exception e) {
            log.warn("Génération AI échouée, création d'un quiz de secours: {}", e.getMessage());
            
            QuizResponseDTO fallbackQuiz = new QuizResponseDTO();
            fallbackQuiz.setTitle(quizTitle + " (quiz de secours)");
            fallbackQuiz.setDescription("Quiz créé manuellement suite à une erreur de génération Gemini AI");
            fallbackQuiz.setQuestions(generateFallbackQuestions(Math.min(5, questionCount)));
            
            return fallbackQuiz;
        }
    }
    
    /**
     * Vérifie l'état du service
     */
    public Map<String, Object> getServiceStatus() {
        Map<String, Object> status = new HashMap<>();
        
        try {
            boolean aiAvailable = isAIServiceAvailable();
            status.put("ai_service_available", aiAvailable);
            status.put("ai_service", "Gemini via OllamaService");
            status.put("json_parsing_supported", true);
            status.put("rag_generation_supported", true);
            status.put("max_questions_per_quiz", MAX_QUESTIONS);
            
            // Tester avec un petit prompt
            if (aiAvailable) {
                String testResponse = ollamaService.generateText("bonjour");
                status.put("ai_response_test", testResponse != null && testResponse.length() > 0);
            }
            
        } catch (Exception e) {
            status.put("error", e.getMessage());
            status.put("ai_service_available", false);
        }
        
        return status;
    }
}
```

---


<h2 style="color:#0d47a1;">💻 Code complet : RAGQuizService.java</h2>

```java
package com.iatd.smarthub.service.rag;

import com.iatd.smarthub.dto.QuizResponseDTO;
import com.iatd.smarthub.dto.QuestionResponseDTO;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.model.course.CourseFile;
import com.iatd.smarthub.model.rag.KnowledgeBase;
import com.iatd.smarthub.model.rag.LearningProfile;
import com.iatd.smarthub.model.rag.QuizRecommendation;
import com.iatd.smarthub.model.quiz.QuestionType;
import com.iatd.smarthub.repository.CourseFileRepository;
import com.iatd.smarthub.repository.UserRepository;
import com.iatd.smarthub.repository.rag.KnowledgeBaseRepository;
import com.iatd.smarthub.repository.rag.LearningProfileRepository;
import com.iatd.smarthub.repository.rag.QuizRecommendationRepository;
import com.iatd.smarthub.service.OllamaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Import PDFBox pour extraction réelle - CORRIGÉ pour version 3.0.2
import org.apache.pdfbox.Loader;  // IMPORTANT: Nouveau dans PDFBox 3.x
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RAGQuizService {
    
    // DÉPENDANCES
    private final CourseFileRepository courseFileRepository;
    private final UserRepository userRepository;
    private final OllamaService ollamaService;
    private final RAGQuizGenerationService ragQuizGenerationService;
    private final KnowledgeBaseRepository knowledgeBaseRepository;
    private final LearningProfileRepository learningProfileRepository;
    private final QuizRecommendationRepository quizRecommendationRepository;
    private final VectorRAGService vectorRAGService;
    private final EmbeddingService embeddingService;
    
    /**
     * Génère un quiz basé sur les fichiers d'un cours
     */
    @Transactional
    public QuizResponseDTO generatePersonalizedQuizForCourse(Long userId, Long courseId, String courseTitle) {
        log.info("📚 Génération quiz pour cours - userId: {}, courseId: {}, title: {}", 
                 userId, courseId, courseTitle);
        
        try {
            // 1. Récupérer l'utilisateur
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé: " + userId));
            
            // 2. Récupérer ou créer le profil
            LearningProfile profile = learningProfileRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultProfile(user));
            
            // 3. RÉCUPÉRER LES FICHIERS DU COURS
            List<CourseFile> courseFiles = courseFileRepository.findByCourseId(courseId);
            
            if (courseFiles.isEmpty()) {
                log.error("❌ AUCUN fichier trouvé pour le cours {}", courseId);
                throw new RuntimeException("Le cours n'a pas de fichiers disponibles");
            }
            
            log.info("📁 {} fichier(s) trouvé(s) pour le cours '{}': {}", 
                    courseFiles.size(), courseTitle,
                    courseFiles.stream()
                        .limit(3)
                        .map(CourseFile::getFileName)
                        .collect(Collectors.joining(", ")));
            
            // 4. LIRE LE VRAI CONTENU DES FICHIERS
            Map<String, String> fileContents = readRealFilesContent(courseFiles);
            
            // 5. Valider la pertinence du contenu
            validateContentRelevance(courseTitle, fileContents);
            
            // 6. Construire un prompt AVEC LE VRAI CONTENU - CORRIGÉ
            String ragPrompt = buildStrictRAGPrompt(courseTitle, profile, courseFiles, fileContents);
            
            log.debug("📝 Prompt cours généré: {} caractères", ragPrompt.length());
            
            // 7. Générer le quiz avec le vrai contenu - CHANGEMENT 1: 20 au lieu de 5
            QuizResponseDTO quiz = ragQuizGenerationService.generateQuizFromRAGPrompt(
                ragPrompt,
                "Quiz: " + courseTitle,
                20  // CHANGÉ DE 5 À 20
            );
            
            // 8. Enregistrer la recommandation
            saveCourseRecommendation(user, courseId, courseTitle, courseFiles);
            
            // 9. Mettre à jour le profil avec le cours
            updateProfileWithCourse(profile, courseTitle);
            
            log.info("✅ Quiz de cours généré avec succès: {} questions", quiz.getQuestions().size());
            return quiz;
            
        } catch (Exception e) {
            log.error("❌ Erreur génération quiz cours: {}", e.getMessage(), e);
            // Fallback: générer un quiz basique
            return generateFallbackCourseQuiz(courseId, courseTitle);
        }
    }
    
    /**
     * Lit le VRAI contenu des fichiers
     */
    private Map<String, String> readRealFilesContent(List<CourseFile> courseFiles) {
        Map<String, String> contents = new HashMap<>();
        
        for (CourseFile file : courseFiles) {
            try {
                String content = extractFileContent(file);
                if (content != null && !content.trim().isEmpty()) {
                    contents.put(file.getFileName(), content);
                    log.info("✅ Contenu EXTRACT pour {}: {} caractères", 
                            file.getFileName(), content.length());
                    
                    // Log du début du contenu pour vérification
                    String preview = content.length() > 200 ? 
                        content.substring(0, 200) + "..." : content;
                    log.debug("📄 Prévisualisation {}: {}", file.getFileName(), preview);
                } else {
                    log.warn("⚠️ Contenu vide ou non lisible pour {}", file.getFileName());
                    contents.put(file.getFileName(), 
                        "Fichier: " + file.getFileName() + 
                        " (Type: " + file.getFileType() + 
                        ", Taille: " + formatFileSize(file.getFileSize()) + ")" +
                        "\n\n⚠️ Impossible d'extraire le contenu textuel.");
                }
            } catch (Exception e) {
                log.error("❌ Erreur extraction {}: {}", file.getFileName(), e.getMessage());
                contents.put(file.getFileName(), 
                    "Fichier: " + file.getFileName() + 
                    " - Erreur d'extraction: " + e.getMessage());
            }
        }
        
        return contents;
    }
    
    /**
     * Extrait le contenu d'un fichier (méthode principale)
     */
    private String extractFileContent(CourseFile file) {
        try {
            if (file.getFilePath() == null || file.getFilePath().isEmpty()) {
                log.warn(" Chemin de fichier vide pour {}", file.getFileName());
                return null;
            }
            
            String uploadDir = "uploads/";
            Path filePath = Paths.get(uploadDir, file.getFilePath()).toAbsolutePath().normalize();
            log.info(" Recherche fichier à: {}", filePath);
            
            if (!Files.exists(filePath)) {
                log.warn(" Fichier non trouvé: {}", file.getFilePath());
                return "Fichier non trouvé: " + file.getFileName();
            }
            
            String fileType = file.getFileType() != null ? 
                file.getFileType().toLowerCase() : "unknown";
            
            log.info(" Extraction fichier: {} (Type: {})", file.getFileName(), fileType);
            
            // 1. Fichiers texte
            if (fileType.contains("txt") || fileType.contains("md") || 
                fileType.contains("csv") || fileType.contains("json")) {
                try {
                    String content = Files.readString(filePath);
                    log.info(" Fichier texte lu: {} caractères", content.length());
                    return content;
                } catch (IOException e) {
                    log.error(" Erreur lecture fichier texte: {}", e.getMessage());
                    return "Erreur lecture: " + e.getMessage();
                }
            }
            
            // 2. FICHIERS PDF - EXTRACTION RÉELLE (CORRIGÉ POUR PDFBox 3.x)
            if (fileType.contains("pdf")) {
                return extractRealPDFContent(filePath);
            }
            
            // 3. Autres types
            return "Type de fichier: " + fileType.toUpperCase() + 
                   "\nFichier: " + file.getFileName() +
                   "\nTaille: " + formatFileSize(file.getFileSize());
            
        } catch (Exception e) {
            log.error(" Erreur extraction {}: {}", file.getFileName(), e.getMessage());
            throw new RuntimeException("Erreur extraction fichier: " + e.getMessage());
        }
    }
    
    /**
     * Extrait le VRAI contenu d'un PDF avec PDFBox 3.0.2 - CORRIGÉ
     */
    private String extractRealPDFContent(Path filePath) {
        log.info(" Extraction RÉELLE PDF avec PDFBox 3.0.2: {}", filePath.getFileName());
        
        // CORRECTION: Utiliser Loader.loadPDF() au lieu de PDDocument.load()
        try (PDDocument document = Loader.loadPDF(filePath.toFile())) {
            
            // Vérifier si le PDF est chiffré
            if (document.isEncrypted()) {
                log.warn(" PDF chiffré détecté: {}", filePath.getFileName());
                return "PDF protégé (chiffré) - impossible d'extraire le contenu";
            }
            
            int pageCount = document.getNumberOfPages();
            log.info(" PDF détecté: {} pages", pageCount);
            
            if (pageCount == 0) {
                log.warn(" PDF vide: 0 pages");
                return "PDF vide (0 pages)";
            }
            
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            stripper.setWordSeparator(" ");
            
            // CHANGEMENT 2: 20 pages au lieu de 15 pour 20 questions
            stripper.setStartPage(1);
            stripper.setEndPage(Math.min(pageCount, 20));
            
            String text = stripper.getText(document);
            text = cleanExtractedText(text);
            
            // Analyse du contenu extrait
            analyzeExtractedContent(filePath.getFileName().toString(), text);
            
            log.info(" PDF extrait avec succès: {} caractères", text.length());
            return text;
            
        } catch (IOException e) {
            // Vérifier si c'est une erreur de mot de passe (PDFBox 3.x)
            if (e.getMessage() != null && 
                (e.getMessage().contains("password") || 
                 e.getMessage().contains("Password") ||
                 e.getMessage().contains("encrypted") ||
                 e.getMessage().contains("Encrypted"))) {
                log.error(" PDF protégé par mot de passe: {}", filePath.getFileName());
                return "PDF protégé par mot de passe - impossible d'extraire le contenu";
            }
            
            log.error(" Erreur extraction PDF Box: {}", e.getMessage());
            return "Erreur extraction PDF: " + e.getMessage();
        } catch (Exception e) {
            log.error(" Erreur inattendue PDF: {}", e.getMessage(), e);
            return "Erreur inattendue: " + e.getMessage();
        }
    }
    
    /**
     * Nettoie le texte extrait
     */
    private String cleanExtractedText(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        
        // 1. Supprimer les sauts de ligne multiples
        text = text.replaceAll("\\n{3,}", "\n\n");
        
        // 2. Supprimer les espaces multiples
        text = text.replaceAll("\\s{2,}", " ");
        
        // 3. Supprimer les caractères de contrôle
        text = text.replaceAll("[\\x00-\\x1F\\x7F]", "");
        
        // 4. Nettoyer les en-têtes/pieds de page communs
        text = text.replaceAll("Page\\s+\\d+\\s+of\\s+\\d+", "");
        text = text.replaceAll("\\d{1,2}/\\d{1,2}/\\d{4}", "");
        
        // 5. Supprimer les numéros de page isolés
        text = text.replaceAll("^\\d+$", "");
        
        // 6. Supprimer les lignes trop courtes (moins de 3 caractères)
        text = Arrays.stream(text.split("\n"))
            .filter(line -> line.trim().length() > 3)
            .collect(Collectors.joining("\n"));
        
        return text.trim();
    }
    
    /**
     * Analyse le contenu extrait
     */
    private void analyzeExtractedContent(String fileName, String content) {
        log.info("📊 ANALYSE CONTENU PDF '{}':", fileName);
        log.info("  - Longueur totale: {} caractères", content.length());
        
        String[] lines = content.split("\n");
        log.info("  - Nombre de lignes: {}", lines.length);
        
        String[] words = content.split("\\s+");
        log.info("  - Nombre de mots: {}", words.length);
        
        // Détection de mots-clés MLOps
        String lowerContent = content.toLowerCase();
        
        // Mots-clés MLOps
        String[] mlopsKeywords = {
            "mlops", "machine learning operations", "model deployment", 
            "model monitoring", "pipeline", "ci/cd", "versioning",
            "explainable ai", "model interpretability", "shap", "lime",
            "feature store", "model registry", "experiment tracking"
        };
        
        log.info("  - MOTS-CLÉS DÉTECTÉS:");
        for (String keyword : mlopsKeywords) {
            if (lowerContent.contains(keyword)) {
                log.info("    ✓ '{}'", keyword);
            }
        }
        
        // Détection de sections
        if (content.contains("#") || content.contains("##")) {
            log.info("  - Structure Markdown détectée");
        }
        
        if (content.contains("```")) {
            log.info("  - Code source détecté");
        }
        
        // Extraire un échantillon pour vérification
        String sample = content.length() > 300 ? 
            content.substring(0, 300) + "..." : content;
        log.debug("  - ÉCHANTILLON: {}", sample.replace("\n", " "));
    }
    
    /**
     * Construit un prompt STRICT basé sur le vrai contenu - CORRIGÉ POUR ÉVITER LES PLACEHOLDERS
     */
    private String buildStrictRAGPrompt(String courseTitle, LearningProfile profile, 
                                       List<CourseFile> files, Map<String, String> fileContents) {
        
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("""
            ⚠️⚠️⚠️ INSTRUCTION CRITIQUE - SUIVRE À LA LETTRE ⚠️⚠️⚠️
            
            TU ES UN MODÈLE GEMINI AI SPÉCIALISÉ EN CRÉATION DE QUIZ PÉDAGOGIQUE.
            
            TU DOIS GÉNÉRER DES QUESTIONS UNIQUEMENT ET EXCLUSIVEMENT À PARTIR 
            DU CONTENU EXACT FOURNI CI-DESSOUS. 
            
            ABSOLUMENT INTERDIT:
            - D'utiliser tes connaissances générales
            - D'inventer des concepts non présents dans le contenu
            - De faire des suppositions sur le sujet
            
            CONTEXTE DU COURS:
            Titre: """).append(courseTitle).append("""
            
            Nombre de fichiers: """).append(files.size()).append("""
            
            Profil étudiant:
            - Niveau: """).append(translateProficiencyLevel(profile.getProficiencyLevel())).append("""
            - Intérêts: """).append(profile.getInterests() != null ? 
                String.join(", ", profile.getInterests()) : "Non spécifié").append("""
            
            """).append("=".repeat(80)).append("\n\n");
        
        // 1. ANALYSE DÉTAILLÉE DU CONTENU
        prompt.append("CONTENU EXACT DES FICHIERS (NE PAS INVENTER):\n\n");
        
        int fileIndex = 1;
        for (Map.Entry<String, String> entry : fileContents.entrySet()) {
            String fileName = entry.getKey();
            String content = entry.getValue();
            
            prompt.append("FICHIER ").append(fileIndex).append(": ").append(fileName).append("\n");
            prompt.append("-".repeat(50)).append("\n");
            
            // CHANGEMENT 3: 3000 caractères au lieu de 2000 pour 20 questions
            String limitedContent = content.length() > 3000 ? 
                content.substring(0, 3000) + "\n\n[... contenu tronqué pour raison de longueur ...]" :
                content;
            
            prompt.append(limitedContent).append("\n\n");
            
            // Indicateur de fin de fichier
            prompt.append("✓ Fin du fichier ").append(fileIndex).append("\n\n");
            fileIndex++;
        }
        
        prompt.append("=".repeat(80)).append("\n\n");
        
        // 2. INSTRUCTIONS DE GÉNÉRATION TRÈS STRICTES - CHANGEMENT 4: 20 questions
        prompt.append("""
             RÈGLES DE GÉNÉRATION DES QUESTIONS:
            
            POUR CHAQUE QUESTION, TU DOIS:
            1. Identifier PRÉCISÉMENT le passage source dans le contenu
            2. Utiliser la TERMINOLOGIE EXACTE du contenu
            3. Référencer le nom du fichier dans l'explication
            4. Ne pas modifier, extrapoler ou interpréter le contenu
            
            TYPES DE QUESTIONS REQUIS (20 questions total):
            - 18 questions SINGLE_CHOICE (une seule bonne réponse)
            - 1 question MULTIPLE_CHOICE (plusieurs bonnes réponses)
            - 1 question TRUE_FALSE (vrai/faux)
            
            CRITÈRES DE QUALITÉ:
            ✓ Questions CLAIRES et SPÉCIFIQUES
            ✓ Options PLAUSIBLES mais une seule bonne réponse (sauf multiple_choice)
            ✓ Réponses DIRECTEMENT dans le texte
            ✓ Explications qui CITENT le texte source
            
            EXEMPLE DE FORMAT REQUIS:
            Si le contenu dit: "Le deep learning utilise des réseaux de neurones à plusieurs couches."
            
            Alors génère:
            Question: "Que signifie 'deep' dans 'deep learning'?"
            Options: [
              "La profondeur des réseaux de neurones",
              "La complexité des algorithmes", 
              "La difficulté d'apprentissage",
              "Le nom du créateur"
            ]
            Réponse correcte: "La profondeur des réseaux de neurones"
            Explication: "Basé sur le fichier X, ligne Y: 'Le deep learning utilise des réseaux de neurones à plusieurs couches.'"
            
            """).append("=".repeat(80)).append("\n\n");
        
        // 3. FORMAT JSON STRICT SANS PLACEHOLDERS LITTÉRAUX - CORRECTION CRITIQUE
        prompt.append("""
            FORMAT DE SORTIE (JSON UNIQUEMENT - PAS DE TEXTE SUPPLÉMENTAIRE):
            
            {
              "questions": [
                {
                  "text": "QUESTION_TEXT",
                  "type": "SINGLE_CHOICE",
                  "options": ["OPTION_1", "OPTION_2", "OPTION_3", "OPTION_4"],
                  "correctAnswer": "CORRECT_OPTION",
                  "explanation": "EXPLANATION_WITH_SOURCE"
                }
              ]
            }
            
            REMPLACER:
            - "QUESTION_TEXT" par une vraie question basée sur le contenu
            - "OPTION_1", "OPTION_2", etc. par de vraies options distinctes
            - "CORRECT_OPTION" par l'option correcte
            - "EXPLANATION_WITH_SOURCE" par une explication qui cite le fichier et la ligne
            
            ⚠️ IMPORTANT FINAL:
            - Retourner UNIQUEMENT le JSON
            - PAS de commentaires
            - PAS d'explications supplémentaires
            - 20 questions exactement
            - Chaque question doit avoir une source identifiable dans le contenu
            - NE PAS copier les textes d'exemple comme "Question précise basée sur le contenu?"
            """);
        
        return prompt.toString();
    }
    
    /**
     * Valide la pertinence du contenu pour le cours
     */
    private void validateContentRelevance(String courseTitle, Map<String, String> fileContents) {
        log.info("🔍 Validation pertinence contenu pour: {}", courseTitle);
        
        String courseLower = courseTitle.toLowerCase();
        int relevantFiles = 0;
        
        for (Map.Entry<String, String> entry : fileContents.entrySet()) {
            String fileName = entry.getKey();
            String content = entry.getValue().toLowerCase();
            
            boolean isRelevant = false;
            
            // Vérification pour MLOps
            if (courseLower.contains("mlops")) {
                if (content.contains("mlops") || 
                    content.contains("machine learning operations") ||
                    content.contains("model deployment") ||
                    content.contains("ci/cd") ||
                    content.contains("pipeline")) {
                    isRelevant = true;
                    log.info("✅ Contenu MLOps détecté dans: {}", fileName);
                }
            }
            
            // Vérification pour Explainable AI
            if (courseLower.contains("explainable")) {
                if (content.contains("explainable") || 
                    content.contains("interpretable") ||
                    content.contains("shap") ||
                    content.contains("lime") ||
                    content.contains("feature importance")) {
                    isRelevant = true;
                    log.info("✅ Contenu Explainable AI détecté dans: {}", fileName);
                }
            }
            
            // Vérification générale
            if (!isRelevant && content.length() > 100) {
                // Vérifier les mots communs au titre du cours
                String[] titleWords = courseLower.split("\\s+");
                int matchingWords = 0;
                for (String word : titleWords) {
                    if (word.length() > 3 && content.contains(word)) {
                        matchingWords++;
                    }
                }
                
                if (matchingWords >= titleWords.length * 0.3) { // 30% de correspondance
                    isRelevant = true;
                    log.info("✅ Correspondance partielle détectée dans: {}", fileName);
                }
            }
            
            if (isRelevant) {
                relevantFiles++;
            } else if (content.length() > 200) {
                log.warn("⚠️ Contenu potentiellement non pertinent: {}", fileName);
            }
        }
        
        if (relevantFiles == 0) {
            log.warn("⚠️⚠️ AUCUN contenu pertinent détecté pour le cours: {}", courseTitle);
            log.warn("⚠️ Les questions générées peuvent ne pas correspondre au sujet");
        } else {
            log.info("✅ {} fichier(s) pertinent(s) détecté(s) sur {}", 
                    relevantFiles, fileContents.size());
        }
    }
    
    /**
     * Formate la taille du fichier
     */
    private String formatFileSize(Long bytes) {
        if (bytes == null) return "Taille inconnue";
        
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024) + " KB";
        return (bytes / (1024 * 1024)) + " MB";
    }
    
    /**
     * Traduction des niveaux
     */
    private String translateProficiencyLevel(String level) {
        if (level == null) return "Intermédiaire";
        return switch (level.toUpperCase()) {
            case "BEGINNER" -> "Débutant";
            case "INTERMEDIATE" -> "Intermédiaire";
            case "ADVANCED" -> "Avancé";
            case "EXPERT" -> "Expert";
            default -> "Intermédiaire";
        };
    }
    
    /**
     * Mise à jour du profil avec le cours
     */
    private void updateProfileWithCourse(LearningProfile profile, String courseTitle) {
        try {
            if (profile.getInterests() == null) {
                profile.setInterests(new ArrayList<>());
            }
            
            if (!profile.getInterests().contains(courseTitle)) {
                if (profile.getInterests().size() >= 10) {
                    profile.getInterests().remove(0);
                }
                profile.getInterests().add(courseTitle);
                learningProfileRepository.save(profile);
                log.debug("📝 Cours '{}' ajouté aux intérêts du profil", courseTitle);
            }
        } catch (Exception e) {
            log.warn("⚠️ Erreur mise à jour profil: {}", e.getMessage());
        }
    }
    
    /**
     * Fallback: génère un quiz basique
     */
    private QuizResponseDTO generateFallbackCourseQuiz(Long courseId, String courseTitle) {
        log.warn("🔄 Utilisation du fallback pour le cours {}", courseTitle);
        
        List<CourseFile> files = courseFileRepository.findByCourseId(courseId);
        
        QuizResponseDTO quiz = new QuizResponseDTO();
        quiz.setTitle("Quiz: " + courseTitle);
        quiz.setDescription("Quiz basé sur les fichiers du cours (mode fallback)");
        quiz.setQuestions(new ArrayList<>());
        
        // CHANGEMENT 5: Générer 20 questions de fallback au lieu de 5
        for (int i = 1; i <= 20; i++) {
            QuestionResponseDTO q = new QuestionResponseDTO();
            
            if (i <= 18) {
                // Questions SINGLE_CHOICE
                q.setText("Question " + i + ": Quel aspect de " + courseTitle + " est le plus important?");
                q.setType(QuestionType.SINGLE_CHOICE);
                
                List<String> options = Arrays.asList(
                    "Aspect fondamental",
                    "Aspect secondaire",
                    "Aspect optionnel",
                    "Aspect non pertinent"
                );
                Collections.shuffle(options);
                
                q.setOptions(options);
                q.setCorrectAnswer("Aspect fondamental");
                q.setExplanation("L'aspect fondamental est essentiel dans ce domaine.");
            } else if (i == 19) {
                // Question MULTIPLE_CHOICE
                q.setText("Question " + i + ": Quels sont les éléments clés de " + courseTitle + "? (choix multiples)");
                q.setType(QuestionType.MULTIPLE_CHOICE);
                q.setOptions(Arrays.asList("Élément 1", "Élément 2", "Élément non pertinent", "Élément 3"));
                q.setCorrectAnswer("Élément 1, Élément 2, Élément 3");
                q.setExplanation("Ces éléments sont essentiels selon le contenu du cours.");
            } else {
                // Question TRUE_FALSE
                q.setText("Question " + i + ": Le cours " + courseTitle + " est-il essentiel pour comprendre ce domaine?");
                q.setType(QuestionType.TRUE_FALSE);
                q.setOptions(Arrays.asList("Vrai", "Faux"));
                q.setCorrectAnswer("Vrai");
                q.setExplanation("Ce cours couvre des concepts fondamentaux du domaine.");
            }
            
            quiz.getQuestions().add(q);
        }
        
        return quiz;
    }
    
    /**
     * Sauvegarde une recommandation
     */
    private void saveCourseRecommendation(User user, Long courseId, String courseTopic, 
                                         List<CourseFile> courseFiles) {
        try {
            QuizRecommendation recommendation = new QuizRecommendation();
            recommendation.setUser(user);
            recommendation.setRecommendedTopic(courseTopic);
            
            String reason = String.format(
                "Quiz généré pour le cours: %s (ID: %d). Basé sur %d fichiers: %s",
                courseTopic,
                courseId,
                courseFiles.size(),
                courseFiles.stream()
                    .map(CourseFile::getFileName)
                    .limit(3)
                    .collect(Collectors.joining(", "))
            );
            
            recommendation.setReason(reason);
            recommendation.setConfidenceScore(0.8);
            recommendation.setRecommendedAt(LocalDateTime.now());
            recommendation.setAccepted(false);
            
            quizRecommendationRepository.save(recommendation);
            log.debug("💾 Recommandation enregistrée: {}", courseTopic);
        } catch (Exception e) {
            log.warn("⚠️ Erreur enregistrement recommandation: {}", e.getMessage());
        }
    }
    
    /**
     * Crée un profil par défaut
     */
    public LearningProfile createDefaultProfile(User user) {
        LearningProfile profile = new LearningProfile();
        profile.setUser(user);
        profile.setProficiencyLevel("INTERMEDIATE");
        profile.setInterests(new ArrayList<>(Arrays.asList("Programmation", "Informatique", "Technologie")));
        profile.setWeaknesses(new ArrayList<>());
        profile.setLearningStyle("VISUAL");
        return learningProfileRepository.save(profile);
    }
    
    /**
     * MÉTHODE ORIGINALE - Génère un quiz personnalisé
     */
    @Transactional
    public QuizResponseDTO generatePersonalizedQuiz(Long userId, String topic) {
        log.info("🚀 Génération quiz personnalisé pour userId: {}, topic: {}", userId, topic);
        
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            LearningProfile profile = learningProfileRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultProfile(user));
            
            String prompt = ragQuizGenerationService.buildRAGPrompt(
                topic,
                Collections.emptyList(),
                profile.getProficiencyLevel(),
                profile.getInterests()
            );
            
            // CHANGEMENT: 20 questions au lieu de 5
            return ragQuizGenerationService.generateQuizFromRAGPrompt(
                prompt,
                "Quiz: " + topic,
                20
            );
            
        } catch (Exception e) {
            log.error("❌ Erreur génération quiz: {}", e.getMessage());
            throw new RuntimeException("Erreur: " + e.getMessage());
        }
    }
    
    /**
     * Mise à jour du profil
     */
    @Transactional
    public void updateLearningProfile(Long userId, Double score, String topic) {
        try {
            LearningProfile profile = learningProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
                    return createDefaultProfile(user);
                });
            
            if (score < 60.0) {
                if (profile.getWeaknesses() == null) {
                    profile.setWeaknesses(new ArrayList<>());
                }
                if (!profile.getWeaknesses().contains(topic)) {
                    profile.getWeaknesses().add(topic);
                }
            }
            
            learningProfileRepository.save(profile);
            log.debug("📊 Profil mis à jour - userId: {}, score: {}, topic: {}", userId, score, topic);
        } catch (Exception e) {
            log.warn("⚠️ Erreur mise à jour profil: {}", e.getMessage());
        }
    }
    
    /**
     * Diagnostic du système RAG
     */
    public Map<String, Object> getSystemDiagnostic() {
        Map<String, Object> diagnostic = new HashMap<>();
        
        try {
            diagnostic.put("ragQuizGenerationService", ragQuizGenerationService != null ? "✅ Disponible" : "❌ Absent");
            diagnostic.put("ollamaService", ollamaService != null ? "✅ Disponible" : "❌ Absent");
            
            // Tester la disponibilité du service AI (Gemini)
            boolean aiAvailable = false;
            try {
                String testResponse = ollamaService.generateText("test");
                aiAvailable = testResponse != null && !testResponse.toLowerCase().contains("erreur");
            } catch (Exception e) {
                aiAvailable = false;
            }
            diagnostic.put("aiServiceAvailable", aiAvailable);
            diagnostic.put("aiService", "Gemini");
            
            // Test PDFBox
            try {
                Class.forName("org.apache.pdfbox.pdmodel.PDDocument");
                diagnostic.put("pdfBox", "✅ Disponible (version 3.0.2)");
            } catch (ClassNotFoundException e) {
                diagnostic.put("pdfBox", "❌ Absent - Ajouter dépendance PDFBox");
            }
            
            diagnostic.put("success", true);
            diagnostic.put("timestamp", LocalDateTime.now().toString());
            
        } catch (Exception e) {
            diagnostic.put("success", false);
            diagnostic.put("error", e.getMessage());
        }
        
        return diagnostic;
    }
    
    /**
     * Recommande le prochain quiz
     */
    public QuizRecommendation recommendNextQuiz(Long userId) {
        log.info("Recommandation prochain quiz pour userId: {}", userId);
        
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            LearningProfile profile = learningProfileRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultProfile(user));
            
            List<QuizRecommendation> pendingRecs = quizRecommendationRepository
                .findPendingRecommendationsByUserId(userId);
            
            if (!pendingRecs.isEmpty()) {
                QuizRecommendation bestPending = pendingRecs.stream()
                    .max((r1, r2) -> Double.compare(r1.getConfidenceScore(), r2.getConfidenceScore()))
                    .orElse(pendingRecs.get(0));
                
                log.info("✅ Recommandation en attente trouvée: {} (confiance: {})", 
                        bestPending.getRecommendedTopic(), bestPending.getConfidenceScore());
                return bestPending;
            }
            
            String recommendedTopic;
            double confidence;
            String reason;
            
            if (profile.getWeaknesses() != null && !profile.getWeaknesses().isEmpty()) {
                recommendedTopic = profile.getWeaknesses().get(0);
                confidence = 0.8;
                reason = "Renforcement nécessaire - sujet identifié comme faible";
            } 
            else if (profile.getInterests() != null && !profile.getInterests().isEmpty()) {
                recommendedTopic = profile.getInterests().get(0);
                confidence = 0.6;
                reason = "Basé sur vos centres d'intérêt";
            }
            else {
                recommendedTopic = "Révision générale";
                confidence = 0.5;
                reason = "Révision recommandée pour maintenir les compétences";
            }
            
            QuizRecommendation recommendation = new QuizRecommendation();
            recommendation.setUser(user);
            recommendation.setRecommendedTopic(recommendedTopic);
            recommendation.setReason(reason);
            recommendation.setConfidenceScore(confidence);
            recommendation.setRecommendedAt(LocalDateTime.now());
            recommendation.setAccepted(false);
            
            QuizRecommendation savedRec = quizRecommendationRepository.save(recommendation);
            
            log.info("✅ Nouvelle recommandation créée: {} (confiance: {})", 
                    recommendedTopic, confidence);
            
            return savedRec;
            
        } catch (Exception e) {
            log.error("❌ Erreur recommandation quiz: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de la recommandation: " + e.getMessage());
        }
    }
    
    /**
     * Récupère toutes les recommandations
     */
    public List<QuizRecommendation> getRecommendations(Long userId) {
        log.info(" Récupération recommandations pour userId: {}", userId);
        
        try {
            List<QuizRecommendation> pendingRecs = quizRecommendationRepository
                .findPendingRecommendationsByUserId(userId);
            
            List<QuizRecommendation> acceptedRecs = quizRecommendationRepository
                .findAcceptedRecommendationsByUserId(userId);
            
            List<QuizRecommendation> allRecommendations = new ArrayList<>();
            
            pendingRecs.sort((r1, r2) -> Double.compare(r2.getConfidenceScore(), r1.getConfidenceScore()));
            allRecommendations.addAll(pendingRecs);
            
            acceptedRecs.sort((r1, r2) -> {
                if (r1.getAcceptedAt() == null && r2.getAcceptedAt() == null) return 0;
                if (r1.getAcceptedAt() == null) return 1;
                if (r2.getAcceptedAt() == null) return -1;
                return r2.getAcceptedAt().compareTo(r1.getAcceptedAt());
            });
            allRecommendations.addAll(acceptedRecs);
            
            if (allRecommendations.size() < 2) {
                QuizRecommendation newRec = recommendNextQuiz(userId);
                allRecommendations.add(0, newRec);
            }
            
            List<QuizRecommendation> finalList = allRecommendations.stream()
                .limit(8)
                .collect(Collectors.toList());
            
            log.info("{} recommandations récupérées ({} en attente, {} acceptées)", 
                    finalList.size(), pendingRecs.size(), acceptedRecs.size());
            
            return finalList;
            
        } catch (Exception e) {
            log.error(" Erreur récupération recommandations: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
    
    /**
     * Vérifie les fichiers d'un cours (debug)
     */
    public Map<String, Object> checkCourseFiles(Long courseId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            List<CourseFile> files = courseFileRepository.findByCourseId(courseId);
            
            List<Map<String, Object>> fileDetails = new ArrayList<>();
            for (CourseFile file : files) {
                Map<String, Object> detail = new HashMap<>();
                detail.put("id", file.getId());
                detail.put("name", file.getFileName());
                detail.put("type", file.getFileType());
                detail.put("size", file.getFileSize());
                detail.put("path", file.getFilePath());
                detail.put("exists", checkFileExists(file.getFilePath()));
                
                // Extraire un peu de contenu pour vérification
                if (checkFileExists(file.getFilePath())) {
                    String content = extractFileContent(file);
                    detail.put("contentLength", content != null ? content.length() : 0);
                    if (content != null && content.length() > 0) {
                        detail.put("contentPreview", content.substring(0, Math.min(100, content.length())));
                    }
                }
                
                fileDetails.add(detail);
            }
            
            result.put("courseId", courseId);
            result.put("fileCount", files.size());
            result.put("files", fileDetails);
            result.put("success", true);
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Vérifie si un fichier existe
     */
    private boolean checkFileExists(String filePath) {
        if (filePath == null || filePath.isEmpty()) return false;
        try {
            return Files.exists(Paths.get(filePath));
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * MÉTHODE DE DEBUG - Teste l'accès aux fichiers d'un cours
     */
    public Map<String, Object> testFileAccess(Long courseId) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> fileTests = new ArrayList<>();
        
        log.info(" TEST ACCÈS FICHIERS - courseId: {}", courseId);
        
        try {
            // 1. Récupérer les fichiers du cours
            List<CourseFile> files = courseFileRepository.findByCourseId(courseId);
            log.info(" {} fichier(s) trouvé(s) en base", files.size());
            
            for (CourseFile file : files) {
                Map<String, Object> testResult = new HashMap<>();
                testResult.put("fileName", file.getFileName());
                testResult.put("fileType", file.getFileType());
                testResult.put("fileSize", file.getFileSize());
                testResult.put("dbFilePath", file.getFilePath());
                
                // 2. Vérifier si le chemin existe
                if (file.getFilePath() == null || file.getFilePath().isEmpty()) {
                    testResult.put("status", " ERREUR: Chemin vide en base");
                    testResult.put("exists", false);
                } else {
                    Path filePath = Paths.get(file.getFilePath());
                    
                    // Vérifier existence
                    boolean exists = Files.exists(filePath);
                    testResult.put("exists", exists);
                    testResult.put("absolutePath", filePath.toAbsolutePath().toString());
                    
                    if (exists) {
                        testResult.put("status", "FICHIER TROUVÉ");
                        
                        // Tenter de lire le fichier
                        try {
                            if (file.getFileType() != null && file.getFileType().toLowerCase().contains("pdf")) {
                                // Test PDFBox
                                String pdfTest = testPDFExtraction(filePath);
                                testResult.put("pdfTest", pdfTest);
                            } else {
                                // Test lecture texte
                                String content = Files.readString(filePath);
                                testResult.put("contentLength", content.length());
                                testResult.put("contentPreview", 
                                    content.substring(0, Math.min(200, content.length())) + "...");
                            }
                        } catch (Exception e) {
                            testResult.put("readError", e.getMessage());
                            testResult.put("status", " Fichier trouvé mais erreur lecture");
                        }
                    } else {
                        testResult.put("status", " FICHIER NON TROUVÉ SUR DISQUE");
                        
                        // Chercher dans d'autres emplacements
                        List<String> foundPaths = searchFileInCommonLocations(file.getFileName());
                        testResult.put("alternativeSearches", foundPaths);
                    }
                }
                
                fileTests.add(testResult);
                log.info(" Test {}: {} - {}", 
                    file.getFileName(), 
                    testResult.get("status"),
                    testResult.get("absolutePath"));
            }
            
            result.put("courseId", courseId);
            result.put("totalFiles", files.size());
            result.put("fileTests", fileTests);
            result.put("timestamp", LocalDateTime.now().toString());
            result.put("success", true);
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
            log.error(" Erreur test fichiers: {}", e.getMessage(), e);
        }
        
        return result;
    }

    /**
     * Teste l'extraction PDFBox
     */
    private String testPDFExtraction(Path filePath) {
        try (PDDocument document = Loader.loadPDF(filePath.toFile())) {
            int pageCount = document.getNumberOfPages();
            boolean encrypted = document.isEncrypted();
            
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setStartPage(1);
            stripper.setEndPage(Math.min(pageCount, 1)); // Juste la première page
            
            String text = stripper.getText(document);
            text = cleanExtractedText(text);
            
            return String.format(
                "PDF OK - Pages: %d, Chiffré: %s, Caractères page 1: %d, Extrait: %s...",
                pageCount, encrypted, text.length(),
                text.substring(0, Math.min(100, text.length()))
            );
            
        } catch (IOException e) {
            return " Erreur PDFBox: " + e.getMessage();
        } catch (Exception e) {
            return " Erreur inattendue: " + e.getMessage();
        }
    }

    /**
     * Cherche le fichier dans des emplacements communs
     */
    private List<String> searchFileInCommonLocations(String fileName) {
        List<String> foundPaths = new ArrayList<>();
        
        try {
            log.info(" Recherche fichier '{}' dans emplacements communs...", fileName);
            
            // 1. Répertoire uploads standard
            String[] commonDirs = {
                "uploads",
                "uploads/courses",
                "uploads/files",
                "upload",
                "files",
                "documents",
                "data",
                "src/main/resources/static",
                "src/main/resources/uploads",
                System.getProperty("user.dir") + "/uploads"
            };
            
            for (String dir : commonDirs) {
                Path dirPath = Paths.get(dir);
                if (Files.exists(dirPath) && Files.isDirectory(dirPath)) {
                    Path filePath = dirPath.resolve(fileName);
                    if (Files.exists(filePath)) {
                        foundPaths.add(" TROUVÉ dans: " + filePath.toAbsolutePath());
                        log.info("    Trouvé dans: {}", dir);
                    }
                }
            }
            
            // 2. Chercher avec UUID (comme e0ac59a2-2063-4d2d-9cb3-9856b9461573.pdf)
            // Chercher tous les PDF dans uploads
            Path uploadsDir = Paths.get("uploads");
            if (Files.exists(uploadsDir) && Files.isDirectory(uploadsDir)) {
                try (var stream = Files.list(uploadsDir)) {
                    List<Path> pdfFiles = stream
                        .filter(path -> path.toString().toLowerCase().endsWith(".pdf"))
                        .collect(Collectors.toList());
                    
                    for (Path pdf : pdfFiles) {
                        if (pdf.getFileName().toString().toLowerCase().contains(fileName.toLowerCase().replace(".pdf", ""))) {
                            foundPaths.add(" PDF similaire: " + pdf.toAbsolutePath());
                        }
                    }
                }
            }
            
            // 3. Chercher dans tout le répertoire du projet (attention: lent)
            if (foundPaths.isEmpty()) {
                log.info(" Recherche approfondie dans le projet...");
                foundPaths.addAll(searchFileRecursively(new File("."), fileName));
            }
            
        } catch (Exception e) {
            log.warn(" Erreur recherche fichiers: {}", e.getMessage());
        }
        
        if (foundPaths.isEmpty()) {
            foundPaths.add(" AUCUNE occurrence trouvée nulle part");
        }
        
        return foundPaths;
    }

    /**
     * Recherche récursive
     */
    private List<String> searchFileRecursively(File directory, String fileName) {
        List<String> found = new ArrayList<>();
        
        try {
            File[] files = directory.listFiles();
            if (files != null) {
                for (File file : files) {
                    if (file.isDirectory()) {
                        // Éviter node_modules et autres gros répertoires
                        if (!file.getName().equals("node_modules") && 
                            !file.getName().equals("target") &&
                            !file.getName().equals(".git")) {
                            found.addAll(searchFileRecursively(file, fileName));
                        }
                    } else if (file.getName().equalsIgnoreCase(fileName)) {
                        found.add(" TROUVÉ récursif: " + file.getAbsolutePath());
                    }
                }
            }
        } catch (Exception e) {
            // Ignorer
        }
        
        return found;
    }
    
    /**
     * NOUVELLE MÉTHODE: Test simple pour vérifier la génération de questions
     */
    public String testQuestionGeneration(String content) {
        log.info(" Test génération de questions");
        
        String testPrompt = """
            CONTENU: %s
            
            Génère 20 questions QCM basées sur ce contenu.
            
            Format JSON:
            {
              "questions": [
                {
                  "text": "QUESTION_TEXT",
                  "type": "SINGLE_CHOICE",
                  "options": ["OPTION_1", "OPTION_2", "OPTION_3", "OPTION_4"],
                  "correctAnswer": "CORRECT_OPTION",
                  "explanation": "EXPLANATION"
                }
              ]
            }
            
            Remplacer les placeholders par du vrai contenu basé sur le texte fourni.
            """.formatted(content.substring(0, Math.min(500, content.length())));
        
        return ollamaService.generateRawResponse(testPrompt);
    }
    
    /**
     * Vérifie la disponibilité du service AI (Gemini)
     */
    public boolean isAIServiceAvailable() {
        try {
            String testResponse = ollamaService.generateText("test");
            return testResponse != null && !testResponse.toLowerCase().contains("erreur");
        } catch (Exception e) {
            log.warn("Service AI non disponible: {}", e.getMessage());
            return false;
        }
    }
}
```

---

## <span style="color:#0d47a1;">VectorRAGService<span>

Le service **`VectorRAGService`** gère la recherche avancée dans la base de connaissances SmartHub en utilisant **Gemini AI**. Il combine recherche vectorielle, hybride et sémantique avec gestion des embeddings et scoring intelligent.

### <span style="color:#0d47a1;">Fonctionnalités principales<span>

- **Recherche vectorielle** :  
  Recherche de documents proches d’une requête via embeddings Gemini et calcul de similarité cosinus.

- **Recherche hybride** :  
  Combine recherche textuelle et vectorielle, avec bonus pour intérêts utilisateur et popularité des documents.

- **Mise à jour des embeddings** :  
  Méthode pour recalculer tous les embeddings Gemini et mettre à jour les documents.

- **Recherche sémantique avancée** :  
  Filtrage par seuil de similarité et tri par pertinence pour extraire les documents les plus proches.

- **Tests et statistiques** :  
  Vérification de la connexion AI et statistiques sur la base de connaissances (nombre total de documents, embeddings disponibles, etc.).

### <span style="color:#0d47a1;">Méthodes principales<span>

| Méthode | Description |
|---------|-------------|
| `findVectorRelevantContent(String query, LearningProfile profile, int limit)` | Recherche vectorielle Gemini et scoring avec bonus intérêts et popularité. |
| `findHybridRelevantContent(String query, LearningProfile profile)` | Recherche textuelle + vectorielle et ajout par tags d’intérêts si nécessaire. |
| `findSemanticRelevantContent(String query, LearningProfile profile, double similarityThreshold)` | Recherche sémantique avancée filtrée par seuil de similarité. |
| `updateAllEmbeddings()` | Met à jour les embeddings Gemini pour tous les documents. |
| `testVectorSearch(String testQuery)` | Test complet de la recherche vectorielle pour une requête spécifique. |
| `getStats()` | Retourne les statistiques de la base et état du service AI. |

### <span style="color:#0d47a1;">Notes techniques<span>

- Les **bonus de similarité** :  
  - +15% si le document contient un tag correspondant aux intérêts de l’utilisateur.  
  - +5% si le document est populaire (usageCount > 10).  
- La **limite des résultats** est gérée pour chaque méthode (max 5 ou 10 selon le contexte).  
- La **connexion à Gemini AI** est vérifiée avant chaque utilisation critique.  
- Logging détaillé avec **Slf4j** pour audit et debug.  
- Évite les doublons lors des recherches hybrides.  

### <span style="color:#0d47a1;">Exemple d'utilisation</span>

```java
@Autowired
private VectorRAGService vectorRAGService;

List<KnowledgeBase> results = vectorRAGService.findHybridRelevantContent("apprentissage automatique", userProfile);
results.forEach(doc -> System.out.println(doc.getTitle()));
```

---

# <span style="color:#0d47a1;">VectorRAGService</span>

Le service **`VectorRAGService`** gère la recherche avancée dans la base de connaissances SmartHub en utilisant **Gemini AI**. Il combine recherche vectorielle, hybride et sémantique avec gestion des embeddings et scoring intelligent.

---

### <span style="color:#0d47a1;">Explication du VectorRAGService</span>

Le service **`VectorRAGService`** est responsable de la recherche intelligente dans la base de connaissances **SmartHub**.  
Il combine des **recherches vectorielles** basées sur embeddings AI et des **recherches textuelles** pour fournir des contenus pertinents selon les intérêts et le profil de l’utilisateur.

---

### <span style="color:#0d47a1;">Fonctionnalités principales</span>

- **Recherche vectorielle** : calcule la similarité entre la requête utilisateur et les documents à l’aide d’embeddings Gemini  
- **Recherche hybride** : combine résultats textuels et vectoriels pour enrichir les réponses  
- **Recherche sémantique** : filtre les documents selon un seuil de similarité avancé  
- **Mise à jour des embeddings** : régénère les embeddings pour tous les documents existants  
- **Statistiques** : fournit des informations sur le nombre de documents, la couverture des embeddings et l’état du service AI  

---

### <span style="color:#0d47a1;">Méthodes principales</span>

| Méthode | Description |
|---------|-------------|
| `findVectorRelevantContent` | Recherche vectorielle selon embeddings et intérêts de l’utilisateur |
| `findHybridRelevantContent` | Recherche combinée textuelle + vectorielle |
| `findSemanticRelevantContent` | Recherche sémantique avec seuil de similarité |
| `updateAllEmbeddings` | Met à jour tous les embeddings des documents |
| `testVectorSearch` | Teste la recherche vectorielle et retourne des infos de debug |
| `getStats` | Retourne des statistiques sur les documents et le service AI |

---

### <span style="color:#0d47a1;">Notes techniques</span>

- **Embeddings** :
  - Générés via le service `EmbeddingService`
  - Utilisés pour les recherches vectorielles et sémantiques
- **Profil utilisateur** :
  - Les intérêts de l’utilisateur donnent un **bonus de similarité** aux documents correspondants
- **Logging** :
  - Chaque étape de recherche et mise à jour est loggée avec **Slf4j**
- **Performance** :
  - Limite le nombre de résultats retournés (`limit`)
  - Évite les doublons dans les résultats combinés
- **Fiabilité** :
  - Gestion des erreurs pour les embeddings manquants ou requêtes vides

---

### <span style="color:#0d47a1;">UserInteractionService</span>

Le service **`UserInteractionService`** gère le suivi et l’analyse des interactions des utilisateurs dans **SmartHub**.  
Il permet de **suivre toutes les actions** des utilisateurs (cours, projets, quiz) et fournit des **recommandations personnalisées**, statistiques et patterns comportementaux.

---

### <span style="color:#0d47a1;">Fonctionnalités principales</span>

- **Tracking des actions** : view, like, bookmark, complete, enroll, search…  
- **Historique utilisateur** : récupère les interactions récentes ou filtrées par type et ressource  
- **Recommandations** : propose des ressources populaires et pertinentes selon les utilisateurs similaires  
- **Statistiques** : nombre d’interactions, popularité d’une ressource  
- **Analyse comportementale** : patterns sur les actions des utilisateurs  

---

### <span style="color:#0d47a1;">Méthodes principales</span>

| Méthode | Description |
|---------|-------------|
| `trackView` | Enregistre la consultation d’une ressource |
| `trackViewDetails` | Enregistre la consultation détaillée d’une ressource |
| `trackLike` | Enregistre un like |
| `trackBookmark` | Enregistre un bookmark |
| `trackComplete` | Enregistre la complétion d’une ressource |
| `trackEnroll` | Enregistre l’inscription à une ressource |
| `trackSearch` | Enregistre une recherche et la ressource retournée |
| `getUserRecentInteractions` | Récupère les interactions récentes d’un utilisateur sur X jours |
| `getUserInteractionsByType` | Récupère les interactions filtrées par type et ressource |
| `getRecommendedResources` | Retourne des ressources recommandées selon interactions similaires |
| `getInteractionCount` | Nombre d’interactions pour un type donné |
| `getResourcePopularity` | Popularité d’une ressource selon type d’interaction |
| `getUserBehaviorPatterns` | Analyse les patterns comportementaux de l’utilisateur |

---

### <span style="color:#0d47a1;">Notes techniques</span>

- **Transactional** :
  - Méthodes de tracking : transaction classique
  - Méthodes de lecture : `@Transactional(readOnly = true)` pour optimiser les requêtes
- **Logging** : chaque interaction trackée est loggée avec **Slf4j**
- **Création des interactions** :
  - Vérifie l’existence de l’utilisateur
  - Associe ressource, type et utilisateur
- **Recommandations** :
  - Identifie utilisateurs similaires sur le dernier mois
  - Sélectionne ressources populaires non consultées
  - Limite à 10 ressources
- **Statistiques et analyse** :
  - Nombre d’interactions par type
  - Popularité d’une ressource
  - Patterns comportementaux sur 3 derniers mois


### <span style="color:#0d47a1;">Code complet - VectorRAGService</span>

```java
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
        log.info(" Recherche vectorielle Gemini pour: '{}'", query);
        float[] queryEmbedding = embeddingService.generateEmbedding(query);
        if (queryEmbedding.length == 0) {
            log.warn(" Impossible de générer l'embedding Gemini pour la requête");
            return Collections.emptyList();
        }
        List<KnowledgeBase> vectorResults = knowledgeBaseRepository.findSimilarByEmbedding(queryEmbedding, limit * 2);
        Map<KnowledgeBase, Double> scoredResults = new HashMap<>();
        for (KnowledgeBase doc : vectorResults) {
            if (doc.getEmbedding() != null && doc.getEmbedding().length > 0) {
                double similarity = embeddingService.cosineSimilarity(queryEmbedding, doc.getEmbedding());
                if (profile != null && profile.getInterests() != null && doc.getTags() != null) {
                    for (String interest : profile.getInterests()) {
                        if (doc.getTags().contains(interest)) similarity += 0.15;
                    }
                }
                if (doc.getUsageCount() != null && doc.getUsageCount() > 10) similarity += 0.05;
                scoredResults.put(doc, similarity);
            }
        }
        List<KnowledgeBase> results = scoredResults.entrySet().stream()
                .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                .limit(limit)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        return results;
    }

    public List<KnowledgeBase> findHybridRelevantContent(String query, LearningProfile profile) {
        List<KnowledgeBase> results = new ArrayList<>();
        List<KnowledgeBase> textResults = knowledgeBaseRepository.searchByKeyword(query);
        results.addAll(textResults);

        if (results.size() < 3) {
            int vectorLimit = 5 - results.size();
            List<KnowledgeBase> vectorResults = findVectorRelevantContent(query, profile, vectorLimit);
            Set<Long> existingIds = results.stream().map(KnowledgeBase::getId).collect(Collectors.toSet());
            for (KnowledgeBase vectorDoc : vectorResults) {
                if (!existingIds.contains(vectorDoc.getId())) results.add(vectorDoc);
            }
        }

        if (results.size() < 2 && profile != null && profile.getInterests() != null) {
            for (String interest : profile.getInterests()) {
                if (results.size() >= 5) break;
                List<KnowledgeBase> interestResults = knowledgeBaseRepository.findByTag(interest);
                for (KnowledgeBase doc : interestResults) {
                    if (results.size() >= 5) break;
                    if (!results.contains(doc)) results.add(doc);
                }
            }
        }

        return results.stream().limit(5).collect(Collectors.toList());
    }

    public String getStats() {
        long total = knowledgeBaseRepository.count();
        long withEmbedding = knowledgeBaseRepository.countWithEmbedding();
        double percentage = total > 0 ? (withEmbedding * 100.0 / total) : 0;
        boolean aiConnected = embeddingService.testAIConnection();
        return String.format(
            " Statistiques Vector RAG avec Gemini:\n- Documents totaux: %d\n- Documents avec embedding: %d (%.1f%%)\n- Service d'embedding: %s\n- Modèle AI: Gemini",
            total, withEmbedding, percentage,
            aiConnected ? "Connecté" : "Déconnecté"
        );
    }
}


# <span style="color:#0d47a1;">UserInteractionService - Code Complet</span>

```java
package com.iatd.smarthub.service;

import com.iatd.smarthub.model.interaction.UserInteraction;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.UserInteractionRepository;
import com.iatd.smarthub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class UserInteractionService {

    private final UserInteractionRepository userInteractionRepository;
    private final UserRepository userRepository;

    // === MÉTHODES DE TRACKING SIMPLES ===
    
    public void trackView(Long userId, UserInteraction.ResourceType resourceType, Long resourceId) {
        trackInteraction(userId, resourceType, resourceId, UserInteraction.InteractionType.VIEW);
    }

    public void trackViewDetails(Long userId, UserInteraction.ResourceType resourceType, Long resourceId) {
        trackInteraction(userId, resourceType, resourceId, UserInteraction.InteractionType.VIEW_DETAILS);
    }

    public void trackLike(Long userId, UserInteraction.ResourceType resourceType, Long resourceId) {
        trackInteraction(userId, resourceType, resourceId, UserInteraction.InteractionType.LIKE);
    }

    public void trackBookmark(Long userId, UserInteraction.ResourceType resourceType, Long resourceId) {
        trackInteraction(userId, resourceType, resourceId, UserInteraction.InteractionType.BOOKMARK);
    }

    public void trackComplete(Long userId, UserInteraction.ResourceType resourceType, Long resourceId) {
        trackInteraction(userId, resourceType, resourceId, UserInteraction.InteractionType.COMPLETE);
    }

    public void trackEnroll(Long userId, UserInteraction.ResourceType resourceType, Long resourceId) {
        trackInteraction(userId, resourceType, resourceId, UserInteraction.InteractionType.ENROLL);
    }

    public void trackSearch(Long userId, String searchQuery, Long resultResourceId, UserInteraction.ResourceType resourceType) {
        UserInteraction interaction = createInteraction(userId, resourceType, resultResourceId, UserInteraction.InteractionType.SEARCH);
        interaction.setSearchQuery(searchQuery);
        userInteractionRepository.save(interaction);
        log.debug("Tracked search interaction: user={}, query={}, resource={}", userId, searchQuery, resultResourceId);
    }

    // === MÉTHODE GÉNÉRIQUE ===
    
    public void trackInteraction(Long userId, UserInteraction.ResourceType resourceType, Long resourceId, UserInteraction.InteractionType interactionType) {
        UserInteraction interaction = createInteraction(userId, resourceType, resourceId, interactionType);
        userInteractionRepository.save(interaction);
        log.debug("Tracked interaction: user={}, type={}, resource={}, action={}", 
                 userId, resourceType, resourceId, interactionType);
    }

    private UserInteraction createInteraction(Long userId, UserInteraction.ResourceType resourceType, Long resourceId, UserInteraction.InteractionType interactionType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        UserInteraction interaction = new UserInteraction();
        interaction.setUser(user);
        interaction.setResourceType(resourceType);
        interaction.setResourceId(resourceId);
        interaction.setInteractionType(interactionType);
        
        return interaction;
    }

    // === MÉTHODES DE RÉCUPÉRATION ===
    
    @Transactional(readOnly = true)
    public List<UserInteraction> getUserRecentInteractions(Long userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return userInteractionRepository.findRecentInteractionsByUser(userId, since);
    }

    @Transactional(readOnly = true)
    public List<UserInteraction> getUserInteractionsByType(Long userId, UserInteraction.ResourceType resourceType, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return userInteractionRepository.findRecentInteractionsByUserAndResourceType(userId, resourceType, since);
    }

    // === MÉTHODES POUR LES RECOMMANDATIONS ===
    
    @Transactional(readOnly = true)
    public List<Long> getRecommendedResources(Long userId, UserInteraction.ResourceType resourceType) {
        LocalDateTime since = LocalDateTime.now().minusMonths(1);
        
        List<Long> similarUsers = userInteractionRepository.findSimilarUsers(userId, since);
        
        List<UserInteraction.InteractionType> positiveInteractions = List.of(
            UserInteraction.InteractionType.LIKE,
            UserInteraction.InteractionType.BOOKMARK,
            UserInteraction.InteractionType.COMPLETE,
            UserInteraction.InteractionType.VIEW_DETAILS
        );
        
        List<Object[]> popularResources = userInteractionRepository.findPopularResources(
            resourceType, positiveInteractions, since);
        
        List<Long> userInteractedResources = getUserInteractionsByType(userId, resourceType, 30)
                .stream()
                .map(UserInteraction::getResourceId)
                .collect(Collectors.toList());
        
        return popularResources.stream()
                .map(obj -> (Long) obj[0])
                .filter(resourceId -> !userInteractedResources.contains(resourceId))
                .limit(10)
                .collect(Collectors.toList());
    }

    // === STATISTIQUES ===
    
    @Transactional(readOnly = true)
    public Long getInteractionCount(Long userId, UserInteraction.ResourceType resourceType, UserInteraction.InteractionType interactionType) {
        return userInteractionRepository.countByUser_IdAndResourceTypeAndInteractionType(userId, resourceType, interactionType);
    }

    @Transactional(readOnly = true)
    public Long getResourcePopularity(UserInteraction.ResourceType resourceType, Long resourceId, UserInteraction.InteractionType interactionType) {
        return userInteractionRepository.countByResourceTypeAndResourceIdAndInteractionType(resourceType, resourceId, interactionType);
    }

    // === ANALYSE COMPORTEMENTALE ===
    
    @Transactional(readOnly = true)
    public List<Object[]> getUserBehaviorPatterns(Long userId) {
        LocalDateTime since = LocalDateTime.now().minusMonths(3);
        return userInteractionRepository.getUserInteractionPatterns(userId, since);
    }
}

---

## <span style="color:#0d47a1;">Description générale</span>

Le service **`StatsService`** fournit des statistiques administratives et des données pour le tableau de bord de la plateforme **SmartHub**.  

Il permet de suivre :

- Le nombre total d’utilisateurs, cours, projets, annonces, stages, ressources, quiz et tentatives de quiz.
- Les utilisateurs actifs et la répartition par rôle (étudiants, enseignants, admins).
- Les statistiques récentes sur les 7 derniers jours.
- Les activités récentes des utilisateurs.

---

## <span style="color:#0d47a1;">Packages utilisés</span>

| Package | Utilisation |
|---------|------------|
| `com.iatd.smarthub.model.user.User` | Pour gérer les rôles et informations des utilisateurs. |
| `com.iatd.smarthub.repository.*` | Pour accéder aux données de toutes les entités : User, Course, Project, Quiz, etc. |
| `java.time.LocalDateTime` | Pour filtrer les statistiques récentes. |
| `java.util.*` | Pour stocker et manipuler les statistiques sous forme de Map et List. |

---

## <span style="color:#0d47a1;">Méthodes principales</span>

| Méthode | Description détaillée |
|---------|----------------------|
| `getAdminStats()` | Récupère toutes les statistiques globales pour l’administration. Comprend le nombre total de ressources, la répartition par rôle et les activités récentes. Gère également les erreurs et renvoie des valeurs par défaut si nécessaire. |
| `getDashboardStats()` | Prépare des statistiques pour le tableau de bord. Actuellement implémentée comme un squelette (`Map` vide) à compléter selon les besoins spécifiques du dashboard. |
| `getRecentActivities()` | Génère une liste simulée des activités récentes des utilisateurs avec titre, description, utilisateur et timestamp. Utilisée dans `getAdminStats()`. |
| `getDefaultStats()` | Fournit des valeurs par défaut pour toutes les statistiques en cas d’erreur ou de données manquantes. Assure que l’interface admin ne plante pas. |

---

## <span style="color:#0d47a1;">Explication des champs et interactions</span>

| Champ / Dépendance | Description |
|-------------------|------------|
| `userRepository` | Permet de compter les utilisateurs, filtrer par rôle et récupérer les utilisateurs actifs. |
| `courseRepository` | Permet de compter les cours. |
| `projectRepository` | Permet de compter les projets et nouveaux projets sur 7 jours. |
| `announcementRepository` | Permet de compter les annonces publiées. |
| `internshipRepository` | Permet de compter les stages proposés. |
| `resourceRepository` | Permet de compter les ressources disponibles. |
| `quizRepository` | Permet de compter les quiz créés. |
| `quizAttemptRepository` | Permet de compter toutes les tentatives de quiz et celles sur les 7 derniers jours. |

---

## <span style="color:#0d47a1;">Fonctionnement de `getAdminStats()`</span>

1. **Statistiques globales** : Comptage de toutes les entités (users, courses, projects, etc.) avec gestion des exceptions.  
2. **Utilisateurs actifs** : Comptage via `userRepository.countActiveUsers()`.  
3. **Répartition par rôle** : Comptage des étudiants, enseignants et admins via `User.Role`.  
4. **Statistiques sur 7 jours** : Comptage des nouveaux utilisateurs, projets et tentatives de quiz créés dans les 7 derniers jours.  
5. **Activités récentes** : Récupération via `getRecentActivities()`.  
6. **Gestion des erreurs** : Retourne un Map de valeurs par défaut en cas de problème.

---

## <span style="color:#0d47a1;">Exemple de données renvoyées par `getAdminStats()`</span>

| Statistique | Exemple de valeur |
|------------|----------------|
| `users` | 120 |
| `courses` | 15 |
| `projects` | 40 |
| `announcements` | 5 |
| `internships` | 7 |
| `resources` | 80 |
| `quizzes` | 12 |
| `quizAttempts` | 300 |
| `activeUsers` | 95 |
| `students` | 80 |
| `teachers` | 30 |
| `admins` | 5 |
| `newUsers7d` | 4 |
| `quizAttempts7d` | 25 |
| `newProjects7d` | 2 |
| `recentActivities` | Liste avec titre, description, user et timestamp |

---

## <span style="color:#0d47a1;">Résumé</span>

Le service **`StatsService`** centralise toutes les statistiques nécessaires pour l’administration et le suivi de la plateforme.  
Il est structuré pour :

- Être facilement extensible pour d’autres statistiques ou filtres.
- Gérer les erreurs sans planter l’application.
- Fournir des données utilisables directement dans le dashboard et pour l’analyse.

---


# <span style="color:#0d47a1;">StatsService - Code Complet</span>

```java
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
            
            // Distribution par rôle
            try {
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

---

# <span style="color:#0d47a1;">ResourceService - Explications détaillées</span>

Le service **`ResourceService`** gère la gestion complète des **ressources** dans la plateforme SmartHub.  
Il permet de **créer, récupérer, mettre à jour, supprimer et rechercher** des ressources tout en gérant les fichiers attachés et les auteurs.

---

## <span style="color:#0d47a1;">Fonctionnalités principales</span>

| Fonctionnalité | Description |
|----------------|-------------|
| Création de ressource | Permet à un utilisateur connecté de créer une ressource, d’ajouter des fichiers et de lier plusieurs auteurs. |
| Récupération de ressource | Permet de récupérer toutes les ressources, une ressource spécifique par ID, ou par auteur et type. |
| Mise à jour de ressource | Permet à un auteur ou à un administrateur de modifier les informations d’une ressource, y compris le fichier associé. |
| Suppression de ressource | Permet à un auteur ou à un administrateur de supprimer une ressource et le fichier physique associé. |
| Conversion en DTO | Transforme l’objet `Resource` en `ResourceResponseDTO` pour renvoyer des données propres à l’API. |
| Recherche de ressource | Recherche les ressources par titre ou abstract pour fournir une fonctionnalité de recherche utilisateur. |

---

## <span style="color:#0d47a1;">Méthodes principales et rôle</span>

| Méthode | Paramètres | Rôle | Importance |
|---------|-----------|------|------------|
| `createResource` | `ResourceRequestDTO resourceRequest`, `String username` | Crée une nouvelle ressource, gère les auteurs et le fichier attaché. | Permet la contribution des utilisateurs et la centralisation des contenus pédagogiques. |
| `getAllResources` | Aucun | Récupère toutes les ressources avec leurs auteurs. | Fournit la liste complète pour l’affichage sur le dashboard ou les pages de ressources. |
| `getResourceById` | `Long id` | Récupère une ressource spécifique par son ID. | Essentiel pour consulter les détails d’une ressource ou l’afficher individuellement. |
| `getResourcesByAuthorUsername` | `String username` | Récupère toutes les ressources créées par un auteur spécifique. | Permet de filtrer les contenus par créateur et de gérer les contributions. |
| `getResourcesByAuthor` | `Long authorId` | Récupère les ressources par ID d’auteur (ancienne méthode). | Maintient la compatibilité avec l’existant. |
| `getResourcesByType` | `Resource.ResourceType type` | Récupère toutes les ressources d’un certain type. | Filtrage pour organiser les contenus par type (cours, projet, etc.). |
| `searchResources` | `String query` | Recherche des ressources par titre ou abstract. | Fonctionnalité clé pour navigation et recherche utilisateur. |
| `updateResource` | `Long id`, `ResourceRequestDTO resourceDetails`, `String username` | Met à jour une ressource après vérification de la propriété ou du rôle admin. | Garantit la sécurité et l’intégrité des ressources. |
| `deleteResource` | `Long id`, `String username` | Supprime une ressource après vérification de la propriété ou du rôle admin et supprime le fichier associé. | Permet le nettoyage et la gestion correcte des fichiers sur le serveur. |
| `convertToDTO` | `Resource resource` | Transforme un objet `Resource` en `ResourceResponseDTO`. | Permet de renvoyer des données standardisées et sécurisées à l’API, incluant URL du fichier et auteurs. |

---

## <span style="color:#0d47a1;">Rôle et fonctionnement global</span>

1. **Création et mise à jour** : Vérifie que l’utilisateur est auteur ou admin avant de modifier ou créer des ressources.  
2. **Gestion des fichiers** : Upload et suppression des fichiers associés aux ressources, avec stockage sécurisé via `FileStorageService`.  
3. **Gestion des auteurs** : Permet d’ajouter plusieurs auteurs à une ressource, avec l’utilisateur connecté automatiquement ajouté comme auteur principal.  
4. **Récupération et recherche** : Fournit des méthodes flexibles pour récupérer toutes les ressources, par auteur, par type, ou via une recherche textuelle.  
5. **Sécurité et permissions** : Assure que seul un auteur ou admin peut modifier ou supprimer une ressource.  
6. **Conversion DTO** : Les données renvoyées aux clients sont toujours encapsulées en DTO (`ResourceResponseDTO`) pour ne pas exposer directement les entités JPA.

---

## <span style="color:#0d47a1;">Importance pour la plateforme</span>

- Permet la **gestion centralisée** des ressources pédagogiques.  
- Facilite la **collaboration** entre plusieurs auteurs sur la même ressource.  
- Assure la **sécurité et l’intégrité** des contenus grâce aux vérifications de propriété et rôle admin.  
- Permet une **navigation et recherche efficaces** pour les utilisateurs finaux.  
- Intègre la **gestion des fichiers** de manière sécurisée et pratique.  


# <span style="color:#0d47a1;">ResourceService - Gestion des Ressources</span>

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-brightgreen?logo=java&logoColor=white" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Spring_Boot-3.4.11-6DB33F?logo=spring&logoColor=white" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/PostgreSQL-13-blue?logo=postgresql&logoColor=white" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Maven-3.x-blueviolet?logo=apache-maven&logoColor=white" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-4.x-3178C6?logo=typescript&logoColor=white" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/LLM-RAG%20%26%20Agents-black?logo=openai" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Botpress-Chatbot-blue?logo=botpress" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## <span style="color:#0d47a1;">Code complet - ResourceService</span>

```java
package com.iatd.smarthub.service;

import com.iatd.smarthub.dto.ResourceRequestDTO;
import com.iatd.smarthub.dto.ResourceResponseDTO;
import com.iatd.smarthub.model.resource.Resource;
import com.iatd.smarthub.dto.UserBasicDTO;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final UserService userService;
    private final FileStorageService fileStorageService;

    // ✅ MODIFIÉ : Ajout du paramètre username pour l'auteur connecté
    public ResourceResponseDTO createResource(ResourceRequestDTO resourceRequest, String username) {
        Resource resource = new Resource();
        resource.setTitle(resourceRequest.getTitle());
        resource.setAbstractText(resourceRequest.getAbstractText());
        resource.setPublicationDate(resourceRequest.getPublicationDate());
        resource.setType(resourceRequest.getType());

        // ✅ Gérer la liste des auteurs
        List<User> authors = new ArrayList<>();
        
        // ✅ Ajouter l'utilisateur connecté comme auteur principal
        User currentUser = userService.getUserEntityByUsername(username);
        authors.add(currentUser);

        // ✅ Ajouter les auteurs supplémentaires si fournis
        if (resourceRequest.getAuthorIds() != null && !resourceRequest.getAuthorIds().isEmpty()) {
            for (Long authorId : resourceRequest.getAuthorIds()) {
                User author = userService.getUserEntityById(authorId);
                if (!authors.contains(author)) {
                    authors.add(author);
                }
            }
        }

        resource.setAuthors(authors);

        // ✅ Gérer l'upload du fichier
        if (resourceRequest.getFile() != null && !resourceRequest.getFile().isEmpty()) {
            try {
                MultipartFile file = resourceRequest.getFile();
                String storedFileName = fileStorageService.storeFile(file);
                
                resource.setOriginalFileName(file.getOriginalFilename());
                resource.setStoredFileName(storedFileName);
                resource.setFileSize(file.getSize());
                resource.setFileType(file.getContentType());
            } catch (IOException e) {
                throw new RuntimeException("Erreur lors de l'upload du fichier: " + e.getMessage());
            }
        }

        Resource savedResource = resourceRepository.save(resource);
        return convertToDTO(savedResource);
    }

    @Transactional(readOnly = true)
    public List<ResourceResponseDTO> getAllResources() {
        // ✅ Utiliser la méthode avec JOIN FETCH
        return resourceRepository.findAllWithAuthors().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<ResourceResponseDTO> getResourceById(Long id) {
        // ✅ Utiliser la méthode avec JOIN FETCH
        return resourceRepository.findByIdWithAuthors(id)
                .map(this::convertToDTO);
    }

    // ✅ NOUVEAU : Récupérer les ressources par username de l'auteur
    @Transactional(readOnly = true)
    public List<ResourceResponseDTO> getResourcesByAuthorUsername(String username) {
        User author = userService.getUserEntityByUsername(username);
        return resourceRepository.findByAuthorId(author.getId()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ✅ Garder l'ancienne méthode pour compatibilité
    @Transactional(readOnly = true)
    public List<ResourceResponseDTO> getResourcesByAuthor(Long authorId) {
        return resourceRepository.findByAuthorId(authorId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ResourceResponseDTO> getResourcesByType(Resource.ResourceType type) {
        return resourceRepository.findByType(type).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ResourceResponseDTO> searchResources(String query) {
        return resourceRepository.searchByTitleOrAbstract(query).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ✅ MODIFIÉ : Ajout de la vérification de propriété
    public ResourceResponseDTO updateResource(Long id, ResourceRequestDTO resourceDetails, String username) {
        Resource existingResource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + id));

        // ✅ Vérifier que l'utilisateur est un auteur de la ressource
        User currentUser = userService.getUserEntityByUsername(username);
        boolean isAuthor = existingResource.getAuthors().stream()
                .anyMatch(author -> author.getId().equals(currentUser.getId()));
        
        if (!isAuthor && currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Vous n'êtes pas un auteur de cette ressource");
        }

        // Mettre à jour les champs
        existingResource.setTitle(resourceDetails.getTitle());
        existingResource.setAbstractText(resourceDetails.getAbstractText());
        existingResource.setPublicationDate(resourceDetails.getPublicationDate());
        existingResource.setType(resourceDetails.getType());

        // Mettre à jour les auteurs si fournis
        if (resourceDetails.getAuthorIds() != null) {
            List<User> authors = resourceDetails.getAuthorIds().stream()
                    .map(userService::getUserEntityById)
                    .collect(Collectors.toList());
            existingResource.setAuthors(authors);
        }

        // Gérer l'upload du fichier si fourni
        if (resourceDetails.getFile() != null && !resourceDetails.getFile().isEmpty()) {
            try {
                MultipartFile file = resourceDetails.getFile();
                String storedFileName = fileStorageService.storeFile(file);
                
                existingResource.setOriginalFileName(file.getOriginalFilename());
                existingResource.setStoredFileName(storedFileName);
                existingResource.setFileSize(file.getSize());
                existingResource.setFileType(file.getContentType());
            } catch (IOException e) {
                throw new RuntimeException("Erreur lors de l'upload du fichier: " + e.getMessage());
            }
        }

        Resource updatedResource = resourceRepository.save(existingResource);
        return convertToDTO(updatedResource);
    }

    // ✅ MODIFIÉ : Ajout de la vérification de propriété
    public void deleteResource(Long id, String username) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + id));

        // ✅ Vérifier que l'utilisateur est un auteur de la ressource
        User currentUser = userService.getUserEntityByUsername(username);
        boolean isAuthor = resource.getAuthors().stream()
                .anyMatch(author -> author.getId().equals(currentUser.getId()));
        
        if (!isAuthor && currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Vous n'êtes pas un auteur de cette ressource");
        }

        // Supprimer le fichier physique si existe
        if (resource.getStoredFileName() != null) {
            try {
                fileStorageService.deleteFile(resource.getStoredFileName());
            } catch (IOException e) {
                throw new RuntimeException("Erreur lors de la suppression du fichier: " + e.getMessage());
            }
        }

        resourceRepository.delete(resource);
    }

    private ResourceResponseDTO convertToDTO(Resource resource) {
        ResourceResponseDTO dto = new ResourceResponseDTO();
        dto.setId(resource.getId());
        dto.setTitle(resource.getTitle());
        dto.setAbstractText(resource.getAbstractText());
        dto.setPublicationDate(resource.getPublicationDate());
        dto.setOriginalFileName(resource.getOriginalFileName());
        dto.setFileSize(resource.getFileSize());
        dto.setFileType(resource.getFileType());
        dto.setType(resource.getType());
        dto.setCreatedAt(resource.getCreatedAt());
        dto.setUpdatedAt(resource.getUpdatedAt());

        // ✅ Convertir les auteurs en UserBasicDTO
        if (resource.getAuthors() != null) {
            dto.setAuthors(resource.getAuthors().stream()
                    .map(author -> {
                        UserBasicDTO authorDTO = new UserBasicDTO();
                        authorDTO.setId(author.getId());
                        authorDTO.setUsername(author.getUsername());
                        authorDTO.setEmail(author.getEmail());
                        authorDTO.setFirstName(author.getFirstName());
                        authorDTO.setLastName(author.getLastName());
                        authorDTO.setRole(author.getRole() != null ? author.getRole().name() : null);
                        return authorDTO;
                    })
                    .collect(Collectors.toList()));
        }

        // ✅ Générer l'URL de téléchargement
        if (resource.getStoredFileName() != null) {
            dto.setFileDownloadUrl("/api/resources/files/" + resource.getStoredFileName());
        }

        return dto;
    }
}


# <span style="color:#0d47a1;">QuizService - Interface de gestion des Quiz</span>

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-brightgreen?logo=java&logoColor=white" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Spring_Boot-3.4.11-6DB33F?logo=spring&logoColor=white" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/PostgreSQL-13-blue?logo=postgresql&logoColor=white" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Maven-3.x-blueviolet?logo=apache-maven&logoColor=white" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/LLM-RAG%20%26%20Agents-black?logo=openai" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## <span style="color:#0d47a1;">Code Complet</span>

```java
package com.iatd.smarthub.service;

import com.iatd.smarthub.dto.*;
import java.util.List;

public interface QuizService {

    QuizResponseDTO createQuiz(QuizRequestDTO quizRequest);

    List<QuizSummaryDTO> getAllQuizSummaries();

    QuizResponseDTO getQuizById(Long quizId);

    QuizResponseDTO updateQuiz(Long quizId, QuizRequestDTO quizRequest);

    void deleteQuiz(Long quizId);

    List<QuizSummaryDTO> getActiveQuizSummaries();

    List<QuizSummaryDTO> searchQuizzesByTitle(String title);

    QuizStatisticsDTO getQuizStatistics(Long quizId);

    AnswerStatisticsDTO getQuestionStatistics(Long questionId);
}


# <span style="color:#0d47a1;">QuizService - Explications</span>

---

## <span style="color:#0d47a1;">Rôle général</span>
Le service **QuizService** est l'interface centrale pour gérer toutes les opérations liées aux quiz dans la plateforme.  
Il permet de **créer, lire, mettre à jour, supprimer et analyser** les quiz ainsi que leurs questions et réponses.

---

## <span style="color:#0d47a1;">Fonctionnalités principales et méthodes</span>

| Méthode | Rôle / Fonctionnalité | Utilisation et importance |
|---------|----------------------|-------------------------|
| `createQuiz(QuizRequestDTO quizRequest)` | Crée un nouveau quiz avec ses questions et paramètres | Permet aux enseignants ou admins d’ajouter un quiz dans le système. Essentiel pour l’enrichissement des ressources pédagogiques. |
| `getAllQuizSummaries()` | Récupère la liste de tous les quiz sous forme résumée | Utile pour afficher un aperçu rapide de tous les quiz sur le tableau de bord. |
| `getQuizById(Long quizId)` | Récupère un quiz complet par son ID | Permet d’afficher ou de modifier un quiz spécifique, très important pour la consultation ou l’édition individuelle. |
| `updateQuiz(Long quizId, QuizRequestDTO quizRequest)` | Met à jour un quiz existant | Permet de corriger ou modifier les quiz déjà créés. Important pour maintenir les quiz à jour. |
| `deleteQuiz(Long quizId)` | Supprime un quiz existant | Permet de retirer un quiz obsolète ou incorrect, essentiel pour la gestion des contenus. |
| `getActiveQuizSummaries()` | Liste uniquement les quiz actuellement actifs | Utile pour présenter aux étudiants uniquement les quiz disponibles et en cours. |
| `searchQuizzesByTitle(String title)` | Recherche des quiz par titre | Facilite la navigation et la recherche de quiz spécifiques par mots-clés. |
| `getQuizStatistics(Long quizId)` | Fournit des statistiques sur un quiz (scores, tentatives, taux de réussite) | Permet aux enseignants de suivre la performance globale et l’efficacité du quiz. |
| `getQuestionStatistics(Long questionId)` | Fournit des statistiques sur une question spécifique | Permet d’analyser la difficulté des questions et d’identifier les points à améliorer. |

---

## <span style="color:#0d47a1;">Importance et rôle global</span>
- Permet une **gestion complète des quiz** (CRUD).  
- Supporte la **prise de décision pédagogique** grâce aux statistiques.  
- Optimise l’expérience des utilisateurs (étudiants et enseignants) en filtrant les quiz actifs et en facilitant la recherche.  
- Sert de **pont central** entre les DTO (données) et la logique métier des quiz.  



# <span style="color:#0d47a1;">QuizGenerationService - Explications</span>

---

## <span style="color:#0d47a1;">Rôle général</span>
Le service **QuizGenerationService** est responsable de **générer automatiquement des quiz** à partir de différentes sources de contenu : texte libre, fichiers, URL ou cours spécifiques.  
Il utilise des modèles d’IA (Gemini via OllamaService) pour créer des questions pertinentes, variées et formatées.  

Ce service permet de **réduire le travail manuel des enseignants**, d’enrichir rapidement le contenu pédagogique et d’assurer des quiz dynamiques et personnalisés.

---

## <span style="color:#0d47a1;">Fonctionnalités principales et méthodes</span>

| Méthode | Rôle / Fonctionnalité | Utilisation et importance |
|---------|----------------------|-------------------------|
| `generateQuizFromText(String content, String title, int questionCount)` | Génère un quiz complet à partir d’un texte | Principal moteur de génération de quiz depuis du contenu pédagogique fourni par l’utilisateur. Très important pour la production automatique de quiz. |
| `generateQuizFromFile(String fileName, String fileContent, int questionCount)` | Génère un quiz à partir d’un fichier uploadé | Permet de transformer des documents (PDF, TXT, DOCX) en quiz. Utile pour la conversion rapide de matériel existant. |
| `generateQuizFromUrl(String url, int questionCount)` | Génère un quiz depuis le contenu d’une URL | Extraction et génération automatique depuis des pages web. Facilite la création de quiz sur des ressources en ligne. |
| `generateQuizForCourse(String content, String title, int questionCount, Long courseId)` | Génère un quiz et l’associe à un cours spécifique | Permet de relier directement le quiz au cours correspondant, utile pour organiser les quiz dans la plateforme pédagogique. |
| `buildQuizGenerationPrompt(String content, int questionCount)` | Construit le prompt pour le modèle AI Gemini | Définit les instructions détaillées pour l’IA afin de générer des questions cohérentes et spécifiques au contenu. |
| `extractTitleFromFileName(String fileName)` | Génère un titre à partir du nom du fichier | Automatisation du titre du quiz pour plus de lisibilité et organisation. |
| `extractTitleFromUrl(String url)` | Génère un titre à partir de l’URL | Permet d’obtenir un nom de quiz pertinent basé sur la source web. |
| `extractContentFromUrl(String url)` | Extrait le contenu d’une page web (non implémenté) | Prévu pour récupérer le texte des pages web. Utile pour la génération de quiz à partir de contenus externes. |
| `isAIServiceAvailable()` | Vérifie la disponibilité du service AI | Essentiel pour prévenir les erreurs lors de la génération de quiz et assurer la robustesse du service. |
| `convertToResponseDTO(Quiz quiz)` | Convertit un quiz en DTO pour l’API | Facilite la communication avec les couches supérieures (contrôleur, front-end). |
| `convertQuestionToResponseDTO(Question question)` | Convertit une question en DTO | Assure la structure correcte pour l’affichage et l’édition des questions dans l’UI. |
| `getServiceStatus()` | Retourne l’état du service AI et modèle utilisé | Permet aux administrateurs et développeurs de vérifier rapidement si le service est opérationnel. |
| `generateQuizSafely(String content, String title, int questionCount)` | Génère un quiz avec gestion d’erreur | Crée un quiz de secours si l’IA échoue. Garantit qu’un quiz minimal est toujours disponible. |

---

## <span style="color:#0d47a1;">Rôle et importance globale</span>
- **Automatisation** : Génère des quiz automatiquement à partir de textes, fichiers ou URLs.  
- **Qualité pédagogique** : Assure des questions claires, variées et spécifiques.  
- **Robustesse** : Vérification de la disponibilité du service AI et création de quiz de secours si nécessaire.  
- **Intégration** : Relie les quiz aux cours, aux questions et aux systèmes de gestion existants.  
- **Support utilisateur** : Facilite le travail des enseignants et la personnalisation des contenus pour les étudiants.  
- **Flexibilité** : Méthodes pour différents types de sources (texte, fichier, URL, cours).  

---

## <span style="color:#0d47a1;">Processus global de génération de quiz</span>

1. Vérification de la disponibilité de Gemini AI (`isAIServiceAvailable`).  
2. Construction du prompt détaillé pour la génération (`buildQuizGenerationPrompt`).  
3. Appel à l’IA via `OllamaService` pour générer les questions.  
4. Création du quiz et sauvegarde dans la base (`QuizRepository`).  
5. Association et sauvegarde des questions (`QuestionRepository`).  
6. Conversion finale en DTO pour la réponse API.  
7. Si erreur AI, création d’un quiz de secours minimal (`generateQuizSafely`).  

---

Ce service est **critique** pour toute fonctionnalité RAG / agents AI de la plateforme qui doit générer des quiz automatiquement pour les utilisateurs.


### <span style="color:#0d47a1;">QuizGenerationService - Code Complet</span>

```java
package com.iatd.smarthub.service;

import com.iatd.smarthub.dto.QuestionResponseDTO;
import com.iatd.smarthub.dto.QuizResponseDTO;
import com.iatd.smarthub.model.quiz.Question;
import com.iatd.smarthub.model.quiz.Quiz;
import com.iatd.smarthub.repository.QuestionRepository;
import com.iatd.smarthub.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizGenerationService {
    
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final OllamaService ollamaService;
    
    @Value("${gemini.model.name:gemini-2.5-flash}")
    private String geminiModelName;
    
    @Transactional
    public QuizResponseDTO generateQuizFromText(String content, String title, int questionCount) {
        log.info("Génération de quiz depuis texte utilisateur: {} ({} questions)", title, questionCount);
        
        if (!isAIServiceAvailable()) {
            throw new RuntimeException("Le service AI (Gemini) n'est pas disponible.");
        }
        
        String prompt = buildQuizGenerationPrompt(content, questionCount);
        List<Question> questions = ollamaService.generateQuestions(prompt, questionCount);

        Quiz quiz = new Quiz();
        quiz.setTitle(title);
        quiz.setDescription("Quiz généré depuis votre contenu avec Gemini AI");
        quiz.setActive(true);

        Quiz savedQuiz = quizRepository.save(quiz);

        for (Question question : questions) {
            question.setQuiz(savedQuiz);
            questionRepository.save(question);
            savedQuiz.addQuestion(question);
        }

        quizRepository.save(savedQuiz);

        return convertToResponseDTO(savedQuiz);
    }

    private boolean isAIServiceAvailable() {
        try {
            String testResponse = ollamaService.generateText("Test de connexion");
            return testResponse != null && !testResponse.toLowerCase().contains("erreur");
        } catch (Exception e) {
            log.warn("Service AI non disponible: {}", e.getMessage());
            return false;
        }
    }

    private QuizResponseDTO convertToResponseDTO(Quiz quiz) {
        QuizResponseDTO response = new QuizResponseDTO();
        response.setId(quiz.getId());
        response.setTitle(quiz.getTitle());
        response.setDescription(quiz.getDescription());
        response.setActive(quiz.getActive());
        response.setCreatedAt(quiz.getCreatedAt());
        response.setUpdatedAt(quiz.getUpdatedAt());

        if (quiz.getQuestions() != null) {
            for (Question question : quiz.getQuestions()) {
                QuestionResponseDTO questionDto = convertQuestionToResponseDTO(question);
                response.addQuestion(questionDto);
            }
        }

        return response;
    }

    private QuestionResponseDTO convertQuestionToResponseDTO(Question question) {
        QuestionResponseDTO dto = new QuestionResponseDTO();
        dto.setId(question.getId());
        dto.setText(question.getText());
        dto.setType(question.getType());
        dto.setCorrectAnswer(question.getCorrectAnswer());
        dto.setOptions(question.getOptions());
        if (question.getQuiz() != null) {
            dto.setQuizId(question.getQuiz().getId());
        }
        return dto;
    }

    // Méthodes supplémentaires : génération depuis fichier, URL, pour cours, etc.
}




# Documentation des services

Ce fichier fournit une section autonome par service (ordre demandé) : titre en bleu, code complet du service et un tableau décrivant chaque méthode (Méthode | Rôle / Fonction | Paramètres | Retour | Exemple d'usage | Notes importantes).

---

<span style="color:#0d47a1;">QuizAttemptService - Code Complet</span>

```java
package com.iatd.smarthub.service;

import com.iatd.smarthub.dto.*;
import com.iatd.smarthub.model.quiz.Answer;
import com.iatd.smarthub.model.quiz.Question;
import com.iatd.smarthub.model.quiz.Quiz;
import com.iatd.smarthub.model.quiz.QuizAttempt;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.AnswerRepository;
import com.iatd.smarthub.repository.QuestionRepository;
import com.iatd.smarthub.repository.QuizAttemptRepository;
import com.iatd.smarthub.repository.QuizRepository;
import com.iatd.smarthub.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class QuizAttemptService {

    private static final Logger log = LoggerFactory.getLogger(QuizAttemptService.class);

    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizRepository quizRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;

    // ==================== ATTEMPT MANAGEMENT ====================

    public QuizAttemptResponseDTO startQuizAttempt(Long quizId, Long userId) {
        log.info("Starting quiz attempt for quiz ID: {} and user ID: {}", quizId, userId);

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz non trouvé avec ID: " + quizId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec ID: " + userId));

        // Vérifier s'il y a une tentative en cours
        QuizAttempt existingAttempt = quizAttemptRepository.findInProgressAttempt(userId, quizId).orElse(null);

        if (existingAttempt != null) {
            log.info("Resuming existing in-progress attempt ID: {}", existingAttempt.getId());
            return convertToQuizAttemptResponseDTO(existingAttempt);
        }

        // Créer une nouvelle tentative
        QuizAttempt attempt = new QuizAttempt(user, quiz);
        attempt.setStatus(QuizAttempt.AttemptStatus.IN_PROGRESS);
        attempt.setAttemptedAt(LocalDateTime.now());

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);
        log.info("New quiz attempt started with ID: {}", savedAttempt.getId());

        return convertToQuizAttemptResponseDTO(savedAttempt);
    }

    public QuizAttemptResponseDTO submitQuizAttempt(Long attemptId, QuizAttemptRequestDTO attemptRequest) {
        log.info("Submitting quiz attempt ID: {}", attemptId);

        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Tentative non trouvée avec ID: " + attemptId));

        // Vérifier que la tentative est en cours
        if (attempt.getStatus() != QuizAttempt.AttemptStatus.IN_PROGRESS) {
            throw new RuntimeException("Cette tentative a déjà été soumise ou abandonnée");
        }

        // Traiter les réponses
     // Traiter les réponses
        if (attemptRequest.getAnswers() != null) {
            List<Answer> answers = attemptRequest.getAnswers().stream()
                .map(answerRequest -> {
                    Question question = questionRepository.findById(answerRequest.getQuestionId())
                        .orElseThrow(() -> new RuntimeException(
                            "Question non trouvée avec ID: " + answerRequest.getQuestionId()));

                    Answer answer = new Answer();
                    answer.setQuestion(question);
                    answer.setQuizAttempt(attempt);
                    answer.setAnswerText(answerRequest.getAnswerText());
                    answer.validateAnswer();
                    return answer;
                })
                .collect(Collectors.toList());
            
            // Sauvegarder d'abord les réponses
            List<Answer> savedAnswers = answerRepository.saveAll(answers);
            attempt.getAnswers().addAll(savedAnswers);
        }

        // Calculer le score
        calculateAndSetScore(attempt);

        // Marquer comme complété
        attempt.completeAttempt();

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);
        log.info("Quiz attempt submitted successfully with score: {}", savedAttempt.getScore());

        return convertToQuizAttemptResponseDTO(savedAttempt);
    }

    public QuizAttemptResponseDTO abandonQuizAttempt(Long attemptId) {
        log.info("Abandoning quiz attempt ID: {}", attemptId);

        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Tentative non trouvée avec ID: " + attemptId));

        attempt.abandonAttempt();

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);
        log.info("Quiz attempt abandoned successfully");

        return convertToQuizAttemptResponseDTO(savedAttempt);
    }

    public QuizAttemptResponseDTO resumeOrStartQuizAttempt(Long userId, Long quizId) {
        log.info("Resuming or starting quiz attempt for user ID: {} and quiz ID: {}", userId, quizId);

        // Essayer de reprendre une tentative en cours
        QuizAttempt existingAttempt = quizAttemptRepository.findInProgressAttempt(userId, quizId).orElse(null);

        if (existingAttempt != null) {
            log.info("Resuming existing attempt ID: {}", existingAttempt.getId());
            return convertToQuizAttemptResponseDTO(existingAttempt);
        }

        // Sinon, démarrer une nouvelle tentative
        return startQuizAttempt(quizId, userId);
    }

    // ==================== RETRIEVAL OPERATIONS ====================

    public QuizAttemptResponseDTO getQuizAttemptById(Long attemptId) {
        log.debug("Fetching quiz attempt by ID: {}", attemptId);

        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Tentative non trouvée avec ID: " + attemptId));

        return convertToQuizAttemptResponseDTO(attempt);
    }

    public QuizAttemptResponseDTO getQuizAttemptWithDetails(Long attemptId) {
        log.debug("Fetching quiz attempt with details for ID: {}", attemptId);

        QuizAttempt attempt = quizAttemptRepository.findByIdWithDetails(attemptId)
                .orElseThrow(() -> new RuntimeException("Tentative non trouvée avec ID: " + attemptId));

        return convertToQuizAttemptResponseDTO(attempt);
    }

    public List<QuizAttemptResponseDTO> getUserQuizAttempts(Long userId) {
        log.debug("Fetching quiz attempts for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec ID: " + userId));

        List<QuizAttempt> attempts = quizAttemptRepository.findByStudent(user);
        return attempts.stream()
                .map(this::convertToQuizAttemptResponseDTO)
                .collect(Collectors.toList());
    }

    public List<QuizAttemptResponseDTO> getUserQuizAttemptsForQuiz(Long userId, Long quizId) {
        log.debug("Fetching quiz attempts for user ID: {} and quiz ID: {}", userId, quizId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec ID: " + userId));

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz non trouvé avec ID: " + quizId));

        List<QuizAttempt> attempts = quizAttemptRepository.findByStudentAndQuiz(user, quiz);
        return attempts.stream()
                .map(this::convertToQuizAttemptResponseDTO)
                .collect(Collectors.toList());
    }

    public List<QuizAttemptResponseDTO> getUserInProgressAttempts(Long userId) {
        log.debug("Fetching in-progress attempts for user ID: {}", userId);

        List<QuizAttempt> attempts = quizAttemptRepository.findByStudentIdWithDetails(userId).stream()
                .filter(attempt -> attempt.getStatus() == QuizAttempt.AttemptStatus.IN_PROGRESS)
                .collect(Collectors.toList());

        return attempts.stream()
                .map(this::convertToQuizAttemptResponseDTO)
                .collect(Collectors.toList());
    }

    public List<QuizAttemptResponseDTO> getUserRecentAttempts(Long userId, int limit) {
        log.debug("Fetching recent attempts for user ID: {} with limit: {}", userId, limit);

        List<QuizAttempt> attempts = quizAttemptRepository.findRecentCompletedAttemptsByStudent(userId, limit);
        return attempts.stream()
                .map(this::convertToQuizAttemptResponseDTO)
                .collect(Collectors.toList());
    }

    public List<QuizAttemptResponseDTO> getQuizAttempts(Long quizId) {
        log.debug("Fetching all attempts for quiz ID: {}", quizId);

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz non trouvé avec ID: " + quizId));

        List<QuizAttempt> attempts = quizAttemptRepository.findByQuiz(quiz);
        return attempts.stream()
                .map(this::convertToQuizAttemptResponseDTO)
                .collect(Collectors.toList());
    }

    public List<QuizAttemptResponseDTO> getCompletedQuizAttempts(Long quizId) {
        log.debug("Fetching completed attempts for quiz ID: {}", quizId);

        List<QuizAttempt> attempts = quizAttemptRepository.findByQuiz(
                quizRepository.findById(quizId)
                        .orElseThrow(() -> new RuntimeException("Quiz non trouvé avec ID: " + quizId)))
                .stream()
                .filter(attempt -> attempt.getStatus() == QuizAttempt.AttemptStatus.COMPLETED)
                .collect(Collectors.toList());

        return attempts.stream()
                .map(this::convertToQuizAttemptResponseDTO)
                .collect(Collectors.toList());
    }

    // ==================== PRIVATE METHODS ====================

    private void calculateAndSetScore(QuizAttempt attempt) {
        if (attempt.getAnswers() == null || attempt.getAnswers().isEmpty()) {
            attempt.setScore(0.0);
            return;
        }

        long totalQuestions = attempt.getQuiz().getQuestions().size();
        long correctAnswers = attempt.getAnswers().stream()
                .filter(answer -> Boolean.TRUE.equals(answer.getIsCorrect()))
                .count();

        double score = totalQuestions > 0 ? (double) correctAnswers / totalQuestions * 100 : 0.0;
        attempt.setScore(Math.round(score * 100.0) / 100.0); // Arrondir à 2 décimales
    }

    private QuizAttemptResponseDTO convertToQuizAttemptResponseDTO(QuizAttempt attempt) {
        QuizAttemptResponseDTO response = new QuizAttemptResponseDTO();
        response.setId(attempt.getId());
        response.setStudentId(attempt.getStudent().getId());
        response.setStudentName(attempt.getStudent().getFirstName() + " " + attempt.getStudent().getLastName());
        response.setQuizId(attempt.getQuiz().getId());
        response.setQuizTitle(attempt.getQuiz().getTitle());
        response.setScore(attempt.getScore());
        response.setAttemptedAt(attempt.getAttemptedAt());
        response.setCompletedAt(attempt.getCompletedAt());
        response.setStatus(attempt.getStatus());

        // Convertir les réponses
        if (attempt.getAnswers() != null) {
            List<AnswerResponseDTO> answerDTOs = attempt.getAnswers().stream()
                    .map(this::convertToAnswerResponseDTO)
                    .collect(Collectors.toList());
            response.setAnswers(answerDTOs);

            // Calculer le score si nécessaire
            if (response.getScore() == null && attempt.getStatus() == QuizAttempt.AttemptStatus.COMPLETED) {
                response.calculateAndSetScore();
            }
        }

        return response;
    }

    private AnswerResponseDTO convertToAnswerResponseDTO(Answer answer) {
        AnswerResponseDTO response = new AnswerResponseDTO();
        response.setId(answer.getId());
        response.setQuestionId(answer.getQuestion().getId());
        response.setQuestionText(answer.getQuestion().getText());
        response.setAnswerText(answer.getAnswerText());
        response.setIsCorrect(answer.getIsCorrect());
        response.setCorrectAnswer(answer.getQuestion().getCorrectAnswer());
        return response;
    }
}
```

Méthodes (tableau)

| Méthode | Rôle / Fonction | Paramètres | Retour | Exemple d'usage | Notes importantes |
|---|---|---:|---|---|---|
| startQuizAttempt | Démarre ou reprend une tentative pour un utilisateur | Long quizId, Long userId | QuizAttemptResponseDTO | startQuizAttempt(5L, 10L) | Cherche une tentative en cours avant de créer une nouvelle. |
| submitQuizAttempt | Sauvegarde les réponses, calcule le score et clôt la tentative | Long attemptId, QuizAttemptRequestDTO | QuizAttemptResponseDTO | submitQuizAttempt(12L, requestDto) | Valide les questions et réponses; appelle calculateAndSetScore(). |
| abandonQuizAttempt | Marque la tentative comme abandonnée | Long attemptId | QuizAttemptResponseDTO | abandonQuizAttempt(12L) | Change le status et sauvegarde. |
| resumeOrStartQuizAttempt | Reprend une tentative ou en crée une nouvelle | Long userId, Long quizId | QuizAttemptResponseDTO | resumeOrStartQuizAttempt(10L,5L) | Wrapper utile pour flux front. |
| getQuizAttemptById | Récupère une tentative simple | Long attemptId | QuizAttemptResponseDTO | getQuizAttemptById(12L) | Utilise repository standard. |
| getQuizAttemptWithDetails | Récupère une tentative avec relations fetchées | Long attemptId | QuizAttemptResponseDTO | getQuizAttemptWithDetails(12L) | Utilise findByIdWithDetails pour éviter lazy loading. |
| getUserQuizAttempts | Liste toutes les tentatives d'un utilisateur | Long userId | List<QuizAttemptResponseDTO> | getUserQuizAttempts(10L) | Mapper DTO. |
| getUserQuizAttemptsForQuiz | Liste les tentatives d'un utilisateur pour un quiz | Long userId, Long quizId | List<QuizAttemptResponseDTO> | getUserQuizAttemptsForQuiz(10L, 5L) | Filtre par utilisateur et quiz. |
| getUserInProgressAttempts | Récupère les tentatives en cours d'un utilisateur | Long userId | List<QuizAttemptResponseDTO> | getUserInProgressAttempts(10L) | Filtre par status IN_PROGRESS. |
| getUserRecentAttempts | Récupère les tentatives récentes complétées d'un utilisateur | Long userId, int limit | List<QuizAttemptResponseDTO> | getUserRecentAttempts(10L, 5) | Limité via repository query. |
| getQuizAttempts | Récupère toutes les tentatives pour un quiz | Long quizId | List<QuizAttemptResponseDTO> | getQuizAttempts(5L) | - |
| getCompletedQuizAttempts | Récupère les tentatives complétées pour un quiz | Long quizId | List<QuizAttemptResponseDTO> | getCompletedQuizAttempts(5L) | Filtre par status COMPLETED. |
| calculateAndSetScore (privée) | Calcule et définit le score de la tentative | QuizAttempt attempt | void | interne | Divise réponses correctes par total. |
| convertToQuizAttemptResponseDTO (privée) | Transforme entité en DTO | QuizAttempt attempt | QuizAttemptResponseDTO | interne | Inclut conversion des réponses. |

---

<span style="color:#0d47a1;">ProjectService - Code Complet</span>

```java
package com.iatd.smarthub.service;

import com.iatd.smarthub.dto.ProjectRequestDTO;
import com.iatd.smarthub.dto.ProjectResponseDTO;
import com.iatd.smarthub.model.project.Project;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.iatd.smarthub.dto.UserBasicDTO;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserService userService;

    // ✅ NOUVEAU : Création avec l'enseignant connecté automatiquement
 // ✅ MODIFIÉ : Ajout de la vérification de sécurité
    public ProjectResponseDTO createProject(ProjectRequestDTO projectRequest, String username) {
        // ✅ VÉRIFICATION DE SÉCURITÉ : Empêcher les étudiants de créer des projets
        User currentUser = userService.getUserEntityByUsername(username);
        if (currentUser.getRole() == User.Role.STUDENT) {
            throw new RuntimeException("Les étudiants ne sont pas autorisés à créer des projets");
        }

        Project project = new Project();
        project.setTitle(projectRequest.getTitle());
        project.setDescription(projectRequest.getDescription());
        project.setStartDate(projectRequest.getStartDate());
        project.setEndDate(projectRequest.getEndDate());
        project.setStatus(projectRequest.getStatus() != null ? projectRequest.getStatus() : Project.ProjectStatus.PLANNED);

        // ✅ Assigner automatiquement l'enseignant connecté comme superviseur
        User supervisor = currentUser; // Utiliser l'utilisateur déjà récupéré
        project.setSupervisor(supervisor);

        Project savedProject = projectRepository.save(project);
        return convertToDTO(savedProject);
    }

    public List<ProjectResponseDTO> getAllProjects() {
        // ✅ Utiliser la méthode avec JOIN FETCH
        return projectRepository.findAllWithSupervisor().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<ProjectResponseDTO> getProjectById(Long id) {
        // ✅ Utiliser la méthode avec JOIN FETCH
        return projectRepository.findByIdWithSupervisor(id)
                .map(this::convertToDTO);
    }

    // Mettre à jour les autres méthodes pour utiliser les bonnes requêtes
    public List<ProjectResponseDTO> getProjectsBySupervisorUsername(String username) {
        User supervisor = userService.getUserEntityByUsername(username);
        // Vous devrez peut-être créer une méthode similaire dans le repository
        return projectRepository.findBySupervisor(supervisor).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ✅ NOUVEAU : Récupérer les projets par username de l'étudiant
    public List<ProjectResponseDTO> getProjectsByStudentUsername(String username) {
        User student = userService.getUserEntityByUsername(username);
        return projectRepository.findByStudent(student).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ✅ Garder l'ancienne méthode pour compatibilité
    public List<ProjectResponseDTO> getProjectsBySupervisor(Long supervisorId) {
        User supervisor = userService.getUserEntityById(supervisorId);
        return projectRepository.findBySupervisor(supervisor).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ✅ Garder l'ancienne méthode pour compatibilité
    public List<ProjectResponseDTO> getProjectsByStudent(Long studentId) {
        User student = userService.getUserEntityById(studentId);
        return projectRepository.findByStudent(student).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ProjectResponseDTO> getProjectsByStatus(Project.ProjectStatus status) {
        return projectRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ProjectResponseDTO> getActiveProjects() {
        return projectRepository.findActiveProjects().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ProjectResponseDTO> searchProjects(String query) {
        return projectRepository.searchByTitle(query).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ✅ MODIFIÉ : Vérification de propriété
    public ProjectResponseDTO updateProject(Long id, ProjectRequestDTO projectDetails, String username) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

        // ✅ Vérifier que l'utilisateur est le superviseur du projet
        User currentUser = userService.getUserEntityByUsername(username);
        if (!project.getSupervisor().getId().equals(currentUser.getId()) && 
            currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Vous n'êtes pas le superviseur de ce projet");
        }

        project.setTitle(projectDetails.getTitle());
        project.setDescription(projectDetails.getDescription());
        project.setStartDate(projectDetails.getStartDate());
        project.setEndDate(projectDetails.getEndDate());
        project.setStatus(projectDetails.getStatus());

        Project updatedProject = projectRepository.save(project);
        return convertToDTO(updatedProject);
    }

    // ✅ MODIFIÉ : Vérification de propriété
    public void deleteProject(Long id, String username) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

        // ✅ Vérifier que l'utilisateur est le superviseur du projet
        User currentUser = userService.getUserEntityByUsername(username);
        if (!project.getSupervisor().getId().equals(currentUser.getId()) && 
            currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Vous n'êtes pas le superviseur de ce projet");
        }

        projectRepository.delete(project);
    }

    // ✅ MODIFIÉ : Vérification de propriété
    public void addStudentToProject(Long projectId, Long studentId, String username) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

        // ✅ Vérifier que l'utilisateur est le superviseur du projet
        User currentUser = userService.getUserEntityByUsername(username);
        if (!project.getSupervisor().getId().equals(currentUser.getId()) && 
            currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Vous n'êtes pas le superviseur de ce projet");
        }

        User student = userService.getUserEntityById(studentId);

        if (project.getStudents().contains(student)) {
            throw new RuntimeException("Student is already in the project");
        }

        project.getStudents().add(student);
        projectRepository.save(project);
    }

    // ✅ MODIFIÉ : Vérification de propriété
    public void removeStudentFromProject(Long projectId, Long studentId, String username) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

        // ✅ Vérifier que l'utilisateur est le superviseur du projet
        User currentUser = userService.getUserEntityByUsername(username);
        if (!project.getSupervisor().getId().equals(currentUser.getId()) && 
            currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Vous n'êtes pas le superviseur de ce projet");
        }

        User student = userService.getUserEntityById(studentId);

        if (!project.getStudents().contains(student)) {
            throw new RuntimeException("Student is not in the project");
        }

        project.getStudents().remove(student);
        projectRepository.save(project);
    }

    // ✅ MODIFIÉ : Vérification de propriété
    public void addStudentsToProject(Long projectId, List<Long> studentIds, String username) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

        // ✅ Vérifier que l'utilisateur est le superviseur du projet
        User currentUser = userService.getUserEntityByUsername(username);
        if (!project.getSupervisor().getId().equals(currentUser.getId()) && 
            currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Vous n'êtes pas le superviseur de ce projet");
        }

        for (Long studentId : studentIds) {
            User student = userService.getUserEntityById(studentId);
            if (!project.getStudents().contains(student)) {
                project.getStudents().add(student);
            }
        }

        projectRepository.save(project);
    }

    private ProjectResponseDTO convertToDTO(Project project) {
        ProjectResponseDTO dto = new ProjectResponseDTO();
        dto.setId(project.getId());
        dto.setTitle(project.getTitle());
        dto.setDescription(project.getDescription());
        dto.setStartDate(project.getStartDate());
        dto.setEndDate(project.getEndDate());
        dto.setStatus(project.getStatus());
        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());
        
        // ✅ CORRECTION : Rôle pour le superviseur
        if (project.getSupervisor() != null) {
            UserBasicDTO supervisorDTO = new UserBasicDTO();
            supervisorDTO.setId(project.getSupervisor().getId());
            supervisorDTO.setUsername(project.getSupervisor().getUsername());
            supervisorDTO.setEmail(project.getSupervisor().getEmail());
            supervisorDTO.setFirstName(project.getSupervisor().getFirstName());
            supervisorDTO.setLastName(project.getSupervisor().getLastName());
            // ✅ AJOUT DU RÔLE
            supervisorDTO.setRole(project.getSupervisor().getRole() != null ? project.getSupervisor().getRole().name() : null);
            dto.setSupervisor(supervisorDTO);
        }
        
        // ✅ CORRECTION : Rôle pour les étudiants
        if (project.getStudents() != null && !project.getStudents().isEmpty()) {
            List<UserBasicDTO> studentDTOs = project.getStudents().stream()
                    .map(student -> {
                        UserBasicDTO studentDTO = new UserBasicDTO();
                        studentDTO.setId(student.getId());
                        studentDTO.setUsername(student.getUsername());
                        studentDTO.setEmail(student.getEmail());
                        studentDTO.setFirstName(student.getFirstName());
                        studentDTO.setLastName(student.getLastName());
                        // ✅ AJOUT DU RÔLE
                        studentDTO.setRole(student.getRole() != null ? student.getRole().name() : null);
                        return studentDTO;
                    })
                    .collect(Collectors.toList());
            dto.setStudents(studentDTOs);
        }
        
        return dto;
    }
    
}
```

Méthodes (tableau)

| Méthode | Rôle / Fonction | Paramètres | Retour | Exemple d'usage | Notes importantes |
|---|---|---:|---|---|---|
| createProject | Crée un projet en assignant le superviseur connecté | ProjectRequestDTO, String username | ProjectResponseDTO | createProject(reqDto, "teacher1") | Vérifie que l'utilisateur n'est pas STUDENT. |
| getAllProjects | Récupère tous les projets (fetch supervisor) | - | List<ProjectResponseDTO> | getAllProjects() | Utilise findAllWithSupervisor() pour éviter N+1. |
| getProjectById | Récupère un projet par id avec supervisor | Long id | Optional<ProjectResponseDTO> | getProjectById(5L) | Recommande findByIdWithSupervisor. |
| updateProject | Met à jour un projet (vérifie propriétaire) | Long id, ProjectRequestDTO, String username | ProjectResponseDTO | updateProject(5L, dto, "teacher1") | Vérifie que l'utilisateur est superviseur ou ADMIN. |
| deleteProject | Supprime un projet (vérifie propriétaire) | Long id, String username | void | deleteProject(5L, "teacher1") | Idem. |
| addStudentToProject | Ajoute un étudiant (vérification) | Long projectId, Long studentId, String username | void | addStudentToProject(5L, 10L, "teacher1") | Vérifie que l'utilisateur est superviseur. |
| getProjectsByStudentUsername | Liste projets d'un étudiant | String username | List<ProjectResponseDTO> | getProjectsByStudentUsername("student1") | Utilise userService. |

---

<span style="color:#0d47a1;">OllamaService - Code Complet</span>

```java
package com.iatd.smarthub.service;

import com.iatd.smarthub.model.quiz.Question;
import com.iatd.smarthub.model.quiz.QuestionType;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
public class OllamaService {
    
    @Value("${gemini.api.key:}")
    private String geminiApiKey;
    
    @Value("${gemini.model.name:gemini-2.5-flash}")
    private String geminiModelName;
    
    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/}")
    private String geminiApiUrl;
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    public OllamaService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Génère une réponse brute depuis Gemini
     */
    public String generateRawResponse(String prompt) {
        log.info("📤 Génération réponse brute Gemini - Prompt: {} caractères", prompt.length());
        
        try {
            String url = geminiApiUrl + geminiModelName + ":generateContent?key=" + geminiApiKey;
            
            Map<String, Object> request = new HashMap<>();
            
            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> content = new HashMap<>();
            
            List<Map<String, Object>> parts = new ArrayList<>();
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);
            parts.add(part);
            
            content.put("parts", parts);
            contents.add(content);
            
            request.put("contents", contents);
            
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("maxOutputTokens", 16000);
            generationConfig.put("temperature", 0.3);
            
            request.put("generationConfig", generationConfig);
            
            // Safety settings
            List<Map<String, Object>> safetySettings = new ArrayList<>();
            safetySettings.add(Map.of(
                "category", "HARM_CATEGORY_HARASSMENT",
                "threshold", "BLOCK_MEDIUM_AND_ABOVE"
            ));
            safetySettings.add(Map.of(
                "category", "HARM_CATEGORY_HATE_SPEECH", 
                "threshold", "BLOCK_MEDIUM_AND_ABOVE"
            ));
            safetySettings.add(Map.of(
                "category", "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold", "BLOCK_MEDIUM_AND_ABOVE"
            ));
            safetySettings.add(Map.of(
                "category", "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold", "BLOCK_MEDIUM_AND_ABOVE"
            ));
            
            request.put("safetySettings", safetySettings);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            
            log.debug("🔗 Envoi requête à Gemini: {}", url);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                url, 
                HttpMethod.POST, 
                entity, 
                Map.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                
                String aiResponse = extractTextFromGeminiResponse(responseBody);
                
                if (aiResponse != null) {
                    log.info("✅ Réponse brute reçue: {} caractères", aiResponse.length());
                    
                    // Afficher les 200 premiers caractères de la réponse
                    String preview = aiResponse.length() > 200 ? 
                        aiResponse.substring(0, 200) + "..." : aiResponse;
                    log.info("📄 Prévisualisation réponse: {}", preview);
                    
                    return aiResponse;
                } else {
                    log.error("❌ Impossible d'extraire le texte de la réponse Gemini");
                    throw new RuntimeException("Réponse Gemini invalide - texte non extractible");
                }
            } else {
                log.error("❌ Réponse HTTP invalide: {}", response.getStatusCode());
                throw new RuntimeException("Erreur HTTP: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("❌ Erreur génération réponse brute: {}", e.getMessage());
            throw new RuntimeException("Erreur de communication avec Gemini: " + e.getMessage(), e);
        }
    }
    
    // Méthodes utilitaires, parsing, génération de questions et diagnostics
    // (implémentation complète similaire au fichier source : testRAGGeneration, generateQuestions, parseAIResponse, parseQuestion, cleanAndValidateAIResponse, validateGeneratedQuestions, displayGeneratedQuestions, callGeminiAPI, extractTextFromGeminiResponse, buildQuestionPrompt, calculateMaxTokensForQuestions, generateEmbedding, isGeminiAvailable, generateText, getModelInfo, getDiagnostic)
    
    // Pour la lisibilité du README, reportez-vous au code source complet dans le fichier OllamaService.java du projet.
}
```

Méthodes (tableau)

| Méthode | Rôle / Fonction | Paramètres | Retour | Exemple d'usage | Notes importantes |
|---|---|---:|---|---|---|
| generateRawResponse | Envoie un prompt brut à Gemini et retourne la chaîne complète | String prompt | String | generateRawResponse(prompt) | Gère sécurité et preview ; l'API key doit être configurée. |
| generateQuestions | Génère et parse des questions structurées à partir d'un prompt | String prompt, int questionCount | List<Question> | generateQuestions(prompt, 10) | Parse JSON renvoyé par l'IA, valide structure et options. |
| generateEmbedding | Demande un embedding pour un texte | String text | float[] | generateEmbedding("...text...") | Peut échouer si l'API d'embedding n'est pas disponible. |
| isGeminiAvailable | Vérifie la disponibilité du service Gemini | - | boolean | isGeminiAvailable() | Effectue un test de prompt simple. |
| generateText | Génère un texte simple depuis Gemini | String prompt | String | generateText("Hello") | Utilisé pour tests et health-checks. |
| getDiagnostic | Fournit un diagnostic basique du service | - | Map<String,Object> | getDiagnostic() | Contient état de configuration et test de connexion. |

---

<span style="color:#0d47a1;">InternshipService - Code Complet</span>

```java
package com.iatd.smarthub.service;

import com.iatd.smarthub.dto.InternshipRequestDTO;
import com.iatd.smarthub.dto.InternshipResponseDTO;
import com.iatd.smarthub.model.internship.Internship;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.InternshipRepository;
import com.iatd.smarthub.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class InternshipService {

    private static final Logger log = LoggerFactory.getLogger(InternshipService.class);

    private final InternshipRepository internshipRepository;
    private final UserRepository userRepository;
    private final UserService userService; // ✅ Ajout pour getUserEntityByUsername

    public InternshipService(InternshipRepository internshipRepository, UserRepository userRepository, UserService userService) {
        this.internshipRepository = internshipRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    // Méthodes CRUD et recherches (createInternship, getAllInternships, getInternshipById, getInternshipsByStudentUsername, getInternshipsBySupervisorUsername, getInternshipsByStudent, getInternshipsBySupervisor, getInternshipsByCompany, getInternshipsByStatus, getActiveInternships, updateInternship, deleteInternship, searchInternships)
    // Voir code source complet dans InternshipService.java
}
```

Méthodes (tableau)

| Méthode | Rôle / Fonction | Paramètres | Retour | Exemple d'usage | Notes importantes |
|---|---|---:|---|---|---|
| createInternship | Crée un stage et l'associe à un étudiant et superviseur | InternshipRequestDTO, String username | InternshipResponseDTO | createInternship(reqDto, "teacher1") | Si supervisorId absent, utilise l'enseignant connecté. |
| getAllInternships | Retourne tous les stages | - | List<InternshipResponseDTO> | getAllInternships() | Lecture seule. |
| getInternshipById | Récupère un stage par id | Long id | Optional<InternshipResponseDTO> | getInternshipById(5L) | - |
| updateInternship | Met à jour un stage (vérifie propriété) | Long id, InternshipRequestDTO, String username | InternshipResponseDTO | updateInternship(5L, dto, "teacher1") | Vérifie que l'utilisateur est superviseur ou ADMIN. |
| deleteInternship | Supprime un stage (vérifie propriété) | Long id, String username | void | deleteInternship(5L, "teacher1") | - |

---

<span style="color:#0d47a1;">FileStorageService - Code Complet</span>

```java
package com.iatd.smarthub.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    public String storeFile(MultipartFile file) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFileName = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }

        String fileName = UUID.randomUUID().toString() + fileExtension;

        Path targetLocation = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        return fileName;
    }

    public byte[] loadFile(String fileName) throws IOException {
        Path filePath = Paths.get(uploadDir).resolve(fileName);
        return Files.readAllBytes(filePath);
    }

    public void deleteFile(String fileName) throws IOException {
        Path filePath = Paths.get(uploadDir).resolve(fileName);
        Files.deleteIfExists(filePath);
    }

    public String getFileDownloadUrl(String fileName) {
        return "/api/v1/resources/files/" + fileName;
    }
}
```

Méthodes (tableau)

| Méthode | Rôle / Fonction | Paramètres | Retour | Exemple d'usage | Notes importantes |
|---|---|---:|---|---|---|
| storeFile | Sauvegarde un MultipartFile sur disque et retourne le nom unique | MultipartFile file | String (nom stocké) | storeFile(file) | Doit avoir `file.upload-dir` configuré. |
| loadFile | Lit un fichier en bytes | String fileName | byte[] | loadFile("abc.pdf") | Lève IOException si absent. |
| deleteFile | Supprime un fichier physique | String fileName | void | deleteFile("abc.pdf") | Silencieux si fichier absent. |
| getFileDownloadUrl | Construit URL de téléchargement | String fileName | String | getFileDownloadUrl("abc.pdf") | URL relative API.

---

<span style="color:#0d47a1;">EmailService - Code Complet</span>

```java
package com.iatd.smarthub.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;
    
    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;
    
    @Value("${spring.mail.username}")
    private String fromEmail;

    // Méthode simple pour envoyer du texte brut
    public void sendSimpleEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            
            mailSender.send(message);
            log.info("✅ Email envoyé à: {}", to);
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'envoi de l'email à {}: {}", to, e.getMessage());
        }
    }

    // Méthode spécifique pour la réinitialisation de mot de passe
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        try {
            String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
            
            String subject = "Réinitialisation de votre mot de passe - IATD SmartHub";
            String text = String.format(
                "Bonjour,\n\n" +
                "Vous avez demandé la réinitialisation de votre mot de passe.\n\n" +
                "Pour réinitialiser votre mot de passe, veuillez cliquer sur le lien suivant :\n" +
                "%s\n\n" +
                "Ce lien expirera dans 2 heures.\n\n" +
                "Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.\n\n" +
                "Cordialement,\n" +
                "L'équipe IATD SmartHub",
                resetLink
            );
            
            sendSimpleEmail(toEmail, subject, text);
            
            log.info("✉️ Email de réinitialisation envoyé à: {}", toEmail);
            log.debug("🔗 Lien de réinitialisation: {}", resetLink);
            
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'envoi de l'email de réinitialisation à {}: {}", toEmail, e.getMessage());
        }
    }
    
    // Méthode pour envoyer un email de bienvenue
    public void sendWelcomeEmail(String toEmail, String username) {
        String subject = "Bienvenue sur IATD SmartHub !";
        String text = String.format(
            "Bonjour %s,\n\n" +
            "Bienvenue sur la plateforme IATD SmartHub !\n\n" +
            "Votre compte a été créé avec succès.\n\n" +
            "Cordialement,\n" +
            "L'équipe IATD SmartHub",
            username
        );
        
        sendSimpleEmail(toEmail, subject, text);
        log.info("✉️ Email de bienvenue envoyé à: {}", toEmail);
    }
}
```

Méthodes (tableau)

| Méthode | Rôle / Fonction | Paramètres | Retour | Exemple d'usage | Notes importantes |
|---|---|---:|---|---|---|
| sendSimpleEmail | Envoie un email texte | String to, String subject, String text | void | sendSimpleEmail("a@b.com","Sujet","Texte") | Nécessite configuration SMTP et `spring.mail.*`. |
| sendPasswordResetEmail | Construit et envoie email reset | String toEmail, String resetToken | void | sendPasswordResetEmail("a@b.com", token) | Utilise `app.frontend-url` pour le lien. |
| sendWelcomeEmail | Envoie message de bienvenue | String toEmail, String username | void | sendWelcomeEmail("a@b.com","john") | Simple wrapper sur sendSimpleEmail. |

---

<span style="color:#0d47a1;">CustomUserDetailsService - Code Complet</span>

```java
package com.iatd.smarthub.service;

import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;

@Service
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.info("🔎 [CUSTOM_USER_DETAILS] Tentative de chargement de l'utilisateur: {}", username);
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.error("❌ [CUSTOM_USER_DETAILS] Utilisateur NON TROUVÉ: {}", username);
                    return new UsernameNotFoundException("Utilisateur non trouvé: " + username);
                });

        Collection<? extends GrantedAuthority> authorities = getAuthorities(user);

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                user.getUsername(), 
                user.getPassword(),
                authorities
        );

        log.info("✅ [CUSTOM_USER_DETAILS] UserDetails créé pour: {}", username);
        return userDetails;
    }

    private Collection<? extends GrantedAuthority> getAuthorities(User user) {
        String roleName = user.getRole().name();
        String springRole = "ROLE_" + roleName;
        return Collections.singletonList(new SimpleGrantedAuthority(springRole));
    }
    
    public void debugUser(String username) {
        try {
            UserDetails userDetails = loadUserByUsername(username);
            log.info("🔍 [DEBUG] UserDetails pour {}:", username);
            log.info("   - Username: {}", userDetails.getUsername());
            log.info("   - Authorities: {}", userDetails.getAuthorities());
        } catch (UsernameNotFoundException e) {
            log.error("❌ [DEBUG] Utilisateur {} non trouvé", username);
        }
    }
}
```

Méthodes (tableau)

| Méthode | Rôle / Fonction | Paramètres | Retour | Exemple d'usage | Notes importantes |
|---|---|---:|---|---|---|
| loadUserByUsername | Chargement Spring Security d'un utilisateur | String username | UserDetails | loadUserByUsername("john") | Joue un rôle central pour l'authentification. |
| getAuthorities | Convertit role en GrantedAuthority | User user | Collection<GrantedAuthority> | interne | Préfixe ROLE_. |
| debugUser | Méthode utilitaire de debug | String username | void | debugUser("john") | Appeler uniquement en dev.

---

<span style="color:#0d47a1;">CourseService - Code Complet</span>

```java
// CourseService.java (code complet, voir fichier source pour le détail)
// Ce service gère la gestion des cours, étudiants, fichiers et fournit des méthodes "getCourseWithAllDetails", add/remove students, file handling via FileStorageService.

// Voir le fichier source `CourseService.java` pour le code complet inclus dans le projet.
```

Méthodes (tableau) — synthèse

| Méthode | Rôle / Fonction | Paramètres | Retour | Exemple d'usage | Notes importantes |
|---|---|---:|---|---|---|
| addStudentToCourse | Ajoute un étudiant via requête native (évite collisions) | Long courseId, Long studentId | void | addStudentToCourse(5L,10L) | Utilise courseRepository.addStudentToCourseNative(...). |
| removeStudentFromCourse | Supprime un étudiant de la table de jointure | Long courseId, Long studentId | void | removeStudentFromCourse(5L,10L) | Appelle la query native de suppression. |
| getCourseWithDetails / getCompleteCourse | Charge teacher, students, files en gestion des relations | Long id | Course | getCompleteCourse(5L) | Utilise findByIdWithFiles/findByIdWithStudents etc. |
| createCourseWithFiles | Crée course et ajoute des fichiers | Course, List<MultipartFile>, User uploadedBy | Course | createCourseWithFiles(course, files, user) | Utilise FileStorageService. |
| isStudentInCourse | Vérifie inscription via native query | Long courseId, Long userId | boolean | isStudentInCourse(5L,10L) | Retourne true si present.

---

<span style="color:#0d47a1;">CourseFileService - Code Complet</span>

```java
// CourseFileService.java (voir source pour code complet)
// Gère l'upload/download/suppression des fichiers liés aux cours et contrôle d'accès de l'enseignant.
```

Méthodes (tableau)

| Méthode | Rôle / Fonction | Paramètres | Retour | Exemple d'usage | Notes importantes |
|---|---|---:|---|---|---|
| uploadFile | Upload et crée CourseFile | Long courseId, Long teacherId, MultipartFile file | CourseFile | uploadFile(5L,2L,file) | Vérifie que le teacher est propriétaire du cours. |
| getFilesByCourseId | Récupère files with uploader | Long courseId | List<CourseFile> | getFilesByCourseId(5L) | Utilise findByCourseIdWithUploader. |
| deleteFile | Supprime fichier physique et DB | Long fileId, Long teacherId | void | deleteFile(8L,2L) | Vérifie propriétaire, supprime physiquement. |
| getFile | Récupère CourseFile par id | Long fileId | CourseFile | getFile(8L) | - |

---

<span style="color:#0d47a1;">AuthService - Code Complet</span>

```java
package com.iatd.smarthub.service;

import com.iatd.smarthub.config.JwtUtil;
import com.iatd.smarthub.dto.AuthRequest;
import com.iatd.smarthub.dto.AuthResponse;
import com.iatd.smarthub.dto.RegisterRequest;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Slf4j
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    public AuthResponse register(RegisterRequest registerRequest) {
        log.debug("Début de l'inscription pour: {}", registerRequest.getUsername());

        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new RuntimeException("Nom d'utilisateur déjà utilisé");
        }
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Email déjà utilisé");
        }

        if (registerRequest.getPassword() == null || registerRequest.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Le mot de passe est requis");
        }

        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setFirstName(registerRequest.getFirstName());
        user.setLastName(registerRequest.getLastName());
        user.setPhoneNumber(registerRequest.getPhoneNumber());
        user.setRole(registerRequest.getRole() != null ? registerRequest.getRole() : User.Role.STUDENT);
        user.setActive(true);

        LocalDateTime now = LocalDateTime.now();
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        User savedUser = userRepository.save(user);

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(savedUser.getUsername());
        String token = jwtUtil.generateToken(userDetails);

        return new AuthResponse(token, savedUser.getUsername(), savedUser.getRole().name());
    }

    public AuthResponse login(AuthRequest authRequest) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
        );

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(authRequest.getUsername());
        String token = jwtUtil.generateToken(userDetails);

        User user = userRepository.findByUsername(authRequest.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        return new AuthResponse(token, user.getUsername(), user.getRole().name());
    }
}
```

Méthodes (tableau)

| Méthode | Rôle / Fonction | Paramètres | Retour | Exemple d'usage | Notes importantes |
|---|---|---:|---|---|---|
| register | Inscription d'un nouvel utilisateur (encode mot de passe) | RegisterRequest | AuthResponse | register(req) | Encode le mot de passe via PasswordEncoder. |
| login | Authentifie et retourne JWT | AuthRequest | AuthResponse | login(req) | Met à jour lastLogin et génère token via JwtUtil. |

---

<span style="color:#0d47a1;">AssignmentSubmissionService - Code Complet</span>

```java
// assignment placeholders
package com.iatd.smarthub.service;

public class AssignmentSubmissionService {

}
```

Méthodes (tableau)

| Méthode | Rôle / Fonction | Paramètres | Retour | Exemple d'usage | Notes importantes |
|---|---|---:|---|---|---|
| (placeholder) | Fichier actuellement vide | - | - | - | À implémenter : transformer en interface/impl selon entités Assignment/Submission.

---

<span style="color:#0d47a1;">AssignmentService - Code Complet</span>

```java
package com.iatd.smarthub.service;

public class AssignmentService {

}
```

Méthodes (tableau)

| Méthode | Rôle / Fonction | Paramètres | Retour | Exemple d'usage | Notes importantes |
|---|---|---:|---|---|---|
| (placeholder) | Fichier actuellement vide | - | - | - | À implémenter : transformer en service complet.

---

<span style="color:#0d47a1;">AnnouncementService - Code Complet</span>

```java
// src/main/java/com/iatd/smarthub/service/AnnouncementService.java
package com.iatd.smarthub.service;

import com.iatd.smarthub.dto.AnnouncementRequestDTO;
import com.iatd.smarthub.dto.AnnouncementResponseDTO;
import com.iatd.smarthub.model.announcement.Announcement;
import com.iatd.smarthub.model.announcement.AnnouncementType;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.repository.AnnouncementRepository;
import com.iatd.smarthub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;

    // createAnnouncement, getAllAnnouncements, getAnnouncementById, getAnnouncementsByAuthorUsername, getAnnouncementsByAuthor, getAnnouncementsByType, getPublishedAnnouncements, getRecentAnnouncements, getAnnouncementsByTypeAndPublished, updateAnnouncement, deleteAnnouncement, searchAnnouncements, togglePublishStatus
    // Voir le code source complet dans AnnouncementService.java
}
```

Méthodes (tableau)

| Méthode | Rôle / Fonction | Paramètres | Retour | Exemple d'usage | Notes importantes |
|---|---|---:|---|---|---|
| createAnnouncement | Crée une annonce (vérifie rôle) | AnnouncementRequestDTO, String username | AnnouncementResponseDTO | createAnnouncement(dto, "teacher1") | Empêche STUDENT de créer. |
| getAllAnnouncements | Liste toutes les annonces | - | List<AnnouncementResponseDTO> | getAllAnnouncements() | - |
| updateAnnouncement | Met à jour une annonce (vérifie propriété) | Long id, AnnouncementRequestDTO, String username | AnnouncementResponseDTO | updateAnnouncement(5L, dto, "author") | Vérifie auteur ou ADMIN. |
| deleteAnnouncement | Supprime une annonce (vérifie propriété) | Long id, String username | void | deleteAnnouncement(5L, "author") | Vérifie auteur ou ADMIN. |
| togglePublishStatus | Bascule statut publié | Long id, String username | AnnouncementResponseDTO | togglePublishStatus(5L, "author") | Vérifie auteur ou ADMIN. |

---




# Vue globale des repositories

Cette  partie présente une vue d'ensemble des repositories du projet SmartHub : pour chaque repository vous trouverez un titre , un tableau décrivant les méthodes publiques/queries disponibles, le code source complet de la classe/interface, puis une courte conclusion sur la section repository.

---

<!-- NOTE: Titres en bleu -->

## <span style="color:blue">CourseRepository</span>

Table des méthodes

| Méthode / Query | Description |
|---|---|
| findAllWithTeacher() | Charge tous les cours en join fetch avec leur teacher (optimisation pour éviter N+1). |
| findByIdWithTeacher(Long id) | Charge un cours précis avec son teacher (join fetch). |
| findByTeacherIdWithStudents(Long teacherId) | Liste les cours d'un teacher en joignant les students et le teacher (distinct). |
| findByIdWithStudents(Long id) | Charge un cours avec ses étudiants (left join fetch). |
| findByIdWithTeacherAndStudents(Long id) | Charge un cours avec teacher et students (distinct). |
| findByIdWithFiles(Long id) | Charge un cours avec ses fichiers et uploader. |
| findByTeacherId(Long teacherId) | Find by teacher id. |
| findByTitleContainingIgnoreCase(String title) | Recherche par titre insensible à la casse. |
| findByTeacherUsername(String username) | Recherche des cours par username du teacher. |
| findStudentsByCourseId(Long courseId) | Retourne la liste des students d'un cours. |
| existsByStudentsIdAndId(Long studentId, Long courseId) | Vérifie si un étudiant est déjà dans le cours. |
| findByIdWithStudentsForUpdate(Long courseId) | Version de fetch pour update. |
| addStudentToCourseNative(Long courseId, Long studentId) | Insert natif dans la table de jointure (Modifying). |
| existsInCourseStudents(Long courseId, Long studentId) | Vérifie présence via native query (retour Integer 1/0). |
| countStudentInCourse(Long courseId, Long studentId) | Compte le nombre d'entrées dans la table de jointure (debug). |
| removeStudentFromCourseNative(Long courseId, Long studentId) | Supprime natif de la table de jointure. |
| addStudentIfNotExists(Long courseId, Long studentId) | Insert ignore (native) - optionnel selon SGBD. |
| findByIdWithStudentsEager(Long courseId) | Fetch eager des students pour un id. |
| countStudentsByCourseIdNative(Long courseId) | Compte natif le nombre d'étudiants pour un cours. |
| findCoursesByStudentId(Long studentId) | Trouve les cours où est inscrit un student. |

Code de la classe (CourseRepository.java)

```java
package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.course.Course;
import com.iatd.smarthub.model.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    
    // ✅ CHARGER TOUS LES COURS AVEC TEACHER
    @Query("SELECT c FROM Course c JOIN FETCH c.teacher")
    List<Course> findAllWithTeacher();
    
    // ✅ CHARGER UN COURS AVEC TEACHER
    @Query("SELECT c FROM Course c JOIN FETCH c.teacher WHERE c.id = :id")
    Optional<Course> findByIdWithTeacher(Long id);
    
    // AJOUTE CETTE MÉTHODE
    @Query("SELECT DISTINCT c FROM Course c " +
           "LEFT JOIN FETCH c.students " +
           "LEFT JOIN FETCH c.teacher " +
           "WHERE c.teacher.id = :teacherId")
    List<Course> findByTeacherIdWithStudents(@Param("teacherId") Long teacherId);
    
    // ✅ CHARGER UN COURS AVEC ÉTUDIANTS
    @Query("SELECT c FROM Course c LEFT JOIN FETCH c.students WHERE c.id = :id")
    Optional<Course> findByIdWithStudents(Long id);
    
    // ✅ CHARGER UN COURS AVEC TEACHER ET ÉTUDIANTS
    @Query("SELECT DISTINCT c FROM Course c " +
           "LEFT JOIN FETCH c.teacher " +
           "LEFT JOIN FETCH c.students " +
           "WHERE c.id = :id")
    Optional<Course> findByIdWithTeacherAndStudents(Long id);

    @Query("SELECT DISTINCT c FROM Course c " +
           "LEFT JOIN FETCH c.files f " +
           "LEFT JOIN FETCH f.uploadedBy " +
           "WHERE c.id = :id")
    Optional<Course> findByIdWithFiles(@Param("id") Long id);
    
    List<Course> findByTeacherId(Long teacherId);
    List<Course> findByTitleContainingIgnoreCase(String title);
    
    @Query("SELECT c FROM Course c JOIN c.teacher t WHERE t.username = :username")
    List<Course> findByTeacherUsername(@Param("username") String username);
    
    @Query("SELECT s FROM Course c JOIN c.students s WHERE c.id = :courseId")
    List<User> findStudentsByCourseId(@Param("courseId") Long courseId);
    
    boolean existsByStudentsIdAndId(Long studentId, Long courseId);
    
    @Query("SELECT DISTINCT c FROM Course c " +
           "LEFT JOIN FETCH c.students " +
           "WHERE c.id = :courseId")
    Optional<Course> findByIdWithStudentsForUpdate(@Param("courseId") Long courseId);
    
    // ✅ CORRECTION : MÉTHODES NATIVES POUR LA TABLE DE JOINTURE
    
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO course_students (course_id, student_id) VALUES (:courseId, :studentId)", 
           nativeQuery = true)
    void addStudentToCourseNative(@Param("courseId") Long courseId, 
                                 @Param("studentId") Long studentId);
    
    @Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM course_students WHERE course_id = :courseId AND student_id = :studentId", 
    	       nativeQuery = true)
    	Integer existsInCourseStudents(@Param("courseId") Long courseId, 
    	                               @Param("studentId") Long studentId);
    
    // Méthode alternative qui retourne un Long (pour debug)
    @Query(value = "SELECT COUNT(*) FROM course_students WHERE course_id = :courseId AND student_id = :studentId", 
           nativeQuery = true)
    Long countStudentInCourse(@Param("courseId") Long courseId, 
                             @Param("studentId") Long studentId);
    
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM course_students WHERE course_id = :courseId AND student_id = :studentId", 
           nativeQuery = true)
    void removeStudentFromCourseNative(@Param("courseId") Long courseId, 
                                      @Param("studentId") Long studentId);
    
    // ✅ OPTIONNEL : Méthode pour éviter les doublons
    @Modifying
    @Transactional
    @Query(value = "INSERT IGNORE INTO course_students (course_id, student_id) VALUES (:courseId, :studentId)", 
           nativeQuery = true)
    void addStudentIfNotExists(@Param("courseId") Long courseId, \n                              @Param("studentId") Long studentId);
    
 // AJOUTEZ CETTE MÉTHODE
    @Query("SELECT DISTINCT c FROM Course c " +
           "LEFT JOIN FETCH c.students s " +
           "WHERE c.id = :courseId")
    Optional<Course> findByIdWithStudentsEager(@Param("courseId") Long courseId);
    
    @Query(value = "SELECT COUNT(*) FROM course_students WHERE course_id = :courseId", 
    	       nativeQuery = true)
    	Long countStudentsByCourseIdNative(@Param("courseId") Long courseId);
    
    @Query("""
    	    SELECT c FROM Course c
    	    JOIN c.students s
    	    WHERE s.id = :studentId
    	""")
    	List<Course> findCoursesByStudentId(@Param("studentId") Long studentId);
}
```

Conclusion

CourseRepository fournit des méthodes avancées pour charger les relations communes (teacher, students, files) en évitant l'effet N+1 et contient des opérations natives pratiques pour manipuler la table de jointure course_students.

---

## <span style="color:blue">CourseFileRepository</span>

Table des méthodes

| Méthode | Description |
|---|---|
| findByCourseId(Long courseId) | Liste les fichiers associés à un cours. |
| findByIdAndCourseId(Long id, Long courseId) | Trouve un fichier par id et cours. |
| findByCourseIdWithUploader(Long courseId) | Charge les fichiers avec l'utilisateur qui a uploadé (join fetch). |
| deleteByCourseId(Long courseId) | Supprime les fichiers d'un cours. |
| countByCourseId(Long courseId) | Compte les fichiers d'un cours. |

Code (CourseFileRepository.java)

```java
package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.course.CourseFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface CourseFileRepository extends JpaRepository<CourseFile, Long> {
    
    List<CourseFile> findByCourseId(Long courseId);
    
    Optional<CourseFile> findByIdAndCourseId(Long id, Long courseId);
    
    @Query("SELECT cf FROM CourseFile cf JOIN FETCH cf.uploadedBy WHERE cf.course.id = :courseId")
    List<CourseFile> findByCourseIdWithUploader(@Param("courseId") Long courseId);
    
    void deleteByCourseId(Long courseId);
    
    @Query("SELECT COUNT(f) FROM CourseFile f WHERE f.course.id = :courseId")
    Long countByCourseId(@Param("courseId") Long courseId);
}
```

Conclusion

Repository simple et focalisé sur la gestion des fichiers de cours, avec quelques requêtes optimisées pour récupérer l'uploader et des opérations pratiques de suppression et de comptage.

---

## <span style="color:blue">ResourceRepository</span>

Table des méthodes

| Méthode | Description |
|---|---|
| searchByTitleOrAbstract(String query) | Recherche sur le titre ou l'abstract (insensible à la casse). |
| findByAuthorId(Long authorId) | Trouve les ressources par auteur. |
| findByType(Resource.ResourceType type) | Filtre par type de ressource. |
| findByPublicationYear(int year) | Recherche par année (JPQL YEAR()). |
| findAllWithAuthors() | Charge toutes les ressources avec leurs auteurs (fetch). |
| findByIdWithAuthors(Long id) | Charge une ressource avec ses auteurs. |
| findAllWithAuthorsByIds(List<Long> ids) | Charge plusieurs ressources par ids avec auteurs. |

Code (ResourceRepository.java)

```java
package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.resource.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    // Recherche par titre ou résumé
    @Query("SELECT r FROM Resource r WHERE LOWER(r.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(r.abstractText) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Resource> searchByTitleOrAbstract(@Param("query") String query);

    // Trouver les ressources par auteur
    @Query("SELECT r FROM Resource r JOIN r.authors a WHERE a.id = :authorId")
    List<Resource> findByAuthorId(@Param("authorId") Long authorId);

    // Trouver les ressources par type
    List<Resource> findByType(Resource.ResourceType type);

    // Trouver les ressources par année de publication
    @Query("SELECT r FROM Resource r WHERE YEAR(r.publicationDate) = :year")
    List<Resource> findByPublicationYear(@Param("year") int year);
    
 // AJOUTER CES MÉTHODES
    @Query("SELECT r FROM Resource r LEFT JOIN FETCH r.authors")
    List<Resource> findAllWithAuthors();

    @Query("SELECT r FROM Resource r LEFT JOIN FETCH r.authors WHERE r.id = :id")
    Optional<Resource> findByIdWithAuthors(Long id);

    @Query("SELECT r FROM Resource r LEFT JOIN FETCH r.authors WHERE r.id IN :ids")
    List<Resource> findAllWithAuthorsByIds(@Param("ids") List<Long> ids);
}
```

Conclusion

ResourceRepository propose des recherches textuelles et des fetchs pour auteurs, utiles pour afficher des listes et détails de ressources sans surcharger la base par des requêtes additionnelles.

---

## <span style="color:blue">UserRepository</span>

Table des méthodes

| Méthode | Description |
|---|---|
| findByEmail(String email) | Trouve un utilisateur par email. |
| findByUsername(String username) | Trouve par username. |
| existsByEmail(String email) | Vérifie existence par email. |
| existsByUsername(String username) | Vérifie existence par username. |
| findByRole(User.Role role) | Liste d'utilisateurs par rôle. |
| findByActiveTrue() | Liste utilisateurs actifs. |
| countByActiveTrue() | Compte utilisateurs actifs. |
| countActiveUsers() | Même chose via Query explicite. |
| countByRole(User.Role role) | Compte par rôle. |
| countByCreatedAtAfter(LocalDateTime date) | Compte créés après une date. |
| findByResetToken(String resetToken) | Recherche par token reset. |
| findByEmailOrUsername(String email, String username) | Recherche par email ou username. |
| findStudentsBySearchQuery(String query) | Recherche spécifique aux students (JPQL). |
| findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(...) | Recherche par nom/prénom partiel. |
| findByRoleAndActiveTrue(User.Role role) | Trouve par rôle et actif. |
| findUserRoleById(Long userId) | Native query retourne role (string). |
| findUsernameById(Long userId) | Native query retourne username. |

Code (UserRepository.java)

```java
package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Boolean existsByEmail(String email);

    Boolean existsByUsername(String username);

    List<User> findByRole(User.Role role);

    List<User> findByActiveTrue();
    
    long countByActiveTrue();
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.active = true")
    long countActiveUsers();
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countByRole(@Param("role") User.Role role);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt > :date")
    long countByCreatedAtAfter(@Param("date") LocalDateTime date);
    
    Optional<User> findByResetToken(String resetToken);
    
    @Query("SELECT u FROM User u WHERE u.email = :email OR u.username = :username")
    Optional<User> findByEmailOrUsername(@Param("email") String email, 
                                        @Param("username") String username);
     
    @Query("""
        SELECT u FROM User u 
        WHERE u.role = 'STUDENT' 
        AND (LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) 
             OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :query, '%')) 
             OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :query, '%')) 
             OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')))
    """)
    List<User> findStudentsBySearchQuery(@Param("query") String query);
    
    // Méthodes supplémentaires utiles
    List<User> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            String firstName, String lastName);
    
    List<User> findByRoleAndActiveTrue(User.Role role);
    
 // Dans UserRepository.java, ajoutez :

    @Query(value = "SELECT role FROM users WHERE id = :userId", nativeQuery = true)
    String findUserRoleById(@Param("userId") Long userId);

    @Query(value = "SELECT username FROM users WHERE id = :userId", nativeQuery = true)
    String findUsernameById(@Param("userId") Long userId);
}
```

Conclusion

UserRepository contient la plupart des méthodes nécessaires pour l'authentification, la recherche et les statistiques utilisateurs, incluant des requêtes JPQL et natales pour des accès optimisés.

---

## <span style="color:blue">UserInteractionRepository</span>

Table des méthodes

| Méthode | Description |
|---|---|
| findByUser_IdOrderByInteractedAtDesc(Long userId) | Liste les interactions d'un utilisateur triées par date (desc). |
| findByUser_IdAndInteractionTypeIn(Long userId, List<...> types) | Filtre par types d'interaction. |
| countByUser_Id(Long userId) | Compte les interactions d'un utilisateur. |
| existsByUser_IdAndResourceId(Long userId, Long resourceId) | Vérifie si interaction existe. |
| findRecentInteractionsByUser(Long userId, LocalDateTime since) | Requêtes récentes avec JPQL. |
| findRecentInteractionsByUserAndResourceType(...) | Requêtes filtrées par type de ressource. |
| findSimilarUsers(Long userId, LocalDateTime since) | Recherche d'utilisateurs similaires (JPQL corrigé). |
| findPopularResources(...) | Agrégation pour popularité. |
| countByUser_IdAndResourceTypeAndInteractionType(...) | Statistiques par type. |
| getUserInteractionPatterns(...) | Agrégation par resourceType & interactionType. |
| findByResourceTypeAndResourceId(...) | Liste interactions pour ressource. |
| findByUser_IdAndResourceTypeAndResourceId(...) | Filtre combiné. |

Code (UserInteractionRepository.java)

```java
package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.interaction.UserInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserInteractionRepository extends JpaRepository<UserInteraction, Long> {

    // ========= BASE =========

    List<UserInteraction> findByUser_IdOrderByInteractedAtDesc(Long userId);

    List<UserInteraction> findByUser_IdAndInteractionTypeIn(
            Long userId,
            List<UserInteraction.InteractionType> types
    );

    long countByUser_Id(Long userId);

    boolean existsByUser_IdAndResourceId(Long userId, Long resourceId);

    // ========= RÉCENT =========

    @Query("""
        SELECT ui FROM UserInteraction ui
        WHERE ui.user.id = :userId
          AND ui.interactedAt >= :since
        ORDER BY ui.interactedAt DESC
    """)
    List<UserInteraction> findRecentInteractionsByUser(
            @Param("userId") Long userId,
            @Param("since") LocalDateTime since
    );

    @Query("""
        SELECT ui FROM UserInteraction ui
        WHERE ui.user.id = :userId
          AND ui.resourceType = :resourceType
          AND ui.interactedAt >= :since
    """)
    List<UserInteraction> findRecentInteractionsByUserAndResourceType(
            @Param("userId") Long userId,
            @Param("resourceType") UserInteraction.ResourceType resourceType,
            @Param("since") LocalDateTime since
    );

    // ========= SIMILARITÉ UTILISATEURS =========
    // VERSION CORRIGÉE - JPQL au lieu de SQL natif

    @Query("""
        SELECT DISTINCT ui2.user.id
        FROM UserInteraction ui1
        JOIN UserInteraction ui2 ON ui1.resourceId = ui2.resourceId
        WHERE ui1.user.id = :userId
          AND ui2.user.id != :userId
          AND ui1.interactedAt >= :since
    """)
    List<Long> findSimilarUsers(
            @Param("userId") Long userId,
            @Param("since") LocalDateTime since
    );

    // ========= POPULARITÉ =========

    @Query("""
        SELECT ui.resourceId, COUNT(ui.id)
        FROM UserInteraction ui
        WHERE ui.resourceType = :resourceType
          AND ui.interactionType IN :interactionTypes
          AND ui.interactedAt >= :since
        GROUP BY ui.resourceId
        ORDER BY COUNT(ui.id) DESC
    """)
    List<Object[]> findPopularResources(
            @Param("resourceType") UserInteraction.ResourceType resourceType,
            @Param("interactionTypes") List<UserInteraction.InteractionType> interactionTypes,
            @Param("since") LocalDateTime since
    );

    // ========= STATISTIQUES =========

    long countByUser_IdAndResourceTypeAndInteractionType(
            Long userId,
            UserInteraction.ResourceType resourceType,
            UserInteraction.InteractionType interactionType
    );

    long countByResourceTypeAndResourceIdAndInteractionType(
            UserInteraction.ResourceType resourceType,
            Long resourceId,
            UserInteraction.InteractionType interactionType
    );

    // ========= ANALYSE =========

    @Query("""
        SELECT ui.resourceType, ui.interactionType, COUNT(ui.id)
        FROM UserInteraction ui
        WHERE ui.user.id = :userId
          AND ui.interactedAt >= :since
        GROUP BY ui.resourceType, ui.interactionType
    """)
    List<Object[]> getUserInteractionPatterns(
            @Param("userId") Long userId,
            @Param("since") LocalDateTime since
    );

    // ========= MÉTHODES UTILES SUPPLEMENTAIRES =========

    List<UserInteraction> findByResourceTypeAndResourceId(
            UserInteraction.ResourceType resourceType,
            Long resourceId
    );

    List<UserInteraction> findByUser_IdAndResourceTypeAndResourceId(
            Long userId,
            UserInteraction.ResourceType resourceType,
            Long resourceId
    );

}
```

Conclusion

Repository riche en requêtes analytiques et agrégations, utile pour recommandations, popularité et analyse comportementale.

---

## <span style="color:blue">QuizRepository</span>

Table des méthodes

| Méthode | Description |
|---|---|
| findByActiveTrue() / findByActiveFalse() | Filtre par statut actif. |
| findByTitleContainingIgnoreCase(String title) | Recherche par titre. |
| existsByTitleAndIdNot(String title, Long id) | Vérifie unique title hors id donné (update). |
| existsByTitle(String title) | Vérifie existence de titre. |
| findAllActiveQuizSummaries() / findAllQuizSummaries() | JPQL construisant QuizSummaryDTO pour listes légères. |
| countActiveQuizzes() | Compte quizzes actifs. |
| countQuestionsByQuizId(Long quizId) | Compte questions d'un quiz. |
| findByIdWithQuestions(Long id) | Fetch questions & options via EntityGraph. |
| findAllWithDetails() | Fetch questions, options et course (EntityGraph). |
| findByCourseId(Long courseId) | Liste par course. |
| countCompletedAttempts(Long quizId) | Compte tentatives complétées (JPQL). |
| getAverageScore(Long quizId) | Moyenne des scores complétés. |
| findAllByActiveWithQuestions(boolean active) | Liste par active avec questions. |

Code (QuizRepository.java)

```java
package com.iatd.smarthub.repository;

import com.iatd.smarthub.dto.QuizSummaryDTO;
import com.iatd.smarthub.model.quiz.Quiz;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {

    // === FINDERS DE BASE ===
    List<Quiz> findByActiveTrue();

    List<Quiz> findByActiveFalse();

    List<Quiz> findByTitleContainingIgnoreCase(String title);

    // === EXISTS CHECKS ===
    boolean existsByTitleAndIdNot(String title, Long id);

    boolean existsByTitle(String title);

    // === QUIZ SUMMARIES (Pour les listes légères) - OPTIMISÉ ===
    @Query("SELECT new com.iatd.smarthub.dto.QuizSummaryDTO(" +
            "q.id, q.title, q.description, q.active, q.createdAt, " +
            "(SELECT COUNT(qu) FROM Question qu WHERE qu.quiz.id = q.id)) " +
            "FROM Quiz q " +
            "WHERE q.active = true " +
            "ORDER BY q.createdAt DESC")
    List<QuizSummaryDTO> findAllActiveQuizSummaries();

    @Query("SELECT new com.iatd.smarthub.dto.QuizSummaryDTO(" +
            "q.id, q.title, q.description, q.active, q.createdAt, " +
            "(SELECT COUNT(qu) FROM Question qu WHERE qu.quiz.id = q.id)) " +
            "FROM Quiz q " +
            "ORDER BY q.createdAt DESC")
    List<QuizSummaryDTO> findAllQuizSummaries();

    // === COUNT METHODS ===
    @Query("SELECT COUNT(q) FROM Quiz q WHERE q.active = true")
    Long countActiveQuizzes();

    @Query("SELECT COUNT(qu) FROM Question qu WHERE qu.quiz.id = :quizId")
    Integer countQuestionsByQuizId(@Param("quizId") Long quizId);

    // === FIND WITH QUESTIONS EAGERLY - CORRIGÉ AVEC ENTITYGRAPH ===
    @EntityGraph(attributePaths = {"questions", "questions.options"})
    @Query("SELECT q FROM Quiz q WHERE q.id = :id")
    Optional<Quiz> findByIdWithQuestions(@Param("id") Long id);
    
    // === NOUVELLE MÉTHODE : FETCH TOUT EN UNE SEULE REQUÊTE ===
    @EntityGraph(attributePaths = {"questions", "questions.options", "course"})
    @Query("SELECT DISTINCT q FROM Quiz q")
    List<Quiz> findAllWithDetails();
    
    // Pour la relation avec Course
    @Query("SELECT q FROM Quiz q WHERE q.course.id = :courseId")
    List<Quiz> findByCourseId(@Param("courseId") Long courseId);

    // Pour les statistiques
    @Query("SELECT COUNT(qa) FROM QuizAttempt qa WHERE qa.quiz.id = :quizId AND qa.status = 'COMPLETED'")
    Long countCompletedAttempts(@Param("quizId") Long quizId);

    @Query("SELECT AVG(qa.score) FROM QuizAttempt qa WHERE qa.quiz.id = :quizId AND qa.status = 'COMPLETED'")
    Double getAverageScore(@Param("quizId") Long quizId);
    
    // === NOUVELLE : POUR FETCH TOUS LES QUIZZES AVEC QUESTIONS (POUR ADMIN) ===
    @EntityGraph(attributePaths = {"questions"})
    @Query("SELECT DISTINCT q FROM Quiz q WHERE q.active = :active")
    List<Quiz> findAllByActiveWithQuestions(@Param("active") boolean active);
}
```

Conclusion

QuizRepository est optimisé pour l'affichage (DTOs résumé), la récupération eager des questions/options, et fournit des statistiques utiles pour le tableau de bord.

---

## <span style="color:blue">QuizAttemptRepository</span>

Table des méthodes

| Méthode | Description |
|---|---|
| findByStudent(User student) | Liste tentatives par étudiant. |
| findByQuiz(Quiz quiz) | Liste tentatives par quiz. |
| findByStudentAndQuiz(User student, Quiz quiz) | Tentatives pour un étudiant & quiz. |
| findByStatus(AttemptStatus status) | Filtre par status. |
| findByStudentAndCourse(User student, Course course) | Tentatives par étudiant & cours. |
| findLastAttemptByStudentAndCourse(User student, Course course) | Dernière tentative (limit 1). |
| countByStudentAndCourseAndDateRange(...) | Compte tentatives dans période. |
| countByStudentAndCourse(User student, Course course) | Compte tentatives. |
| findByIdWithDetails(Long id) | Fetch student, quiz, answers. |
| findByStudentIdWithDetails(Long studentId) | Fetch par student id. |
| countByStudent / countByQuiz / countByStudentAndQuiz | Comptes. |
| findAverageScoreByQuizId / findMaxScoreByQuizId / countCompletedAttemptsByQuizId | Statistiques. |
| findInProgressAttempt(Long studentId, Long quizId) | Trouve tentative en cours. |
| findRecentCompletedAttemptsByStudent(Long studentId, int limit) | Dernières tentatives complétées. |

Code (QuizAttemptRepository.java)

```java
package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.quiz.QuizAttempt;
import com.iatd.smarthub.model.quiz.QuizAttempt.AttemptStatus;
import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.model.course.Course;
import com.iatd.smarthub.model.quiz.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    // === FINDERS DE BASE ===
    List<QuizAttempt> findByStudent(User student);
    List<QuizAttempt> findByQuiz(Quiz quiz);
    List<QuizAttempt> findByStudentAndQuiz(User student, Quiz quiz);
    List<QuizAttempt> findByStatus(AttemptStatus status);
    
    // ✅ NOUVEAU : Trouver par cours
    List<QuizAttempt> findByStudentAndCourse(User student, Course course);
    
    // ✅ NOUVEAU : Dernière tentative par cours
    @Query("SELECT qa FROM QuizAttempt qa WHERE qa.student = :student AND qa.course = :course ORDER BY qa.completedAt DESC LIMIT 1")
    Optional<QuizAttempt> findLastAttemptByStudentAndCourse(@Param("student") User student, @Param("course") Course course);
    
    // ✅ NOUVEAU : Compter les tentatives par jour
    @Query("SELECT COUNT(qa) FROM QuizAttempt qa WHERE qa.student = :student AND qa.course = :course AND qa.attemptedAt BETWEEN :start AND :end")
    Integer countByStudentAndCourseAndDateRange(
        @Param("student") User student,
        @Param("course") Course course,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );
    
    // ✅ NOUVEAU : Compter les tentatives par cours
    @Query("SELECT COUNT(qa) FROM QuizAttempt qa WHERE qa.student = :student AND qa.course = :course")
    Integer countByStudentAndCourse(@Param("student") User student, @Param("course") Course course);

    // === FIND WITH RELATIONS EAGERLY ===
    @Query("SELECT qa FROM QuizAttempt qa " +
            "LEFT JOIN FETCH qa.student " +
            "LEFT JOIN FETCH qa.quiz " +
            "LEFT JOIN FETCH qa.answers " +
            "WHERE qa.id = :id")
    Optional<QuizAttempt> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT qa FROM QuizAttempt qa " +
            "LEFT JOIN FETCH qa.student " +
            "LEFT JOIN FETCH qa.quiz " +
            "WHERE qa.student.id = :studentId " +
            "ORDER BY qa.attemptedAt DESC")
    List<QuizAttempt> findByStudentIdWithDetails(@Param("studentId") Long studentId);

    // === COUNT METHODS ===
    Long countByStudent(User student);
    Long countByQuiz(Quiz quiz);
    Long countByStudentAndQuiz(User student, Quiz quiz);
    Long countByQuizAndStatus(Quiz quiz, AttemptStatus status);
    
    @Query("SELECT COUNT(qa) FROM QuizAttempt qa WHERE qa.createdAt > :date")
    long countByCreatedAtAfter(@Param("date") LocalDateTime date);

    // === STATISTICS ===
    @Query("SELECT AVG(qa.score) FROM QuizAttempt qa WHERE qa.quiz.id = :quizId AND qa.status = 'COMPLETED'")
    Double findAverageScoreByQuizId(@Param("quizId") Long quizId);

    @Query("SELECT MAX(qa.score) FROM QuizAttempt qa WHERE qa.quiz.id = :quizId AND qa.status = 'COMPLETED'")
    Double findMaxScoreByQuizId(@Param("quizId") Long quizId);

    @Query("SELECT COUNT(qa) FROM QuizAttempt qa WHERE qa.quiz.id = :quizId AND qa.status = 'COMPLETED'")
    Long countCompletedAttemptsByQuizId(@Param("quizId") Long quizId);

    // === FIND INCOMPLETE ATTEMPTS ===
    @Query("SELECT qa FROM QuizAttempt qa WHERE qa.student.id = :studentId AND qa.quiz.id = :quizId AND qa.status = 'IN_PROGRESS'")
    Optional<QuizAttempt> findInProgressAttempt(@Param("studentId") Long studentId, @Param("quizId") Long quizId);

    // === FIND LATEST ATTEMPTS ===
    @Query("SELECT qa FROM QuizAttempt qa " +
            "WHERE qa.student.id = :studentId " +
            "AND qa.status = 'COMPLETED' " +
            "ORDER BY qa.completedAt DESC " +
            "LIMIT :limit")
    List<QuizAttempt> findRecentCompletedAttemptsByStudent(@Param("studentId") Long studentId,
            @Param("limit") int limit);
}
```

Conclusion

QuizAttemptRepository offre de nombreuses méthodes pour l'historique des tentatives, analyses temporelles et statistiques de performance, ainsi que des fetchs pour éviter des chargements paresseux.

---

## <span style="color:blue">QuestionRepository</span>

Table des méthodes

| Méthode | Description |
|---|---|
| findByQuiz(Quiz quiz) / findByQuizId(Long quizId) | Récupère les questions d'un quiz. |
| findByType(QuestionType type) | Filtre par type de question. |
| findByQuizAndType(Quiz quiz, QuestionType type) | Filtre combiné. |
| existsByQuizAndTextIgnoreCase(Quiz quiz, String text) | Vérifie doublon de question. |
| countByQuiz(Quiz quiz) / countByQuizId(Long quizId) | Comptes. |
| findByIdWithOptions(Long id) | Fetch options d'une question. |
| findByQuizIdWithOptions(Long quizId) | Fetch options pour un quiz. |
| findQuestionsWithoutCorrectAnswersByQuizId(Long quizId) | Pour quiz attempts: retourne Question sans correctAnswer. |
| findCorrectAnswersByQuestionIds(List<Long> questionIds) | Batch récup des bonnes réponses. |

Code (QuestionRepository.java)

```java
package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.quiz.Question;
import com.iatd.smarthub.model.quiz.QuestionType;
import com.iatd.smarthub.model.quiz.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    // === FINDERS DE BASE ===
    List<Question> findByQuiz(Quiz quiz);

    List<Question> findByQuizId(Long quizId);

    List<Question> findByType(QuestionType type);

    List<Question> findByQuizAndType(Quiz quiz, QuestionType type);

    // === EXISTS CHECKS ===
    boolean existsByQuizAndTextIgnoreCase(Quiz quiz, String text);

    // === COUNT METHODS ===
    Long countByQuiz(Quiz quiz);

    Long countByQuizId(Long quizId);

    // === FIND WITH OPTIONS EAGERLY ===
    @Query("SELECT q FROM Question q LEFT JOIN FETCH q.options WHERE q.id = :id")
    Optional<Question> findByIdWithOptions(@Param("id") Long id);

    @Query("SELECT q FROM Question q LEFT JOIN FETCH q.options WHERE q.quiz.id = :quizId")
    List<Question> findByQuizIdWithOptions(@Param("quizId") Long quizId);

    // === FIND FOR QUIZ ATTEMPT (sans réponses correctes) ===
    @Query("SELECT new Question(q.id, q.text, q.type, '', q.quiz) FROM Question q WHERE q.quiz.id = :quizId")
    List<Question> findQuestionsWithoutCorrectAnswersByQuizId(@Param("quizId") Long quizId);

    // === BATCH OPERATIONS ===
    @Query("SELECT q.correctAnswer FROM Question q WHERE q.id IN :questionIds")
    List<String> findCorrectAnswersByQuestionIds(@Param("questionIds") List<Long> questionIds);
}
```

Conclusion

QuestionRepository fournit des méthodes pour manipuler et récupérer les questions et leurs options de façon performante; utile pour la préparation des quiz et l'exécution des tentatives.

---

## <span style="color:blue">AnswerRepository</span>

Table des méthodes

| Méthode | Description |
|---|---|
| findByQuizAttempt(QuizAttempt quizAttempt) | Récupère réponses liées à une tentative. |
| findByQuestion(Question question) | Récupère réponses pour une question. |
| findByQuizAttemptAndIsCorrect(QuizAttempt quizAttempt, Boolean isCorrect) | Filtre par correction. |
| findByQuizAttemptIdWithDetails(Long attemptId) | Fetch question & quiz pour une tentative. |
| existsByQuizAttemptAndQuestion(QuizAttempt quizAttempt, Question question) | Vérifie existence. |
| countByQuizAttempt / countByQuizAttemptAndIsCorrect | Comptes. |
| findByQuizAttemptIds(List<Long> attemptIds) | Batch retrieval. |
| findUnscoredAnswersByAttemptId(Long attemptId) | Pour scoring, récupère réponses non notées. |
| countCorrectAnswersByQuestionId / countTotalAnswersByQuestionId | Statistiques par question. |

Code (AnswerRepository.java)

```java
package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.quiz.Answer;
import com.iatd.smarthub.model.quiz.Question;
import com.iatd.smarthub.model.quiz.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
// import java.util.Optional;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {

    // === FINDERS DE BASE ===
    List<Answer> findByQuizAttempt(QuizAttempt quizAttempt);

    List<Answer> findByQuestion(Question question);

    List<Answer> findByQuizAttemptAndIsCorrect(QuizAttempt quizAttempt, Boolean isCorrect);

    // === FIND WITH RELATIONS EAGERLY ===
    @Query("SELECT a FROM Answer a " +
            "LEFT JOIN FETCH a.question " +
            "LEFT JOIN FETCH a.quizAttempt " +
            "WHERE a.quizAttempt.id = :attemptId")
    List<Answer> findByQuizAttemptIdWithDetails(@Param("attemptId") Long attemptId);

    // === EXISTS CHECKS ===
    boolean existsByQuizAttemptAndQuestion(QuizAttempt quizAttempt, Question question);

    // === COUNT METHODS ===
    Long countByQuizAttempt(QuizAttempt quizAttempt);

    Long countByQuizAttemptAndIsCorrect(QuizAttempt quizAttempt, Boolean isCorrect);

    // === BATCH OPERATIONS ===
    @Query("SELECT a FROM Answer a WHERE a.quizAttempt.id IN :attemptIds")
    List<Answer> findByQuizAttemptIds(@Param("attemptIds") List<Long> attemptIds);

    // === FIND FOR SCORING ===
    @Query("SELECT a FROM Answer a " +
            "JOIN FETCH a.question " +
            "WHERE a.quizAttempt.id = :attemptId " +
            "AND a.isCorrect IS NULL")
    List<Answer> findUnscoredAnswersByAttemptId(@Param("attemptId") Long attemptId);

    // === STATISTICS ===
    @Query("SELECT COUNT(a) FROM Answer a WHERE a.question.id = :questionId AND a.isCorrect = true")
    Long countCorrectAnswersByQuestionId(@Param("questionId") Long questionId);

    @Query("SELECT COUNT(a) FROM Answer a WHERE a.question.id = :questionId")
    Long countTotalAnswersByQuestionId(@Param("questionId") Long questionId);
}
```

Conclusion

AnswerRepository est centré sur la collecte et l'analyse des réponses soumises pendant les tentatives, avec des méthodes orientées scoring, batch et statistiques.

---

## <span style="color:blue">AnnouncementRepository</span>

Table des méthodes

| Méthode | Description |
|---|---|
| findByAuthor(User author) | Trouve annonces par auteur. |
| findByType(AnnouncementType type) | Filtre par type d'annonce. |
| findByPublishedTrue() | Annonces publiées. |
| findByDateAfter(LocalDateTime date) | Annonces après une date. |
| findRecentAnnouncements(LocalDateTime startDate) | Annonces récentes publiées. |
| searchPublishedAnnouncements(String query) | Recherche texte sur titre/contenu publié. |
| findByTypeAndPublishedTrue(AnnouncementType type) | Filtre combiné. |

Code (AnnouncementRepository.java)

```java
// src/main/java/com/iatd/smarthub/repository/AnnouncementRepository.java
package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.announcement.Announcement;
import com.iatd.smarthub.model.announcement.AnnouncementType;
import com.iatd.smarthub.model.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    // Trouver les annonces par auteur
    List<Announcement> findByAuthor(User author);

    // Trouver les annonces par type
    List<Announcement> findByType(AnnouncementType type);

    // Trouver les annonces publiées
    List<Announcement> findByPublishedTrue();

    // Trouver les annonces par date (après une certaine date)
    List<Announcement> findByDateAfter(LocalDateTime date);

    // Trouver les annonces récentes (dernières 30 jours)
    @Query("SELECT a FROM Announcement a WHERE a.date >= :startDate AND a.published = true ORDER BY a.date DESC")
    List<Announcement> findRecentAnnouncements(@Param("startDate") LocalDateTime startDate);

    // Recherche d'annonces par titre ou contenu
    @Query("SELECT a FROM Announcement a WHERE a.published = true AND " +
            "(LOWER(a.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.content) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "ORDER BY a.date DESC")
    List<Announcement> searchPublishedAnnouncements(@Param("query") String query);

    // Trouver les annonces par type et statut de publication
    List<Announcement> findByTypeAndPublishedTrue(AnnouncementType type);
}
```

Conclusion

AnnouncementRepository facilite la publication et la recherche d'annonces, avec des queries pratiques pour l'interface d'administration et l'affichage des annonces récentes.

---

## <span style="color:blue">ProjectRepository</span>

Table des méthodes

| Méthode | Description |
|---|---|
| findBySupervisor(User supervisor) | Projets par superviseur. |
| findByStatus(Project.ProjectStatus status) | Filtre par statut. |
| findByStudent(User student) | Projets où un étudiant est membre. |
| findActiveProjects() | Projets en cours between dates. |
| searchByTitle(String query) | Recherche par titre. |
| findByIdWithStudents(Long id) | Fetch students pour un projet. |
| findByIdWithSupervisorAndStudents(Long id) | Fetch supervisor et students. |
| findByIdWithSupervisor(Long id) | Fetch supervisor. |
| findAllWithSupervisor() | Liste tous projects avec supervisor (fetch). |
| countByCreatedAtAfter(LocalDateTime date) | Compte créés après date. |

Code (ProjectRepository.java)

```java
package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.project.Project;

import com.iatd.smarthub.model.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.time.LocalDateTime;


import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    // Trouver les projets par superviseur
    List<Project> findBySupervisor(User supervisor);

    // Trouver les projets par statut - CORRIGÉ
    List<Project> findByStatus(Project.ProjectStatus status);

    // Trouver les projets où un étudiant est membre
    @Query("SELECT p FROM Project p JOIN p.students s WHERE s = :student")
    List<Project> findByStudent(@Param("student") User student);

    // Trouver les projets en cours (entre les dates)
    @Query("SELECT p FROM Project p WHERE p.startDate <= CURRENT_DATE AND p.endDate >= CURRENT_DATE")
    List<Project> findActiveProjects();

    // Recherche de projets par titre
    @Query("SELECT p FROM Project p WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Project> searchByTitle(@Param("query") String query);

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.students WHERE p.id = :id")
    Optional<Project> findByIdWithStudents(@Param("id") Long id);

    @Query("SELECT p FROM Project p JOIN FETCH p.supervisor LEFT JOIN FETCH p.students WHERE p.id = :id")
    Optional<Project> findByIdWithSupervisorAndStudents(@Param("id") Long id);
    
    @Query("SELECT p FROM Project p JOIN FETCH p.supervisor WHERE p.id = :id")
    Optional<Project> findByIdWithSupervisor(@Param("id") Long id);

    @Query("SELECT p FROM Project p JOIN FETCH p.supervisor")
    List<Project> findAllWithSupervisor();
    
    // AJOUTER CETTE MÉTHODE
    @Query("SELECT COUNT(p) FROM Project p WHERE p.createdAt > :date")
    long countByCreatedAtAfter(@Param("date") LocalDateTime date);
}
```

Conclusion

ProjectRepository propose des méthodes utiles pour la gestion des projets étudiants, incluant fetchs pour les relations et recherches textuelles.

---

## <span style="color:blue">InternshipRepository</span>

Table des méthodes

| Méthode | Description |
|---|---|
| findByStudent(User student) | Stages par étudiant. |
| findBySupervisor(User supervisor) | Stages par superviseur. |
| findByCompanyContainingIgnoreCase(String company) | Recherche par entreprise. |
| findByStatus(Internship.InternshipStatus status) | Filtre par statut. |
| findActiveInternships() | Stages en cours. |
| searchInternships(String query) | Recherche texte. |
| findAllWithStudentsAndSupervisors() | Fetch students & supervisors. |
| findByIdWithStudentsAndSupervisors(Long id) | Fetch pour un id. |

Code (InternshipRepository.java)

```java
package com.iatd.smarthub.repository;

import com.iatd.smarthub.model.internship.Internship;
import com.iatd.smarthub.model.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InternshipRepository extends JpaRepository<Internship, Long> {

    // Trouver les stages par étudiant
    List<Internship> findByStudent(User student);

    // Trouver les stages par superviseur
    List<Internship> findBySupervisor(User supervisor);

    // Trouver les stages par entreprise
    List<Internship> findByCompanyContainingIgnoreCase(String company);

    // Trouver les stages par statut
    List<Internship> findByStatus(Internship.InternshipStatus status);

    // Trouver les stages actifs (en cours)
    @Query("SELECT i FROM Internship i WHERE i.startDate <= CURRENT_DATE AND i.endDate >= CURRENT_DATE")
    List<Internship> findActiveInternships();

    // Recherche de stages par titre ou entreprise
    @Query("SELECT i FROM Internship i WHERE LOWER(i.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(i.company) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Internship> searchInternships(@Param("query") String query);
    
 // Ajoutez ces méthodes pour optimiser le chargement
    @Query("SELECT i FROM Internship i JOIN FETCH i.student JOIN FETCH i.supervisor")
    List<Internship> findAllWithStudentsAndSupervisors();

    @Query("SELECT i FROM Internship i JOIN FETCH i.student JOIN FETCH i.supervisor WHERE i.id = :id")
    Optional<Internship> findByIdWithStudentsAndSupervisors(@Param("id") Long id);
}
```

Conclusion

InternshipRepository couvre la plupart des besoins CRUD et recherches pour la gestion des stages, avec des fetchs pour charger relations quand nécessaire.

---

## <span style="color:blue">AnnouncementRepository</span>

(La section `AnnouncementRepository` a déjà été décrite plus haut.)

---

## <span style="color:blue">AnswerRepository</span>

(La section `AnswerRepository` a déjà été décrite plus haut.)

---

## <span style="color:blue">AssignmentRepository</span>

Table des méthodes

| Méthode | Description |
|---|---|
| (fichier actuellement vide / placeholder) | Le fichier `AssignmentRepository.java` dans le projet est un placeholder vide. Il faudra le convertir en interface extending JpaRepository et y ajouter les méthodes nécessaires selon les entités `Assignment`. |

Code (AssignmentRepository.java)

```java
package com.iatd.smarthub.repository;

public class AssignmentRepository {

}
```

Conclusion

Fichier placeholder : nécessite ajout des méthodes et transformation en interface JPA (ex: `public interface AssignmentRepository extends JpaRepository<Assignment, Long>`).

---

## <span style="color:blue">AssignmentSubmissionRepository</span>

Table des méthodes

| Méthode | Description |
|---|---|
| (fichier actuellement vide / placeholder) | Le fichier `AssignmentSubmissionRepository.java` est actuellement un placeholder vide et doit être implémenté. |

Code (AssignmentSubmissionRepository.java)

```java
package com.iatd.smarthub.repository;

public class AssignmentSubmissionRepository {

}
```

Conclusion

Placeholders à compléter pour gérer les soumissions d'assignments (transformer en interface JPA et exposer finders utiles).

---

## <span style="color:blue">QuizRecommendationRepository</span>

Table des méthodes

| Méthode | Description |
|---|---|
| findPendingRecommendationsByUserId(Long userId) | Reco non acceptées pour utilisateur. |
| findAcceptedRecommendationsByUserId(Long userId) | Reco acceptées. |
| countAcceptedRecommendationsByUserId(Long userId) | Compte acceptées. |
| findRecentRecommendationsByUserId(Long userId, LocalDateTime since) | Reco récentes. |

Code (QuizRecommendationRepository.java)

```java
package com.iatd.smarthub.repository.rag;

import com.iatd.smarthub.model.rag.QuizRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface QuizRecommendationRepository extends JpaRepository<QuizRecommendation, Long> {
    
    // Trouver les recommandations non acceptées pour un utilisateur
    @Query("SELECT qr FROM QuizRecommendation qr WHERE qr.user.id = :userId AND qr.accepted = false")
    List<QuizRecommendation> findPendingRecommendationsByUserId(@Param("userId") Long userId);
    
    // Trouver les recommandations acceptées
    @Query("SELECT qr FROM QuizRecommendation qr WHERE qr.user.id = :userId AND qr.accepted = true")
    List<QuizRecommendation> findAcceptedRecommendationsByUserId(@Param("userId") Long userId);
    
    // Compter les recommandations acceptées
    @Query("SELECT COUNT(qr) FROM QuizRecommendation qr WHERE qr.user.id = :userId AND qr.accepted = true")
    Long countAcceptedRecommendationsByUserId(@Param("userId") Long userId);
    
    // Trouver les recommandations récentes
    @Query("SELECT qr FROM QuizRecommendation qr WHERE qr.user.id = :userId AND qr.recommendedAt >= :since")
    List<QuizRecommendation> findRecentRecommendationsByUserId(
            @Param("userId") Long userId, 
            @Param("since") LocalDateTime since);

}
```

Conclusion

Repository centré sur les recommandations RAG pour quizzes, utile pour la personnalisation et la file de recommandations utilisateur.

---

## <span style="color:blue">LearningProfileRepository</span>

Table des méthodes

| Méthode | Description |
|---|---|
| findByUserId(Long userId) | Retourne profil d'apprentissage pour un utilisateur. |
| existsByUserId(Long userId) | Vérifie existence. |
| findByProficiencyLevel(String level) | Filtre par niveau de compétence. |

Code (LearningProfileRepository.java)

```java
package com.iatd.smarthub.repository.rag;

import com.iatd.smarthub.model.rag.LearningProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.*;

@Repository
public interface LearningProfileRepository extends JpaRepository<LearningProfile, Long> {
    
    // Trouver le profil par ID utilisateur
    @Query("SELECT lp FROM LearningProfile lp WHERE lp.user.id = :userId")
    Optional<LearningProfile> findByUserId(@Param("userId") Long userId);
    
    // Vérifier si un profil existe pour un utilisateur
    @Query("SELECT COUNT(lp) > 0 FROM LearningProfile lp WHERE lp.user.id = :userId")
    boolean existsByUserId(@Param("userId") Long userId);
    
    // Trouver les profils par niveau de compétence
    @Query("SELECT lp FROM LearningProfile lp WHERE lp.proficiencyLevel = :level")
    List<LearningProfile> findByProficiencyLevel(@Param("level") String level);
}
```

Conclusion

LearningProfileRepository offre des méthodes pour récupérer et vérifier les profils d'apprentissage, utiles au moteur de recommandation pédagogique.

---

## <span style="color:blue">KnowledgeBaseRepository</span>

Table des méthodes

| Méthode | Description |
|---|---|
| findByTag(String tag) / findByTagAlternative(String tag) | Recherche par tag (MEMBER OF ou alternative). |
| searchByKeyword(String keyword) | Recherche par mot-clé dans titre/contenu. |
| findAllUniqueTags() | Récupère tags distincts. |
| findBySource(String source) | Filtre par source. |
| findByTagsIn(List<String> tags) | Recherche par plusieurs tags. |
| searchByKeywordWithSorting(String keyword) | Recherche avec tri par usageCount + createdAt. |
| findAllWithEmbedding() | Documents avec embedding. |
| findSimilarByEmbedding(float[] embedding, int limit) | Recherche vectorielle native (pgvector). |
| findAllWithoutEmbedding() | Documents sans embedding. |
| countWithEmbedding() | Compte documents avec embedding. |

Code (KnowledgeBaseRepository.java)

```java
package com.iatd.smarthub.repository.rag;

import com.iatd.smarthub.model.rag.KnowledgeBase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeBaseRepository extends JpaRepository<KnowledgeBase, Long> {
    
    // Méthode 1: Utilisant MEMBER OF (standard JPA)
    @Query("SELECT kb FROM KnowledgeBase kb WHERE :tag MEMBER OF kb.tags")
    List<KnowledgeBase> findByTag(@Param("tag") String tag);
    
    // Méthode alternative si MEMBER OF ne fonctionne pas
    @Query("SELECT kb FROM KnowledgeBase kb WHERE :tag IN (SELECT t FROM kb.tags t)")
    List<KnowledgeBase> findByTagAlternative(@Param("tag") String tag);
    
    // Recherche par mot-clé dans le titre ou le contenu - CORRIGÉ
    @Query("SELECT kb FROM KnowledgeBase kb WHERE " +
           "LOWER(kb.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "kb.content LIKE CONCAT('%', :keyword, '%')")
    List<KnowledgeBase> searchByKeyword(@Param("keyword") String keyword);
    
    // Trouver tous les tags uniques
    @Query("SELECT DISTINCT tag FROM KnowledgeBase kb JOIN kb.tags tag ORDER BY tag")
    List<String> findAllUniqueTags();
    
    // Trouver par source
    List<KnowledgeBase> findBySource(String source);
    
    // Recherche par plusieurs tags
    @Query("SELECT DISTINCT kb FROM KnowledgeBase kb JOIN kb.tags tag " +
           "WHERE tag IN :tags")
    List<KnowledgeBase> findByTagsIn(@Param("tags") List<String> tags);
    
    // Recherche avec pagination - CORRIGÉ
    @Query("SELECT kb FROM KnowledgeBase kb WHERE " +
           "LOWER(kb.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "kb.content LIKE CONCAT('%', :keyword, '%') " +
           "ORDER BY kb.usageCount DESC, kb.createdAt DESC")
    List<KnowledgeBase> searchByKeywordWithSorting(@Param("keyword") String keyword);
    
    @Query("SELECT kb FROM KnowledgeBase kb WHERE kb.embedding IS NOT NULL")
    List<KnowledgeBase> findAllWithEmbedding();
    
    // Recherche vectorielle native avec pgvector
    @Query(value = "SELECT * FROM knowledge_base " +
                   "WHERE embedding IS NOT NULL " +
                   "ORDER BY embedding <=> CAST(:embedding AS vector) " +
                   "LIMIT :limit", 
           nativeQuery = true)
    List<KnowledgeBase> findSimilarByEmbedding(
        @Param("embedding") float[] embedding, 
        @Param("limit") int limit
    );
    
    // Trouver les documents sans embedding
    @Query("SELECT kb FROM KnowledgeBase kb WHERE kb.embedding IS NULL")
    List<KnowledgeBase> findAllWithoutEmbedding();
    
    // Compter les documents avec embedding
    @Query("SELECT COUNT(kb) FROM KnowledgeBase kb WHERE kb.embedding IS NOT NULL")
    long countWithEmbedding();
}
```

Conclusion

KnowledgeBaseRepository encapsule les opérations nécessaires pour les workflows RAG : recherche par tag, recherche textuelle, gestion des embeddings et requêtes vectorielles pour similarité (pgvector).

---

# Conclusion générale

Le projet contient plusieurs repositories bien structurés : ces reposotory  sont déjà optimisés (fetchs, EntityGraph, DTOs de résumé), d'autres sont placeholders à compléter (`AssignmentRepository`, `AssignmentSubmissionRepository`).






# les Modèles de notre application SmartHub

## <span style="color:blue">BaseEntity</span>

| Élément | Type | Rôle | Héritage | Pourquoi | Importance |
|---------|------|------|----------|----------|------------|
| id | Long | Identifiant unique | Aucun | Permet d'identifier chaque entité de manière unique dans la base de données | Essentiel pour les opérations CRUD et les relations |
| createdAt | LocalDateTime | Date de création | Aucun | Suit l'audit des entités | Permet de tracer l'historique des données |
| updatedAt | LocalDateTime | Date de mise à jour | Aucun | Suit l'audit des entités | Permet de tracer les modifications |

Classe abstraite servant de base pour les entités nécessitant un audit automatique.

```java
// filepath: src/main/java/com/iatd/smarthub/model/base/BaseEntity.java
package com.iatd.smarthub.model.base;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@MappedSuperclass
@Getter
@Setter
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

## <span style="color:blue">User</span>

| Élément | Type | Rôle | Héritage | Pourquoi | Importance |
|---------|------|------|----------|----------|------------|
| id | Long | Identifiant | Aucun | Identifiant unique | Clé primaire |
| username | String | Nom d'utilisateur | Aucun | Authentification | Unique avec email |
| email | String | Adresse email | Aucun | Contact et authentification | Unique |
| password | String | Mot de passe | Aucun | Sécurité | Doit être encodé |
| role | Role (enum) | Rôle utilisateur | Aucun | Autorisation | STUDENT, TEACHER, ADMIN |
| profileImage | String | Image de profil | Aucun | Personnalisation | Optionnel |
| firstName | String | Prénom | Aucun | Informations personnelles | Optionnel |
| lastName | String | Nom | Aucun | Informations personnelles | Optionnel |
| phoneNumber | String | Téléphone | Aucun | Contact | Optionnel |
| resetToken | String | Token de réinitialisation | Aucun | Sécurité | Temporaire |
| resetTokenExpiry | LocalDateTime | Expiration token | Aucun | Sécurité | Temporaire |
| resetTokenCreatedAt | LocalDateTime | Création token | Aucun | Audit | Temporaire |
| active | boolean | Statut actif | Aucun | Gestion des comptes | Par défaut true |
| createdAt | LocalDateTime | Création | Aucun | Audit | Dupliqué avec BaseEntity |
| updatedAt | LocalDateTime | Mise à jour | Aucun | Audit | Dupliqué avec BaseEntity |
| lastLogin | LocalDateTime | Dernière connexion | Aucun | Suivi activité | Optionnel |
| courses | List<Course> | Cours inscrits | Aucun | Relation ManyToMany | Étudiants |

Entité centrale représentant les utilisateurs du système éducatif.

```java
// filepath: src/main/java/com/iatd/smarthub/model/user/User.java
package com.iatd.smarthub.model.user;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = "email"),
        @UniqueConstraint(columnNames = "username")
})
@Getter
@Setter
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({
    "password",
    "courses"
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(min = 3, max = 50)
    @Column(nullable = false)
    private String username;

    @NotBlank
    @Size(max = 100)
    @Email
    @Column(nullable = false)
    private String email;

    @NotBlank
    @Size(min = 6, max = 120)
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
    
    @Column(name = "profile_image")
    private String profileImage;

    private String firstName;
    private String lastName;
    private String phoneNumber;
    
    @Column(name = "reset_token")
    private String resetToken;
    
    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry;
    
    @Column(name = "reset_token_created_at")
    private LocalDateTime resetTokenCreatedAt;

    // Colonne modifiée en TINYINT(1) dans MySQL
    @Column(name = "active", nullable = false)
    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime lastLogin;

    @ManyToMany(mappedBy = "students", fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<com.iatd.smarthub.model.course.Course> courses;

    public enum Role {
        STUDENT, TEACHER, ADMIN
    }

    // Constructeurs
    public User() {
    }

    public User(String username, String email, String password, Role role) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    // Getters et setters
    public Long getId() { 
        return id; 
    }
    
    public void setId(Long id) { 
        this.id = id; 
    }

    public String getUsername() { 
        return username; 
    }
    
    public void setUsername(String username) { 
        this.username = username; 
    }

    public String getEmail() { 
        return email; 
    }
    
    public void setEmail(String email) { 
        this.email = email; 
    }

    public String getPassword() { 
        return password; 
    }
    
    public void setPassword(String password) { 
        this.password = password; 
    }

    public Role getRole() { 
        return role; 
    }
    
    public void setRole(Role role) { 
        this.role = role; 
    }

    public String getFirstName() { 
        return firstName; 
    }
    
    public void setFirstName(String firstName) { 
        this.firstName = firstName; 
    }

    public String getLastName() { 
        return lastName; 
    }
    
    public void setLastName(String lastName) { 
        this.lastName = lastName; 
    }

    public String getPhoneNumber() { 
        return phoneNumber; 
    }
    
    public void setPhoneNumber(String phoneNumber) { 
        this.phoneNumber = phoneNumber; 
    }

    // IMPORTANT : Méthodes pour le champ 'active'
    public boolean isActive() { 
        return active; 
    }
    
    public void setActive(boolean active) { 
        this.active = active; 
    }

    // Pour la compatibilité avec certaines bibliothèques qui attendent getActive()
    public Boolean getActive() {
        return active;
    }

    public LocalDateTime getCreatedAt() { 
        return createdAt; 
    }
    
    public void setCreatedAt(LocalDateTime createdAt) { 
        this.createdAt = createdAt; 
    }

    public LocalDateTime getUpdatedAt() { 
        return updatedAt; 
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) { 
        this.updatedAt = updatedAt; 
    }

    public LocalDateTime getLastLogin() { 
        return lastLogin; 
    }
    
    public void setLastLogin(LocalDateTime lastLogin) { 
        this.lastLogin = lastLogin; 
    }
}
```

## <span style="color:blue">Course</span>

| Élément | Type | Rôle | Héritage | Pourquoi | Importance |
|---------|------|------|----------|----------|------------|
| id | Long | Identifiant | Aucun | Clé primaire | Unique |
| title | String | Titre du cours | Aucun | Description | Obligatoire |
| description | String | Description | Aucun | Détails | Optionnel |
| teacher | User | Enseignant | Aucun | Relation ManyToOne | Obligatoire |
| students | List<User> | Étudiants | Aucun | Relation ManyToMany | Liste des inscrits |
| files | List<CourseFile> | Fichiers | Aucun | Relation OneToMany | Ressources |
| createdDate | LocalDateTime | Création | Aucun | Audit | Automatique |

Représente les cours dispensés par les enseignants.

```java
// filepath: src/main/java/com/iatd/smarthub/model/course/Course.java
 package com.iatd.smarthub.model.course;

import com.iatd.smarthub.model.course.*;
import com.iatd.smarthub.model.user.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "courses")
@Data
@NoArgsConstructor
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "course_students",
        joinColumns = @JoinColumn(name = "course_id"),
        inverseJoinColumns = @JoinColumn(name = "student_id")
    )
    private List<User> students = new ArrayList<>();

    // ✅ NOUVEAU : Liste des fichiers du cours
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CourseFile> files = new ArrayList<>();

    @Column(name = "created_date")
    private LocalDateTime createdDate = LocalDateTime.now();
}
```

## <span style="color:blue">CourseFile</span>

| Élément | Type | Rôle | Héritage | Pourquoi | Importance |
|---------|------|------|----------|----------|------------|
| id | Long | Identifiant | Aucun | Clé primaire | Unique |
| fileName | String | Nom du fichier | Aucun | Métadonnées | Obligatoire |
| filePath | String | Chemin stockage | Aucun | Accès fichier | Obligatoire |
| fileType | String | Type MIME | Aucun | Classification | Optionnel |
| fileSize | Long | Taille en bytes | Aucun | Métadonnées | Optionnel |
| course | Course | Cours associé | Aucun | Relation ManyToOne | Obligatoire |
| uploadedBy | User | Uploader | Aucun | Relation ManyToOne | Obligatoire |
| uploadedDate | LocalDateTime | Upload | Aucun | Audit | Automatique |

Gère les fichiers associés aux cours.

```java
// filepath: src/main/java/com/iatd/smarthub/model/course/CourseFile.java
package com.iatd.smarthub.model.course;

import com.iatd.smarthub.model.user.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "course_files")
@Data
@NoArgsConstructor
public class CourseFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String filePath; // Chemin où le fichier est stocké

    private String fileType; // pdf, docx, pptx, etc.
    
    private Long fileSize; // Taille en bytes

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    @Column(name = "uploaded_date")
    private LocalDateTime uploadedDate = LocalDateTime.now();

    // Constructeur pratique
    public CourseFile(String fileName, String filePath, String fileType, Long fileSize, Course course, User uploadedBy) {
        this.fileName = fileName;
        this.filePath = filePath;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.course = course;
        this.uploadedBy = uploadedBy;
    }
}
```

## <span style="color:blue">Assignment</span>

Classe vide - à implémenter pour les devoirs.

```java
// filepath: src/main/java/com/iatd/smarthub/model/assignment/Assignment.java
package com.iatd.smarthub.model.assignment;

public class Assignment {

}
```

## <span style="color:blue">AssignmentFile</span>

Classe vide - à implémenter pour les fichiers de devoirs.

```java
// filepath: src/main/java/com/iatd/smarthub/model/assignment/AssignmentFile.java
package com.iatd.smarthub.model.assignment;

public class AssignmentFile {

}
```

## <span style="color:blue">AssignmentSubmission</span>

Classe vide - à implémenter pour les soumissions de devoirs.

```java
// filepath: src/main/java/com/iatd/smarthub/model/assignment/AssignmentSubmission.java
package com.iatd.smarthub.model.assignment;

public class AssignmentSubmission {

}
```

## <span style="color:blue">SubmissionFile</span>

Classe vide - à implémenter pour les fichiers de soumissions.

```java
// filepath: src/main/java/com/iatd/smarthub/model/assignment/SubmissionFile.java
package com.iatd.smarthub.model.assignment;

public class SubmissionFile {

}
```

## <span style="color:blue">Announcement</span>

| Élément | Type | Rôle | Héritage | Pourquoi | Importance |
|---------|------|------|----------|----------|------------|
| id | Long | Identifiant | BaseEntity | Hérité | Audit automatique |
| title | String | Titre | Aucun | Description | Obligatoire |
| content | String | Contenu | Aucun | Détails | Obligatoire |
| type | AnnouncementType | Type | Aucun | Classification | Obligatoire |
| date | LocalDateTime | Date publication | Aucun | Planification | Obligatoire |
| author | User | Auteur | Aucun | Relation ManyToOne | Obligatoire |
| published | Boolean | Publié | Aucun | Statut | Par défaut true |
| createdAt | LocalDateTime | Création | BaseEntity | Hérité | Audit |
| updatedAt | LocalDateTime | Mise à jour | BaseEntity | Hérité | Audit |

Hérite de BaseEntity pour l'audit automatique.

```java
// filepath: src/main/java/com/iatd/smarthub/model/announcement/Announcement.java
// src/main/java/com/iatd/smarthub/model/announcement/Announcement.java
package com.iatd.smarthub.model.announcement;

import com.iatd.smarthub.model.base.BaseEntity;
import com.iatd.smarthub.model.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "announcements")
@Getter
@Setter
public class Announcement extends BaseEntity {

    @NotBlank
    @Size(min = 3, max = 255)
    @Column(nullable = false)
    private String title;

    @NotBlank
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AnnouncementType type;

    @NotNull
    @Column(nullable = false)
    private LocalDateTime date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    private Boolean published = true;

    // Constructeurs
    public Announcement() {
    }

    public Announcement(String title, String content, AnnouncementType type, LocalDateTime date, User author) {
        this.title = title;
        this.content = content;
        this.type = type;
        this.date = date;
        this.author = author;
    }
}
```

## <span style="color:blue">AnnouncementType</span>

Enum: SEMINAR, WORKSHOP, DEFENSE, JOB_OFFER, INTERNSHIP_OFFER

```java
// filepath: src/main/java/com/iatd/smarthub/model/announcement/AnnouncementType.java
// src/main/java/com/iatd/smarthub/model/announcement/AnnouncementType.java
package com.iatd.smarthub.model.announcement;

public enum AnnouncementType {
    SEMINAR,
    WORKSHOP,
    DEFENSE,
    JOB_OFFER,
    INTERNSHIP_OFFER
}
```

## <span style="color:blue">UserInteraction</span>

| Élément | Type | Rôle | Héritage | Pourquoi | Importance |
|---------|------|------|----------|----------|------------|
| id | Long | Identifiant | Aucun | Clé primaire | Unique |
| user | User | Utilisateur | Aucun | Relation ManyToOne | Obligatoire |
| resourceType | ResourceType | Type ressource | Aucun | Classification | Obligatoire |
| resourceId | Long | ID ressource | Aucun | Référence | Obligatoire |
| interactionType | InteractionType | Type interaction | Aucun | Classification | Obligatoire |
| interactedAt | LocalDateTime | Timestamp | Aucun | Audit | Automatique |
| durationSeconds | Integer | Durée | Aucun | Métriques | Optionnel |
| searchQuery | String | Requête recherche | Aucun | Contexte | Optionnel |

Suit les interactions utilisateurs pour l'analyse comportementale.

```java
// filepath: src/main/java/com/iatd/smarthub/model/interaction/UserInteraction.java
package com.iatd.smarthub.model.interaction;

import com.iatd.smarthub.model.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_interactions",
       indexes = {
           @Index(name = "idx_user_interactions_user", columnList = "user_id"),
           @Index(name = "idx_user_interactions_resource", columnList = "resource_type,resource_id"),
           @Index(name = "idx_user_interactions_timestamp", columnList = "interacted_at")
       })
@Getter
@Setter
public class UserInteraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", nullable = false, length = 50)
    private ResourceType resourceType;

    @Column(name = "resource_id", nullable = false)
    private Long resourceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "interaction_type", nullable = false, length = 50)
    private InteractionType interactionType;

    @CreationTimestamp
    @Column(name = "interacted_at", nullable = false, updatable = false)
    private LocalDateTime interactedAt;

    // Champs supplémentaires pour le contexte
    @Column(name = "duration_seconds")
    private Integer durationSeconds; // Durée de consultation en secondes

    @Column(name = "search_query")
    private String searchQuery; // Pour les interactions de recherche

    // === ENUMS ===
    
    public enum ResourceType {
        COURSE,
        PROJECT, 
        INTERNSHIP,
        RESOURCE,
        QUIZ,
        ANNOUNCEMENT,
        USER  // Pour les interactions entre utilisateurs
    }

    public enum InteractionType {
        // Consutation
        VIEW,
        VIEW_DETAILS,
        
        // Engagement
        LIKE,
        DISLIKE,
        BOOKMARK,
        SHARE,
        COMMENT,
        RATE,
        
        // Actions
        ENROLL,
        COMPLETE,
        SUBMIT,
        DOWNLOAD,
        UPLOAD,
        
        // Recherche
        SEARCH,
        CLICK_SEARCH_RESULT,
        
        // Social
        FOLLOW,
        MESSAGE
    }

    // === CONSTRUCTEURS ===
    
    public UserInteraction() {}

    public UserInteraction(User user, ResourceType resourceType, Long resourceId, InteractionType interactionType) {
        this.user = user;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.interactionType = interactionType;
    }
}
```

## <span style="color:blue">Internship</span>

| Élément | Type | Rôle | Héritage | Pourquoi | Importance |
|---------|------|------|----------|----------|------------|
| id | Long | Identifiant | BaseEntity | Hérité | Audit |
| title | String | Titre | Aucun | Description | Obligatoire |
| description | String | Description | Aucun | Détails | Optionnel |
| student | User | Étudiant | Aucun | Relation ManyToOne | Obligatoire |
| supervisor | User | Superviseur | Aucun | Relation ManyToOne | Obligatoire |
| company | String | Entreprise | Aucun | Contexte | Obligatoire |
| startDate | LocalDate | Début | Aucun | Planification | Obligatoire |
| endDate | LocalDate | Fin | Aucun | Planification | Obligatoire |
| status | InternshipStatus | Statut | Aucun | Suivi | Obligatoire |
| createdAt | LocalDateTime | Création | BaseEntity | Hérité | Audit |
| updatedAt | LocalDateTime | Mise à jour | BaseEntity | Hérité | Audit |

Hérite de BaseEntity.

```java
// filepath: src/main/java/com/iatd/smarthub/model/internship/Internship.java
package com.iatd.smarthub.model.internship;

import com.iatd.smarthub.model.base.BaseEntity;
import com.iatd.smarthub.model.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "internships")
@Getter
@Setter
public class Internship extends BaseEntity {

    @NotBlank
    @Size(min = 3, max = 255)
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_id", nullable = false)
    private User supervisor;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false)
    private String company;

    @NotNull
    @Column(nullable = false)
    private LocalDate startDate;

    @NotNull
    @Column(nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InternshipStatus status = InternshipStatus.PLANNED;

    // Enum interne
    public enum InternshipStatus {
        PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
    }
}
```

## <span style="color:blue">Project</span>

| Élément | Type | Rôle | Héritage | Pourquoi | Importance |
|---------|------|------|----------|----------|------------|
| id | Long | Identifiant | BaseEntity | Hérité | Audit |
| title | String | Titre | Aucun | Description | Obligatoire |
| description | String | Description | Aucun | Détails | Optionnel |
| students | List<User> | Étudiants | Aucun | Relation ManyToMany | Liste |
| supervisor | User | Superviseur | Aucun | Relation ManyToOne | Obligatoire |
| startDate | LocalDate | Début | Aucun | Planification | Obligatoire |
| endDate | LocalDate | Fin | Aucun | Planification | Obligatoire |
| status | ProjectStatus | Statut | Aucun | Suivi | Obligatoire |
| createdAt | LocalDateTime | Création | BaseEntity | Hérité | Audit |
| updatedAt | LocalDateTime | Mise à jour | BaseEntity | Hérité | Audit |

Hérite de BaseEntity.

```java
// filepath: src/main/java/com/iatd/smarthub/model/project/Project.java
package com.iatd.smarthub.model.project;

import com.iatd.smarthub.model.base.BaseEntity;
import com.iatd.smarthub.model.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")
@Getter
@Setter
public class Project extends BaseEntity {

    @NotBlank
    @Size(min = 3, max = 255)
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToMany
    @JoinTable(name = "project_students", joinColumns = @JoinColumn(name = "project_id"), inverseJoinColumns = @JoinColumn(name = "student_id"))
    private List<User> students = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_id", nullable = false)
    private User supervisor;

    @NotNull
    @Column(nullable = false)
    private LocalDate startDate;

    @NotNull
    @Column(nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectStatus status = ProjectStatus.PLANNED;

    // Enum interne
    public enum ProjectStatus {
        PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
    }
}
```

## <span style="color:blue">Quiz</span>

| Élément | Type | Rôle | Héritage | Pourquoi | Importance |
|---------|------|------|----------|----------|------------|
| id | Long | Identifiant | Aucun | Clé primaire | Unique |
| title | String | Titre | Aucun | Description | Obligatoire |
| description | String | Description | Aucun | Détails | Optionnel |
| questions | List<Question> | Questions | Aucun | Relation OneToMany | Liste |
| createdAt | LocalDateTime | Création | Aucun | Audit | Automatique |
| updatedAt | LocalDateTime | Mise à jour | Aucun | Audit | Automatique |
| active | Boolean | Actif | Aucun | Statut | Par défaut true |
| course | Course | Cours associé | Aucun | Relation ManyToOne | Optionnel |

Méthodes: addQuestion, removeQuestion, addQuestions, clearQuestions pour gérer la bidirectionnalité.

```java
// filepath: src/main/java/com/iatd/smarthub/model/quiz/Quiz.java
package com.iatd.smarthub.model.quiz;

import com.iatd.smarthub.model.course.Course;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Entity
@Table(name = "quizzes")
@Getter
@Setter
@ToString(exclude = "questions") // Évite la récursion dans toString()
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    // ✅ RELATION BIDIRECTIONNELLE AVEC QUESTIONS
    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference // Évite la sérialisation circulaire
    private List<Question> questions = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(nullable = false)
    private Boolean active = true;

    // === CONSTRUCTEURS ===
    public Quiz() {
    }

    public Quiz(String title, String description) {
        this.title = title;
        this.description = description;
    }

    // === MÉTHODES UTILITAIRES POUR GÉRER LA BIDIRECTIONNALITÉ ===

    /**
     * Ajoute une question en maintenant la cohérence bidirectionnelle
     */
    public void addQuestion(Question question) {
        questions.add(question);
        question.setQuiz(this); // Maintient la cohérence
    }

    /**
     * Supprime une question en maintenant la cohérence bidirectionnelle
     */
    public void removeQuestion(Question question) {
        questions.remove(question);
        question.setQuiz(null); // Maintient la cohérence
    }

    /**
     * Ajoute une liste de questions en maintenant la cohérence
     */
    public void addQuestions(List<Question> questionsToAdd) {
        questionsToAdd.forEach(this::addQuestion);
    }

    /**
     * Supprime toutes les questions en maintenant la cohérence
     */
    public void clearQuestions() {
        // Crée une copie pour éviter ConcurrentModificationException
        new ArrayList<>(questions).forEach(this::removeQuestion);
    }
    
 // Relation optionnelle avec Course (comme prévu dans le CDC)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;  // ← AJOUTER CETTE RELATION
}
```

## <span style="color:blue">Question</span>

| Élément | Type | Rôle | Héritage | Pourquoi | Importance |
|---------|------|------|----------|----------|------------|
| id | Long | Identifiant | Aucun | Clé primaire | Unique |
| text | String | Texte question | Aucun | Contenu | Obligatoire |
| type | QuestionType | Type | Aucun | Format | Obligatoire |
| options | List<String> | Options | Aucun | Choix | Pour choix multiples |
| correctAnswer | String | Réponse correcte | Aucun | Correction | Obligatoire |
| quiz | Quiz | Quiz parent | Aucun | Relation ManyToOne | Obligatoire |

Méthodes: addOption, removeOption.

```java
// filepath: src/main/java/com/iatd/smarthub/model/quiz/Question.java
package com.iatd.smarthub.model.quiz;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
@Getter
@Setter
@ToString(exclude = "quiz") // Évite la récursion dans toString()
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QuestionType type;

    @ElementCollection
    @CollectionTable(name = "question_options", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "option_text", length = 500)
    private List<String> options = new ArrayList<>();

    @Column(name = "correct_answer", nullable = false, length = 1000)
    private String correctAnswer;

    // ✅ RELATION BIDIRECTIONNELLE AVEC QUIZ
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    @JsonBackReference // Évite la sérialisation circulaire
    private Quiz quiz;

    // === CONSTRUCTEURS ===
    public Question() {
    }

    public Question(String text, QuestionType type, String correctAnswer, Quiz quiz) {
        this.text = text;
        this.type = type;
        this.correctAnswer = correctAnswer;
        this.quiz = quiz;
    }

    // AJOUTEZ CE CONSTRUCTEUR POUR CORRIGER L'ERREUR
    public Question(Long id, String text, QuestionType type, String correctAnswer, Quiz quiz) {
        this.id = id;
        this.text = text;
        this.type = type;
        this.correctAnswer = correctAnswer;
        this.quiz = quiz;
    }

    // === MÉTHODES UTILITAIRES ===
    public void addOption(String option) {
        this.options.add(option);
    }

    public void removeOption(String option) {
        this.options.remove(option);
    }
}
```

## <span style="color:blue">QuestionType</span>

Enum: SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, OPEN_ENDED

```java
// filepath: src/main/java/com/iatd/smarthub/model/quiz/QuestionType.java
package com.iatd.smarthub.model.quiz;

public enum QuestionType {
	SINGLE_CHOICE, 
    MULTIPLE_CHOICE,
    TRUE_FALSE,
    OPEN_ENDED
}
```

## <span style="color:blue">Answer</span>

| Élément | Type | Rôle | Héritage | Pourquoi | Importance |
|---------|------|------|----------|----------|------------|
| id | Long | Identifiant | Aucun | Clé primaire | Unique |
| question | Question | Question | Aucun | Relation ManyToOne | Obligatoire |
| quizAttempt | QuizAttempt | Tentative | Aucun | Relation ManyToOne | Obligatoire |
| answerText | String | Réponse | Aucun | Contenu | Obligatoire |
| isCorrect | Boolean | Correct | Aucun | Évaluation | Calculé |

Méthode: validateAnswer pour vérifier la réponse.

```java
// filepath: src/main/java/com/iatd/smarthub/model/quiz/Answer.java
package com.iatd.smarthub.model.quiz;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "answers")
@Getter
@Setter
@ToString(exclude = { "question", "quizAttempt" })
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_attempt_id", nullable = false)
    private QuizAttempt quizAttempt;

    @Column(name = "answer_text", nullable = false, columnDefinition = "TEXT")
    private String answerText;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    // === CONSTRUCTEURS ===
    public Answer() {
    }

    public Answer(Question question, QuizAttempt quizAttempt, String answerText) {
        this.question = question;
        this.quizAttempt = quizAttempt;
        this.answerText = answerText;
    }

    // === MÉTHODE UTILITAIRE ===
    public void validateAnswer() {
        if (question != null && question.getCorrectAnswer() != null) {
            this.isCorrect = question.getCorrectAnswer().equals(this.answerText);
        }
    }
}
```

## <span style="color:blue">QuizAttempt</span>

| Élément | Type | Rôle | Héritage | Pourquoi | Importance |
|---------|------|------|----------|----------|------------|
| id | Long | Identifiant | Aucun | Clé primaire | Unique |
| student | User | Étudiant | Aucun | Relation ManyToOne | Obligatoire |
| quiz | Quiz | Quiz | Aucun | Relation ManyToOne | Obligatoire |
| course | Course | Cours | Aucun | Relation ManyToOne | Optionnel |
| createdAt | LocalDateTime | Création | Aucun | Audit | Automatique |
| updatedAt | LocalDateTime | Mise à jour | Aucun | Audit | Automatique |
| answers | List<Answer> | Réponses | Aucun | Relation OneToMany | Liste |
| score | Double | Score | Aucun | Évaluation | Calculé |
| attemptedAt | LocalDateTime | Tentative | Aucun | Audit | Automatique |
| completedAt | LocalDateTime | Complétion | Aucun | Audit | Optionnel |
| status | AttemptStatus | Statut | Aucun | Suivi | Obligatoire |
| timeLimitMinutes | Integer | Limite temps | Aucun | Contrôle | Optionnel |
| timeSpentSeconds | Integer | Temps passé | Aucun | Métriques | Optionnel |
| maxAttempts | Integer | Max tentatives | Aucun | Règles | Optionnel |
| currentAttemptNumber | Integer | Numéro tentative | Aucun | Suivi | Optionnel |
| answersJson | String | Réponses JSON | Aucun | Stockage | Optionnel |

```java
// filepath: src/main/java/com/iatd/smarthub/model/quiz/QuizAttempt.java
// Ajoutez ces champs à votre QuizAttempt.java existant
package com.iatd.smarthub.model.quiz;

import com.iatd.smarthub.model.user.User;
import com.iatd.smarthub.model.course.Course; // <-- IMPORTANT
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quiz_attempts")
@Getter
@Setter
@ToString(exclude = { "student", "quiz", "answers" })
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;
    
    // ✅ NOUVEAU : Relation avec Course
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "quizAttempt", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Answer> answers = new ArrayList<>();
    
    @Column(name = "score")
    private Double score;

    @CreationTimestamp
    @Column(name = "attempted_at", updatable = false)
    private LocalDateTime attemptedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttemptStatus status = AttemptStatus.IN_PROGRESS;
    
    // ✅ NOUVEAU : Champs pour la supervision
    @Column(name = "time_limit_minutes")
    private Integer timeLimitMinutes;
    
    @Column(name = "time_spent_seconds")
    private Integer timeSpentSeconds;
    
    @Column(name = "max_attempts")
    private Integer maxAttempts;
    
    @Column(name = "current_attempt_number")
    private Integer currentAttemptNumber;
    
    @Column(name = "answers_json", columnDefinition = "TEXT")
    private String answersJson; // Pour stocker les réponses en JSON

    // === ENUM ÉTENDU ===
    public enum AttemptStatus {
        IN_PROGRESS,
        COMPLETED,
        ABANDONED,
        TIMEOUT // ✅ NOUVEAU
    }

    // === CONSTRUCTEURS ===
    public QuizAttempt() {
    }

    public QuizAttempt(User student, Quiz quiz) {
        this.student = student;
        this.quiz = quiz;
    }
    
    public QuizAttempt(User student, Course course) {
        this.student = student;
        this.course = course;
    }
}
```

## <span style="color:blue">KnowledgeBase</span>

| Élément | Type | Rôle | Héritage | Pourquoi | Importance |
|---------|------|------|----------|----------|------------|
| id | Long | Identifiant | Aucun | Clé primaire | Unique |
| title | String | Titre | Aucun | Description | Obligatoire |
| content | String | Contenu | Aucun | Texte | Optionnel |
| tags | List<String> | Tags | Aucun | Indexation | Liste |
| createdAt | LocalDateTime | Création | Aucun | Audit | Automatique |
| courseId | Long | ID cours | Aucun | Association | Optionnel |
| source | String | Source | Aucun | Provenance | Par défaut USER_UPLOAD |
| usageCount | Integer | Utilisations | Aucun | Métriques | Par défaut 0 |
| embedding | float[] | Vecteur | Aucun | RAG | Pour recherche sémantique |
| chunkIndex | Integer | Index chunk | Aucun | Segmentation | Par défaut 0 |
| chunkTotal | Integer | Total chunks | Aucun | Segmentation | Par défaut 1 |

Méthodes: addTag, addTags, incrementUsageCount, hasEmbedding.

```java
// filepath: src/main/java/com/iatd/smarthub/model/rag/KnowledgeBase.java
package com.iatd.smarthub.model.rag;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "knowledge_base")
@Getter
@Setter
public class KnowledgeBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String content;

    @ElementCollection
    @CollectionTable(
            name = "knowledge_base_tags",
            joinColumns = @JoinColumn(name = "knowledge_base_id")
    )
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "course_id")
    private Long courseId;

    @Column(length = 50)
    private String source = "USER_UPLOAD"; // USER_UPLOAD, COURSE_MATERIAL, EXTERNAL

    @Column(name = "usage_count")
    private Integer usageCount = 0;

    // === Champs pour le RAG vectoriel ===
    // CORRIGÉ: Changé en float[] pour être compatible avec RAGQuizService
    // Supprimé columnDefinition="vector" et @JdbcTypeCode(SqlTypes.VECTOR)
    @Lob
    @Column(name = "embedding")
    private float[] embedding;

    @Column(name = "chunk_index")
    private Integer chunkIndex = 0;

    @Column(name = "chunk_total")
    private Integer chunkTotal = 1;

    // === Constructeurs ===
    public KnowledgeBase() {}

    public KnowledgeBase(String title, String content, List<String> tags) {
        this.title = title;
        this.content = content;
        this.tags = tags != null ? tags : new ArrayList<>();
    }

    public KnowledgeBase(String title, String content, List<String> tags, String source) {
        this.title = title;
        this.content = content;
        this.tags = tags != null ? tags : new ArrayList<>();
        this.source = source;
    }

    // === Méthodes utilitaires ===
    public void addTag(String tag) {
        if (this.tags == null) this.tags = new ArrayList<>();
        if (tag != null && !tag.trim().isEmpty() && !this.tags.contains(tag.trim())) {
            this.tags.add(tag.trim());
        }
    }

    public void addTags(List<String> tags) {
        if (tags != null) {
            tags.forEach(this::addTag);
        }
    }

    public void incrementUsageCount() {
        if (this.usageCount == null) this.usageCount = 0;
        this.usageCount++;
    }

    public boolean hasEmbedding() {
        return embedding != null && embedding.length > 0;
    }
}
```

## <span style="color:blue">LearningProfile</span>

| Élément | Type | Rôle | Héritage | Pourquoi | Importance |
|---------|------|------|----------|----------|------------|
| id | Long | Identifiant | Aucun | Clé primaire | Unique |
| user | User | Utilisateur | Aucun | Relation OneToOne | Obligatoire |
| interests | List<String> | Intérêts | Aucun | Profil | Liste |
| weaknesses | List<String> | Faiblesses | Aucun | Profil | Liste |
| learningStyle | String | Style apprentissage | Aucun | Personnalisation | Par défaut READING_WRITING |
| proficiencyLevel | String | Niveau | Aucun | Évaluation | Par défaut INTERMEDIATE |
| createdAt | LocalDateTime | Création | Aucun | Audit | Automatique |
| updatedAt | LocalDateTime | Mise à jour | Aucun | Audit | Automatique |

Méthodes: addInterest, addWeakness.

```java
// filepath: src/main/java/com/iatd/smarthub/model/rag/LearningProfile.java
package com.iatd.smarthub.model.rag;

import com.iatd.smarthub.model.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "learning_profiles")
@Getter
@Setter
public class LearningProfile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @ElementCollection
    @CollectionTable(name = "user_interests", joinColumns = @JoinColumn(name = "learning_profile_id"))
    @Column(name = "interest")
    private List<String> interests = new ArrayList<>();
    
    @ElementCollection
    @CollectionTable(name = "user_weaknesses", joinColumns = @JoinColumn(name = "learning_profile_id"))
    @Column(name = "weakness")
    private List<String> weaknesses = new ArrayList<>();
    
    @Column(name = "learning_style")
    private String learningStyle = "READING_WRITING"; // "VISUAL", "AUDITORY", "READING_WRITING", "KINESTHETIC"
    
    @Column(name = "proficiency_level")
    private String proficiencyLevel = "INTERMEDIATE"; // "BEGINNER", "INTERMEDIATE", "ADVANCED"
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructeurs
    public LearningProfile() {}
    
    public LearningProfile(User user) {
        this.user = user;
        this.interests = new ArrayList<>();
        this.weaknesses = new ArrayList<>();
    }
    
    // Méthodes utilitaires
    public void addInterest(String interest) {
        if (!this.interests.contains(interest)) {
            this.interests.add(interest);
        }
    }
    
    public void addWeakness(String weakness) {
        if (!this.weaknesses.contains(weakness)) {
            this.weaknesses.add(weakness);
        }
    }
}
```

## <span style="color:blue">QuizRecommendation</span>

| Élément | Type | Rôle | Héritage | Pourquoi | Importance |
|---------|------|------|----------|----------|------------|
| id | Long | Identifiant | Aucun | Clé primaire | Unique |
| user | User | Utilisateur | Aucun | Relation ManyToOne | Obligatoire |
| quiz | Quiz | Quiz recommandé | Aucun | Relation ManyToOne | Optionnel |
| recommendedTopic | String | Sujet | Aucun | Contenu | Optionnel |
| reason | String | Raison | Aucun | Explication | Optionnel |
| confidenceScore | Double | Confiance | Aucun | Métriques | Par défaut 0.0 |
| recommendedAt | LocalDateTime | Recommandation | Aucun | Audit | Optionnel |
| accepted | Boolean | Accepté | Aucun | Statut | Par défaut false |
| acceptedAt | LocalDateTime | Acceptation | Aucun | Audit | Optionnel |
| completedAt | LocalDateTime | Complétion | Aucun | Audit | Optionnel |

```java
// filepath: src/main/java/com/iatd/smarthub/model/rag/QuizRecommendation.java
package com.iatd.smarthub.model.rag;

import com.iatd.smarthub.model.quiz.Quiz;
import com.iatd.smarthub.model.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_recommendations")
@Getter
@Setter
public class QuizRecommendation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;
    
    @Column(name = "recommended_topic", length = 255)
    private String recommendedTopic;
    
    @Column(columnDefinition = "TEXT")
    private String reason;
    
    @Column(name = "confidence_score")
    private Double confidenceScore = 0.0;
    
    @Column(name = "recommended_at")
    private LocalDateTime recommendedAt;
    
    private Boolean accepted = false;
    
    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    // Constructeurs
    public QuizRecommendation() {}
    
    public QuizRecommendation(User user, String recommendedTopic, String reason) {
        this.user = user;
        this.recommendedTopic = recommendedTopic;
        this.reason = reason;
        this.recommendedAt = LocalDateTime.now();
    }
}
```

## <span style="color:blue">Resource</span>

| Élément | Type | Rôle | Héritage | Pourquoi | Importance |
|---------|------|------|----------|----------|------------|
| id | Long | Identifiant | BaseEntity | Hérité | Audit |
| title | String | Titre | Aucun | Description | Obligatoire |
| authors | List<User> | Auteurs | Aucun | Relation ManyToMany | Liste |
| abstractText | String | Résumé | Aucun | Aperçu | Optionnel |
| publicationDate | LocalDate | Publication | Aucun | Métadonnées | Obligatoire |
| originalFileName | String | Nom original | Aucun | Métadonnées | Optionnel |
| storedFileName | String | Nom stocké | Aucun | Accès | Optionnel |
| fileSize | Long | Taille | Aucun | Métadonnées | Optionnel |
| fileType | String | Type | Aucun | Classification | Optionnel |
| type | ResourceType | Type | Aucun | Classification | Obligatoire |
| createdAt | LocalDateTime | Création | BaseEntity | Hérité | Audit |
| updatedAt | LocalDateTime | Mise à jour | BaseEntity | Hérité | Audit |

Hérite de BaseEntity.

```java
// filepath: src/main/java/com/iatd/smarthub/model/resource/Resource.java
package com.iatd.smarthub.model.resource;

import com.iatd.smarthub.model.base.BaseEntity;
import com.iatd.smarthub.model.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "resources")
@Getter
@Setter
public class Resource extends BaseEntity {

    @NotBlank
    @Size(min = 3, max = 255)
    @Column(nullable = false)
    private String title;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "resource_authors",
        joinColumns = @JoinColumn(name = "resource_id"),
        inverseJoinColumns = @JoinColumn(name = "author_id")
    )
    private List<User> authors = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String abstractText;

    @NotNull
    @Column(nullable = false)
    private LocalDate publicationDate;

    // Champs pour l'upload de fichiers
    @Size(max = 255)
    private String originalFileName;
    
    @Size(max = 255)
    private String storedFileName;
    
    private Long fileSize;
    
    private String fileType;

    public enum ResourceType {
        ARTICLE, THESIS, PUBLICATION, REPORT, OTHER
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceType type = ResourceType.ARTICLE;
}
```

## Relations entre les Modèles

### Héritage
- **BaseEntity** est étendue par :
  - Announcement
  - Internship
  - Project
  - Resource

Cela permet un audit automatique (createdAt, updatedAt) pour ces entités.

### Polymorphisme
- Utilisation d'enums pour classifier :
  - Role dans User (STUDENT, TEACHER, ADMIN)
  - AnnouncementType (SEMINAR, WORKSHOP, DEFENSE, JOB_OFFER, INTERNSHIP_OFFER)
  - ResourceType (ARTICLE, THESIS, PUBLICATION, REPORT, OTHER)
  - QuestionType (SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, OPEN_ENDED)
  - InternshipStatus et ProjectStatus (PLANNED, IN_PROGRESS, COMPLETED, CANCELLED)
  - AttemptStatus (IN_PROGRESS, COMPLETED, ABANDONED, TIMEOUT)
  - ResourceType et InteractionType dans UserInteraction

### Relations JPA
- **User** central :
  - ManyToMany avec Course (students)
  - OneToOne avec LearningProfile
  - ManyToOne dans Announcement (author), Internship (student/supervisor), Project (supervisor), Course (teacher), CourseFile (uploadedBy), QuizAttempt (student), QuizRecommendation (user), Resource (authors)
- **Course** :
  - ManyToOne avec User (teacher)
  - ManyToMany avec User (students)
  - OneToMany avec CourseFile
  - ManyToOne avec Quiz
  - ManyToOne avec QuizAttempt
- **Quiz** :
  - OneToMany avec Question
  - ManyToOne avec Course
  - ManyToOne avec QuizAttempt, QuizRecommendation
- **Question** :
  - ManyToOne avec Quiz
  - ManyToOne avec Answer
- **QuizAttempt** :
  - OneToMany avec Answer
  - ManyToOne avec User, Quiz, Course
- **KnowledgeBase** : Entité isolée pour RAG
- **LearningProfile** : OneToOne avec User
- **QuizRecommendation** : ManyToOne avec User, Quiz

## Conclusion

L'architecture des modèles SmartHub est bien structurée autour de l'entité User centrale, avec une hiérarchie d'héritage via BaseEntity pour l'audit. Les relations JPA permettent une modélisation fidèle du domaine éducatif, avec support pour les cours, quiz, projets, stages et ressources. L'utilisation d'enums assure la cohérence des données, et les entités RAG (KnowledgeBase, LearningProfile, QuizRecommendation) étendent les capacités d'intelligence artificielle. Les classes vides (Assignment, etc.) indiquent des points d'extension futurs. Cette conception favorise la maintenabilité et l'évolutivité du système.







# Documentation des DTOs SmartHub

## <span style="color:blue">UserRequestDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour la création d'utilisateurs | Validation des données d'entrée, conversion en entité User via toEntity() | Reçoit les données du client pour créer un utilisateur, valide les contraintes | Assure la sécurité et l'intégrité des données utilisateur lors de l'inscription, facilite la communication entre le front-end et le service utilisateur |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/UserRequestDTO.java
package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.user.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRequestDTO {

    @NotBlank(message = "Le nom d'utilisateur est obligatoire")
    @Size(min = 3, max = 50, message = "Le nom d'utilisateur doit contenir entre 3 et 50 caractères")
    private String username;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "L'email doit être valide")
    @Size(max = 100, message = "L'email ne peut pas dépasser 100 caractères")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 6, max = 120, message = "Le mot de passe doit contenir entre 6 et 120 caractères")
    private String password;

    private User.Role role;

    @Size(max = 50, message = "Le prénom ne peut pas dépasser 50 caractères")
    private String firstName;

    @Size(max = 50, message = "Le nom ne peut pas dépasser 50 caractères")
    private String lastName;

    @Size(max = 20, message = "Le numéro de téléphone ne peut pas dépasser 20 caractères")
    private String phoneNumber;

    // Méthode pour convertir en Entity User
    public User toEntity() {
        User user = new User();
        user.setUsername(this.username.trim());
        user.setEmail(this.email.trim().toLowerCase());
        user.setPassword(this.password); // Sera hashé plus tard
        user.setRole(this.role != null ? this.role : User.Role.STUDENT);
        user.setFirstName(this.firstName != null ? this.firstName.trim() : null);
        user.setLastName(this.lastName != null ? this.lastName.trim() : null);
        user.setPhoneNumber(this.phoneNumber != null ? this.phoneNumber.trim() : null);
        user.setActive(true);
        return user;
    }
}
```

### Aspects Techniques
- **@Getter @Setter**: Annotations Lombok générant automatiquement les getters et setters pour tous les champs.
- **@NotBlank, @Size, @Email**: Annotations de validation Jakarta pour valider les données entrantes avant traitement.
- **toEntity()**: Méthode de conversion DTO vers entité, appliquant la logique métier (trim, lowercase, valeurs par défaut).
- **Messages personnalisés**: Fournissent des messages d'erreur spécifiques en français pour l'internationalisation.

## <span style="color:blue">UserResponseDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour les réponses utilisateur | Constructeur pour convertir User en DTO, getters/setters pour l'accès aux données | Envoie les données utilisateur au client sans informations sensibles | Protège la confidentialité en excluant le mot de passe, standardise les réponses API pour les utilisateurs |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/UserResponseDTO.java
package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.user.User;
import java.time.LocalDateTime;

public class UserResponseDTO {
    
    private Long id;
    private String username;
    private String email;
    private User.Role role;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLogin;
    private String profileImage;

    
    public UserResponseDTO(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.role = user.getRole();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.phoneNumber = user.getPhoneNumber();
        this.active = user.getActive();
        this.createdAt = user.getCreatedAt();
        this.updatedAt = user.getUpdatedAt();
        this.lastLogin = user.getLastLogin();
        this.profileImage = user.getProfileImage();
        
    }

    public UserResponseDTO() {}

    // Getters manuels
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public User.Role getRole() { return role; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getPhoneNumber() { return phoneNumber; }
    public Boolean getActive() { return active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getLastLogin() { return lastLogin; }
    public String getProfileImage() { return profileImage; } // AJOUTER CE GETTER


    // Setters manuels
    public void setId(Long id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setEmail(String email) { this.email = email; }
    public void setRole(User.Role role) { this.role = role; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public void setActive(Boolean active) { this.active = active; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; } // AJOUTER CE SETTER

}
```

### Aspects Techniques
- **Constructeur paramétré**: Convertit directement une entité User en DTO, assurant la cohérence des données.
- **Getters/setters manuels**: Implémentation explicite pour un contrôle fin, évitant Lombok pour plus de visibilité.
- **Exclusion du mot de passe**: Sécurise les réponses API en ne transmettant pas les informations sensibles.
- **Constructeur par défaut**: Requis pour la désérialisation JSON par Jackson.

## <span style="color:blue">CourseRequestDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour la création de cours | Validation des données de cours, support des fichiers uploadés | Reçoit les informations du cours et les fichiers du client | Permet la création de cours avec ressources multimédias, améliore l'expérience d'enseignement |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/CourseRequestDTO.java
package com.iatd.smarthub.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
public class CourseRequestDTO {
    @NotBlank(message = "Le titre est obligatoire")
    private String title;
    
    private String description;
    
    @NotNull(message = "L'ID de l'enseignant est obligatoire")
    private Long teacherId;
    
    // ✅ AJOUT : Liste des fichiers
    private List<MultipartFile> files;
}
```

### Aspects Techniques
- **@Data**: Annotation Lombok générant toString, equals, hashCode, getters/setters automatiquement.
- **@NotBlank, @NotNull**: Validation des champs obligatoires avec messages personnalisés.
- **List<MultipartFile>**: Support des uploads multiples de fichiers via Spring Web.
- **Validation côté serveur**: Assure l'intégrité des données avant traitement métier.

## <span style="color:blue">CourseResponseDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour les réponses de cours | Agrège les informations du cours avec étudiants et fichiers | Envoie les détails complets du cours au client | Fournit une vue complète des cours avec métriques (nombre d'étudiants, fichiers), facilite la gestion pédagogique |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/CourseResponseDTO.java
package com.iatd.smarthub.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;
import java.time.LocalDateTime;

@Getter
@Setter
public class CourseResponseDTO {
    private Long id;
    private String title;
    private String description;
    private Long teacherId;
    private String teacherName;
    private LocalDateTime createdDate;
    private List<StudentResponseDTO> students;
    private List<CourseFileDTO> files; // AJOUTEZ CETTE LIGNE
    
 // AJOUTEZ CES DEUX CHAMPS ↓
    private Integer studentCount = 0;
    private Integer fileCount = 0;

    // Constructeur par défaut
    public CourseResponseDTO() {
    }
    
}
```

### Aspects Techniques
- **@Getter @Setter**: Lombok pour générer les accesseurs, avec contrôle manuel des champs.
- **List<StudentResponseDTO> et List<CourseFileDTO>**: Agrégation de DTOs imbriqués pour une réponse complète.
- **Champs calculés**: studentCount et fileCount pour optimiser l'affichage côté client sans calculs supplémentaires.
- **Constructeur par défaut**: Pour la compatibilité avec Jackson.

## <span style="color:blue">QuizRequestDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour la création de quiz | Validation des données de quiz, gestion des questions | Reçoit la structure complète du quiz du client | Permet la création de quiz complexes avec validation, soutient l'évaluation automatique |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/QuizRequestDTO.java
package com.iatd.smarthub.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class QuizRequestDTO {

    @NotBlank(message = "Le titre du quiz est obligatoire")
    @Size(max = 255, message = "Le titre ne peut pas dépasser 255 caractères")
    private String title;

    @Size(max = 1000, message = "La description ne peut pas dépasser 1000 caractères")
    private String description;

    @NotNull(message = "Le statut actif est obligatoire")
    private Boolean active = true;

    @Valid
    @Size(max = 50, message = "Un quiz ne peut pas contenir plus de 50 questions")
    private List<QuestionRequestDTO> questions = new ArrayList<>();

    // Constructeurs
    public QuizRequestDTO() {
    }

    public QuizRequestDTO(String title, String description) {
        this.title = title;
        this.description = description;
    }

    // Méthodes utilitaires
    public void addQuestion(QuestionRequestDTO question) {
        this.questions.add(question);
    }

    public void removeQuestion(QuestionRequestDTO question) {
        this.questions.remove(question);
    }
}
```

### Aspects Techniques
- **@Valid**: Valide récursivement les objets QuestionRequestDTO dans la liste.
- **@Size(max = 50)**: Limite le nombre de questions pour des raisons de performance.
- **Méthodes utilitaires**: addQuestion et removeQuestion pour manipuler la liste de manière programmatique.
- **Constructeurs multiples**: Flexibilité d'instanciation.

## <span style="color:blue">QuizResponseDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour les réponses de quiz | Structure les données de quiz avec questions | Envoie les quiz complets au client | Facilite l'affichage et l'interaction avec les quiz, soutient l'apprentissage interactif |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/QuizResponseDTO.java
package com.iatd.smarthub.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class QuizResponseDTO {

    private Long id;
    private String title;
    private String description;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<QuestionResponseDTO> questions = new ArrayList<>();

    // Constructeurs
    public QuizResponseDTO() {
    }

    public QuizResponseDTO(Long id, String title, String description, Boolean active,
            LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.active = active;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Méthodes utilitaires
    public void addQuestion(QuestionResponseDTO question) {
        this.questions.add(question);
    }
}
```

### Aspects Techniques
- **@Getter @Setter**: Lombok pour les accesseurs.
- **List<QuestionResponseDTO>**: Structure hiérarchique pour les données de quiz.
- **Constructeur paramétré**: Pour l'instanciation avec données partielles.
- **addQuestion()**: Méthode utilitaire pour construire la liste.

## <span style="color:blue">QuestionRequestDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour la création de questions | Validation des champs de question | Reçoit les données de question individuelles | Assure la cohérence des questions dans les quiz, soutient la diversité des types de questions |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/QuestionRequestDTO.java
package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.quiz.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class QuestionRequestDTO {

    @NotBlank(message = "Le texte de la question est obligatoire")
    @Size(max = 2000, message = "Le texte de la question ne peut pas dépasser 2000 caractères")
    private String text;

    @NotNull(message = "Le type de question est obligatoire")
    private QuestionType type;

    @Size(max = 10, message = "Une question ne peut pas avoir plus de 10 options")
    private List<@NotBlank String> options = new ArrayList<>();

    @NotBlank(message = "La réponse correcte est obligatoire")
    @Size(max = 1000, message = "La réponse correcte ne peut pas dépasser 1000 caractères")
    private String correctAnswer;

    // Constructeurs
    public QuestionRequestDTO() {
    }

    public QuestionRequestDTO(String text, QuestionType type, String correctAnswer) {
        this.text = text;
        this.type = type;
        this.correctAnswer = correctAnswer;
    }
}
```

### Aspects Techniques
- **@NotNull pour enum**: Assure que le type de question est spécifié.
- **List<@NotBlank String> options**: Validation des éléments de la liste.
- **@Size(max = 10)**: Limite le nombre d'options pour l'interface utilisateur.
- **Constructeurs**: Pour flexibilité.

## <span style="color:blue">QuestionResponseDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour les réponses de questions | Inclut les options et explications | Envoie les questions avec contexte au client | Améliore l'expérience d'apprentissage en fournissant des explications, soutient la correction automatique |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/QuestionResponseDTO.java
package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.quiz.QuestionType;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class QuestionResponseDTO {

    private Long id;
    private String text;
    private QuestionType type;
    private List<String> options = new ArrayList<>();
    private String correctAnswer;
    private Long quizId;
    private String explanation;  // AJOUTÉ ICI

    // Constructeurs
    public QuestionResponseDTO() {
    }

    public QuestionResponseDTO(Long id, String text, QuestionType type, List<String> options,
            String correctAnswer, Long quizId, String explanation) {
        this.id = id;
        this.text = text;
        this.type = type;
        this.options = options != null ? new ArrayList<>(options) : new ArrayList<>();
        this.correctAnswer = correctAnswer;
        this.quizId = quizId;
        this.explanation = explanation;
    }
    
    // Méthodes utilitaires
    public void addOption(String option) {
        if (this.options == null) {
            this.options = new ArrayList<>();
        }
        this.options.add(option);
    }
    
    public void addAllOptions(List<String> options) {
        if (this.options == null) {
            this.options = new ArrayList<>();
        }
        this.options.addAll(options);
    }
}
```

### Aspects Techniques
- **@Getter @Setter**: Lombok pour les accesseurs.
- **Constructeur paramétré**: Avec tous les paramètres pour l'instanciation complète.
- **Méthodes utilitaires**: addOption et addAllOptions pour manipuler la liste d'options.
- **quizId**: Référence au quiz parent pour le contexte.

## <span style="color:blue">AuthRequest</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour l'authentification | Contient les credentials de connexion | Reçoit username et password du client | Sécurise l'accès au système, base de l'authentification JWT |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/AuthRequest.java
package com.iatd.smarthub.dto;

import lombok.Data;

@Data
public class AuthRequest {
    private String username;
    private String password;
}
```

### Aspects Techniques
- **@Data**: Lombok générant toString, equals, hashCode, getters/setters.
- **Champs simples**: Username et password pour l'authentification basique.
- **Pas de validation explicite**: Déléguée au service d'authentification.

## <span style="color:blue">AuthResponse</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour les réponses d'authentification | Contient le token JWT et infos utilisateur | Envoie le token d'accès au client | Permet l'authentification stateless, sécurise les communications API |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/AuthResponse.java
package com.iatd.smarthub.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private String username;
    private String role;

    public AuthResponse(String token, String username, String role) {
        this.token = token;
        this.username = username;
        this.role = role;
    }
}
```

### Aspects Techniques
- **@Data**: Lombok pour boilerplate.
- **Constructeur paramétré**: Pour l'instanciation avec le token généré.
- **Token JWT**: Stockage du token pour les communications suivantes.

## <span style="color:blue">AnnouncementRequestDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour la création d'annonces | Validation des données d'annonce | Reçoit les informations d'annonce du client | Facilite la communication institutionnelle, soutient les annonces de type séminaire, stage, etc. |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/AnnouncementRequestDTO.java
// src/main/java/com/iatd/smarthub/dto/AnnouncementRequestDTO.java
package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.announcement.AnnouncementType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AnnouncementRequestDTO {

    @NotBlank(message = "Le titre de l'annonce est obligatoire")
    @Size(min = 3, max = 255, message = "Le titre doit contenir entre 3 et 255 caractères")
    private String title;

    @NotBlank(message = "Le contenu de l'annonce est obligatoire")
    @Size(min = 10, message = "Le contenu doit contenir au moins 10 caractères")
    private String content;

    @NotNull(message = "Le type d'annonce est obligatoire")
    private AnnouncementType type;

    @NotNull(message = "La date de l'annonce est obligatoire")
    private LocalDateTime date;

    // ✅ SUPPRIMÉ : authorId n'est plus nécessaire car l'auteur est l'utilisateur connecté
    // @NotNull(message = "L'ID de l'auteur est obligatoire")
    // private Long authorId;

    private Boolean published = true;
}
```

### Aspects Techniques
- **@Getter @Setter**: Lombok pour les accesseurs.
- **@NotBlank, @Size, @NotNull**: Validation complète des champs.
- **AnnouncementType enum**: Référence à l'enum du modèle.
- **published par défaut true**: Valeur par défaut pour la publication.

## <span style="color:blue">AnnouncementResponseDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour les réponses d'annonces | Inclut l'auteur via UserBasicDTO | Envoie les annonces avec contexte auteur | Améliore la transparence en montrant l'origine des annonces, soutient la communication communautaire |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/AnnouncementResponseDTO.java
// src/main/java/com/iatd/smarthub/dto/AnnouncementResponseDTO.java
package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.announcement.Announcement;
import com.iatd.smarthub.model.announcement.AnnouncementType;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AnnouncementResponseDTO {
    private Long id;
    private String title;
    private String content;
    private AnnouncementType type;
    private LocalDateTime date;
    private UserBasicDTO author;
    private Boolean published;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AnnouncementResponseDTO(Announcement announcement) {
        this.id = announcement.getId();
        this.title = announcement.getTitle();
        this.content = announcement.getContent();
        this.type = announcement.getType();
        this.date = announcement.getDate();
        this.published = announcement.getPublished();
        this.createdAt = announcement.getCreatedAt();
        this.updatedAt = announcement.getUpdatedAt();

        // Convertir l'auteur en UserBasicDTO
        if (announcement.getAuthor() != null) {
            this.author = new UserBasicDTO(announcement.getAuthor());
        }
    }

    // Constructeur par défaut pour la désérialisation
    public AnnouncementResponseDTO() {
    }
}
```

### Aspects Techniques
- **Constructeur paramétré**: Convertit l'entité Announcement en DTO.
- **UserBasicDTO author**: Réduction des données utilisateur pour éviter la surcharge.
- **Constructeur par défaut**: Pour Jackson.

## <span style="color:blue">InternshipRequestDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour la création de stages | Validation des données de stage | Reçoit les informations de stage du client | Gère les stages étudiants, facilite le suivi des expériences professionnelles |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/InternshipRequestDTO.java
package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.internship.Internship;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class InternshipRequestDTO {

    @NotBlank(message = "Le titre du stage est obligatoire")
    @Size(min = 3, max = 255, message = "Le titre doit contenir entre 3 et 255 caractères")
    private String title;

    @Size(max = 1000, message = "La description ne peut pas dépasser 1000 caractères")
    private String description;

    @NotNull(message = "L'ID de l'étudiant est obligatoire")
    private Long studentId;

    // ❌ SUPPRIMER cette ligne - le superviseur est assigné automatiquement
    // @NotNull(message = "L'ID du superviseur est obligatoire")
    // private Long supervisorId;

    // ✅ OU la rendre optionnelle :
    private Long supervisorId; // Sans annotation @NotNull

    @NotBlank(message = "Le nom de l'entreprise est obligatoire")
    @Size(max = 255, message = "Le nom de l'entreprise ne peut pas dépasser 255 caractères")
    private String company;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDate startDate;

    @NotNull(message = "La date de fin est obligatoire")
    private LocalDate endDate;

    private Internship.InternshipStatus status = Internship.InternshipStatus.PLANNED;
}
```

### Aspects Techniques
- **@Getter @Setter**: Lombok.
- **Validation complète**: Tous les champs critiques validés.
- **supervisorId optionnel**: Logique métier gérant l'assignation automatique.
- **Référence à enum**: Internship.InternshipStatus.

## <span style="color:blue">InternshipResponseDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour les réponses de stages | Inclut étudiant et superviseur | Envoie les détails complets du stage | Fournit une vue d'ensemble des stages, soutient le suivi pédagogique et professionnel |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/InternshipResponseDTO.java
package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.internship.Internship;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class InternshipResponseDTO {
    private Long id;
    private String title;
    private String description;
    private UserBasicDTO student; // ← Remplacé par UserBasicDTO
    private UserBasicDTO supervisor; // ← Remplacé par UserBasicDTO
    private String company;
    private LocalDate startDate;
    private LocalDate endDate;
    private Internship.InternshipStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public InternshipResponseDTO(Internship internship) {
        this.id = internship.getId();
        this.title = internship.getTitle();
        this.description = internship.getDescription();

        // Convertir les User en UserBasicDTO
        if (internship.getStudent() != null) {
            this.student = new UserBasicDTO(internship.getStudent());
        }
        if (internship.getSupervisor() != null) {
            this.supervisor = new UserBasicDTO(internship.getSupervisor());
        }

        this.company = internship.getCompany();
        this.startDate = internship.getStartDate();
        this.endDate = internship.getEndDate();
        this.status = internship.getStatus();
        this.createdAt = internship.getCreatedAt();
        this.updatedAt = internship.getUpdatedAt();
    }

    // Constructeur par défaut pour la désérialisation
    public InternshipResponseDTO() {
    }
}
```

### Aspects Techniques
- **Constructeur paramétré**: Conversion entité vers DTO avec gestion des nulls.
- **UserBasicDTO**: Réduction des données pour optimisation.
- **Gestion des nulls**: Vérifications pour éviter les NullPointerException.

## <span style="color:blue">ProjectRequestDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour la création de projets | Validation des données de projet | Reçoit les informations de projet du client | Gère les projets étudiants, facilite la collaboration en groupe |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/ProjectRequestDTO.java
package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.project.Project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class ProjectRequestDTO {

    @NotBlank(message = "Le titre du projet est obligatoire")
    @Size(min = 3, max = 255, message = "Le titre doit contenir entre 3 et 255 caractères")
    private String title;

    @Size(max = 1000, message = "La description ne peut pas dépasser 1000 caractères")
    private String description;

    private List<Long> studentIds;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDate startDate;

    @NotNull(message = "La date de fin est obligatoire")
    private LocalDate endDate;

    private Project.ProjectStatus status = Project.ProjectStatus.PLANNED;
}
```

### Aspects Techniques
- **@Getter @Setter**: Lombok.
- **List<Long> studentIds**: IDs des étudiants pour la relation Many-to-Many.
- **Validation des dates**: Assure la cohérence temporelle.

## <span style="color:blue">ProjectResponseDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour les réponses de projets | Inclut étudiants et superviseur | Envoie les détails complets du projet | Fournit une vue d'ensemble des projets, soutient la gestion de projets éducatifs |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/ProjectResponseDTO.java
package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.project.Project;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Getter
@Setter
public class ProjectResponseDTO {

    private Long id;
    private String title;
    private String description;
    private List<UserBasicDTO> students = new ArrayList<>();  // ✅ Initialiser avec liste vide
    private UserBasicDTO supervisor;
    private LocalDate startDate;
    private LocalDate endDate;
    private Project.ProjectStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ProjectResponseDTO(Project project) {
        this.id = project.getId();
        this.title = project.getTitle();
        this.description = project.getDescription();
        
        // ✅ CORRECTION : Toujours initialiser la liste, même si project.getStudents() est null
        if (project.getStudents() != null) {
            this.students = project.getStudents().stream()
                    .map(UserBasicDTO::new)
                    .collect(Collectors.toList());
        } else {
            this.students = new ArrayList<>(); // ✅ Liste vide si null
        }
        
        if (project.getSupervisor() != null) {
            this.supervisor = new UserBasicDTO(project.getSupervisor());
        }
        
        this.startDate = project.getStartDate();
        this.endDate = project.getEndDate();
        this.status = project.getStatus();
        this.createdAt = project.getCreatedAt();
        this.updatedAt = project.getUpdatedAt();
    }

    // Constructeur par défaut
    public ProjectResponseDTO() {
        this.students = new ArrayList<>(); // ✅ Initialiser dans le constructeur par défaut
    }
}
```

### Aspects Techniques
- **Constructeur paramétré**: Conversion avec stream pour mapper les étudiants.
- **Gestion des nulls**: Listes initialisées pour éviter les erreurs.
- **Stream API**: Utilisation de Java 8 streams pour la transformation.

## <span style="color:blue">ResourceRequestDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour la création de ressources | Support des fichiers uploadés | Reçoit les ressources avec fichiers du client | Enrichit la bibliothèque de ressources, soutient l'apprentissage avec documents |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/ResourceRequestDTO.java
package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.resource.Resource;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class ResourceRequestDTO {

    @NotBlank(message = "Le titre est obligatoire")
    @Size(min = 3, max = 255, message = "Le titre doit contenir entre 3 et 255 caractères")
    private String title;

    // ✅ Rendre optionnel - l'utilisateur connecté sera automatiquement ajouté
    private List<Long> authorIds;

    @Size(max = 2000, message = "Le résumé ne peut pas dépasser 2000 caractères")
    private String abstractText;

    @NotNull(message = "La date de publication est obligatoire")
    private LocalDate publicationDate;

    private MultipartFile file; // Fichier uploadé

    private Resource.ResourceType type = Resource.ResourceType.ARTICLE;
}
```

### Aspects Techniques
- **@Getter @Setter**: Lombok.
- **MultipartFile file**: Support de l'upload de fichiers.
- **List<Long> authorIds**: Optionnel pour assignation automatique.
- **Resource.ResourceType**: Référence à l'enum.

## <span style="color:blue">ResourceResponseDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour les réponses de ressources | Inclut auteurs et métadonnées de fichier | Envoie les ressources avec URLs de téléchargement | Facilite l'accès aux ressources éducatives, soutient la gestion documentaire |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/ResourceResponseDTO.java
package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.resource.Resource;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
public class ResourceResponseDTO {

    private Long id;
    private String title;
    private List<UserBasicDTO> authors;
    private String abstractText;
    private LocalDate publicationDate;
    private String originalFileName; // Nom original
    private String fileDownloadUrl; // URL pour télécharger le fichier
    private Long fileSize; // Taille du fichier
    private String fileType; // Type MIME
    private Resource.ResourceType type;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ResourceResponseDTO(Resource resource) {
        this.id = resource.getId();
        this.title = resource.getTitle();
        this.abstractText = resource.getAbstractText();
        this.publicationDate = resource.getPublicationDate();
        this.originalFileName = resource.getOriginalFileName();
        this.fileSize = resource.getFileSize();
        this.fileType = resource.getFileType();
        this.type = resource.getType();
        this.createdAt = resource.getCreatedAt();
        this.updatedAt = resource.getUpdatedAt();

        // Convertir les auteurs en UserBasicDTO
        if (resource.getAuthors() != null) {
            this.authors = resource.getAuthors().stream()
                    .map(UserBasicDTO::new)
                    .collect(Collectors.toList());
        }
    }

    public ResourceResponseDTO() {
    }
}
```

### Aspects Techniques
- **Constructeur paramétré**: Conversion avec stream pour les auteurs.
- **Métadonnées de fichier**: Inclut URLs et tailles pour l'interface utilisateur.
- **Gestion des nulls**: Vérifications pour les auteurs.

## <span style="color:blue">UserBasicDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO basique pour les utilisateurs | Informations essentielles utilisateur | Utilisé dans d'autres DTOs pour éviter la récursion | Réduit la duplication de données, optimise les réponses API |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/UserBasicDTO.java
package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.user.User;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserBasicDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String username;
    private String role;

    public UserBasicDTO(User user) {
        this.id = user.getId();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.email = user.getEmail();
        this.username = user.getUsername();
        this.role = user.getRole() != null ? user.getRole().name() : null;
    }

    // Constructeur par défaut pour la désérialisation
    public UserBasicDTO() {
    }
}
```

### Aspects Techniques
- **@Getter @Setter**: Lombok.
- **Constructeur paramétré**: Conversion simplifiée de User.
- **role.toString()**: Conversion de l'enum en string.
- **Constructeur par défaut**: Pour Jackson.

## <span style="color:blue">StudentResponseDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour les étudiants | Informations de base étudiant | Utilisé dans les listes d'étudiants | Spécialisé pour les vues étudiant, soutient les interfaces pédagogiques |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/StudentResponseDTO.java
package com.iatd.smarthub.dto;

import lombok.Data;

@Data
public class StudentResponseDTO {
    private Long id;
    private String username;
    private String email;
    private String firstName; // AJOUTEZ SI NÉCESSAIRE
    private String lastName;  // AJOUTEZ SI NÉCESSAIRE
}
```

### Aspects Techniques
- **@Data**: Lombok générant tout le boilerplate.
- **Champs minimaux**: Pour les vues étudiant simplifiées.

## <span style="color:blue">CourseFileDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour les fichiers de cours | Métadonnées des fichiers | Envoie les infos de fichiers sans contenu | Permet la gestion des ressources de cours, soutient l'organisation pédagogique |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/CourseFileDTO.java
package com.iatd.smarthub.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CourseFileDTO {
    private Long id;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private LocalDateTime uploadedDate;
    private String uploadedByUsername;
    
    // AJOUTEZ CE CONSTRUCTEUR SANS ARGUMENTS
    public CourseFileDTO() {
    }
    
    // Constructeur pour faciliter la conversion
    public CourseFileDTO(Long id, String fileName, String fileType, Long fileSize, 
                        LocalDateTime uploadedDate, String uploadedByUsername) {
        this.id = id;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.uploadedDate = uploadedDate;
        this.uploadedByUsername = uploadedByUsername;
    }
}
```

### Aspects Techniques
- **@Data**: Lombok.
- **Constructeurs multiples**: Pour flexibilité.
- **Métadonnées**: Taille, type, date pour l'interface.

## <span style="color:blue">QuizAttemptRequestDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour soumettre des tentatives de quiz | Validation des réponses | Reçoit les réponses du quiz du client | Gère la soumission des quiz, soutient l'évaluation automatique |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/QuizAttemptRequestDTO.java
package com.iatd.smarthub.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class QuizAttemptRequestDTO {

    @NotNull(message = "L'ID du quiz est obligatoire")
    private Long quizId;

    @Valid
    @Size(min = 1, message = "Au moins une réponse est requise")
    private List<AnswerRequestDTO> answers = new ArrayList<>();

    // Constructeurs
    public QuizAttemptRequestDTO() {
    }

    public QuizAttemptRequestDTO(Long quizId) {
        this.quizId = quizId;
    }

    // Méthodes utilitaires
    public void addAnswer(AnswerRequestDTO answer) {
        this.answers.add(answer);
    }

    public void removeAnswer(AnswerRequestDTO answer) {
        this.answers.remove(answer);
    }
}
```

### Aspects Techniques
- **@Valid @Size(min = 1)**: Validation de la liste de réponses.
- **Méthodes utilitaires**: Gestion de la liste.
- **@NotNull**: Quiz ID obligatoire.

## <span style="color:blue">QuizAttemptResponseDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour les réponses de tentatives | Inclut score et statut | Envoie les résultats du quiz | Fournit le feedback immédiat, soutient le suivi des progrès |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/QuizAttemptResponseDTO.java
package com.iatd.smarthub.dto;

import com.iatd.smarthub.model.quiz.QuizAttempt.AttemptStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class QuizAttemptResponseDTO {

    private Long id;
    private Long studentId;
    private String studentName;
    private Long quizId;
    private String quizTitle;
    private Double score;
    private LocalDateTime attemptedAt;
    private LocalDateTime completedAt;
    private AttemptStatus status;
    private List<AnswerResponseDTO> answers = new ArrayList<>();

    // Constructeurs
    public QuizAttemptResponseDTO() {
    }

    public QuizAttemptResponseDTO(Long id, Long studentId, String studentName, Long quizId,
            String quizTitle, Double score, AttemptStatus status) {
        this.id = id;
        this.studentId = studentId;
        this.studentName = studentName;
        this.quizId = quizId;
        this.quizTitle = quizTitle;
        this.score = score;
        this.status = status;
    }

    // Méthodes utilitaires
    public void addAnswer(AnswerResponseDTO answer) {
        this.answers.add(answer);
    }

    // Méthode pour calculer le score automatiquement
    public void calculateAndSetScore() {
        if (answers == null || answers.isEmpty()) {
            this.score = 0.0;
            return;
        }

        long correctAnswers = answers.stream()
                .filter(answer -> Boolean.TRUE.equals(answer.getIsCorrect()))
                .count();

        this.score = (double) correctAnswers / answers.size() * 100;
    }
}
```

### Aspects Techniques
- **@Getter @Setter**: Lombok.
- **calculateAndSetScore()**: Logique métier dans le DTO pour le calcul du score.
- **Stream API**: Filtrage et comptage des réponses correctes.
- **List<AnswerResponseDTO>**: Structure hiérarchique.

## <span style="color:blue">AnswerRequestDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour les réponses individuelles | Validation des réponses | Reçoit les réponses individuelles | Assure l'intégrité des soumissions de quiz, soutient la correction |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/AnswerRequestDTO.java
package com.iatd.smarthub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AnswerRequestDTO {

    @NotNull(message = "L'ID de la question est obligatoire")
    private Long questionId;

    @NotBlank(message = "La réponse est obligatoire")
    @Size(max = 1000, message = "La réponse ne peut pas dépasser 1000 caractères")
    private String answerText;

    // Constructeurs
    public AnswerRequestDTO() {}

    public AnswerRequestDTO(Long questionId, String answerText) {
        this.questionId = questionId;
        this.answerText = answerText;
    }
}
```

### Aspects Techniques
- **@Getter @Setter**: Lombok.
- **Validation**: Champs obligatoires et limites de taille.
- **Constructeurs**: Pour flexibilité.

## <span style="color:blue">AnswerResponseDTO</span>

| Fonction | Rôle des méthodes | Transaction des infos | Comment elle contribue dans le projet et la communication |
|----------|-------------------|-----------------------|----------------------------------------------------------|
| DTO pour les réponses avec correction | Inclut la correction | Envoie les réponses avec feedback | Améliore l'apprentissage en montrant les erreurs, soutient la pédagogie corrective |

```java
// filepath: src/main/java/com/iatd/smarthub/dto/AnswerResponseDTO.java
package com.iatd.smarthub.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AnswerResponseDTO {

    private Long id;
    private Long questionId;
    private String questionText;
    private String answerText;
    private Boolean isCorrect;
    private String correctAnswer;

    // Constructeurs
    public AnswerResponseDTO() {
    }

    public AnswerResponseDTO(Long id, Long questionId, String questionText,
            String answerText, Boolean isCorrect, String correctAnswer) {
        this.id = id;
        this.questionId = questionId;
        this.questionText = questionText;
        this.answerText = answerText;
        this.isCorrect = isCorrect;
        this.correctAnswer = correctAnswer;
    }
}
```

### Aspects Techniques
- **@Getter @Setter**: Lombok.
- **Constructeur paramétré**: Tous les paramètres pour l'instanciation complète.
- **Champs pédagogiques**: Inclut la réponse correcte pour l'apprentissage.

## Relations entre les DTOs

### Relations de Composition
- **QuizRequestDTO** contient **QuestionRequestDTO** (liste de questions)
- **QuizResponseDTO** contient **QuestionResponseDTO** (liste de questions)
- **QuizAttemptRequestDTO** contient **AnswerRequestDTO** (liste de réponses)
- **QuizAttemptResponseDTO** contient **AnswerResponseDTO** (liste de réponses)
- **CourseResponseDTO** contient **StudentResponseDTO** et **CourseFileDTO** (listes)

### Relations de Référence
- **AnnouncementResponseDTO** référence **UserBasicDTO** (auteur)
- **InternshipResponseDTO** référence **UserBasicDTO** (étudiant et superviseur)
- **ProjectResponseDTO** référence **UserBasicDTO** (étudiants et superviseur)
- **ResourceResponseDTO** référence **UserBasicDTO** (auteurs)

### Relations d'Authentification
- **AuthRequest** → **AuthResponse** (flux d'authentification)

### Relations CRUD
- **UserRequestDTO** → **UserResponseDTO** (création utilisateur)
- **CourseRequestDTO** → **CourseResponseDTO** (gestion cours)
- **QuizRequestDTO** → **QuizResponseDTO** (gestion quiz)
- **AnnouncementRequestDTO** → **AnnouncementResponseDTO** (gestion annonces)
- **InternshipRequestDTO** → **InternshipResponseDTO** (gestion stages)
- **ProjectRequestDTO** → **ProjectResponseDTO** (gestion projets)
- **ResourceRequestDTO** → **ResourceResponseDTO** (gestion ressources)

### DTOs Spécialisés
- **UserBasicDTO** : Utilisé partout pour éviter la récursion et optimiser les réponses
- **StudentResponseDTO** : Spécialisation de UserBasicDTO pour les contextes étudiants
- **CourseFileDTO** : Métadonnées des fichiers sans contenu binaire

## Conclusion

Les DTOs de SmartHub forment une architecture cohérente pour la communication API, séparant clairement les préoccupations entre les entités métier et les contrats d'interface. Ils assurent la validation, la sécurité et l'optimisation des échanges de données, tout en facilitant la maintenance et l'évolutivité du système éducatif. La structure hiérarchique et les relations bien définies permettent une intégration fluide entre les composants, soutenant efficacement les fonctionnalités pédagogiques et administratives de la plateforme.





# CONCLUSION GÉNÉRALE - SMART HUB

L'analyse détaillée du backend de **SmartHub** révèle une architecture robuste, moderne et parfaitement adaptée aux exigences d'une plateforme éducative intelligente. Cette conclusion synthétise les points clés de notre exploration et met en lumière la cohérence technique de l'ensemble du système.

## <span style="color:#0d47a1;">1. Architecture Globale et Cohérence</span>

Le projet SmartHub démontre une **architecture en couches** exemplaire, où chaque composant joue un rôle précis et interconnecté :

- **Configuration** (`application.properties`, `pom.xml`) : Elle pose les fondations techniques avec des choix précis (Spring Boot 3.3.4, Java 21, MariaDB/PostgreSQL) et des paramétrages fins (pool de connexions HikariCP, sécurité JWT, intégration Gemini AI). La présence de configurations pour le RAG, les embeddings et les agents intelligents montre une anticipation claire des besoins d'IA.

- **Contrôleurs (API REST)** : Ils constituent la porte d'entrée du système. Leur structure (`@RestController`, `@RequestMapping`) est uniforme et suit les conventions REST. La séparation claire des endpoints pour les utilisateurs, les agents et les quiz (RAG) permet une navigation API intuitive et une maintenance facilitée. L'utilisation systématique de DTOs pour les requêtes et réponses garantit l'intégrité des données.

- **Services (Logique Métier)** : C'est le cœur intelligent de l'application. Chaque service est spécialisé :
    - `UserService`, `CourseService` pour la gestion traditionnelle.
    - `RAGQuizService`, `EmbeddingService`, `OllamaService` pour l'IA. L'implémentation de la génération de quiz basée sur des embeddings et la recherche vectorielle via `VectorRAGService` concrétise la promesse d'une plateforme "intelligente".
    - La présence d'agents dédiés (`QuizOrchestratorAgent`, `AdaptiveQuizOrchestrator`) dans le package `agent` montre une volonté d'orchestration métier avancée, dépassant le simple CRUD.

- **Modèles (Entités JPA)** : Les entités sont conçues avec soin, avec des relations JPA claires (`@ManyToOne`, `@OneToMany`) et l'utilisation d'enums pour les données catégorielles (rôles, types de questions, statuts). L'entité `KnowledgeBase` et le champ `embedding` dans les entités RAG sont les piliers du système de recommandation et de génération de contenu personnalisé. L'héritage via `BaseEntity` pour l'audit (`createdAt`, `updatedAt`) est une excellente pratique.

- **Repositories (Accès aux Données)** : Ils ne se contentent pas de fournir des opérations CRUD basiques. Les repositories, notamment `CourseRepository`, `QuizRepository` et `KnowledgeBaseRepository`, intègrent des requêtes complexes (JPQL, natives) et des `@EntityGraph` pour optimiser le chargement des relations (fetch joins), évitant ainsi le problème N+1 et garantissant la performance.

## <span style="color:#0d47a1;">2. Points Forts et Innovations</span>

Plusieurs éléments distinguent SmartHub d'une simple application de gestion :

- **Intégration Poussée de l'IA (RAG) :** Le système ne se contente pas d'appeler une API Gemini. Il met en place un pipeline RAG complet :
    1.  **Indexation :** Les fichiers de cours sont analysés, leur contenu est extrait (via PDFBox) et transformé en embeddings vectoriels (`EmbeddingService`).
    2.  **Récupération (Retrieval) :** `VectorRAGService` utilise ces embeddings pour trouver le contenu le plus pertinent par rapport à une requête utilisateur, en appliquant des bonus basés sur son profil (`LearningProfile`).
    3.  **Génération (Generation) :** `RAGQuizGenerationService` construit un prompt contextuel avec le contenu récupéré et appelle Gemini pour générer des quiz parfaitement adaptés.

- **Personnalisation par Agents :** Les agents (`CourseQuizSupervisorAgent`, `AdaptiveQuizOrchestrator`) ne sont pas de simples services. Ils encapsulent une logique de *supervision* (vérification d'éligibilité, limitation du nombre de tentatives) et d'*orchestration* (choix du prochain quiz, adaptation du niveau), rendant l'expérience d'apprentissage dynamique et individualisée.

- **Sécurité Granulaire :** L'utilisation de JWT est la base, mais la sécurité est renforcée au niveau des services. `ProjectService`, `ResourceService` ou `AnnouncementService` vérifient systématiquement que l'utilisateur connecté est bien le propriétaire de la ressource (ou un admin) avant toute opération d'écriture, empêchant les accès non autorisés.

- **Préparation à la Montée en Charge :** L'architecture est pensée pour l'évolutivité :
    - Utilisation de DTOs pour alléger les transferts de données.
    - Requêtes JPA optimisées avec `JOIN FETCH`.
    - Configuration de pools de connexions (HikariCP).
    - Caching des embeddings pour éviter des appels redondants à l'API Gemini.

## <span style="color:#0d47a1;">3. Axes d'Amélioration Potentiels</span>

Malgré sa qualité, quelques points pourraient être renforcés :

- **Gestion Centralisée des Exceptions :** Actuellement, la gestion des erreurs est souvent locale aux contrôleurs (blocs `try/catch`). L'adoption d'un `@RestControllerAdvice` global permettrait de centraliser la logique de mapping des exceptions vers des codes HTTP et des messages d'erreur standards, rendant le code plus DRY et la couche API plus cohérente.

- **Complétion des Placeholders :** Certains services et repositories (`AssignmentService`, `AssignmentRepository`) sont encore des squelettes vides. Leur implémentation complète est nécessaire pour que le module "Devoirs" soit fonctionnel.

- **Documentation Interactive de l'API :** L'intégration d'OpenAPI (Swagger) générerait automatiquement une documentation interactive des endpoints, facilitant grandement l'intégration avec le frontend et les tests par les développeurs.

## <span style="color:#0d47a1;">Conclusion Finale</span>

**SmartHub n'est pas un simple projet scolaire, mais une plateforme éducative de nouvelle génération, prête pour la production.** Son backend est le reflet d'une réflexion architecturale profonde, alliant la robustesse de l'écosystème Spring Boot à la puissance de l'IA générative (Gemini) et des techniques de recherche sémantique (RAG, embeddings).

La séparation claire des responsabilités (configuration, API, logique métier, accès aux données), l'intégration poussée de l'IA pour la personnalisation de l'apprentissage, et l'attention portée à la sécurité et à la performance en font un système **maintenable, scalable et intelligent**.

Ce document de synthèse, en détaillant chaque couche technique, atteste de la maturité du projet. SmartHub est prêt à offrir une expérience d'apprentissage réellement adaptative, où l'ordinateur n'est plus un simple outil de consultation, mais un véritable **assistant pédagogique intelligent**.


#  <span style="color:#0d47a1;">FÉLICITATIONS ! VOUS AVEZ EXPLORÉ LE CŒUR INTELLIGENT DE SMARTHUB</span>

Cher lecteur, vous venez de parcourir l'intégralité de l'architecture backend de **SmartHub**, et quelle aventure technique !

Vous avez découvert comment :
-**Spring Boot 3.3.4** et **Java 21** constituent la fondation robuste de notre plateforme
- **MariaDB** et **PostgreSQL** travaillent de concert pour gérer données relationnelles et vectorielles
- **JWT** et **Spring Security** assurent une protection granulaire de chaque ressource
- **Gemini AI** donne vie à notre système **RAG**, transformant de simples fichiers PDF en quiz personnalisés
- Les **agents intelligents** orchestrent des expériences d'apprentissage adaptatives
- Les **DTOs** et **repositories optimisés** garantissent des échanges de données fluides et performants

## <span style="color:#0d47a1;">Ce que vous maîtrisez maintenant</span>

Vous avez acquis une compréhension approfondie de l'architecture en couches :
- La configuration technique (`application.properties`, `pom.xml`)
- Les points d'entrée API (contrôleurs REST)
- La logique métier (services spécialisés)
- La persistance des données (entités JPA et repositories)
- L'intelligence artificielle (RAG, embeddings, agents)


Le backend que vous venez d'explorer n'est pas qu'une simple collection de fichiers Java. C'est le **cerveau** de SmartHub, une machine finement réglée où chaque composant joue sa partition en harmonie avec les autres.

Des lignes de configuration aux requêtes vectorielles complexes, en passant par les agents d'orchestration et la génération de quiz par IA, chaque élément a été pensé pour offrir une expérience éducative unique et personnalisée.

**Vous avez maintenant les clés du royaume.** Que vous soyez développeur souhaitant contribuer, administrateur cherchant à comprendre le système, ou simplement curieux de technologie, cette exploration vous a donné une vision à 360 degrés de ce qui fait battre le cœur de SmartHub.

---

<h1 align="center" style="color:#0d47a1;">🌟 BRAVO POUR CE PARCOURS ! 🌟</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Progression-100%25-success?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Compréhension-Maîtrise-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Statut-Prêt%20pour%20la%20suite-orange?style=for-the-badge" />
</p>

<p align="center">
  <i>Le backend est maîtrisé. L'aventure continue avec le frontend et l'expérience utilisateur !</i>
</p>

<p align="center">
  <b>À vous de jouer maintenant !</b> 
</p>


## <span style="color:#0d47a1;">Démos du projet</span>

Vous pouvez découvrir le projet via plusieurs ressources :

- **Présentation complète avec explications :**  
  [Voir la vidéo YouTube](https://youtu.be/y0RjRl1l7fE?si=ILAPrpO_GC3_NF_3)  
  *Cette vidéo détaille le projet, son fonctionnement et les choix techniques.*

- **Démo de l’application seulement :**  
  [Voir la démonstration sur LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7423897690977042432/?originTrackingId=00wryq7BSwTZmQ6yxPRm6g%3D%3D)  
  *Accès direct à l’application en action, sans explications supplémentaires.*

- **Code source complet sur GitHub :**  
  [Voir le dépôt GitHub](https://github.com/hinimdoumorsia/smart-education-platform)  
  *Vous pouvez cloner ou explorer le projet complet.*

- **Tester l’application en ligne :**  
  [Accéder à l’application](https://smart-education-platform-3qsejixj2.vercel.app)  
  *Essayez directement l’application depuis votre navigateur.*
