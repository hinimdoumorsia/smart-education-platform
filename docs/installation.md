# <h1 style="color:#0d47a1;">Partie A : Installation pour que le frontend soit fonctionnel</h1>


Dans cette partie, nous allons voir d'abord comment vous pouvez être prêts pour commencer à construire notre projet en partant de zéro. Pour cela, vous avez besoin de faire des installations importantes. Avant toutes choses, les installations suivantes sont très importantes pour commencer avec la partie frontend.

Ce fichier contient les étapes minimales pour installer et lancer uniquement la partie `smarthub-frontend` du projet.

**Prérequis**
- Node.js (version LTS recommandée, Node 18.x ou >=16)
- npm (fourni avec Node, ou `yarn` si vous préférez)
- Git (pour cloner le dépôt si nécessaire)

**Fichiers importants**
- Configuration des scripts et dépendances : [smarthub-frontend/package.json](smarthub-frontend/package.json)
- Configuration de l'API (URL backend) : [src/services/api.ts](smarthub-frontend/src/services/api.ts#L1-L20)

**Installation (développement)**
1. Ouvrir un terminal et se placer dans le dossier frontend :

```bash
cd smarthub-frontend
```

2. Installer les dépendances :

```bash
npm install
```

3. (Optionnel) Si vous préférez `yarn` :

```bash
yarn
yarn start
```

**Configuration de l'URL du backend**
Par défaut le frontend utilise l'URL définie dans `src/services/api.ts`. Si vous exécutez le backend localement, mettez à jour `baseURL` dans ce fichier (par exemple `http://localhost:8080`) ou modifiez le code pour lire une variable d'environnement.

**Lancer l'application (dev)**

```bash
npm start
```

Par défaut l'app React s'exécute sur `http://localhost:3000`.

**Construire pour la production**

```bash
npm run build
```

Le résultat est dans le dossier `build/` prêt à être déployé.

**Tests**

```bash
npm test
```

**Scripts disponibles**
- `start` : démarre le serveur de dev (`react-scripts start`)
- `build` : crée la build de production (`react-scripts build`)
- `test` : lance les tests (`react-scripts test`)
- `eject` : éjecte la configuration Create React App (irréversible)

**Principales dépendances**
- `react`, `react-dom`, `react-scripts`
- `typescript` (projet en TypeScript)
- `axios` (appel API)
- `react-router-dom` (routing)
- `react-bootstrap`, `bootstrap` (UI)

