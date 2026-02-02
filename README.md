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

##  Description Générale

# SmartHub – Plateforme Éducative

Ce dépôt contient le développement d’une **application moderne complète** intégrant des **outils avancés d’intelligence artificielle**, notamment des **modèles LLM**, des mécanismes de **RAG (Retrieval-Augmented Generation)**, ainsi que des **agents intelligents de supervision et d’orchestration**.  

La plateforme **SmartHub** est une **plateforme éducative** conçue pour moderniser l’enseignement et faciliter l’échange entre **étudiants, enseignants et administrateurs** à travers des **assistants chatbot multi-agents**, la **génération automatique de quiz**, l’**analyse de documents pédagogiques** et l’**automatisation de processus éducatifs**.  

**Lien de la plateforme déployée :**  
[https://smart-education-platform-3qsejixj2.vercel.app](https://smart-education-platform-3qsejixj2.vercel.app)


---

##  Objectifs

- Centraliser les activités pédagogiques (cours, quiz, projets, stages, ressources)
- Automatiser la génération et l’évaluation de quiz grâce à l’IA
- Offrir un assistant pédagogique intelligent basé sur LLM + RAG
- Fournir une plateforme web moderne, sécurisée et évolutive

---

##  Fonctionnalités Principales

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

##  Architecture Générale

Frontend (React + TypeScript)  
→ Backend API REST (Spring Boot)  
→ Base de données PostgreSQL  
→ Couche IA (LLM · RAG · Agents)

---

#  Backend — SmartHub API REST (IATD)

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

#  Frontend — SmartHub Web

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

#  Intelligence Artificielle

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

##  Projet
SmartHub — Plateforme éducative intelligente intégrant l’IA moderne, les LLM, le RAG et les systèmes multi-agents.

 **Documentation**  
Chaque dossier **Backend** et **Frontend** dispose de sa **propre documentation détaillée**.  
Veuillez consulter les fichiers `README.md` et le dossier `docs/` correspondants dans chaque partie du projet pour plus d’informations techniques et fonctionnelles.

Guide d'installation et d'exécution du projet SmartHub (smarthub1)

# Guide complet du projet de A à Z
--------------------------------
Ce guide explique pas à pas comment préparer la base de données MariaDB (ou MariaDB via Docker), configurer l'application, et exécuter le projet SmartHub (répertoire `smarthub1`) sur Windows (cmd.exe). Il indique aussi les modifications à effectuer si vous souhaitez exécuter le projet sur un autre poste ou avec d'autres identifiants.

---
##  Cloner et exécuter le projet SmartHub

###  Prérequis
- Git installé : https://git-scm.com/downloads  
- Connexion Internet  
- (Optionnel) Java 21, Node.js et PostgreSQL pour exécuter le projet

### Étapes

1. **Ouvrir un terminal**  
   - Windows : PowerShell ou Git Bash  
   - Linux / macOS : Terminal

2. **Se placer dans le dossier de travail**  
```bash
cd Documents

3. Cloner le dépôt GitHub

git clone https://github.com/hinimdoumorsia/smart-education-platform.git

4. Accéder au dossier du projet

cd smart-education-platform

5.Vérifier le contenu

ls

Vous devriez voir les dossiers backend et frontend.

Lancer le backend

cd backend
./mvnw spring-boot:run

Lancer le frontend

cd frontend
npm install
npm start

✅ Résultat

Backend API : http://localhost:8081

Frontend Web : http://localhost:3000

---

# Checklist (ce que nous allons faire pour bien executer le projet sans erreur)
-----------------------------------
- [ ] Installer Java (JDK) compatible
- [ ] Installer MariaDB ou utiliser Docker
- [ ] Créer la base de données et l'utilisateur MariaDB
- [ ] Vérifier / modifier `src/main/resources/application.properties`
- [ ] Construire et lancer l'application via `mvnw.cmd`
- [ ] Options : exécuter avec Docker / variables d'environnement

Prérequis
---------
- Windows (instructions en `cmd.exe`).
- Git (optionnel) pour cloner le dépôt.
- JDK installé (la version requise est indiquée dans `pom.xml`).
- MariaDB (localement) ou Docker Desktop avec un conteneur MariaDB.

Versions et fichiers importants
-------------------------------
- Projet documenté : dossier `smarthub1` (racine du guide).
- Fichier Maven : `pom.xml` (dans `smarthub1`). Dans l'exemple présent, `pom.xml` définit `<java.version>21` — installez JDK 21 ou adaptez.
- Fichier de configuration Spring Boot : `src/main/resources/application.properties`.

1) Installer Java
------------------
Le `pom.xml` du projet (dans `smarthub1`) indique `java.version=21`. Installez donc JDK 21 (Adoptium / Temurin / Oracle) ou modifiez la propriété `java.version` dans `pom.xml` pour correspondre à votre JDK.

Pour vérifier la version Java (cmd.exe) :

```cmd
java -version
javac -version
```

Si la version n'est pas la bonne :
- Installez une JDK compatible.
- Configurez `JAVA_HOME` (Panneau Système → Paramètres avancés → Variables d'environnement) et ajoutez `%JAVA_HOME%\bin` au `PATH`.

2) Installer MariaDB (local) — SQL à exécuter
--------------------------------------------
Option A (installation locale MariaDB / MySQL) :
- Téléchargez et installez MariaDB ou MySQL (le driver MariaDB fonctionne aussi pour MySQL).
- Ouvrez le client `mysql` ou `mysql.exe` / `MySQL Workbench` pour exécuter les commandes SQL suivantes.

Exemple SQL pour créer la base et l'utilisateur (adapté à la configuration courante du projet) :

```sql
-- Se connecter en tant que root (ou un superuser)
-- mysql -u root -p

CREATE DATABASE smarthub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'smarthub_user'@'localhost' IDENTIFIED BY 'smarthub_password';
GRANT ALL PRIVILEGES ON smarthub.* TO 'smarthub_user'@'localhost';
FLUSH PRIVILEGES;
```

Remarques :
- Le projet `smarthub1` fourni utilise actuellement la base `smarthub` (voir `src/main/resources/application.properties`). Si vous préférez conserver `root` comme utilisateur (pas recommandé pour la production), adaptez `spring.datasource.username` / `password` en conséquence.
- Remplacez `smarthub_user` et `smarthub_password` par des identifiants sûrs en production.

Option B (Docker) :
- Si vous préférez Docker, lancez :

```cmd
docker run --name smarthub-mariadb -e MYSQL_ROOT_PASSWORD=YourRootPassword -e MYSQL_DATABASE=smarthub -e MYSQL_USER=smarthub_user -e MYSQL_PASSWORD=smarthub_password -p 3306:3306 -d mariadb:10.11
```

Note : dans le `application.properties` du projet, la connexion est actuellement :

```
spring.datasource.url=jdbc:mariadb://127.0.0.1:3306/smarthub?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=
spring.datasource.driver-class-name=org.mariadb.jdbc.Driver
```

Si vous lancez le conteneur Docker ci-dessus, remplacez `spring.datasource.username` et `spring.datasource.password` par `smarthub_user` / `smarthub_password`, ou définissez `MYSQL_ROOT_PASSWORD` et utilisez `root`.

3) Vérifier et modifier `application.properties`
------------------------------------------------
Fichier : `src/main/resources/application.properties`

Ouvrez ce fichier et vérifiez les propriétés de connexion JDBC. Les clés courantes à modifier :

- spring.datasource.url
- spring.datasource.username
- spring.datasource.password
- spring.jpa.hibernate.ddl-auto

Exemple de configuration (valeurs recommandées pour exécution locale avec MariaDB) :

```
# Port de l'application (valeur actuelle : 8081 dans ce projet)
server.port=8081

# Connexion MariaDB (extrait depuis le projet)
spring.datasource.url=jdbc:mariadb://127.0.0.1:3306/smarthub?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=
spring.datasource.driver-class-name=org.mariadb.jdbc.Driver

# Hibernate (dev)
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.jdbc.lob.non_contextual_creation=true
```

Important :
- Si vous exécutez la base sur un autre hôte ou port, modifiez `127.0.0.1:3306` en conséquence.
- Le projet utilise par défaut le port `8081` (voir `server.port` ci-dessus) — vérifiez ce port sur la machine cible.
- Dans votre copie actuelle, `spring.datasource.username=root` et `spring.datasource.password` est vide — cela fonctionne en local si root n'a pas de mot de passe mais est très peu sécurisé. Préférez créer un utilisateur dédié (`smarthub_user`) et définir un mot de passe.

4) Variables d'environnement (optionnel mais recommandé)
------------------------------------------------------
Plutôt que de modifier directement `application.properties`, vous pouvez surcharger les propriétés via variables d'environnement ou paramètres de ligne de commande :

- Variables d'environnement (Windows cmd.exe) :

```cmd
set SPRING_DATASOURCE_URL=jdbc:mariadb://127.0.0.1:3306/smarthub?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=UTC
set SPRING_DATASOURCE_USERNAME=smarthub_user
set SPRING_DATASOURCE_PASSWORD=smarthub_password
```

- Ligne de commande Maven (exécution ponctuelle) :

```cmd
mvnw.cmd spring-boot:run -Dspring-boot.run.arguments="--spring.datasource.url=jdbc:mariadb://127.0.0.1:3306/smarthub?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=UTC --spring.datasource.username=smarthub_user --spring.datasource.password=smarthub_password --server.port=8081"
```

Note : Sous PowerShell ou Linux, la syntaxe pour définir des variables diffère.

5) Construire et lancer l'application (Windows cmd.exe)
-------------------------------------------------------
Placez-vous dans le dossier racine du projet `smarthub1` (contenant `mvnw.cmd` et `pom.xml`).

- Pour compiler :

```cmd
mvnw.cmd clean compile
```

- Pour lancer les tests :

```cmd
mvnw.cmd test
```

- Pour packager (JAR) :

```cmd
mvnw.cmd clean package
```

- Pour exécuter l'application en mode développement (redémarrage automatique si devtools présent) :

```cmd
mvnw.cmd spring-boot:run
```

Observations :
- L'application démarre par défaut sur le port 8080. Pour changer le port, modifiez `server.port` dans `application.properties` ou passez `--server.port=9090` en argument.

6) Points spécifiques à vérifier dans le projet
----------------------------------------------
- Java version : `pom.xml` indique `<java.version>21`. Si vous avez une autre version, soit installez la JDK correspondante, soit changez la propriété dans `pom.xml` (attention aux incompatibilités de Spring Boot et dépendances).
- Dépendances DB : `pom.xml` inclut PostgreSQL driver. Supprimez tout driver de base de données non utilisé (MySQL/MariaDB) si vous voulez réduire le risque de confusion.
- Password encoding : la doc du projet indique que PasswordEncoder existe mais que les mots de passe ne sont peut-être pas encodés avant stockage. Vérifiez la couche Service (`UserService`) pour vous assurer que `passwordEncoder.encode()` est appelé lors de la création d'un utilisateur.

7) Exécution sur un autre ordinateur — checklist des modifications à faire
---------------------------------------------------------------------------
Si vous souhaitez exécuter le projet sur une autre machine, vérifiez et adaptez :
- Java : installez la même version du JDK (ou adaptez `pom.xml`). Configurez `JAVA_HOME`.
- Base de données :
  - Créez la même base (`iatd_smarthub`) et l'utilisateur, ou changez `spring.datasource.url` / `username` / `password` pour pointer vers la base distante.
  - Si la base est distante, assurez-vous que le port PostgreSQL est accessible et que le pare-feu autorise la connexion.
- Fichier `application.properties` : mettez les bons identifiants / hôte / port.
- Variables d'environnement : vous pouvez utiliser `SPRING_...` variables pour éviter d'éditer le fichier.
- Ports : vérifiez que le port (8080 par défaut) est libre sur la machine cible.

8) Option : lancer la base de données et l'application via Docker Compose (exemple)
----------------------------------------------------------------------------------
Exemple de `docker-compose.yml` minimal pour MariaDB + application :

```yaml
version: '3.8'
services:
  db:
    image: mariadb:10.11
    environment:
      MYSQL_ROOT_PASSWORD: root_password_here
      MYSQL_DATABASE: smarthub
      MYSQL_USER: smarthub_user
      MYSQL_PASSWORD: smarthub_password
    ports:
      - '3306:3306'
    volumes:
      - db-data:/var/lib/mysql

  app:
    build: .
    depends_on:
      - db
    ports:
      - '8081:8081'
    environment:
      SPRING_DATASOURCE_URL: jdbc:mariadb://db:3306/smarthub?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=UTC
      SPRING_DATASOURCE_USERNAME: smarthub_user
      SPRING_DATASOURCE_PASSWORD: smarthub_password
      SERVER_PORT: 8081

volumes:
  db-data:
```

Remarques :
- Le service `app` suppose que vous avez un `Dockerfile` configuré pour construire l'application Spring Boot.
- `build: .` doit pointer vers la racine du projet avec un `Dockerfile`.

9) Dépannage rapide
-------------------
- Erreur de connexion JDBC : vérifiez `spring.datasource.url`, `username`, `password` et que PostgreSQL écoute sur le host/port indiqués.
- Erreur de version Java : installez la version demandée ou modifiez `pom.xml` (possibilité d'incompatibilités de dépendances).
- Contrainte d'unicité (username/email) : si la DB refuse l'insertion, vérifiez les données initiales. Utilisez `spring.jpa.hibernate.ddl-auto=update` (dev) ou `validate` et gérez manuellement le schéma.
- Problèmes de build liés à Lombok : vérifiez que Lombok est bien activé dans l'IDE (plugin) et que l'annotation processor est activée.

10) Notes de sécurité et bonnes pratiques
----------------------------------------
- Ne laissez jamais de mots de passe en clair dans le code pour la production. Utilisez un gestionnaire de secrets ou variables d'environnement.
- Pour la production, configurez TLS pour PostgreSQL et sécurisez l'accès.
- Passez `spring.jpa.hibernate.ddl-auto` à `validate` en production et gérez les migrations via Flyway ou Liquibase.

11) Ressources utiles
---------------------
- PostgreSQL docs: https://www.postgresql.org/docs/
- Spring Boot docs: https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/
- Docker: https://docs.docker.com/

##  Contact

Pour la réalisation de vos projets intégrant des technologies avancées, des modèles conçus sur mesure et des infrastructures d’intelligence artificielle complètes, veuillez me contacter à travers le site suivant ou mon portfolio :  
[https://site-web-nodemailer.vercel.app/](https://site-web-nodemailer.vercel.app/)

Je suis disponible pour toute collaboration sur un projet donné, que ce soit en **développement**, en **intelligence artificielle** ou en **logiciel**.  

Cordialement,  
**Hinimdou Morsia Guitdam**

Fin
---
