# <span style="color:#0d47a1;">Déploiement de l’Application SmartHub</span>

Le déploiement est une étape cruciale pour mettre en ligne notre application. Il implique **le frontend**, **le backend** et **la base de données**, chacun sur des plateformes adaptées pour garantir performance, sécurité et scalabilité.

---

## <span style="color:#1565c0;">1. Déploiement du Frontend</span>

Le frontend de SmartHub, écrit en **React + TypeScript**, a été déployé sur **Vercel**.  

### Étapes principales :

1. **Connexion au dépôt GitHub :** Il suffit de lier le projet au dépôt officiel de votre application. Vercel détecte automatiquement le framework (React/TypeScript) et configure la build.  
2. **Configuration des variables d’environnement (si nécessaire) :** Par exemple pour les URLs du backend ou les clés publiques accessibles côté client. Vercel offre un panneau sécurisé pour gérer ces variables.  
3. **Build et déploiement automatique :** Après chaque push sur le dépôt GitHub, Vercel déclenche automatiquement la build et le déploiement. L’URL publique est générée et votre frontend est accessible immédiatement.

 **Avantages :** Déploiement rapide, fiable, support natif pour React/TypeScript et prévisualisations automatiques pour chaque pull request.

---

## <span style="color:#1565c0;">2. Déploiement du Backend</span>

Le backend, écrit en **Java avec Spring Boot**, est le cœur de notre application. Il a été déployé sur **Render**.

### Étapes principales :

1. **Préparation de l’application :** Tous les fichiers `application.properties` ou `application.yml` doivent être sécurisés. Les valeurs sensibles (clés API, mots de passe, URLs de base de données, tokens LLM) doivent être placées dans les **variables d’environnement de Render** et non en dur dans le code.  

2. **Dockerisation du backend :** Créez un `Dockerfile` pour packager votre application Spring Boot :  

```dockerfile
FROM openjdk:17-jdk-alpine
VOLUME /tmp
COPY target/smarthub-backend.jar smarthub-backend.jar
ENTRYPOINT ["java","-jar","/smarthub-backend.jar"]


<span style="color:#1565c0;">Déploiement sur Render</span>

Créez un nouveau service Web sur Render et choisissez le déploiement via Docker.

Configurez les variables d’environnement essentielles (URL base de données, clés API, tokens LLM…).

Déclenchez le build et le déploiement.

<span style="color:#1565c0;">Sécurité et performance</span>

Toutes les clés et secrets doivent être appelés via System.getenv("NOM_VARIABLE").

Les paramètres comme le temps de réponse, le pool de connexions, et le nombre de threads sont configurés dans application.properties pour optimiser la performance.

 Avantages : Backend sécurisé, scalable, performant et intégré au frontend et à la base de données.

<span style="color:#1565c0;">3. Base de Données</span>

La base de données est essentielle pour le fonctionnement de SmartHub.

PostgreSQL hébergé gratuitement sur Railway.

Railway offre : création automatique, URL et credentials sécurisés, sauvegardes automatiques et accès SQL direct.

Étapes :

Créez un projet sur Railway.

Configurez PostgreSQL et récupérez l’URL, le nom d’utilisateur et le mot de passe.

Ajoutez ces valeurs comme variables d’environnement dans Render pour le backend.

Testez la connexion depuis l’application Spring Boot.

 Avantages : Base de données sécurisée, fiable et facile à relier au backend.

## <span style="color:#1565c0;">4. Architecture Finale du Déploiement</span>

```text
Frontend (React + TypeScript) ---> Vercel
        │
        ▼
Backend (Spring Boot) ---> Render
        │
        ▼
Base de données (PostgreSQL) ---> Railway



Le frontend communique avec le backend via API.

Le backend accède à la base de données pour stocker et récupérer les informations.

Toutes les clés sensibles sont sécurisées dans les variables d’environnement.

<span style="color:#1565c0;">5. Avantages du Déploiement</span>

Scalable : Chaque composant peut évoluer indépendamment.

Maintenable : Architecture claire et modulable.

Performance optimisée : Paramètres de Spring Boot et Vercel ajustés pour des temps de réponse rapides.

Sécurité : Secrets et clés protégés via variables d’environnement.

Automatisation : Déploiement continu via GitHub, Vercel et Render.

<span style="color:#0d47a1;">✨ Conclusion Finale</span>

Le déploiement de SmartHub démontre la solidité et la modernité de notre architecture :

Un frontend performant et moderne sur Vercel.

Un backend sécurisé et scalable sur Render.

Une base de données fiable et automatique sur Railway.

Votre application est maintenant entièrement opérationnelle, prête à évoluer, à être testée et à être améliorée.

Félicitations ! Vous venez de clôturer le projet SmartHub avec succès. 🎓

Vous pouvez désormais explorer, tester et ajouter de nouvelles fonctionnalités :

Création de modèles IA pour recommandations de cours.

Amélioration du moteur de recherche intelligent via NLP.

Intégration d’un chatbot interactif pour assister les étudiants.

Le projet SmartHub est maintenant prêt pour une exploitation complète et des évolutions futures.

Bonne continuation dans votre quête de savoir et dans le développement de solutions innovantes ! 



## <span style="color:#0d47a1;"> Technologies Utilisées</span>

<div align="center">
<img src="https://img.shields.io/badge/Spring_Boot-2.7.14-6DB33F?style=for-the-badge&logo=spring&logoColor=white" />
<img src="https://img.shields.io/badge/JPA-2.2-FF6F61?style=for-the-badge&logo=java&logoColor=white" />
<img src="https://img.shields.io/badge/Docker-24-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
<img src="https://img.shields.io/badge/Gemini-Google_IA-4285F4?style=for-the-badge&logo=google&logoColor=white" />
<img src="https://img.shields.io/badge/ChatGPT-OpenAI-00BFA5?style=for-the-badge&logo=openai&logoColor=white" />
<img src="https://img.shields.io/badge/DeepSeek-AI-F7DF1E?style=for-the-badge&logo=python&logoColor=black" />
<img src="https://img.shields.io/badge/Google_IA_Studio-4285F4?style=for-the-badge&logo=google&logoColor=white" />
<img src="https://img.shields.io/badge/Botpress-6C63FF?style=for-the-badge&logo=botpress&logoColor=white" />
<img src="https://img.shields.io/badge/Chatbot-AI-FF6F61?style=for-the-badge&logo=ai&logoColor=white" />
<img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" />
<img src="https://img.shields.io/badge/VSCode-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white" />
<img src="https://img.shields.io/badge/Render-FF3B30?style=for-the-badge&logo=render&logoColor=white" />
<img src="https://img.shields.io/badge/Railway-000000?style=for-the-badge&logo=railway&logoColor=white" />
<img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
<img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
<img src="https://img.shields.io/badge/XAMPP-FB502B?style=for-the-badge&logo=xampp&logoColor=white" />
<img src="https://img.shields.io/badge/WAMP-F97F1F?style=for-the-badge&logo=wamp&logoColor=white" />
<img src="https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white" />
<img src="https://img.shields.io/badge/Ollama_Interface-6C63FF?style=for-the-badge&logo=python&logoColor=white" />
<img src="https://img.shields.io/badge/OpenAI-00BFA5?style=for-the-badge&logo=openai&logoColor=white" />
</div>


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