**Dépannage rapide**
- Si le frontend ne peut pas joindre le backend : vérifier `baseURL` dans [src/services/api.ts](smarthub-frontend/src/services/api.ts#L1-L20) et les paramètres CORS du backend.
- Pour forcer un autre port de dev : dans `cmd`/PowerShell avant `npm start` définir `PORT=3001` (Windows PowerShell : `$env:PORT = 3001`), puis lancer `npm start`.
- Si token JWT pose problème : ouvrir la console du navigateur et supprimer `token` et `user` depuis `localStorage`.


**Architecture du frontend**
 

Voici la structure complète du dossier `smarthub-frontend` et le rôle de chaque fichier/dossier. Ceci aide à comprendre où modifier le code et comment les parties s'articulent.

- `package.json` : liste des dépendances et des scripts (`start`, `build`, `test`, `eject`).
- `tsconfig.json` : configuration TypeScript (options du compilateur).
- `public/` : ressources publiques servies statiquement.
	- `index.html` : page HTML principale injectée par React.
	- `manifest.json` : métadonnées pour PWA.
	- `robots.txt` : directives pour les robots d'indexation.
- `src/` : code source principal de l'application React.
	- `index.tsx` : point d'entrée React qui monte l'application dans le DOM.
	- `App.tsx` : composant racine contenant le routage global et la structure principale.
	- `App.css` / `index.css` : styles globaux de l'application.
	- `react-app-env.d.ts` : définitions d'environnement TypeScript pour Create React App.
	- `reportWebVitals.ts` : utilitaire pour mesurer les performances (optionnel).
	- `setupTests.ts` : configuration initiale pour les tests (Jest/Testing Library).

	- `components/` : composants réutilisables UI et modals.
		- `AdaptiveQuizModal.tsx` : modal pour quiz adaptatif.
		- `BotpressWebChat.tsx` : intégration du chat Botpress.
		- `CourseQuizModal.tsx` : modal pour quiz liés aux cours.
		- `Navbar.tsx` : barre de navigation de l'application.
		- `PrivateRoute.tsx` : wrapper de route qui protège les pages privées (auth).
		- `QuizResultsModal.tsx` : affichage des résultats d'un quiz.
		- `StudentManagement.tsx` : interface d'administration des étudiants.
		- `common/LoadingSpinner.tsx` : composant spinner utilisé partout.

	- `context/` : Providers et contextes React.
		- `AuthContext.tsx` : gestion de l'état d'authentification (user, token, login/logout).

	- `pages/` : pages routables (organisation par fonctionnalité).
		- `admin/`
			- `AdminDashboardPage.tsx` : tableau de bord administrateur.
			- `UserManagementPage.tsx` : gestion des utilisateurs pour les admins.
		- `announcements/`
			- `AnnouncementCreatePage.tsx` : page de création d'annonce.
			- `AnnouncementDetailPage.tsx` : détail d'une annonce.
			- `AnnouncementEditPage.tsx` : édition d'annonce.
			- `AnnouncementListPage.tsx` : liste des annonces.
			- `MyAnnouncementsPage.tsx` : annonces propres à l'utilisateur.
		- `auth/` : pages d'authentification (login, register) — dossier présent mais contenu variable.
		- `courses/` : pages liées aux cours (list, détail, gestion).
		- `dashboard/` : page tableau de bord principal pour l'utilisateur.
		- `internships/` : pages stages (list, detail, apply).
		- `profile/` : gestion du profil utilisateur.
		- `projects/` : pages liées aux projets étudiants.
		- `quizzes/` : pages listant et gérant les quiz.
		- `resources/` : ressources (documents, liens, uploads).

	- `services/` : couche d'accès réseau et helpers métier.
		- `api.ts` : instance Axios centrale (baseURL, intercepteurs pour JWT et gestion d'erreurs).
		- `agentService.ts`, `announcementService.ts`, `authService.ts`, `courseQuizService.ts`, `courseService.ts`, `internshipService.ts`, `projectService.ts`, `quizService.ts`, `ragService.ts`, `resourceService.ts`, `statsService.ts`, `userService.ts` : services pour appels API spécifiques à chaque domaine.

	- `types/` : définitions TypeScript des types et interfaces utilisées.
		- `announcement.ts`, `internship.ts`, `project.ts`, `quiz.ts`, `resource.ts`, `index.ts` : modèles de données partagés.

Notes rapides :
- La configuration API est centralisée dans `src/services/api.ts` ; pour le développement local, changez `baseURL` ou adaptez le code pour utiliser `process.env.REACT_APP_API_BASE_URL`.
- Les pages et composants suivent une séparation par fonctionnalité (feature folders) : c'est plus simple d'ajouter/modifier une fonctionnalité sans toucher le reste(tres important pour la scalabilité de notre projet).

<h2 style="color:#0d47a1;">Note importante</h2>
---

Pour ne pas vous embrouiller dans la lecture, vous pouvez tout de même consulter au fur et à mesure le projet pour mieux comprendre de quoi il s'agit.  
👇 [Consulter le dépôt GitHub de la partie frontend](https://github.com/hinimdoumorsia/smart-education-platform/tree/main/smarthub-frontend)

---

# <h1 style="color:#0d47a1;">Partie B : Installation pour que le Backend soit fonctionnel</h1>


Cette section explique, de la même manière que la partie frontend, comment préparer, construire et lancer uniquement la partie `smarthub-backend` du projet.

**Prérequis**
- **Java JDK** : version LTS recommandée — Java 21 (le projet définit `java.version=21` dans `pom.xml`).
- **Maven** : non obligatoire si vous utilisez le wrapper Maven fourni (`mvnw` / `mvnw.cmd`).
- **Docker** : optionnel, si vous préférez exécuter le backend dans un conteneur (`Dockerfile` présent).
- **Git** : pour cloner le dépôt si nécessaire.

**Fichiers importants**
- `smarthub-backend/pom.xml` : configuration Maven et dépendances (Spring Boot 3.3.4, JPA, Security, Web, WebFlux, Mail, MySQL/MariaDB, jjwt, Lombok, pdfbox, etc.).
- `smarthub-backend/mvnw` et `mvnw.cmd` : wrappers Maven (utilisez `./mvnw` sur Unix ou `mvnw.cmd` sous Windows).
- `smarthub-backend/Dockerfile` : définition d'image Docker pour le service backend.
- `smarthub-backend/src/main/resources/application.properties` : variables de configuration (DB, JWT, SMTP, GEMINI API, RAG, etc.).
- `smarthub-backend/src/main/java/...` : code source Java Spring Boot (controllers, services, models, repositories, config).
- `smarthub-backend/docs/` : documentation technique interne (controllers, services, DTOs, modèles).

**Variables d'environnement importantes**
Le backend lit de nombreuses propriétés depuis l'environnement via `application.properties`. Voici les principales variables à définir avant d'exécuter l'application :

- `PORT` : port HTTP (par défaut 8080)
- `SPRING_DATASOURCE_URL` : JDBC URL de la base de données (ex. `jdbc:mariadb://host:3306/dbname`)
- `SPRING_DATASOURCE_USERNAME` et `SPRING_DATASOURCE_PASSWORD`
- `SPRING_SECURITY_USER_NAME` et `SPRING_SECURITY_USER_PASSWORD` (user admin pour Spring Security si utilisé)
- `JWT_SECRET` : clé secrète pour signer les tokens JWT
- `SPRING_MAIL_USERNAME` et `SPRING_MAIL_PASSWORD` : identifiants SMTP (Gmail par défaut dans config)
- `GEMINI_API_KEY` : clé pour Gemini / Génération (si RAG/GPT intégré)

Il existe d'autres flags de configuration (RAG, embedding, quiz, agent, timeouts, CORS) dans `src/main/resources/application.properties` — adaptez-les selon votre environnement.

**Installation & build (local)**
Dans la racine du backend :

```bash
cd smarthub-backend
```

Sous Windows (PowerShell / cmd) :

```powershell
mvnw.cmd clean package -DskipTests
```

Sous Linux / macOS :

```bash
./mvnw clean package -DskipTests
```

La commande génère un JAR exécutable via le plugin Spring Boot dans `target/`.

**Lancer l'application (dev)**

- Exécuter via Maven (mode dev) :

```bash
./mvnw spring-boot:run
```

- Ou exécuter le JAR généré :

```bash
java -jar target/*.jar
```

**Exécuter avec Docker**

- Construire l'image Docker :

```bash
docker build -t smarthub-backend:local -f smarthub-backend/Dockerfile smarthub-backend
```

- Lancer le conteneur (exemple en liant les variables d'env) :

```bash
docker run -p 8080:8080 --env SPRING_DATASOURCE_URL="jdbc:mariadb://db:3306/smarthub" --env JWT_SECRET="votre_secret" smarthub-backend:local
```

**Tests**

```bash
./mvnw test
```

**Scripts utiles**
- `./mvnw spring-boot:run` : lance l'application en dev
- `./mvnw clean package` : compile et package l'application
- `./mvnw test` : exécute les tests

**Architecture du backend (fichiers & dossiers)**
Voici la structure et le rôle des éléments principaux présents dans `smarthub-backend` :

- `Dockerfile` : image et commandes de build pour containeriser le backend.
- `mvnw`, `mvnw.cmd` : wrappers Maven pour construire sans installer Maven globalement.
- `pom.xml` : dépendances et plugins Maven (Spring Boot, JPA, Security, Web, WebFlux, Mail, MySQL/MariaDB, jjwt, lombok, pdfbox).
- `README.md` : documentation spécifique au backend.
- `QuizService.backup` : fichier de sauvegarde lié au service quiz (présent dans le repo).
- `docs/` : documentation technique pour controllers, services, DTOs, modèles, repositories. Utile pour comprendre les API exposées et la conception interne.

- `src/main/java/com/...` : code Java source organisé par packages :
	- `config/` : classes de configuration (ex. `JwtUtil`, `SecurityConfig`)
	- `controller/` : contrôleurs REST exposant les endpoints (ex. `UserController`)
	- `model/` : entités JPA et modèles (ex. `user.User`)
	- `repository/` : interfaces JPA repositories (ex. `UserRepository`)
	- `service/` : services métier, agents, RAG & embeddings, orchestrateurs de quiz, etc.
	- `exceptions/` : gestion des exceptions et handlers (si présents)

- `src/main/resources/application.properties` : configuration centrale (DB, JWT, mail, gemini, rag, quiz, cors, logging, etc.).
- `src/main/resources/static` et dossier `uploads/` (si utilisés) : fichiers statiques et fichiers uploadés configurés dans `application.properties`.

**Notes pratiques & dépannage**
- Erreurs de connexion BD : vérifier `SPRING_DATASOURCE_URL`, les règles de réseau (ping/db reachable) et les credentials.
- Problèmes JWT : assurez-vous que `JWT_SECRET` est défini et identique entre services si partagé.
- Ports en conflit : `server.port` lisible via `PORT` env var.
- Fichiers upload impossibles : vérifier `file.upload-dir` et permissions sur le dossier `./uploads`.
- CORS : mettre à jour `cors.allowed-origins` dans `application.properties` si le frontend est sur une autre origine.


<h2 style="color:#0d47a1;">Note importante</h2>

Nous n'avons pas défini explicitement de valeurs pour les différentes variables d'environnement dans le dépôt. La sécurité est critique : pour de bonnes pratiques, définissez toutes les variables nécessaires (ci‑dessous) dans votre environnement de déploiement ou un fichier local sécurisé, et ne commitez jamais de secrets.

Variables d'environnement à définir (noms exacts utilisés dans `application.properties`) :
- `PORT` — port HTTP (ex. `8080`)
- `SPRING_DATASOURCE_URL` — JDBC URL (ex. `jdbc:mariadb://host:3306/smarthub`)
- `SPRING_DATASOURCE_USERNAME` — utilisateur DB
- `SPRING_DATASOURCE_PASSWORD` — mot de passe DB
- `SPRING_SECURITY_USER_NAME` — user admin (optionnel)
- `SPRING_SECURITY_USER_PASSWORD` — mot de passe admin (optionnel)
- `JWT_SECRET` — clé secrète pour signer les JWT (forte, longue et stockée hors dépôt)
- `SPRING_MAIL_USERNAME` — SMTP username
- `SPRING_MAIL_PASSWORD` — SMTP password
- `GEMINI_API_KEY` — clé API pour Gemini / génération
- `SPRING_DATASOURCE_DRIVER` (optionnel selon setup)

Recommandations de sécurité et bonnes pratiques :
- Stockez les secrets dans un gestionnaire de secrets (Vault, Azure Key Vault, AWS Secrets Manager, etc.) ou utilisez des variables d'environnement gérées par votre plateforme CI/CD.
- Pour le développement local, créez un fichier `.env` non committé et un fichier `.env.example` committé listant les noms de variables et des valeurs d'exemple non sensibles.
- Dans `application.properties`, référez toujours les valeurs via `${VARIABLE_NAME}` (déjà en place pour la plupart des paramètres) afin que l'application lise directement les variables d'environnement.
- Ne mettez jamais de valeurs réelles (mot de passe, clés API) dans les fichiers du dépôt.

Exemple minimal de `.env.example` (NE PAS y mettre de vraies valeurs) :

```
PORT=8080
SPRING_DATASOURCE_URL=jdbc:mariadb://localhost:3306/smarthub
SPRING_DATASOURCE_USERNAME=smarthub_user
SPRING_DATASOURCE_PASSWORD=changeme
JWT_SECRET=change_this_to_a_strong_secret
SPRING_MAIL_USERNAME=your@mail.example
SPRING_MAIL_PASSWORD=changeme
GEMINI_API_KEY=your_gemini_key_here
```
<h2 style="color:#0d47a1;">**Félicitations !**</h2>
 Vous avez terminé l'installation et la configuration de votre environnement. Vous êtes maintenant prêt à commencer à développer et à contribuer au projet. Bonne chance !

D'abord, cher·e lecteur·rice, cher·e développeur·se — toutes nos félicitations si vous avez réussi l'installation ! Encore bravo. Nous allons maintenant passer à une étape importante : la découverte de notre projet — l'architecture et le fonctionnement des systèmes pour comprendre comment les différents composants ont été conçus.

Pour consulter l'architecture complète, cliquez ici : [docs/architecture.md](docs/architecture.md).

Vous pouvez aussi utiliser les raccourcis visuels :
- Cherchez en bas de la page (lien architecture en bleu ) « 👇 »  pointant vers le bas pour accéder au lien vers l'architecture.
- Ou regardez en haut de la page (lien en bleu  architecture)  « 👆 » (main/poing) pointant vers le haut pour revenir au sommaire.

Bonne lecture et exploration !