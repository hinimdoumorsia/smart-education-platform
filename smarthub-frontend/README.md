# Détail du Projet SmartHub Frontend

## Introduction
SmartHub Frontend est une application web développée en React avec TypeScript. Il s'agit d'une plateforme éducative complète qui permet aux utilisateurs (étudiants, enseignants, administrateurs) de gérer des cours, des quiz, des projets, des stages, des annonces et des ressources. L'application utilise des services backend pour la gestion des données et l'authentification.

## Structure des Dossiers

### Dossier Racine
- **package.json** : Fichier de configuration npm contenant les dépendances et scripts du projet.
- **README.md** : Documentation générale du projet.
- **tsconfig.json** : Configuration TypeScript pour la compilation.

### Dossier `public/`
Ce dossier contient les fichiers statiques servis directement par le serveur web.
- **index.html** : Page HTML principale de l'application.
- **manifest.json** : Fichier de manifeste pour les applications web progressives (PWA).
- **robots.txt** : Fichier pour les moteurs de recherche.

### Dossier `src/`
Dossier principal contenant tout le code source de l'application React.

#### Sous-dossier `components/`
Composants réutilisables de l'interface utilisateur.
- **AdaptiveQuizModal.tsx** : Modal pour les quiz adaptatifs.
- **CourseQuizModal.tsx** : Modal pour les quiz de cours.
- **Navbar.tsx** : Barre de navigation principale.
- **PrivateRoute.tsx** : Composant de route protégée pour l'authentification.
- **QuizResultsModal.tsx** : Modal d'affichage des résultats de quiz.
- **StudentManagement.tsx** : Composant de gestion des étudiants.
- **common/LoadingSpinner.tsx** : Spinner de chargement réutilisable.

#### Sous-dossier `context/`
Contextes React pour la gestion d'état global.
- **AuthContext.tsx** : Contexte d'authentification pour gérer l'état de connexion des utilisateurs.

#### Sous-dossier `pages/`
Pages principales de l'application, organisées par fonctionnalités.

##### Sous-dossier `admin/`
Pages d'administration.
- **AdminDashboardPage.tsx** : Tableau de bord administrateur avec statistiques générales.
- **UserManagementPage.tsx** : Page de gestion des utilisateurs (création, modification, suppression).

##### Sous-dossier `announcements/`
Pages liées aux annonces.
- **AnnouncementCreatePage.tsx** : Page de création d'une nouvelle annonce.
- **AnnouncementDetailPage.tsx** : Page de détail d'une annonce spécifique.
- **AnnouncementEditPage.tsx** : Page d'édition d'une annonce existante.
- **AnnouncementListPage.tsx** : Liste de toutes les annonces.
- **MyAnnouncementsPage.tsx** : Liste des annonces créées par l'utilisateur connecté.

##### Sous-dossier `auth/`
Pages d'authentification.
- **LoginPage.tsx** : Page de connexion.
- **RegisterPage.tsx** : Page d'inscription.
- **RegisterRoleSelect.tsx** : Page de sélection du rôle lors de l'inscription.
- **ResetPasswordPage.tsx** : Page de réinitialisation du mot de passe.

