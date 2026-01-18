# 🎓 SmartHub — Plateforme Éducative Intelligente (IA · LLM · RAG · Agents · Web Moderne)

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-brightgreen?logo=java&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring_Boot-3.4.11-6DB33F?logo=spring&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-13-blue?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Maven-3.x-blueviolet?logo=apache-maven&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-4.x-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/LLM-RAG%20%26%20Agents-black?logo=openai" />
  <img src="https://img.shields.io/badge/Botpress-Chatbot-blue?logo=botpress" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## 📌 Description Générale

Ce dépôt contient le développement d’une **application moderne complète** intégrant des **outils avancés d’intelligence artificielle**, notamment des **modèles LLM**, des mécanismes de **RAG (Retrieval-Augmented Generation)**, ainsi que des **agents intelligents de supervision et d’orchestration**.  
La plateforme **SmartHub** est une **plateforme éducative** conçue pour moderniser l’enseignement et faciliter l’échange entre **étudiants, enseignants et administrateurs** à travers des **assistants chatbot multi-agents**, la **génération automatique de quiz**, l’**analyse de documents pédagogiques** et l’**automatisation de processus éducatifs**.

---

## 🎯 Objectifs

- Centraliser les activités pédagogiques (cours, quiz, projets, stages, ressources)
- Automatiser la génération et l’évaluation de quiz grâce à l’IA
- Offrir un assistant pédagogique intelligent basé sur LLM + RAG
- Fournir une plateforme web moderne, sécurisée et évolutive

---

## 🧠 Fonctionnalités Principales

- Gestion des utilisateurs (STUDENT, TEACHER, ADMIN)
- Authentification et gestion du profil
- Gestion des cours, annonces et ressources pédagogiques
- Gestion des projets et des stages
- Création, édition et passage de quiz
- Quiz adaptatifs et statistiques détaillées
- Génération automatique de quiz par IA
- Tableau de bord personnalisé par rôle
- Chatbot éducatif intelligent multi-agents
- RAG basé sur documents (PDF, cours, ressources)
- Agents de supervision et agents collaboratifs

---

## 🏗️ Architecture Générale

Frontend (React + TypeScript)  
→ Backend API REST (Spring Boot)  
→ Base de données PostgreSQL  
→ Couche IA (LLM · RAG · Agents)

---

# 🔧 Backend — SmartHub API REST (IATD)

## Stack Technique
Java 21, Spring Boot 3.4.11, Spring Data JPA, PostgreSQL 13, Maven, Lombok.

## Architecture Backend
Architecture en couches :  
Controller → Service → Repository → PostgreSQL

- DTOs pour isoler le contrat API
- Entités JPA avec contraintes
- Transactions via @Transactional
- Enum Role persisté en STRING
- Logging via Lombok @Slf4j

## Structure Backend

src/main/java/com/iatd/smarthub/  
- SmarthubApplication.java (bootstrap Spring Boot)  
- controller/ (AnnouncementController, InternshipController, ProjectController, QuizController, ResourceController, UserController)  
- service/ (AnnouncementService, FileStorageService, InternshipService, ProjectService, QuizService, QuizServiceImpl, QuizAttemptService, ResourceService, UserService)  
- repository/ (AnnouncementRepository, AnswerRepository, InternshipRepository, ProjectRepository, QuestionRepository, QuizAttemptRepository, QuizRepository, ResourceRepository, UserRepository)  
- dto/ (Request/Response DTOs, statistiques, QuizGenerationRequest)  
- model/  
  - base/BaseEntity  
  - user/User  
  - announcement/Announcement, AnnouncementType  
  - internship/Internship  
  - project/Project  
  - quiz/Quiz, Question, Answer, QuizAttempt, QuestionType  
  - resource/Resource  

src/main/resources/  
- application.properties

## Lancement Backend

Créer la base :
psql -U postgres -c "CREATE DATABASE iatd_smarthub;"

Lancer l’application :
./mvnw spring-boot:run

Build :
./mvnw clean package  
java -jar target/smarthub-*.jar

## Endpoints (exemples)

POST /api/v1/users  
GET /api/v1/users/{id}  
POST /api/v1/quizzes  
POST /api/v1/quizzes/generate  
GET /api/v1/resources

## Sécurité & Améliorations Backend
- Encodage des mots de passe (BCrypt)
- Spring Security + JWT
- Gestion centralisée des erreurs (@RestControllerAdvice)
- Pagination des listes
- Restriction CORS

---

# 🎨 Frontend — SmartHub Web

## Stack Frontend
React 18, TypeScript, Create React App, Context API, Services API, intégration IA (Botpress, RAG).

## Structure Frontend

public/  
- index.html, manifest.json, robots.txt

src/  
- components/  
  - AdaptiveQuizModal.tsx  
  - CourseQuizModal.tsx  
  - Navbar.tsx  
  - PrivateRoute.tsx  
  - QuizResultsModal.tsx  
  - StudentManagement.tsx  
  - common/LoadingSpinner.tsx  
- context/  
  - AuthContext.tsx  
- pages/  
  - admin/ (AdminDashboardPage, UserManagementPage)  
  - announcements/ (Create, Edit, List, Detail, MyAnnouncements)  
  - auth/ (Login, Register, RoleSelect, ResetPassword)  
  - courses/ (Create, Edit, List, Detail, MyCourses)  
  - dashboard/ (DashboardPage)  
  - internships/ (Create, Edit, List, Detail, MyInternships)  
  - profile/ (ProfilePage)  
  - projects/ (Create, Edit, List, Detail, MyProjects)  
  - quizzes/ (Create, Edit, List, Detail, Attempt, Results, Generation, MyAttempts)  
  - resources/ (Create, Edit, List, Detail, MyResources)  
- services/  
  - api.ts  
  - authService.ts  
  - userService.ts  
  - announcementService.ts  
  - courseService.ts  
  - quizService.ts  
  - courseQuizService.ts  
  - ragService.ts  
  - agentService.ts  
  - internshipService.ts  
  - projectService.ts  
  - resourceService.ts  
  - statsService.ts  
- types/ (announcement, internship, project, quiz, resource)  
- App.tsx, index.tsx, styles, tests

## Lancement Frontend

npm install  
npm start  
Application accessible sur http://localhost:3000

---

# 🤖 Intelligence Artificielle

## RAG (Retrieval-Augmented Generation)
- Indexation de documents pédagogiques
- Recherche contextuelle
- Génération de réponses adaptées au contexte utilisateur

## Agents Intelligents
- Agent chatbot éducatif
- Agent générateur de quiz
- Agent superviseur
- Agents collaboratifs multi-rôles

---

## 📈 Évolutions Futures
- CI/CD GitHub Actions
- Tests unitaires et d’intégration
- Déploiement cloud
- Notifications temps réel
- Application mobile

---

## 📜 Licence
MIT

---

## 👨‍💻 Projet
SmartHub — Plateforme éducative intelligente intégrant l’IA moderne, les LLM, le RAG et les systèmes multi-agents.

📄 **Documentation**  
Chaque dossier **Backend** et **Frontend** dispose de sa **propre documentation détaillée**.  
Veuillez consulter les fichiers `README.md` et le dossier `docs/` correspondants dans chaque partie du projet pour plus d’informations techniques et fonctionnelles.