##### Sous-dossier `courses/`
Pages liées aux cours.
- **CourseCreatePage.tsx** : Page de création d'un nouveau cours.
- **CourseDetailPage.tsx** : Page de détail d'un cours spécifique.
- **CourseEditPage.tsx** : Page d'édition d'un cours existant.
- **CourseListPage.tsx** : Liste de tous les cours.
- **CoursesPage.tsx** : Page principale des cours (peut-être une vue d'ensemble).
- **MyCoursesPage.tsx** : Liste des cours de l'utilisateur connecté.

##### Sous-dossier `dashboard/`
Page de tableau de bord.
- **DashboardPage.tsx** : Page principale du tableau de bord utilisateur.
- **DashboardPage.css** : Styles spécifiques au tableau de bord.

##### Sous-dossier `internships/`
Pages liées aux stages.
- **InternshipCreatePage.tsx** : Page de création d'un nouveau stage.
- **InternshipDetailPage.tsx** : Page de détail d'un stage spécifique.
- **InternshipEditPage.tsx** : Page d'édition d'un stage existant.
- **InternshipListPage.tsx** : Liste de tous les stages.
- **MyInternshipsPage.tsx** : Liste des stages de l'utilisateur connecté.

##### Sous-dossier `profile/`
Page de profil.
- **ProfilePage.tsx** : Page de gestion du profil utilisateur.

##### Sous-dossier `projects/`
Pages liées aux projets.
- **MyProjectsPage.tsx** : Liste des projets de l'utilisateur connecté.
- **ProjectCreatePage.tsx** : Page de création d'un nouveau projet.
- **ProjectDetailPage.tsx** : Page de détail d'un projet spécifique.
- **ProjectEditPage.tsx** : Page d'édition d'un projet existant.
- **ProjectsPage.tsx** : Page principale des projets.

##### Sous-dossier `quizzes/`
Pages liées aux quiz.
- **MyQuizAttemptsPage.tsx** : Liste des tentatives de quiz de l'utilisateur.
- **QuizAttemptPage.tsx** : Page de passage d'un quiz.
- **QuizCreatePage.tsx** : Page de création d'un nouveau quiz.
- **QuizDetailPage.tsx** : Page de détail d'un quiz spécifique.
- **QuizEditPage.tsx** : Page d'édition d'un quiz existant.
- **QuizGenerationPage.tsx** : Page de génération automatique de quiz.
- **QuizListPage.tsx** : Liste de tous les quiz.
- **QuizResultsPage.tsx** : Page d'affichage des résultats de quiz.

##### Sous-dossier `resources/`
Pages liées aux ressources.
- **MyResourcesPage.tsx** : Liste des ressources de l'utilisateur connecté.
- **ResourceCreatePage.tsx** : Page de création d'une nouvelle ressource.
- **ResourceDetailPage.tsx** : Page de détail d'une ressource spécifique.
- **ResourceEditPage.tsx** : Page d'édition d'une ressource existante.
- **ResourceListPage.tsx** : Liste de toutes les ressources.

#### Sous-dossier `services/`
Services pour les appels API et la logique métier.
- **agentService.ts** : Service pour les agents (IA ?).
- **announcementService.ts** : Service pour les annonces.
- **api.ts** : Configuration de base de l'API.
- **authService.ts** : Service d'authentification.
- **courseQuizService.ts** : Service pour les quiz de cours.
- **courseService.ts** : Service pour les cours.
- **internshipService.ts** : Service pour les stages.
- **projectService.ts** : Service pour les projets.
- **quizService.ts** : Service pour les quiz.
- **ragService.ts** : Service RAG (Retrieval-Augmented Generation).
- **resourceService.ts** : Service pour les ressources.
- **statsService.ts** : Service pour les statistiques.
- **userService.ts** : Service pour la gestion des utilisateurs.

#### Sous-dossier `types/`
Définitions de types TypeScript.
- **announcement.ts** : Types pour les annonces.
- **index.ts** : Fichier d'index pour exporter tous les types.
- **internship.ts** : Types pour les stages.
- **project.ts** : Types pour les projets.
- **quiz.ts** : Types pour les quiz.
- **resource.ts** : Types pour les ressources.

#### Sous-dossier `utils/`
Utilitaires et fonctions helper (dossier vide dans la structure fournie).

### Fichiers à la Racine de `src/`
- **App.css** : Styles globaux de l'application.
- **App.test.tsx** : Tests pour le composant App.
- **App.tsx** : Composant principal de l'application.
- **index.css** : Styles de base.
- **index.tsx** : Point d'entrée de l'application React.
- **react-app-env.d.ts** : Déclarations TypeScript pour Create React App.
- **reportWebVitals.ts** : Rapport des métriques de performance.
- **setupTests.ts** : Configuration des tests.

## Fonctionnalités Principales du Projet
SmartHub est une plateforme éducative complète qui offre :
- **Gestion des utilisateurs** : Inscription, connexion, gestion des rôles (étudiant, enseignant, admin).
- **Cours** : Création, édition, consultation de cours.
- **Quiz** : Création de quiz adaptatifs, passage de quiz, résultats.
- **Projets** : Gestion de projets étudiants.
- **Stages** : Publication et gestion d'offres de stage.
- **Annonces** : Système d'annonces pour la communication.
- **Ressources** : Partage et gestion de ressources pédagogiques.
- **Tableau de bord** : Vue d'ensemble personnalisée pour chaque utilisateur.
- **Profil** : Gestion du profil utilisateur.

L'application utilise une architecture moderne avec React, TypeScript, et des services pour communiquer avec un backend API.
# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).



